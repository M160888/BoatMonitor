# Hardware Setup Guide - Automation 2040W

This guide covers both **wired** (GPIO) and **wireless** (WiFi) configurations for Automation 2040W boards.

## 📋 Overview

The system supports flexible board connections:
- **Wired**: Board connected directly via GPIO/I2C (most reliable, nearby boards)
- **Wireless**: Board connected via WiFi (flexible placement, remote boards)
- **Hybrid**: Mix of both (recommended!)

---

## 🔌 Option 1: Wired Connection (GPIO/I2C)

### Advantages:
- ✅ Most reliable connection
- ✅ No WiFi configuration needed
- ✅ Lower latency
- ✅ Best for boards near the Pi

### Physical Connection:
```
Raspberry Pi 4 GPIO Header (40-pin)
    ↓ Stack directly or use ribbon cable
Automation 2040W Board
```

### Software Setup:
1. **Install Pimoroni Library:**
   ```bash
   pip3 install pimoroni-automation-2040w
   ```

2. **Enable I2C:**
   ```bash
   sudo raspi-config
   # Navigate to: Interface Options → I2C → Enable
   ```

3. **Verify Connection:**
   ```bash
   sudo i2cdetect -y 1
   # Should show device at address 0x50 or similar
   ```

4. **Configure in `backend/config/boards.json`:**
   ```json
   {
     "board_id": "board-1",
     "board_name": "Engine Sensors",
     "connection_type": "wired",
     "i2c_address": null
   }
   ```

---

## 📡 Option 2: Wireless Connection (WiFi)

### Advantages:
- ✅ Flexible placement anywhere within WiFi range
- ✅ No cables needed
- ✅ Easier installation
- ✅ Best for remote boards

### Prerequisites:
- Automation 2040W with WiFi (CYW43439 chip) ✅
- MicroPython firmware flashed to board
- Raspberry Pi configured as WiFi Access Point

### Step 1: Flash MicroPython to Automation 2040W

1. **Download MicroPython:**
   - Get latest MicroPython for RP2040 from: https://micropython.org/download/rp2-pico-w/
   - Choose the "Pico W" variant (includes WiFi support)

2. **Flash Firmware:**
   ```bash
   # Hold BOOTSEL button on Automation 2040W while connecting USB
   # Board appears as USB drive (RPI-RP2)

   # Copy .uf2 file to the drive
   cp micropython.uf2 /media/RPI-RP2/

   # Board will reboot with MicroPython
   ```

3. **Install Pimoroni MicroPython Libraries:**
   ```bash
   # Connect to board via serial
   screen /dev/ttyACM0 115200

   # Or use Thonny IDE: https://thonny.org/
   ```

### Step 2: Upload Firmware to Board

1. **Edit Configuration:**
   ```python
   # In firmware/automation_2040w_wireless.py:

   BOARD_ID = "board-2"  # Unique ID
   BOARD_NAME = "Tank Sensors"  # Descriptive name
   WIFI_SSID = "BoatMonitor"  # Pi's WiFi AP name
   WIFI_PASSWORD = "boatpass123"  # Pi's WiFi password

   # Configure sensors for this board
   SENSOR_CHANNELS = {
       "fuel_tank": {"type": "analog", "channel": 1},
       "water_tank": {"type": "analog", "channel": 2},
       "waste_tank": {"type": "analog", "channel": 3},
   }

   # Configure relays for this board
   RELAY_CHANNELS = {
       1: "Bilge Pump",
       2: "Navigation Lights",
       3: "Deck Lights",
   }
   ```

2. **Upload to Board:**
   ```bash
   # Using Thonny IDE:
   # 1. Open firmware/automation_2040w_wireless.py
   # 2. Save as "main.py" to the Automation 2040W
   # 3. Board will run automatically on power-up

   # Or using command line:
   mpremote cp firmware/automation_2040w_wireless.py :main.py
   ```

3. **Test Connection:**
   - Board will blink LED during connection
   - 3 blinks = Connected successfully ✅
   - Rapid blinking = Connection failed ❌

   ```bash
   # Check board IP from serial console
   screen /dev/ttyACM0 115200
   # Should show: "IP Address: 192.168.4.100"
   ```

### Step 3: Configure Raspberry Pi WiFi Access Point

1. **Install hostapd and dnsmasq:**
   ```bash
   sudo apt install hostapd dnsmasq
   ```

2. **Configure Access Point:**
   ```bash
   # Edit /etc/hostapd/hostapd.conf
   sudo nano /etc/hostapd/hostapd.conf
   ```

   Add:
   ```
   interface=wlan0
   ssid=BoatMonitor
   wpa_passphrase=boatpass123
   hw_mode=g
   channel=6
   wpa=2
   wpa_key_mgmt=WPA-PSK
   rsn_pairwise=CCMP
   ```

