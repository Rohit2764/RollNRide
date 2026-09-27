from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class MaintenanceStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class MaintenanceType(str, enum.Enum):
    ROUTINE_SERVICE = "ROUTINE_SERVICE"
    BATTERY_CHECK = "BATTERY_CHECK"
    TIRE_REPLACEMENT = "TIRE_REPLACEMENT"
    BRAKE_INSPECTION = "BRAKE_INSPECTION"
    BODY_REPAIR = "BODY_REPAIR"
    ELECTRICAL = "ELECTRICAL"
    EMERGENCY = "EMERGENCY"

class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    type = Column(Enum(MaintenanceType), default=MaintenanceType.ROUTINE_SERVICE, nullable=False)
    description = Column(Text, nullable=False)
    cost = Column(Float, default=0.0)
    status = Column(Enum(MaintenanceStatus), default=MaintenanceStatus.SCHEDULED, nullable=False, index=True)
    estimated_completion = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="maintenance_records")
    warehouse = relationship("Warehouse", back_populates="maintenance_records")

class CleaningStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class CleaningTask(Base):
    __tablename__ = "cleaning_tasks"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    status = Column(Enum(CleaningStatus), default=CleaningStatus.QUEUED, nullable=False, index=True)
    
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=20)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    vehicle = relationship("Vehicle", back_populates="cleaning_tasks")
    warehouse = relationship("Warehouse", back_populates="cleaning_tasks")
    assigned_staff = relationship("Staff", back_populates="cleaning_tasks")
