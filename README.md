# BoatMonitor - Shannon

A comprehensive boat monitoring system for the Raspberry Pi, designed to monitor and display boat sensors, engine parameters, Victron equipment, and control relays.

## Features

### 📊 Dashboard (Page 1)
- Customizable widget layout (drag & drop)
- Real-time sensor monitoring:
  - Engine RPM (via digital input)
  - Oil pressure (resistive sensor)
  - Coolant temperature (resistive sensor)
  - Tank levels (fuel, water, waste)
- Victron equipment monitoring:
  - SmartShunt/BMV-712 (Leisure & Starter batteries)
  - SmartSolar MPPT (solar yield & charge status)
  - Multiplus II / Phoenix Inverter

### 📈 History & Trends (Page 2)
- Solar yield tracking (multiple days)
- Battery usage patterns
- Fuel consumption based on tank levels
- Customizable time ranges (24h, 7d, 30d, 90d)
- Visual charts and statistics

### ⚡ Relay Control (Page 3)
- Control 6 relays (3 per Automation 2040W)
- Normal on/off mode
- Flash mode with configurable intervals
- Rename and hide inactive relays
- Visual status indicators

### ⚙️ Settings (Page 4 - Password Protected)
- **Password:** `1AmpMatter`
- Sensor calibration:
  - Pulses per revolution (RPM)
  - Resistance curves (oil pressure, temperature, tank levels)
- Hardware discovery:
  - Auto-detect Automation 2040W boards
  - Discover and pair Victron BLE devices
  - Scan and connect WiFi networks
- System configuration

## Hardware Requirements

- Raspberry Pi 4 (4GB recommended)
- 2x Pimoroni Automation 2040W
- 7" touchscreen display
- Victron equipment:
  - SmartShunt or BMV-712 (battery monitoring)
  - SmartSolar MPPT (solar charge controller)
  - Multiplus II or Phoenix Inverter (optional)
- Various sensors (RPM, temperature, pressure, tank level)

## Software Stack

**Backend:**
- Python 3.11+
- FastAPI (REST API)
- SQLite (database)
- WebSocket (real-time data)
- Bleak (Bluetooth LE)
- VE.Direct protocol support

**Frontend:**
- React 18
- Vite (build tool)
- TailwindCSS (styling)
- react-grid-layout (widget system)
- Recharts (data visualization)
- Zustand (state management)

## Installation

### Development (GitHub Codespaces or Local)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/M160888/BoatMonitor.git
   cd BoatMonitor
   ```

2. **Set up Python backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   ```

3. **Set up React frontend:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Run in development mode:**

   Terminal 1 (Backend):
   ```bash
   cd backend
   source venv/bin/activate
   python main.py
   ```

   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Production (Raspberry Pi)

1. **Install system dependencies:**
   ```bash
   sudo apt-get update
   sudo apt-get install -y python3-pip python3-venv nodejs npm chromium-browser
   ```

2. **Clone and set up as above**

3. **Build frontend:**
   ```bash
   cd frontend
   npm run build
   ```

4. **Install as systemd service:**
   ```bash
   sudo cp scripts/boatmonitor.service /etc/systemd/system/
   sudo systemctl enable boatmonitor
   sudo systemctl start boatmonitor
   ```

5. **Configure kiosk mode:**
   ```bash
   sudo cp scripts/kiosk.sh /usr/local/bin/
   sudo chmod +x /usr/local/bin/kiosk.sh
   ```

   Add to autostart:
   ```bash
   mkdir -p ~/.config/autostart
   cp scripts/kiosk.desktop ~/.config/autostart/
   ```

## Configuration

### Environment Variables

Create `backend/.env`:
```env
SIMULATION_MODE=false  # Set to true for development without hardware
DATABASE_URL=sqlite+aiosqlite:///./boatmonitor.db
SETTINGS_PASSWORD=1AmpMatter
SENSOR_POLL_INTERVAL=0.5
VICTRON_POLL_INTERVAL=1.0
```

### Sensor Calibration

Access the Settings page (password: `1AmpMatter`) to configure:
- RPM: Pulses per revolution
- Tank levels: Resistance to percentage curves
- Temperature: Resistance to °C curves
- Pressure: Resistance to PSI curves

## API Documentation

Once running, visit http://localhost:8000/docs for interactive API documentation.

### Key Endpoints

- `GET /api/sensors` - Get all sensor readings
- `GET /api/victron` - Get Victron device data
- `GET /api/relays` - Get relay states
- `POST /api/relays/{id}/toggle` - Toggle relay
- `GET /api/history/solar/yield` - Get solar yield history
- `WS /api/sensors/ws` - WebSocket for real-time sensor data
- `WS /api/victron/ws` - WebSocket for real-time Victron data

## Color Scheme

The interface uses a carefully chosen color palette:
- **Green (Nature):** Land, environment, environmental indicators
- **Blue (Water):** Water, sailing, freedom, primary actions
- **Orange (Sun):** Sun, holidays, relaxation, warnings

## Development

### Simulation Mode

When `SIMULATION_MODE=true`, the system generates fake data for all sensors and Victron devices, allowing development without physical hardware.

### Project Structure

```
BoatMonitor/
├── backend/              # Python FastAPI backend
│   ├── api/             # API route handlers
│   ├── database/        # Database models and queries
│   ├── hardware/        # Automation 2040W interface
│   ├── victron/         # Victron device handlers
│   └── main.py          # Application entry point
├── frontend/            # React frontend
│   └── src/
│       ├── components/  # Reusable components
│       ├── pages/       # Page components
│       └── utils/       # Utilities (WebSocket, store)
├── config/              # Configuration files
├── checkpoints/         # Development checkpoints
└── scripts/             # Deployment scripts
```

## Contributing

This is a personal project for the Shannon boat, but suggestions and improvements are welcome.

## License

Private project - All rights reserved

## Acknowledgments

- Pimoroni for the Automation 2040W
- Victron Energy for their excellent marine equipment
- The React and FastAPI communities
