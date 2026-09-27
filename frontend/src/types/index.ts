export type UserRole = 
  | 'CUSTOMER' 
  | 'ADMIN' 
  | 'WAREHOUSE_MANAGER' 
  | 'FLEET_MANAGER' 
  | 'OPERATIONS_MANAGER' 
  | 'STAFF';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
}

export interface VehicleType {
  id: number;
  name: string;
  category: 'TWO_WHEELER' | 'FOUR_WHEELER';
  hourly_rate: number;
  daily_rate: number;
  seating_capacity: number;
  range_km: number;
  fuel_type: string;
  image_url?: string;
  specifications?: string;
}

export type VehicleStatus = 
  | 'AVAILABLE'
  | 'RESERVED'
  | 'DISPATCHED'
  | 'IN_USE'
  | 'RETURNING'
  | 'RETURNED'
  | 'INSPECTION'
  | 'CLEANING'
  | 'MAINTENANCE'
  | 'DAMAGED'
  | 'INACTIVE';

export interface Vehicle {
  id: number;
  registration_number: string;
  vehicle_type_id: number;
  brand: string;
  model: string;
  year: number;
  color: string;
  warehouse_id?: number;
  status: VehicleStatus;
  current_latitude: number;
  current_longitude: number;
  current_speed: number;
  heading: number;
  battery_level: number;
  fuel_level: number;
  mileage: number;
  last_location_update: string;
  vehicle_type?: VehicleType;
}

export interface LiveVehicleTelemetry {
  vehicle_id: number;
  registration_number: string;
  brand: string;
  model: string;
  vehicle_type: string;
  status: VehicleStatus;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  battery: number;
  fuel: number;
  warehouse_id?: number;
  warehouse_name?: string;
  active_booking_id?: number;
  customer_name?: string;
  destination?: string;
  eta_minutes?: number;
  last_updated: string;
}

export type WarehouseStatus = 'NORMAL' | 'BUSY' | 'HIGH_LOAD' | 'OVERLOADED' | 'OFFLINE';

