from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class WarehouseStatus(str, enum.Enum):
    NORMAL = "NORMAL"
    BUSY = "BUSY"
    HIGH_LOAD = "HIGH_LOAD"
    OVERLOADED = "OVERLOADED"
    OFFLINE = "OFFLINE"

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    code = Column(String(30), unique=True, index=True, nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=False, default=100)
    
    # Dynamic operational metrics
    current_vehicle_count = Column(Integer, default=0)
    available_vehicle_count = Column(Integer, default=0)
    reserved_vehicle_count = Column(Integer, default=0)
    maintenance_count = Column(Integer, default=0)
    cleaning_count = Column(Integer, default=0)
    staff_count = Column(Integer, default=0)
    active_bookings = Column(Integer, default=0)
    pending_dispatches = Column(Integer, default=0)
    pending_returns = Column(Integer, default=0)

    # Workload score (0.0 to 100.0)
    workload_score = Column(Float, default=0.0)
    status = Column(Enum(WarehouseStatus), default=WarehouseStatus.NORMAL, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    vehicles = relationship("Vehicle", back_populates="warehouse")
    staff_members = relationship("Staff", back_populates="warehouse")
    maintenance_records = relationship("MaintenanceRecord", back_populates="warehouse")
    cleaning_tasks = relationship("CleaningTask", back_populates="warehouse")
