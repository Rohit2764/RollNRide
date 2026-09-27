from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.user import User, UserRole
from app.schemas.booking import (
    BookingCreate,
    BookingResponse,
    BookingStatusUpdate,
    BookingPriceEstimate,
    BookingEstimateRequest
)
from app.services.booking_service import BookingService
from app.api.deps import get_current_user

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.post("/estimate", response_model=BookingPriceEstimate)
def estimate_booking_cost(
    estimate_in: BookingEstimateRequest,
    db: Session = Depends(get_db)
):
    try:
        return BookingService.calculate_estimate(
            estimate_in.vehicle_id,
            estimate_in.start_time,
            estimate_in.expected_return_time,
            db
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("", response_model=BookingResponse)
async def create_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        booking = await BookingService.create_booking(current_user.id, booking_in, db)
        return booking
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("", response_model=List[BookingResponse])
def list_bookings(
    status_filter: Optional[BookingStatus] = Query(None, alias="status"),
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Booking)

    # Customers only see their own bookings; Staff/Managers/Admins see all
    if current_user.role == UserRole.CUSTOMER:
        query = query.filter(Booking.customer_id == current_user.id)

    if status_filter:
        query = query.filter(Booking.status == status_filter)

    return query.order_by(Booking.created_at.desc()).offset(offset).limit(limit).all()

@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if current_user.role == UserRole.CUSTOMER and booking.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden")

    return booking

@router.post("/{booking_id}/start", response_model=BookingResponse)
async def start_booking_trip(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        user_id = 0 if current_user.role in [UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER] else current_user.id
        return await BookingService.start_trip(booking_id, user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/{booking_id}/complete", response_model=BookingResponse)
async def complete_booking_trip(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        user_id = 0 if current_user.role in [UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER] else current_user.id
        return await BookingService.complete_trip(booking_id, user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/{booking_id}/cancel", response_model=BookingResponse)
async def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        user_id = 0 if current_user.role in [UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER] else current_user.id
        return await BookingService.cancel_booking(booking_id, user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
