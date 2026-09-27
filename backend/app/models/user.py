from datetime import datetime, timezone
import enum
from sqlalchemy import Column, Integer, String, Enum, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    ADMIN = "ADMIN"
    WAREHOUSE_MANAGER = "WAREHOUSE_MANAGER"
    FLEET_MANAGER = "FLEET_MANAGER"
    OPERATIONS_MANAGER = "OPERATIONS_MANAGER"
    STAFF = "STAFF"

class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    phone = Column(String(30), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    bookings = relationship("Booking", back_populates="customer", cascade="all, delete-orphan")
    staff_profile = relationship("Staff", back_populates="user", uselist=False)
