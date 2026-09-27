from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class TrackingLog(Base):
    __tablename__ = "tracking_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed = Column(Float, default=0.0) # km/h
    heading = Column(Float, default=0.0) # degrees
    battery = Column(Float, default=100.0) # percentage
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    vehicle = relationship("Vehicle", back_populates="tracking_logs")
    booking = relationship("Booking", back_populates="tracking_logs")
