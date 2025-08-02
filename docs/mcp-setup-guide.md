# 🚀 Basarometer V6.0 MCP Setup Guide

## Quick Setup Instructions

### 1. Environment Variables Setup

Add these environment variables to your shell profile:

```bash
# Add to ~/.bashrc or ~/.zshrc
source /Users/yogi/Desktop/basarometer/v5/.env.mcp

# Or manually export:
export GITHUB_PERSONAL_ACCESS_TOKEN="your_github_token_here"
export BRAVE_API_KEY="your_brave_search_api_key_here"
```

### 2. Install Global MCP Servers

```bash
# Install required MCP servers globally
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-sqlite  
npm install -g @modelcontextprotocol/server-memory
npm install -g @modelcontextprotocol/server-brave-search
```

### 3. Verify MCP Configuration

Your MCP configuration has been added to `~/.claude.json`. Restart Claude Code to apply:

```bash
# Test MCP server functionality
claude
/mcp list
```

### 4. Test Basarometer Integration

```bash
# Test the specialized Basarometer filesystem server
cd /Users/yogi/Desktop/basarometer/v5/mcp
npm install
node basarometer-filesystem-server.js --test
```

## MCP Servers Configured

### 1. **basarometer-filesystem**
- **Purpose**: Safe access to project files with Hebrew processing
- **Protects**: meat_names_mapping.json and other critical assets
- **Capabilities**: Project analysis, file reading, directory scanning

### 2. **github-management** 
- **Purpose**: Dual repository management (website + bots)
- **Requires**: GitHub Personal Access Token
- **Capabilities**: Repository status, commits, pull requests

### 3. **puppeteer-scraping**
- **Purpose**: Hebrew text extraction from Israeli retailers  
- **Specialized**: Hebrew processing, Israeli website patterns
- **Capabilities**: Product extraction, price analysis, stealth scraping

### 4. **sqlite-analytics**
- **Purpose**: Database analysis and reporting
- **Database**: `/Users/yogi/Desktop/basarometer/v5/analytics.db`
- **Capabilities**: Query execution, data analysis, performance metrics

### 5. **memory-sessions**
- **Purpose**: Persistent project context retention
- **Storage**: `/Users/yogi/Desktop/basarometer/v5/.mcp-memory`
- **Capabilities**: Session memory, context preservation

### 6. **brave-research**
- **Purpose**: Market research and competitor analysis
- **Requires**: Brave Search API Key (free tier available)
- **Capabilities**: Israeli market intelligence, vendor discovery

## Getting API Keys

### GitHub Personal Access Token
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `read:org`, `read:user`
4. Copy token and add to environment variables

### Brave Search API Key  
1. Visit https://api.search.brave.com/app/keys
2. Sign up for free account
3. Create API key (2000 queries/month free)
4. Copy key and add to environment variables

## Security Features

### Protected Assets
- ✅ **meat_names_mapping.json**: Read-only access (1,248 Hebrew/English terms)
- ✅ **meat-sites.json**: Protected configuration file  
- ✅ **.env files**: Excluded from MCP access
- ✅ **System directories**: v3/node_modules, scan bot/node_modules

### Access Controls
- 🛡️ **Directory restrictions**: Only access within basarometer project
- 🛡️ **Read-only mode**: Critical assets cannot be modified
- 🛡️ **Credential protection**: Environment variables secured
- 🛡️ **Audit trail**: All MCP operations logged

## Troubleshooting

### MCP Servers Not Appearing
```bash
# Check Claude configuration
cat ~/.claude.json | grep -A 5 "mcpServers"

# Restart Claude Code
pkill -f claude && claude
```

### Permission Errors
```bash
# Fix file permissions
chmod +x /Users/yogi/Desktop/basarometer/v5/mcp/*.js

# Check environment variables
echo $BASAROMETER_ROOT
echo $GITHUB_PERSONAL_ACCESS_TOKEN
```

### Missing Dependencies
```bash
# Install MCP SDK locally
cd /Users/yogi/Desktop/basarometer/v5/mcp
npm install @modelcontextprotocol/sdk
```

## Advanced Usage

### Custom Basarometer Commands
```bash
# In Claude Code, you can now use:
"Analyze meat_names_mapping.json structure"
"Check critical asset integrity" 
"Scan scan bot directory safely"
"Extract Hebrew products from [URL]"
"Validate meat extraction results"
```

### GitHub Integration
```bash
# Repository management:
"Check both Basarometer repositories for changes"
"Create pull request for V6.0 features"  
"Analyze commit history for insights"
```

### Market Research
```bash
# Israeli market intelligence:
"Research Israeli meat delivery services"
"Find competitor pricing strategies"
"Analyze market trends for beef products"
```

## Success Validation

Once setup is complete, you should see:

✅ **6 MCP servers** listed in `/mcp list`  
✅ **Project understanding** of Basarometer architecture  
✅ **Protected assets** accessible but read-only  
✅ **Hebrew processing** capabilities active  
✅ **GitHub integration** functional  
✅ **Market research** tools available

This MCP configuration transforms Claude Code into a specialized AI assistant that fully understands the Basarometer V6.0 project architecture, respects security constraints, and provides advanced capabilities for Israeli meat market intelligence development.

---

**Status**: ✅ MCP Configuration Complete - Ready for Enhanced Development