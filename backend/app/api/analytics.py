from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.analytics import OperationsDashboardResponse
from app.services.analytics_service import AnalyticsService
from app.services.simulation_service import simulation_engine

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=OperationsDashboardResponse)
def get_operations_dashboard(db: Session = Depends(get_db)):
    return AnalyticsService.get_dashboard_metrics(db, simulation_active=simulation_engine.is_running)

@router.get("/fleet")
def get_fleet_analytics(db: Session = Depends(get_db)):
    metrics = AnalyticsService.get_dashboard_metrics(db, simulation_active=simulation_engine.is_running)
    return {
        "fleet": metrics.fleet,
        "utilization_trend": metrics.fleet_utilization_trend
    }

@router.get("/warehouse")
def get_warehouse_analytics(db: Session = Depends(get_db)):
    metrics = AnalyticsService.get_dashboard_metrics(db, simulation_active=simulation_engine.is_running)
    return {
        "warehouse": metrics.warehouse,
        "distribution": metrics.warehouse_workload_distribution
    }

@router.get("/traffic")
def get_traffic_analytics(db: Session = Depends(get_db)):
    metrics = AnalyticsService.get_dashboard_metrics(db, simulation_active=simulation_engine.is_running)
    return {
        "traffic": metrics.traffic
    }
