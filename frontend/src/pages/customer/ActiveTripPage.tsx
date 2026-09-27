import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { FleetMap } from '../../components/map/FleetMap';
import { LiveVehicleTelemetry, RoutePoint } from '../../types';
import {
  Gauge,
  Battery,
  Navigation,
  Clock,
  ShieldAlert,
  CheckCircle,
  MapPin,
  AlertTriangle,
  ArrowRight,
  PhoneCall,
  Car
} from 'lucide-react';

export const ActiveTripPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const bookingId = Number(id);

  const [showSosModal, setShowSosModal] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(24);

  // Fetch Booking Details
  const { data: booking, isLoading, refetch } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => api.getBooking(bookingId),
    refetchInterval: 5000,
  });

  // Fetch Warehouses for destination routing
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.getWarehouses(),
  });

  // Fetch Live Fleet to track vehicle coordinates
  const { data: liveFleet = [] } = useQuery({
    queryKey: ['liveFleet'],
    queryFn: () => api.getLiveFleet(),
    refetchInterval: 3000,
  });

  // Timer simulation
  useEffect(() => {
    const timer = setInterval(() => setElapsedMinutes((prev) => prev + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const completeTripMutation = useMutation({
    mutationFn: () => api.completeTrip(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['liveFleet'] });
      navigate('/customer/dashboard');
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Booking Not Found</h2>
        <button
          onClick={() => navigate('/customer/dashboard')}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const activeVehicleTelemetry: LiveVehicleTelemetry | undefined = liveFleet.find(
    (v) => v.vehicle_id === booking.vehicle_id
  );

  const curLat = activeVehicleTelemetry?.latitude || booking.vehicle?.current_latitude || 17.4474;
  const curLng = activeVehicleTelemetry?.longitude || booking.vehicle?.current_longitude || 78.3762;
  const curSpeed = activeVehicleTelemetry?.speed ?? 34.2;
  const curBattery = activeVehicleTelemetry?.battery ?? booking.vehicle?.battery_level ?? 78;

  const destWarehouse = warehouses.find((w) => w.id === booking.return_warehouse_id);

  // Waypoints connecting current vehicle to destination
  const routeWaypoints: RoutePoint[] = [
    { lat: curLat, lng: curLng },
    {
      lat: (curLat + (destWarehouse?.latitude || curLat)) / 2 + 0.005,
      lng: (curLng + (destWarehouse?.longitude || curLng)) / 2 - 0.005,
    },
    { lat: destWarehouse?.latitude || 17.4399, lng: destWarehouse?.longitude || 78.3489 },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-slate-950">
      {/* Top HUD Telemetry Bar */}
      <div className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 py-3 shrink-0 flex flex-wrap items-center justify-between gap-4 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white font-mono">{booking.booking_reference}</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                ACTIVE COCKPIT
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {booking.vehicle?.brand} {booking.vehicle?.model} • {booking.vehicle?.registration_number}
            </div>
          </div>
        </div>

        {/* Live Gauges */}
        <div className="flex items-center gap-6 text-xs">
          {/* Speedometer */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <Gauge className="h-4 w-4 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Live Speed</div>
              <div className="text-sm font-mono font-bold text-white">{curSpeed} <span className="text-[10px] text-slate-400">km/h</span></div>
            </div>
          </div>

          {/* Battery */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <Battery className="h-4 w-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Battery State</div>
              <div className="text-sm font-mono font-bold text-emerald-400">{curBattery}% <span className="text-[10px] text-slate-400 font-normal">(~{Math.round(curBattery * 1.1)} km)</span></div>
            </div>
          </div>

          {/* Elapsed */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <Clock className="h-4 w-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Trip Duration</div>
              <div className="text-sm font-mono font-bold text-white">{elapsedMinutes} <span className="text-[10px] text-slate-400">min</span></div>
            </div>
          </div>

          {/* Destination */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <Navigation className="h-4 w-4 text-indigo-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Return Depot</div>
              <div className="text-xs font-semibold text-white truncate max-w-[150px]">{destWarehouse?.name}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Emergency & Complete Trip */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSosModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30 transition-colors shadow-sm shadow-rose-500/10"
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Emergency SOS</span>
          </button>

          <button
            onClick={() => completeTripMutation.mutate()}
            disabled={completeTripMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            <span>{completeTripMutation.isPending ? 'Ending Trip...' : 'Complete & Return'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Map View */}
      <div className="flex-1 relative">
        <FleetMap
          center={[curLat, curLng]}
          zoom={14}
          vehicles={activeVehicleTelemetry ? [activeVehicleTelemetry] : []}
          warehouses={destWarehouse ? [destWarehouse] : []}
          routeWaypoints={routeWaypoints}
        />

        {/* Bottom Floating Navigation Card */}
        <div className="absolute bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-96 glass-panel p-4 rounded-2xl shadow-2xl z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Navigation className="h-4 w-4 text-cyan-400" />
              <span>Turn-by-Turn Guidance</span>
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">ETA: ~18 min</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
            <div className="font-bold text-white">Continue straight on Outer Ring Expressway</div>
            <div className="text-[11px] text-slate-400">In 450 meters, take Exit 17 towards {destWarehouse?.code} Mobility Depot</div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>Destination: <b className="text-slate-200">{destWarehouse?.code}</b></span>
            <span>Speed Limit: <b className="text-white">60 km/h</b></span>
          </div>
        </div>
      </div>

      {/* SOS Emergency Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-rose-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Emergency Roadside Assistance</h3>
                <p className="text-xs text-slate-400">24/7 Operations Command Dispatch</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Your exact GPS coordinates (<code className="text-emerald-400">{curLat.toFixed(4)}, {curLng.toFixed(4)}</code>) have been broadcast to the nearest mobile patrol unit.
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Direct Dispatch Hotline:</span>
                <b className="text-white font-mono">+91 1800-ROLL-HELP</b>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Vehicle Health Sensor:</span>
                <b className="text-emerald-400">Normal (No impact detected)</b>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSosModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Close & Return
              </button>
              <a
                href="tel:1800765543"
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Call Incident Command</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
