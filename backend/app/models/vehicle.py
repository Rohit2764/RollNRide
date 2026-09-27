from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class VehicleStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    RESERVED = "RESERVED"
    DISPATCHED = "DISPATCHED"
    IN_USE = "IN_USE"
    RETURNING = "RETURNING"
    RETURNED = "RETURNED"
    INSPECTION = "INSPECTION"
    CLEANING = "CLEANING"
    MAINTENANCE = "MAINTENANCE"
    DAMAGED = "DAMAGED"
    INACTIVE = "INACTIVE"

class VehicleType(Base):
    __tablename__ = "vehicle_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), unique=True, nullable=False) # Scooter, Electric Bike, Bike, Sedan, Electric Car, SUV
    category = Column(String(50), nullable=False) # TWO_WHEELER, FOUR_WHEELER
    hourly_rate = Column(Float, nullable=False)
    daily_rate = Column(Float, nullable=False)
    seating_capacity = Column(Integer, default=2)
    range_km = Column(Float, default=100.0)
    fuel_type = Column(String(30), default="ELECTRIC") # ELECTRIC, PETROL, HYBRID
    image_url = Column(String(255), nullable=True)
    specifications = Column(Text, nullable=True) # JSON or text details

    vehicles = relationship("Vehicle", back_populates="vehicle_type")

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(30), unique=True, index=True, nullable=False)
    vehicle_type_id = Column(Integer, ForeignKey("vehicle_types.id"), nullable=False)
    brand = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False, default=2024)
    color = Column(String(30), default="White")
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    status = Column(Enum(VehicleStatus), default=VehicleStatus.AVAILABLE, nullable=False, index=True)

    # Telemetry
    current_latitude = Column(Float, nullable=False)
    current_longitude = Column(Float, nullable=False)
    current_speed = Column(Float, default=0.0)
    heading = Column(Float, default=0.0)
    battery_level = Column(Float, default=100.0)
    fuel_level = Column(Float, default=100.0)
    mileage = Column(Float, default=0.0)
    last_location_update = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    vehicle_type = relationship("VehicleType", back_populates="vehicles")
    warehouse = relationship("Warehouse", back_populates="vehicles")
    bookings = relationship("Booking", back_populates="vehicle")
    tracking_logs = relationship("TrackingLog", back_populates="vehicle", cascade="all, delete-orphan")
    maintenance_records = relationship("MaintenanceRecord", back_populates="vehicle")
    cleaning_tasks = relationship("CleaningTask", back_populates="vehicle")
