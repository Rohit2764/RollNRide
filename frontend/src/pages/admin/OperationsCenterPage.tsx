import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { FleetMap } from '../../components/map/FleetMap';
import { LiveVehicleTelemetry, Warehouse, TrafficZone } from '../../types';
import {
  Search,
  Filter,
  Layers,
  Flame,
  Battery,
  Gauge,
  Warehouse as WhIcon,
  Navigation,
  Clock,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const OperationsCenterPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState<number | 'ALL'>('ALL');
  const [search, setSearch] = useState<string>('');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);

  // Selected telemetry drawer state
  const [selectedVehicle, setSelectedVehicle] = useState<LiveVehicleTelemetry | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  // Data Queries
  const { data: liveFleet = [] } = useQuery({
    queryKey: ['liveFleet'],
    queryFn: () => api.getLiveFleet(),
    refetchInterval: 3000,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.getWarehouses(),
    refetchInterval: 6000,
  });

  const { data: trafficZones = [] } = useQuery({
    queryKey: ['trafficLive'],
    queryFn: () => api.getTrafficLive(),
    refetchInterval: 8000,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
    refetchInterval: 8000,
  });

  // Filtered vehicles
  const filteredVehicles = liveFleet.filter((v) => {
    if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;
    if (warehouseFilter !== 'ALL' && v.warehouse_id !== warehouseFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const match =
        v.registration_number.toLowerCase().includes(s) ||
        v.model.toLowerCase().includes(s) ||
        v.brand.toLowerCase().includes(s);
      if (!match) return false;
    }
    return true;
  });

  // KPI Calculations
  const activeCount = liveFleet.filter((v) => v.status === 'IN_USE').length;
  const avgSpeed =
    liveFleet.length > 0
      ? (liveFleet.reduce((acc, v) => acc + v.speed, 0) / liveFleet.length).toFixed(1)
      : '0.0';
  const overloadedHubs = warehouses.filter((w) => w.workload_score >= 80).length;
  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL' && !a.is_read).length;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-slate-950">
      {/* 3-Column Operations Command Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Filters & Fleet List */}
        <div className="w-80 shrink-0 border-r border-slate-800 bg-slate-950/80 backdrop-blur-md flex flex-col justify-between hidden md:flex">
          {/* Filters Header */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-emerald-400" />
                Fleet Filters
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {filteredVehicles.length} / {liveFleet.length}
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Registration or model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Status Tabs */}
            <div className="grid grid-cols-3 gap-1 text-[10px] font-semibold">
              {['ALL', 'AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETURNING'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`py-1 rounded-lg transition-colors truncate px-1 ${
                    statusFilter === st
                      ? 'bg-emerald-500 text-black font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Hub Selector & Heatmap Toggle */}
            <div className="flex items-center gap-2">
              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="flex-1 py-1 px-2 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Hyderabad Hubs</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} ({w.workload_score}%)
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                  showHeatmap
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title="Toggle traffic congestion heatmap layer"
              >
                <Flame className="h-3.5 w-3.5" />
                <span className="text-[10px]">Heatmap</span>
              </button>
            </div>
          </div>

          {/* Scrollable Vehicle List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
            {filteredVehicles.map((v) => (
              <div
                key={v.vehicle_id}
                onClick={() => {
                  setSelectedVehicle(v);
                  setSelectedWarehouse(null);
                }}
                className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                  selectedVehicle?.vehicle_id === v.vehicle_id
                    ? 'bg-emerald-500/10 border border-emerald-500/40'
                    : 'hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-xs text-white">{v.registration_number}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                      v.status === 'AVAILABLE'
                        ? 'bg-emerald-950 text-emerald-400'
                        : v.status === 'IN_USE'
                        ? 'bg-cyan-950 text-cyan-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {v.brand} {v.model} • {v.warehouse_name || 'En Route'}
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3 w-3 text-cyan-400" />
                    {v.speed} km/h
                  </span>
                  <span className="flex items-center gap-1">
                    <Battery className="h-3 w-3 text-emerald-400" />
                    {v.battery}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Column: Full-Screen Interactive Leaflet Map */}
        <div className="flex-1 relative">
          <FleetMap
            vehicles={filteredVehicles}
            warehouses={warehouses}
            trafficZones={trafficZones}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={(veh) => {
              setSelectedVehicle(veh);
              setSelectedWarehouse(null);
            }}
            onSelectWarehouse={(wh) => {
              setSelectedWarehouse(wh);
              setSelectedVehicle(null);
            }}
            showHeatmap={showHeatmap}
          />
        </div>

        {/* Right Column: Dynamic Live Telemetry Drawer */}
        {(selectedVehicle || selectedWarehouse) && (
          <div className="w-84 shrink-0 border-l border-slate-800 bg-slate-950/95 backdrop-blur-md p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* If Vehicle Selected */}
            {selectedVehicle && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-white text-sm">Vehicle Telemetry</span>
                  </div>
                  <button
                    onClick={() => setSelectedVehicle(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-base font-bold text-white font-mono">{selectedVehicle.registration_number}</div>
                  <div className="text-xs text-slate-300">{selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.vehicle_type})</div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between">
                    <span className="text-slate-400">Current Status</span>
                    <span className="font-mono font-bold text-emerald-400">{selectedVehicle.status}</span>
                  </div>
                </div>

                {/* Gauges */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1 mb-1">
                      <Gauge className="h-3 w-3 text-cyan-400" />
                      Speed
                    </div>
                    <div className="text-lg font-mono font-bold text-white">{selectedVehicle.speed} <span className="text-xs font-normal">km/h</span></div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1 mb-1">
                      <Battery className="h-3 w-3 text-emerald-400" />
                      Battery
                    </div>
                    <div className="text-lg font-mono font-bold text-emerald-400">{selectedVehicle.battery}%</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">GPS Coordinates:</span>
                    <span className="font-mono text-white text-[11px]">{selectedVehicle.latitude.toFixed(4)}, {selectedVehicle.longitude.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Depot:</span>
                    <span className="text-white">{selectedVehicle.warehouse_name}</span>
                  </div>
                  {selectedVehicle.customer_name && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Renter:</span>
                      <span className="text-cyan-400 font-bold">{selectedVehicle.customer_name}</span>
                    </div>
                  )}
                  {selectedVehicle.destination && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Destination:</span>
                      <span className="text-white">{selectedVehicle.destination} (~{selectedVehicle.eta_minutes || 20}m)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* If Warehouse Selected */}
            {selectedWarehouse && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <WhIcon className="h-4 w-4 text-cyan-400" />
                    <span className="font-bold text-white text-sm">{selectedWarehouse.code} Hub</span>
                  </div>
                  <button
                    onClick={() => setSelectedWarehouse(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-sm font-bold text-white">{selectedWarehouse.name}</div>
                  <div className="text-slate-400 text-[11px]">{selectedWarehouse.address}</div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Workload Score:</span>
                    <b className={`text-sm font-mono ${selectedWarehouse.workload_score > 80 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {selectedWarehouse.workload_score}%
                    </b>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Available Fleet</span>
                    <b className="text-sm text-emerald-400">{selectedWarehouse.available_vehicle_count}</b>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Pending Dispatches</span>
                    <b className="text-sm text-amber-400">{selectedWarehouse.pending_dispatches}</b>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Incoming Returns</span>
                    <b className="text-sm text-cyan-400">{selectedWarehouse.pending_returns}</b>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Cleaning Bay</span>
                    <b className="text-sm text-indigo-400">{selectedWarehouse.cleaning_count}</b>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Real-Time KPI Bar */}
      <div className="border-t border-slate-800 bg-slate-900 px-6 py-2.5 shrink-0 flex items-center justify-between text-xs z-10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-slate-400">Active In-Use Trips:</span>
            <b className="text-white font-mono text-sm">{activeCount}</b>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Gauge className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400">Fleet Avg Speed:</span>
            <b className="text-white font-mono text-sm">{avgSpeed} km/h</b>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <WhIcon className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400">Overloaded Depots:</span>
            <b className={`font-mono text-sm ${overloadedHubs > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {overloadedHubs}
            </b>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            <span className="text-slate-400">Critical Incidents:</span>
            <b className="text-rose-400 font-mono text-sm">{criticalAlerts}</b>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>Realtime Telemetry Live</span>
        </div>
      </div>
    </div>
  );
};
