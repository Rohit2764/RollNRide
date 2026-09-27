from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.booking import BookingStatus, PaymentStatus
from app.schemas.vehicle import VehicleResponse
from app.schemas.warehouse import WarehouseResponse
from app.schemas.user import UserResponse

class BookingCreate(BaseModel):
    vehicle_id: int
    pickup_warehouse_id: int
    return_warehouse_id: int
    start_time: datetime
    expected_return_time: datetime
    pickup_location: Optional[str] = None
    return_location: Optional[str] = None

class BookingEstimateRequest(BaseModel):
    vehicle_id: int
    start_time: datetime
    expected_return_time: datetime

class BookingStatusUpdate(BaseModel):
    status: BookingStatus
    actual_return_time: Optional[datetime] = None

class BookingPriceEstimate(BaseModel):
    vehicle_id: int
    duration_hours: float
    hourly_rate: float
    daily_rate: float
    base_price: float
    taxes_fees: float
    total_amount: float

class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_reference: str
    customer_id: int
    vehicle_id: int
    pickup_warehouse_id: int
    return_warehouse_id: int
    pickup_location: Optional[str] = None
    return_location: Optional[str] = None
    start_time: datetime
    expected_return_time: datetime
    actual_return_time: Optional[datetime] = None
    status: BookingStatus
    total_amount: float
    payment_status: PaymentStatus
    created_at: datetime
    updated_at: datetime

    vehicle: Optional[VehicleResponse] = None
    pickup_warehouse: Optional[WarehouseResponse] = None
    return_warehouse: Optional[WarehouseResponse] = None
    customer: Optional[UserResponse] = None
