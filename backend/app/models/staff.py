from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class StaffShift(str, enum.Enum):
    MORNING = "MORNING"
    EVENING = "EVENING"
    NIGHT = "NIGHT"

class StaffWorkingStatus(str, enum.Enum):
    ON_DUTY = "ON_DUTY"
    OFF_DUTY = "OFF_DUTY"
    ON_BREAK = "ON_BREAK"
    ASSIGNED = "ASSIGNED"

class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    employee_code = Column(String(30), unique=True, index=True, nullable=False)
    shift = Column(Enum(StaffShift), default=StaffShift.MORNING, nullable=False)
    working_status = Column(Enum(StaffWorkingStatus), default=StaffWorkingStatus.ON_DUTY, nullable=False)
    efficiency_score = Column(Float, default=90.0) # 0 to 100
    current_task = Column(String(255), nullable=True)
    tasks_completed_today = Column(Integer, default=0)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="staff_profile")
    warehouse = relationship("Warehouse", back_populates="staff_members")
    cleaning_tasks = relationship("CleaningTask", back_populates="assigned_staff")
