from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class FleetKPIs(BaseModel):
    total_vehicles: int
    available_vehicles: int
    in_use_vehicles: int
    maintenance_vehicles: int
    cleaning_vehicles: int
    idle_vehicles: int
    utilization_rate: float # 0 to 100%

class BookingKPIs(BaseModel):
    today_count: int
    active_count: int
    completed_count: int
    cancelled_count: int
    revenue_today: float
    revenue_weekly: float
    revenue_monthly: float
    average_booking_value: float

class WarehouseKPIs(BaseModel):
    average_workload: float
    highest_workload_name: str
    highest_workload_score: float
    pending_dispatches: int
    pending_returns: int
    overloaded_count: int

class TrafficKPIs(BaseModel):
    current_congestion_level: str
    average_speed_kmh: float
    active_trips: int
    active_incidents: int

class AIOperationalInsight(BaseModel):
    id: str
    category: str # FLEET, WAREHOUSE, TRAFFIC, DEMAND
    severity: str # INFO, WARNING, CRITICAL
    title: str
    explanation: str
    recommended_action: str
    confidence: float
    related_entity: Optional[str] = None

class OperationsDashboardResponse(BaseModel):
    fleet: FleetKPIs
    bookings: BookingKPIs
    warehouse: WarehouseKPIs
    traffic: TrafficKPIs
    ai_insights: List[AIOperationalInsight]
    revenue_trend: List[Dict[str, Any]]
    fleet_utilization_trend: List[Dict[str, Any]]
    warehouse_workload_distribution: List[Dict[str, Any]]
    simulation_active: bool
