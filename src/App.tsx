/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  EmergencyVehicle, 
  MotoristVehicle, 
  TrafficSignal, 
  CorridorAlertLog 
} from './types/emergency';
import { Language, translations } from './locales/translations';
import { 
  INITIAL_EMERGENCY_VEHICLE, 
  INITIAL_MOTORISTS, 
  INITIAL_TRAFFIC_SIGNALS, 
  INITIAL_LOGS,
  ROAD_LENGTH,
  CORRIDOR_Y,
  LANE_HEIGHT,
  getLaneY
} from './services/corridorSimulation';
import { audioAlertService } from './services/audioAlertService';
import { CorridorMap } from './components/CorridorMap';
import { MotoristCabinView } from './components/MotoristCabinView';
import { AmbulanceCockpit } from './components/AmbulanceCockpit';
import { TrafficCommandView } from './components/TrafficCommandView';
import { RescueAlleyModal } from './components/RescueAlleyModal';
import { 
  Siren, 
  Navigation, 
  Radio, 
  ShieldAlert, 
  Building2, 
  Columns, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Sparkles,
  CheckCircle2,
  Languages
} from 'lucide-react';

type ActiveTab = 'simulator' | 'split' | 'motorist' | 'ambulance' | 'command';

export default function App() {
  const [lang, setLang] = useState<Language>('gu'); // Default to Gujarati as requested
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');
  const [ambulance, setAmbulance] = useState<EmergencyVehicle>(INITIAL_EMERGENCY_VEHICLE);
  const [motorists, setMotorists] = useState<MotoristVehicle[]>(INITIAL_MOTORISTS);
  const [signals, setSignals] = useState<TrafficSignal[]>(INITIAL_TRAFFIC_SIGNALS);
  const [logs, setLogs] = useState<CorridorAlertLog[]>(INITIAL_LOGS);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>('car-user');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = translations[lang];

  const lastTickRef = useRef<number>(Date.now());
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Main Simulation Tick Loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = ((now - lastTickRef.current) / 1000) * simSpeed;
      lastTickRef.current = now;

      // 1. Advance Ambulance
      setAmbulance((prevAmb) => {
        // Speed in px per second (e.g. 78 km/h ~ 55px/s)
        const moveDist = (prevAmb.speedKmh * 0.7) * deltaSec;
        let newX = prevAmb.position.x + moveDist;
        let newProgress = (newX / (ROAD_LENGTH - 100)) * 100;

        // Loop back when reaching hospital
        if (newX >= ROAD_LENGTH - 120) {
          newX = 80;
          newProgress = 5;
        }

        return {
          ...prevAmb,
          position: { ...prevAmb.position, x: newX },
          targetProgress: Math.min(100, newProgress),
          timeToDestinationMin: Math.max(0.2, (ROAD_LENGTH - newX) / 450),
        };
      });

      // 2. Advance Motorists & Calculate Proximity to Ambulance
      setMotorists((prevMotorists) => {
        return prevMotorists.map((car) => {
          // Civilian cruising speed
          const carMoveDist = (car.speedKmh * 0.45) * deltaSec;
          let newCarX = car.position.x + carMoveDist;
          if (newCarX > ROAD_LENGTH - 50) {
            newCarX = 120 + Math.random() * 200;
          }

          // Distance calculation along corridor (ambulance moving East)
          const distMeters = newCarX - ambulance.position.x;
          const relativeSpeedKmh = Math.max(10, ambulance.speedKmh - car.speedKmh);
          const timeToIntercept = distMeters > 0 ? (distMeters / (relativeSpeedKmh * (1000 / 3600))) : 0;

          // Determine alert level based on proximity and whether ambulance is behind
          let alertLevel: 'safe' | 'caution' | 'critical_yield' = 'safe';
          let status = car.status;
          let currentLane = car.currentLane;
          let hasYielded = car.hasYielded;

          if (distMeters > 0 && distMeters <= ambulance.alertRadiusMeters) {
            if (distMeters <= 420) {
              alertLevel = 'critical_yield';
              if (!hasYielded && !car.isUserVehicle) {
                // Non-user vehicles automatically start clearing when critically alerted
                status = 'clearing';
                currentLane = 'right';
                hasYielded = true;
              } else if (!hasYielded) {
                status = 'alerted';
              }
            } else {
              alertLevel = 'caution';
              if (!hasYielded) status = 'alerted';
            }
          } else if (distMeters <= 0) {
            // Ambulance has passed this vehicle
            alertLevel = 'safe';
            status = 'cleared';
          }

          // Calculate visual Y coordinate with smooth lane interpolation
          const targetY = getLaneY(currentLane);
          const currentY = car.position.y;
          const newY = currentY + (targetY - currentY) * Math.min(1, deltaSec * 3);

          return {
            ...car,
            position: { x: newCarX, y: newY },
            distanceToAmbulanceMeters: Math.max(0, distMeters),
            timeToInterceptSec: Math.max(0, timeToIntercept),
            alertLevel,
            status,
            currentLane,
            hasYielded,
          };
        });
      });

      // 3. Update Traffic Light Preemption (Green Wave ahead of ambulance)
      setSignals((prevSignals) => {
        return prevSignals.map((sig) => {
          const distToAmb = sig.position.x - ambulance.position.x;
          // Preemption triggers if ambulance is between 50m and 450m approaching
          const shouldPreempt = distToAmb > 0 && distToAmb <= 450;
          if (shouldPreempt) {
            return {
              ...sig,
              state: 'preempted_green',
              preemptionActive: true,
              countdownSec: 25,
            };
          } else if (distToAmb <= 0 && sig.state === 'preempted_green') {
            // Reset to normal cycle after ambulance passes
            return {
              ...sig,
              state: 'green',
              preemptionActive: false,
              countdownSec: 15,
            };
          }
          return sig;
        });
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, simSpeed, ambulance.position.x, ambulance.speedKmh, ambulance.alertRadiusMeters]);

  // User Yield Action (User clicking "I Have Yielded" or pressing key)
  const handleUserYield = () => {
    setMotorists((prev) =>
      prev.map((car) => {
        if (car.isUserVehicle) {
          return {
            ...car,
            currentLane: 'right',
            targetLane: 'right',
            hasYielded: true,
            status: 'cleared',
          };
        }
        return car;
      })
    );

    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    const userCar = motorists.find(m => m.isUserVehicle);
    const newLog: CorridorAlertLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      type: 'yield_confirmed',
      unit: userCar ? userCar.licensePlate : 'YOU',
      message: 'Motorist confirmed lane vacated to Right Shoulder. Corridor open.',
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
    showToast('Lane Yield Confirmed: You moved safely to the right shoulder.');
  };

  const handleReportObstruction = () => {
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    const newLog: CorridorAlertLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      type: 'broadcast',
      unit: 'USER-CAR',
      message: 'Motorist reported debris / slow vehicle at 5th Ave crossing.',
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
    showToast('Hazard reported to Paramedic dispatch.');
  };

  const handleToggleSiren = () => {
    const nextState = !ambulance.sirenActive;
    setAmbulance((prev) => ({ ...prev, sirenActive: nextState }));
    if (!nextState) {
      audioAlertService.stopSiren();
      showToast('Siren & V2X broadcast deactivated.');
    } else {
      showToast('Code 3 Siren & V2X Corridor broadcast active.');
    }
  };

  const handleChangeSirenMode = (mode: 'yelp' | 'wail' | 'hi_lo' | 'silent_v2x') => {
    setAmbulance((prev) => ({ ...prev, sirenMode: mode }));
    showToast(`Beacon mode changed to: ${mode}`);
  };

  const handleChangeRadius = (radiusMeters: number) => {
    setAmbulance((prev) => ({ ...prev, alertRadiusMeters: radiusMeters }));
    showToast(`Pre-alert geofence radius set to ${radiusMeters}m`);
  };

  const handleSendCustomBroadcast = (msg: string) => {
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    const newLog: CorridorAlertLog = {
      id: `log-${Date.now()}`,
      timestamp: now,
      type: 'broadcast',
      unit: ambulance.unitCode,
      message: `Emergency Voice Broadcast: "${msg}"`,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
    showToast('Broadcast transmitted to all connected motorists.');
  };

  const handleForcePreemption = (signalId: string) => {
    setSignals((prev) =>
      prev.map((sig) => (sig.id === signalId ? { ...sig, state: 'preempted_green', preemptionActive: true } : sig))
    );
    showToast('Traffic signal manually forced to Green Wave.');
  };

  const handleTriggerScenario = (scenario: 'rush_hour' | 'highway_express' | 'dense_intersection') => {
    if (scenario === 'rush_hour') {
      setAmbulance((prev) => ({ ...prev, speedKmh: 68, alertRadiusMeters: 750 }));
      setMotorists((prev) =>
        prev.map((car, idx) => ({
          ...car,
          hasYielded: false,
          currentLane: idx % 2 === 0 ? 'center' : 'left',
          speedKmh: 35 + idx * 3,
        }))
      );
      showToast('Rush Hour Scenario loaded: high density traffic in center corridor.');
    } else if (scenario === 'highway_express') {
      setAmbulance((prev) => ({ ...prev, speedKmh: 95, alertRadiusMeters: 1200 }));
      showToast('High-Speed Arterial Express loaded: 95 km/h with 1,200m radius.');
    } else if (scenario === 'dense_intersection') {
      setSignals((prev) => prev.map((s) => ({ ...s, state: 'preempted_green', preemptionActive: true })));
      showToast('Multi-Signal Preemption Grid loaded: all signals forced green.');
    }
  };

  const handleResetSimulation = () => {
    setAmbulance(INITIAL_EMERGENCY_VEHICLE);
    setMotorists(INITIAL_MOTORISTS);
    setSignals(INITIAL_TRAFFIC_SIGNALS);
    showToast('Simulation reset to initial state.');
  };

  const handleToggleGlobalAudio = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    audioAlertService.setMuted(next);
  };

  const userVehicle = motorists.find((m) => m.isUserVehicle) || motorists[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-ZONE TOP BAR CONTRACT */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-3.5 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md">
        {/* Zone 1: Single text element wordmark in display face */}
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
          <a href="/" className="text-lg font-black tracking-tight text-white font-display">
            {t.appName}
          </a>
        </div>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap font-medium cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-rose-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tabs.simulator}
          </button>
          <button
            onClick={() => setActiveTab('split')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap font-medium cursor-pointer ${
              activeTab === 'split'
                ? 'bg-rose-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tabs.split}
          </button>
          <button
            onClick={() => setActiveTab('motorist')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap font-medium cursor-pointer ${
              activeTab === 'motorist'
                ? 'bg-rose-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tabs.motorist}
          </button>
          <button
            onClick={() => setActiveTab('ambulance')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap font-medium cursor-pointer ${
              activeTab === 'ambulance'
                ? 'bg-rose-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tabs.ambulance}
          </button>
          <button
            onClick={() => setActiveTab('command')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap font-medium cursor-pointer ${
              activeTab === 'command'
                ? 'bg-rose-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tabs.command}
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Language Toggle + Rules + Mute) */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => {
                setLang('gu');
                showToast('ભાષા બદલાઈ: ગુજરાતી');
              }}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                lang === 'gu' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ગુજરાતી
            </button>
            <button
              onClick={() => {
                setLang('en');
                showToast('Language changed: English');
              }}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                lang === 'en' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>

          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-medium border border-slate-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">{t.actions.corridorRules}</span>
          </button>
          <button
            onClick={handleToggleGlobalAudio}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              isAudioMuted
                ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title={isAudioMuted ? t.actions.unmute : t.actions.mute}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Hero Narrative Strip */}
      <div className="relative border-b border-slate-800/80 bg-slate-900/40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-rose-400 font-mono mb-1.5">
              <span>{lang === 'gu' ? 'V2X ઇમરજન્સી પ્રી-એલર્ટ સિસ્ટમ' : 'V2X EMERGENCY PRE-ALERT SYSTEM'}</span>
              <span aria-hidden="true">·</span>
              <span>{lang === 'gu' ? 'ગોલ્ડન અવર બચાવો' : 'SAVING THE GOLDEN HOUR'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display text-balance">
              {t.tagline}
            </h1>
            <p className="mt-1 text-sm text-slate-400 leading-relaxed">
              {t.subTagline}
            </p>
          </div>

          {/* Quick Stats Banner */}
          <div className="flex items-center gap-6 p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
            <div>
              <div className="text-[10px] uppercase font-mono text-slate-400">{t.metrics.preAlertRange}</div>
              <div className="text-xl font-black font-mono text-rose-400 tabular-nums">
                {ambulance.alertRadiusMeters} {t.metrics.meters}
              </div>
            </div>
            <div className="border-l border-slate-800 pl-4">
              <div className="text-[10px] uppercase font-mono text-slate-400">{t.metrics.avgSavedTime}</div>
              <div className="text-xl font-black font-mono text-emerald-400 tabular-nums">
                -4.5 {lang === 'gu' ? 'મિનિટ' : 'mins'}
              </div>
            </div>
            <div className="border-l border-slate-800 pl-4">
              <div className="text-[10px] uppercase font-mono text-slate-400">{t.metrics.greenWave}</div>
              <div className="text-xl font-black font-mono text-sky-400 tabular-nums">
                {t.metrics.active}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main App Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* TAB 1: LIVE SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <CorridorMap
              ambulance={ambulance}
              motorists={motorists}
              signals={signals}
              isPlaying={isPlaying}
              simSpeed={simSpeed}
              selectedVehicleId={selectedVehicleId}
              lang={lang}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onReset={handleResetSimulation}
              onChangeSpeed={(spd) => setSimSpeed(spd)}
              onSelectVehicle={(id) => {
                setSelectedVehicleId(id);
                if (id === 'car-user') {
                  showToast(lang === 'gu' ? "તમારું વાહન પસંદ કરેલ છે (લેન ૨)." : "Selected Your Vehicle in Lane 2.");
                }
              }}
              onUserYield={handleUserYield}
            />

            {/* In-Line Driver HUD Preview Below Map */}
            <div className="border-t border-slate-800/80 pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 tracking-wider">
                  {lang === 'gu' ? 'ડ્રાઈવર ઇન-કેબિન ટેલિમેટ્રી HUD (વાહનચાલક દૃષ્ટિકોણ)' : 'MOTORIST IN-CABIN TELEMETRY HUD (CIVILIAN PERSPECTIVE)'}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {userVehicle.model} ({userVehicle.licensePlate})
                </span>
              </div>
              <MotoristCabinView
                userCar={userVehicle}
                ambulance={ambulance}
                lang={lang}
                onYield={handleUserYield}
                onReportObstruction={handleReportObstruction}
              />
            </div>
          </div>
        )}

        {/* TAB 2: DUAL IN-CABIN / PARAMEDIC (SPLIT VIEW) */}
        {activeTab === 'split' && (
          <div className="space-y-6">
            <CorridorMap
              ambulance={ambulance}
              motorists={motorists}
              signals={signals}
              isPlaying={isPlaying}
              simSpeed={simSpeed}
              selectedVehicleId={selectedVehicleId}
              lang={lang}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onReset={handleResetSimulation}
              onChangeSpeed={(spd) => setSimSpeed(spd)}
              onSelectVehicle={(id) => setSelectedVehicleId(id)}
              onUserYield={handleUserYield}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Driver Perspective */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    {lang === 'gu' ? 'વાહનચાલક ડ્રાઇવિંગ HUD (તમારી કાર)' : 'Motorist Driving HUD (Your Car)'}
                  </span>
                </div>
                <MotoristCabinView
                  userCar={userVehicle}
                  ambulance={ambulance}
                  lang={lang}
                  onYield={handleUserYield}
                  onReportObstruction={handleReportObstruction}
                />
              </div>

              {/* Paramedic Perspective */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    {lang === 'gu' ? `એમ્બ્યુલન્સ કંટ્રોલ (${ambulance.unitCode})` : `Ambulance Cockpit (${ambulance.unitCode})`}
                  </span>
                </div>
                <AmbulanceCockpit
                  ambulance={ambulance}
                  motorists={motorists}
                  signals={signals}
                  logs={logs}
                  onToggleSiren={handleToggleSiren}
                  onChangeSirenMode={handleChangeSirenMode}
                  onChangeRadius={handleChangeRadius}
                  onSendCustomBroadcast={handleSendCustomBroadcast}
                  onForcePreemption={handleForcePreemption}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MOTORIST DRIVING HUD ONLY */}
        {activeTab === 'motorist' && (
          <div className="space-y-6">
            <MotoristCabinView
              userCar={userVehicle}
              ambulance={ambulance}
              lang={lang}
              onYield={handleUserYield}
              onReportObstruction={handleReportObstruction}
            />
          </div>
        )}

        {/* TAB 4: AMBULANCE COCKPIT ONLY */}
        {activeTab === 'ambulance' && (
          <div className="space-y-6">
            <AmbulanceCockpit
              ambulance={ambulance}
              motorists={motorists}
              signals={signals}
              logs={logs}
              onToggleSiren={handleToggleSiren}
              onChangeSirenMode={handleChangeSirenMode}
              onChangeRadius={handleChangeRadius}
              onSendCustomBroadcast={handleSendCustomBroadcast}
              onForcePreemption={handleForcePreemption}
            />
          </div>
        )}

        {/* TAB 5: CITY TRAFFIC COMMAND & ANALYTICS */}
        {activeTab === 'command' && (
          <div className="space-y-6">
            <TrafficCommandView
              ambulance={ambulance}
              motorists={motorists}
              signals={signals}
              logs={logs}
              onTriggerScenario={handleTriggerScenario}
              onClearLogs={() => setLogs([])}
            />
          </div>
        )}
      </main>

      {/* Floating Interactive Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 border border-slate-700 text-slate-100 rounded-xl shadow-2xl animate-in slide-in-from-bottom-3 duration-200 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Rescue Alley Guide Modal */}
      <RescueAlleyModal isOpen={isGuideOpen} lang={lang} onClose={() => setIsGuideOpen(false)} />

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>AuraPulse V2X Emergency Vehicle Pre-Alert Network · Certified ISO-V2X Protocol</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>5.9 GHz DSRC / C-V2X Standard</span>
            <span aria-hidden="true">·</span>
            <span>Emergency Services Preemption</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
