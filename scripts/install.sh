#!/bin/bash
# Installation script for BoatMonitor on Raspberry Pi

set -e

echo "==================================="
echo "BoatMonitor Installation Script"
echo "==================================="
echo ""

# Check if running on Raspberry Pi
if [ ! -f /proc/device-tree/model ] || ! grep -q "Raspberry Pi" /proc/device-tree/model; then
    echo "Warning: This doesn't appear to be a Raspberry Pi"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update system
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install system dependencies
echo "Installing system dependencies..."
sudo apt-get install -y \
    python3-pip \
    python3-venv \
    python3-dev \
    git \
    nodejs \
    npm \
    chromium-browser \
    unclutter \
    i2c-tools \
    bluetooth \
    bluez \
    libbluetooth-dev

# Enable I2C
echo "Enabling I2C..."
sudo raspi-config nonint do_i2c 0

# Enable Bluetooth
echo "Enabling Bluetooth..."
sudo systemctl enable bluetooth
sudo systemctl start bluetooth

# Set up Python virtual environment
echo "Setting up Python virtual environment..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

# Set up frontend
echo "Setting up frontend..."
cd ../frontend
npm install
npm run build

# Install systemd service
echo "Installing systemd service..."
sudo cp ../scripts/boatmonitor.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable boatmonitor

# Install kiosk mode
echo "Installing kiosk mode..."
sudo cp ../scripts/kiosk.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/kiosk.sh
mkdir -p ~/.config/autostart
cp ../scripts/kiosk.desktop ~/.config/autostart/

# Create config directory
echo "Creating config directory..."
mkdir -p ../config

# Copy environment file
echo "Setting up environment..."
cd ../backend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "SIMULATION_MODE=false" >> .env
fi

echo ""
echo "==================================="
echo "Installation Complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Edit backend/.env to configure settings"
echo "2. Start the service: sudo systemctl start boatmonitor"
echo "3. Check status: sudo systemctl status boatmonitor"
echo "4. Reboot to start kiosk mode: sudo reboot"
echo ""
echo "The web interface will be available at:"
echo "  http://localhost:3000 (after reboot)"
echo ""
echo "To disable kiosk mode, remove:"
echo "  ~/.config/autostart/kiosk.desktop"
echo ""
