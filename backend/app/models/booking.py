from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    OVERDUE = "OVERDUE"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    REFUNDED = "REFUNDED"
    FAILED = "FAILED"

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    pickup_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    return_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    pickup_location = Column(String(255), nullable=True)
    return_location = Column(String(255), nullable=True)

    start_time = Column(DateTime, nullable=False)
    expected_return_time = Column(DateTime, nullable=False)
    actual_return_time = Column(DateTime, nullable=True)
    
    status = Column(Enum(BookingStatus), default=BookingStatus.CONFIRMED, nullable=False, index=True)
    total_amount = Column(Float, nullable=False, default=0.0)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PAID, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    customer = relationship("User", back_populates="bookings")
    vehicle = relationship("Vehicle", back_populates="bookings")
    pickup_warehouse = relationship("Warehouse", foreign_keys=[pickup_warehouse_id])
    return_warehouse = relationship("Warehouse", foreign_keys=[return_warehouse_id])
    tracking_logs = relationship("TrackingLog", back_populates="booking")
