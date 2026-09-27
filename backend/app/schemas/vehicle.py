from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.vehicle import VehicleStatus

class VehicleTypeBase(BaseModel):
    name: str
    category: str
    hourly_rate: float
    daily_rate: float
    seating_capacity: int = 2
    range_km: float = 100.0
    fuel_type: str = "ELECTRIC"
    image_url: Optional[str] = None
    specifications: Optional[str] = None

class VehicleTypeCreate(VehicleTypeBase):
    pass

class VehicleTypeResponse(VehicleTypeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int

class VehicleBase(BaseModel):
    registration_number: str
    vehicle_type_id: int
    brand: str
    model: str
    year: int = 2024
    color: str = "White"
    warehouse_id: Optional[int] = None
    status: VehicleStatus = VehicleStatus.AVAILABLE
    current_latitude: float
    current_longitude: float
    current_speed: float = 0.0
    heading: float = 0.0
    battery_level: float = 100.0
    fuel_level: float = 100.0
    mileage: float = 0.0

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    status: Optional[VehicleStatus] = None
    warehouse_id: Optional[int] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    current_speed: Optional[float] = None
    heading: Optional[float] = None
    battery_level: Optional[float] = None
    mileage: Optional[float] = None

class VehicleResponse(VehicleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    last_location_update: datetime
    created_at: datetime
    updated_at: datetime
    vehicle_type: Optional[VehicleTypeResponse] = None
