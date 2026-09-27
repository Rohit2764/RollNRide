from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.staff import StaffShift, StaffWorkingStatus
from app.schemas.user import UserResponse

class StaffBase(BaseModel):
    user_id: int
    warehouse_id: int
    employee_code: str
    shift: StaffShift = StaffShift.MORNING
    working_status: StaffWorkingStatus = StaffWorkingStatus.ON_DUTY
    efficiency_score: float = 90.0
    current_task: Optional[str] = None
    tasks_completed_today: int = 0

class StaffCreate(StaffBase):
    pass

class StaffUpdate(BaseModel):
    shift: Optional[StaffShift] = None
    working_status: Optional[StaffWorkingStatus] = None
    current_task: Optional[str] = None
    tasks_completed_today: Optional[int] = None
    efficiency_score: Optional[float] = None

class StaffResponse(StaffBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None
