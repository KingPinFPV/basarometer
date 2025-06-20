#!/bin/bash

# 💾 Basarometer Configuration Backup Utility
# Create timestamped backups of critical configuration files
# Usage: ./scripts/backup-config.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="/Users/yogi/Desktop/basarometer/scan bot"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Files to backup
CONFIG_FILE="$PROJECT_ROOT/config/meat-sites.json"
MCP_SERVER="$PROJECT_ROOT/mcp/basarometer-mcp-server.js"
CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
PACKAGE_JSON="$PROJECT_ROOT/package.json"

echo "💾 Basarometer Configuration Backup"
echo "===================================="
echo "📅 $(date)"
echo "🏷️ Backup ID: $TIMESTAMP"
echo ""

# Create backup directory structure
echo "📁 CREATING BACKUP STRUCTURE"
echo "============================="

BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"
mkdir -p "$BACKUP_PATH/config"
mkdir -p "$BACKUP_PATH/mcp"
mkdir -p "$BACKUP_PATH/claude"
mkdir -p "$BACKUP_PATH/project"

echo -e "📂 Backup location: ${BLUE}$BACKUP_PATH${NC}"
echo ""

# Function to backup a file
backup_file() {
    local source_file="$1"
    local dest_dir="$2"
    local description="$3"
    
    echo -n "💾 Backing up $description... "
    
    if [[ -f "$source_file" ]]; then
        local filename=$(basename "$source_file")
        cp "$source_file" "$dest_dir/$filename"
        
        if [[ $? -eq 0 ]]; then
            local size=$(du -h "$source_file" | cut -f1)
            echo -e "${GREEN}✅ SUCCESS${NC} ($size)"
            return 0
        else
            echo -e "${RED}❌ FAILED${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️ NOT FOUND${NC}"
        return 1
    fi
}

echo "💾 BACKING UP FILES"
echo "==================="

BACKUP_COUNT=0
TOTAL_FILES=5

# Backup main configuration
if backup_file "$CONFIG_FILE" "$BACKUP_PATH/config" "Meat Sites Configuration"; then
    BACKUP_COUNT=$((BACKUP_COUNT + 1))
fi

# Backup MCP server
if backup_file "$MCP_SERVER" "$BACKUP_PATH/mcp" "MCP Server"; then
    BACKUP_COUNT=$((BACKUP_COUNT + 1))
fi

# Backup Claude Desktop config
if backup_file "$CLAUDE_CONFIG" "$BACKUP_PATH/claude" "Claude Desktop Config"; then
    BACKUP_COUNT=$((BACKUP_COUNT + 1))
fi

# Backup package.json
if backup_file "$PACKAGE_JSON" "$BACKUP_PATH/project" "Package Dependencies"; then
    BACKUP_COUNT=$((BACKUP_COUNT + 1))
fi

# Backup enhanced learning configs if they exist
ENHANCED_CONFIGS=(
    "$PROJECT_ROOT/config/enhanced_meat_mapping.json"
    "$PROJECT_ROOT/config/grade_keywords.json"
    "$PROJECT_ROOT/config/cut_hierarchy.json"
    "$PROJECT_ROOT/config/learning_log.json"
)

echo ""
echo "🧠 ENHANCED SYSTEM CONFIGS"
echo "=========================="

for config_file in "${ENHANCED_CONFIGS[@]}"; do
    if [[ -f "$config_file" ]]; then
        filename=$(basename "$config_file")
        description="Enhanced Config: $filename"
        if backup_file "$config_file" "$BACKUP_PATH/config" "$description"; then
            BACKUP_COUNT=$((BACKUP_COUNT + 1))
        fi
        TOTAL_FILES=$((TOTAL_FILES + 1))
    fi
done

echo ""
echo "📊 CREATING BACKUP MANIFEST"
echo "============================"

# Create backup manifest
MANIFEST_FILE="$BACKUP_PATH/BACKUP_MANIFEST.txt"
cat > "$MANIFEST_FILE" << EOF
BASAROMETER CONFIGURATION BACKUP
================================
Backup ID: $TIMESTAMP
Created: $(date)
Location: $BACKUP_PATH

