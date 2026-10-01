import React from 'react';
import { EmergencyVehicle, MotoristVehicle, TrafficSignal, CorridorAlertLog } from '../types/emergency';
import { 
  Building2, 
  Activity, 
  Clock, 
  ShieldCheck, 
  Radio, 
  Flame, 
  TrendingDown, 
  Compass, 
  AlertCircle,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';

interface TrafficCommandViewProps {
  ambulance: EmergencyVehicle;
  motorists: MotoristVehicle[];
  signals: TrafficSignal[];
  logs: CorridorAlertLog[];
  onTriggerScenario: (scenario: 'rush_hour' | 'highway_express' | 'dense_intersection') => void;
  onClearLogs: () => void;
}

export const TrafficCommandView: React.FC<TrafficCommandViewProps> = ({
  ambulance,
  motorists,
  signals,
  logs,
  onTriggerScenario,
  onClearLogs,
}) => {
  const totalMotorists = motorists.length;
  const yieldedCount = motorists.filter(m => m.hasYielded || m.currentLane === 'right').length;
  const complianceRate = totalMotorists > 0 ? Math.round((yieldedCount / totalMotorists) * 100) : 100;

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Avg Clearance Latency</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-2 tabular-nums">
            14.2 <span className="text-sm font-normal text-slate-400">sec</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>68% faster than acoustic siren alone</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Golden Hour Transit Saved</span>
            <Activity className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-400 mt-2 tabular-nums">
            -4.5 <span className="text-sm font-normal text-slate-400">mins</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Critical stroke & cardiac threshold
          </span>
        </div>

        {/* Metric 3 */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Motorist Yield Compliance</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black font-mono text-sky-400 mt-2 tabular-nums">
            {complianceRate}%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {yieldedCount} of {totalMotorists} vehicles safe on shoulder
          </span>
        </div>

        {/* Metric 4 */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Green Wave Preemption</span>
            <Radio className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400 mt-2 tabular-nums">
            {signals.filter(s => s.state === 'preempted_green').length} / {signals.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Automated signal synchronization
          </span>
        </div>
      </div>

      {/* Middle Section: Scenarios & Live Event Log */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Scenarios (5 Cols) */}
        <div className="md:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold text-slate-200 tracking-wider">
                SIMULATION SCENARIOS
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Select real-world traffic conditions to test the automated pre-alert protocol:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => onTriggerScenario('rush_hour')}
                className="w-full text-left p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-rose-400 transition-colors">
                    Avenue Rush Hour Congestion
                  </span>
                  <span className="text-[10px] font-mono text-amber-400">High Density</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tight vehicle spacing with 3 cars in the central corridor lane requiring swift sequential pre-alerts.
                </p>
              </button>

              <button
                onClick={() => onTriggerScenario('highway_express')}
                className="w-full text-left p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-rose-400 transition-colors">
                    High-Speed Arterial Express
                  </span>
                  <span className="text-[10px] font-mono text-sky-400">90 km/h Rapid Run</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Ambulance at maximum code-3 cruising speed. Pre-alert cone expanded to 1,200m to allow high-speed merges.
                </p>
              </button>

              <button
                onClick={() => onTriggerScenario('dense_intersection')}
                className="w-full text-left p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-rose-400 transition-colors">
                    Multi-Signal Cross-Traffic Grid
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Signal Priority</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tests automated Green Wave preemption across 3 consecutive intersections with perpendicular traffic halting.
                </p>
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 mt-4 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300 block mb-0.5">V2X Security Certificate:</span>
            <span>IEEE 1609.2 compliant public key infrastructure. Verified emergency vehicle signature ID #EM-8820.</span>
          </div>
        </div>

        {/* Live V2X Communication & Security Log (7 Cols) */}
        <div className="md:col-span-7 p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200 tracking-wider">
                  REAL-TIME BROADCAST & TELEMETRY STREAM
                </span>
              </div>
              <button
                onClick={onClearLogs}
                className="text-[11px] text-slate-500 hover:text-slate-300 font-mono transition-colors cursor-pointer"
              >
                Clear Log
              </button>
            </div>

            {/* Log List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {logs.map((log) => {
                let badgeColor = 'text-slate-400 bg-slate-800';
                if (log.type === 'broadcast') badgeColor = 'text-rose-300 bg-rose-950 border border-rose-800';
                if (log.type === 'yield_confirmed') badgeColor = 'text-emerald-300 bg-emerald-950 border border-emerald-800';
                if (log.type === 'signal_preemption') badgeColor = 'text-amber-300 bg-amber-950 border border-amber-800';

                return (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-xs font-mono"
                  >
                    <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold shrink-0 ${badgeColor}`}>
                      {log.unit}
                    </span>
                    <span className="text-slate-300 flex-1">{log.message}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
            <span>Broadcasting to 7 registered V2X transponders</span>
            <span className="text-emerald-400">Zero packet drop</span>
          </div>
        </div>
      </div>
    </div>
  );
};
