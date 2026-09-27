import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Vehicle, Warehouse, BookingPriceEstimate } from '../../types';
import { api } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Car
} from 'lucide-react';

interface BookingModalProps {
  vehicle: Vehicle | null;
  warehouses: Warehouse[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  vehicle,
  warehouses,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pickupWarehouseId, setPickupWarehouseId] = useState<number>(1);
  const [returnWarehouseId, setReturnWarehouseId] = useState<number>(2);

  // Default dates: start in 15 minutes, duration 4 hours
  const now = new Date();
  const startTimeInit = new Date(now.getTime() + 15 * 60000).toISOString().slice(0, 16);
  const returnTimeInit = new Date(now.getTime() + 4 * 3600000).toISOString().slice(0, 16);

  const [startTime, setStartTime] = useState(startTimeInit);
  const [returnTime, setReturnTime] = useState(returnTimeInit);

  const [estimate, setEstimate] = useState<BookingPriceEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vehicle && vehicle.warehouse_id) {
      setPickupWarehouseId(vehicle.warehouse_id);
    }
  }, [vehicle]);

  // Recalculate price estimate when dates or vehicle changes
  useEffect(() => {
    async function fetchEstimate() {
      if (!vehicle || !isOpen) return;
      setIsEstimating(true);
      setError(null);
      try {
        const est = await api.estimateBooking({
          vehicle_id: vehicle.id,
          start_time: new Date(startTime).toISOString(),
          expected_return_time: new Date(returnTime).toISOString(),
        });
        setEstimate(est);
      } catch (err: any) {
        setError(err.message || 'Invalid rental duration selected.');
      } finally {
        setIsEstimating(false);
      }
    }

    fetchEstimate();
  }, [vehicle, startTime, returnTime, isOpen]);

  if (!isOpen || !vehicle) return null;

  const handleCreateBooking = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const booking = await api.createBooking({
        vehicle_id: vehicle.id,
        pickup_warehouse_id: pickupWarehouseId,
        return_warehouse_id: returnWarehouseId,
        start_time: new Date(startTime).toISOString(),
        expected_return_time: new Date(returnTime).toISOString(),
        pickup_location: warehouses.find((w) => w.id === pickupWarehouseId)?.name,
        return_location: warehouses.find((w) => w.id === returnWarehouseId)?.name,
      });
      setCreatedBooking(booking);
      setStep(3); // confirmation step
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to complete booking reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Reserve Vehicle</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                {vehicle.registration_number}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {vehicle.brand} {vehicle.model} • {vehicle.vehicle_type?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Multi-step progress bar */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 text-xs">
          <div
            className={`flex-1 py-2 text-center border-b-2 font-medium transition-colors ${
              step >= 1 ? 'border-emerald-500 text-emerald-400 font-bold' : 'border-transparent text-slate-500'
            }`}
          >
            1. Duration & Depot
          </div>
          <div
            className={`flex-1 py-2 text-center border-b-2 font-medium transition-colors ${
              step >= 2 ? 'border-emerald-500 text-emerald-400 font-bold' : 'border-transparent text-slate-500'
            }`}
          >
            2. Price & Checkout
          </div>
          <div
            className={`flex-1 py-2 text-center border-b-2 font-medium transition-colors ${
              step === 3 ? 'border-emerald-500 text-emerald-400 font-bold' : 'border-transparent text-slate-500'
            }`}
          >
            3. Confirmed
          </div>
        </div>

        {/* Step 1: Depots & Duration */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  Pickup Hub
                </label>
                <select
                  value={pickupWarehouseId}
                  onChange={(e) => setPickupWarehouseId(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.code} — {wh.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                  Return Hub (Cross-depot)
                </label>
                <select
                  value={returnWarehouseId}
                  onChange={(e) => setReturnWarehouseId(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.code} — {wh.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-400" />
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  Return Time
                </label>
                <input
                  type="datetime-local"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick spec badge */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-400" />
                <span>Range: <b>{vehicle.vehicle_type?.range_km} km</b></span>
              </div>
              <div>Battery: <b className="text-emerald-400">{vehicle.battery_level}%</b></div>
              <div>Rate: <b className="text-white">₹{vehicle.vehicle_type?.hourly_rate}/hr</b></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(2)}
                disabled={!estimate || isEstimating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                <span>Continue to Price Review</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Price Summary & Checkout */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Rental Duration</span>
                <span className="font-semibold text-white">{estimate?.duration_hours} hours</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Base Rate ({estimate?.duration_hours && estimate.duration_hours >= 24 ? 'Daily' : 'Hourly'})</span>
                <span className="text-slate-200">₹{estimate?.base_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST & Mobility Infrastructure Fee (18%)</span>
                <span className="text-slate-200">₹{estimate?.taxes_fees.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-800 pt-2.5 flex justify-between text-sm font-bold">
                <span className="text-white">Total Amount</span>
                <span className="text-emerald-400 text-base font-mono">₹{estimate?.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Full insurance coverage, 24/7 roadside assistance, and battery swap support included.</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs hover:bg-slate-800 transition-colors"
              >
                Back
              </button>

              <button
                onClick={handleCreateBooking}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4" />
                <span>{isSubmitting ? 'Confirming Reservation...' : 'Confirm & Reserve'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && createdBooking && (
          <div className="p-6 text-center space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-bounce">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h4 className="text-lg font-bold text-white">Reservation Confirmed!</h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Your vehicle has been staged at the depot. Use your booking reference to check out at the kiosk or launch your active trip dashboard.
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-1.5 font-mono">
              <div className="text-slate-400">Booking Reference: <b className="text-emerald-400">{createdBooking.booking_reference}</b></div>
              <div className="text-slate-400">Vehicle: <b className="text-white">{vehicle.registration_number}</b></div>
              <div className="text-slate-400">Total Charged: <b className="text-white">₹{createdBooking.total_amount}</b></div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  navigate(`/booking/${createdBooking.id}/active`);
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-opacity"
              >
                Launch Live Trip Cockpit
              </button>
              <button
                onClick={() => {
                  onClose();
                  navigate('/customer/dashboard');
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
              >
                View My Rentals
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
