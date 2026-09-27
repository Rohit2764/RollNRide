from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.vehicle import Vehicle, VehicleType, VehicleStatus
from app.models.user import UserRole, User
from app.schemas.vehicle import (
    VehicleResponse,
    VehicleCreate,
    VehicleUpdate,
    VehicleTypeResponse,
    VehicleTypeCreate
)
from app.api.deps import require_roles, get_current_user

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.get("/types", response_model=List[VehicleTypeResponse])
def list_vehicle_types(db: Session = Depends(get_db)):
    return db.query(VehicleType).all()

@router.post("/types", response_model=VehicleTypeResponse)
def create_vehicle_type(
    v_type_in: VehicleTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.FLEET_MANAGER]))
):
    v_type = VehicleType(**v_type_in.model_dump())
    db.add(v_type)
    db.commit()
    db.refresh(v_type)
    return v_type

@router.get("", response_model=List[VehicleResponse])
def list_vehicles(
    warehouse_id: Optional[int] = None,
    vehicle_type_id: Optional[int] = None,
    status_filter: Optional[VehicleStatus] = Query(None, alias="status"),
    category: Optional[str] = None,
    fuel_type: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Vehicle).join(Vehicle.vehicle_type)

    if warehouse_id:
        query = query.filter(Vehicle.warehouse_id == warehouse_id)
    if vehicle_type_id:
        query = query.filter(Vehicle.vehicle_type_id == vehicle_type_id)
    if status_filter:
        query = query.filter(Vehicle.status == status_filter)
    if category:
        query = query.filter(VehicleType.category == category)
    if fuel_type:
        query = query.filter(VehicleType.fuel_type == fuel_type)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Vehicle.registration_number.ilike(s)) |
            (Vehicle.brand.ilike(s)) |
            (Vehicle.model.ilike(s))
        )

    return query.offset(offset).limit(limit).all()

@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle_by_id(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle

@router.post("", response_model=VehicleResponse)
def create_vehicle(
    vehicle_in: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.FLEET_MANAGER]))
):
    existing = db.query(Vehicle).filter(Vehicle.registration_number == vehicle_in.registration_number).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration number already registered")

    vehicle = Vehicle(**vehicle_in.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.patch("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    vehicle_in: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.FLEET_MANAGER, UserRole.WAREHOUSE_MANAGER]))
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    update_data = vehicle_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vehicle, field, value)

    db.commit()
    db.refresh(vehicle)
    return vehicle
