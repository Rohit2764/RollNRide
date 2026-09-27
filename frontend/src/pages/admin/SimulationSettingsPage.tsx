import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Play, 
  Pause, 
  Zap, 
  Activity, 
  Gauge, 
  Sliders, 
  Cpu, 
  CheckCircle2, 
  Clock, 
  Compass, 
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../../api/client';
import { useSimulationStore } from '../../store/simulationStore';
import { LiveVehicleTelemetry } from '../../types';

export const SimulationSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { isRunning, speedMultiplier, setRunning, setSpeedMultiplier } = useSimulationStore();

  // Queries
  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ['simulation-status'],
    queryFn: () => api.get<{ is_running: boolean; speed_multiplier: number }>('/simulation/status'),
    refetchInterval: 3000
  });

  const { data: liveVehicles } = useQuery<LiveVehicleTelemetry[]>({
    queryKey: ['fleet-live'],
    queryFn: () => api.get<LiveVehicleTelemetry[]>('/fleet/live'),
    refetchInterval: 3000
  });

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) => api.post('/simulation/toggle', { enabled }),
    onSuccess: (res: any) => {
      setRunning(res.is_running);
      queryClient.invalidateQueries({ queryKey: ['simulation-status'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-live'] });
      queryClient.invalidateQueries({ queryKey: ['operations-dashboard'] });
    }
  });

  const speedMutation = useMutation({
    mutationFn: (speed: number) => api.post('/simulation/speed', { speed }),
    onSuccess: (res: any) => {
      setSpeedMultiplier(res.speed_multiplier);
      queryClient.invalidateQueries({ queryKey: ['simulation-status'] });
    }
  });

  const activeSimulation = status?.is_running ?? isRunning;
  const currentSpeed = status?.speed_multiplier ?? speedMultiplier;

  // Stats
  const movingVehicles = liveVehicles?.filter(v => v.speed > 5).length || 0;
  const inUseVehicles = liveVehicles?.filter(v => v.status === 'IN_USE').length || 0;
  const returningVehicles = liveVehicles?.filter(v => v.status === 'RETURNING').length || 0;
  const avgSpeed = liveVehicles && liveVehicles.length > 0
    ? Math.round(liveVehicles.reduce((acc, v) => acc + v.speed, 0) / liveVehicles.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-purple-400" />
            Autonomous Simulation Control Room
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Engine testbed for generating 100+ live synthetic vehicles, dynamic GPS breadcrumbs, and simulated booking lifecycles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleMutation.mutate(!activeSimulation)}
            disabled={toggleMutation.isPending}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg cursor-pointer ${
              activeSimulation
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 shadow-amber-500/10'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
            }`}
          >
            {activeSimulation ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                Pause Simulation Engine
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Start Autonomous Simulation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Engine Status Card */}
      <div className={`rounded-2xl p-6 border transition-all ${
        activeSimulation 
          ? 'bg-gradient-to-r from-purple-950/30 via-slate-900 to-blue-950/30 border-purple-500/40' 
          : 'bg-slate-800/40 border-slate-700/50'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
              activeSimulation 
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-400 animate-pulse' 
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              <Zap className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  activeSimulation ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                }`} />
                <h3 className="text-lg font-bold text-slate-100">
                  {activeSimulation ? 'Simulation Engine Running (Active)' : 'Simulation Paused (Idle)'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Background thread updating vehicle GPS coordinates, battery levels, traffic zone counters, and depot workloads every 2.0s.
              </p>
            </div>
          </div>

          {/* Speed Multiplier Controls */}
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-700/70">
            <span className="text-xs text-slate-400 px-3 font-medium">Clock Speed:</span>
            {[1.0, 2.0, 5.0, 10.0].map((spd) => (
              <button
                key={spd}
                onClick={() => speedMutation.mutate(spd)}
                disabled={speedMutation.isPending}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  currentSpeed === spd
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Simulation Telemetry Counter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Moving Vehicles</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Activity className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{movingVehicles}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-400">
            <span>Actively traversing road network</span>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Trips</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Compass className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{inUseVehicles}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-purple-400">
            <span>Customer reservations in transit</span>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Returning to Depot</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{returningVehicles}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-400">
            <span>Entering geofenced intake bays</span>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Simulated Fleet Avg Speed</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Gauge className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{avgSpeed} <span className="text-sm font-normal text-slate-400">km/h</span></p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400">
            <span>Dynamically throttled by traffic congestion</span>
          </div>
        </div>
      </div>

      {/* Simulation Architecture Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
            <Sliders className="w-4 h-4" />
            Autonomous Simulation Physics Engine
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The RollNRide background simulator runs an event loop designed to emulate real-world mobility fleet mechanics without manual data entry:
          </p>
          <ul className="text-xs text-slate-400 space-y-2.5 list-disc list-inside">
            <li><strong className="text-slate-200">Waypoints & Path Interpolation:</strong> Moving vehicles advance along real Hyderabad geospatial coordinates (Hitec City, Gachibowli, Secunderabad, Banjara Hills, Shamshabad).</li>
            <li><strong className="text-slate-200">Congestion-Aware Deceleration:</strong> When vehicles enter heavy traffic zones, their simulated velocity throttles from 55 km/h down to 18 km/h.</li>
            <li><strong className="text-slate-200">Battery & Fuel Depletion:</strong> Battery discharges proportionally to distance traveled and acceleration load.</li>
            <li><strong className="text-slate-200">Depot Intake Lifecycle:</strong> Vehicles returning to warehouses automatically spawn cleaning tasks in the turnaround queue and update warehouse workload scores.</li>
          </ul>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
            <Info className="w-4 h-4" />
            Demonstration Tips for Evaluators
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            To see real-time updates across the platform during live testing:
          </p>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs text-slate-300">
              <span className="font-semibold text-blue-400">1. Watch the Fleet Map:</span> Head over to the <strong className="text-slate-100">Operations Center</strong>. Vehicles will glide along road corridors with real-time heading rotation.
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs text-slate-300">
              <span className="font-semibold text-purple-400">2. Observe Dynamic Workload:</span> Check the <strong className="text-slate-100">Warehouses</strong> page to watch workload scores adjust as trips dispatch and return.
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs text-slate-300">
              <span className="font-semibold text-emerald-400">3. Speed Multiplier:</span> Set speed to <strong className="text-slate-100">5x or 10x</strong> to simulate an entire 24-hour day of bookings and revenue in a few minutes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationSettingsPage;
