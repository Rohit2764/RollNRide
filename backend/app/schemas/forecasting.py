from typing import List, Optional
from pydantic import BaseModel

class HourlyDemandPoint(BaseModel):
    hour: int
    hour_label: str # e.g. "09:00 AM"
    predicted_demand: int
    available_supply: int
    shortage_surplus: int # negative if shortage, positive if surplus
    risk_level: str # LOW, MODERATE, HIGH, CRITICAL

class DemandForecastResponse(BaseModel):
    warehouse_id: Optional[int] = None
    warehouse_name: str
    target_date: str
    total_predicted_demand: int
    current_available_supply: int
    projected_net_shortage: int
    hourly_forecast: List[HourlyDemandPoint]
    historical_comparison: List[dict]
    recommendation: str
