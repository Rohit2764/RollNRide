from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.gps import TrackingLog
from app.schemas.tracking import LocationTelemetryPayload, TrackingLogResponse, LiveVehicleTelemetry
from app.schemas.vehicle import VehicleResponse
from app.services.fleet_service import FleetService

router = APIRouter(prefix="/tracking", tags=["Tracking"])

@router.post("/location", response_model=VehicleResponse)
async def post_location_telemetry(payload: LocationTelemetryPayload, db: Session = Depends(get_db)):
    try:
        vehicle = await FleetService.process_location_telemetry(payload, db)
        return vehicle
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/history/{vehicle_id}", response_model=List[TrackingLogResponse])
def get_tracking_history(vehicle_id: int, limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(TrackingLog).filter(
        TrackingLog.vehicle_id == vehicle_id
    ).order_by(TrackingLog.recorded_at.desc()).limit(limit).all()
    return logs
