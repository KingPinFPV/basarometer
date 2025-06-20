#!/bin/bash

# 🏪 Yohananof Integration Test Script
# Quick test script specifically for Yohananof kosher supermarket
# Usage: ./scripts/test-yohananof.sh [quick|full]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="/Users/yogi/Desktop/basarometer/scan bot"
CONFIG_FILE="$PROJECT_ROOT/config/meat-sites.json"
SCANNER_FILE="$PROJECT_ROOT/basarometer-scanner.js"
SITE_NAME="yohananof"
SITE_URL="https://www.yohananof.co.il"

# Test mode (quick or full)
TEST_MODE="${1:-quick}"

echo "🏪 Yohananof Integration Test"
echo "============================="
echo "📅 $(date)"
echo "🎯 Target: $SITE_URL"
echo "🔬 Mode: $TEST_MODE"
echo ""

# Function to check status with emoji
check_status() {
    local description="$1"
    local command="$2"
    
    echo -n "🔍 $description... "
    
    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

echo "📋 PRE-FLIGHT CHECKS"
echo "===================="

# Check if configuration file exists
if ! check_status "Configuration file exists" "test -f '$CONFIG_FILE'"; then
    echo -e "${RED}❌ Fatal: Configuration file missing${NC}"
    echo "Run: touch '$CONFIG_FILE' && echo '{}' > '$CONFIG_FILE'"
    exit 1
fi

# Check if scanner exists
if ! check_status "Scanner file exists" "test -f '$SCANNER_FILE'"; then
    echo -e "${RED}❌ Fatal: Scanner file missing${NC}"
    exit 1
fi

# Check Node.js
check_status "Node.js available" "command -v node"

echo ""
echo "🏪 YOHANANOF CONFIGURATION CHECK"
echo "================================"

# Check if Yohananof is already configured
YOHANANOF_EXISTS=false
if [[ -f "$CONFIG_FILE" ]]; then
    if grep -q "yohananof" "$CONFIG_FILE" 2>/dev/null; then
        echo -e "📋 Configuration: ${GREEN}✅ EXISTS${NC}"
        YOHANANOF_EXISTS=true
        
        # Show current configuration
        echo "Current Yohananof config:"
        python3 -c "
import json
try:
    with open('$CONFIG_FILE', 'r') as f:
        config = json.load(f)
    if 'yohananof' in config:
        yohananof_config = config['yohananof']
        print(f'   🌐 Base URL: {yohananof_config.get(\"baseUrl\", \"Not set\")}')
        print(f'   ⏱️  Wait Time: {yohananof_config.get(\"waitTime\", \"Not set\")}ms')
        print(f'   📄 Max Pages: {yohananof_config.get(\"maxPages\", \"Not set\")}')
        print(f'   🎯 Confidence: {yohananof_config.get(\"confidence\", \"Not set\")}')
    else:
        print('   ❌ Yohananof config not found')
except Exception as e:
    print(f'   ❌ Error reading config: {e}')
" 2>/dev/null || echo "   ❌ Unable to read configuration"
    else
        echo -e "📋 Configuration: ${YELLOW}⚠️ NOT FOUND${NC}"
    fi
else
    echo -e "📋 Configuration: ${RED}❌ CONFIG FILE MISSING${NC}"
fi

echo ""
echo "🔬 LIVE YOHANANOF TEST"
echo "======================"

if [[ "$TEST_MODE" == "quick" ]]; then
    echo "🚀 Running quick test (1 page, 30 second timeout)..."
    TEST_COMMAND="cd '$PROJECT_ROOT' && timeout 30s node '$SCANNER_FILE' --test --site yohananof --debug --quick --max-pages 1"
else
    echo "🚀 Running full test (all pages, 120 second timeout)..."
    TEST_COMMAND="cd '$PROJECT_ROOT' && timeout 120s node '$SCANNER_FILE' --test --site yohananof --debug"
fi

# Create log file for this test
LOG_FILE="/tmp/yohananof_test_$(date +%s).log"
echo "📝 Test log: $LOG_FILE"
echo ""

# Run the test
echo "⏳ Testing Yohananof website..."
echo "Command: $TEST_COMMAND"
echo ""

START_TIME=$(date +%s)
eval "$TEST_COMMAND" > "$LOG_FILE" 2>&1
TEST_EXIT_CODE=$?
END_TIME=$(date +%s)
TEST_DURATION=$((END_TIME - START_TIME))

echo ""
echo "📊 TEST RESULTS ANALYSIS"
echo "========================"

# Analyze the test results
if [[ $TEST_EXIT_CODE -eq 0 ]]; then
    echo -e "🎯 Test Status: ${GREEN}✅ SUCCESS${NC}"
elif [[ $TEST_EXIT_CODE -eq 124 ]]; then
    echo -e "🎯 Test Status: ${YELLOW}⏰ TIMEOUT${NC}"
else
    echo -e "🎯 Test Status: ${RED}❌ FAILED${NC}"
fi

echo "⏱️ Duration: ${TEST_DURATION}s"

# Parse results from log
PRODUCTS_FOUND=0
MEAT_PRODUCTS=0
CONFIDENCE_SCORE="N/A"
ERROR_COUNT=0

if [[ -f "$LOG_FILE" ]]; then
    # Extract key metrics
    PRODUCTS_FOUND=$(grep -o "נמצאו [0-9]\+ מוצרי בשר" "$LOG_FILE" | grep -o "[0-9]\+" | tail -1)
    [[ -z "$PRODUCTS_FOUND" ]] && PRODUCTS_FOUND=0
    
    # Count total products processed
    TOTAL_PRODUCTS=$(grep -c "מוצר:" "$LOG_FILE" 2>/dev/null || echo "0")
    
    # Look for confidence scores
    CONFIDENCE_SCORE=$(grep -o "confidence: [0-9.]\+" "$LOG_FILE" | grep -o "[0-9.]\+" | tail -1)
    [[ -z "$CONFIDENCE_SCORE" ]] && CONFIDENCE_SCORE="N/A"
    
    # Count errors
    ERROR_COUNT=$(grep -c "שגיאה\|Error\|ERROR" "$LOG_FILE" 2>/dev/null || echo "0")
    
    echo "📦 Products Found: $PRODUCTS_FOUND meat products"
    echo "📊 Total Processed: $TOTAL_PRODUCTS items"
    echo "🎯 Confidence Score: $CONFIDENCE_SCORE"
    echo "⚠️ Errors: $ERROR_COUNT"
    
    # Show sample products if found
    if [[ $PRODUCTS_FOUND -gt 0 ]]; then
        echo ""
        echo "🥩 SAMPLE PRODUCTS FOUND:"
        echo "========================"
        grep "מוצר:" "$LOG_FILE" | head -5 | while read line; do
            echo "   • $line"
        done
        [[ $PRODUCTS_FOUND -gt 5 ]] && echo "   ... and $((PRODUCTS_FOUND - 5)) more"
    fi
    
    # Show any errors
    if [[ $ERROR_COUNT -gt 0 ]]; then
        echo ""
        echo "⚠️ ERRORS DETECTED:"
        echo "=================="
        grep -i "שגיאה\|Error\|ERROR" "$LOG_FILE" | head -3 | while read line; do
            echo -e "   ${RED}❌${NC} $line"
        done
        [[ $ERROR_COUNT -gt 3 ]] && echo "   ... and $((ERROR_COUNT - 3)) more errors in log"
    fi
fi

echo ""
echo "💡 RECOMMENDATIONS"
echo "=================="

# Provide recommendations based on results
if [[ $PRODUCTS_FOUND -ge 20 ]]; then
    echo -e "${GREEN}✅ Excellent results! Yohananof is working well.${NC}"
    echo "• Configuration is optimal"
    echo "• Ready for production scanning"
    echo "• Consider increasing maxPages for more products"
elif [[ $PRODUCTS_FOUND -ge 10 ]]; then
    echo -e "${YELLOW}🟡 Good results, but room for improvement.${NC}"
    echo "• Try adjusting wait times"
    echo "• Check selector accuracy"
    echo "• Consider different category URLs"
elif [[ $PRODUCTS_FOUND -ge 1 ]]; then
    echo -e "${YELLOW}🟠 Partial success - needs optimization.${NC}"
    echo "• Selectors may need adjustment"
    echo "• Check wait times and page load"
    echo "• Verify category URLs are correct"
else
    echo -e "${RED}🔴 No products found - needs fixing.${NC}"
    if [[ ! $YOHANANOF_EXISTS ]]; then
        echo "• Add Yohananof configuration first"
        echo "• Use: ./scripts/add-site-template.sh yohananof https://www.yohananof.co.il"
    else
        echo "• Check selectors in configuration"
        echo "• Verify website accessibility"
        echo "• Update category URLs"
    fi
fi

echo ""
echo "🛠️ NEXT STEPS"
echo "============="

if [[ $PRODUCTS_FOUND -ge 15 ]]; then
    echo "✅ Yohananof is working well!"
    echo "1. Add to regular scanning rotation"
    echo "2. Monitor performance over time"
    echo "3. Consider expanding to more categories"
elif [[ $PRODUCTS_FOUND -ge 5 ]]; then
    echo "🔧 Optimize Yohananof configuration:"
    echo "1. Adjust selectors for better accuracy"
    echo "2. Fine-tune wait times"
    echo "3. Re-test with: ./scripts/test-yohananof.sh"
else
    echo "🚨 Fix Yohananof configuration:"
    if [[ ! $YOHANANOF_EXISTS ]]; then
        echo "1. Add configuration: ./scripts/add-site-template.sh yohananof https://www.yohananof.co.il"
    else
        echo "1. Review and update selectors"
        echo "2. Check website structure changes"
    fi
    echo "2. Test connectivity: curl -I https://www.yohananof.co.il"
    echo "3. Re-test with: ./scripts/test-yohananof.sh"
fi

echo ""
echo "📋 TEST SUMMARY"
echo "==============="
echo "🏪 Site: Yohananof (kosher supermarket)"
echo "🌐 URL: $SITE_URL"
echo "⏱️ Duration: ${TEST_DURATION}s"
echo "📦 Products: $PRODUCTS_FOUND found"
echo "🎯 Confidence: $CONFIDENCE_SCORE"
echo "📝 Log: $LOG_FILE"

# Overall test status
if [[ $PRODUCTS_FOUND -ge 15 ]]; then
    echo -e "🏆 Overall: ${GREEN}EXCELLENT - Ready for production${NC}"
    exit 0
elif [[ $PRODUCTS_FOUND -ge 5 ]]; then
    echo -e "🏆 Overall: ${YELLOW}GOOD - Needs optimization${NC}"
    exit 0
else
    echo -e "🏆 Overall: ${RED}NEEDS WORK - Requires fixes${NC}"
    exit 1
fi