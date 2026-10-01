import React, { useState, useMemo } from 'react';
import { EmergencyVehicle, MotoristVehicle, TrafficSignal } from '../types/emergency';
import { Language, translations } from '../locales/translations';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  ShieldAlert, 
  Sparkles, 
  Navigation, 
  Info,
  Flame,
  Layers,
  Activity
} from 'lucide-react';
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
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [heatmapMode, setHeatmapMode] = useState<'combined' | 'bands' | 'hotspots'>('combined');
  const t = translations[lang];

  // Calculate real-time density metrics per lane
  const laneCounts = useMemo(() => {
    const counts = { left: 0, center: 0, right: 0 };
    motorists.forEach((m) => {
      if (m.currentLane === 'left') counts.left++;
      else if (m.currentLane === 'right') counts.right++;
      else counts.center++;
    });
    return counts;
  }, [motorists]);

  // Segment corridor into 9 spatial bins (200m each) per lane for localized density
  const SEGMENT_COUNT = 9;
  const SEGMENT_WIDTH = ROAD_LENGTH / SEGMENT_COUNT;

  const segmentDensities = useMemo(() => {
    // 3 lanes x 9 segments
    const lanes: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];
    const data: Array<{
      lane: 'left' | 'center' | 'right';
      segIdx: number;
      x: number;
      y: number;
      width: number;
      height: number;
      count: number;
      densityLevel: 'low' | 'moderate' | 'high';
      color: string;
      fillOpacity: number;
    }> = [];

    lanes.forEach((lane) => {
      let laneY = CORRIDOR_Y;
      if (lane === 'left') laneY = CORRIDOR_Y - LANE_HEIGHT;
      if (lane === 'right') laneY = CORRIDOR_Y + LANE_HEIGHT;

      for (let i = 0; i < SEGMENT_COUNT; i++) {
        const segStartX = i * SEGMENT_WIDTH;
        const segEndX = (i + 1) * SEGMENT_WIDTH;

        // Count motorists in this segment & lane
        const count = motorists.filter(
          (m) =>
            m.currentLane === lane &&
            m.position.x >= segStartX &&
            m.position.x < segEndX
        ).length;

        let densityLevel: 'low' | 'moderate' | 'high' = 'low';
        let color = '#10b981'; // Cyan-emerald for low
        let fillOpacity = 0.12;

        if (count >= 3) {
          densityLevel = 'high';
          color = '#ef4444'; // Crimson for congested
          fillOpacity = 0.55;
        } else if (count === 2) {
          densityLevel = 'moderate';
          color = '#f59e0b'; // Amber for moderate
          fillOpacity = 0.38;
        } else if (count === 1) {
          densityLevel = 'low';
          color = '#06b6d4'; // Cyan for light
          fillOpacity = 0.22;
        }

        data.push({
          lane,
          segIdx: i,
          x: segStartX,
          y: laneY - LANE_HEIGHT * 0.5,
          width: SEGMENT_WIDTH,
          height: LANE_HEIGHT,
          count,
          densityLevel,
          color,
          fillOpacity,
        });
      }
    });

    return data;
  }, [motorists, SEGMENT_WIDTH]);

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
        <div className="flex flex-wrap items-center gap-2">
          {/* Heatmap Toggle & Mode */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                showHeatmap
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Traffic Density Heatmap"
            >
              <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'animate-pulse text-amber-300' : ''}`} />
              <span>{t.heatmap.toggle}: {showHeatmap ? 'ON' : 'OFF'}</span>
            </button>

            {showHeatmap && (
              <div className="flex items-center border-l border-slate-800 ml-1 pl-1">
                {(['combined', 'bands', 'hotspots'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setHeatmapMode(mode)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono capitalize transition-colors cursor-pointer ${
                      heatmapMode === mode
                        ? 'bg-slate-800 text-rose-300 font-bold'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {mode === 'combined' ? (lang === 'gu' ? 'બંને' : 'Both') : mode === 'bands' ? (lang === 'gu' ? 'લેન' : 'Lanes') : (lang === 'gu' ? 'ઓરા' : 'Aura')}
                  </button>
                ))}
              </div>
            )}
          </div>

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

      {/* Heatmap Quick Telemetry Ribbon (Shown when Heatmap is active) */}
      {showHeatmap && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-950 border-b border-slate-800/80 text-xs font-mono">
          <div className="flex items-center gap-4">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              {t.heatmap.title}:
            </span>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded text-[11px] ${
                laneCounts.left >= 3
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : laneCounts.left === 2
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {t.lanes.lane1.split(' ')[0]} {t.lanes.lane1.split(' ')[1]}: {laneCounts.left} cars
              </span>

              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                laneCounts.center >= 3
                  ? 'bg-rose-950 text-rose-200 border border-rose-600 animate-pulse'
                  : laneCounts.center === 2
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {t.lanes.lane2.split(' ')[0]} {t.lanes.lane2.split(' ')[1]} (Corridor): {laneCounts.center} cars {laneCounts.center >= 3 ? `[${t.heatmap.congested}]` : `[${t.heatmap.clear}]`}
              </span>

              <span className={`px-2 py-0.5 rounded text-[11px] ${
                laneCounts.right >= 3
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : laneCounts.right >= 2
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {t.lanes.lane3.split(' ')[0]} {t.lanes.lane3.split(' ')[1]} (Shoulder): {laneCounts.right} cars
              </span>
            </div>
          </div>

          {/* Thermal Color Gradient Legend */}
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="text-emerald-400">{t.heatmap.low}</span>
            <div className="w-24 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-600 shadow-inner" />
            <span className="text-rose-400 font-bold">{t.heatmap.high}</span>
          </div>
        </div>
      )}

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

            {/* Thermal Heatmap Gradient & Blur Filter */}
            <radialGradient id="thermalHeatGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.88" />
              <stop offset="30%" stopColor="#f97316" stopOpacity="0.65" />
              <stop offset="60%" stopColor="#eab308" stopOpacity="0.4" />
              <stop offset="85%" stopColor="#06b6d4" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>

            <filter id="heatBlur" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="16" result="blur" />
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

          {/* REAL-TIME TRAFFIC DENSITY HEATMAP LAYER */}
          {showHeatmap && (
            <g id="realtime-traffic-heatmap" className="transition-opacity duration-300">
              {/* 1. Lane Density Continuous Segments (Bands) */}
              {(heatmapMode === 'combined' || heatmapMode === 'bands') && (
                <g opacity="0.68">
                  {segmentDensities.map((seg) => (
                    <g key={`heat-seg-${seg.lane}-${seg.segIdx}`}>
                      <rect
                        x={seg.x}
                        y={seg.y}
                        width={seg.width}
                        height={seg.height}
                        fill={seg.color}
                        opacity={seg.fillOpacity}
                        className="transition-all duration-300"
                      />
                      {/* High density warning border and subtle pulse */}
                      {seg.densityLevel === 'high' && (
                        <rect
                          x={seg.x + 2}
                          y={seg.y + 2}
                          width={seg.width - 4}
                          height={seg.height - 4}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="1.5"
                          opacity="0.8"
                          strokeDasharray="6,3"
                          className="animate-pulse"
                        />
                      )}
                      {/* Density count tag for segments with cars */}
                      {seg.count > 0 && (
                        <text
                          x={seg.x + seg.width * 0.5}
                          y={seg.y + seg.height * 0.5 + 3}
                          fill={seg.densityLevel === 'high' ? '#fecaca' : seg.densityLevel === 'moderate' ? '#fef08a' : '#a7f3d0'}
                          fontSize="8"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                          opacity="0.8"
                        >
                          {seg.count} {seg.count === 1 ? 'car' : 'cars'}
                        </text>
                      )}
                    </g>
                  ))}
                </g>
              )}

              {/* 2. Radial Thermal Heat Aura Hotspots around Motorists */}
              {(heatmapMode === 'combined' || heatmapMode === 'hotspots') && (
                <g opacity="0.85" style={{ mixBlendMode: 'screen' }}>
                  {motorists.map((car) => {
                    const laneCount = car.currentLane === 'left' ? laneCounts.left : car.currentLane === 'center' ? laneCounts.center : laneCounts.right;
                    const heatRadius = laneCount >= 3 ? 72 : laneCount === 2 ? 58 : 46;
                    return (
                      <circle
                        key={`heat-aura-${car.id}`}
                        cx={car.position.x}
                        cy={car.position.y}
                        r={heatRadius}
                        fill="url(#thermalHeatGrad)"
                        filter="url(#heatBlur)"
                        opacity={laneCount >= 3 ? 0.95 : 0.72}
                        className="transition-all duration-300 pointer-events-none"
                      />
                    );
                  })}
                </g>
              )}
            </g>
          )}

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
      <div className="flex flex-col gap-2 p-3 bg-slate-950/90 border-t border-slate-800 text-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

        {/* Real-Time Traffic Density Heatmap Scale Legend */}
        {showHeatmap && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 mt-1 border-t border-slate-800/60 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-slate-300 font-semibold">{t.heatmap.intensity}:</span>
              <span>{lang === 'gu' ? 'વાહનોની સંખ્યા મુજબ લેન ડેન્સિટી' : 'Motorists / Lane Density Scale'}</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-500/60 border border-emerald-400" />
                <span>{lang === 'gu' ? '0-1 વાહન (મુક્ત)' : '0-1 Cars (Low)'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-amber-500/70 border border-amber-400" />
                <span>{lang === 'gu' ? '2 વાહનો (મધ્યમ)' : '2 Cars (Moderate)'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-rose-500/80 border border-rose-400 animate-pulse" />
                <span className="text-rose-300 font-bold">{lang === 'gu' ? '3+ વાહનો (જામ/અવરોધ)' : '3+ Cars (Congested)'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
