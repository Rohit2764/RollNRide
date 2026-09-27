import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Vehicle, VehicleType, Warehouse } from '../../types';
import { BookingModal } from '../../components/booking/BookingModal';
import {
  Search,
  Filter,
  Zap,
  Battery,
  Users,
  MapPin,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal
} from 'lucide-react';

export const VehiclesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('AVAILABLE');
  const [selectedFuel, setSelectedFuel] = useState('ALL');

  // Booking modal state
  const [selectedVehicleForBooking, setSelectedVehicleForBooking] = useState<Vehicle | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Fetch vehicles
  const { data: vehicles = [], isLoading, refetch } = useQuery({
    queryKey: ['vehicles', selectedWarehouseId, selectedStatus, search],
    queryFn: () =>
      api.getVehicles({
        warehouse_id: selectedWarehouseId === 'ALL' ? undefined : selectedWarehouseId,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: search || undefined,
      }),
    refetchInterval: 12000,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.getWarehouses(),
  });

  // Client-side category & fuel filters
  const filteredVehicles = vehicles.filter((v) => {
    if (selectedCategory !== 'ALL' && v.vehicle_type?.category !== selectedCategory) {
      return false;
    }
    if (selectedFuel !== 'ALL' && v.vehicle_type?.fuel_type !== selectedFuel) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Title & Filters Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Connected Vehicle Catalog</h1>
            <p className="text-xs text-slate-400 mt-1">
              Select from available electric scooters, commuter bikes, and luxury sedans across Hyderabad mobility hubs.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Showing:</span>
            <b className="text-emerald-400 font-bold">{filteredVehicles.length} vehicles</b>
          </div>
        </div>

        {/* Filter Controls Strip */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search brand or model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Hub Selector */}
            <div>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="w-full py-2 px-3 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Hyderabad Hubs</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.code} — {wh.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Categories</option>
                <option value="TWO_WHEELER">2-Wheeler (Scooters & Bikes)</option>
                <option value="FOUR_WHEELER">4-Wheeler (Sedans & SUVs)</option>
              </select>
            </div>

            {/* Fuel Type */}
            <div>
              <select
                value={selectedFuel}
                onChange={(e) => setSelectedFuel(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Powertrains</option>
                <option value="ELECTRIC">100% Electric EV</option>
                <option value="PETROL">Petrol Combustion</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="AVAILABLE">Available Only</option>
                <option value="IN_USE">Currently In Use</option>
                <option value="ALL">All Statuses</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-80 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-slate-800 space-y-3">
          <AlertCircle className="h-10 w-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No vehicles found matching filters</h3>
          <p className="text-xs text-slate-400">Try adjusting your depot selection or powertrain filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => {
            const isAvailable = vehicle.status === 'AVAILABLE';
            const wh = warehouses.find((w) => w.id === vehicle.warehouse_id);

            return (
              <div
                key={vehicle.id}
                className="group rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 overflow-hidden relative bg-slate-950">
                    <img
                      src={vehicle.vehicle_type?.image_url || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80'}
                      alt={vehicle.model}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase shadow-md ${
                          isAvailable
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                        }`}
                      >
                        {vehicle.status}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md text-xs font-bold font-mono bg-black/80 backdrop-blur-md text-white">
                      ₹{vehicle.vehicle_type?.hourly_rate}/hr
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">{vehicle.registration_number}</p>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {vehicle.vehicle_type?.category === 'TWO_WHEELER' ? '2-Wheeler' : '4-Wheeler'}
                      </span>
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800 text-[11px] text-slate-300">
                      <div className="flex items-center gap-1">
                        <Battery className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{vehicle.battery_level}% Charge</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5 text-cyan-400" />
                        <span>{vehicle.vehicle_type?.range_km} km</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-amber-400" />
                        <span>{vehicle.vehicle_type?.seating_capacity} Seats</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{wh?.name || 'In Transit'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => {
                      setSelectedVehicleForBooking(vehicle);
                      setIsBookingModalOpen(true);
                    }}
                    disabled={!isAvailable}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all shadow-md ${
                      isAvailable
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isAvailable ? 'Reserve Now' : 'Vehicle Currently In Use'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Multi-Step Reservation Modal */}
      <BookingModal
        vehicle={selectedVehicleForBooking}
        warehouses={warehouses}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
