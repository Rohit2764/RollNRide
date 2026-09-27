import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Car,
  Warehouse,
  Flame,
  CalendarRange,
  GitCompare,
  Wrench,
  Users,
  AlertTriangle,
  FileText,
  Sliders,
  TrendingUp,
  MapPin
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: SidebarItem[] = [
  { name: 'Operations Center', path: '/admin/operations-center', icon: Compass, badge: 'LIVE' },
  { name: 'Executive BI', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Live Fleet Map', path: '/admin/fleet', icon: Car },
  { name: 'Warehouse Hubs', path: '/admin/warehouses', icon: Warehouse },
  { name: 'Traffic Intelligence', path: '/admin/traffic', icon: Flame },
  { name: 'Demand Forecast', path: '/admin/demand-forecast', icon: TrendingUp },
  { name: 'Smart Redistribution', path: '/admin/optimization', icon: GitCompare, badge: 'AI' },
  { name: 'Turnaround & Repairs', path: '/admin/maintenance', icon: Wrench },
  { name: 'Staff Workforce', path: '/admin/staff', icon: Users },
  { name: 'Operational Alerts', path: '/admin/alerts', icon: AlertTriangle },
  { name: 'BI Reports & Export', path: '/admin/reports', icon: FileText },
  { name: 'Simulation Settings', path: '/admin/simulation', icon: Sliders },
];

export const AdminSidebar: React.FC = () => {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-800/80 bg-slate-950/60 backdrop-blur-md hidden md:flex flex-col justify-between p-3.5 select-none">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Operations Control Hub
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10 font-bold'
                    : 'text-slate-300 hover:bg-slate-900/80 hover:text-white border border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110 text-slate-400 group-hover:text-emerald-400" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* System Status Mini Widget */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span>Telemetry Stream</span>
          <span className="flex items-center gap-1 text-emerald-400 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          WebSockets listening on <code className="text-slate-300">/ws/fleet</code>
        </p>
      </div>
    </aside>
  );
};
