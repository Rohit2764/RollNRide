import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  Car,
  TrendingUp,
  Warehouse,
  Flame,
  CreditCard,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Battery
} from 'lucide-react';

export const ExecutiveDashboardPage: React.FC = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: () => api.getDashboardAnalytics(),
    refetchInterval: 8000,
  });

  if (isLoading || !analytics) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { fleet, bookings, warehouse, traffic, ai_insights, revenue_trend, fleet_utilization_trend, warehouse_workload_distribution } = analytics;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Executive & Operational BI</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time fleet utilization, depot workload balancing, revenue analytics and predictive intelligence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300">
            Auto-refresh: 8s
          </span>
        </div>
      </div>

      {/* Top KPI Cards (5 Pillars) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Fleet KPI */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Fleet Utilization</span>
            <Car className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{fleet.utilization_rate}%</div>
          <div className="text-[11px] text-slate-400 flex justify-between pt-1 border-t border-slate-800/80">
            <span>{fleet.in_use_vehicles} in use</span>
            <span className="text-emerald-400 font-medium">{fleet.available_vehicles} available</span>
          </div>
        </div>

        {/* Bookings & Revenue KPI */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Today's Revenue</span>
            <CreditCard className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono">₹{bookings.revenue_today.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 flex justify-between pt-1 border-t border-slate-800/80">
            <span>{bookings.today_count} trips</span>
            <span className="text-white">Avg ₹{bookings.average_booking_value}</span>
          </div>
        </div>

        {/* Warehouse Workload KPI */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Avg Depot Workload</span>
            <Warehouse className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">{warehouse.average_workload}%</div>
          <div className="text-[11px] text-slate-400 flex justify-between pt-1 border-t border-slate-800/80">
            <span className="truncate">Peak: {warehouse.highest_workload_name}</span>
            <b className={warehouse.highest_workload_score > 80 ? 'text-rose-400' : 'text-slate-300'}>
              {warehouse.highest_workload_score}%
            </b>
          </div>
        </div>

        {/* Traffic Speed KPI */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Regional Traffic</span>
            <Flame className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{traffic.average_speed_kmh} <span className="text-xs font-normal text-slate-400">km/h</span></div>
          <div className="text-[11px] text-slate-400 flex justify-between pt-1 border-t border-slate-800/80">
            <span>Level: <b className="text-amber-400">{traffic.current_congestion_level}</b></span>
            <span>{traffic.active_incidents} incidents</span>
          </div>
        </div>

        {/* Operations Queue Backlog */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Operations Queue</span>
            <TrendingUp className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {warehouse.pending_dispatches + warehouse.pending_returns}
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between pt-1 border-t border-slate-800/80">
            <span>{warehouse.pending_dispatches} dispatches</span>
            <span className="text-cyan-400">{warehouse.pending_returns} returns</span>
          </div>
        </div>
      </div>

      {/* AI Operations Insights Panel (Requirement 59) */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Operations Insights & Explainability</h2>
              <p className="text-[11px] text-slate-400">Contextual intelligence explaining root cause drivers and proactive interventions.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
            AI Engine Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ai_insights.map((insight) => (
            <div
              key={insight.id}
              className="p-4 rounded-2xl border border-slate-800 bg-slate-900/80 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      insight.severity === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800/50'
                        : insight.severity === 'WARNING'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                        : 'bg-cyan-950 text-cyan-400 border border-cyan-800/50'
                    }`}
                  >
                    {insight.category} • {insight.severity}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Confidence: {(insight.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{insight.title}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{insight.explanation}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-emerald-300 flex items-start gap-2">
                <ArrowRight className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-emerald-400">Recommended Action: </span>
                  <span>{insight.recommended_action}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">7-Day Revenue & Trip Volume</h3>
            <span className="text-xs text-slate-400">Currency in INR (₹)</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue_trend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Fleet Utilization */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Fleet Utilization Over Diurnal Cycle (%)</h3>
            <span className="text-xs text-emerald-400 font-mono">Peak: 84% at 18:00</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fleet_utilization_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Line type="monotone" dataKey="utilization" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Warehouse Workload Distribution Bar Chart */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Depot Workload Index Comparison (0 - 100)</h3>
            <p className="text-xs text-slate-400">Score &gt; 80 indicates critical capacity pressure requiring vehicle reallocation.</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1 text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Normal</span>
            <span className="flex items-center gap-1 text-amber-400"><span className="h-2 w-2 rounded-full bg-amber-400" /> High Load</span>
            <span className="flex items-center gap-1 text-rose-400"><span className="h-2 w-2 rounded-full bg-rose-400" /> Overloaded</span>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={warehouse_workload_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="code" stroke="#64748b" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
              />
              <Bar dataKey="workload" fill="#38bdf8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
