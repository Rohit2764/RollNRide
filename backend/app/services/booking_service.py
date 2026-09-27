import uuid
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.booking import Booking, BookingStatus, PaymentStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.warehouse import Warehouse
from app.models.maintenance import CleaningTask, CleaningStatus
from app.schemas.booking import BookingCreate, BookingPriceEstimate
from app.services.warehouse_service import WarehouseService
from app.websocket.manager import ws_manager

class BookingService:
    @staticmethod
    def calculate_estimate(vehicle_id: int, start_time: datetime, expected_return_time: datetime, db: Session) -> BookingPriceEstimate:
        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not vehicle:
            raise ValueError("Vehicle not found")

        v_type = vehicle.vehicle_type
        duration_seconds = (expected_return_time - start_time).total_seconds()
        duration_hours = max(1.0, duration_seconds / 3600.0)

        if duration_hours >= 24.0:
            days = duration_hours / 24.0
            base_price = days * v_type.daily_rate
        else:
            base_price = duration_hours * v_type.hourly_rate

        taxes_fees = round(base_price * 0.18, 2) # 18% GST / service tax
        total = round(base_price + taxes_fees, 2)

        return BookingPriceEstimate(
            vehicle_id=vehicle.id,
            duration_hours=round(duration_hours, 1),
            hourly_rate=v_type.hourly_rate,
            daily_rate=v_type.daily_rate,
            base_price=round(base_price, 2),
            taxes_fees=taxes_fees,
            total_amount=total
        )

    @staticmethod
    async def create_booking(customer_id: int, booking_data: BookingCreate, db: Session) -> Booking:
        vehicle = db.query(Vehicle).filter(Vehicle.id == booking_data.vehicle_id).first()
        if not vehicle:
            raise ValueError("Vehicle not found")

        if vehicle.status != VehicleStatus.AVAILABLE:
            raise ValueError(f"Vehicle is not available for booking (Status: {vehicle.status.value})")

        estimate = BookingService.calculate_estimate(
            vehicle.id,
            booking_data.start_time,
            booking_data.expected_return_time,
            db
        )

        booking_ref = f"RNR-{uuid.uuid4().hex[:8].upper()}"

        new_booking = Booking(
            booking_reference=booking_ref,
            customer_id=customer_id,
            vehicle_id=vehicle.id,
            pickup_warehouse_id=booking_data.pickup_warehouse_id,
            return_warehouse_id=booking_data.return_warehouse_id,
            pickup_location=booking_data.pickup_location or "Designated Bay",
            return_location=booking_data.return_location or "Designated Bay",
            start_time=booking_data.start_time,
            expected_return_time=booking_data.expected_return_time,
            status=BookingStatus.CONFIRMED,
            total_amount=estimate.total_amount,
            payment_status=PaymentStatus.PAID
        )
        db.add(new_booking)

        # Mark vehicle as RESERVED
        vehicle.status = VehicleStatus.RESERVED

        # Refresh workload of pickup warehouse
        p_wh = db.query(Warehouse).filter(Warehouse.id == booking_data.pickup_warehouse_id).first()
        if p_wh:
            WarehouseService.calculate_workload(p_wh, db)

        db.commit()
        db.refresh(new_booking)

        # Broadcast via WebSocket
        await ws_manager.broadcast_event(
            "booking_created",
            {
                "booking_id": new_booking.id,
                "reference": new_booking.booking_reference,
                "vehicle_id": vehicle.id,
                "pickup_warehouse_id": booking_data.pickup_warehouse_id,
                "total_amount": new_booking.total_amount
            },
            ["dashboard", f"warehouse:{booking_data.pickup_warehouse_id}"]
        )

        return new_booking

    @staticmethod
    async def start_trip(booking_id: int, customer_id: int, db: Session) -> Booking:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise ValueError("Booking not found")

        if booking.customer_id != customer_id and customer_id != 0: # 0 for admin override
            raise ValueError("Unauthorized to start this booking")

        booking.status = BookingStatus.ACTIVE
        booking.vehicle.status = VehicleStatus.IN_USE

        p_wh = db.query(Warehouse).filter(Warehouse.id == booking.pickup_warehouse_id).first()
        if p_wh:
            WarehouseService.calculate_workload(p_wh, db)

        db.commit()
        db.refresh(booking)

        await ws_manager.broadcast_event(
            "vehicle_status_changed",
            {"vehicle_id": booking.vehicle_id, "status": VehicleStatus.IN_USE.value},
            ["fleet", "dashboard"]
        )

        return booking

    @staticmethod
    async def complete_trip(booking_id: int, customer_id: int, db: Session) -> Booking:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise ValueError("Booking not found")

        now = datetime.now(timezone.utc)
        booking.actual_return_time = now
        booking.status = BookingStatus.COMPLETED

        # Transition vehicle to RETURNED -> queued for turnaround cleaning
        vehicle = booking.vehicle
        vehicle.status = VehicleStatus.RETURNED
        vehicle.warehouse_id = booking.return_warehouse_id

        # Automatically enqueue Cleaning & Turnaround Task
        cleaning_task = CleaningTask(
            vehicle_id=vehicle.id,
            warehouse_id=booking.return_warehouse_id,
            status=CleaningStatus.QUEUED,
            duration_minutes=20
        )
        db.add(cleaning_task)

        # Update destination warehouse workload
        ret_wh = db.query(Warehouse).filter(Warehouse.id == booking.return_warehouse_id).first()
        if ret_wh:
            WarehouseService.calculate_workload(ret_wh, db)

        db.commit()
        db.refresh(booking)

        await ws_manager.broadcast_event(
            "booking_completed",
            {
                "booking_id": booking.id,
                "vehicle_id": vehicle.id,
                "return_warehouse_id": booking.return_warehouse_id
            },
            ["dashboard", "fleet", f"warehouse:{booking.return_warehouse_id}"]
        )

        return booking

    @staticmethod
    async def cancel_booking(booking_id: int, customer_id: int, db: Session) -> Booking:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise ValueError("Booking not found")

        if booking.status in [BookingStatus.ACTIVE, BookingStatus.COMPLETED]:
            raise ValueError(f"Cannot cancel booking in {booking.status.value} status")

        booking.status = BookingStatus.CANCELLED
        booking.payment_status = PaymentStatus.REFUNDED

        # Free vehicle back to AVAILABLE
        booking.vehicle.status = VehicleStatus.AVAILABLE

        # Recalculate warehouse workload
        p_wh = db.query(Warehouse).filter(Warehouse.id == booking.pickup_warehouse_id).first()
        if p_wh:
            WarehouseService.calculate_workload(p_wh, db)

        db.commit()
        db.refresh(booking)

        await ws_manager.broadcast_event(
            "vehicle_status_changed",
            {"vehicle_id": booking.vehicle_id, "status": VehicleStatus.AVAILABLE.value},
            ["fleet", "dashboard"]
        )

        return booking
