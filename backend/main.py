"""
BoatMonitor - Main Application Entry Point
Monitors boat sensors, Victron equipment, and provides web interface
"""
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from api import sensors, victron, relays, relays_ws, settings, history, engine_logs
from hardware.sensor_manager import SensorManager
from hardware.relay_manager import RelayManager
from victron.device_manager import VictronManager
from services.data_logger import DataLogger
from database.database import init_database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global managers
sensor_manager = None
victron_manager = None
relay_manager = None
data_logger = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global sensor_manager, victron_manager, relay_manager, data_logger

    logger.info("Starting BoatMonitor...")

    # Initialize database
    await init_database()

    # Initialize hardware managers
    sensor_manager = SensorManager()
    victron_manager = VictronManager()
    relay_manager = RelayManager()
    data_logger = DataLogger()

    # Start background tasks
    asyncio.create_task(sensor_manager.start())
    asyncio.create_task(victron_manager.start())
    asyncio.create_task(relay_manager.start())
    asyncio.create_task(data_logger.start(sensor_manager, victron_manager))

    logger.info("BoatMonitor started successfully")

    yield

    # Cleanup
    logger.info("Shutting down BoatMonitor...")
    await sensor_manager.stop()
    await victron_manager.stop()
    await relay_manager.stop()
    await data_logger.stop()
    logger.info("BoatMonitor stopped")


# Create FastAPI application
app = FastAPI(
    title="BoatMonitor",
    description="Shannon Boat Monitoring System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(sensors.router, prefix="/api/sensors", tags=["sensors"])
app.include_router(victron.router, prefix="/api/victron", tags=["victron"])
app.include_router(relays.router, prefix="/api/relays", tags=["relays"])
app.include_router(relays_ws.router, prefix="/api/relays", tags=["relays"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(history.router, prefix="/api/history", tags=["history"])
app.include_router(engine_logs.router, prefix="/api/engine", tags=["engine"])


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "sensors": sensor_manager.is_running() if sensor_manager else False,
        "victron": victron_manager.is_running() if victron_manager else False,
        "relays": relay_manager.running if relay_manager else False
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "BoatMonitor API - Use /docs for API documentation"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Disable in production
        log_level="info"
    )
