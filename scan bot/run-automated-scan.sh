#!/bin/bash

# Automated Basarometer Scanner Execution
SCANNER_DIR="/Users/yogi/Desktop/basarometer/v5/scan bot"
LOG_DIR="$SCANNER_DIR/logs/automation"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

# Create log directory
mkdir -p "$LOG_DIR"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/scan-$TIMESTAMP.log"
}

log "🚀 Starting automated scan cycle..."

# Change to scanner directory
cd "$SCANNER_DIR"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    log "📦 Installing dependencies..."
    npm install
fi

# Run the hybrid scanner for all 8 networks
log "🔍 Executing 8-network scan..."
node basarometer-hybrid-scanner.js > "$LOG_DIR/scanner-output-$TIMESTAMP.log" 2>&1

# Check scanner exit code
if [ $? -eq 0 ]; then
    log "✅ Scan completed successfully"
    
    # Count products found
    LATEST_OUTPUT=$(ls -t output/basarometer-hybrid-products-*.csv 2>/dev/null | head -1)
    if [ -f "$LATEST_OUTPUT" ]; then
        PRODUCT_COUNT=$(wc -l < "$LATEST_OUTPUT")
        log "📊 Products found: $PRODUCT_COUNT"
    fi
    
    # Optional: Send data to v3 API endpoint
    log "📤 Attempting to sync with production API..."
    # curl -X POST "https://v3.basarometer.org/api/scanner/ingest" \
    #      -H "Content-Type: application/json" \
    #      -d @"$LATEST_OUTPUT" || log "⚠️ API sync failed (non-critical)"
    
else
    log "❌ Scan failed with exit code $?"
    
    # Take screenshot for debugging if in GUI mode
    if [ -n "$DISPLAY" ]; then
        screencapture "$LOG_DIR/error-screenshot-$TIMESTAMP.png" 2>/dev/null || true
    fi
fi

log "🔚 Scan cycle completed"

# Clean up old logs (keep last 30 days)
find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true
find "$LOG_DIR" -name "*.png" -mtime +7 -delete 2>/dev/null || true

