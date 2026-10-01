import {
  User,
  Vehicle,
  VehicleType,
  Warehouse,
  Booking,
  BookingPriceEstimate,
  LiveVehicleTelemetry,
  TrafficZone,
  TrafficIncident,
  TrafficHeatmapResponse,
  RouteResponse,
  RedistributionRecommendation,
  DemandForecastResponse,
  MaintenanceRecord,
  CleaningTask,
  Staff,
  Alert,
  OperationsDashboardResponse
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('rollnride_token');
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Clear token on 401 if unauthorized
      localStorage.removeItem('rollnride_token');
      localStorage.removeItem('rollnride_user');
    }

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  public async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  public async patch<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  public async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }


  // Auth
  async login(email: string, password: string) {
    return this.request<{ access_token: string; refresh_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: { name: string; email: string; password: string; phone?: string }) {
    return this.request<{ access_token: string; refresh_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe() {
    return this.request<User>('/auth/me');
  }

  // Vehicles
  async getVehicles(params?: {
    warehouse_id?: number;
    vehicle_type_id?: number;
    status?: string;
    category?: string;
    fuel_type?: string;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
    }
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return this.request<Vehicle[]>(`/vehicles${qStr}`);
  }

  async getVehicle(id: number) {
    return this.request<Vehicle>(`/vehicles/${id}`);
  }

  async getVehicleTypes() {
    return this.request<VehicleType[]>('/vehicles/types');
  }

  // Warehouses
  async getWarehouses() {
    return this.request<Warehouse[]>('/warehouses');
  }

  async getWarehouse(id: number) {
    return this.request<Warehouse>(`/warehouses/${id}`);
  }

  // Bookings
  async getBookings(status?: string) {
    const qStr = status ? `?status=${status}` : '';
    return this.request<Booking[]>(`/bookings${qStr}`);
  }

  async getBooking(id: number) {
    return this.request<Booking>(`/bookings/${id}`);
  }

  async estimateBooking(data: { vehicle_id: number; start_time: string; expected_return_time: string }) {
    return this.request<BookingPriceEstimate>('/bookings/estimate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createBooking(data: {
    vehicle_id: number;
    pickup_warehouse_id: number;
    return_warehouse_id: number;
    start_time: string;
    expected_return_time: string;
    pickup_location?: string;
    return_location?: string;
  }) {
    return this.request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async startTrip(bookingId: number) {
    return this.request<Booking>(`/bookings/${bookingId}/start`, { method: 'POST' });
  }

  async completeTrip(bookingId: number) {
    return this.request<Booking>(`/bookings/${bookingId}/complete`, { method: 'POST' });
  }

  async cancelBooking(bookingId: number) {
    return this.request<Booking>(`/bookings/${bookingId}/cancel`, { method: 'POST' });
  }

  // Fleet & Tracking
  async getLiveFleet() {
    return this.request<LiveVehicleTelemetry[]>('/fleet/live');
  }

  async getFleetStats() {
    return this.request<any>('/fleet/stats');
  }

  async updateLocation(telemetry: {
    vehicle_id: number;
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    battery: number;
  }) {
    return this.request<Vehicle>('/tracking/location', {
      method: 'POST',
      body: JSON.stringify(telemetry),
    });
  }

  // Traffic
  async getTrafficLive() {
    return this.request<TrafficZone[]>('/traffic/live');
  }

  async getTrafficHeatmap(timeRange: string = 'live') {
    return this.request<TrafficHeatmapResponse>(`/traffic/heatmap?time_range=${timeRange}`);
  }

  async getTrafficIncidents() {
    return this.request<TrafficIncident[]>('/traffic/incidents');
  }

  // Routing & Optimization
  async calculateRoute(data: {
    origin_lat: number;
    origin_lng: number;
    destination_lat: number;
    destination_lng: number;
    avoid_congested?: boolean;
  }) {
    return this.request<RouteResponse>('/optimization/route', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRedistributions() {
    return this.request<RedistributionRecommendation[]>('/optimization/redistribution');
  }

  async approveRedistribution(id: number, modifiedCount?: number) {
    return this.request<RedistributionRecommendation>(`/optimization/redistribution/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ status: 'APPROVED', modified_vehicle_count: modifiedCount }),
    });
  }

  async rejectRedistribution(id: number) {
    return this.request<RedistributionRecommendation>(`/optimization/redistribution/${id}/reject`, {
      method: 'POST',
    });
  }

  // Forecasting
  async getDemandForecast(warehouseId?: number, targetDate?: string) {
    const query = new URLSearchParams();
    if (warehouseId) query.append('warehouse_id', String(warehouseId));
    if (targetDate) query.append('target_date', targetDate);
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return this.request<DemandForecastResponse>(`/forecast/demand${qStr}`);
  }

  // Maintenance & Cleaning
  async getMaintenanceRecords(warehouseId?: number) {
    const qStr = warehouseId ? `?warehouse_id=${warehouseId}` : '';
    return this.request<MaintenanceRecord[]>(`/maintenance${qStr}`);
  }

  async getCleaningQueue(warehouseId?: number) {
    const qStr = warehouseId ? `?warehouse_id=${warehouseId}` : '';
    return this.request<CleaningTask[]>(`/maintenance/cleaning-queue${qStr}`);
  }

  async advanceCleaningTask(taskId: number, staffId?: number) {
    return this.request<CleaningTask>(`/maintenance/cleaning-queue/${taskId}/advance`, {
      method: 'POST',
      body: JSON.stringify({ staff_id: staffId }),
    });
  }

  // Staff
  async getStaff(warehouseId?: number) {
    const qStr = warehouseId ? `?warehouse_id=${warehouseId}` : '';
    return this.request<Staff[]>(`/staff${qStr}`);
  }

  async getStaffWorkload() {
    return this.request<any>('/staff/workload');
  }

  // Notifications
  async getNotifications() {
    return this.request<Alert[]>('/notifications');
  }

  async markNotificationRead(id: number) {
    return this.request<Alert>(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  async dismissNotification(id: number) {
    return this.request<{ status: string; message: string }>(`/notifications/${id}`, { method: 'DELETE' });
  }

  // Analytics
  async getDashboardAnalytics() {
    return this.request<OperationsDashboardResponse>('/analytics/dashboard');
  }

  // Simulation
  async getSimulationStatus() {
    return this.request<{ is_running: boolean; speed_multiplier: number }>('/simulation/status');
  }

  async toggleSimulation(enabled: boolean) {
    return this.request<{ is_running: boolean; message: string }>('/simulation/toggle', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  async setSimulationSpeed(speed: number) {
    return this.request<{ speed_multiplier: number; message: string }>('/simulation/speed', {
      method: 'POST',
      body: JSON.stringify({ speed }),
    });
  }
}

export const api = new ApiClient();
