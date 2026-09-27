from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.maintenance import MaintenanceRecord, CleaningTask
from app.models.user import UserRole, User
from app.schemas.maintenance import (
    MaintenanceResponse,
    MaintenanceCreate,
    MaintenanceUpdate,
    CleaningTaskResponse,
    CleaningTaskCreate,
    CleaningTaskUpdate
)
from app.services.maintenance_service import MaintenanceService
from app.api.deps import require_roles

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

@router.get("", response_model=List[MaintenanceResponse])
def list_maintenance_records(
    warehouse_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(MaintenanceRecord)
    if warehouse_id:
        query = query.filter(MaintenanceRecord.warehouse_id == warehouse_id)
    return query.order_by(MaintenanceRecord.created_at.desc()).limit(limit).all()

@router.post("", response_model=MaintenanceResponse)
def create_maintenance(
    m_in: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.FLEET_MANAGER]))
):
    try:
        return MaintenanceService.create_maintenance_record(
            vehicle_id=m_in.vehicle_id,
            warehouse_id=m_in.warehouse_id,
            m_type=m_in.type,
            description=m_in.description,
            cost=m_in.cost,
            estimated_completion=m_in.estimated_completion,
            db=db
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/{record_id}", response_model=MaintenanceResponse)
def update_maintenance_record(
    record_id: int,
    m_update: MaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.FLEET_MANAGER]))
):
    try:
        return MaintenanceService.complete_maintenance(record_id, m_update.cost, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/cleaning-queue", response_model=List[CleaningTaskResponse])
def list_cleaning_tasks(warehouse_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(CleaningTask)
    if warehouse_id:
        query = query.filter(CleaningTask.warehouse_id == warehouse_id)
    return query.order_by(CleaningTask.created_at.desc()).all()

@router.post("/cleaning-queue/{task_id}/advance", response_model=CleaningTaskResponse)
def advance_cleaning_task(
    task_id: int,
    staff_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.STAFF]))
):
    try:
        return MaintenanceService.advance_cleaning_queue(task_id, staff_id, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/metrics")
def get_maintenance_metrics(warehouse_id: Optional[int] = None, db: Session = Depends(get_db)):
    return MaintenanceService.get_turnaround_metrics(warehouse_id, db)
