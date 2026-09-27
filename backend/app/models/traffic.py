from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, Boolean, Text
from app.core.database import Base

class CongestionLevel(str, enum.Enum):
    FREE = "FREE"         # >= 40 km/h (Green)
    MODERATE = "MODERATE" # 25 - 40 km/h (Yellow)
    HEAVY = "HEAVY"       # 15 - 25 km/h (Orange)
    SEVERE = "SEVERE"     # < 15 km/h (Red)

class TrafficZone(Base):
    __tablename__ = "traffic_zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(30), unique=True, index=True, nullable=False)
    center_lat = Column(Float, nullable=False)
    center_lng = Column(Float, nullable=False)
    radius_km = Column(Float, default=2.5)
    
    current_speed_avg = Column(Float, default=35.0) # km/h
    vehicle_density = Column(Integer, default=10) # count of active vehicles
    congestion_level = Column(Enum(CongestionLevel), default=CongestionLevel.FREE, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class TrafficIncident(Base):
    __tablename__ = "traffic_incidents"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, nullable=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(30), default="MODERATE") # MINOR, MODERATE, MAJOR, CRITICAL
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)
