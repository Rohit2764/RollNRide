import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  Warehouse as WhIcon,
  ArrowLeft,
  Activity,
  Car,
  Clock,
  Sparkles,
  Users,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Flame,
  ArrowRight
} from 'lucide-react';

export const WarehouseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const warehouseId = Number(id);

  const { data: warehouse, isLoading } = useQuery({
    queryKey: ['warehouseDetail', warehouseId],
    queryFn: () => api.getWarehouse(warehouseId),
    refetchInterval: 5000,
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ['warehouseStaff', warehouseId],
    queryFn: () => api.getStaff(warehouseId),
  });

  const { data: cleaningTasks = [] } = useQuery({
    queryKey: ['cleaningQueue', warehouseId],
    queryFn: () => api.getCleaningQueue(warehouseId),
  });

  const { data: maintenanceRecords = [] } = useQuery({
    queryKey: ['maintenanceRecords', warehouseId],
    queryFn: () => api.getMaintenanceRecords(warehouseId),
  });

  if (isLoading || !warehouse) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-40 rounded-3xl bg-slate-900 border border-slate-800 animate-pulse" />
      </div>
    );
  }

  const factors = warehouse.contributing_factors;
  const isCritical = warehouse.workload_score >= 80;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/warehouses')}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Depot Network</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/optimization')}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Open Redistribution Optimizer</span>
          </button>
        </div>
      </div>

      {/* Main Depot Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
              <WhIcon className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">{warehouse.name}</h1>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  {warehouse.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                <span>{warehouse.address} (Lat {warehouse.latitude.toFixed(4)}, Lng {warehouse.longitude.toFixed(4)})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="text-right">
              <div className="text-[10px] uppercase font-semibold text-slate-400">Workload Index</div>
              <div className={`text-3xl font-extrabold font-mono ${isCritical ? 'text-rose-400' : 'text-emerald-400'}`}>
                {warehouse.workload_score}%
              </div>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-xl uppercase font-mono ${
                isCritical
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {warehouse.status}
            </span>
          </div>
        </div>

        {/* AI Recommendation Banner */}
        {factors && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Automated Allocation Recommendation
              </div>
              <p className="text-xs text-slate-200 mt-0.5 font-medium leading-relaxed">
                "{factors.recommended_action}"
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Drivers: {factors.summary}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Workload Formula Breakdown Cards (Requirement 6) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>Dynamic Workload Formula Decomposition</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Score = Σ(Weight × Normalized Component)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* Booking Load (25%) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="text-slate-400 font-semibold text-[11px]">Booking Load (25%)</div>
            <div className="text-xl font-bold font-mono text-white">{factors?.booking_load ?? 0}%</div>
            <div className="text-[10px] text-slate-500">Active vs Capacity ratio</div>
          </div>

          {/* Dispatch Load (20%) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="text-slate-400 font-semibold text-[11px]">Dispatch Load (20%)</div>
            <div className="text-xl font-bold font-mono text-amber-400">{factors?.dispatch_load ?? 0}%</div>
            <div className="text-[10px] text-slate-500">{warehouse.pending_dispatches} dispatches queued</div>
          </div>

          {/* Return Load (15%) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="text-slate-400 font-semibold text-[11px]">Return Load (15%)</div>
            <div className="text-xl font-bold font-mono text-cyan-400">{factors?.return_load ?? 0}%</div>
            <div className="text-[10px] text-slate-500">{warehouse.pending_returns} returns arriving</div>
          </div>

          {/* Maintenance Load (15%) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="text-slate-400 font-semibold text-[11px]">Maint Load (15%)</div>
            <div className="text-xl font-bold font-mono text-rose-400">{factors?.maintenance_load ?? 0}%</div>
            <div className="text-[10px] text-slate-500">{warehouse.maintenance_count} vehicles in bay</div>
          </div>

          {/* Cleaning Load (10%) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="text-slate-400 font-semibold text-[11px]">Cleaning Load (10%)</div>
            <div className="text-xl font-bold font-mono text-indigo-400">{factors?.cleaning_load ?? 0}%</div>
            <div className="text-[10px] text-slate-500">{warehouse.cleaning_count} in turnaround</div>
          </div>

          {/* Staff Pressure (15%) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="text-slate-400 font-semibold text-[11px]">Staff Pressure (15%)</div>
            <div className="text-xl font-bold font-mono text-emerald-400">{factors?.staff_pressure ?? 0}%</div>
            <div className="text-[10px] text-slate-500">{warehouse.staff_count} assigned staff</div>
          </div>
        </div>
      </div>

      {/* Historical Workload Chart */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">24-Hour Historical Workload Profile</h3>
            <p className="text-xs text-slate-400">Recorded hourly workload variation under dispatch/return flux.</p>
          </div>
          <span className="text-xs font-mono text-slate-400">Depot: {warehouse.code}</span>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={warehouse.historical_workload || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Operational Queues & Staff Roster Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cleaning & Turnaround Queue */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span>Turnaround & Sanitization Bay</span>
            </h3>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {cleaningTasks.length} queued
            </span>
          </div>

          <div className="divide-y divide-slate-800 text-xs">
            {cleaningTasks.length === 0 ? (
              <div className="py-8 text-center text-slate-500">No vehicles queued in turnaround bay</div>
            ) : (
              cleaningTasks.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-white">
                      {t.vehicle?.registration_number || `Vehicle #${t.vehicle_id}`}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Standard {t.duration_minutes} min inspection & detailing
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-300">
                    {t.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Depot Workforce Roster */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <span>Assigned Warehouse Staff</span>
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {staffList.length} personnel
            </span>
          </div>

          <div className="divide-y divide-slate-800 text-xs">
            {staffList.length === 0 ? (
              <div className="py-8 text-center text-slate-500">No staff currently assigned</div>
            ) : (
              staffList.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">{s.user?.name || s.employee_code}</div>
                    <div className="text-[11px] text-slate-400">
                      Shift: {s.shift} • Tasks completed: {s.tasks_completed_today}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-emerald-400">
                    {s.working_status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
