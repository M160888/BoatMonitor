"""
Wired Automation 2040W board connected via GPIO/I2C
"""
from .board_interface import BoardInterface
from typing import Dict, Optional
import logging
import asyncio

logger = logging.getLogger(__name__)


class WiredBoard(BoardInterface):
    """Automation 2040W connected directly via GPIO/I2C"""

    def __init__(self, board_id: str, board_name: str, i2c_address: Optional[int] = None):
        super().__init__(board_id, board_name)
        self.i2c_address = i2c_address
        self.automation = None
        self.simulation_mode = True  # Will be False when real hardware detected

    async def connect(self) -> bool:
        """Connect to board via GPIO"""
        try:
            # Try to import Pimoroni library
            try:
                from automation import Automation2040W
                self.automation = Automation2040W(i2c_addr=self.i2c_address)
                self.simulation_mode = False
                logger.info(f"Connected to wired board {self.board_name} at I2C {self.i2c_address}")
            except ImportError:
                logger.warning(f"Pimoroni library not found for {self.board_name}, using simulation")
                self.simulation_mode = True
            except Exception as e:
                logger.warning(f"Failed to initialize {self.board_name}, using simulation: {e}")
                self.simulation_mode = True

            self.connected = True
            return True

        except Exception as e:
            logger.error(f"Error connecting to wired board {self.board_name}: {e}")
            return False

    async def disconnect(self):
        """Disconnect from board"""
        self.connected = False
        self.automation = None
        logger.info(f"Disconnected from wired board {self.board_name}")

    async def read_analog(self, channel: int) -> Optional[float]:
        """Read analog input (0-4095 ADC value)"""
        if self.simulation_mode:
            # Simulation values
            import random
            return random.uniform(0, 4095)

        try:
            if self.automation:
                # Read from actual hardware
                # Channel 1-3 are analog inputs on Automation 2040W
                return self.automation.read_analog(channel)
        except Exception as e:
            logger.error(f"Error reading analog channel {channel}: {e}")
        return None

    async def read_digital(self, channel: int) -> Optional[bool]:
        """Read digital input"""
        if self.simulation_mode:
            import random
            return random.choice([True, False])

        try:
            if self.automation:
                return self.automation.read_digital(channel)
        except Exception as e:
            logger.error(f"Error reading digital channel {channel}: {e}")
        return None

    async def read_frequency(self, channel: int) -> Optional[float]:
        """Read frequency input (Hz) for RPM sensing"""
        if self.simulation_mode:
            import random
            return random.uniform(10, 100)  # Simulated Hz

        try:
            if self.automation:
                # Automation 2040W can measure frequency on digital inputs
                return self.automation.read_frequency(channel)
        except Exception as e:
            logger.error(f"Error reading frequency channel {channel}: {e}")
        return None

    async def set_relay(self, relay: int, state: bool) -> bool:
        """Set relay state"""
        if self.simulation_mode:
            logger.info(f"[SIM] Set relay {relay} to {state}")
            return True

        try:
            if self.automation:
                self.automation.set_relay(relay, state)
                return True
        except Exception as e:
            logger.error(f"Error setting relay {relay}: {e}")
        return False

    async def get_relay(self, relay: int) -> Optional[bool]:
        """Get relay current state"""
        if self.simulation_mode:
            return False

        try:
            if self.automation:
                return self.automation.get_relay(relay)
        except Exception as e:
            logger.error(f"Error getting relay {relay}: {e}")
        return None

    async def health_check(self) -> Dict:
        """Check board health"""
        return {
            "board_id": self.board_id,
            "board_name": self.board_name,
            "connection_type": "wired",
            "connected": self.connected,
            "simulation_mode": self.simulation_mode,
            "i2c_address": self.i2c_address
        }
