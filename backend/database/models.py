"""
Database models for BoatMonitor
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from .database import Base


class SensorReading(Base):
    """Historical sensor readings"""
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    sensor_type = Column(String, index=True)  # rpm, oil_pressure, coolant_temp, etc.
    sensor_id = Column(String, index=True)  # Unique sensor identifier
    value = Column(Float)
    unit = Column(String)


class VictronReading(Base):
    """Historical Victron device readings"""
    __tablename__ = "victron_readings"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    device_type = Column(String, index=True)  # smartshunt, mppt, inverter
    device_id = Column(String, index=True)
    data = Column(JSON)  # Flexible JSON storage for all device data


class RelayState(Base):
    """Relay configuration and state"""
    __tablename__ = "relay_states"

    id = Column(Integer, primary_key=True, index=True)
    relay_id = Column(String, unique=True, index=True)  # relay_0 to relay_5
    name = Column(String, default="Relay")
    enabled = Column(Boolean, default=True)
    mode = Column(String, default="normal")  # normal or flash
    flash_interval = Column(Float, default=1.0)  # seconds
    state = Column(Boolean, default=False)
    board_id = Column(Integer)  # 0 or 1
    relay_number = Column(Integer)  # 0, 1, or 2


class SensorCalibration(Base):
    """Sensor calibration settings"""
    __tablename__ = "sensor_calibrations"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(String, unique=True, index=True)
    sensor_type = Column(String)
    calibration_type = Column(String)  # linear, lookup_table, polynomial
    calibration_data = Column(JSON)  # Flexible calibration parameters
    unit = Column(String)


class SystemSettings(Base):
    """System-wide settings"""
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(JSON)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class WidgetLayout(Base):
    """Dashboard widget layout configuration"""
    __tablename__ = "widget_layouts"

    id = Column(Integer, primary_key=True, index=True)
    page = Column(Integer, default=1)  # Page 1 = dashboard
    widget_id = Column(String)
    widget_type = Column(String)  # rpm, battery, solar, tank, etc.
    position_x = Column(Integer, default=0)
    position_y = Column(Integer, default=0)
    width = Column(Integer, default=1)
    height = Column(Integer, default=1)
    config = Column(JSON)  # Widget-specific configuration
