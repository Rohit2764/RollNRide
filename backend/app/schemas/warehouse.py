from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.warehouse import WarehouseStatus

class WarehouseBase(BaseModel):
    name: str
    code: str
    address: str
    latitude: float
    longitude: float
    capacity: int = 100

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[WarehouseStatus] = None

class WarehouseWorkloadFactors(BaseModel):
    booking_load: float
    dispatch_load: float
    return_load: float
    maintenance_load: float
    cleaning_load: float
    staff_pressure: float
    summary: str
    recommended_action: str

class WarehouseResponse(WarehouseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    current_vehicle_count: int
    available_vehicle_count: int
    reserved_vehicle_count: int
    maintenance_count: int
    cleaning_count: int
    staff_count: int
    active_bookings: int
    pending_dispatches: int
    pending_returns: int
    workload_score: float
    status: WarehouseStatus
    created_at: datetime
    updated_at: datetime

class WarehouseDetailResponse(WarehouseResponse):
    contributing_factors: Optional[WarehouseWorkloadFactors] = None
    historical_workload: Optional[List[Dict[str, Any]]] = None
