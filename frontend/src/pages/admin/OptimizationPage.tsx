import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { RedistributionRecommendation, RouteResponse } from '../../types';
import {
  GitCompare,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Navigation,
  Sparkles,
  MapPin,
  Clock,
  Car,
  AlertTriangle,
  Route,
  Zap
} from 'lucide-react';

export const OptimizationPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Route Optimization state
  const [originLat, setOriginLat] = useState('17.4474');
  const [originLng, setOriginLng] = useState('78.3762');
  const [destLat, setDestLat] = useState('17.2403');
  const [destLng, setDestLng] = useState('78.4294');
  const [avoidCongested, setAvoidCongested] = useState(true);

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['redistributionRecs'],
    queryFn: () => api.getRedistributions(),
    refetchInterval: 6000,
  });

  const { data: routeData, refetch: calculateRoute, isFetching: isRouting } = useQuery({
    queryKey: ['routeOpt', originLat, originLng, destLat, destLng, avoidCongested],
    queryFn: () =>
      api.calculateRoute({
        origin_lat: parseFloat(originLat),
        origin_lng: parseFloat(originLng),
        destination_lat: parseFloat(destLat),
        destination_lng: parseFloat(destLng),
        avoid_congested: avoidCongested,
      }),
    enabled: false,
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.approveRedistribution(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redistributionRecs'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['liveFleet'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => api.rejectRedistribution(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redistributionRecs'] });
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Smart Fleet Redistribution & Route Engine</h1>
          <p className="text-xs text-slate-400 mt-1">
            Algorithmic surplus-to-deficit inter-depot vehicle transfers and congestion-aware A* pathfinding.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-400 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            Optimizer Engine: 1-Click Operational Dispatch
          </span>
        </div>
      </div>

      {/* Redistribution Recommendations Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-emerald-400" />
              <span>Active Depot Redistribution Recommendations</span>
            </h2>
            <p className="text-xs text-slate-400">
              Balances high workload depots with excess idle supply from adjacent hubs.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Pending Recommendations: <b>{recommendations.filter((r) => r.status === 'PENDING').length}</b>
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="h-36 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-slate-800 text-xs text-slate-400">
            No pending redistribution recommendations. Regional fleet distribution is currently balanced.
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => {
              const isPending = rec.status === 'PENDING';
              const isApproved = rec.status === 'APPROVED';

              let priorityBadge = 'bg-amber-950 text-amber-400 border-amber-800';
              if (rec.priority === 'CRITICAL') priorityBadge = 'bg-rose-950 text-rose-400 border-rose-800';
              else if (rec.priority === 'HIGH') priorityBadge = 'bg-orange-950 text-orange-400 border-orange-800';

              return (
                <div
                  key={rec.id}
                  className={`p-6 rounded-3xl border transition-all shadow-xl space-y-4 ${
                    isPending
                      ? 'border-emerald-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/20'
                      : 'border-slate-800 bg-slate-900/60 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl border ${priorityBadge}`}>
                        {rec.priority} PRIORITY
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Transfer #{rec.id} • Est. {rec.estimated_distance_km} km
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-bold px-3 py-1 rounded-xl border ${
                          isApproved
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : isPending
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                  </div>

                  {/* Transfer Route Visual Card */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 items-center gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Source (Surplus)</span>
                      <div className="text-sm font-bold text-white font-mono mt-0.5">
                        {rec.source_warehouse?.code || `Hub #${rec.source_warehouse_id}`}
                      </div>
                      <div className="text-slate-400 text-[11px] truncate">{rec.source_warehouse?.name}</div>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold text-emerald-400 font-mono px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800/60">
                        Move {rec.vehicle_count} Vehicles
                      </span>
                      <div className="flex items-center gap-2 text-slate-500 text-[10px] mt-1 font-mono">
                        <span>Transit ~{rec.estimated_distance_km} km</span>
                        <ArrowRight className="h-3 w-3 text-emerald-400" />
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Destination (Deficit)</span>
                      <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                        {rec.destination_warehouse?.code || `Hub #${rec.destination_warehouse_id}`}
                      </div>
                      <div className="text-slate-400 text-[11px] truncate">{rec.destination_warehouse?.name}</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    <b className="text-white">Optimization Rationale: </b>
                    {rec.reason}
                  </p>

                  {/* Action Buttons for Manager */}
                  {isPending && (
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => rejectMutation.mutate(rec.id)}
                        disabled={rejectMutation.isPending}
                        className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        Reject Recommendation
                      </button>

                      <button
                        onClick={() => approveMutation.mutate(rec.id)}
                        disabled={approveMutation.isPending}
                        className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{approveMutation.isPending ? 'Executing Batch Transfer...' : 'Approve Transfer Operation'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* A* Route Pathfinding Interactive Tool (Requirement 12) */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Route className="h-5 w-5 text-cyan-400" />
            <span>A* Route Optimization & Congestion Bypass Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Calculates shortest path vs congestion-aware alternate bypass routing using regional arterial node graph.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Origin (Lat, Lng)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={originLat}
                onChange={(e) => setOriginLat(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-xs"
              />
              <input
                type="text"
                value={originLng}
                onChange={(e) => setOriginLng(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-xs"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Default: Hitec City Mobility Hub</span>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Destination (Lat, Lng)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={destLat}
                onChange={(e) => setDestLat(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-xs"
              />
              <input
                type="text"
                value={destLng}
                onChange={(e) => setDestLng(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-xs"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Default: RGIA Airport Gateway</span>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={avoidCongested}
                onChange={(e) => setAvoidCongested(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span>Avoid Congestion Hotspots</span>
            </label>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => calculateRoute()}
              disabled={isRouting}
              className="w-full py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs shadow-lg shadow-cyan-400/20 transition-all"
            >
              {isRouting ? 'Solving A* Graph...' : 'Calculate Optimal Path'}
            </button>
          </div>
        </div>

        {/* Route Output Cards */}
        {routeData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            {/* Primary Recommended Route */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 font-mono">RECOMMENDED OPTIMAL ROUTE</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400">
                  {routeData.recommended_route.traffic_level}
                </span>
              </div>
              <div className="text-sm font-bold text-white">{routeData.recommended_route.route_name}</div>
              <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                <span>Distance: <b className="text-white font-mono">{routeData.recommended_route.distance_km} km</b></span>
                <span>Duration: <b className="text-emerald-400 font-mono">{routeData.recommended_route.duration_minutes} min</b></span>
              </div>
              <div className="space-y-1 pt-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Turn-by-turn guidance:</span>
                {routeData.recommended_route.turn_by_turn.map((step, idx) => (
                  <div key={idx} className="text-slate-400 text-[11px] flex items-center gap-1.5">
                    <span className="text-emerald-400 font-mono">{idx + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alternate Bypass Route */}
            {routeData.alternate_route && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-400 font-mono">ALTERNATE BYPASS ROUTE</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                    {routeData.alternate_route.traffic_level}
                  </span>
                </div>
                <div className="text-sm font-bold text-white">{routeData.alternate_route.route_name}</div>
                <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                  <span>Distance: <b className="text-white font-mono">{routeData.alternate_route.distance_km} km</b></span>
                  <span>Duration: <b className="text-cyan-400 font-mono">{routeData.alternate_route.duration_minutes} min</b></span>
                </div>
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Turn-by-turn guidance:</span>
                  {routeData.alternate_route.turn_by_turn.map((step, idx) => (
                    <div key={idx} className="text-slate-400 text-[11px] flex items-center gap-1.5">
                      <span className="text-cyan-400 font-mono">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