export interface WarehouseWorkloadFactors {
  booking_load: number;
  dispatch_load: number;
  return_load: number;
  maintenance_load: number;
  cleaning_load: number;
  staff_pressure: number;
  summary: string;
  recommended_action: string;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  current_vehicle_count: number;
  available_vehicle_count: number;
  reserved_vehicle_count: number;
  maintenance_count: number;
  cleaning_count: number;
  staff_count: number;
  active_bookings: number;
  pending_dispatches: number;
  pending_returns: number;
  workload_score: number;
  status: WarehouseStatus;
  contributing_factors?: WarehouseWorkloadFactors;
  historical_workload?: { time: string; score: number }[];
  created_at: string;
  updated_at: string;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';

export interface Booking {
  id: number;
  booking_reference: string;
  customer_id: number;
  vehicle_id: number;
  pickup_warehouse_id: number;
  return_warehouse_id: number;
  pickup_location?: string;
  return_location?: string;
  start_time: string;
  expected_return_time: string;
  actual_return_time?: string;
  status: BookingStatus;
  total_amount: number;
  payment_status: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
  created_at: string;
  updated_at: string;
  vehicle?: Vehicle;
  pickup_warehouse?: Warehouse;
  return_warehouse?: Warehouse;
  customer?: User;
}

export interface BookingPriceEstimate {
  vehicle_id: number;
  duration_hours: number;
  hourly_rate: number;
  daily_rate: number;
  base_price: number;
  taxes_fees: number;
  total_amount: number;
}

export type CongestionLevel = 'FREE' | 'MODERATE' | 'HEAVY' | 'SEVERE';

export interface TrafficZone {
  id: number;
  name: string;
  code: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  current_speed_avg: number;
  vehicle_density: number;
  congestion_level: CongestionLevel;
  updated_at: string;
}

export interface TrafficIncident {
  id: number;
  zone_id?: number;
  title: string;
  description?: string;
  severity: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  reported_at: string;
}

export interface TrafficHeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

export interface TrafficHeatmapResponse {
  time_range: string;
  points: TrafficHeatmapPoint[];
  average_speed_kmh: number;
  congestion_index: number;
  peak_hours: string[];
}

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteOption {
  route_name: string;
  distance_km: number;
  duration_minutes: number;
  traffic_level: string;
  waypoints: RoutePoint[];
  turn_by_turn: string[];
}

export interface RouteResponse {
  recommended_route: RouteOption;
  alternate_route?: RouteOption;
}

export interface RedistributionRecommendation {
  id: number;
  source_warehouse_id: number;
  destination_warehouse_id: number;
  vehicle_count: number;
  vehicle_type_id?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
  estimated_distance_km: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_TRANSIT' | 'COMPLETED';
  created_at: string;
  approved_at?: string;
  source_warehouse?: Warehouse;
  destination_warehouse?: Warehouse;
}

export interface HourlyDemandPoint {
  hour: number;
  hour_label: string;
  predicted_demand: number;
  available_supply: number;
  shortage_surplus: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface DemandForecastResponse {
  warehouse_id?: number;
  warehouse_name: string;
  target_date: string;
  total_predicted_demand: number;
  current_available_supply: number;
  projected_net_shortage: number;
  hourly_forecast: HourlyDemandPoint[];
  historical_comparison: { day: string; actual_demand: number; fulfillment_rate: string }[];
  recommendation: string;
}

export interface MaintenanceRecord {
  id: number;
  vehicle_id: number;
  warehouse_id: number;
  type: string;
  description: string;
  cost: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  estimated_completion?: string;
  created_at: string;
  completed_at?: string;
  vehicle?: Vehicle;
  warehouse?: Warehouse;
}

export interface CleaningTask {
  id: number;
  vehicle_id: number;
  warehouse_id: number;
  staff_id?: number;
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED';
  started_at?: string;
  completed_at?: string;
  duration_minutes: number;
  created_at: string;
  vehicle?: Vehicle;
  warehouse?: Warehouse;
  assigned_staff?: Staff;
}

export interface Staff {
  id: number;
  user_id: number;
  warehouse_id: number;
  employee_code: string;
  shift: 'MORNING' | 'EVENING' | 'NIGHT';
  working_status: 'ON_DUTY' | 'OFF_DUTY' | 'ON_BREAK' | 'ASSIGNED';
  efficiency_score: number;
  current_task?: string;
  tasks_completed_today: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Alert {
  id: number;
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: number;
  is_read: boolean;
  suggested_action?: string;
  created_at: string;
}

export interface AIOperationalInsight {
  id: string;
  category: 'FLEET' | 'WAREHOUSE' | 'TRAFFIC' | 'DEMAND';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  explanation: string;
  recommended_action: string;
  confidence: number;
  related_entity?: string;
}

export interface OperationsDashboardResponse {
  fleet: {
    total_vehicles: number;
    available_vehicles: number;
    in_use_vehicles: number;
    maintenance_vehicles: number;
    cleaning_vehicles: number;
    idle_vehicles: number;
    utilization_rate: number;
  };
  bookings: {
    today_count: number;
    active_count: number;
    completed_count: number;
    cancelled_count: number;
    revenue_today: number;
    revenue_weekly: number;
    revenue_monthly: number;
    average_booking_value: number;
  };
  warehouse: {
    average_workload: number;
    highest_workload_name: string;
    highest_workload_score: number;
    pending_dispatches: number;
    pending_returns: number;
    overloaded_count: number;
  };
  traffic: {
    current_congestion_level: string;
    average_speed_kmh: number;
    active_trips: number;
    active_incidents: number;
  };
  ai_insights: AIOperationalInsight[];
  revenue_trend: { date: string; revenue: number; trips: number }[];
  fleet_utilization_trend: { time: string; utilization: number }[];
  warehouse_workload_distribution: { name: string; code: string; workload: number; capacity: number; vehicles: number }[];
  simulation_active: boolean;
}
