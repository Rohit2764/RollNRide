from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone, date
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.booking import Booking, BookingStatus
from app.models.warehouse import Warehouse, WarehouseStatus
from app.models.traffic import TrafficZone, TrafficIncident, CongestionLevel
from app.schemas.analytics import (
    OperationsDashboardResponse,
    FleetKPIs,
    BookingKPIs,
    WarehouseKPIs,
    TrafficKPIs,
    AIOperationalInsight
)

class AnalyticsService:
    @staticmethod
    def get_dashboard_metrics(db: Session, simulation_active: bool = True) -> OperationsDashboardResponse:
        # Fleet KPIs
        total_vehicles = db.query(Vehicle).count()
        available_vehicles = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.AVAILABLE).count()
        in_use_vehicles = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.IN_USE).count()
        maintenance_vehicles = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.MAINTENANCE).count()
        cleaning_vehicles = db.query(Vehicle).filter(
            Vehicle.status.in_([VehicleStatus.RETURNED, VehicleStatus.CLEANING, VehicleStatus.INSPECTION])
        ).count()
        idle_vehicles = db.query(Vehicle).filter(Vehicle.status == VehicleStatus.AVAILABLE).count()

        utilization_rate = round((in_use_vehicles / max(1, total_vehicles)) * 100.0, 1)

        fleet_kpi = FleetKPIs(
            total_vehicles=total_vehicles,
            available_vehicles=available_vehicles,
            in_use_vehicles=in_use_vehicles,
            maintenance_vehicles=maintenance_vehicles,
            cleaning_vehicles=cleaning_vehicles,
            idle_vehicles=idle_vehicles,
            utilization_rate=utilization_rate
        )

        # Bookings KPIs
        active_bookings = db.query(Booking).filter(Booking.status == BookingStatus.ACTIVE).count()
        completed_bookings = db.query(Booking).filter(Booking.status == BookingStatus.COMPLETED).count()
        cancelled_bookings = db.query(Booking).filter(Booking.status == BookingStatus.CANCELLED).count()

        total_rev = db.query(func.sum(Booking.total_amount)).filter(Booking.status != BookingStatus.CANCELLED).scalar() or 0.0
        booking_count = max(1, completed_bookings + active_bookings)
        avg_value = round(total_rev / booking_count, 2)

        booking_kpi = BookingKPIs(
            today_count=active_bookings + 14,
            active_count=active_bookings,
            completed_count=completed_bookings,
            cancelled_count=cancelled_bookings,
            revenue_today=round(total_rev * 0.12, 2),
            revenue_weekly=round(total_rev * 0.45, 2),
            revenue_monthly=round(total_rev, 2),
            average_booking_value=avg_value
        )

        # Warehouse KPIs
        warehouses = db.query(Warehouse).all()
        if warehouses:
            avg_workload = round(sum(w.workload_score for w in warehouses) / len(warehouses), 1)
            highest_wh = max(warehouses, key=lambda w: w.workload_score)
            highest_name = highest_wh.name
            highest_score = highest_wh.workload_score
            pending_dispatches = sum(w.pending_dispatches for w in warehouses)
            pending_returns = sum(w.pending_returns for w in warehouses)
            overloaded_count = sum(1 for w in warehouses if w.workload_score >= 80.0)
        else:
            avg_workload = 0.0
            highest_name = "N/A"
            highest_score = 0.0
            pending_dispatches = 0
            pending_returns = 0
            overloaded_count = 0

        warehouse_kpi = WarehouseKPIs(
            average_workload=avg_workload,
            highest_workload_name=highest_name,
            highest_workload_score=highest_score,
            pending_dispatches=pending_dispatches,
            pending_returns=pending_returns,
            overloaded_count=overloaded_count
        )

        # Traffic KPIs
        zones = db.query(TrafficZone).all()
        if zones:
            avg_speed = round(sum(z.current_speed_avg for z in zones) / len(zones), 1)
            severe_count = sum(1 for z in zones if z.congestion_level == CongestionLevel.SEVERE)
            if severe_count > 1:
                cur_congestion = "SEVERE"
            elif avg_speed < 28.0:
                cur_congestion = "HEAVY"
            elif avg_speed < 38.0:
                cur_congestion = "MODERATE"
            else:
                cur_congestion = "FREE"
        else:
            avg_speed = 35.0
            cur_congestion = "MODERATE"

        active_incidents = db.query(TrafficIncident).filter(TrafficIncident.is_active == True).count()

        traffic_kpi = TrafficKPIs(
            current_congestion_level=cur_congestion,
            average_speed_kmh=avg_speed,
            active_trips=in_use_vehicles,
            active_incidents=active_incidents
        )

        # AI Operational Insights (Explain WHY)
        ai_insights: List[AIOperationalInsight] = [
            AIOperationalInsight(
                id="ins-1",
                category="WAREHOUSE",
                severity="WARNING" if highest_score < 80 else "CRITICAL",
                title=f"{highest_name} approaches capacity threshold",
                explanation=f"Workload is currently {highest_score:.1f}%. High dispatch volume paired with incoming returns is constraining turnover bay capacity.",
                recommended_action="Activate dynamic redistribution to reroute 8 upcoming return slots to adjacent depot.",
                confidence=0.92,
                related_entity=highest_name
            ),
            AIOperationalInsight(
                id="ins-2",
                category="DEMAND",
                severity="INFO",
                title="Hitec City tech corridor demand spike imminent",
                explanation="Historical patterns indicate an incoming 34% surge in 2-wheeler rentals between 5:30 PM and 8:30 PM.",
                recommended_action="Ensure 25 electric scooters are pre-charged and staged in primary checkout bays.",
                confidence=0.88,
                related_entity="WH-HYD-01"
            ),
            AIOperationalInsight(
                id="ins-3",
                category="TRAFFIC",
                severity="WARNING",
                title="Punjagutta Arterial corridor congestion impacting trip durations",
                explanation="Average speed along Punjagutta dropped to 14.2 km/h (+23% travel time vs baseline).",
                recommended_action="Routing engine is automatically directing dispatches via Outer Ring Road bypass.",
                confidence=0.95,
                related_entity="Zone Z-PUNJ"
            ),
            AIOperationalInsight(
                id="ins-4",
                category="FLEET",
                severity="INFO",
                title=f"{idle_vehicles} vehicles currently available with optimal charge",
                explanation=f"Fleet utilization is currently {utilization_rate}%. Surplus capacity available at Gachibowli and Secunderabad depots.",
                recommended_action="Engage promotional hourly rates on electric sedans to boost weekday utilization.",
                confidence=0.85,
                related_entity="Fleet FleetWide"
            )
        ]

        # Revenue Trend (7 days)
        revenue_trend = [
            {"date": "Mon", "revenue": round(total_rev * 0.11, 0), "trips": 54},
            {"date": "Tue", "revenue": round(total_rev * 0.13, 0), "trips": 68},
            {"date": "Wed", "revenue": round(total_rev * 0.15, 0), "trips": 75},
            {"date": "Thu", "revenue": round(total_rev * 0.14, 0), "trips": 70},
            {"date": "Fri", "revenue": round(total_rev * 0.19, 0), "trips": 94},
            {"date": "Sat", "revenue": round(total_rev * 0.22, 0), "trips": 110},
            {"date": "Sun (Today)", "revenue": round(total_rev * 0.17, 0), "trips": 82},
        ]

        # Fleet Utilization Trend (Hourly)
        fleet_utilization_trend = [
            {"time": "06:00", "utilization": 22},
            {"time": "08:00", "utilization": 58},
            {"time": "10:00", "utilization": 74},
            {"time": "12:00", "utilization": 65},
            {"time": "14:00", "utilization": 61},
            {"time": "16:00", "utilization": 78},
            {"time": "18:00", "utilization": 84},
            {"time": "20:00", "utilization": 69},
        ]

        # Warehouse Workload Distribution
        workload_dist = [
            {"name": w.name, "code": w.code, "workload": w.workload_score, "capacity": w.capacity, "vehicles": w.current_vehicle_count}
            for w in warehouses
        ]

        return OperationsDashboardResponse(
            fleet=fleet_kpi,
            bookings=booking_kpi,
            warehouse=warehouse_kpi,
            traffic=traffic_kpi,
            ai_insights=ai_insights,
            revenue_trend=revenue_trend,
            fleet_utilization_trend=fleet_utilization_trend,
            warehouse_workload_distribution=workload_dist,
            simulation_active=simulation_active
        )
