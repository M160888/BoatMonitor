"""
Data Logger Service - Logs sensor data to database for historical tracking
"""
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from database.database import AsyncSessionLocal
from database.models import SensorReading, VictronReading
from config import settings

logger = logging.getLogger(__name__)


class DataLogger:
    """Logs sensor and Victron data to database"""

    def __init__(self):
        self.running = False
        self.log_interval = settings.HISTORY_SAVE_INTERVAL  # Default 60 seconds

        # Critical sensors to always log
        self.critical_sensors = [
            "engine_rpm",
            "oil_pressure",
            "coolant_temp",
        ]

        # Optional sensors to log
        self.optional_sensors = [
            "fuel_tank",
            "water_tank",
            "waste_tank",
        ]

    async def start(self, sensor_manager, victron_manager):
        """Start data logging"""
        self.running = True
        self.sensor_manager = sensor_manager
        self.victron_manager = victron_manager
        logger.info(f"Data logger started (interval: {self.log_interval}s)")
        await self._logging_loop()

    async def stop(self):
        """Stop data logging"""
        self.running = False
        logger.info("Data logger stopped")

    async def _logging_loop(self):
        """Main logging loop"""
        while self.running:
            try:
                await self._log_data()
                await asyncio.sleep(self.log_interval)
            except Exception as e:
                logger.error(f"Error in data logging loop: {e}", exc_info=True)
                await asyncio.sleep(10)

    async def _log_data(self):
        """Log current sensor and Victron data to database"""
        async with AsyncSessionLocal() as session:
            try:
                # Log sensor data
                await self._log_sensors(session)

                # Log Victron data
                await self._log_victron(session)

                await session.commit()
                logger.debug("Data logged successfully")

            except Exception as e:
                await session.rollback()
                logger.error(f"Error logging data: {e}", exc_info=True)

    async def _log_sensors(self, session: AsyncSession):
        """Log sensor readings"""
        if not self.sensor_manager:
            return

        readings = self.sensor_manager.get_all_readings()
        timestamp = datetime.utcnow()

        # Log critical sensors (always)
        for sensor_id in self.critical_sensors:
            if sensor_id in readings:
                value = readings[sensor_id]
                unit = self._get_sensor_unit(sensor_id)

                reading = SensorReading(
                    timestamp=timestamp,
                    sensor_type=sensor_id,
                    sensor_id=sensor_id,
                    value=value,
                    unit=unit
                )
                session.add(reading)
                logger.debug(f"Logged {sensor_id}: {value} {unit}")

        # Log optional sensors (if available and non-zero)
        for sensor_id in self.optional_sensors:
            if sensor_id in readings and readings[sensor_id] > 0:
                value = readings[sensor_id]
                unit = self._get_sensor_unit(sensor_id)

                reading = SensorReading(
                    timestamp=timestamp,
                    sensor_type=sensor_id,
                    sensor_id=sensor_id,
                    value=value,
                    unit=unit
                )
                session.add(reading)

    async def _log_victron(self, session: AsyncSession):
        """Log Victron device data"""
        if not self.victron_manager:
            return

        devices = self.victron_manager.get_all_data()
        timestamp = datetime.utcnow()

        for device_id, data in devices.items():
            if data:
                reading = VictronReading(
                    timestamp=timestamp,
                    device_type=self._get_device_type(device_id),
                    device_id=device_id,
                    data=data
                )
                session.add(reading)
                logger.debug(f"Logged Victron device: {device_id}")

    def _get_sensor_unit(self, sensor_id: str) -> str:
        """Get unit for sensor type"""
        units = {
            "engine_rpm": "RPM",
            "oil_pressure": "PSI",
            "coolant_temp": "°C",
            "fuel_tank": "%",
            "water_tank": "%",
            "waste_tank": "%",
        }
        return units.get(sensor_id, "")

    def _get_device_type(self, device_id: str) -> str:
        """Get device type from device ID"""
        if "smartshunt" in device_id or "bmv" in device_id:
            return "battery_monitor"
        elif "mppt" in device_id or "solar" in device_id:
            return "solar_charger"
        elif "inverter" in device_id or "multiplus" in device_id:
            return "inverter"
        return "unknown"

    async def get_engine_statistics(
        self,
        start_time: datetime = None,
        end_time: datetime = None
    ) -> Dict[str, Any]:
        """Get engine usage statistics"""
        async with AsyncSessionLocal() as session:
            query = select(SensorReading).where(
                SensorReading.sensor_type == "engine_rpm"
            )

            if start_time:
                query = query.where(SensorReading.timestamp >= start_time)
            if end_time:
                query = query.where(SensorReading.timestamp <= end_time)

            result = await session.execute(query)
            readings = result.scalars().all()

            if not readings:
                return {
                    "total_readings": 0,
                    "engine_hours": 0,
                    "max_rpm": 0,
                    "avg_rpm": 0,
                }

            # Calculate statistics
            rpm_values = [r.value for r in readings if r.value > 0]
            engine_running = len(rpm_values)

            # Estimate engine hours (based on log interval)
            engine_hours = (engine_running * self.log_interval) / 3600

            return {
                "total_readings": len(readings),
                "engine_running_readings": engine_running,
                "engine_hours": round(engine_hours, 2),
                "max_rpm": max(rpm_values) if rpm_values else 0,
                "avg_rpm": round(sum(rpm_values) / len(rpm_values), 1) if rpm_values else 0,
                "min_rpm": min(rpm_values) if rpm_values else 0,
            }

    async def get_sensor_stats(
        self,
        sensor_type: str,
        start_time: datetime = None,
        end_time: datetime = None
    ) -> Dict[str, Any]:
        """Get statistics for any sensor"""
        async with AsyncSessionLocal() as session:
            query = select(SensorReading).where(
                SensorReading.sensor_type == sensor_type
            )

            if start_time:
                query = query.where(SensorReading.timestamp >= start_time)
            if end_time:
                query = query.where(SensorReading.timestamp <= end_time)

            result = await session.execute(query)
            readings = result.scalars().all()

            if not readings:
                return {"error": "No data found"}

            values = [r.value for r in readings]

            return {
                "sensor_type": sensor_type,
                "total_readings": len(readings),
                "max": max(values),
                "min": min(values),
                "avg": round(sum(values) / len(values), 2),
                "unit": readings[0].unit if readings else "",
                "start_time": readings[0].timestamp.isoformat() if readings else None,
                "end_time": readings[-1].timestamp.isoformat() if readings else None,
            }
