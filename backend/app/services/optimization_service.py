import math
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.warehouse import Warehouse, WarehouseStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.redistribution import (
    RedistributionRecommendation,
    RecommendationPriority,
    RecommendationStatus
)
from app.models.notification import Alert, AlertType, AlertSeverity
from app.services.warehouse_service import WarehouseService

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

class OptimizationService:
    @staticmethod
    def generate_recommendations(db: Session) -> List[RedistributionRecommendation]:
        """
        Analyze warehouse inventories and calculate transfer recommendations
        between surplus depots and deficit depots.
        """
        warehouses = db.query(Warehouse).all()
        if len(warehouses) < 2:
            return db.query(RedistributionRecommendation).all()

        # Calculate surplus / deficit for each warehouse
        surplus_warehouses = []
        deficit_warehouses = []

        for wh in warehouses:
            available = db.query(Vehicle).filter(
                Vehicle.warehouse_id == wh.id,
                Vehicle.status == VehicleStatus.AVAILABLE
            ).count()
            target_optimal = int(wh.capacity * 0.5)
            net_balance = available - target_optimal

            if net_balance > 8:
                surplus_warehouses.append((wh, net_balance))
            elif net_balance < -5 or wh.status in [WarehouseStatus.HIGH_LOAD, WarehouseStatus.OVERLOADED]:
                deficit_warehouses.append((wh, abs(net_balance)))

        # Sort surplus by largest surplus, deficit by largest deficit
        surplus_warehouses.sort(key=lambda x: x[1], reverse=True)
        deficit_warehouses.sort(key=lambda x: x[1], reverse=True)

        for d_wh, needed in deficit_warehouses:
            # Check if pending recommendation already exists for this destination
            existing = db.query(RedistributionRecommendation).filter(
                RedistributionRecommendation.destination_warehouse_id == d_wh.id,
                RedistributionRecommendation.status == RecommendationStatus.PENDING
            ).first()
            if existing:
                continue

            # Find closest surplus warehouse
            best_source = None
            min_dist = float("inf")

            for s_wh, surplus in surplus_warehouses:
                if s_wh.id == d_wh.id or surplus <= 3:
                    continue
                dist = haversine_km(s_wh.latitude, s_wh.longitude, d_wh.latitude, d_wh.longitude)
                if dist < min_dist:
                    min_dist = dist
                    best_source = (s_wh, surplus)

            if best_source:
                s_wh, surplus = best_source
                transfer_count = min(needed, max(3, surplus // 2))
                dist_km = round(min_dist, 1)

                priority = RecommendationPriority.MEDIUM
                if d_wh.status == WarehouseStatus.OVERLOADED or needed > 15:
                    priority = RecommendationPriority.CRITICAL
                elif d_wh.status == WarehouseStatus.HIGH_LOAD:
                    priority = RecommendationPriority.HIGH

                reason = (
                    f"Warehouse {d_wh.name} has high demand pressure ({needed} vehicle shortage) "
                    f"while {s_wh.name} possesses {surplus} surplus idle vehicles."
                )

                rec = RedistributionRecommendation(
                    source_warehouse_id=s_wh.id,
                    destination_warehouse_id=d_wh.id,
                    vehicle_count=transfer_count,
                    priority=priority,
                    reason=reason,
                    estimated_distance_km=dist_km,
                    status=RecommendationStatus.PENDING
                )
                db.add(rec)

                # Create Alert for manager
                alert = Alert(
                    type=AlertType.DEMAND_SHORTAGE,
                    severity=AlertSeverity.WARNING if priority != RecommendationPriority.CRITICAL else AlertSeverity.CRITICAL,
                    title=f"Redistribution Suggested: {s_wh.code} → {d_wh.code}",
                    message=f"System recommends transferring {transfer_count} vehicles to balance regional workload.",
                    entity_type="WAREHOUSE",
                    entity_id=d_wh.id,
                    suggested_action="Review and approve transfer recommendation in Optimization Dashboard."
                )
                db.add(alert)

        db.commit()
        return db.query(RedistributionRecommendation).order_by(
            RedistributionRecommendation.created_at.desc()
        ).all()

    @staticmethod
    def approve_recommendation(recommendation_id: int, user_id: Optional[int], modified_count: Optional[int], db: Session) -> RedistributionRecommendation:
        rec = db.query(RedistributionRecommendation).filter(
            RedistributionRecommendation.id == recommendation_id
        ).first()
        if not rec:
            raise ValueError("Recommendation not found")

        if rec.status != RecommendationStatus.PENDING:
            raise ValueError(f"Cannot approve recommendation in {rec.status} status")

        count_to_move = modified_count if modified_count and modified_count > 0 else rec.vehicle_count
        rec.vehicle_count = count_to_move
        rec.status = RecommendationStatus.APPROVED
        rec.approved_at = datetime.now(timezone.utc)
        rec.approved_by_id = user_id

        # Move available vehicles from source to destination
        source_vehicles = db.query(Vehicle).filter(
            Vehicle.warehouse_id == rec.source_warehouse_id,
            Vehicle.status == VehicleStatus.AVAILABLE
        ).limit(count_to_move).all()

        for v in source_vehicles:
            v.status = VehicleStatus.DISPATCHED
            v.warehouse_id = rec.destination_warehouse_id

        # Recalculate workloads
        s_wh = db.query(Warehouse).filter(Warehouse.id == rec.source_warehouse_id).first()
        d_wh = db.query(Warehouse).filter(Warehouse.id == rec.destination_warehouse_id).first()
        if s_wh:
            WarehouseService.calculate_workload(s_wh, db)
        if d_wh:
            WarehouseService.calculate_workload(d_wh, db)

        db.commit()
        db.refresh(rec)
        return rec

    @staticmethod
    def reject_recommendation(recommendation_id: int, db: Session) -> RedistributionRecommendation:
        rec = db.query(RedistributionRecommendation).filter(
            RedistributionRecommendation.id == recommendation_id
        ).first()
        if not rec:
            raise ValueError("Recommendation not found")

        rec.status = RecommendationStatus.REJECTED
        db.commit()
        db.refresh(rec)
        return rec
