from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.traffic import CongestionLevel

class TrafficZoneBase(BaseModel):
    name: str
    code: str
    center_lat: float
    center_lng: float
    radius_km: float = 2.5

class TrafficZoneResponse(TrafficZoneBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    current_speed_avg: float
    vehicle_density: int
    congestion_level: CongestionLevel
    updated_at: datetime

class TrafficIncidentCreate(BaseModel):
    zone_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    severity: str = "MODERATE"
    latitude: float
    longitude: float

class TrafficIncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    zone_id: Optional[int]
    title: str
    description: Optional[str]
    severity: str
    latitude: float
    longitude: float
    is_active: bool
    reported_at: datetime
    resolved_at: Optional[datetime]

class TrafficHeatmapPoint(BaseModel):
    lat: float
    lng: float
    intensity: float # 0.0 to 1.0

class TrafficHeatmapResponse(BaseModel):
    time_range: str # live, 1h, today, 7d, 30d
    points: List[TrafficHeatmapPoint]
    average_speed_kmh: float
    congestion_index: float # 0 to 100
    peak_hours: List[str]
