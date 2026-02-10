"""
Sensor threshold configuration API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
from sqlalchemy import select
from database.database import AsyncSessionLocal
from database.models import SystemSettings
from api.settings import verify_password
import logging
import json

logger = logging.getLogger(__name__)
router = APIRouter()


class ThresholdConfig(BaseModel):
    """Threshold configuration model"""
    engine_rpm_max: Optional[float] = 3000.0
    oil_pressure_min: Optional[float] = 20.0
    oil_pressure_max: Optional[float] = 80.0
    coolant_temp_max: Optional[float] = 95.0


DEFAULT_THRESHOLDS = {
    "engine_rpm_max": 3000.0,
    "oil_pressure_min": 20.0,
    "oil_pressure_max": 80.0,
    "coolant_temp_max": 95.0,
}


@router.get("")
async def get_thresholds():
    """Get current threshold settings (public - no auth required for reading)"""
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(
                select(SystemSettings).where(SystemSettings.key == "sensor_thresholds")
            )
            setting = result.scalar_one_or_none()

            if setting and setting.value:
                return setting.value
            else:
                return DEFAULT_THRESHOLDS

        except Exception as e:
            logger.error(f"Error getting thresholds: {e}", exc_info=True)
            return DEFAULT_THRESHOLDS


@router.put("")
async def update_thresholds(
    config: ThresholdConfig,
    authorized: bool = Depends(verify_password)
):
    """Update threshold settings (requires password)"""
    async with AsyncSessionLocal() as session:
        try:
            # Get or create settings entry
            result = await session.execute(
                select(SystemSettings).where(SystemSettings.key == "sensor_thresholds")
            )
            setting = result.scalar_one_or_none()

            threshold_data = config.dict(exclude_none=True)

            if setting:
                # Update existing
                setting.value = threshold_data
            else:
                # Create new
                setting = SystemSettings(
                    key="sensor_thresholds",
                    value=threshold_data
                )
                session.add(setting)

            await session.commit()

            logger.info(f"Thresholds updated: {threshold_data}")
            return {"success": True, "thresholds": threshold_data}

        except Exception as e:
            await session.rollback()
            logger.error(f"Error updating thresholds: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset")
async def reset_thresholds(authorized: bool = Depends(verify_password)):
    """Reset thresholds to default values"""
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(
                select(SystemSettings).where(SystemSettings.key == "sensor_thresholds")
            )
            setting = result.scalar_one_or_none()

            if setting:
                setting.value = DEFAULT_THRESHOLDS
            else:
                setting = SystemSettings(
                    key="sensor_thresholds",
                    value=DEFAULT_THRESHOLDS
                )
                session.add(setting)

            await session.commit()

            logger.info("Thresholds reset to defaults")
            return {"success": True, "thresholds": DEFAULT_THRESHOLDS}

        except Exception as e:
            await session.rollback()
            logger.error(f"Error resetting thresholds: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))
