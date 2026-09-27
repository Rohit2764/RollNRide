import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import {
  Navigation,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  MapPin,
  Car,
  ChevronRight,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const { data: vehicleTypes = [] } = useQuery({
    queryKey: ['vehicleTypes'],
    queryFn: () => api.getVehicleTypes(),
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.getWarehouses(),
  });

  const { data: fleetStats } = useQuery({
    queryKey: ['fleetStats'],
    queryFn: () => api.getFleetStats(),
  });

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/40 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold tracking-wide">
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>Next-Generation Autonomous Mobility Network</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Smart Mobility, Connected Fleets & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Warehouse Intelligence.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Discover and reserve connected electric scooters, premium EVs, and commuter bikes with seamless cross-depot drop-offs and real-time live trip telemetry.
          </p>

          {/* Quick Search Widget */}
          <div className="mt-8 p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-md max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  Pickup Hub
                </label>
                <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500">
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} — {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Car className="h-3.5 w-3.5 text-cyan-400" />
                  Vehicle Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Categories</option>
                  <option value="TWO_WHEELER">2-Wheeler (Scooters & Bikes)</option>
                  <option value="FOUR_WHEELER">4-Wheeler (EVs & Sedans)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => navigate('/vehicles')}
                  className="w-full h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
                >
                  <span>Search Available Fleet</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Platform Metrics */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40">
              <div className="text-lg font-extrabold text-white font-mono">
                {fleetStats?.total_vehicles || 105}+
              </div>
              <div className="text-[11px] text-slate-400">Connected Vehicles</div>
            </div>
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40">
              <div className="text-lg font-extrabold text-emerald-400 font-mono">
                {warehouses.length || 5} Hubs
              </div>
              <div className="text-[11px] text-slate-400">Hyderabad Depots</div>
            </div>
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40">
              <div className="text-lg font-extrabold text-cyan-400 font-mono">82%</div>
              <div className="text-[11px] text-slate-400">Electric Fleet</div>
            </div>
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40">
              <div className="text-lg font-extrabold text-amber-400 font-mono">99.8%</div>
              <div className="text-[11px] text-slate-400">Turnaround SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle Categories Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Explore Fleet Categories</h2>
            <p className="text-xs text-slate-400 mt-1">
              Zero emissions, smart keyless unlock, and battery swap network.
            </p>
          </div>
          <Link
            to="/vehicles"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>View All Fleet</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicleTypes.map((vt) => (
            <div
              key={vt.id}
              className="group rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden hover:border-slate-700 transition-all flex flex-col"
            >
              <div className="h-48 overflow-hidden relative bg-slate-950">
                <img
                  src={vt.image_url || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80'}
                  alt={vt.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                  {vt.fuel_type}
                </span>
                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md text-xs font-bold font-mono bg-black/80 backdrop-blur-md text-white">
                  ₹{vt.hourly_rate}/hr
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {vt.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {vt.specifications}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{vt.range_km} km range</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                    <span>₹{vt.daily_rate}/day</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/vehicles?type=${vt.id}`)}
                  className="w-full py-2 rounded-xl border border-slate-700 hover:border-emerald-500 text-xs font-semibold text-slate-200 hover:text-white hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Select & View Available</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mobility Operations Architecture Highlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
              Enterprise Fleet Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              Live Operations & Intelligent Cross-Depot Allocation
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              RollNRide unites customer on-demand mobility with enterprise warehouse operations. Our dynamic workload scoring engine balances queues across all 5 depots while predictive A* pathfinding steers vehicles clear of traffic hotspots.
            </p>
            <div className="pt-4 flex flex-wrap gap-4 text-xs font-medium">
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Real-Time GPS Telemetry</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Dynamic Workload Balancing</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Turnaround Cleaning Pipeline</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
