"""
Relay WebSocket endpoint for real-time state updates
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# WebSocket connections
active_connections: list[WebSocket] = []


@router.websocket("/ws")
async def relay_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time relay state updates"""
    await websocket.accept()
    active_connections.append(websocket)
    logger.info(f"Relay WebSocket connected. Total connections: {len(active_connections)}")

    try:
        while True:
            from main import relay_manager

            if relay_manager:
                relays = relay_manager.get_all_relays()
                data = {
                    "type": "relay_update",
                    "timestamp": asyncio.get_event_loop().time(),
                    "data": relays
                }
                await websocket.send_json(data)

            await asyncio.sleep(0.2)  # Send updates every 200ms for responsive UI

    except WebSocketDisconnect:
        active_connections.remove(websocket)
        logger.info(f"Relay WebSocket disconnected. Total connections: {len(active_connections)}")
    except Exception as e:
        logger.error(f"Relay WebSocket error: {e}", exc_info=True)
        if websocket in active_connections:
            active_connections.remove(websocket)
