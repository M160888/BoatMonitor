"""
Configuration settings for BoatMonitor
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings"""

    # Application
    APP_NAME: str = "BoatMonitor"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./boatmonitor.db"

    # Hardware
    SIMULATION_MODE: bool = os.getenv("SIMULATION_MODE", "true").lower() == "true"
    AUTOMATION_2040W_COUNT: int = 2

    # Sensor polling intervals (seconds)
    SENSOR_POLL_INTERVAL: float = 5.0  # Update sensor readings every 5 seconds
    VICTRON_POLL_INTERVAL: float = 5.0  # Update Victron data every 5 seconds
    HISTORY_SAVE_INTERVAL: float = 60.0  # Save to database every minute

    # Security
    SETTINGS_PASSWORD: str = "1AmpMatter"

    # Paths
    CONFIG_DIR: str = "./config"
    CHECKPOINT_DIR: str = "./checkpoints"

    class Config:
        env_file = ".env"


settings = Settings()
