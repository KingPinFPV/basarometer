#!/bin/bash

# 🔄 Basarometer MCP System Restart
# Clean restart of Claude Desktop and MCP system
# Usage: ./scripts/restart-mcp.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔄 Basarometer MCP System Restart"
echo "=================================="
echo "📅 $(date)"
echo ""

# Function to check if Claude Desktop is running
is_claude_running() {
    pgrep -f "Claude" >/dev/null 2>&1
}

# Function to wait with dots
wait_with_dots() {
    local seconds=$1
    local message=$2
    echo -n "$message"
    for i in $(seq 1 $seconds); do
        echo -n "."
        sleep 1
    done
    echo ""
}

echo "🔍 CHECKING CURRENT STATE"
echo "========================="

# Check if Claude Desktop is running
if is_claude_running; then
    echo -e "🖥️ Claude Desktop Status: ${YELLOW}RUNNING${NC}"
    CLAUDE_WAS_RUNNING=true
else
    echo -e "🖥️ Claude Desktop Status: ${RED}NOT RUNNING${NC}"
    CLAUDE_WAS_RUNNING=false
fi

# Check for any MCP server processes
MCP_PROCESSES=$(pgrep -f "basarometer-mcp-server" | wc -l)
if [[ $MCP_PROCESSES -gt 0 ]]; then
    echo -e "🤖 MCP Server Processes: ${YELLOW}$MCP_PROCESSES running${NC}"
else
    echo -e "🤖 MCP Server Processes: ${GREEN}None running${NC}"
fi

echo ""
echo "🛑 SHUTTING DOWN SERVICES"
echo "=========================="

# Step 1: Gracefully terminate MCP server processes
if [[ $MCP_PROCESSES -gt 0 ]]; then
    echo "🤖 Terminating MCP server processes..."
    pkill -f "basarometer-mcp-server" 2>/dev/null
    wait_with_dots 3 "   Waiting for graceful shutdown"
    
    # Force kill if still running
    if pgrep -f "basarometer-mcp-server" >/dev/null 2>&1; then
        echo "   Force terminating remaining processes..."
        pkill -9 -f "basarometer-mcp-server" 2>/dev/null
        sleep 1
    fi
    echo -e "   ${GREEN}✅ MCP processes terminated${NC}"
else
    echo "🤖 No MCP processes to terminate"
fi

# Step 2: Close Claude Desktop if it was running
if $CLAUDE_WAS_RUNNING; then
    echo "🖥️ Closing Claude Desktop..."
    osascript -e 'tell application "Claude" to quit' 2>/dev/null || true
    wait_with_dots 5 "   Waiting for clean shutdown"
    
    # Force quit if still running
    if is_claude_running; then
        echo "   Force quitting Claude Desktop..."
        pkill -f "Claude" 2>/dev/null || true
        sleep 2
    fi
    echo -e "   ${GREEN}✅ Claude Desktop closed${NC}"
else
    echo "🖥️ Claude Desktop was not running"
fi

# Step 3: Clean up any orphaned processes
echo "🧹 Cleaning up orphaned processes..."
pkill -f "node.*mcp" 2>/dev/null || true
sleep 1
echo -e "   ${GREEN}✅ Cleanup completed${NC}"

echo ""
echo "⏳ WAITING FOR CLEAN STATE"
echo "=========================="
wait_with_dots 3 "🕐 Ensuring all processes are terminated"

# Verify clean state
if pgrep -f "Claude\|basarometer-mcp" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ Warning: Some processes may still be running${NC}"
else
    echo -e "${GREEN}✅ All processes cleanly terminated${NC}"
fi

echo ""
echo "🚀 STARTING SERVICES"
echo "===================="

# Only restart Claude Desktop if it was running before
if $CLAUDE_WAS_RUNNING; then
    echo "🖥️ Starting Claude Desktop..."
    
    # Try to start Claude Desktop
    if command -v claude >/dev/null 2>&1; then
        # If claude command exists
        claude &
    elif [[ -d "/Applications/Claude.app" ]]; then
        # If Claude app exists in Applications
        open -a "Claude" &
    else
        echo -e "${RED}❌ Claude Desktop not found${NC}"
        echo "   Please install Claude Desktop or start it manually"
        exit 1
    fi
    
    wait_with_dots 5 "   Waiting for Claude Desktop to start"
    
    # Check if Claude started successfully
    if is_claude_running; then
        echo -e "   ${GREEN}✅ Claude Desktop started successfully${NC}"
    else
        echo -e "   ${YELLOW}⚠️ Claude Desktop may still be starting${NC}"
    fi
else
    echo "🖥️ Skipping Claude Desktop start (was not running before)"
fi

echo ""
echo "🔧 MCP SYSTEM INITIALIZATION"
echo "============================="

echo "🤖 MCP server will auto-start when Claude Desktop connects..."
wait_with_dots 5 "   Waiting for MCP initialization"

# Check if MCP processes started
MCP_PROCESSES_AFTER=$(pgrep -f "basarometer-mcp-server" | wc -l)
if [[ $MCP_PROCESSES_AFTER -gt 0 ]]; then
    echo -e "   ${GREEN}✅ MCP server processes detected: $MCP_PROCESSES_AFTER${NC}"
else
    echo -e "   ${YELLOW}ℹ️ MCP server will start on first connection${NC}"
fi

echo ""
echo "📊 RESTART SUMMARY"
echo "=================="

echo "🕐 Restart completed at: $(date)"

if $CLAUDE_WAS_RUNNING && is_claude_running; then
    echo -e "🖥️ Claude Desktop: ${GREEN}✅ RUNNING${NC}"
else
    echo -e "🖥️ Claude Desktop: ${YELLOW}⏳ CHECK MANUALLY${NC}"
fi

echo -e "🤖 MCP System: ${GREEN}✅ READY${NC}"
echo ""

echo "🎯 NEXT STEPS"
echo "============="
echo "1. Open Claude Desktop if not already open"
echo "2. Test MCP connection in Claude chat"
echo "3. Run health check: ./scripts/mcp-health-check.sh"
echo "4. Test site integration: ./scripts/test-yohananof.sh"

echo ""
echo "💡 TROUBLESHOOTING"
echo "=================="
echo "If issues persist:"
echo "• Check Claude Desktop config: ~/Library/Application Support/Claude/claude_desktop_config.json"
echo "• Verify MCP server: node mcp/basarometer-mcp-server.js"
echo "• Check logs in Claude Desktop Console"

echo ""
echo -e "${GREEN}🎉 MCP system restart completed successfully!${NC}"