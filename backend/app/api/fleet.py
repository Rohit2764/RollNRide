from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.vehicle import Vehicle, VehicleStatus, VehicleType
from app.schemas.tracking import LiveVehicleTelemetry
from app.services.fleet_service import FleetService

router = APIRouter(prefix="/fleet", tags=["Fleet"])

@router.get("/live", response_model=List[LiveVehicleTelemetry])
def get_live_fleet(db: Session = Depends(get_db)):
    return FleetService.get_live_fleet(db)

@router.get("/stats")
def get_fleet_stats(db: Session = Depends(get_db)):
    total = db.query(Vehicle).count()
    status_counts = {}
    for s in VehicleStatus:
        count = db.query(Vehicle).filter(Vehicle.status == s).count()
        status_counts[s.value] = count

    in_use = status_counts.get("IN_USE", 0)
    utilization_rate = round((in_use / max(1, total)) * 100.0, 1)

    # Breakdown by vehicle type
    types = db.query(VehicleType).all()
    type_breakdown = []
    for t in types:
        count = db.query(Vehicle).filter(Vehicle.vehicle_type_id == t.id).count()
        in_use_type = db.query(Vehicle).filter(
            Vehicle.vehicle_type_id == t.id,
            Vehicle.status == VehicleStatus.IN_USE
        ).count()
        type_breakdown.append({
            "type_name": t.name,
            "category": t.category,
            "total": count,
            "in_use": in_use_type,
            "utilization": round((in_use_type / max(1, count)) * 100.0, 1)
        })

    return {
        "total_vehicles": total,
        "utilization_rate": utilization_rate,
        "status_distribution": status_counts,
        "type_breakdown": type_breakdown
    }
