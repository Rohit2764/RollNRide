from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.core.database import Base

class TrafficAggregate(Base):
    __tablename__ = "traffic_aggregates"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, index=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    avg_speed = Column(Float, nullable=False)
    vehicle_count = Column(Integer, nullable=False)
    congestion_level = Column(String(30), nullable=False)

class WarehouseWorkloadAggregate(Base):
    __tablename__ = "warehouse_workload_aggregates"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, index=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    workload_score = Column(Float, nullable=False)
    active_bookings = Column(Integer, default=0)
    pending_dispatches = Column(Integer, default=0)
    pending_returns = Column(Integer, default=0)

class FleetUtilizationAggregate(Base):
    __tablename__ = "fleet_utilization_aggregates"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    total_vehicles = Column(Integer, nullable=False)
    available_vehicles = Column(Integer, nullable=False)
    in_use_vehicles = Column(Integer, nullable=False)
    maintenance_vehicles = Column(Integer, nullable=False)
    utilization_rate = Column(Float, nullable=False) # 0.0 to 100.0%
