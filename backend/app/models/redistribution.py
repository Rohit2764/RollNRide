from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class RecommendationPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class RecommendationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    IN_TRANSIT = "IN_TRANSIT"
    COMPLETED = "COMPLETED"

class RedistributionRecommendation(Base):
    __tablename__ = "redistribution_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    source_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    destination_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    vehicle_count = Column(Integer, nullable=False, default=5)
    vehicle_type_id = Column(Integer, ForeignKey("vehicle_types.id"), nullable=True)
    priority = Column(Enum(RecommendationPriority), default=RecommendationPriority.MEDIUM, nullable=False)
    reason = Column(Text, nullable=False)
    estimated_distance_km = Column(Float, default=12.0)
    status = Column(Enum(RecommendationStatus), default=RecommendationStatus.PENDING, nullable=False, index=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    approved_at = Column(DateTime, nullable=True)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    source_warehouse = relationship("Warehouse", foreign_keys=[source_warehouse_id])
    destination_warehouse = relationship("Warehouse", foreign_keys=[destination_warehouse_id])
    vehicle_type = relationship("VehicleType", foreign_keys=[vehicle_type_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
