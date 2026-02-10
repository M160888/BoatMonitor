"""
Abstract board interface supporting both wired (GPIO) and wireless (WiFi) Automation 2040W boards
"""
from abc import ABC, abstractmethod
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class BoardInterface(ABC):
    """Abstract base class for Automation 2040W board communication"""

    def __init__(self, board_id: str, board_name: str):
        self.board_id = board_id
        self.board_name = board_name
        self.connected = False

    @abstractmethod
    async def connect(self) -> bool:
        """Connect to the board"""
        pass

    @abstractmethod
    async def disconnect(self):
        """Disconnect from the board"""
        pass

    @abstractmethod
    async def read_analog(self, channel: int) -> Optional[float]:
        """Read analog input (0-4095 ADC value)"""
        pass

    @abstractmethod
    async def read_digital(self, channel: int) -> Optional[bool]:
        """Read digital input"""
        pass

    @abstractmethod
    async def read_frequency(self, channel: int) -> Optional[float]:
        """Read frequency input (Hz) for RPM sensing"""
        pass

    @abstractmethod
    async def set_relay(self, relay: int, state: bool) -> bool:
        """Set relay state (True=on, False=off)"""
        pass

    @abstractmethod
    async def get_relay(self, relay: int) -> Optional[bool]:
        """Get relay current state"""
        pass

    @abstractmethod
    async def health_check(self) -> Dict:
        """Check board health and return status"""
        pass

    def is_connected(self) -> bool:
        """Check if board is connected"""
        return self.connected
