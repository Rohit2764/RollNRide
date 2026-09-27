from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.warehouse import Warehouse
from app.models.user import UserRole, User
from app.schemas.warehouse import (
    WarehouseResponse,
    WarehouseDetailResponse,
    WarehouseCreate,
    WarehouseUpdate,
    WarehouseWorkloadFactors
)
from app.services.warehouse_service import WarehouseService
from app.api.deps import require_roles

router = APIRouter(prefix="/warehouses", tags=["Warehouses"])

@router.get("", response_model=List[WarehouseResponse])
def get_warehouses(db: Session = Depends(get_db)):
    return WarehouseService.get_all_with_workload(db)

@router.get("/{warehouse_id}", response_model=WarehouseDetailResponse)
def get_warehouse_details(warehouse_id: int, db: Session = Depends(get_db)):
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")

    factors_dict = WarehouseService.calculate_workload(warehouse, db)
    factors = WarehouseWorkloadFactors(
        booking_load=factors_dict["booking_load"],
        dispatch_load=factors_dict["dispatch_load"],
        return_load=factors_dict["return_load"],
        maintenance_load=factors_dict["maintenance_load"],
        cleaning_load=factors_dict["cleaning_load"],
        staff_pressure=factors_dict["staff_pressure"],
        summary=factors_dict["summary"],
        recommended_action=factors_dict["recommended_action"]
    )

    # Simulated 24-hour historical workload points
    hist_workload = [
        {"time": "00:00", "score": max(10, int(warehouse.workload_score * 0.4))},
        {"time": "04:00", "score": max(8, int(warehouse.workload_score * 0.3))},
        {"time": "08:00", "score": min(95, int(warehouse.workload_score * 0.95))},
        {"time": "12:00", "score": min(100, int(warehouse.workload_score * 1.05))},
        {"time": "16:00", "score": min(100, int(warehouse.workload_score * 1.1))},
        {"time": "20:00", "score": int(warehouse.workload_score)},
    ]

    detail = WarehouseDetailResponse.model_validate(warehouse)
    detail.contributing_factors = factors
    detail.historical_workload = hist_workload
    return detail

@router.post("", response_model=WarehouseResponse)
def create_warehouse(
    wh_in: WarehouseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OPERATIONS_MANAGER]))
):
    existing = db.query(Warehouse).filter(Warehouse.code == wh_in.code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Warehouse code already exists")

    wh = Warehouse(**wh_in.model_dump())
    db.add(wh)
    db.commit()
    db.refresh(wh)
    WarehouseService.calculate_workload(wh, db)
    return wh

@router.patch("/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(
    warehouse_id: int,
    wh_in: WarehouseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.WAREHOUSE_MANAGER]))
):
    wh = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")

    for field, value in wh_in.model_dump(exclude_unset=True).items():
        setattr(wh, field, value)

    db.commit()
    db.refresh(wh)
    WarehouseService.calculate_workload(wh, db)
    return wh
