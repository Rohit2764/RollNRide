import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Navigation, Lock, Mail, ArrowRight, AlertTriangle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, setDemoUser, isLoading } = useAuthStore();

  const [email, setEmail] = useState('admin@rollnride.com');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate('/admin/operations-center');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    }
  };

  const handleDemoLogin = async (role: any, path: string) => {
    setError(null);
    try {
      await setDemoUser(role);
      navigate(path);
    } catch (err: any) {
      setError(err.message || 'Failed to login with demo account.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-black shadow-lg shadow-emerald-500/20">
            <Navigation className="h-6 w-6 fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sign In to RollNRide</h1>
          <p className="text-xs text-slate-400">
            Smart Mobility & Enterprise Fleet Operations Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                placeholder="name@rollnride.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Instant 1-Click Demo Accounts:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN', '/admin/operations-center')}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-200 transition-colors"
              >
                <b className="text-emerald-400 block">System Admin</b>
                <span className="text-[10px] text-slate-400">admin@rollnride.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('OPERATIONS_MANAGER', '/admin/dashboard')}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-200 transition-colors"
              >
                <b className="text-cyan-400 block">Ops Manager</b>
                <span className="text-[10px] text-slate-400">manager@rollnride.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('WAREHOUSE_MANAGER', '/admin/warehouses')}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-200 transition-colors"
              >
                <b className="text-amber-400 block">Warehouse Lead</b>
                <span className="text-[10px] text-slate-400">warehouse@rollnride.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('CUSTOMER', '/vehicles')}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-200 transition-colors"
              >
                <b className="text-indigo-400 block">Customer (Renter)</b>
                <span className="text-[10px] text-slate-400">customer@rollnride.com</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 font-semibold hover:underline">
            Register as Customer
          </Link>
        </p>
      </div>
    </div>
  );
};
