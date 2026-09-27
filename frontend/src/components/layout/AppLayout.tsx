import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { AdminSidebar } from './AdminSidebar';
import { Footer } from './Footer';
import { useWebSocket } from '../../hooks/useWebSocket';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  // Activate WebSocket listener for real-time fleet & dashboard updates
  useWebSocket('dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-black">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {isAdminPath && <AdminSidebar />}

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {!isAdminPath && <Footer />}
    </div>
  );
};
