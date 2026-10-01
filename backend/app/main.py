import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.logging import logger
from app.core.database import Base, engine, SessionLocal
from app.core.seed import seed_database
from app.services.simulation_service import simulation_engine

# Import Routers
from app.api.auth import router as auth_router
from app.api.vehicles import router as vehicles_router
from app.api.warehouses import router as warehouses_router
from app.api.bookings import router as bookings_router
from app.api.fleet import router as fleet_router
from app.api.tracking import router as tracking_router
from app.api.traffic import router as traffic_router
from app.api.maintenance import router as maintenance_router
from app.api.staff import router as staff_router
from app.api.forecasting import router as forecasting_router
from app.api.optimization import router as optimization_router
from app.api.notifications import router as notifications_router
from app.api.analytics import router as analytics_router
from app.api.simulation import router as simulation_router
from app.websocket.endpoints import router as ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing RollNRide backend services...")
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception as e:
        logger.warning(f"Database seed check completed or bypassed: {e}")

    # Start simulation engine
    if settings.SIMULATION_ENABLED:
        await simulation_engine.start()
        logger.info("Live fleet simulation engine started successfully.")

    yield

    # Shutdown
    logger.info("Shutting down RollNRide backend services...")
    await simulation_engine.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="RollNRide — Smart Mobility, Fleet, Traffic & Warehouse Intelligence Platform API",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local dev and docker networks
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal operational error occurred. Please try again later."}
    )

# Register API Routers
api_v1 = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1)
app.include_router(vehicles_router, prefix=api_v1)
app.include_router(warehouses_router, prefix=api_v1)
app.include_router(bookings_router, prefix=api_v1)
app.include_router(fleet_router, prefix=api_v1)
app.include_router(tracking_router, prefix=api_v1)
app.include_router(traffic_router, prefix=api_v1)
app.include_router(maintenance_router, prefix=api_v1)
app.include_router(staff_router, prefix=api_v1)
app.include_router(forecasting_router, prefix=api_v1)
app.include_router(optimization_router, prefix=api_v1)
app.include_router(notifications_router, prefix=api_v1)
app.include_router(analytics_router, prefix=api_v1)
app.include_router(simulation_router, prefix=api_v1)

# Register WebSocket Routers
app.include_router(ws_router)

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": "RollNRide Core Engine",
        "simulation_running": simulation_engine.is_running
    }

# Production Frontend Single Page Application (SPA) integration
_possible_dist_paths = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist"),
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist"),
    "/app/frontend/dist",
    "/app/dist",
]
frontend_dist = next((p for p in _possible_dist_paths if os.path.isdir(p)), None)

if frontend_dist:
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        target = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(target):
            return FileResponse(target)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "Not found"})
else:
    @app.get("/", tags=["System"])
    def root():
        return {
            "message": "Welcome to RollNRide Smart Mobility Platform API",
            "docs": "/docs",
            "health": "/health"
        }

