# Quick Reference - Basarometer V5

## File Locations After Organization

### System Tools
- Database files: `system/database/`
- Scripts: `system/scripts/`  
- Analysis tools: `system/tools/`
- Reports: `system/reports/`

### Main Commands
```bash
# Development
npm run dev

# Analysis
node system/tools/analyze_current_products.js

# Deployment  
bash system/scripts/deploy_to_production.sh
```

### Key Directories
- `src/` - Main application
- `v3/` - Previous version (786MB)
- `scan bot/` - Scanning automation (275MB)
- `docs/` - Documentation (29 files)

### Emergency Backup
Location: `../basarometer_v5_pre_organization_20250725_1614.tar.gz`