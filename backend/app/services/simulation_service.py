import asyncio
import random
import math
import logging
from typing import List, Dict, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.config import settings
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.warehouse import Warehouse
from app.models.booking import Booking, BookingStatus
from app.models.traffic import TrafficZone
from app.models.maintenance import CleaningTask, CleaningStatus
from app.schemas.tracking import LocationTelemetryPayload
from app.services.fleet_service import FleetService
from app.services.warehouse_service import WarehouseService
from app.services.traffic_service import TrafficService
from app.services.anomaly_service import AnomalyService
from app.websocket.manager import ws_manager

logger = logging.getLogger("rollnride.simulation")

# Hyderabad coordinate bounds and waypoints
HYD_WAYPOINTS = [
    (17.4474, 78.3762), # Hitec City
    (17.4401, 78.3489), # Gachibowli
    (17.4319, 78.4073), # Jubilee Hills
    (17.4156, 78.4357), # Banjara Hills
    (17.4265, 78.4518), # Punjagutta
    (17.4448, 78.4664), # Begumpet
    (17.4399, 78.4983), # Secunderabad
    (17.3916, 78.4697), # Nampally
    (17.3616, 78.4747), # Charminar
    (17.2403, 78.4294), # Airport Shamshabad
]

class SimulationService:
    _instance = None

    def __init__(self):
        self.is_running = settings.SIMULATION_ENABLED
        self.speed_multiplier = settings.SIMULATION_SPEED
        self._task: Optional[asyncio.Task] = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = SimulationService()
        return cls._instance

    def set_running(self, running: bool):
        self.is_running = running
        logger.info(f"Simulation running state set to: {self.is_running}")

    def set_speed(self, speed: float):
        self.speed_multiplier = max(0.5, min(10.0, speed))
        logger.info(f"Simulation speed set to: {self.speed_multiplier}x")

    async def start(self):
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._simulation_loop())
            logger.info("Simulation background task started")

    async def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()
            self._task = None

    async def _simulation_loop(self):
        """
        Continuous simulation tick:
        1. Move active vehicles along coordinate vectors.
        2. Vary speeds and discharge battery slightly.
        3. Recalculate traffic zones and warehouse workloads.
        4. Broadcast updates over WebSockets.
        """
        step = 0
        while True:
            try:
                if self.is_running:
                    step += 1
                    await self._simulation_step(step)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in simulation loop: {e}", exc_info=True)

            # Base interval: 3 seconds / speed_multiplier
            delay = max(0.5, 3.0 / self.speed_multiplier)
            await asyncio.sleep(delay)

    async def _simulation_step(self, step: int):
        db: Session = SessionLocal()
        try:
            # 1. Update in-use and dispatched vehicles
            active_vehicles = db.query(Vehicle).filter(
                Vehicle.status.in_([VehicleStatus.IN_USE, VehicleStatus.DISPATCHED, VehicleStatus.RETURNING])
            ).all()

            for v in active_vehicles:
                # Random drift towards a waypoint
                target = random.choice(HYD_WAYPOINTS)
                d_lat = target[0] - v.current_latitude
                d_lng = target[1] - v.current_longitude

                # Step size (~30-60 km/h)
                speed_kmh = random.uniform(20.0, 55.0)
                step_mag = (speed_kmh / 3600.0) * 0.01

                angle = math.atan2(d_lng, d_lat)
                v.current_latitude += step_mag * math.cos(angle) + random.uniform(-0.0005, 0.0005)
                v.current_longitude += step_mag * math.sin(angle) + random.uniform(-0.0005, 0.0005)
                v.current_speed = round(speed_kmh, 1)
                v.heading = round(math.degrees(angle) % 360, 1)

                # Battery decay
                v.battery_level = max(5.0, round(v.battery_level - random.uniform(0.05, 0.2), 1))
                v.mileage = round(v.mileage + 0.1, 1)
                v.last_location_update = datetime.now(timezone.utc)

            db.commit()

            # Broadcast batch telemetry every tick
            if active_vehicles:
                sample_v = random.choice(active_vehicles)
                await ws_manager.broadcast_event(
                    "vehicle_location_updated",
                    {
                        "vehicle_id": sample_v.id,
                        "registration_number": sample_v.registration_number,
                        "latitude": sample_v.current_latitude,
                        "longitude": sample_v.current_longitude,
                        "speed": sample_v.current_speed,
                        "heading": sample_v.heading,
                        "battery": sample_v.battery_level,
                        "status": sample_v.status.value,
                        "last_updated": sample_v.last_location_update.isoformat()
                    },
                    ["fleet", "dashboard"]
                )

            # Every 4 steps (~12s): update traffic congestion and warehouse workloads
            if step % 4 == 0:
                zones = db.query(TrafficZone).all()
                for z in zones:
                    TrafficService.update_zone_congestion(z, db)

                warehouses = db.query(Warehouse).all()
                for wh in warehouses:
                    wh_metrics = WarehouseService.calculate_workload(wh, db)
                    await ws_manager.broadcast_event(
                        "warehouse_load_changed",
                        {
                            "warehouse_id": wh.id,
                            "code": wh.code,
                            "workload_score": wh_metrics["workload_score"],
                            "status": wh_metrics["status"].value
                        },
                        ["dashboard", f"warehouse:{wh.id}"]
                    )

                # Run anomaly detection
                AnomalyService.detect_anomalies(db)

            # Every 10 steps (~30s): simulate automatic cleaning queue advancement
            if step % 10 == 0:
                queued_task = db.query(CleaningTask).filter(CleaningTask.status == CleaningStatus.QUEUED).first()
                if queued_task:
                    queued_task.status = CleaningStatus.IN_PROGRESS
                    queued_task.started_at = datetime.now(timezone.utc)
                    db.commit()
                else:
                    in_progress_task = db.query(CleaningTask).filter(CleaningTask.status == CleaningStatus.IN_PROGRESS).first()
                    if in_progress_task:
                        in_progress_task.status = CleaningStatus.COMPLETED
                        in_progress_task.completed_at = datetime.now(timezone.utc)
                        in_progress_task.vehicle.status = VehicleStatus.AVAILABLE
                        db.commit()

        except Exception as err:
            logger.error(f"Error in simulation step {step}: {err}")
        finally:
            db.close()

simulation_engine = SimulationService.get_instance()
