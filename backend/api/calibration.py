"""
Sensor calibration API endpoints
"""
from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from sqlalchemy import select
from database.database import AsyncSessionLocal
from database.models import SystemSettings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def verify_password(password: Optional[str]):
    """Simple password verification"""
    SETTINGS_PASSWORD = "admin123"  # TODO: Store securely
    if password != SETTINGS_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.get("/calibration")
async def get_calibration(password: Optional[str] = Header(None)):
    """Get sensor calibration settings"""
    verify_password(password)

    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(
                select(SystemSettings).where(SystemSettings.key == "sensor_calibration")
            )
            setting = result.scalar_one_or_none()

            if setting and setting.value:
                return setting.value

            # Return defaults if not set
            return {
                "fuel_tank": {"min": 0, "max": 4095, "offset": 0, "scale": 1},
                "water_tank": {"min": 0, "max": 4095, "offset": 0, "scale": 1},
                "waste_tank": {"min": 0, "max": 4095, "offset": 0, "scale": 1},
                "oil_pressure": {"offset": 0, "scale": 1},
                "coolant_temp": {"offset": 0, "scale": 1},
                "engine_rpm": {"pulses_per_rev": 1.0}  # Digital frequency input
            }

        except Exception as e:
            logger.error(f"Error getting calibration: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))


@router.put("/calibration")
async def update_calibration(
    calibration: dict,
    password: Optional[str] = Header(None)
):
    """Update sensor calibration settings"""
    verify_password(password)

    async with AsyncSessionLocal() as session:
        try:
            # Get existing setting or create new
            result = await session.execute(
                select(SystemSettings).where(SystemSettings.key == "sensor_calibration")
            )
            setting = result.scalar_one_or_none()

            if setting:
                setting.value = calibration
            else:
                setting = SystemSettings(
                    key="sensor_calibration",
                    value=calibration,
                    description="Sensor calibration parameters"
                )
                session.add(setting)

            await session.commit()
            logger.info(f"Calibration updated: {calibration}")

            return {"status": "success", "calibration": calibration}

        except Exception as e:
            logger.error(f"Error updating calibration: {e}", exc_info=True)
            await session.rollback()
            raise HTTPException(status_code=500, detail=str(e))
