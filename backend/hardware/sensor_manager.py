"""
Sensor Manager - Handles all sensor inputs from Automation 2040W boards
"""
import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from config import settings

logger = logging.getLogger(__name__)


class SensorManager:
    """Manages sensor readings from Automation 2040W boards"""

    def __init__(self):
        self.running = False
        self.sensors: Dict[str, Any] = {}
        self.current_readings: Dict[str, float] = {}
        self.simulation_mode = settings.SIMULATION_MODE

        if not self.simulation_mode:
            try:
                from automation2040w import Automation2040W
                self.boards = [Automation2040W(i) for i in range(settings.AUTOMATION_2040W_COUNT)]
                logger.info(f"Initialized {len(self.boards)} Automation 2040W boards")
            except ImportError:
                logger.warning("Automation 2040W library not available, using simulation mode")
                self.simulation_mode = True
                self.boards = []
        else:
            logger.info("Running in simulation mode")
            self.boards = []

    async def start(self):
        """Start sensor polling"""
        self.running = True
        logger.info("Sensor manager started")
        await self._poll_loop()

    async def stop(self):
        """Stop sensor polling"""
        self.running = False
        logger.info("Sensor manager stopped")

    def is_running(self) -> bool:
        """Check if sensor manager is running"""
        return self.running

    async def _poll_loop(self):
        """Main polling loop for sensors"""
        while self.running:
            try:
                await self._read_all_sensors()
                await asyncio.sleep(settings.SENSOR_POLL_INTERVAL)
            except Exception as e:
                logger.error(f"Error in sensor poll loop: {e}", exc_info=True)
                await asyncio.sleep(1)

    async def _read_all_sensors(self):
        """Read all configured sensors"""
        if self.simulation_mode:
            await self._simulate_sensors()
        else:
            await self._read_hardware_sensors()

    async def _simulate_sensors(self):
        """Simulate sensor readings for development"""
        import random

        # Engine RPM (0-3000)
        self.current_readings["engine_rpm"] = random.uniform(0, 3000)

        # Oil pressure (0-100 psi)
        self.current_readings["oil_pressure"] = random.uniform(20, 80)

        # Coolant temperature (60-100°C)
        self.current_readings["coolant_temp"] = random.uniform(65, 95)

        # Tank levels (0-100%)
        self.current_readings["fuel_tank"] = random.uniform(30, 100)
        self.current_readings["water_tank"] = random.uniform(40, 100)
        self.current_readings["waste_tank"] = random.uniform(0, 50)

    async def _read_hardware_sensors(self):
        """Read actual hardware sensors"""
        # TODO: Implement actual hardware reading
        # This will be board-specific based on Automation 2040W API
        pass

    def get_reading(self, sensor_id: str) -> Optional[float]:
        """Get current reading for a sensor"""
        return self.current_readings.get(sensor_id)

    def get_all_readings(self) -> Dict[str, float]:
        """Get all current sensor readings"""
        return self.current_readings.copy()
