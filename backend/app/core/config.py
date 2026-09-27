import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

# Ensure absolute SQLite path so running from root or backend uses the exact same database file
_default_db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "rollnride.db")).replace("\\", "/")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    PROJECT_NAME: str = "RollNRide"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"

    # Database: fallback to absolute path of backend/rollnride.db if sqlite is default
    DATABASE_URL: str = f"sqlite:///{_default_db_path}"

    # Redis
    REDIS_URL: Optional[str] = "redis://localhost:6379/0"

    # Security & Auth
    JWT_SECRET: str = "super_secret_rollnride_jwt_key_development_change_in_production_987654321"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # URLs
    BACKEND_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:80",
        "http://127.0.0.1:80",
    ]

    # Simulation Defaults
    SIMULATION_ENABLED: bool = True
    SIMULATION_SPEED: float = 1.0

    # Traffic Congestion Thresholds (km/h)
    CONGESTION_SPEED_SEVERE: float = 15.0
    CONGESTION_SPEED_HEAVY: float = 25.0
    CONGESTION_SPEED_MODERATE: float = 40.0
    CONGESTION_DENSITY_THRESHOLD: float = 15.0

settings = Settings()
