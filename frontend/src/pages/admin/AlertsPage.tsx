import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Trash2, 
  Check, 
  Filter, 
  Bell, 
  ShieldAlert, 
  RefreshCw,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Alert } from '../../types';

export const AlertsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);

  // Queries
  const { data: alerts, isLoading, isFetching, refetch } = useQuery<Alert[]>({
    queryKey: ['alerts', severityFilter, unreadOnly],
    queryFn: () => {
      const params = new URLSearchParams();
      if (unreadOnly) params.append('unread_only', 'true');
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      return api.get<Alert[]>(`/notifications?${params.toString()}`);
    },
    refetchInterval: 8000
  });

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });

  const dismissMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });

  const criticalCount = alerts?.filter(a => a.severity === 'CRITICAL').length || 0;
  const warningCount = alerts?.filter(a => a.severity === 'WARNING').length || 0;
  const infoCount = alerts?.filter(a => a.severity === 'INFO').length || 0;
  const unreadCount = alerts?.filter(a => !a.is_read).length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            Operational Alert & Anomaly Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time heuristic & telematics anomaly engine monitoring speed violations, low battery, and depot bottlenecks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-400' : ''}`} />
            Run Anomaly Scan
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-md border border-rose-500/30 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Critical Anomalies</span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{criticalCount}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-400">
            <span>Requires immediate operator intervention</span>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md border border-amber-500/30 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Warnings</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{warningCount}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-400">
            <span>Potential depot/traffic threshold drifts</span>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Info Notices</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Info className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{infoCount}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-400">
            <span>Routine system event updates</span>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Unread Backlog</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Bell className="w-5 h-5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{unreadCount}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-purple-400">
            <span>Awaiting supervisor acknowledgment</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent text-slate-200 border-none outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Severities</option>
              <option value="CRITICAL" className="bg-slate-900">Critical Only</option>
              <option value="WARNING" className="bg-slate-900">Warnings Only</option>
              <option value="INFO" className="bg-slate-900">Info Only</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-0"
            />
            Unread only
          </label>
        </div>

        <span className="text-xs text-slate-400">
          Total alerts: <span className="font-semibold text-slate-200">{alerts?.length || 0}</span>
        </span>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Scanning operational telemetry...</div>
        ) : !alerts || alerts.length === 0 ? (
          <div className="p-16 text-center bg-slate-800/30 border border-slate-700/50 rounded-2xl">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-90" />
            <h3 className="text-base font-semibold text-slate-200">System Healthy — No Anomalies Detected</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              All fleet telemetry, warehouse workload thresholds, and traffic speed sensors are running within normal parameters.
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 rounded-2xl border transition-all ${
                alert.severity === 'CRITICAL'
                  ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60'
                  : alert.severity === 'WARNING'
                  ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60'
                  : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
              } ${!alert.is_read ? 'ring-1 ring-blue-500/30' : 'opacity-80'}`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : alert.severity === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {alert.severity === 'CRITICAL' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : alert.severity === 'WARNING' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-2xs font-bold uppercase tracking-wider ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-rose-500/30 text-rose-200'
                          : alert.severity === 'WARNING'
                          ? 'bg-amber-500/30 text-amber-200'
                          : 'bg-blue-500/30 text-blue-200'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-2xs font-mono text-slate-400 uppercase">
                        TYPE: {alert.type}
                      </span>
                      {alert.entity_type && (
                        <span className="text-2xs px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">
                          {alert.entity_type} #{alert.entity_id}
                        </span>
                      )}
                      {!alert.is_read && (
                        <span className="text-2xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded font-semibold">
                          NEW
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-slate-100 mt-1.5">
                      {alert.title}
                    </h4>

                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {alert.message}
                    </p>

                    {alert.suggested_action && (
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-center gap-2 text-xs text-emerald-300">
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span><strong>Recommended Action:</strong> {alert.suggested_action}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 flex-shrink-0">
                  <span className="text-2xs font-mono text-slate-400">
                    {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>

                  <div className="flex items-center gap-2">
                    {!alert.is_read && (
                      <button
                        onClick={() => markReadMutation.mutate(alert.id)}
                        disabled={markReadMutation.isPending}
                        title="Mark as Read"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => dismissMutation.mutate(alert.id)}
                      disabled={dismissMutation.isPending}
                      title="Dismiss Alert"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 border border-slate-700 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
