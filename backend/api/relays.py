"""
Relay control API endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class RelayConfig(BaseModel):
    """Relay configuration model"""
    name: Optional[str] = None
    enabled: Optional[bool] = None
    mode: Optional[str] = None  # "normal" or "timed"
    timed_duration: Optional[float] = None  # seconds (can be hours: 3600 = 1hr)


@router.get("")
async def get_relays():
    """Get all relay states and configurations"""
    from main import relay_manager

    if not relay_manager:
        raise HTTPException(status_code=503, detail="Relay manager not initialized")

    relays = relay_manager.get_all_relays()
    return {"relays": list(relays.values())}


@router.get("/{relay_id}")
async def get_relay(relay_id: str):
    """Get specific relay state"""
    from main import relay_manager

    if not relay_manager:
        raise HTTPException(status_code=503, detail="Relay manager not initialized")

    relay = relay_manager.get_relay(relay_id)
    if not relay:
        raise HTTPException(status_code=404, detail=f"Relay {relay_id} not found")

    return relay


@router.put("/{relay_id}")
async def update_relay(relay_id: str, config: RelayConfig):
    """Update relay configuration"""
    from main import relay_manager

    if not relay_manager:
        raise HTTPException(status_code=503, detail="Relay manager not initialized")

    logger.info(f"Updating relay {relay_id}: {config}")

    # Convert to dict, excluding None values
    config_dict = {k: v for k, v in config.dict().items() if v is not None}

    success = await relay_manager.update_relay_config(relay_id, config_dict)
    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to update relay {relay_id}")

    relay = relay_manager.get_relay(relay_id)
    return {"success": True, "relay": relay}


@router.post("/{relay_id}/on")
async def turn_relay_on(relay_id: str):
    """Turn relay on"""
    from main import relay_manager

    if not relay_manager:
        raise HTTPException(status_code=503, detail="Relay manager not initialized")

    logger.info(f"Turning relay {relay_id} ON")
    success = await relay_manager.turn_on(relay_id)

    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to turn on relay {relay_id}")

    relay = relay_manager.get_relay(relay_id)
    return {"success": True, "relay": relay}


@router.post("/{relay_id}/off")
async def turn_relay_off(relay_id: str):
    """Turn relay off"""
    from main import relay_manager

    if not relay_manager:
        raise HTTPException(status_code=503, detail="Relay manager not initialized")

    logger.info(f"Turning relay {relay_id} OFF")
    success = await relay_manager.turn_off(relay_id)

    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to turn off relay {relay_id}")

    relay = relay_manager.get_relay(relay_id)
    return {"success": True, "relay": relay}


@router.post("/{relay_id}/toggle")
async def toggle_relay(relay_id: str):
    """Toggle relay state"""
    from main import relay_manager

    if not relay_manager:
        raise HTTPException(status_code=503, detail="Relay manager not initialized")

    logger.info(f"Toggling relay {relay_id}")
    success = await relay_manager.toggle_relay(relay_id)

    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to toggle relay {relay_id}")

    relay = relay_manager.get_relay(relay_id)
    return {"success": True, "relay": relay}
