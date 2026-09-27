import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Warehouse } from '../../types';
import {
  Warehouse as WhIcon,
  Car,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';

export const WarehousesPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.getWarehouses(),
    refetchInterval: 6000,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Warehouse Hub Network
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time workload scoring, capacity distribution, dispatch/return queues, and turn-around monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-emerald-400 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Dynamic Workload Formula: 0.25·B + 0.20·D + 0.15·R + 0.15·M + 0.10·C + 0.15·S
          </span>
        </div>
      </div>

      {/* Grid of Warehouse Hubs */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-72 rounded-3xl bg-slate-900 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((wh) => {
            const isOverloaded = wh.workload_score >= 80;
            const isHighLoad = wh.workload_score >= 60 && wh.workload_score < 80;

            let statusColor = 'text-emerald-400 border-emerald-500/40 bg-emerald-950/60';
            if (isOverloaded) statusColor = 'text-rose-400 border-rose-500/40 bg-rose-950/60';
            else if (isHighLoad) statusColor = 'text-amber-400 border-amber-500/40 bg-amber-950/60';

            return (
              <div
                key={wh.id}
                className="group rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between shadow-xl"
              >
                <div className="p-6 space-y-4">
                  {/* Top Bar: Code & Workload Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400">
                        <WhIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-xs text-emerald-400">{wh.code}</span>
                        <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {wh.name}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${statusColor}`}>
                        {wh.workload_score}% Load
                      </span>
                      <span className="block text-[10px] text-slate-400 uppercase font-semibold mt-1">
                        {wh.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{wh.address}</span>
                  </div>

                  {/* Workload Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Capacity Utilization</span>
                      <span className="font-mono font-bold text-white">
                        {wh.current_vehicle_count} / {wh.capacity} vehicles
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isOverloaded ? 'bg-rose-500' : isHighLoad ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (wh.current_vehicle_count / wh.capacity) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Operational Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Available</span>
                      <b className="text-sm font-mono text-emerald-400">{wh.available_vehicle_count}</b>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pending Dispatch</span>
                      <b className="text-sm font-mono text-amber-400">{wh.pending_dispatches}</b>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Incoming Returns</span>
                      <b className="text-sm font-mono text-cyan-400">{wh.pending_returns}</b>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Turnaround Bay</span>
                      <b className="text-sm font-mono text-indigo-400">{wh.cleaning_count + wh.maintenance_count}</b>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <button
                    onClick={() => navigate(`/admin/warehouses/${wh.id}`)}
                    className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Inspect Queues & Formula Breakdown</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
