"""
Relay Manager - Handles relay control for Automation 2040W boards
"""
import asyncio
import logging
from typing import Dict, Any, Optional
from config import settings

logger = logging.getLogger(__name__)


class RelayManager:
    """Manages relay states and control"""

    def __init__(self):
        self.running = False
        self.relays: Dict[str, Dict[str, Any]] = {}
        self.timed_tasks: Dict[str, asyncio.Task] = {}
        self.simulation_mode = settings.SIMULATION_MODE

        # Initialize relay states
        for board_id in range(2):  # 2 boards
            for relay_num in range(3):  # 3 relays per board
                relay_id = f"relay_{board_id * 3 + relay_num}"
                self.relays[relay_id] = {
                    "id": relay_id,
                    "board_id": board_id,
                    "relay_number": relay_num,
                    "state": False,
                    "name": f"Relay {board_id * 3 + relay_num + 1}",
                    "enabled": True,
                    "mode": "normal",  # normal or timed
                    "timed_duration": 60,  # seconds (for timed mode - can be hours: 3600)
                }

        if not self.simulation_mode:
            try:
                from automation2040w import Automation2040W
                self.boards = [Automation2040W(i) for i in range(settings.AUTOMATION_2040W_COUNT)]
                logger.info(f"Initialized {len(self.boards)} Automation 2040W boards for relay control")
            except ImportError:
                logger.warning("Automation 2040W library not available, using simulation mode")
                self.simulation_mode = True
                self.boards = []
        else:
            logger.info("Relay manager running in simulation mode")
            self.boards = []

    async def start(self):
        """Start relay manager"""
        self.running = True
        logger.info("Relay manager started")

    async def stop(self):
        """Stop relay manager and turn off all relays"""
        self.running = False
        # Stop all timed tasks
        for task in self.timed_tasks.values():
            task.cancel()
        self.timed_tasks.clear()
        # Turn off all relays
        for relay_id in self.relays.keys():
            await self.set_relay(relay_id, False)
        logger.info("Relay manager stopped")

    def get_relay(self, relay_id: str) -> Optional[Dict[str, Any]]:
        """Get relay configuration and state"""
        return self.relays.get(relay_id)

    def get_all_relays(self) -> Dict[str, Dict[str, Any]]:
        """Get all relay configurations and states"""
        return self.relays.copy()

    async def set_relay(self, relay_id: str, state: bool, cancel_timer: bool = True) -> bool:
        """Set relay state"""
        if relay_id not in self.relays:
            logger.error(f"Relay {relay_id} not found")
            return False

        relay = self.relays[relay_id]

        if not relay["enabled"]:
            logger.warning(f"Relay {relay_id} is disabled")
            return False

        # Cancel timed task if requested
        if cancel_timer and relay_id in self.timed_tasks:
            self.timed_tasks[relay_id].cancel()
            del self.timed_tasks[relay_id]

        # Set hardware relay
        if not self.simulation_mode:
            try:
                board = self.boards[relay["board_id"]]
                relay_obj = getattr(board, f"relay_{relay['relay_number'] + 1}")
                relay_obj.value = state
            except Exception as e:
                logger.error(f"Error setting relay {relay_id} hardware: {e}")
                return False

        relay["state"] = state
        logger.info(f"Relay {relay_id} set to {state}")
        return True

    async def toggle_relay(self, relay_id: str) -> bool:
        """Toggle relay state"""
        if relay_id not in self.relays:
            return False

        relay = self.relays[relay_id]
        new_state = not relay["state"]
        return await self.set_relay(relay_id, new_state)

    async def update_relay_config(self, relay_id: str, config: Dict[str, Any]) -> bool:
        """Update relay configuration"""
        if relay_id not in self.relays:
            logger.error(f"Relay {relay_id} not found")
            return False

        relay = self.relays[relay_id]

        # Update configuration
        if "name" in config:
            relay["name"] = config["name"]
        if "enabled" in config:
            relay["enabled"] = config["enabled"]
            if not config["enabled"]:
                # Turn off relay if disabled
                await self.set_relay(relay_id, False)
        if "mode" in config:
            relay["mode"] = config["mode"]
        if "timed_duration" in config:
            relay["timed_duration"] = config["timed_duration"]

        logger.info(f"Updated relay {relay_id} config: {config}")
        return True

    async def start_timed_relay(self, relay_id: str, duration: float):
        """Start a timed relay (auto-off after duration)"""
        if relay_id not in self.relays:
            return

        relay = self.relays[relay_id]

        # Cancel existing timed task
        if relay_id in self.timed_tasks:
            self.timed_tasks[relay_id].cancel()

        async def timed_task():
            try:
                logger.info(f"Timed relay {relay_id} starting for {duration}s")
                await asyncio.sleep(duration)
                # Turn off after duration
                await self.set_relay(relay_id, False, cancel_timer=False)
                logger.info(f"Timed relay {relay_id} auto-off after {duration}s")
            except asyncio.CancelledError:
                logger.info(f"Timed task for {relay_id} cancelled")

        # Create and store task
        task = asyncio.create_task(timed_task())
        self.timed_tasks[relay_id] = task

    async def turn_on(self, relay_id: str) -> bool:
        """Turn relay on (handles timed mode)"""
        if relay_id not in self.relays:
            return False

        relay = self.relays[relay_id]

        # Turn on the relay
        success = await self.set_relay(relay_id, True, cancel_timer=True)

        if success and relay["mode"] == "timed":
            # Start timer for auto-off
            await self.start_timed_relay(relay_id, relay["timed_duration"])

        return success

    async def turn_off(self, relay_id: str) -> bool:
        """Turn relay off"""
        return await self.set_relay(relay_id, False)
