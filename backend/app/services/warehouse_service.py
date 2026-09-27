from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.warehouse import Warehouse, WarehouseStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.booking import Booking, BookingStatus
from app.models.maintenance import MaintenanceRecord, MaintenanceStatus, CleaningTask, CleaningStatus
from app.models.staff import Staff, StaffWorkingStatus

class WarehouseService:
    @staticmethod
    def calculate_workload(warehouse: Warehouse, db: Session) -> Dict[str, Any]:
        """
        Calculate warehouse workload dynamically (0 - 100):
        Workload Score = Booking Load * 0.25 + Dispatch Load * 0.20 + Return Load * 0.15 
                       + Maintenance Load * 0.15 + Cleaning Load * 0.10 + Staff Pressure * 0.15
        """
        capacity = max(1, warehouse.capacity)
        available_staff = max(1, warehouse.staff_count)

        # Count active stats directly from db if needed
        active_bookings_count = db.query(Booking).filter(
            Booking.pickup_warehouse_id == warehouse.id,
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.ACTIVE])
        ).count()

        pending_dispatches = db.query(Booking).filter(
            Booking.pickup_warehouse_id == warehouse.id,
            Booking.status == BookingStatus.CONFIRMED
        ).count()

        pending_returns = db.query(Booking).filter(
            Booking.return_warehouse_id == warehouse.id,
            Booking.status == BookingStatus.ACTIVE
        ).count()

        maintenance_count = db.query(Vehicle).filter(
            Vehicle.warehouse_id == warehouse.id,
            Vehicle.status.in_([VehicleStatus.MAINTENANCE, VehicleStatus.DAMAGED])
        ).count()

        cleaning_count = db.query(Vehicle).filter(
            Vehicle.warehouse_id == warehouse.id,
            Vehicle.status.in_([VehicleStatus.RETURNED, VehicleStatus.INSPECTION, VehicleStatus.CLEANING])
        ).count()

        # Update cached counts on warehouse model
        warehouse.active_bookings = active_bookings_count
        warehouse.pending_dispatches = pending_dispatches
        warehouse.pending_returns = pending_returns
        warehouse.maintenance_count = maintenance_count
        warehouse.cleaning_count = cleaning_count

        # Normalized Component Loads (0 - 100)
        booking_load = min(100.0, (active_bookings_count / capacity) * 100.0)
        dispatch_load = min(100.0, (pending_dispatches / (available_staff * 2.0)) * 100.0)
        return_load = min(100.0, (pending_returns / (available_staff * 2.0)) * 100.0)
        maintenance_load = min(100.0, (maintenance_count / max(1, capacity * 0.15)) * 100.0)
        cleaning_load = min(100.0, (cleaning_count / max(1, available_staff * 1.5)) * 100.0)
        
        # Staff pressure based on total pending tasks vs staff
        total_pending_tasks = pending_dispatches + pending_returns + cleaning_count + maintenance_count
        staff_pressure = min(100.0, (total_pending_tasks / max(1, available_staff * 3.0)) * 100.0)

        # Final Weighted Score
        score = (
            booking_load * 0.25 +
            dispatch_load * 0.20 +
            return_load * 0.15 +
            maintenance_load * 0.15 +
            cleaning_load * 0.10 +
            staff_pressure * 0.15
        )
        score = round(min(100.0, max(0.0, score)), 1)
        warehouse.workload_score = score

        # Map to WarehouseStatus
        if score <= 30.0:
            status = WarehouseStatus.NORMAL
        elif score <= 60.0:
            status = WarehouseStatus.BUSY
        elif score <= 80.0:
            status = WarehouseStatus.HIGH_LOAD
        else:
            status = WarehouseStatus.OVERLOADED
        warehouse.status = status

        # Detailed factors & recommendations
        main_causes = []
        if dispatch_load > 60:
            main_causes.append(f"{pending_dispatches} pending dispatches creating backlog")
        if return_load > 60:
            main_causes.append(f"{pending_returns} pending returns incoming")
        if maintenance_load > 50:
            main_causes.append(f"{maintenance_count} vehicles waiting in maintenance bay")
        if cleaning_load > 50:
            main_causes.append(f"{cleaning_count} vehicles queued for turnaround cleaning")
        if staff_pressure > 70:
            main_causes.append("Staffing ratio below peak operational threshold")

        summary = "Operational load within healthy tolerances."
        if main_causes:
            summary = " • ".join(main_causes)

        recommended_action = "Maintain regular operations."
        if status == WarehouseStatus.OVERLOADED:
            recommended_action = "Reallocate 10-20 upcoming reservations to nearby depot and assign 2 float staff to clearing queue."
        elif status == WarehouseStatus.HIGH_LOAD:
            recommended_action = "Expedite cleaning bay turnaround and monitor incoming return window."
        elif status == WarehouseStatus.BUSY:
            recommended_action = "Pre-stage reserved vehicles for rapid dispatch."

        db.commit()

        return {
            "workload_score": score,
            "status": status,
            "booking_load": round(booking_load, 1),
            "dispatch_load": round(dispatch_load, 1),
            "return_load": round(return_load, 1),
            "maintenance_load": round(maintenance_load, 1),
            "cleaning_load": round(cleaning_load, 1),
            "staff_pressure": round(staff_pressure, 1),
            "summary": summary,
            "recommended_action": recommended_action
        }

    @staticmethod
    def get_all_with_workload(db: Session) -> List[Warehouse]:
        warehouses = db.query(Warehouse).all()
        for wh in warehouses:
            # Refresh counts
            wh.current_vehicle_count = db.query(Vehicle).filter(Vehicle.warehouse_id == wh.id).count()
            wh.available_vehicle_count = db.query(Vehicle).filter(
                Vehicle.warehouse_id == wh.id,
                Vehicle.status == VehicleStatus.AVAILABLE
            ).count()
            wh.reserved_vehicle_count = db.query(Vehicle).filter(
                Vehicle.warehouse_id == wh.id,
                Vehicle.status == VehicleStatus.RESERVED
            ).count()
            wh.staff_count = db.query(Staff).filter(Staff.warehouse_id == wh.id).count()
            WarehouseService.calculate_workload(wh, db)
        db.commit()
        return warehouses
