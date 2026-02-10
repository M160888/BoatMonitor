"""
MicroPython firmware for Automation 2040W (Wireless Mode)
Flash this to boards that will connect via WiFi

Setup:
1. Flash MicroPython to the Automation 2040W
2. Copy this file as main.py to the board
3. Edit WIFI_SSID and WIFI_PASSWORD below
4. Board will connect to WiFi and start HTTP server
"""

import network
import socket
import json
import time
import machine
from automation import Automation2040W

# ========================================
# CONFIGURATION - Edit these values
# ========================================
BOARD_ID = "board-1"  # Unique ID for this board
BOARD_NAME = "Engine Sensors"  # Descriptive name
WIFI_SSID = "BoatMonitor"  # Your Pi's WiFi AP name
WIFI_PASSWORD = "boatpass123"  # Your Pi's WiFi password
HTTP_PORT = 80

# Sensor channel mapping (customize per board)
SENSOR_CHANNELS = {
    "engine_rpm": {"type": "frequency", "channel": 1},
    "oil_pressure": {"type": "analog", "channel": 1},
    "coolant_temp": {"type": "analog", "channel": 2},
    "fuel_tank": {"type": "analog", "channel": 3},
}

# Relay mapping (customize per board)
RELAY_CHANNELS = {
    1: "Bilge Pump",
    2: "Navigation Lights",
    3: "Deck Lights",
}

# ========================================
# Hardware initialization
# ========================================
board = Automation2040W()
wlan = network.WLAN(network.STA_IF)

# LED for status indication
led = machine.Pin("LED", machine.Pin.OUT)


def blink_led(times=1, delay=0.2):
    """Blink onboard LED"""
    for _ in range(times):
        led.on()
        time.sleep(delay)
        led.off()
        time.sleep(delay)


def connect_wifi():
    """Connect to WiFi network"""
    wlan.active(True)
    wlan.connect(WIFI_SSID, WIFI_PASSWORD)

    print(f"Connecting to WiFi {WIFI_SSID}...", end="")

    # Wait for connection (30 second timeout)
    max_wait = 30
    while max_wait > 0:
        if wlan.status() < 0 or wlan.status() >= 3:
            break
        max_wait -= 1
        print(".", end="")
        time.sleep(1)

    if wlan.status() != 3:
        print(" FAILED!")
        # Blink LED rapidly to indicate error
        for _ in range(10):
            blink_led(1, 0.1)
        raise RuntimeError("WiFi connection failed")

    print(" CONNECTED!")
    status = wlan.ifconfig()
    print(f"IP Address: {status[0]}")

    # Blink LED 3 times to indicate success
    blink_led(3, 0.3)

    return status[0]


def read_sensor(sensor_name):
    """Read a sensor value"""
    if sensor_name not in SENSOR_CHANNELS:
        return None

    config = SENSOR_CHANNELS[sensor_name]
    channel = config["channel"]
    sensor_type = config["type"]

    try:
        if sensor_type == "analog":
            return board.read_analog(channel)
        elif sensor_type == "digital":
            return board.read_digital(channel)
        elif sensor_type == "frequency":
            return board.read_frequency(channel)
    except Exception as e:
        print(f"Error reading {sensor_name}: {e}")
        return None


def handle_request(client):
    """Handle HTTP request"""
    try:
        request = client.recv(1024).decode()
        lines = request.split("\r\n")
        if not lines:
            return

        # Parse request line
        request_line = lines[0].split(" ")
        if len(request_line) < 2:
            return

        method = request_line[0]
        path = request_line[1]

        print(f"{method} {path}")

        # Route requests
        if path == "/health":
            response = {
                "status": "ok",
                "board_id": BOARD_ID,
                "board_name": BOARD_NAME,
                "ip_address": wlan.ifconfig()[0],
                "sensors": list(SENSOR_CHANNELS.keys()),
                "relays": list(RELAY_CHANNELS.keys())
            }
            send_json(client, response)

        elif path == "/sensors":
            # Read all sensors
            response = {}
            for sensor_name in SENSOR_CHANNELS.keys():
                value = read_sensor(sensor_name)
                if value is not None:
                    response[sensor_name] = value
            send_json(client, response)

        elif path.startswith("/analog/"):
            channel = int(path.split("/")[2])
            value = board.read_analog(channel)
            send_json(client, {"channel": channel, "value": value})

        elif path.startswith("/digital/"):
            channel = int(path.split("/")[2])
            value = board.read_digital(channel)
            send_json(client, {"channel": channel, "value": value})

        elif path.startswith("/frequency/"):
            channel = int(path.split("/")[2])
            value = board.read_frequency(channel)
            send_json(client, {"channel": channel, "value": value})

        elif path.startswith("/relay/"):
            relay = int(path.split("/")[2])

            if method == "GET":
                # Get relay state
                state = board.get_relay(relay)
                send_json(client, {"relay": relay, "state": state})

            elif method == "POST":
                # Set relay state
                # Parse JSON body
                body_start = request.find("\r\n\r\n") + 4
                body = request[body_start:]
                data = json.loads(body)
                state = data.get("state", False)

                board.set_relay(relay, state)
                send_json(client, {"status": "ok", "relay": relay, "state": state})

        else:
            send_error(client, 404, "Not Found")

    except Exception as e:
        print(f"Error handling request: {e}")
        send_error(client, 500, "Internal Server Error")


def send_json(client, data):
    """Send JSON response"""
    response = json.dumps(data)
    client.send("HTTP/1.1 200 OK\r\n")
    client.send("Content-Type: application/json\r\n")
    client.send(f"Content-Length: {len(response)}\r\n")
    client.send("Connection: close\r\n\r\n")
    client.send(response)


def send_error(client, code, message):
    """Send error response"""
    client.send(f"HTTP/1.1 {code} {message}\r\n")
    client.send("Content-Type: text/plain\r\n")
    client.send("Connection: close\r\n\r\n")
    client.send(message)


def start_server():
    """Start HTTP server"""
    addr = socket.getaddrinfo("0.0.0.0", HTTP_PORT)[0][-1]
    s = socket.socket()
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind(addr)
    s.listen(5)

    print(f"HTTP server listening on port {HTTP_PORT}")
    print(f"Board: {BOARD_NAME} ({BOARD_ID})")
    print("Ready to accept connections!")

    # Slow blink to indicate ready
    led.on()

    while True:
        try:
            client, addr = s.accept()
            print(f"Connection from {addr}")
            handle_request(client)
            client.close()
        except Exception as e:
            print(f"Error: {e}")
            time.sleep(1)


# ========================================
# Main execution
# ========================================
def main():
    """Main entry point"""
    print("=" * 50)
    print("Automation 2040W - Wireless Mode")
    print(f"Board: {BOARD_NAME} ({BOARD_ID})")
    print("=" * 50)

    # Connect to WiFi
    ip = connect_wifi()

    # Start HTTP server
    start_server()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nShutdown")
        wlan.disconnect()
        wlan.active(False)
    except Exception as e:
        print(f"Fatal error: {e}")
        # Rapid blink to indicate error
        while True:
            blink_led(1, 0.1)
