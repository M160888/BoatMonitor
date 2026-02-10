"""
Engine logging and statistics API endpoints
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy import select, func, and_
from database.database import AsyncSessionLocal
from database.models import SensorReading
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/statistics")
async def get_engine_statistics(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    """Get comprehensive engine usage statistics"""
    from main import data_logger

    if not data_logger:
        raise HTTPException(status_code=503, detail="Data logger not available")

    try:
        start = None
        end = None

        if start_date:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if end_date:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))

        stats = await data_logger.get_engine_statistics(start, end)

        # Get additional sensor stats
        oil_stats = await data_logger.get_sensor_stats("oil_pressure", start, end)
        temp_stats = await data_logger.get_sensor_stats("coolant_temp", start, end)

        return {
            "engine": stats,
            "oil_pressure": oil_stats,
            "coolant_temperature": temp_stats,
        }

    except Exception as e:
        logger.error(f"Error getting engine statistics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/usage-summary")
async def get_usage_summary(
    days: int = Query(7, ge=1, le=90)
):
    """Get engine usage summary for the last N days"""
    async with AsyncSessionLocal() as session:
        try:
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(days=days)

            # Get RPM readings
            rpm_query = select(SensorReading).where(
                and_(
                    SensorReading.sensor_type == "engine_rpm",
                    SensorReading.timestamp >= start_time
                )
            )
            result = await session.execute(rpm_query)
            readings = result.scalars().all()

            if not readings:
                return {
                    "days": days,
                    "total_readings": 0,
                    "engine_hours": 0,
                    "summary": "No engine usage recorded"
                }

            # Calculate daily usage
            daily_usage = {}
            for reading in readings:
                date = reading.timestamp.date().isoformat()
                if date not in daily_usage:
                    daily_usage[date] = {
                        "date": date,
                        "readings": 0,
                        "max_rpm": 0,
                        "avg_rpm": 0,
                        "total_rpm": 0,
                    }

                if reading.value > 0:
                    daily_usage[date]["readings"] += 1
                    daily_usage[date]["total_rpm"] += reading.value
                    daily_usage[date]["max_rpm"] = max(
                        daily_usage[date]["max_rpm"],
                        reading.value
                    )

            # Calculate averages and hours
            for date in daily_usage:
                if daily_usage[date]["readings"] > 0:
                    daily_usage[date]["avg_rpm"] = round(
                        daily_usage[date]["total_rpm"] / daily_usage[date]["readings"],
                        1
                    )
                    # Estimate hours (assuming 60-second logging interval)
                    daily_usage[date]["estimated_hours"] = round(
                        (daily_usage[date]["readings"] * 60) / 3600,
                        2
                    )

            return {
                "days": days,
                "start_date": start_time.isoformat(),
                "end_date": end_time.isoformat(),
                "total_readings": len(readings),
                "daily_usage": list(daily_usage.values())
            }

        except Exception as e:
            logger.error(f"Error getting usage summary: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts")
async def get_engine_alerts(
    days: int = Query(7, ge=1, le=90)
):
    """Check for concerning engine conditions"""
    async with AsyncSessionLocal() as session:
        try:
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(days=days)

            alerts = []

            # Check for high RPM (over 3000)
            rpm_query = select(SensorReading).where(
                and_(
                    SensorReading.sensor_type == "engine_rpm",
                    SensorReading.timestamp >= start_time,
                    SensorReading.value > 3000
                )
            )
            result = await session.execute(rpm_query)
            high_rpm = result.scalars().all()

            if high_rpm:
                alerts.append({
                    "severity": "warning",
                    "type": "high_rpm",
                    "message": f"Engine RPM exceeded 3000 on {len(high_rpm)} occasions",
                    "count": len(high_rpm),
                    "max_value": max(r.value for r in high_rpm)
                })

            # Check for low oil pressure (under 20 PSI when running)
            oil_query = select(SensorReading).where(
                and_(
                    SensorReading.sensor_type == "oil_pressure",
                    SensorReading.timestamp >= start_time,
                    SensorReading.value < 20,
                    SensorReading.value > 0
                )
            )
            result = await session.execute(oil_query)
            low_oil = result.scalars().all()

            if low_oil:
                alerts.append({
                    "severity": "critical",
                    "type": "low_oil_pressure",
                    "message": f"Low oil pressure detected on {len(low_oil)} occasions",
                    "count": len(low_oil),
                    "min_value": min(r.value for r in low_oil)
                })

            # Check for high coolant temp (over 95°C)
            temp_query = select(SensorReading).where(
                and_(
                    SensorReading.sensor_type == "coolant_temp",
                    SensorReading.timestamp >= start_time,
                    SensorReading.value > 95
                )
            )
            result = await session.execute(temp_query)
            high_temp = result.scalars().all()

            if high_temp:
                alerts.append({
                    "severity": "warning",
                    "type": "high_temperature",
                    "message": f"Coolant temperature exceeded 95°C on {len(high_temp)} occasions",
                    "count": len(high_temp),
                    "max_value": max(r.value for r in high_temp)
                })

            return {
                "days": days,
                "total_alerts": len(alerts),
                "alerts": alerts
            }

        except Exception as e:
            logger.error(f"Error checking engine alerts: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=str(e))
