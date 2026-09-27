import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AppLayout } from './components/layout/AppLayout';

// Customer & Auth Pages
import { HomePage } from './pages/customer/HomePage';
import { VehiclesPage } from './pages/customer/VehiclesPage';
import { ActiveTripPage } from './pages/customer/ActiveTripPage';
import { CustomerDashboardPage } from './pages/customer/CustomerDashboardPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Admin Pages
import { OperationsCenterPage } from './pages/admin/OperationsCenterPage';
import { ExecutiveDashboardPage } from './pages/admin/ExecutiveDashboardPage';
import { LiveFleetPage } from './pages/admin/LiveFleetPage';
import { WarehousesPage } from './pages/admin/WarehousesPage';
import { WarehouseDetailPage } from './pages/admin/WarehouseDetailPage';
import { TrafficPage } from './pages/admin/TrafficPage';
import { DemandForecastPage } from './pages/admin/DemandForecastPage';
import { OptimizationPage } from './pages/admin/OptimizationPage';
import { MaintenancePage } from './pages/admin/MaintenancePage';
import { StaffPage } from './pages/admin/StaffPage';
import { AlertsPage } from './pages/admin/AlertsPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { SimulationSettingsPage } from './pages/admin/SimulationSettingsPage';

export const App: React.FC = () => {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Public & Customer Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/trip/:bookingId" element={<ActiveTripPage />} />
          <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<Navigate to="/admin/operations-center" replace />} />
          <Route path="/admin/operations-center" element={<OperationsCenterPage />} />
          <Route path="/admin/dashboard" element={<ExecutiveDashboardPage />} />
          <Route path="/admin/fleet" element={<LiveFleetPage />} />
          <Route path="/admin/warehouses" element={<WarehousesPage />} />
          <Route path="/admin/warehouses/:id" element={<WarehouseDetailPage />} />
          <Route path="/admin/traffic" element={<TrafficPage />} />
          <Route path="/admin/demand-forecast" element={<DemandForecastPage />} />
          <Route path="/admin/optimization" element={<OptimizationPage />} />
          <Route path="/admin/maintenance" element={<MaintenancePage />} />
          <Route path="/admin/staff" element={<StaffPage />} />
          <Route path="/admin/alerts" element={<AlertsPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
          <Route path="/admin/simulation" element={<SimulationSettingsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
