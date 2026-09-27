import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { FleetMap } from '../../components/map/FleetMap';
import { TrafficZone, TrafficIncident } from '../../types';
import {
  Flame,
  Gauge,
  AlertTriangle,
  Clock,
  Navigation,
  MapPin,
  TrendingDown,
  Plus,
  X,
  CheckCircle2
} from 'lucide-react';

export const TrafficPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState<string>('live');
  const [showIncidentModal, setShowIncidentModal] = useState<boolean>(false);

  // New incident form state
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState('MAJOR');
  const [incidentLat, setIncidentLat] = useState('17.4350');
  const [incidentLng, setIncidentLng] = useState('78.4420');

  const { data: trafficZones = [], isLoading } = useQuery({
    queryKey: ['trafficLive'],
    queryFn: () => api.getTrafficLive(),
    refetchInterval: 6000,
  });

  const { data: heatmapData } = useQuery({
    queryKey: ['trafficHeatmap', timeRange],
    queryFn: () => api.getTrafficHeatmap(timeRange),
    refetchInterval: 10000,
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['trafficIncidents'],
    queryFn: () => api.getTrafficIncidents(),
    refetchInterval: 8000,
  });

  const createIncidentMutation = useMutation({
    mutationFn: (data: any) => api.post('/traffic/incidents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trafficIncidents'] });
      queryClient.invalidateQueries({ queryKey: ['trafficLive'] });
      setShowIncidentModal(false);
      setIncidentTitle('');
      setIncidentDesc('');
    },
  });

  const avgSpeed = heatmapData?.average_speed_kmh ?? 34.2;
  const congestionIndex = heatmapData?.congestion_index ?? 32.5;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Traffic Intelligence & Congestion Engine</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time urban corridor speed monitoring, congestion severity levels, and automated routing impedance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            {(['live', '1h', 'today', '7d', '30d'] as const).map((tr) => (
              <button
                key={tr}
                onClick={() => setTimeRange(tr)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] uppercase transition-colors ${
                  timeRange === tr
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tr}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowIncidentModal(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-rose-500/20"
          >
            <Plus className="h-4 w-4" />
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* Top Key Traffic Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Urban Avg Speed</span>
          <div className="text-2xl font-extrabold text-white font-mono">{avgSpeed} <span className="text-xs font-normal text-slate-400">km/h</span></div>
          <span className="text-[11px] text-emerald-400">Arterial flow nominal</span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Congestion Index</span>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">{congestionIndex} / 100</div>
          <span className="text-[11px] text-slate-400">Moderate regional impedance</span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Active Incidents</span>
          <div className="text-2xl font-extrabold text-rose-400 font-mono">{incidents.length}</div>
          <span className="text-[11px] text-slate-400">Punjagutta corridor blocked</span>
        </div>

        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Peak Window</span>
          <div className="text-sm font-bold text-cyan-400 font-mono mt-1">05:30 PM - 08:30 PM</div>
          <span className="text-[11px] text-slate-400">Forecasted rush surge</span>
        </div>
      </div>

      {/* Interactive Map with Traffic Zones & Heatmap */}
      <div className="h-96 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
        <FleetMap
          trafficZones={trafficZones}
          showHeatmap={true}
          zoom={12}
        />
        <div className="absolute top-4 right-4 z-10 glass-panel px-3 py-1.5 rounded-xl text-[11px] text-white flex items-center gap-2">
          <Flame className="h-4 w-4 text-rose-400" />
          <span>Heatmap Layer: <b>{timeRange.toUpperCase()}</b></span>
        </div>
      </div>

      {/* Congestion Zones Breakdown Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Monitored Hyderabad Traffic Corridors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trafficZones.map((z) => {
            let badgeBg = 'bg-emerald-950 text-emerald-400 border-emerald-800';
            if (z.congestion_level === 'SEVERE') badgeBg = 'bg-rose-950 text-rose-400 border-rose-800';
            else if (z.congestion_level === 'HEAVY') badgeBg = 'bg-orange-950 text-orange-400 border-orange-800';
            else if (z.congestion_level === 'MODERATE') badgeBg = 'bg-amber-950 text-amber-400 border-amber-800';

            return (
              <div
                key={z.id}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-400">{z.code}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badgeBg}`}>
                      {z.congestion_level}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{z.name}</h3>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Avg Speed</span>
                    <b className="font-mono text-white text-sm">{z.current_speed_avg} km/h</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Density</span>
                    <b className="font-mono text-white text-sm">{z.vehicle_density} veh</b>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Traffic Incidents */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          <span>Active Incident Reports & Bottlenecks</span>
        </h2>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Severity</th>
                  <th className="px-5 py-3">Incident</th>
                  <th className="px-5 py-3">Coordinates</th>
                  <th className="px-5 py-3">Reported Time</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-bold text-white">{inc.title}</div>
                      <div className="text-[11px] text-slate-400">{inc.description}</div>
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-400">
                      {inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)}
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {new Date(inc.reported_at).toLocaleTimeString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                        <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
                        Active Impact
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Report Incident Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span>Report Road Incident</span>
              </h3>
              <button
                onClick={() => setShowIncidentModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  value={incidentTitle}
                  onChange={(e) => setIncidentTitle(e.target.value)}
                  placeholder="e.g. Disabled truck blocking left lane"
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  placeholder="Additional details for routing engine..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white focus:outline-none focus:border-emerald-500 h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={incidentLat}
                    onChange={(e) => setIncidentLat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Longitude</label>
                  <input
                    type="text"
                    value={incidentLng}
                    onChange={(e) => setIncidentLng(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowIncidentModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  createIncidentMutation.mutate({
                    title: incidentTitle,
                    description: incidentDesc,
                    severity: incidentSeverity,
                    latitude: parseFloat(incidentLat),
                    longitude: parseFloat(incidentLng),
                  })
                }
                disabled={!incidentTitle}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-md shadow-rose-500/20 disabled:opacity-50"
              >
                Publish Incident
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
