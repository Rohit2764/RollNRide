from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class LocationTelemetryPayload(BaseModel):
    vehicle_id: int
    latitude: float
    longitude: float
    speed: float = 0.0
    heading: float = 0.0
    timestamp: Optional[datetime] = None
    battery: float = 100.0
    fuel: Optional[float] = None
    status: Optional[str] = None
    booking_id: Optional[int] = None

class TrackingLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    booking_id: Optional[int]
    latitude: float
    longitude: float
    speed: float
    heading: float
    battery: float
    recorded_at: datetime

class LiveVehicleTelemetry(BaseModel):
    vehicle_id: int
    registration_number: str
    brand: str
    model: str
    vehicle_type: str
    status: str
    latitude: float
    longitude: float
    speed: float
    heading: float
    battery: float
    fuel: float
    warehouse_id: Optional[int]
    warehouse_name: Optional[str]
    active_booking_id: Optional[int]
    customer_name: Optional[str]
    destination: Optional[str]
    eta_minutes: Optional[int]
    last_updated: datetime
