from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.gps import TrackingLog
from app.models.booking import Booking, BookingStatus
from app.models.notification import Alert, AlertType, AlertSeverity
from app.schemas.tracking import LocationTelemetryPayload, LiveVehicleTelemetry
from app.websocket.manager import ws_manager

class FleetService:
    @staticmethod
    async def process_location_telemetry(payload: LocationTelemetryPayload, db: Session) -> Vehicle:
        vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
        if not vehicle:
            raise ValueError(f"Vehicle with ID {payload.vehicle_id} not found")

        # Update vehicle coordinates & telemetry
        vehicle.current_latitude = payload.latitude
        vehicle.current_longitude = payload.longitude
        vehicle.current_speed = payload.speed
        vehicle.heading = payload.heading
        vehicle.battery_level = payload.battery
        if payload.fuel is not None:
            vehicle.fuel_level = payload.fuel
        if payload.status:
            try:
                vehicle.status = VehicleStatus(payload.status)
            except ValueError:
                pass
        vehicle.last_location_update = payload.timestamp or datetime.now(timezone.utc)

        # Record in tracking logs
        log_entry = TrackingLog(
            vehicle_id=vehicle.id,
            booking_id=payload.booking_id,
            latitude=payload.latitude,
            longitude=payload.longitude,
            speed=payload.speed,
            heading=payload.heading,
            battery=payload.battery,
            recorded_at=vehicle.last_location_update
        )
        db.add(log_entry)

        # Low battery alert check
        if vehicle.battery_level < 15.0:
            existing_alert = db.query(Alert).filter(
                Alert.type == AlertType.LOW_BATTERY,
                Alert.entity_id == vehicle.id,
                Alert.is_read == False
            ).first()
            if not existing_alert:
                alert = Alert(
                    type=AlertType.LOW_BATTERY,
                    severity=AlertSeverity.CRITICAL if vehicle.battery_level < 8.0 else AlertSeverity.WARNING,
                    title=f"Low Battery: {vehicle.registration_number}",
                    message=f"Vehicle battery dropped to {vehicle.battery_level:.1f}%. Immediate recharge required.",
                    entity_type="VEHICLE",
                    entity_id=vehicle.id,
                    suggested_action="Route vehicle to charging bay upon trip return."
                )
                db.add(alert)

        db.commit()
        db.refresh(vehicle)

        # Broadcast telemetry over WebSockets
        ws_payload = {
            "vehicle_id": vehicle.id,
            "registration_number": vehicle.registration_number,
            "status": vehicle.status.value,
            "latitude": vehicle.current_latitude,
            "longitude": vehicle.current_longitude,
            "speed": vehicle.current_speed,
            "heading": vehicle.heading,
            "battery": vehicle.battery_level,
            "last_updated": vehicle.last_location_update.isoformat()
        }
        await ws_manager.broadcast_event("vehicle_location_updated", ws_payload, ["fleet", "dashboard"])

        return vehicle

    @staticmethod
    def get_live_fleet(db: Session) -> List[LiveVehicleTelemetry]:
        vehicles = db.query(Vehicle).all()
        results: List[LiveVehicleTelemetry] = []

        for v in vehicles:
            # Check for active trip
            active_booking = db.query(Booking).filter(
                Booking.vehicle_id == v.id,
                Booking.status.in_([BookingStatus.ACTIVE, BookingStatus.CONFIRMED])
            ).first()

            customer_name = active_booking.customer.name if active_booking and active_booking.customer else None
            destination = active_booking.return_warehouse.name if active_booking and active_booking.return_warehouse else None
            eta_min = 25 if (active_booking and v.status == VehicleStatus.IN_USE) else None

            results.append(LiveVehicleTelemetry(
                vehicle_id=v.id,
                registration_number=v.registration_number,
                brand=v.brand,
                model=v.model,
                vehicle_type=v.vehicle_type.name if v.vehicle_type else "Vehicle",
                status=v.status.value,
                latitude=v.current_latitude,
                longitude=v.current_longitude,
                speed=v.current_speed,
                heading=v.heading,
                battery=v.battery_level,
                fuel=v.fuel_level,
                warehouse_id=v.warehouse_id,
                warehouse_name=v.warehouse.name if v.warehouse else "En Route",
                active_booking_id=active_booking.id if active_booking else None,
                customer_name=customer_name,
                destination=destination,
                eta_minutes=eta_min,
                last_updated=v.last_location_update or datetime.now(timezone.utc)
            ))

        return results
