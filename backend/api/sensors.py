"""
Sensors API endpoints
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any
import asyncio
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# WebSocket connections
active_connections: list[WebSocket] = []


@router.get("")
async def get_sensors():
    """Get all current sensor readings"""
    from main import sensor_manager

    if not sensor_manager:
        return {"error": "Sensor manager not initialized"}

    readings = sensor_manager.get_all_readings()
    return {
        "timestamp": asyncio.get_event_loop().time(),
        "sensors": readings
    }


@router.get("/{sensor_id}")
async def get_sensor(sensor_id: str):
    """Get specific sensor reading"""
    from main import sensor_manager

    if not sensor_manager:
        return {"error": "Sensor manager not initialized"}

    reading = sensor_manager.get_reading(sensor_id)
    if reading is None:
        return {"error": f"Sensor {sensor_id} not found"}

    return {
        "sensor_id": sensor_id,
        "value": reading,
        "timestamp": asyncio.get_event_loop().time()
    }


@router.websocket("/ws")
async def sensor_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time sensor data"""
    await websocket.accept()
    active_connections.append(websocket)
    logger.info(f"WebSocket connected. Total connections: {len(active_connections)}")

    try:
        while True:
            from main import sensor_manager

            if sensor_manager:
                readings = sensor_manager.get_all_readings()
                data = {
                    "type": "sensor_update",
                    "timestamp": asyncio.get_event_loop().time(),
                    "data": readings
                }
                await websocket.send_json(data)

            await asyncio.sleep(0.5)  # Send updates every 500ms

    except WebSocketDisconnect:
        active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(active_connections)}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
        if websocket in active_connections:
            active_connections.remove(websocket)