FILES BACKED UP:
===============
EOF

# List all backed up files with sizes
find "$BACKUP_PATH" -type f ! -name "BACKUP_MANIFEST.txt" | while read file; do
    relative_path=${file#$BACKUP_PATH/}
    size=$(du -h "$file" | cut -f1)
    echo "$relative_path ($size)" >> "$MANIFEST_FILE"
done

echo "" >> "$MANIFEST_FILE"
echo "BACKUP STATISTICS:" >> "$MANIFEST_FILE"
echo "==================" >> "$MANIFEST_FILE"
echo "Files backed up: $BACKUP_COUNT/$TOTAL_FILES" >> "$MANIFEST_FILE"
echo "Total backup size: $(du -sh "$BACKUP_PATH" | cut -f1)" >> "$MANIFEST_FILE"

echo -e "📄 Manifest created: ${GREEN}✅ SUCCESS${NC}"

echo ""
echo "🗂️ BACKUP HISTORY"
echo "=================="

# Show recent backups
echo "Recent backups:"
ls -lt "$BACKUP_DIR" 2>/dev/null | head -6 | tail -5 | while read line; do
    backup_name=$(echo "$line" | awk '{print $9}')
    backup_date=$(echo "$line" | awk '{print $6, $7, $8}')
    if [[ -n "$backup_name" && "$backup_name" != "." ]]; then
        if [[ "$backup_name" == "$TIMESTAMP" ]]; then
            echo -e "   ${GREEN}➤ $backup_name${NC} (current) - $backup_date"
        else
            echo "   • $backup_name - $backup_date"
        fi
    fi
done

# Count total backups
TOTAL_BACKUPS=$(ls -1 "$BACKUP_DIR" 2>/dev/null | wc -l)
echo ""
echo "📈 Total backups: $TOTAL_BACKUPS"

# Check backup size and warn if getting large
BACKUP_SIZE=$(du -sm "$BACKUP_DIR" 2>/dev/null | cut -f1)
if [[ $BACKUP_SIZE -gt 100 ]]; then
    echo -e "${YELLOW}⚠️ Backup directory is ${BACKUP_SIZE}MB - consider cleanup${NC}"
fi

echo ""
echo "📋 BACKUP SUMMARY"
echo "=================="
echo "🏷️ Backup ID: $TIMESTAMP"
echo "📁 Location: $BACKUP_PATH"
echo "💾 Files backed up: $BACKUP_COUNT/$TOTAL_FILES"
echo "📊 Backup size: $(du -sh "$BACKUP_PATH" | cut -f1)"

if [[ $BACKUP_COUNT -eq $TOTAL_FILES ]]; then
    echo -e "✅ Status: ${GREEN}COMPLETE - All files backed up successfully${NC}"
elif [[ $BACKUP_COUNT -gt 0 ]]; then
    echo -e "⚠️ Status: ${YELLOW}PARTIAL - Some files were missing${NC}"
else
    echo -e "❌ Status: ${RED}FAILED - No files backed up${NC}"
    exit 1
fi

echo ""
echo "🔧 RESTORE INSTRUCTIONS"
echo "======================="
echo "To restore from this backup:"
echo "1. Navigate to backup: cd '$BACKUP_PATH'"
echo "2. Copy files back:"
echo "   cp config/* '$PROJECT_ROOT/config/'"
echo "   cp mcp/* '$PROJECT_ROOT/mcp/'"
echo "   cp claude/* '$HOME/Library/Application Support/Claude/'"
echo "3. Restart MCP: ./scripts/restart-mcp.sh"

echo ""
echo "🧹 CLEANUP RECOMMENDATIONS"
echo "=========================="
echo "• Keep last 10 backups: find '$BACKUP_DIR' -maxdepth 1 -type d | sort | head -n -10 | xargs rm -rf"
echo "• Remove backups older than 30 days: find '$BACKUP_DIR' -maxdepth 1 -type d -mtime +30 -exec rm -rf {} +"

echo ""
echo -e "${GREEN}💾 Backup completed successfully!${NC}"
echo "Backup ID: $TIMESTAMP"