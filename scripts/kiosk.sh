#!/bin/bash
# Kiosk mode script for BoatMonitor

# Disable screen blanking
xset s off
xset s noblank
xset -dpms

# Hide cursor after 5 seconds of inactivity
unclutter -idle 5 &

# Start Chromium in kiosk mode
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --fast \
  --fast-start \
  --disable-features=TranslateUI \
  --disk-cache-dir=/dev/null \
  --password-store=basic \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --disable-features=TouchpadOverscrollHistoryNavigation \
  http://localhost:3000
