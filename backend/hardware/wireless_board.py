"""
Wireless Automation 2040W board connected via WiFi
"""
from .board_interface import BoardInterface
from typing import Dict, Optional
import logging
import aiohttp
import asyncio

logger = logging.getLogger(__name__)


class WirelessBoard(BoardInterface):
    """Automation 2040W connected via WiFi"""

    def __init__(self, board_id: str, board_name: str, ip_address: str, timeout: int = 5):
        super().__init__(board_id, board_name)
        self.ip_address = ip_address
        self.base_url = f"http://{ip_address}"
        self.timeout = timeout
        self.session = None

    async def connect(self) -> bool:
        """Connect to board via WiFi"""
        try:
            # Create aiohttp session
            timeout = aiohttp.ClientTimeout(total=self.timeout)
            self.session = aiohttp.ClientSession(timeout=timeout)

            # Test connection
            health = await self.health_check()
            if health.get("status") == "ok":
                self.connected = True
                logger.info(f"Connected to wireless board {self.board_name} at {self.ip_address}")
                return True
            else:
                logger.warning(f"Wireless board {self.board_name} health check failed")
                return False

        except Exception as e:
            logger.error(f"Error connecting to wireless board {self.board_name}: {e}")
            self.connected = False
            return False

    async def disconnect(self):
        """Disconnect from board"""
        if self.session:
            await self.session.close()
            self.session = None
        self.connected = False
        logger.info(f"Disconnected from wireless board {self.board_name}")

    async def _get(self, endpoint: str) -> Optional[Dict]:
        """Make GET request to board"""
        if not self.session:
            return None

        try:
            async with self.session.get(f"{self.base_url}{endpoint}") as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.warning(f"GET {endpoint} returned {response.status}")
                    return None
        except asyncio.TimeoutError:
            logger.warning(f"Timeout connecting to {self.board_name}")
            self.connected = False
            return None
        except Exception as e:
            logger.error(f"Error in GET {endpoint}: {e}")
            return None

    async def _post(self, endpoint: str, data: Dict) -> Optional[Dict]:
        """Make POST request to board"""
        if not self.session:
            return None

        try:
            async with self.session.post(f"{self.base_url}{endpoint}", json=data) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.warning(f"POST {endpoint} returned {response.status}")
                    return None
        except asyncio.TimeoutError:
            logger.warning(f"Timeout connecting to {self.board_name}")
            self.connected = False
            return None
        except Exception as e:
            logger.error(f"Error in POST {endpoint}: {e}")
            return None

    async def read_analog(self, channel: int) -> Optional[float]:
        """Read analog input via HTTP"""
        result = await self._get(f"/analog/{channel}")
        return result.get("value") if result else None

    async def read_digital(self, channel: int) -> Optional[bool]:
        """Read digital input via HTTP"""
        result = await self._get(f"/digital/{channel}")
        return result.get("value") if result else None

    async def read_frequency(self, channel: int) -> Optional[float]:
        """Read frequency input via HTTP"""
        result = await self._get(f"/frequency/{channel}")
        return result.get("value") if result else None

    async def set_relay(self, relay: int, state: bool) -> bool:
        """Set relay state via HTTP"""
        result = await self._post(f"/relay/{relay}", {"state": state})
        return result is not None and result.get("status") == "ok"

    async def get_relay(self, relay: int) -> Optional[bool]:
        """Get relay current state via HTTP"""
        result = await self._get(f"/relay/{relay}")
        return result.get("state") if result else None

    async def health_check(self) -> Dict:
        """Check board health via HTTP"""
        result = await self._get("/health")
        if result:
            return {
                "board_id": self.board_id,
                "board_name": self.board_name,
                "connection_type": "wireless",
                "connected": True,
                "ip_address": self.ip_address,
                **result
            }
        else:
            return {
                "board_id": self.board_id,
                "board_name": self.board_name,
                "connection_type": "wireless",
                "connected": False,
                "ip_address": self.ip_address,
                "status": "disconnected"
            }
