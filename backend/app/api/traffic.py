from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.traffic import TrafficZone, TrafficIncident
from app.models.user import UserRole, User
from app.schemas.traffic import (
    TrafficZoneResponse,
    TrafficHeatmapResponse,
    TrafficIncidentResponse,
    TrafficIncidentCreate
)
from app.services.traffic_service import TrafficService
from app.api.deps import require_roles

router = APIRouter(prefix="/traffic", tags=["Traffic"])

@router.get("/live", response_model=List[TrafficZoneResponse])
def get_live_traffic(db: Session = Depends(get_db)):
    return TrafficService.get_all_zones(db)

@router.get("/heatmap", response_model=TrafficHeatmapResponse)
def get_traffic_heatmap(
    time_range: str = Query("live", pattern="^(live|1h|today|7d|30d)$"),
    db: Session = Depends(get_db)
):
    return TrafficService.get_traffic_heatmap(time_range, db)

@router.get("/zones", response_model=List[TrafficZoneResponse])
def get_traffic_zones(db: Session = Depends(get_db)):
    return db.query(TrafficZone).all()

@router.get("/incidents", response_model=List[TrafficIncidentResponse])
def get_traffic_incidents(db: Session = Depends(get_db)):
    return db.query(TrafficIncident).filter(TrafficIncident.is_active == True).all()

@router.post("/incidents", response_model=TrafficIncidentResponse)
def report_traffic_incident(
    incident_in: TrafficIncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.FLEET_MANAGER]))
):
    incident = TrafficIncident(**incident_in.model_dump())
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident
