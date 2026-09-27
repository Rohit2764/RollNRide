from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.maintenance import MaintenanceStatus, MaintenanceType, CleaningStatus
from app.schemas.vehicle import VehicleResponse
from app.schemas.warehouse import WarehouseResponse
from app.schemas.staff import StaffResponse

class MaintenanceCreate(BaseModel):
    vehicle_id: int
    warehouse_id: int
    type: MaintenanceType = MaintenanceType.ROUTINE_SERVICE
    description: str
    cost: float = 0.0
    estimated_completion: Optional[datetime] = None

class MaintenanceUpdate(BaseModel):
    status: Optional[MaintenanceStatus] = None
    cost: Optional[float] = None
    completed_at: Optional[datetime] = None

class MaintenanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    warehouse_id: int
    type: MaintenanceType
    description: str
    cost: float
    status: MaintenanceStatus
    estimated_completion: Optional[datetime]
    created_at: datetime
    completed_at: Optional[datetime]
    vehicle: Optional[VehicleResponse] = None
    warehouse: Optional[WarehouseResponse] = None

class CleaningTaskCreate(BaseModel):
    vehicle_id: int
    warehouse_id: int
    staff_id: Optional[int] = None
    duration_minutes: int = 20

class CleaningTaskUpdate(BaseModel):
    status: Optional[CleaningStatus] = None
    staff_id: Optional[int] = None
    completed_at: Optional[datetime] = None

class CleaningTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: int
    warehouse_id: int
    staff_id: Optional[int]
    status: CleaningStatus
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_minutes: int
    created_at: datetime
    vehicle: Optional[VehicleResponse] = None
    warehouse: Optional[WarehouseResponse] = None
    assigned_staff: Optional[StaffResponse] = None
