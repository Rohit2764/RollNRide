import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Navigation,
  Car,
  Activity,
  Play,
  Pause,
  Zap,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Sparkles,
  Shield,
  Layers,
  MapPin
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSimulationStore } from '../../store/simulationStore';
import { UserRole } from '../../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, setDemoUser } = useAuthStore();
  const { isRunning, speed, toggle, setSpeed } = useSimulationStore();
  const queryClient = useQueryClient();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);

  // Fetch alerts for notification bell
  const { data: alerts = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
    refetchInterval: 10000,
  });

  const unreadAlerts = alerts.filter((a) => !a.is_read);

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const isCustomerPortal = !user || user.role === 'CUSTOMER';
  const isAdminView = user && user.role !== 'CUSTOMER';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Navigation className="h-5 w-5 fill-current" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-wider text-white">ROLL<span className="text-emerald-400">N</span>RIDE</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-400/90 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                Mobility OS
              </span>
            </div>
          </Link>

          {/* Navigation Links for Customer Portal */}
          {isCustomerPortal && (
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  location.pathname === '/' ? 'text-emerald-400 bg-emerald-950/40' : 'text-slate-300 hover:text-white'
                }`}
              >
                Discover
              </Link>
              <Link
                to="/vehicles"
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  location.pathname === '/vehicles' ? 'text-emerald-400 bg-emerald-950/40' : 'text-slate-300 hover:text-white'
                }`}
              >
                Fleet Catalog
              </Link>
              {isAuthenticated && (
                <Link
                  to="/customer/dashboard"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    location.pathname.startsWith('/customer') ? 'text-emerald-400 bg-emerald-950/40' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  My Rentals
                </Link>
              )}
            </nav>
          )}

          {/* Admin Switch Link */}
          {isAdminView && (
            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-800">
              <Link
                to="/admin/operations-center"
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                  location.pathname === '/admin/operations-center'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/10'
                    : 'border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Operations Center
              </Link>
              <Link
                to="/admin/dashboard"
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                  location.pathname === '/admin/dashboard'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/10'
                    : 'border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                Executive BI
              </Link>
            </div>
          )}
        </div>

        {/* Right Section: Simulation controls, Role Switcher, Alerts, Auth */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Live Simulation Control Strip */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800/80 px-2.5 py-1.5 shadow-inner">
            <button
              onClick={toggle}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-all ${
                isRunning
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/20'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
              title="Toggle background fleet movement and traffic simulation"
            >
              {isRunning ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isRunning ? 'Sim Active' : 'Sim Paused'}</span>
              <span className={`h-2 w-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            </button>

            {/* Speed selector */}
            <div className="hidden sm:flex items-center gap-1 border-l border-slate-800 pl-2">
              {[1, 2, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`text-[11px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                    speed === s ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Quick Persona Demo Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleMenu(!showRoleMenu);
                setShowUserMenu(false);
                setShowAlertMenu(false);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden md:inline">Demo Role:</span>
              <span className="text-emerald-400 font-mono text-[11px]">{user?.role || 'Guest'}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl py-1.5 z-50 text-xs">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                  Switch Demo Persona
                </div>
                {(
                  [
                    { role: 'ADMIN', label: 'System Admin', email: 'admin@rollnride.com' },
                    { role: 'OPERATIONS_MANAGER', label: 'Operations Director', email: 'manager@rollnride.com' },
                    { role: 'WAREHOUSE_MANAGER', label: 'Warehouse Manager', email: 'warehouse@rollnride.com' },
                    { role: 'FLEET_MANAGER', label: 'Fleet Supervisor', email: 'fleet@rollnride.com' },
                    { role: 'CUSTOMER', label: 'Customer (Renter)', email: 'customer@rollnride.com' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.role}
                    onClick={async () => {
                      await setDemoUser(item.role);
                      setShowRoleMenu(false);
                      if (item.role === 'CUSTOMER') {
                        navigate('/vehicles');
                      } else {
                        navigate('/admin/operations-center');
                      }
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors flex flex-col ${
                      user?.role === item.role ? 'bg-emerald-950/40 text-emerald-300 font-semibold' : 'text-slate-200'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-slate-400">{item.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowAlertMenu(!showAlertMenu);
                setShowUserMenu(false);
                setShowRoleMenu(false);
              }}
              className="relative p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              aria-label="Alerts"
            >
              <Bell className="h-4 w-4" />
              {unreadAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm shadow-rose-500/50">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {showAlertMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl py-2 z-50">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Operational Alerts</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 font-mono">
                      {unreadAlerts.length} new
                    </span>
                  </div>
                  <Link
                    to="/admin/alerts"
                    onClick={() => setShowAlertMenu(false)}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    View all
                  </Link>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                  {alerts.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">All systems operating within thresholds</div>
                  ) : (
                    alerts.slice(0, 5).map((a) => (
                      <div
                        key={a.id}
                        className={`p-3 text-xs transition-colors hover:bg-slate-800/50 ${
                          !a.is_read ? 'bg-slate-800/20' : 'opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`font-semibold ${
                              a.severity === 'CRITICAL'
                                ? 'text-rose-400'
                                : a.severity === 'WARNING'
                                ? 'text-amber-400'
                                : 'text-cyan-400'
                            }`}
                          >
                            {a.title}
                          </span>
                          {!a.is_read && (
                            <button
                              onClick={() => markReadMutation.mutate(a.id)}
                              className="text-[10px] text-emerald-400 hover:underline"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{a.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Auth Action */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowRoleMenu(false);
                  setShowAlertMenu(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 hover:border-slate-700 transition-colors"
              >
                <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-[11px]">
                  {user?.name.charAt(0)}
                </div>
                <span className="hidden sm:inline font-medium max-w-[100px] truncate">{user?.name}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl py-1 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    <span className="mt-1 inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                      {user?.role}
                    </span>
                  </div>

                  {user?.role === 'CUSTOMER' ? (
                    <Link
                      to="/customer/dashboard"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-3 py-2 text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      My Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-3 py-2 text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                      navigate('/');
                    }}
                    className="w-full text-left px-3 py-2 text-rose-400 hover:bg-slate-800 transition-colors flex items-center gap-2 border-t border-slate-800/60"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-200 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-medium transition-all shadow-sm shadow-emerald-500/20"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
