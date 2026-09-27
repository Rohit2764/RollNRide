from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Enum, DateTime, Boolean, Text
from app.core.database import Base

class AlertType(str, enum.Enum):
    WAREHOUSE_OVERLOAD = "WAREHOUSE_OVERLOAD"
    SEVERE_TRAFFIC = "SEVERE_TRAFFIC"
    VEHICLE_BREAKDOWN = "VEHICLE_BREAKDOWN"
    LOW_BATTERY = "LOW_BATTERY"
    MAINTENANCE_DUE = "MAINTENANCE_DUE"
    DEMAND_SHORTAGE = "DEMAND_SHORTAGE"
    STAFF_OVERLOAD = "STAFF_OVERLOAD"
    ANOMALY = "ANOMALY"

class AlertSeverity(str, enum.Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(AlertType), nullable=False, index=True)
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.INFO, nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    entity_type = Column(String(50), nullable=True) # VEHICLE, WAREHOUSE, ZONE, STAFF
    entity_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    suggested_action = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
