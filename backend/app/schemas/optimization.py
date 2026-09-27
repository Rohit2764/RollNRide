from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.redistribution import RecommendationPriority, RecommendationStatus
from app.schemas.warehouse import WarehouseResponse

class RoutePoint(BaseModel):
    lat: float
    lng: float

class RouteRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float
    avoid_congested: bool = True

class RouteOption(BaseModel):
    route_name: str
    distance_km: float
    duration_minutes: float
    traffic_level: str # FREE, MODERATE, HEAVY, SEVERE
    waypoints: List[RoutePoint]
    turn_by_turn: List[str]

class RouteResponse(BaseModel):
    recommended_route: RouteOption
    alternate_route: Optional[RouteOption] = None

class RedistributionRecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_warehouse_id: int
    destination_warehouse_id: int
    vehicle_count: int
    vehicle_type_id: Optional[int] = None
    priority: RecommendationPriority
    reason: str
    estimated_distance_km: float
    status: RecommendationStatus
    created_at: datetime
    approved_at: Optional[datetime] = None
    source_warehouse: Optional[WarehouseResponse] = None
    destination_warehouse: Optional[WarehouseResponse] = None

class RedistributionAction(BaseModel):
    status: RecommendationStatus # APPROVED, REJECTED
    modified_vehicle_count: Optional[int] = None
