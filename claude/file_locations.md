# File Location Reference - Post Organization

## System Directory
- **database/**: All SQL files, analytics.db
- **scripts/**: Deployment scripts (deploy_to_production.sh, deploy-eight-networks.js)
- **tools/**: Analysis tools, test scripts, documentation tools
- **reports/**: Integration reports, analysis results

## Root Files (Essential Only)
- package.json, package-lock.json
- tsconfig.json, next.config.js/ts
- eslint.config.mjs, next-env.d.ts

## Project Directories (Unchanged)
- v3/ - Previous Next.js version (786MB)
- scan bot/ - Scanning tool (275MB)
- test bot/ - Testing version (5.8MB)
- src/ - Main app source
- auth/ - Authentication
- mcp/ - Model Context Protocol
- docs/ - Documentation
- temp/ - Archives and backups

## Important Notes
- Test bot scripts may reference old paths - update if needed
- API endpoints hardcoded to v3.basarometer.org
- All git repositories preserved in original locations