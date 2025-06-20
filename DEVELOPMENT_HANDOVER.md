# 🤝 Development Handover - Basarometer V5.2
*Prepared: June 20, 2025*

## 🎯 FOR NEW DEVELOPERS/ASSISTANTS:

### ESSENTIAL READING ORDER:
1. `BASAROMETER_MASTER_CONTEXT.md` - Complete project overview
2. `CURRENT_PROJECT_STATUS.md` - Current status and priorities  
3. `SECURITY_AUDIT_REPORT.md` - Security improvements made
4. `v3/README.md` - Technical implementation details
5. `scan bot/CLAUDE.md` - Scanner system documentation

### CRITICAL KNOWLEDGE:
- **Project**: Israeli food intelligence platform with real government data
- **Scale**: 41 products from 8 supermarket networks, targeting 1000+ daily
- **Technology**: Next.js 15, Supabase, TypeScript, Hebrew RTL support
- **Status**: Production-ready with recent security improvements
- **Security**: Credentials rotated June 20, 2025 - admin password still needs update

### IMMEDIATE TASKS:
1. Complete security: admin password + scanner API keys
2. Test application with new Supabase credentials  
3. Initialize Git repository safely
4. Scale scanner to 1000+ products daily

### DEVELOPMENT COMMANDS:
```bash
# Start session with full context
cd /Users/yogi/Desktop/basarometer/v5/v3/
claude
"Read ../BASAROMETER_MASTER_CONTEXT.md - Israeli food platform, production-ready, security improved, admin password needs update."

# Common tasks
"Complete the remaining security tasks: update admin password and scanner API keys"
"Test application with new Supabase credentials"
"Help scale scanner from 41 to 1000+ products daily"
"Initialize Git repository after security completion"
```

### PROTECTED FILES (NEVER MOVE/DELETE):
- `v3/src/` - Main application code
- `scan bot/config/meat-sites.json` - Network configurations  
- `v3/.env.local` - Environment variables (git-ignored)
- Core documentation: README.md, claude.md files in system directories