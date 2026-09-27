from fastapi import APIRouter
from pydantic import BaseModel
from app.services.simulation_service import simulation_engine

router = APIRouter(prefix="/simulation", tags=["Simulation"])

class SimulationTogglePayload(BaseModel):
    enabled: bool

class SimulationSpeedPayload(BaseModel):
    speed: float

@router.get("/status")
def get_simulation_status():
    return {
        "is_running": simulation_engine.is_running,
        "speed_multiplier": simulation_engine.speed_multiplier
    }

@router.post("/toggle")
def toggle_simulation(payload: SimulationTogglePayload):
    simulation_engine.set_running(payload.enabled)
    return {
        "is_running": simulation_engine.is_running,
        "message": f"Simulation {'started' if payload.enabled else 'paused'}"
    }

@router.post("/speed")
def change_simulation_speed(payload: SimulationSpeedPayload):
    simulation_engine.set_speed(payload.speed)
    return {
        "speed_multiplier": simulation_engine.speed_multiplier,
        "message": f"Simulation speed updated to {simulation_engine.speed_multiplier}x"
    }
