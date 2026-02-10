"""
Historical data API endpoints
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy import select, func, and_
from database.database import AsyncSessionLocal
from database.models import SensorReading, VictronReading
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/sensors/{sensor_id}")
async def get_sensor_history(
    sensor_id: str,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: Optional[int] = Query(1000, le=10000)
):
    """Get historical sensor data"""
    async with AsyncSessionLocal() as session:
        try:
            query = select(SensorReading).where(
                SensorReading.sensor_type == sensor_id
            ).order_by(SensorReading.timestamp.desc()).limit(limit)

            if start_date:
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.where(SensorReading.timestamp >= start)

            if end_date:
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.where(SensorReading.timestamp <= end)

            result = await session.execute(query)
            readings = result.scalars().all()

            data = [
                {
                    "timestamp": r.timestamp.isoformat(),
                    "value": r.value,
                    "unit": r.unit
                }
                for r in reversed(readings)  # Return in chronological order
            ]

            return {
                "sensor_id": sensor_id,
                "total": len(data),
                "data": data
            }

        except Exception as e:
            logger.error(f"Error fetching sensor history: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))


@router.get("/victron/{device_id}")
async def get_victron_history(
    device_id: str,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    interval: Optional[str] = Query("1h")
):
    """Get historical Victron data"""
    # TODO: Implement database query with aggregation
    return {
        "device_id": device_id,
        "start_date": start_date,
        "end_date": end_date,
        "interval": interval,
        "data": []
    }


@router.get("/solar/yield")
async def get_solar_yield(
    days: int = Query(7, ge=1, le=90)
):
    """Get solar yield for the last N days"""
    # TODO: Implement solar yield calculation
    return {
        "days": days,
        "daily_yield": []
    }


@router.get("/battery/usage")
async def get_battery_usage(
    days: int = Query(7, ge=1, le=90)
):
    """Get battery usage patterns"""
    # TODO: Implement battery usage calculation
    return {
        "days": days,
        "usage_pattern": []
    }


@router.get("/fuel/consumption")
async def get_fuel_consumption(
    days: int = Query(7, ge=1, le=90)
):
    """Get fuel consumption based on tank levels"""
    # TODO: Implement fuel consumption calculation
    return {
        "days": days,
        "consumption": []
    }
