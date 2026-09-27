from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import UserRole, User
from app.schemas.optimization import (
    RouteRequest,
    RouteResponse,
    RedistributionRecommendationResponse,
    RedistributionAction
)
from app.services.routing_service import RoutingService
from app.services.optimization_service import OptimizationService
from app.api.deps import require_roles, get_current_user

router = APIRouter(prefix="/optimization", tags=["Optimization"])

@router.post("/route", response_model=RouteResponse)
def calculate_optimal_route(route_req: RouteRequest):
    return RoutingService.calculate_route(route_req)

@router.get("/redistribution", response_model=List[RedistributionRecommendationResponse])
def get_redistribution_recommendations(db: Session = Depends(get_db)):
    return OptimizationService.generate_recommendations(db)

@router.post("/redistribution/{recommendation_id}/approve", response_model=RedistributionRecommendationResponse)
def approve_redistribution(
    recommendation_id: int,
    action: Optional[RedistributionAction] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.FLEET_MANAGER]))
):
    try:
        mod_count = action.modified_vehicle_count if action else None
        return OptimizationService.approve_recommendation(recommendation_id, current_user.id, mod_count, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/redistribution/{recommendation_id}/reject", response_model=RedistributionRecommendationResponse)
def reject_redistribution(
    recommendation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OPERATIONS_MANAGER, UserRole.FLEET_MANAGER]))
):
    try:
        return OptimizationService.reject_recommendation(recommendation_id, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
