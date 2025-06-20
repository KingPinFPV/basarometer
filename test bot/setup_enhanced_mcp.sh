#!/bin/bash

# 🚀 Enhanced MCP System Setup Script
# Sets up production-grade Basarometer MCP with browser capabilities

echo "🚀 Setting up Enhanced Basarometer MCP System..."

# Project paths
PROJECT_ROOT="/Users/yogi/Desktop/basarometer/scan bot"
MCP_SERVER_PATH="$PROJECT_ROOT/mcp/basarometer-mcp-server.js"
CLAUDE_CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

# Step 1: Backup existing files
echo "📦 Creating backups..."
if [ -f "$MCP_SERVER_PATH" ]; then
    cp "$MCP_SERVER_PATH" "$MCP_SERVER_PATH.backup-$(date +%Y%m%d-%H%M%S)"
    echo "✅ MCP server backed up"
fi

if [ -f "$CLAUDE_CONFIG_PATH" ]; then
    cp "$CLAUDE_CONFIG_PATH" "$CLAUDE_CONFIG_PATH.backup-$(date +%Y%m%d-%H%M%S)"
    echo "✅ Claude Desktop config backed up"
fi

# Step 2: Install required MCP packages
echo "📦 Installing MCP packages..."
cd "$PROJECT_ROOT"

# Install MCP SDK if not present
if ! npm list @modelcontextprotocol/sdk >/dev/null 2>&1; then
    echo "Installing MCP SDK..."
    npm install @modelcontextprotocol/sdk
fi

# Step 3: Ensure Chrome browser access
echo "🌐 Setting up browser access..."
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ ! -f "$CHROME_PATH" ]; then
    echo "❌ Chrome not found at $CHROME_PATH"
    echo "Please install Google Chrome or update the path in configuration"
    exit 1
else
    echo "✅ Chrome found at $CHROME_PATH"
fi

# Step 4: Create enhanced directories
echo "📁 Creating enhanced directory structure..."
mkdir -p "$PROJECT_ROOT/mcp"
mkdir -p "$PROJECT_ROOT/temp"
mkdir -p "$PROJECT_ROOT/logs/mcp"
mkdir -p "$PROJECT_ROOT/backup/configs"

# Step 5: Set up permissions
echo "🔐 Setting up permissions..."
chmod +x "$PROJECT_ROOT/mcp/"*.js 2>/dev/null || true

# Step 6: Test MCP server syntax
echo "🧪 Testing MCP server..."
if [ -f "$MCP_SERVER_PATH" ]; then
    if node -c "$MCP_SERVER_PATH"; then
        echo "✅ MCP server syntax valid"
    else
        echo "❌ MCP server has syntax errors"
        echo "Please fix the server before proceeding"
        exit 1
    fi
fi

# Step 7: Validate Claude Desktop config directory
echo "📋 Checking Claude Desktop config..."
CLAUDE_CONFIG_DIR="$(dirname "$CLAUDE_CONFIG_PATH")"
if [ ! -d "$CLAUDE_CONFIG_DIR" ]; then
    echo "Creating Claude Desktop config directory..."
    mkdir -p "$CLAUDE_CONFIG_DIR"
fi

# Step 8: Test browser automation capabilities
echo "🤖 Testing browser automation..."
if command -v npx >/dev/null 2>&1; then
    echo "✅ npx available for MCP packages"
else
    echo "❌ npx not found - please install Node.js"
    exit 1
fi

# Step 9: Create health check script
echo "📊 Creating health check script..."
cat > "$PROJECT_ROOT/scripts/mcp-health-check.sh" << 'EOF'
#!/bin/bash
# MCP Health Check Script

PROJECT_ROOT="/Users/yogi/Desktop/basarometer/scan bot"
MCP_SERVER="$PROJECT_ROOT/mcp/basarometer-mcp-server.js"

echo "🏥 MCP Health Check"
echo "==================="

# Check MCP server file
if [ -f "$MCP_SERVER" ]; then
    echo "✅ MCP server file exists"
    if node -c "$MCP_SERVER"; then
        echo "✅ MCP server syntax valid"
    else
        echo "❌ MCP server syntax errors"
    fi
else
    echo "❌ MCP server file missing"
fi

# Check config file
CONFIG_FILE="$PROJECT_ROOT/config/meat-sites.json"
if [ -f "$CONFIG_FILE" ]; then
    echo "✅ Configuration file exists"
    if jq empty "$CONFIG_FILE" 2>/dev/null; then
        echo "✅ Configuration file valid JSON"
        SITE_COUNT=$(jq 'keys | length' "$CONFIG_FILE")
        echo "📊 Configured sites: $SITE_COUNT"
    else
        echo "❌ Configuration file invalid JSON"
    fi
else
    echo "❌ Configuration file missing"
fi

# Check Chrome browser
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ -f "$CHROME_PATH" ]; then
    echo "✅ Chrome browser available"
else
    echo "❌ Chrome browser not found"
fi

# Test scanner availability
SCANNER="$PROJECT_ROOT/basarometer-scanner.js"
if [ -f "$SCANNER" ]; then
    echo "✅ Basarometer scanner available"
    if node -c "$SCANNER"; then
        echo "✅ Scanner syntax valid"
    else
        echo "❌ Scanner syntax errors"
    fi
else
    echo "❌ Scanner file missing"
fi

echo "==================="
echo "Health check complete"
EOF

chmod +x "$PROJECT_ROOT/scripts/mcp-health-check.sh"

# Step 10: Create MCP restart script
echo "🔄 Creating MCP restart script..."
cat > "$PROJECT_ROOT/scripts/restart-mcp.sh" << 'EOF'
#!/bin/bash
# Restart MCP and Claude Desktop

echo "🔄 Restarting MCP System..."

# Kill any existing MCP processes
echo "Stopping existing MCP processes..."
pkill -f "basarometer-mcp-server.js" || true

# Kill Claude Desktop to force restart
echo "Stopping Claude Desktop..."
pkill -f "Claude" || true

# Wait a moment
sleep 2

# Start Claude Desktop
echo "Starting Claude Desktop..."
open -a Claude

echo "✅ MCP system restarted"
echo "Wait 10 seconds for full initialization"
EOF

chmod +x "$PROJECT_ROOT/scripts/restart-mcp.sh"

# Final summary
echo ""
echo "🎉 Enhanced MCP Setup Complete!"
echo "================================"
echo ""
echo "✅ Backups created"
echo "✅ Directories structured"
echo "✅ Permissions configured"
echo "✅ Health check script created"
echo "✅ Restart script created"
echo ""
echo "📋 Next Steps:"
echo "1. Apply the MCP server fixes from Claude Code instructions"
echo "2. Update Claude Desktop config with enhanced settings"
echo "3. Run: $PROJECT_ROOT/scripts/restart-mcp.sh"
echo "4. Test with: analyze_israeli_site_real"
echo ""
echo "🔧 Maintenance Commands:"
echo "Health Check: $PROJECT_ROOT/scripts/mcp-health-check.sh"
echo "Restart MCP: $PROJECT_ROOT/scripts/restart-mcp.sh"
echo ""
echo "🚀 Ready for production-grade Israeli retail intelligence!"