from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.staff import Staff, StaffWorkingStatus
from app.models.user import UserRole, User
from app.schemas.staff import StaffResponse, StaffUpdate
from app.api.deps import require_roles

router = APIRouter(prefix="/staff", tags=["Staff"])

@router.get("", response_model=List[StaffResponse])
def list_staff(warehouse_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Staff)
    if warehouse_id:
        query = query.filter(Staff.warehouse_id == warehouse_id)
    return query.all()

@router.patch("/{staff_id}", response_model=StaffResponse)
def update_staff(
    staff_id: int,
    staff_in: StaffUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER]))
):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found")

    for field, value in staff_in.model_dump(exclude_unset=True).items():
        setattr(staff, field, value)

    db.commit()
    db.refresh(staff)
    return staff

@router.get("/workload")
def get_staff_workload_metrics(db: Session = Depends(get_db)):
    all_staff = db.query(Staff).all()
    total = len(all_staff)
    on_duty = sum(1 for s in all_staff if s.working_status == StaffWorkingStatus.ON_DUTY)
    assigned = sum(1 for s in all_staff if s.working_status == StaffWorkingStatus.ASSIGNED)
    total_tasks_completed = sum(s.tasks_completed_today for s in all_staff)
    avg_efficiency = round(sum(s.efficiency_score for s in all_staff) / max(1, total), 1)

    return {
        "total_staff": total,
        "on_duty": on_duty,
        "assigned": assigned,
        "total_tasks_completed": total_tasks_completed,
        "average_efficiency": avg_efficiency,
        "overloaded_count": sum(1 for s in all_staff if s.tasks_completed_today > 14)
    }
