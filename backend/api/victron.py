"""
Victron API endpoints
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any, List
import asyncio
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# WebSocket connections
active_connections: list[WebSocket] = []


@router.get("")
async def get_victron_devices():
    """Get all Victron device data"""
    from main import victron_manager

    if not victron_manager:
        return {"error": "Victron manager not initialized"}

    data = victron_manager.get_all_data()
    return {
        "timestamp": asyncio.get_event_loop().time(),
        "devices": data
    }


@router.get("/{device_id}")
async def get_victron_device(device_id: str):
    """Get specific Victron device data"""
    from main import victron_manager

    if not victron_manager:
        return {"error": "Victron manager not initialized"}

    data = victron_manager.get_device_data(device_id)
    if data is None:
        return {"error": f"Device {device_id} not found"}

    return {
        "device_id": device_id,
        "data": data,
        "timestamp": asyncio.get_event_loop().time()
    }


@router.get("/discover/ble")
async def discover_ble():
    """Discover Victron BLE devices"""
    from main import victron_manager

    if not victron_manager:
        return {"error": "Victron manager not initialized"}

    devices = await victron_manager.discover_ble_devices()
    return {"devices": devices}


@router.post("/connect/ble/{address}")
async def connect_ble(address: str):
    """Connect to a Victron BLE device"""
    from main import victron_manager

    if not victron_manager:
        return {"error": "Victron manager not initialized"}

    success = await victron_manager.connect_ble_device(address)
    return {"success": success, "address": address}


@router.websocket("/ws")
async def victron_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time Victron data"""
    await websocket.accept()
    active_connections.append(websocket)
    logger.info(f"Victron WebSocket connected. Total connections: {len(active_connections)}")

    try:
        while True:
            from main import victron_manager

            if victron_manager:
                data = victron_manager.get_all_data()
                message = {
                    "type": "victron_update",
                    "timestamp": asyncio.get_event_loop().time(),
                    "data": data
                }
                await websocket.send_json(message)

            await asyncio.sleep(2.0)  # Send updates every 2 seconds

    except WebSocketDisconnect:
        active_connections.remove(websocket)
        logger.info(f"Victron WebSocket disconnected. Total connections: {len(active_connections)}")
    except Exception as e:
        logger.error(f"Victron WebSocket error: {e}", exc_info=True)
        if websocket in active_connections:
            active_connections.remove(websocket)
