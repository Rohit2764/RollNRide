import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Calendar,
  Warehouse as WhIcon,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const DemandForecastPage: React.FC = () => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>(undefined);
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.getWarehouses(),
  });

  const { data: forecast, isLoading } = useQuery({
    queryKey: ['demandForecast', selectedWarehouseId, targetDate],
    queryFn: () => api.getDemandForecast(selectedWarehouseId, targetDate),
    refetchInterval: 12000,
  });

  if (isLoading || !forecast) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-64 rounded-3xl bg-slate-900 border border-slate-800 animate-pulse" />
      </div>
    );
  }

  const hasShortage = forecast.projected_net_shortage > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Depot/Date Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Predictive Demand Forecasting</h1>
          <p className="text-xs text-slate-400 mt-1">
            Hourly diurnal demand modeling, supply deficit calculations, and proactive fleet pre-staging recommendations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedWarehouseId || ''}
            onChange={(e) => setSelectedWarehouseId(e.target.value ? Number(e.target.value) : undefined)}
            className="py-2 px-3 rounded-xl border border-slate-700 bg-slate-900 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Hyderabad Depots</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} — {w.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="py-1.5 px-3 rounded-xl border border-slate-700 bg-slate-900 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* KPI Headline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900 shadow-xl space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Total Projected Demand</span>
          <div className="text-3xl font-extrabold text-white font-mono">{forecast.total_predicted_demand}</div>
          <span className="text-[11px] text-slate-400">Predicted reservation volume today</span>
        </div>

        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900 shadow-xl space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Available Supply</span>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono">{forecast.current_available_supply}</div>
          <span className="text-[11px] text-slate-400">Unreserved fleet in depot bays</span>
        </div>

        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900 shadow-xl space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Projected Fleet Deficit</span>
          <div className={`text-3xl font-extrabold font-mono ${hasShortage ? 'text-rose-400' : 'text-emerald-400'}`}>
            {hasShortage ? `-${forecast.projected_net_shortage}` : '0'}
          </div>
          <span className={`text-[11px] ${hasShortage ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
            {hasShortage ? 'Shortage alert triggered' : 'Optimal buffer maintained'}
          </span>
        </div>
      </div>

      {/* AI Actionable Pre-Staging Recommendation (Requirement 14) */}
      <div className="p-6 rounded-3xl bg-gradient-to-tr from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-2xl flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 shrink-0">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
            Strategic Pre-Staging Recommendation
          </span>
          <h3 className="text-base font-bold text-white leading-relaxed">
            "{forecast.recommendation}"
          </h3>
          <p className="text-xs text-slate-400 pt-1">
            Target Depot: <b className="text-slate-200">{forecast.warehouse_name}</b> • Forecast Horizon: 24 Hours
          </p>
        </div>
      </div>

      {/* 24-Hour Prediction Curve vs Supply Chart */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Diurnal Demand Curve vs Available Supply</h3>
            <p className="text-xs text-slate-400">Hourly volume comparison highlighting shortage risk windows.</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400"><span className="h-2 w-2 rounded-full bg-cyan-400" /> Predicted Demand</span>
            <span className="flex items-center gap-1.5 text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Available Supply</span>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast.hourly_forecast}>
              <defs>
                <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour_label" stroke="#64748b" fontSize={10} interval={2} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="predicted_demand" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDemand)" />
              <Area type="monotone" dataKey="available_supply" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSupply)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Forecast Accuracy Validation */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Historical Model Validation & Accuracy Tracking</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {forecast.historical_comparison.map((h, i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-800 bg-slate-900 space-y-2">
              <div className="text-xs font-semibold text-slate-400">{h.day}</div>
              <div className="text-xl font-bold font-mono text-white">{h.actual_demand} trips</div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-xs">
                <span className="text-slate-400">Fulfillment:</span>
                <span className="text-emerald-400 font-bold font-mono">{h.fulfillment_rate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
