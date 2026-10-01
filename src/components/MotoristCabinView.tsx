import React, { useEffect, useState } from 'react';
import { MotoristVehicle, EmergencyVehicle } from '../types/emergency';
import { Language, translations } from '../locales/translations';
import { 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  ArrowRight, 
  Compass, 
  Radio, 
  AlertTriangle,
  Flame,
  ArrowUpRight,
  ShieldCheck,
  Siren,
  BellRing
} from 'lucide-react';
import { audioAlertService } from '../services/audioAlertService';

interface MotoristCabinViewProps {
  userCar: MotoristVehicle;
  ambulance: EmergencyVehicle;
  lang?: Language;
  onYield: () => void;
  onReportObstruction: () => void;
}

export const MotoristCabinView: React.FC<MotoristCabinViewProps> = ({
  userCar,
  ambulance,
  lang = 'en',
  onYield,
  onReportObstruction,
}) => {
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [hasTestedAudio, setHasTestedAudio] = useState<boolean>(false);

  const t = translations[lang];

  const isCritical = userCar.alertLevel === 'critical_yield';
  const isCaution = userCar.alertLevel === 'caution';
  const isSafe = userCar.alertLevel === 'safe' || userCar.hasYielded;

  const distance = Math.round(userCar.distanceToAmbulanceMeters);
  const timeToIntercept = Math.max(1, Math.round(userCar.timeToInterceptSec));

  // Trigger auditory chime and spoken alert when entering critical proximity
  useEffect(() => {
    if (isCritical && !userCar.hasYielded) {
      audioAlertService.playPreAlertChime();
      const speechText = lang === 'gu'
        ? `સાવધાન: પાછળથી એમ્બ્યુલન્સ ${distance} મીટર અંતરે આવી રહી છે. કૃપા કરીને જમણી બાજુ ખસી જગ્યા આપો.`
        : `Pre-alert: Ambulance approaching from rear, ${distance} meters. Please move right to clear corridor.`;
      audioAlertService.speakAlert(speechText, distance);
    }
  }, [isCritical, userCar.hasYielded, distance, ambulance.unitCode, lang]);

  const handleToggleMute = () => {
    const next = !audioMuted;
    setAudioMuted(next);
    audioAlertService.setMuted(next);
  };

  const handleToggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    audioAlertService.setVoiceEnabled(next);
  };

  const handleTestChime = () => {
    setHasTestedAudio(true);
    audioAlertService.playPreAlertChime();
    const testText = lang === 'gu'
      ? 'ઇમરજન્સી પ્રી-એલર્ટ સિસ્ટમ કાર્યરત છે. ચેતવણી અવાજ ચકાસાયેલ છે.'
      : 'Emergency pre-alert system operational. Siren chime verified.';
    audioAlertService.speakAlert(testText);
  };

  // Radar math: ambulance relative bearing to user vehicle
  // Heading of user car is East (90 deg). Ambulance is behind (West, 270 deg)
  const angleDegrees = 180; // Directly behind on the straight avenue

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto">
      {/* Top Cabin Bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-950 border border-sky-600/40 rounded-lg text-sky-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm tracking-wide">
                IN-CABIN MOTORIST HUD
              </span>
              <span className="text-xs text-sky-400 font-mono">
                {userCar.model} · {userCar.licensePlate}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              V2X Active Receiver · 5.9 GHz Emergency Frequency
            </div>
          </div>
        </div>

        {/* Audio Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTestChime}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors border border-slate-700 cursor-pointer"
            title="Test pre-alert acoustic tone"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Audition Chime</span>
          </button>
          <button
            onClick={handleToggleVoice}
            className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
              voiceEnabled ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title="Toggle synthetic voice navigation prompt"
          >
            Voice: {voiceEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              audioMuted ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
            title={audioMuted ? 'Unmute All Alerts' : 'Mute All Alerts'}
          >
            {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Alert Warning Banner */}
      <div
        className={`relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 ${
          userCar.hasYielded
            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-100'
            : isCritical
            ? 'bg-rose-950/70 border-rose-500 animate-emergency-glow text-white'
            : isCaution
            ? 'bg-amber-950/40 border-amber-500/60 text-amber-100'
            : 'bg-slate-900/60 border-slate-800 text-slate-200'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Main Alert Text */}
          <div className="flex items-start gap-4">
            <div
              className={`p-3.5 rounded-xl shrink-0 ${
                userCar.hasYielded
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : isCritical
                  ? 'bg-rose-500 text-white animate-pulse'
                  : isCaution
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {userCar.hasYielded ? (
                <ShieldCheck className="w-8 h-8" />
              ) : isCritical ? (
                <Siren className="w-8 h-8 animate-spin" />
              ) : (
                <ShieldAlert className="w-8 h-8" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/40">
                  {userCar.hasYielded
                    ? t.actions.yieldConfirmed
                    : isCritical
                    ? t.metrics.goldenHourSaved
                    : isCaution
                    ? t.metrics.preAlertRange
                    : t.metrics.active}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-mono text-slate-300">
                  {ambulance.destination}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                {userCar.hasYielded
                  ? t.alerts.yieldedTitle
                  : isCritical
                  ? t.alerts.criticalTitle
                  : isCaution
                  ? t.alerts.cautionTitle
                  : t.alerts.nominalTitle}
              </h2>

              <p className="mt-1 text-sm opacity-90 max-w-xl">
                {userCar.hasYielded
                  ? t.alerts.yieldedDesc
                  : isCritical
                  ? t.alerts.criticalDesc
                  : isCaution
                  ? t.alerts.cautionDesc
                  : t.alerts.nominalDesc}
              </p>
            </div>
          </div>

          {/* Quick Yield CTA */}
          {!userCar.hasYielded && (isCritical || isCaution) && (
            <button
              onClick={onYield}
              className="w-full md:w-auto px-6 py-3.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-sm tracking-wide rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>{t.actions.iHaveYielded}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {userCar.hasYielded && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-900/60 border border-emerald-500 rounded-lg text-emerald-300 text-xs font-mono font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.actions.yieldConfirmed}</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid: 360 Radar Compass + Dynamic Lane Advisory + Protocol Steps */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Radar Bearing HUD (5 Cols) */}
        <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 tracking-wider">
              {lang === 'gu' ? 'પ્રોક્સિમિટી રડાર ડિસ્પ્લે' : 'PROXIMITY RADAR HUD'}
            </span>
            <span className="text-xs font-mono text-rose-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              {t.metrics.interceptTime}: {timeToIntercept}s
            </span>
          </div>

          {/* Radar Circular Display */}
          <div className="relative w-56 h-56 flex items-center justify-center my-2">
            {/* Concentric distance rings */}
            <div className="absolute inset-0 rounded-full border border-slate-800" />
            <div className="absolute inset-6 rounded-full border border-slate-700/60" />
            <div className="absolute inset-14 rounded-full border border-slate-700/40" />
            <div className="absolute inset-20 rounded-full border border-dashed border-rose-500/30" />

            {/* Sweep radar arm */}
            <div className="absolute inset-0 rounded-full animate-radar-sweep border-t-2 border-rose-500/60" />

            {/* Crosshairs */}
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-slate-800 -translate-x-1/2" />
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-slate-800 -translate-y-1/2" />

            {/* Cardinal Markers */}
            <span className="absolute top-1 text-[9px] font-mono text-slate-500">{lang === 'gu' ? 'આગળ' : 'AHEAD'}</span>
            <span className="absolute bottom-1 text-[9px] font-mono text-slate-500">{lang === 'gu' ? 'પાછળ' : 'BEHIND'}</span>
            <span className="absolute left-2 text-[9px] font-mono text-slate-500">{lang === 'gu' ? 'ડાબે' : 'LEFT'}</span>
            <span className="absolute right-2 text-[9px] font-mono text-slate-500">{lang === 'gu' ? 'જમણે' : 'RIGHT'}</span>

            {/* User Vehicle in Center */}
            <div className="z-10 flex flex-col items-center justify-center p-2 rounded-full bg-sky-500 text-white shadow-lg">
              <Compass className="w-5 h-5" />
            </div>

            {/* Approaching Ambulance Marker (Positioned Behind, distance proportional) */}
            <div
              className="absolute z-20 flex flex-col items-center animate-bounce"
              style={{
                bottom: `${Math.max(14, Math.min(80, 80 - (distance / 10)))}px`,
                transform: 'translateX(0px)',
              }}
            >
              <div className="px-1.5 py-0.5 bg-rose-600 border border-white text-white font-mono text-[9px] font-bold rounded shadow-md flex items-center gap-1">
                <Siren className="w-2.5 h-2.5" />
                {distance}m
              </div>
              <div className="w-3 h-3 rotate-45 bg-rose-500 border border-white mt-0.5" />
            </div>
          </div>

          {/* Telemetry readout below radar */}
          <div className="w-full grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-800 text-center">
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">{t.metrics.distance}</div>
              <div className="text-xl font-black font-mono text-rose-400 tabular-nums">
                {distance} <span className="text-xs text-slate-400">{t.metrics.meters}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">{t.metrics.closingDelta}</div>
              <div className="text-xl font-black font-mono text-amber-400 tabular-nums">
                +{ambulance.speedKmh - userCar.speedKmh} <span className="text-xs text-slate-400">km/h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Lane Clearance Guidance (7 Cols) */}
        <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 tracking-wider">
                {lang === 'gu' ? 'લેન વ્યવસ્થાપન માર્ગદર્શન' : 'TACTICAL LANE ALLOCATION'}
              </span>
              <span className="text-xs font-mono text-slate-400">
                ISO-V2X Protocol
              </span>
            </div>

            {/* 3-Lane Diagram */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 my-2">
              {/* Lane 1: Left */}
              <div className="flex flex-col items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-center min-h-[140px]">
                <span className="text-[10px] font-mono font-bold text-slate-400">{t.lanes.lane1}</span>
                <div className="text-xs text-slate-500 my-auto">{lang === 'gu' ? 'સામાન્ય વાહનો માટે' : 'For Passing Traffic'}</div>
                <div className="text-[10px] text-slate-500">{lang === 'gu' ? 'ધીમા પડો' : 'Hold or Yield'}</div>
              </div>

              {/* Lane 2: Center (Emergency Alley) */}
              <div
                className={`flex flex-col items-center justify-between p-3 rounded-lg border text-center min-h-[140px] relative transition-colors ${
                  userCar.currentLane === 'center'
                    ? 'bg-rose-950/40 border-rose-500/80 shadow-md'
                    : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-rose-400">
                  <Flame className="w-3 h-3" />
                  {t.lanes.emergencyCorridor}
                </div>

                {userCar.currentLane === 'center' ? (
                  <div className="my-auto flex flex-col items-center">
                    <span className="px-2 py-0.5 bg-sky-500 text-white font-mono text-[10px] font-bold rounded">
                      {lang === 'gu' ? 'તમારું વાહન અહીં છે' : 'YOUR CAR HERE'}
                    </span>
                    <span className="text-[10px] text-rose-300 font-bold mt-1 animate-pulse">
                      {t.lanes.vacateRequired}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-rose-400 font-mono my-auto">
                    {lang === 'gu' ? 'એમ્બ્યુલન્સ માટે ખુલ્લું' : 'CLEAR FOR AMBULANCE'}
                  </div>
                )}

                <div className="text-[10px] text-slate-500">{lang === 'gu' ? 'મુખ્ય ઇમરજન્સી લેન' : 'Primary Corridor'}</div>
              </div>

              {/* Lane 3: Right (Safe Shoulder) */}
              <div
                className={`flex flex-col items-center justify-between p-3 rounded-lg border text-center min-h-[140px] relative transition-colors ${
                  userCar.currentLane === 'right'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="text-[10px] font-mono font-bold text-emerald-400">
                  {t.lanes.lane3}
                </div>

                {userCar.currentLane === 'right' ? (
                  <div className="my-auto flex flex-col items-center">
                    <span className="px-2 py-0.5 bg-emerald-600 text-white font-mono text-[10px] font-bold rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {lang === 'gu' ? 'સલામત' : 'SAFE YIELD'}
                    </span>
                    <span className="text-[10px] text-emerald-300 mt-1">{lang === 'gu' ? 'અહીં જ સ્થિર રહો' : 'Holding Position'}</span>
                  </div>
                ) : (
                  <div className="my-auto flex flex-col items-center">
                    <ArrowRight className="w-6 h-6 text-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-bold mt-1">
                      {t.lanes.targetLane}
                    </span>
                  </div>
                )}

                <div className="text-[10px] text-slate-500">{t.lanes.safeShoulder}</div>
              </div>
            </div>

            {/* Protocol checklist */}
            <div className="mt-4 space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold font-mono">1</span>
                <span>{t.protocols.step1}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold font-mono">2</span>
                <span>{t.protocols.step2}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold font-mono">3</span>
                <span>{t.protocols.step3}</span>
              </div>
            </div>
          </div>

          {/* Feedback & Report Obstruction */}
          <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-800">
            <button
              onClick={onReportObstruction}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t.actions.reportHazard}</span>
            </button>
            <span className="text-[11px] text-slate-500 font-mono">
              GPS: 23.0225° N, 72.5714° E (Ahmedabad Metro)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
