from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.maintenance import (
    MaintenanceRecord,
    MaintenanceStatus,
    MaintenanceType,
    CleaningTask,
    CleaningStatus
)
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.warehouse import Warehouse
from app.models.staff import Staff, StaffWorkingStatus
from app.models.notification import Alert, AlertType, AlertSeverity
from app.services.warehouse_service import WarehouseService

class MaintenanceService:
    @staticmethod
    def create_maintenance_record(
        vehicle_id: int,
        warehouse_id: int,
        m_type: MaintenanceType,
        description: str,
        cost: float,
        estimated_completion: Optional[datetime],
        db: Session
    ) -> MaintenanceRecord:
        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not vehicle:
            raise ValueError("Vehicle not found")

        record = MaintenanceRecord(
            vehicle_id=vehicle_id,
            warehouse_id=warehouse_id,
            type=m_type,
            description=description,
            cost=cost,
            status=MaintenanceStatus.SCHEDULED,
            estimated_completion=estimated_completion
        )
        db.add(record)

        # Update vehicle status to MAINTENANCE
        vehicle.status = VehicleStatus.MAINTENANCE
        vehicle.warehouse_id = warehouse_id

        # Update warehouse workload
        wh = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
        if wh:
            WarehouseService.calculate_workload(wh, db)

        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def complete_maintenance(record_id: int, actual_cost: Optional[float], db: Session) -> MaintenanceRecord:
        record = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == record_id).first()
        if not record:
            raise ValueError("Maintenance record not found")

        record.status = MaintenanceStatus.COMPLETED
        record.completed_at = datetime.now(timezone.utc)
        if actual_cost is not None:
            record.cost = actual_cost

        # Vehicle returns to AVAILABLE status
        record.vehicle.status = VehicleStatus.AVAILABLE

        # Update warehouse workload
        wh = db.query(Warehouse).filter(Warehouse.id == record.warehouse_id).first()
        if wh:
            WarehouseService.calculate_workload(wh, db)

        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def advance_cleaning_queue(task_id: int, staff_id: Optional[int], db: Session) -> CleaningTask:
        """
        Advance vehicle along the turnaround pipeline:
        RETURNED -> INSPECTION / CLEANING -> AVAILABLE
        """
        task = db.query(CleaningTask).filter(CleaningTask.id == task_id).first()
        if not task:
            raise ValueError("Cleaning task not found")

        vehicle = task.vehicle
        now = datetime.now(timezone.utc)

        if task.status == CleaningStatus.QUEUED:
            task.status = CleaningStatus.IN_PROGRESS
            task.started_at = now
            task.staff_id = staff_id
            vehicle.status = VehicleStatus.CLEANING

            # Assign staff member task
            if staff_id:
                staff = db.query(Staff).filter(Staff.id == staff_id).first()
                if staff:
                    staff.current_task = f"Cleaning & Prep: {vehicle.registration_number}"
                    staff.working_status = StaffWorkingStatus.ASSIGNED

        elif task.status == CleaningStatus.IN_PROGRESS:
            task.status = CleaningStatus.COMPLETED
            task.completed_at = now
            vehicle.status = VehicleStatus.AVAILABLE

            # Free staff member
            if task.staff_id:
                staff = db.query(Staff).filter(Staff.id == task.staff_id).first()
                if staff:
                    staff.current_task = None
                    staff.working_status = StaffWorkingStatus.ON_DUTY
                    staff.tasks_completed_today += 1

        wh = db.query(Warehouse).filter(Warehouse.id == task.warehouse_id).first()
        if wh:
            WarehouseService.calculate_workload(wh, db)

        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def get_turnaround_metrics(warehouse_id: Optional[int], db: Session) -> Dict[str, Any]:
        query = db.query(CleaningTask)
        if warehouse_id:
            query = query.filter(CleaningTask.warehouse_id == warehouse_id)

        completed_tasks = query.filter(CleaningTask.status == CleaningStatus.COMPLETED).all()
        if not completed_tasks:
            avg_duration = 22.5
        else:
            durations = [t.duration_minutes for t in completed_tasks if t.duration_minutes]
            avg_duration = sum(durations) / len(durations) if durations else 20.0

        queued_count = query.filter(CleaningTask.status == CleaningStatus.QUEUED).count()
        in_progress_count = query.filter(CleaningTask.status == CleaningStatus.IN_PROGRESS).count()

        return {
            "average_turnaround_minutes": round(avg_duration, 1),
            "queued_vehicles": queued_count,
            "in_progress_cleaning": in_progress_count,
            "completed_today": len(completed_tasks)
        }
