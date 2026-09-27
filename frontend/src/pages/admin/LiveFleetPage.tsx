import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Car, 
  Battery, 
  Fuel, 
  Compass, 
  MapPin, 
  Search, 
  Filter, 
  Warehouse as WarehouseIcon, 
  ChevronRight, 
  RefreshCw, 
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { api } from '../../api/client';
import { Vehicle, VehicleStatus, Warehouse } from '../../types';

export const LiveFleetPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [statusOverrideModal, setStatusOverrideModal] = useState<Vehicle | null>(null);
  const [newStatus, setNewStatus] = useState<VehicleStatus>('AVAILABLE');

  // Queries
  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: () => api.get<Warehouse[]>('/warehouses')
  });

  const { data: vehicles, isLoading, refetch, isFetching } = useQuery<Vehicle[]>({
    queryKey: ['admin-vehicles', selectedWarehouse, selectedStatus, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedWarehouse !== 'all') params.append('warehouse_id', selectedWarehouse);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      params.append('limit', '150');
      return api.get<Vehicle[]>(`/vehicles?${params.toString()}`);
    },
    refetchInterval: 5000
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: VehicleStatus }) => 
      api.patch(`/vehicles/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['fleet-live'] });
      queryClient.invalidateQueries({ queryKey: ['operations-dashboard'] });
      setStatusOverrideModal(null);
    }
  });

  const filteredVehicles = vehicles?.filter(v => {
    const reg = v.registration_number.toLowerCase();
    const brand = v.brand.toLowerCase();
    const model = v.model.toLowerCase();
    const q = searchQuery.toLowerCase();
    return reg.includes(q) || brand.includes(q) || model.includes(q);
  }) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Car className="w-6 h-6 text-blue-400" />
            Live Fleet Inventory & Telematics Telemetry
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time multi-asset registry across Hyderabad hubs with status override and OBD diagnostic telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-400' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl">
        <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reg, brand, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500/60"
            />
          </div>

          {/* Depot Filter */}
          <div className="flex items-center bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs">
            <WarehouseIcon className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="bg-transparent text-slate-200 border-none outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Hubs</option>
              {warehouses?.map(w => (
                <option key={w.id} value={w.id} className="bg-slate-900">{w.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-200 border-none outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Statuses</option>
              <option value="AVAILABLE" className="bg-slate-900">AVAILABLE</option>
              <option value="IN_USE" className="bg-slate-900">IN_USE</option>
              <option value="RESERVED" className="bg-slate-900">RESERVED</option>
              <option value="RETURNING" className="bg-slate-900">RETURNING</option>
              <option value="CLEANING" className="bg-slate-900">CLEANING</option>
              <option value="MAINTENANCE" className="bg-slate-900">MAINTENANCE</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-200 border-none outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Classes</option>
              <option value="TWO_WHEELER" className="bg-slate-900">Two-Wheelers (Bikes/EVs)</option>
              <option value="FOUR_WHEELER" className="bg-slate-900">Four-Wheelers (Cars/SUVs)</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 self-end lg:self-auto">
          Showing <span className="font-semibold text-slate-200">{filteredVehicles.length}</span> vehicles
        </div>
      </div>

      {/* Fleet Table */}
      <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading vehicle telemetry...</div>
        ) : filteredVehicles.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Car className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="font-medium text-slate-300">No vehicles match current criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-900/60 text-slate-400 border-b border-slate-700/60">
                <tr>
                  <th className="px-5 py-3.5">Asset & Registration</th>
                  <th className="px-5 py-3.5">Assigned Depot</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Speed</th>
                  <th className="px-5 py-3.5">Battery / Fuel</th>
                  <th className="px-5 py-3.5">Coordinates</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {filteredVehicles.map((vehicle) => {
                  const warehouse = warehouses?.find(w => w.id === vehicle.warehouse_id);
                  const isElectric = vehicle.vehicle_type?.fuel_type === 'ELECTRIC';
                  const level = isElectric ? vehicle.battery_level : vehicle.fuel_level;

                  return (
                    <tr key={vehicle.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                            vehicle.status === 'IN_USE'
                              ? 'bg-purple-600/20 border-purple-500/30 text-purple-400'
                              : vehicle.status === 'AVAILABLE'
                              ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}>
                            <Car className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100 text-sm">
                              {vehicle.brand} {vehicle.model}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-mono text-slate-400">
                                {vehicle.registration_number}
                              </span>
                              <span className="text-2xs px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-400">
                                {vehicle.year}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs font-medium text-slate-300">
                        {warehouse ? (
                          <span>{warehouse.name} ({warehouse.code})</span>
                        ) : (
                          <span className="text-slate-500 italic">In Field / En-Route</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          vehicle.status === 'AVAILABLE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : vehicle.status === 'IN_USE'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : vehicle.status === 'RETURNING'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : vehicle.status === 'CLEANING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : vehicle.status === 'MAINTENANCE'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            vehicle.status === 'AVAILABLE' ? 'bg-emerald-400' :
                            vehicle.status === 'IN_USE' ? 'bg-purple-400 animate-pulse' :
                            vehicle.status === 'CLEANING' ? 'bg-amber-400' : 'bg-slate-400'
                          }`} />
                          {vehicle.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs font-mono font-medium">
                        <span className={vehicle.current_speed > 0 ? 'text-blue-400 font-bold' : 'text-slate-500'}>
                          {vehicle.current_speed} km/h
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {isElectric ? (
                            <Zap className={`w-3.5 h-3.5 ${level < 20 ? 'text-rose-400' : 'text-emerald-400'}`} />
                          ) : (
                            <Fuel className={`w-3.5 h-3.5 ${level < 20 ? 'text-rose-400' : 'text-blue-400'}`} />
                          )}
                          <div className="w-16 bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                level < 20 ? 'bg-rose-500' : level < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${level}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-slate-300">{level}%</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-2xs font-mono text-slate-400">
                        {vehicle.current_latitude.toFixed(4)}, {vehicle.current_longitude.toFixed(4)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedVehicle(vehicle)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
                          >
                            Inspect
                          </button>

                          <button
                            onClick={() => {
                              setStatusOverrideModal(vehicle);
                              setNewStatus(vehicle.status);
                            }}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-blue-600/30 text-slate-400 hover:text-blue-400 border border-slate-700 transition-all cursor-pointer"
                            title="Override Status"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Telemetry Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/70 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100">
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </h3>
                  <p className="text-xs font-mono text-slate-400">{selectedVehicle.registration_number}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                  <span className="text-2xs text-slate-400 uppercase font-semibold">Current State</span>
                  <p className="text-sm font-bold text-slate-100 mt-1">{selectedVehicle.status}</p>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                  <span className="text-2xs text-slate-400 uppercase font-semibold">Speed & Velocity</span>
                  <p className="text-sm font-bold text-blue-400 mt-1">{selectedVehicle.current_speed} km/h</p>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                  <span className="text-2xs text-slate-400 uppercase font-semibold">Heading / Azimuth</span>
                  <p className="text-sm font-bold text-purple-400 mt-1">{selectedVehicle.heading}&deg;</p>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                  <span className="text-2xs text-slate-400 uppercase font-semibold">Battery / Energy</span>
                  <p className="text-sm font-bold text-emerald-400 mt-1">{selectedVehicle.battery_level}%</p>
                </div>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <span className="text-2xs text-slate-400 uppercase font-semibold">Geospatial Fix</span>
                <p className="text-xs font-mono text-slate-200 mt-1">
                  Latitude: {selectedVehicle.current_latitude.toFixed(6)} | Longitude: {selectedVehicle.current_longitude.toFixed(6)}
                </p>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <span className="text-2xs text-slate-400 uppercase font-semibold">Odometer Mileage</span>
                <p className="text-sm font-mono font-bold text-slate-200 mt-1">{selectedVehicle.mileage.toLocaleString()} km</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedVehicle(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Status Modal */}
      {statusOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/70 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100">
                Override Asset Status
              </h3>
              <button
                onClick={() => setStatusOverrideModal(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-300">
                Update status for <strong className="text-slate-100">{statusOverrideModal.registration_number}</strong> ({statusOverrideModal.brand} {statusOverrideModal.model}):
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Select Target Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as VehicleStatus)}
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="AVAILABLE">AVAILABLE (Customer Ready)</option>
                  <option value="IN_USE">IN_USE (Trip Dispatched)</option>
                  <option value="CLEANING">CLEANING (Turnaround Bay)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Workshop Repair)</option>
                  <option value="DAMAGED">DAMAGED (Quarantined)</option>
                  <option value="INACTIVE">INACTIVE (Decommissioned)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStatusOverrideModal(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateStatusMutation.mutate({ id: statusOverrideModal.id, status: newStatus })}
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {updateStatusMutation.isPending ? 'Updating...' : 'Commit Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveFleetPage;
