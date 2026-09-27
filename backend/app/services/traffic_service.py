import math
from typing import List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.traffic import TrafficZone, TrafficIncident, CongestionLevel
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.gps import TrackingLog
from app.schemas.traffic import TrafficHeatmapPoint, TrafficHeatmapResponse

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0 # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c

class TrafficService:
    @staticmethod
    def update_zone_congestion(zone: TrafficZone, db: Session) -> TrafficZone:
        """
        Calculate vehicle density and average speed inside zone radius.
        Classify into FREE, MODERATE, HEAVY, or SEVERE based on configured thresholds.
        """
        active_vehicles = db.query(Vehicle).filter(
            Vehicle.status.in_([VehicleStatus.IN_USE, VehicleStatus.DISPATCHED, VehicleStatus.RETURNING])
        ).all()

        zone_vehicles = [
            v for v in active_vehicles
            if haversine_km(zone.center_lat, zone.center_lng, v.current_latitude, v.current_longitude) <= zone.radius_km
        ]

        density = len(zone_vehicles)
        zone.vehicle_density = density

        if density > 0:
            avg_speed = sum(v.current_speed for v in zone_vehicles) / density
        else:
            # Baseline ambient speed
            avg_speed = 42.0

        zone.current_speed_avg = round(avg_speed, 1)

        # Baseline Congestion Logic
        if avg_speed < settings.CONGESTION_SPEED_SEVERE and density >= 3:
            zone.congestion_level = CongestionLevel.SEVERE
        elif avg_speed < settings.CONGESTION_SPEED_HEAVY:
            zone.congestion_level = CongestionLevel.HEAVY
        elif avg_speed < settings.CONGESTION_SPEED_MODERATE:
            zone.congestion_level = CongestionLevel.MODERATE
        else:
            zone.congestion_level = CongestionLevel.FREE

        zone.updated_at = datetime.now(timezone.utc)
        db.commit()
        return zone

    @staticmethod
    def get_all_zones(db: Session) -> List[TrafficZone]:
        zones = db.query(TrafficZone).all()
        for zone in zones:
            TrafficService.update_zone_congestion(zone, db)
        return zones

    @staticmethod
    def get_traffic_heatmap(time_range: str, db: Session) -> TrafficHeatmapResponse:
        """
        Generate heatmap points with intensity (0.0 to 1.0).
        """
        points: List[TrafficHeatmapPoint] = []
        zones = db.query(TrafficZone).all()

        total_speed = 0.0
        active_zone_count = max(1, len(zones))

        for z in zones:
            total_speed += z.current_speed_avg
            # Base intensity from congestion
            if z.congestion_level == CongestionLevel.SEVERE:
                intensity = 0.95
            elif z.congestion_level == CongestionLevel.HEAVY:
                intensity = 0.75
            elif z.congestion_level == CongestionLevel.MODERATE:
                intensity = 0.45
            else:
                intensity = 0.20

            points.append(TrafficHeatmapPoint(
                lat=z.center_lat,
                lng=z.center_lng,
                intensity=intensity
            ))

            # Add satellite points along radius for dense visual heatmap coverage
            angles = [0, 60, 120, 180, 240, 300]
            for angle in angles:
                rad = math.radians(angle)
                offset_lat = z.center_lat + (z.radius_km * 0.4 / 111.0) * math.cos(rad)
                offset_lng = z.center_lng + (z.radius_km * 0.4 / (111.0 * math.cos(math.radians(z.center_lat)))) * math.sin(rad)
                points.append(TrafficHeatmapPoint(
                    lat=offset_lat,
                    lng=offset_lng,
                    intensity=max(0.1, intensity * 0.8)
                ))

        # Add active moving vehicles as heatmap hot spots
        active_vehicles = db.query(Vehicle).filter(
            Vehicle.status.in_([VehicleStatus.IN_USE, VehicleStatus.DISPATCHED, VehicleStatus.RETURNING])
        ).limit(100).all()

        for v in active_vehicles:
            # Low speed in active vehicle contributes to hotspot
            speed_intensity = max(0.2, min(0.9, (60.0 - v.current_speed) / 60.0))
            points.append(TrafficHeatmapPoint(
                lat=v.current_latitude,
                lng=v.current_longitude,
                intensity=round(speed_intensity, 2)
            ))

        avg_spd = round(total_speed / active_zone_count, 1)
        # Congestion index 0 - 100: lower speed -> higher congestion
        congestion_index = round(max(0.0, min(100.0, (50.0 - avg_spd) * 2.0)), 1)

        return TrafficHeatmapResponse(
            time_range=time_range,
            points=points,
            average_speed_kmh=avg_spd,
            congestion_index=congestion_index,
            peak_hours=["08:30 AM - 10:30 AM", "05:30 PM - 08:30 PM"]
        )
