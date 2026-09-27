import React from 'react';
import { Navigation, Heart, ShieldCheck, Terminal, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-black">
            <Navigation className="h-3.5 w-3.5 fill-current" />
          </div>
          <span className="font-bold text-white tracking-wider">ROLLNRIDE</span>
          <span>• Enterprise Fleet & Mobility Intelligence</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-emerald-400" />
            <span>FastAPI + PostgreSQL/SQLite + React</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>Role-Based Access Control</span>
          </div>
          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-slate-300 hover:text-white"
          >
            <Terminal className="h-3.5 w-3.5 text-amber-400" />
            <span>API Docs</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
