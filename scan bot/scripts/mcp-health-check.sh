#!/bin/bash

# 🏥 Basarometer MCP System Health Check
# Comprehensive diagnostics for the Enhanced MCP system
# Usage: ./scripts/mcp-health-check.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="/Users/yogi/Desktop/basarometer/scan bot"
MCP_SERVER="$PROJECT_ROOT/mcp/basarometer-mcp-server.js"
CONFIG_FILE="$PROJECT_ROOT/config/meat-sites.json"
SCANNER_FILE="$PROJECT_ROOT/basarometer-scanner.js"
CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

# Health check results
CHECKS_PASSED=0
CHECKS_TOTAL=0
ISSUES=()

echo "🏥 Basarometer MCP System Health Check"
echo "======================================"
echo "📅 $(date)"
echo "📁 Project: $PROJECT_ROOT"
echo ""

# Function to check and report
check_status() {
    local description="$1"
    local command="$2"
    local fix_suggestion="$3"
    
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    echo -n "🔍 $description... "
    
    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        ISSUES+=("$description: $fix_suggestion")
    fi
}

# Function to check file exists and has content
check_file() {
    local description="$1"
    local filepath="$2"
    local fix_suggestion="$3"
    
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    echo -n "📁 $description... "
    
    if [[ -f "$filepath" && -s "$filepath" ]]; then
        echo -e "${GREEN}✅ EXISTS${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}❌ MISSING${NC}"
        ISSUES+=("$description: $fix_suggestion")
    fi
}

echo "🔧 CORE FILES CHECK"
echo "==================="

# Check MCP server file
check_file "MCP Server File" "$MCP_SERVER" "Run enhanced MCP deployment script"

# Check configuration file
check_file "Configuration File" "$CONFIG_FILE" "Create config/meat-sites.json with site configurations"

# Check scanner file
check_file "Scanner File" "$SCANNER_FILE" "Verify basarometer-scanner.js exists in project root"

echo ""
echo "⚙️ SYSTEM DEPENDENCIES"
echo "======================"

# Check Node.js
check_status "Node.js Installation" "node --version" "Install Node.js from nodejs.org"

# Check npm
check_status "npm Package Manager" "npm --version" "Install npm (usually comes with Node.js)"

# Check Chrome/Chromium
check_status "Chrome Browser" "which chrome || which chromium || which 'Google Chrome'" "Install Google Chrome browser"

echo ""
echo "📝 CONFIGURATION VALIDATION"
echo "==========================="

# Validate MCP server syntax
if [[ -f "$MCP_SERVER" ]]; then
    check_status "MCP Server Syntax" "node -c '$MCP_SERVER'" "Fix syntax errors in MCP server file"
fi

# Validate JSON configuration
if [[ -f "$CONFIG_FILE" ]]; then
    check_status "Configuration JSON Syntax" "python3 -m json.tool '$CONFIG_FILE'" "Fix JSON syntax in meat-sites.json"
    
    # Count configured sites
    if python3 -m json.tool "$CONFIG_FILE" >/dev/null 2>&1; then
        SITE_COUNT=$(python3 -c "import json; print(len(json.load(open('$CONFIG_FILE'))))" 2>/dev/null || echo "0")
        echo "📊 Configured Sites: $SITE_COUNT"
        
        if [[ $SITE_COUNT -gt 0 ]]; then
            echo "📋 Site List:"
            python3 -c "import json; sites = json.load(open('$CONFIG_FILE')); print('\\n'.join(['   • ' + site for site in sites.keys()]))" 2>/dev/null || echo "   Unable to list sites"
        fi
    fi
fi

echo ""
echo "🖥️ CLAUDE DESKTOP INTEGRATION"
echo "============================="

# Check Claude Desktop config
check_file "Claude Desktop Config" "$CLAUDE_CONFIG" "Create Claude Desktop configuration with MCP settings"

# Check if basarometer MCP is configured
if [[ -f "$CLAUDE_CONFIG" ]]; then
    check_status "Basarometer MCP in Config" "grep -q 'basarometer' '$CLAUDE_CONFIG'" "Add basarometer MCP server to Claude Desktop config"
fi

echo ""
echo "📦 MCP DEPENDENCIES"
echo "==================="

# Check if we're in the project directory and have package.json
if [[ -f "$PROJECT_ROOT/package.json" ]]; then
    echo "📦 Checking npm dependencies..."
    cd "$PROJECT_ROOT"
    
    # Check specific MCP dependencies
    check_status "MCP SDK Server" "npm list @modelcontextprotocol/sdk" "Run: npm install @modelcontextprotocol/sdk"
    check_status "Puppeteer" "npm list puppeteer" "Run: npm install puppeteer"
    check_status "Cheerio" "npm list cheerio" "Run: npm install cheerio"