3. **Configure DHCP:**
   ```bash
   # Edit /etc/dnsmasq.conf
   sudo nano /etc/dnsmasq.conf
   ```

   Add:
   ```
   interface=wlan0
   dhcp-range=192.168.4.100,192.168.4.200,24h
   ```

4. **Enable Services:**
   ```bash
   sudo systemctl enable hostapd
   sudo systemctl enable dnsmasq
   sudo systemctl start hostapd
   sudo systemctl start dnsmasq
   ```

### Step 4: Configure Backend

Edit `backend/config/boards.json`:
```json
{
  "board_id": "board-2",
  "board_name": "Tank Sensors & Relays",
  "connection_type": "wireless",
  "ip_address": "192.168.4.100",
  "sensors": {
    "fuel_tank": {"type": "analog", "channel": 1},
    "water_tank": {"type": "analog", "channel": 2},
    "waste_tank": {"type": "analog", "channel": 3}
  },
  "relays": {
    "1": "Bilge Pump",
    "2": "Navigation Lights"
  }
}
```

---

## 🔄 Hybrid Setup (Recommended)

Mix wired and wireless boards for optimal flexibility:

```
Raspberry Pi 4 (WiFi AP)
    ↓ GPIO (wired)
Automation 2040W #1 - Engine Sensors (nearby, critical)

    ↓ WiFi (wireless)
Automation 2040W #2 - Tank Sensors + Relays (remote)
```

**Configuration Example:**
```json
{
  "boards": [
    {
      "board_id": "board-1",
      "board_name": "Engine Sensors",
      "connection_type": "wired",
      "sensors": {
        "engine_rpm": {"type": "frequency", "channel": 1},
        "oil_pressure": {"type": "analog", "channel": 1},
        "coolant_temp": {"type": "analog", "channel": 2}
      }
    },
    {
      "board_id": "board-2",
      "board_name": "Tank Sensors",
      "connection_type": "wireless",
      "ip_address": "192.168.4.100",
      "sensors": {
        "fuel_tank": {"type": "analog", "channel": 1},
        "water_tank": {"type": "analog", "channel": 2},
        "waste_tank": {"type": "analog", "channel": 3}
      },
      "relays": {
        "1": "Bilge Pump",
        "2": "Navigation Lights",
        "3": "Deck Lights"
      }
    }
  ]
}
```

---

## 🔍 Troubleshooting

### Wired Board Not Detected:
```bash
# Check I2C devices
sudo i2cdetect -y 1

# Test GPIO
pinout

# Check logs
journalctl -u boatmonitor -f
```

### Wireless Board Not Connecting:
```bash
# Check WiFi AP is running
sudo systemctl status hostapd

# Check DHCP leases
cat /var/lib/misc/dnsmasq.leases

# Test from board serial console
screen /dev/ttyACM0 115200
# Look for connection status

# Test HTTP connection from Pi
curl http://192.168.4.100/health
```

### LED Status Indicators:
- **Solid ON**: Ready and connected
- **3 Blinks**: WiFi connected successfully
- **Rapid Blink**: Error (WiFi failed or exception)
- **Slow Blink**: Board ready, waiting for connections

---

## 📊 Sensor Channel Reference

### Automation 2040W Inputs:
- **Analog Inputs**: Channels 1-3 (0-40V, 0-4095 ADC)
- **Digital Inputs**: Channels 1-4 (3.3V logic)
- **Frequency Inputs**: Any digital channel (for RPM sensing)

### Common Sensor Wiring:
- **RPM (W-terminal)**: Digital/frequency input
- **Oil Pressure**: 0-5V analog sender → Analog input
- **Coolant Temp**: Resistive sender → Analog input (via voltage divider)
- **Tank Levels**: Resistive senders → Analog inputs

---

## 🚀 Quick Start Checklist

### Wired Board:
- [ ] Install Pimoroni Python library
- [ ] Enable I2C on Pi
- [ ] Connect board via GPIO
- [ ] Configure in boards.json
- [ ] Restart backend

### Wireless Board:
- [ ] Flash MicroPython to board
- [ ] Edit firmware configuration (SSID, sensors)
- [ ] Upload main.py to board
- [ ] Configure Pi WiFi AP
- [ ] Configure in boards.json
- [ ] Power on board (check LED blinks)
- [ ] Test HTTP endpoint
- [ ] Restart backend

---

## 💡 Pro Tips

1. **Start with wired** for critical sensors (engine RPM, oil pressure)
2. **Use wireless** for convenience (tank sensors, remote relays)
3. **Label boards** clearly with board_id for identification
4. **Static IPs** - assign fixed IPs to wireless boards in dnsmasq
5. **Test individually** - verify each board works before combining

---

## 📞 Need Help?

Check the logs:
```bash
# Backend logs
journalctl -u boatmonitor -f

# Board serial output (wireless)
screen /dev/ttyACM0 115200

# WiFi AP status
sudo systemctl status hostapd
```

Your boat monitoring system is now ready! 🚤
