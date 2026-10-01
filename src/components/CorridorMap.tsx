import React, { useState } from 'react';
import { EmergencyVehicle, MotoristVehicle, TrafficSignal } from '../types/emergency';
import { Language, translations } from '../locales/translations';
import { Play, Pause, RotateCcw, Volume2, ShieldAlert, Sparkles, Navigation, Info } from 'lucide-react';
import { ROAD_LENGTH, CORRIDOR_Y, LANE_HEIGHT } from '../services/corridorSimulation';

interface CorridorMapProps {
  ambulance: EmergencyVehicle;
  motorists: MotoristVehicle[];
  signals: TrafficSignal[];
  isPlaying: boolean;
  simSpeed: number;
  selectedVehicleId: string | null;
  lang?: Language;
  onTogglePlay: () => void;
  onReset: () => void;
  onChangeSpeed: (speed: number) => void;
  onSelectVehicle: (id: string) => void;
  onUserYield: () => void;
}

export const CorridorMap: React.FC<CorridorMapProps> = ({
  ambulance,
  motorists,
  signals,
  isPlaying,
  simSpeed,
  selectedVehicleId,
  lang = 'en',
  onTogglePlay,
  onReset,
  onChangeSpeed,
  onSelectVehicle,
  onUserYield,
}) => {
  const [zoomLevel, setZoomLevel] = useState<'fit' | 'follow_ambulance' | 'follow_user'>('fit');
  const t = translations[lang];

  // Calculate viewBox based on zoom
  let viewBox = `0 140 ${ROAD_LENGTH} 360`;
  if (zoomLevel === 'follow_ambulance') {
    const minX = Math.max(0, Math.min(ambulance.position.x - 300, ROAD_LENGTH - 800));
    viewBox = `${minX} 140 800 360`;
  } else if (zoomLevel === 'follow_user') {
    const userCar = motorists.find(m => m.isUserVehicle);
    const userX = userCar ? userCar.position.x : ambulance.position.x;
    const minX = Math.max(0, Math.min(userX - 400, ROAD_LENGTH - 800));
    viewBox = `${minX} 140 800 360`;
  }

  const userVehicle = motorists.find(m => m.isUserVehicle);
  const isUserYielded = userVehicle?.hasYielded;

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Map Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-sm font-semibold tracking-wide text-slate-200">
              {lang === 'gu' ? 'લાઈવ ઇમરજન્સી કોરિડોર સિમ્યુલેશન' : 'Live Emergency Corridor Simulation'}
            </span>
          </div>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs text-slate-400 font-mono">
            V2X Beacon: {ambulance.alertRadiusMeters}{t.metrics.meters}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* View Modes */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setZoomLevel('fit')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                zoomLevel === 'fit' ? 'bg-rose-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.actions.followCorridor}
            </button>
            <button
              onClick={() => setZoomLevel('follow_ambulance')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                zoomLevel === 'follow_ambulance' ? 'bg-rose-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.actions.followAmbulance}
            </button>
            <button
              onClick={() => setZoomLevel('follow_user')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                zoomLevel === 'follow_user' ? 'bg-rose-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.actions.followUser}
            </button>
          </div>

          {/* Speed */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
            {[1, 2, 4].map(spd => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  simSpeed === spd ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Play/Pause */}
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isPlaying ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" /> {t.actions.pause}
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> {t.actions.runCorridor}
              </>
            )}
          </button>

          <button
            onClick={onReset}
            title={t.actions.reset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive SVG Road Canvas */}
      <div className="relative w-full h-[380px] bg-slate-950 overflow-hidden select-none">
        <svg
          viewBox={viewBox}
          className="w-full h-full cursor-crosshair transition-all duration-300 ease-out"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Asphalt Pattern */}
            <linearGradient id="roadGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Emergency Alert Cone Gradient */}
            <radialGradient id="alertConeGrad" cx="0%" cy="50%" r="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.38" />
              <stop offset="40%" stopColor="#3b82f6" stopOpacity="0.22" />
              <stop offset="85%" stopColor="#6366f1" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>

            {/* Ambulance Strobe Glow */}
            <filter id="strobeGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Terrain & City Blocks */}
          <rect x="0" y="100" width={ROAD_LENGTH} height="400" fill="#090d16" />

          {/* Cross Streets */}
          {[480, 980, 1440].map((crossX) => (
            <g key={crossX}>
              <rect x={crossX - 35} y="120" width="70" height="380" fill="#172033" />
              {/* Crosswalk Zebra lines */}
              <line x1={crossX - 32} y1={CORRIDOR_Y - 80} x2={crossX + 32} y2={CORRIDOR_Y - 80} stroke="#475569" strokeWidth="4" strokeDasharray="6,4" />
              <line x1={crossX - 32} y1={CORRIDOR_Y + 80} x2={crossX + 32} y2={CORRIDOR_Y + 80} stroke="#475569" strokeWidth="4" strokeDasharray="6,4" />
            </g>
          ))}

          {/* Main Corridor Road Surface (3 Lanes: Left, Center, Right) */}
          <rect
            x="0"
            y={CORRIDOR_Y - LANE_HEIGHT * 1.5}
            width={ROAD_LENGTH}
            height={LANE_HEIGHT * 3}
            fill="url(#roadGradient)"
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* Road Curb & Shoulder lines */}
          <line
            x1="0"
            y1={CORRIDOR_Y - LANE_HEIGHT * 1.5}
            x2={ROAD_LENGTH}
            y2={CORRIDOR_Y - LANE_HEIGHT * 1.5}
            stroke="#fbbf24"
            strokeWidth="2.5"
          />
          <line
            x1="0"
            y1={CORRIDOR_Y + LANE_HEIGHT * 1.5}
            x2={ROAD_LENGTH}
            y2={CORRIDOR_Y + LANE_HEIGHT * 1.5}
            stroke="#ffffff"
            strokeWidth="2.5"
          />

          {/* Lane Dividers (Dashed white lines) */}
          <line
            x1="0"
            y1={CORRIDOR_Y - LANE_HEIGHT * 0.5}
            x2={ROAD_LENGTH}
            y2={CORRIDOR_Y - LANE_HEIGHT * 0.5}
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="18,14"
          />
          <line
            x1="0"
            y1={CORRIDOR_Y + LANE_HEIGHT * 0.5}
            x2={ROAD_LENGTH}
            y2={CORRIDOR_Y + LANE_HEIGHT * 0.5}
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="18,14"
          />

          {/* Lane Labels */}
          <text x="30" y={CORRIDOR_Y - LANE_HEIGHT + 4} fill="#475569" fontSize="10" fontFamily="monospace" fontWeight="600">LANE 1 (FAST / PASS)</text>
          <text x="30" y={CORRIDOR_Y + 4} fill="#e11d48" fontSize="10" fontFamily="monospace" fontWeight="bold">LANE 2 (EMERGENCY CORRIDOR)</text>
          <text x="30" y={CORRIDOR_Y + LANE_HEIGHT + 4} fill="#10b981" fontSize="10" fontFamily="monospace" fontWeight="600">LANE 3 (CLEARANCE SHOULDER)</text>

          {/* Emergency Corridor Directional Arrow Guide when siren active */}
          {ambulance.sirenActive && (
            <g opacity="0.45">
              {[200, 450, 700, 950, 1200, 1450].map((arrowX) => (
                <path
                  key={arrowX}
                  d={`M ${arrowX} ${CORRIDOR_Y - 8} L ${arrowX + 24} ${CORRIDOR_Y} L ${arrowX} ${CORRIDOR_Y + 8}`}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              ))}
            </g>
          )}

          {/* Traffic Signals */}
          {signals.map((sig) => {
            const isGreen = sig.state === 'green' || sig.state === 'preempted_green';
            const isPreempted = sig.state === 'preempted_green';
            return (
              <g key={sig.id} transform={`translate(${sig.position.x}, ${CORRIDOR_Y - LANE_HEIGHT * 1.5 - 40})`}>
                {/* Traffic Light Housing */}
                <rect x="-10" y="-36" width="20" height="48" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                {/* Red Light */}
                <circle cx="0" cy="-24" r="4.5" fill={sig.state === 'red' ? '#ef4444' : '#450a0a'} />
                {/* Yellow Light */}
                <circle cx="0" cy="-12" r="4.5" fill={sig.state === 'yellow' ? '#f59e0b' : '#451a03'} />
                {/* Green Light */}
                <circle
                  cx="0"
                  cy="0"
                  r="4.5"
                  fill={isGreen ? '#10b981' : '#022c22'}
                  filter={isGreen ? 'url(#strobeGlow)' : undefined}
                />

                {/* Preemption Badge */}
                {isPreempted && (
                  <g transform="translate(14, -20)">
                    <rect x="0" y="0" width="76" height="18" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                    <text x="38" y="12" fill="#34d399" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      GREEN WAVE
                    </text>
                  </g>
                )}
                <text x="0" y="24" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  {sig.name.split('&')[0]}
                </text>
              </g>
            );
          })}

          {/* V2X Pre-Alert Projected Corridor Cone from Ambulance */}
          {ambulance.sirenActive && (
            <g>
              {/* Forward Alert Broadcast Polygon */}
              <polygon
                points={`
                  ${ambulance.position.x},${ambulance.position.y - 12}
                  ${ambulance.position.x + ambulance.alertRadiusMeters},${ambulance.position.y - 140}
                  ${ambulance.position.x + ambulance.alertRadiusMeters},${ambulance.position.y + 140}
                  ${ambulance.position.x},${ambulance.position.y + 12}
                `}
                fill="url(#alertConeGrad)"
              />

              {/* Pulsing Acoustic / RF Wave Rings */}
              <circle
                cx={ambulance.position.x}
                cy={ambulance.position.y}
                r={120}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                opacity="0.4"
                strokeDasharray="6,4"
              />
              <circle
                cx={ambulance.position.x}
                cy={ambulance.position.y}
                r={240}
                fill="none"
                stroke="#ef4444"
                strokeWidth="1"
                opacity="0.3"
                strokeDasharray="8,6"
              />
            </g>
          )}

          {/* Civilian Motorists */}
          {motorists.map((car) => {
            const isSelected = car.id === selectedVehicleId;
            const isUser = car.isUserVehicle;
            const isCritical = car.alertLevel === 'critical_yield';
            const isCaution = car.alertLevel === 'caution';

            // Car body color
            let carBodyColor = '#64748b';
            if (isUser) carBodyColor = '#0284c7'; // Cyan-Blue for User
            else if (car.type === 'suv') carBodyColor = '#475569';
            else if (car.type === 'truck') carBodyColor = '#334155';

            return (
              <g
                key={car.id}
                transform={`translate(${car.position.x}, ${car.position.y})`}
                onClick={() => onSelectVehicle(car.id)}
                className="cursor-pointer transition-transform duration-200 hover:scale-105"
              >
                {/* User Car Highlight Beacon */}
                {isUser && (
                  <circle
                    cx="0"
                    cy="0"
                    r="24"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="4,3"
                    className="animate-spin"
                  />
                )}

                {/* Pre-Alert Aura Warning Circle */}
                {isCritical && (
                  <circle
                    cx="0"
                    cy="0"
                    r="28"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    className="animate-ping"
                    opacity="0.75"
                  />
                )}
                {isCaution && !isCritical && (
                  <circle
                    cx="0"
                    cy="0"
                    r="26"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                  />
                )}

                {/* Car Silhouette (Length ~34, Width ~18) */}
                <rect
                  x="-18"
                  y="-9"
                  width="36"
                  height="18"
                  rx="4"
                  fill={carBodyColor}
                  stroke={isSelected ? '#38bdf8' : isCritical ? '#ef4444' : '#475569'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />

                {/* Windshield */}
                <rect x="-6" y="-6" width="14" height="12" rx="2" fill="#0f172a" />

                {/* Headlights (facing right / East) */}
                <circle cx="16" cy="-6" r="2" fill="#fef08a" />
                <circle cx="16" cy="6" r="2" fill="#fef08a" />

                {/* Brake / Taillights */}
                <circle cx="-16" cy="-6" r="2" fill={isCritical ? '#ef4444' : '#991b1b'} />
                <circle cx="-16" cy="6" r="2" fill={isCritical ? '#ef4444' : '#991b1b'} />

                {/* Yielding Blinker Indicator (Right turn signal) */}
                {(car.status === 'clearing' || car.status === 'alerted') && (
                  <circle cx="16" cy="8" r="3" fill="#f59e0b" className="animate-pulse-fast" />
                )}

                {/* Vehicle Label Tag */}
                <text
                  x="0"
                  y="-14"
                  fill={isUser ? '#38bdf8' : isCritical ? '#fca5a5' : '#cbd5e1'}
                  fontSize="8.5"
                  fontWeight={isUser ? 'bold' : 'normal'}
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {isUser ? 'YOU (Tesla)' : car.licensePlate}
                </text>

                {/* Yield Status Pill in Map */}
                {car.hasYielded && (
                  <g transform="translate(-16, 12)">
                    <rect x="0" y="0" width="32" height="11" rx="2" fill="#065f46" />
                    <text x="16" y="8" fill="#a7f3d0" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      YIELDED
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Emergency Ambulance Unit */}
          <g
            transform={`translate(${ambulance.position.x}, ${ambulance.position.y})`}
            onClick={() => onSelectVehicle(ambulance.id)}
            className="cursor-pointer"
          >
            {/* Strobe Aura */}
            <circle cx="0" cy="0" r="32" fill="#ef4444" opacity="0.25" filter="url(#strobeGlow)" />

            {/* Ambulance Body (Van profile: Length 46, Width 22) */}
            <rect
              x="-24"
              y="-11"
              width="48"
              height="22"
              rx="4"
              fill="#ffffff"
              stroke="#b91c1c"
              strokeWidth="2"
            />

            {/* Red Paramedic Cross Marking on Roof */}
            <rect x="-8" y="-6" width="16" height="4" fill="#dc2626" />
            <rect x="-2" y="-10" width="4" height="12" fill="#dc2626" />

            {/* Cab Windshield */}
            <rect x="10" y="-8" width="8" height="16" rx="1.5" fill="#1e293b" />

            {/* Headlights */}
            <circle cx="23" cy="-7" r="2.5" fill="#fef08a" />
            <circle cx="23" cy="7" r="2.5" fill="#fef08a" />

            {/* Active LED Lightbar (Blue and Red Strobes) */}
            {ambulance.sirenActive && (
              <g>
                <circle cx="2" cy="-9" r="3" fill="#3b82f6" className="animate-pulse-fast" />
                <circle cx="2" cy="9" r="3" fill="#ef4444" className="animate-pulse-fast" />
                <rect x="-1" y="-10" width="6" height="20" fill="#3b82f6" opacity="0.4" />
              </g>
            )}

            {/* Unit Tag */}
            <text
              x="0"
              y="-16"
              fill="#ef4444"
              fontSize="9"
              fontWeight="900"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {ambulance.unitCode}
            </text>
          </g>

          {/* Hospital Destination Building */}
          <g transform={`translate(${ROAD_LENGTH - 110}, ${CORRIDOR_Y - 95})`}>
            <rect x="0" y="0" width="95" height="60" rx="6" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
            <rect x="42" y="16" width="10" height="28" fill="#ef4444" />
            <rect x="33" y="25" width="28" height="10" fill="#ef4444" />
            <text x="47" y="52" fill="#93c5fd" fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              TRAUMA CENTER
            </text>
          </g>
        </svg>

        {/* Floating Quick Action Overlay when User's car is alerted */}
        {userVehicle && userVehicle.alertLevel === 'critical_yield' && !isUserYielded && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-rose-950/95 border border-rose-500 rounded-lg shadow-xl backdrop-blur-md animate-bounce">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-white block">Pre-Alert Warning:</span>
              <span className="text-rose-200">
                Ambulance is {Math.round(userVehicle.distanceToAmbulanceMeters)}m behind in your lane!
              </span>
            </div>
            <button
              onClick={onUserYield}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-md shadow-md transition-colors whitespace-nowrap cursor-pointer"
            >
              Yield Lane Now →
            </button>
          </div>
        )}
      </div>

      {/* Corridor Legend & Real-Time Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-950/90 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-rose-500 border border-white" />
          <span className="text-slate-400">Emergency Unit ({ambulance.speedKmh} km/h)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-sky-500 border border-sky-300" />
          <span className="text-slate-400">Your Vehicle ({userVehicle?.speedKmh} km/h)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-emerald-700 border border-emerald-400" />
          <span className="text-slate-400">Yielded Motorist (Safe Shoulder)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded bg-emerald-500" />
          <span className="text-slate-400">Traffic Preemption (Green Wave)</span>
        </div>
      </div>
    </div>
  );
};
