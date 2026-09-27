from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.forecasting import DemandForecastResponse
from app.services.forecasting_service import ForecastingService

router = APIRouter(prefix="/forecast", tags=["Forecasting"])

@router.get("/demand", response_model=DemandForecastResponse)
def get_demand_forecast(
    warehouse_id: Optional[int] = None,
    target_date: Optional[str] = Query(None, description="YYYY-MM-DD format"),
    db: Session = Depends(get_db)
):
    return ForecastingService.generate_demand_forecast(warehouse_id, target_date, db)
