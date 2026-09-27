from typing import List
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.booking import Booking, BookingStatus
from app.models.warehouse import Warehouse, WarehouseStatus
from app.models.notification import Alert, AlertType, AlertSeverity

class AnomalyService:
    @staticmethod
    def detect_anomalies(db: Session) -> List[Alert]:
        new_alerts = []
        now = datetime.now(timezone.utc)

        # 1. Overdue Trips Detection
        overdue_bookings = db.query(Booking).filter(
            Booking.status == BookingStatus.ACTIVE,
            Booking.expected_return_time < (now - timedelta(hours=1))
        ).all()

        for b in overdue_bookings:
            # Check if alert already logged
            exists = db.query(Alert).filter(
                Alert.type == AlertType.ANOMALY,
                Alert.entity_type == "BOOKING",
                Alert.entity_id == b.id,
                Alert.is_read == False
            ).first()
            if not exists:
                b.status = BookingStatus.OVERDUE
                alert = Alert(
                    type=AlertType.ANOMALY,
                    severity=AlertSeverity.WARNING,
                    title=f"Overdue Trip Detected: {b.booking_reference}",
                    message=f"Vehicle {b.vehicle.registration_number} is overdue by more than 1 hour.",
                    entity_type="BOOKING",
                    entity_id=b.id,
                    suggested_action="Contact customer and verify current location telemetry."
                )
                db.add(alert)
                new_alerts.append(alert)

        # 2. Warehouse Workload Spike
        critical_warehouses = db.query(Warehouse).filter(
            Warehouse.workload_score >= 80.0
        ).all()

        for wh in critical_warehouses:
            exists = db.query(Alert).filter(
                Alert.type == AlertType.WAREHOUSE_OVERLOAD,
                Alert.entity_id == wh.id,
                Alert.is_read == False
            ).first()
            if not exists:
                alert = Alert(
                    type=AlertType.WAREHOUSE_OVERLOAD,
                    severity=AlertSeverity.CRITICAL,
                    title=f"Workload Surge: {wh.name}",
                    message=f"Warehouse workload reached critical level ({wh.workload_score:.1f}%). Queues backlogged.",
                    entity_type="WAREHOUSE",
                    entity_id=wh.id,
                    suggested_action="Trigger inter-depot vehicle transfer and reassign float staff."
                )
                db.add(alert)
                new_alerts.append(alert)

        # 3. Vehicle Battery Drainage
        critical_battery_vehicles = db.query(Vehicle).filter(
            Vehicle.status.in_([VehicleStatus.IN_USE, VehicleStatus.DISPATCHED]),
            Vehicle.battery_level < 10.0
        ).all()

        for v in critical_battery_vehicles:
            exists = db.query(Alert).filter(
                Alert.type == AlertType.LOW_BATTERY,
                Alert.entity_id == v.id,
                Alert.is_read == False
            ).first()
            if not exists:
                alert = Alert(
                    type=AlertType.LOW_BATTERY,
                    severity=AlertSeverity.CRITICAL,
                    title=f"Critical Battery Drain: {v.registration_number}",
                    message=f"Vehicle is actively running with only {v.battery_level:.1f}% battery remaining.",
                    entity_type="VEHICLE",
                    entity_id=v.id,
                    suggested_action="Direct driver to nearest charging hub immediately."
                )
                db.add(alert)
                new_alerts.append(alert)

        db.commit()
        return new_alerts
