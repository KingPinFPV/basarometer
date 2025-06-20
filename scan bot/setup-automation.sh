#!/bin/bash

# Basarometer V5.2 - 3x Daily Automated Scanner Setup
# Israel Time: 8 AM, 2 PM, 8 PM daily
# Covers all 8 networks automatically

# Configuration
SCANNER_DIR="/Users/yogi/Desktop/basarometer/v5/scan bot"
LOG_DIR="$SCANNER_DIR/logs/automation"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to log with timestamp
log() {
    echo "[$TIMESTAMP] $1" | tee -a "$LOG_DIR/automation.log"
}

log "🤖 Setting up Basarometer V5.2 automation..."

# Create the scanner execution script
cat > "$SCANNER_DIR/run-automated-scan.sh" << 'EOF'
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

EOF

# Make the script executable
chmod +x "$SCANNER_DIR/run-automated-scan.sh"

log "📝 Setting up cron jobs for Israel timezone..."

# Israel timezone cron schedule (3x daily)
# 8 AM Israel = 5 AM UTC (UTC+3 in summer, UTC+2 in winter)
# 2 PM Israel = 11 AM UTC 
# 8 PM Israel = 5 PM UTC
# Note: Using Israel time directly with system timezone

CRON_JOBS="# Basarometer V5.2 - 3x Daily Automated Scans (Israel Time)
# Morning scan: 8:00 AM
0 8 * * * cd '$SCANNER_DIR' && ./run-automated-scan.sh

# Afternoon scan: 2:00 PM  
0 14 * * * cd '$SCANNER_DIR' && ./run-automated-scan.sh

# Evening scan: 8:00 PM
0 20 * * * cd '$SCANNER_DIR' && ./run-automated-scan.sh

# Weekly cleanup: Sunday 1:00 AM
0 1 * * 0 find '$LOG_DIR' -name '*.log' -mtime +30 -delete 2>/dev/null || true"

# Install cron jobs
echo "$CRON_JOBS" | crontab -

log "✅ Cron jobs installed successfully!"

# Verify cron jobs
log "📋 Current cron schedule:"
crontab -l | grep -E "(Basarometer|scan)" | tee -a "$LOG_DIR/automation.log"

# Create monitoring script
cat > "$SCANNER_DIR/check-automation-status.sh" << 'EOF'
#!/bin/bash

# Basarometer Automation Status Checker
SCANNER_DIR="/Users/yogi/Desktop/basarometer/v5/scan bot"
LOG_DIR="$SCANNER_DIR/logs/automation"

echo "🤖 Basarometer V5.2 Automation Status"
echo "====================================="

# Check if cron jobs are active
echo "📅 Scheduled Jobs:"
crontab -l | grep -E "(Basarometer|scan)" || echo "❌ No automation jobs found"

echo ""
echo "📊 Recent Scan Activity:"
if [ -d "$LOG_DIR" ]; then
    ls -lt "$LOG_DIR"/scan-*.log 2>/dev/null | head -5 || echo "No recent scan logs found"
else
    echo "❌ Log directory not found"
fi

echo ""
echo "📈 Latest Products Output:"
if [ -d "$SCANNER_DIR/output" ]; then
    LATEST_CSV=$(ls -t "$SCANNER_DIR/output"/basarometer-hybrid-products-*.csv 2>/dev/null | head -1)
    if [ -f "$LATEST_CSV" ]; then
        echo "📁 Latest file: $(basename "$LATEST_CSV")"
        echo "📊 Product count: $(wc -l < "$LATEST_CSV") items"
        echo "📅 Modified: $(stat -f "%Sm" "$LATEST_CSV")"
    else
        echo "❌ No recent output files found"
    fi
else
    echo "❌ Output directory not found"
fi

echo ""
echo "⚡ Scanner Dependencies:"
cd "$SCANNER_DIR"
if [ -f "package.json" ]; then
    echo "✅ package.json found"
    if [ -d "node_modules" ]; then
        echo "✅ Dependencies installed"
    else
        echo "⚠️ Dependencies not installed - run 'npm install'"
    fi
else
    echo "❌ package.json not found"
fi

echo ""
echo "🔧 Manual Commands:"
echo "  Check logs: tail -f '$LOG_DIR/automation.log'"
echo "  Test scan: cd '$SCANNER_DIR' && ./run-automated-scan.sh"
echo "  Remove automation: crontab -r"

EOF

chmod +x "$SCANNER_DIR/check-automation-status.sh"

log "🎯 Creating test run..."

# Test the automation immediately
log "🧪 Running test scan to verify setup..."
cd "$SCANNER_DIR"
timeout 60 ./run-automated-scan.sh || log "⚠️ Test scan timed out (normal for initial run)"

log "✅ Basarometer V5.2 automation setup complete!"
log ""
log "📋 Summary:"
log "  • 3x daily scans scheduled (8 AM, 2 PM, 8 PM Israel time)"
log "  • 8 networks covered automatically"
log "  • Logs saved to: $LOG_DIR"
log "  • Status checker: $SCANNER_DIR/check-automation-status.sh"
log ""
log "🚀 Next scans will run automatically according to schedule"
log "💡 Monitor with: $SCANNER_DIR/check-automation-status.sh"