else
    echo "❓ package.json not found - dependency check skipped"
fi

echo ""
echo "🔐 PERMISSIONS CHECK"
echo "===================="

# Check file permissions
if [[ -f "$MCP_SERVER" ]]; then
    if [[ -x "$MCP_SERVER" ]]; then
        echo -e "🔑 MCP Server Executable: ${GREEN}✅ YES${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "🔑 MCP Server Executable: ${RED}❌ NO${NC}"
        ISSUES+=("MCP Server not executable: Run chmod +x '$MCP_SERVER'")
    fi
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
fi

# Check config directory permissions
if [[ -d "$PROJECT_ROOT/config" ]]; then
    if [[ -w "$PROJECT_ROOT/config" ]]; then
        echo -e "📁 Config Directory Writable: ${GREEN}✅ YES${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "📁 Config Directory Writable: ${RED}❌ NO${NC}"
        ISSUES+=("Config directory not writable: Check permissions on $PROJECT_ROOT/config")
    fi
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
fi

echo ""
echo "🎯 QUICK FUNCTIONALITY TEST"
echo "=========================="

# Test MCP server can start (just syntax check)
if [[ -f "$MCP_SERVER" ]] && node -c "$MCP_SERVER" >/dev/null 2>&1; then
    echo -e "🚀 MCP Server Ready: ${GREEN}✅ YES${NC}"
else
    echo -e "🚀 MCP Server Ready: ${RED}❌ NO${NC}"
fi

# Test scanner availability
if [[ -f "$SCANNER_FILE" ]] && [[ -x "$SCANNER_FILE" || "$SCANNER_FILE" =~ \.js$ ]]; then
    echo -e "🔍 Scanner Ready: ${GREEN}✅ YES${NC}"
else
    echo -e "🔍 Scanner Ready: ${RED}❌ NO${NC}"
fi

echo ""
echo "📊 HEALTH CHECK SUMMARY"
echo "======================="
echo "Tests Passed: $CHECKS_PASSED/$CHECKS_TOTAL"

HEALTH_PERCENTAGE=$((CHECKS_PASSED * 100 / CHECKS_TOTAL))
if [[ $HEALTH_PERCENTAGE -ge 90 ]]; then
    echo -e "Overall Health: ${GREEN}🟢 EXCELLENT ($HEALTH_PERCENTAGE%)${NC}"
elif [[ $HEALTH_PERCENTAGE -ge 75 ]]; then
    echo -e "Overall Health: ${YELLOW}🟡 GOOD ($HEALTH_PERCENTAGE%)${NC}"
elif [[ $HEALTH_PERCENTAGE -ge 50 ]]; then
    echo -e "Overall Health: ${YELLOW}🟠 NEEDS ATTENTION ($HEALTH_PERCENTAGE%)${NC}"
else
    echo -e "Overall Health: ${RED}🔴 CRITICAL ($HEALTH_PERCENTAGE%)${NC}"
fi

if [[ ${#ISSUES[@]} -gt 0 ]]; then
    echo ""
    echo "🚨 ISSUES TO FIX:"
    echo "================"
    for issue in "${ISSUES[@]}"; do
        echo -e "${RED}❌${NC} $issue"
    done
    
    echo ""
    echo "💡 QUICK FIXES:"
    echo "==============="
    echo "1. Install missing dependencies: npm install"
    echo "2. Fix permissions: chmod +x scripts/*.sh mcp/*.js"
    echo "3. Restart Claude Desktop: ./scripts/restart-mcp.sh"
    echo "4. Test specific site: ./scripts/test-yohananof.sh"
else
    echo ""
    echo -e "${GREEN}🎉 All systems operational! Ready for Yohananof integration.${NC}"
fi

echo ""
echo "📋 NEXT STEPS:"
echo "=============="
if [[ $HEALTH_PERCENTAGE -ge 80 ]]; then
    echo "✅ System healthy - proceed with site addition"
    echo "   Run: ./scripts/add-site-template.sh yohananof https://www.yohananof.co.il"
else
    echo "⚠️ Fix critical issues before proceeding"
    echo "   1. Address issues listed above"
    echo "   2. Re-run health check"
    echo "   3. Proceed when health ≥80%"
fi

echo ""
echo "Health check completed at $(date)"
exit $((CHECKS_TOTAL - CHECKS_PASSED))