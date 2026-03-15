#!/bin/bash
# Script to generate Devfolio screenshots for Molttail
# Run this after starting the dev server on port 3001

set -e

APP_URL="http://localhost:3001"
OUTPUT_DIR="${1:-./screenshots}"
SCREENSHOT_WIDTH="${2:-1920}"
SCREENSHOT_HEIGHT="${3:-1080}"

mkdir -p "$OUTPUT_DIR"

echo "Generating Devfolio screenshots for Molttail..."
echo "Output directory: $OUTPUT_DIR"
echo "Resolution: ${SCREENSHOT_WIDTH}x${SCREENSHOT_HEIGHT}"

# Wait for server to be ready
echo "Waiting for server at $APP_URL..."
for i in {1..30}; do
    if curl -s -o /dev/null -w "%{http_code}" "$APP_URL" | grep -q "200"; then
        echo "Server is ready!"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

echo ""
echo "To generate screenshots manually, run:"
echo ""
echo "chromium --headless --disable-gpu --screenshot=\"$OUTPUT_DIR/01-landing.png\" --window-size=${SCREENSHOT_WIDTH},${SCREENSHOT_HEIGHT} '$APP_URL' 2>/dev/null"
echo "chromium --headless --disable-gpu --screenshot=\"$OUTPUT_DIR/02-feed.png\" --window-size=${SCREENSHOT_WIDTH},${SCREENSHOT_HEIGHT} '$APP_URL?wallet=0x5793' 2>/dev/null"
echo "chromium --headless --disable-gpu --screenshot=\"$OUTPUT_DIR/03-multichain.png\" --window-size=${SCREENSHOT_WIDTH},${SCREENSHOT_HEIGHT} '$APP_URL?chain=ethereum' 2>/dev/null"
echo "chromium --headless --disable-gpu --screenshot=\"$OUTPUT_DIR/04-judge.png\" --window-size=${SCREENSHOT_WIDTH},${SCREENSHOT_HEIGHT} '$APP_URL/judge' 2>/dev/null"
echo ""
echo "Or use puppeteer:"
echo ""
echo "node -e \""
echo "const puppeteer = require('puppeteer');"
echo "const browser = await puppeteer.launch();"
echo "const page = await browser.newPage();"
echo "await page.setViewport({width: ${SCREENSHOT_WIDTH}, height: ${SCREENSHOT_HEIGHT}});"
echo "await page.goto('$APP_URL');"
echo "await page.screenshot({path: '$OUTPUT_DIR/01-landing.png', fullPage: true});"
echo "await page.goto('$APP_URL/judge');"
echo "await page.screenshot({path: '$OUTPUT_DIR/04-judge.png', fullPage: true});"
echo "await browser.close();"
echo "\""
echo ""
