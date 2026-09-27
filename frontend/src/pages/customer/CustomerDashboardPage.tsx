import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import {
  Car,
  Clock,
  MapPin,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Receipt,
  User,
  Zap
} from 'lucide-react';

export const CustomerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => api.getBookings(),
    refetchInterval: 8000,
  });

  const activeBooking = bookings.find((b) => b.status === 'ACTIVE');
  const upcomingBookings = bookings.filter((b) => b.status === 'CONFIRMED');
  const pastBookings = bookings.filter((b) => b.status === 'COMPLETED' || b.status === 'CANCELLED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-black font-extrabold text-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            {user?.name.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{user?.name}</h1>
            <p className="text-xs text-slate-400">{user?.email} • Member since 2024</p>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Verified Mobility Account</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/vehicles"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            Explore & Book Vehicles
          </Link>
        </div>
      </div>

      {/* Active Trip Hero Banner if exists */}
      {activeBooking && (
        <div className="p-6 rounded-3xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 shadow-2xl relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                Active Trip In Progress
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg">
              {activeBooking.booking_reference}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="text-slate-400 mb-1">Vehicle</div>
              <div className="text-sm font-bold text-white">
                {activeBooking.vehicle?.brand} {activeBooking.vehicle?.model}
              </div>
              <div className="text-[11px] text-emerald-400 font-mono">
                {activeBooking.vehicle?.registration_number}
              </div>
            </div>

            <div>
              <div className="text-slate-400 mb-1">Destination Depot</div>
              <div className="text-sm font-bold text-white">
                {activeBooking.return_warehouse?.name || 'Assigned Depot'}
              </div>
              <div className="text-[11px] text-slate-400">Cross-depot return enabled</div>
            </div>

            <div className="flex sm:justify-end items-center">
              <button
                onClick={() => navigate(`/booking/${activeBooking.id}/active`)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs shadow-lg shadow-cyan-400/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>Launch Live Cockpit</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Reservations */}
      {upcomingBookings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Upcoming Reservations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcomingBookings.map((b) => (
              <div
                key={b.id}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-emerald-400">{b.booking_reference}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                      RESERVED
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {b.vehicle?.brand} {b.vehicle?.model}
                  </h3>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    <span>Pickup: {b.pickup_warehouse?.name}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div>Amount: <b className="text-white font-mono">₹{b.total_amount}</b></div>
                  <button
                    onClick={() => navigate(`/booking/${b.id}/active`)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-colors"
                  >
                    Start Trip Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Rentals History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white">Rental History & Invoices</h2>

        {pastBookings.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-slate-800 text-xs text-slate-400">
            No completed rentals yet.
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Vehicle</th>
                    <th className="px-5 py-3">Route (Pickup → Drop)</th>
                    <th className="px-5 py-3">Duration</th>
                    <th className="px-5 py-3">Total Paid</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {pastBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-white">{b.booking_reference}</td>
                      <td className="px-5 py-3 font-medium text-slate-200">
                        {b.vehicle?.brand} {b.vehicle?.model}
                      </td>
                      <td className="px-5 py-3 text-slate-400">
                        {b.pickup_warehouse?.code} → {b.return_warehouse?.code}
                      </td>
                      <td className="px-5 py-3 text-slate-400">
                        {new Date(b.start_time).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-emerald-400">₹{b.total_amount}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.status === 'COMPLETED'
                              ? 'bg-slate-800 text-slate-300'
                              : 'bg-rose-950 text-rose-400'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
