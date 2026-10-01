import React, { useState } from 'react';
import { EmergencyVehicle, MotoristVehicle, TrafficSignal, CorridorAlertLog } from '../types/emergency';
import { 
  Siren, 
  Volume2, 
  VolumeX, 
  Radio, 
  Hospital, 
  Navigation, 
  ShieldAlert, 
  Gauge, 
  Activity, 
  CheckCircle, 
  Clock, 
  Zap, 
  Sliders,
  Send,
  AlertCircle
} from 'lucide-react';
import { audioAlertService } from '../services/audioAlertService';

interface AmbulanceCockpitProps {
  ambulance: EmergencyVehicle;
  motorists: MotoristVehicle[];
  signals: TrafficSignal[];
  logs: CorridorAlertLog[];
  onToggleSiren: () => void;
  onChangeSirenMode: (mode: 'yelp' | 'wail' | 'hi_lo' | 'silent_v2x') => void;
  onChangeRadius: (radiusMeters: number) => void;
  onSendCustomBroadcast: (text: string) => void;
  onForcePreemption: (signalId: string) => void;
}

export const AmbulanceCockpit: React.FC<AmbulanceCockpitProps> = ({
  ambulance,
  motorists,
  signals,
  logs,
  onToggleSiren,
  onChangeSirenMode,
  onChangeRadius,
  onSendCustomBroadcast,
  onForcePreemption,
}) => {
  const [customMsg, setCustomMsg] = useState('');
  const [isHornActive, setIsHornActive] = useState(false);

  const motoristsAhead = motorists.filter(
    m => m.position.x > ambulance.position.x && m.position.x <= ambulance.position.x + ambulance.alertRadiusMeters
  );
  const clearedCount = motoristsAhead.filter(m => m.hasYielded || m.currentLane === 'right').length;
  const clearanceRatio = motoristsAhead.length > 0 ? Math.round((clearedCount / motoristsAhead.length) * 100) : 100;

  const handleHornBurst = () => {
    setIsHornActive(true);
    audioAlertService.startSiren('yelp');
    setTimeout(() => {
      audioAlertService.stopSiren();
      setIsHornActive(false);
    }, 600);
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) return;
    onSendCustomBroadcast(customMsg.trim());
    audioAlertService.speakAlert(customMsg.trim());
    setCustomMsg('');
  };

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto">
      {/* Top Unit Tactical Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <img
            src="/src/assets/images/avatar_paramedic_lead_1790844671280.jpg"
            alt="Paramedic Commander"
            className="w-12 h-12 rounded-lg object-cover border border-rose-500/50"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-wide">
                {ambulance.unitCode}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-xs font-bold uppercase tracking-wider">
                CODE 3 PRIORITY
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Commander: {ambulance.driverName} · Call Sign: {ambulance.callSign}
            </div>
          </div>
        </div>

        {/* Destination & Triage Info */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono text-slate-400 flex items-center justify-end gap-1">
              <Hospital className="w-3 h-3 text-rose-400" />
              DESTINATION HOSPITAL
            </div>
            <div className="text-sm font-semibold text-white">
              {ambulance.destination}
            </div>
            <div className="text-[11px] text-rose-300 font-mono">
              ETA: {ambulance.timeToDestinationMin.toFixed(1)} mins · {ambulance.patientCondition}
            </div>
          </div>

          <div className="text-center pl-4 border-l border-slate-800">
            <div className="text-[10px] uppercase font-mono text-slate-400">SPEED</div>
            <div className="text-2xl font-black font-mono text-emerald-400 tabular-nums">
              {ambulance.speedKmh} <span className="text-xs text-slate-400 font-normal">km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Controls + Telemetry + Corridor Clearance */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Column: Siren, Modes, V2X Radius (5 Cols) */}
        <div className="md:col-span-5 flex flex-col gap-4">
          {/* Siren & Emergency Lightbar Control */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-1.5">
                <Siren className="w-4 h-4 text-rose-500" />
                V2X BEACON & SIREN HARDWARE
              </span>
              <span className={`text-xs font-mono font-bold ${ambulance.sirenActive ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>
                {ambulance.sirenActive ? 'TRANSMITTING' : 'STANDBY'}
              </span>
            </div>

            {/* Big Siren Toggle Button */}
            <button
              onClick={onToggleSiren}
              className={`w-full py-4 rounded-xl font-black text-sm tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                ambulance.sirenActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Siren className={`w-5 h-5 ${ambulance.sirenActive ? 'animate-spin' : ''}`} />
              <span>{ambulance.sirenActive ? 'DEACTIVATE EMERGENCY CORRIDOR' : 'ACTIVATE CODE-3 CORRIDOR'}</span>
            </button>

            {/* Siren Tone Presets */}
            <div className="mt-4">
              <span className="text-[11px] font-mono text-slate-400 block mb-2">SIREN AUDIO & BEACON TONE:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['yelp', 'wail', 'hi_lo', 'silent_v2x'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onChangeSirenMode(mode)}
                    className={`py-2 px-2.5 rounded-lg border text-center transition-colors cursor-pointer capitalize font-medium ${
                      ambulance.sirenMode === mode
                        ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode === 'silent_v2x' ? 'Silent V2X (Night)' : mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Horn Burst */}
            <button
              onClick={handleHornBurst}
              className="w-full mt-3 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Instant Acoustic Horn Pulse</span>
            </button>
          </div>

          {/* Broadcast Radius Geofence */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 tracking-wider">
                PRE-ALERT GEOFENCE CONE
              </span>
              <span className="text-xs font-mono text-rose-400 font-bold tabular-nums">
                {ambulance.alertRadiusMeters} meters
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Motorists within this forward radius receive instant in-cabin HUD notifications and acoustic chimes.
            </p>

            <div className="flex items-center gap-2">
              {[500, 750, 1000, 1200].map((radius) => (
                <button
                  key={radius}
                  onClick={() => onChangeRadius(radius)}
                  className={`flex-1 py-1.5 text-xs font-mono rounded border transition-colors cursor-pointer ${
                    ambulance.alertRadiusMeters === radius
                      ? 'bg-rose-950 border-rose-500 text-rose-200 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {radius}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Clearance Radar & Green Wave Signals (7 Cols) */}
        <div className="md:col-span-7 flex flex-col gap-4">
          {/* Corridor Clearance Telemetry */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-300 tracking-wider">
                LIVE CORRIDOR CLEARANCE INDEX
              </span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle className="w-3.5 h-3.5" />
                {clearanceRatio}% Path Clear
              </span>
            </div>

            {/* Clearance Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-3.5 p-0.5 border border-slate-800 mb-4">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-emerald-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${clearanceRatio}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">VEHICLES IN CONE</div>
                <div className="text-xl font-bold font-mono text-white mt-0.5 tabular-nums">
                  {motoristsAhead.length}
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">YIELDED TO SHOULDER</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5 tabular-nums">
                  {clearedCount}
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">PENDING CLEARANCE</div>
                <div className="text-xl font-bold font-mono text-rose-400 mt-0.5 tabular-nums">
                  {motoristsAhead.length - clearedCount}
                </div>
              </div>
            </div>
          </div>

          {/* Traffic Signal Preemption Intersections */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                TRAFFIC LIGHT "GREEN WAVE" PREEMPTION
              </span>
              <span className="text-xs font-mono text-slate-400">
                Auto-Trigger $\le$ 450m
              </span>
            </div>

            <div className="space-y-2">
              {signals.map((sig) => {
                const isPreempted = sig.state === 'preempted_green';
                const distToSig = Math.round(sig.position.x - ambulance.position.x);
                return (
                  <div
                    key={sig.id}
                    className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isPreempted ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse' : 'bg-rose-500'
                        }`}
                      />
                      <div>
                        <span className="font-semibold text-slate-200 block">{sig.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {distToSig > 0 ? `${distToSig}m Ahead` : 'Passed'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          isPreempted
                            ? 'bg-emerald-950 border border-emerald-600/60 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isPreempted ? 'GREEN WAVE ACTIVE' : 'CYCLE RED'}
                      </span>

                      {!isPreempted && (
                        <button
                          onClick={() => onForcePreemption(sig.id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-800 text-slate-300 hover:text-white rounded transition-colors text-[10px] font-bold cursor-pointer"
                        >
                          Force Green
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Vocal / Text Broadcast to Motorists */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs font-bold text-slate-300 tracking-wider block mb-2">
              DIRECT MOTORIST VOICE / TEXT BROADCAST
            </span>
            <form onSubmit={handleBroadcastSubmit} className="flex gap-2">
              <input
                type="text"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="e.g. Extreme emergency. Yield all lanes immediately."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
