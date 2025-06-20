#!/usr/bin/env node

/**
 * MCP Integration Script for Basarometer Scanner
 * Demonstrates how to use the MCP servers to enhance the existing scanner
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

class MCPIntegration {
  constructor() {
    this.mcpServers = {
      webAnalyzer: path.join(process.cwd(), 'mcp', 'servers', 'web-analyzer.js'),
      fileManager: path.join(process.cwd(), 'mcp', 'servers', 'file-manager.js'),
      siteMonitor: path.join(process.cwd(), 'mcp', 'servers', 'site-monitor.js')
    };
    
    this.activeProcesses = new Map();
  }

  async startMCPServer(serverName) {
    return new Promise((resolve, reject) => {
      const serverPath = this.mcpServers[serverName];
      if (!serverPath) {
        reject(new Error(`Unknown MCP server: ${serverName}`));
        return;
      }

      console.log(`🚀 Starting ${serverName} MCP Server...`);
      
      const process = spawn('node', [serverPath], {
        stdio: 'pipe'
      });

      let serverReady = false;

      process.stdout.on('data', (data) => {
        const message = data.toString();
        if (message.includes('MCP Server started')) {
          serverReady = true;
          console.log(`✅ ${serverName} is ready`);
          resolve(process);
        }
      });

      process.stderr.on('data', (data) => {
        console.error(`❌ ${serverName} error:`, data.toString());
      });

      process.on('close', (code) => {
        this.activeProcesses.delete(serverName);
        if (!serverReady) {
          reject(new Error(`${serverName} failed to start (exit code: ${code})`));
        }
      });

      // Store the process
      this.activeProcesses.set(serverName, process);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!serverReady) {
          process.kill();
          reject(new Error(`${serverName} startup timeout`));
        }
      }, 10000);
    });
  }

  async sendMCPRequest(serverName, toolName, args = {}) {
    const process = this.activeProcesses.get(serverName);
    if (!process) {
      throw new Error(`${serverName} is not running. Start it first.`);
    }

    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      };

      let response = '';
      
      const onData = (data) => {
        response += data.toString();
        try {
          const parsed = JSON.parse(response);
          if (parsed.id === request.id) {
            process.stdout.off('data', onData);
            resolve(parsed.result);
          }
        } catch (error) {
          // Still accumulating response
        }
      };

      process.stdout.on('data', onData);
      
      process.stdin.write(JSON.stringify(request) + '\n');

      // Timeout after 60 seconds
      setTimeout(() => {
        process.stdout.off('data', onData);
        reject(new Error(`Request timeout for ${toolName}`));
      }, 60000);
    });
  }

  async stopAllServers() {
    console.log('🛑 Stopping all MCP servers...');
    for (const [name, process] of this.activeProcesses) {
      try {
        process.kill();
        console.log(`✅ Stopped ${name}`);
      } catch (error) {
        console.error(`❌ Error stopping ${name}:`, error.message);
      }
    }
    this.activeProcesses.clear();
  }

  // High-level workflow methods
  async addNewSite(siteName, siteUrl) {
    try {
      console.log(`\n🎯 Adding new site: ${siteName}`);
      console.log(`📍 URL: ${siteUrl}\n`);

      // Step 1: Start web analyzer
      await this.startMCPServer('webAnalyzer');
      
      // Step 2: Analyze site structure
      console.log('🔍 Analyzing site structure...');
      const analysis = await this.sendMCPRequest('webAnalyzer', 'analyze_site_structure', {
        url: siteUrl
      });
      
      console.log('✅ Site structure analyzed');

      // Step 3: Extract selectors (if it's Shufersal, use dedicated tool)
      let selectorAnalysis;
      if (siteName.toLowerCase().includes('shufersal')) {
        console.log('🛒 Running specialized Shufersal analysis...');
        selectorAnalysis = await this.sendMCPRequest('webAnalyzer', 'analyze_shufersal', {
          deep_analysis: true,
          target_products: 50
        });
      } else {
        console.log('🔧 Extracting general selectors...');
        selectorAnalysis = await this.sendMCPRequest('webAnalyzer', 'extract_selectors', {
          url: siteUrl,
          category: 'meat'
        });
      }

      console.log('✅ Selectors extracted');

      // Step 4: Start file manager and create config
      await this.startMCPServer('fileManager');
      
      if (siteName.toLowerCase().includes('shufersal')) {
        console.log('📝 Creating Shufersal configuration...');
        const configResult = await this.sendMCPRequest('fileManager', 'create_shufersal_config');
        console.log('✅ Shufersal configuration created');
        
        // Step 5: Update documentation
        console.log('📚 Updating project documentation...');
        await this.sendMCPRequest('fileManager', 'update_documentation', {
          sections: ['status', 'config']
        });
        console.log('✅ Documentation updated');
      }

      // Step 6: Validate configuration
      console.log('🔍 Validating configuration...');
      const validation = await this.sendMCPRequest('fileManager', 'validate_config', {
        site_name: siteName.toLowerCase()
      });
      
      console.log('✅ Configuration validated');

      // Step 7: Test site health
      await this.startMCPServer('siteMonitor');
      console.log('🏥 Testing site health...');
      const healthCheck = await this.sendMCPRequest('siteMonitor', 'test_site_health', {
        site_name: siteName.toLowerCase()
      });
      
      console.log('✅ Health check completed');

      return {
        success: true,
        siteName,
        analysis: selectorAnalysis,
        validation,
        healthCheck
      };

    } catch (error) {
      console.error(`❌ Failed to add site ${siteName}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      await this.stopAllServers();
    }
  }

  async performSystemHealthCheck() {
    try {
      console.log('\n🏥 Performing system-wide health check...\n');

      // Start monitoring server
      await this.startMCPServer('siteMonitor');
      
      // Check all sites
      console.log('🔍 Checking all configured sites...');
      const healthResults = await this.sendMCPRequest('siteMonitor', 'health_check_all');
      
      console.log('✅ System health check completed');

      // Start file manager for reporting
      await this.startMCPServer('fileManager');
      
      // Generate status report
      console.log('📊 Generating status report...');
      const statusReport = await this.sendMCPRequest('fileManager', 'generate_status_report');
      
      console.log('✅ Status report generated');

      return {
        success: true,
        health: healthResults,
        status: statusReport
      };

    } catch (error) {
      console.error('❌ System health check failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      await this.stopAllServers();
    }
  }

  async fixBrokenSite(siteName) {
    try {
      console.log(`\n🔧 Fixing broken site: ${siteName}\n`);

      // Start web analyzer
      await this.startMCPServer('webAnalyzer');
      
      if (siteName.toLowerCase().includes('carrefour')) {
        console.log('🛠️ Running Carrefour fix analysis...');
        const fixResult = await this.sendMCPRequest('webAnalyzer', 'fix_carrefour');
        console.log('✅ Carrefour fix analysis completed');
        return fixResult;
      } else {
        // Generic site analysis
        console.log('🔍 Analyzing site for issues...');
        await this.startMCPServer('siteMonitor');
        const changeAnalysis = await this.sendMCPRequest('siteMonitor', 'monitor_site_changes', {
          site_name: siteName
        });
        console.log('✅ Change analysis completed');
        return changeAnalysis;
      }

    } catch (error) {
      console.error(`❌ Failed to fix site ${siteName}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      await this.stopAllServers();
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const integration = new MCPIntegration();

  try {
    switch (command) {
      case 'add-shufersal':
        console.log('🎯 Mission: Add Shufersal to Basarometer Scanner');
        const shufersalResult = await integration.addNewSite('shufersal', 'https://www.shufersal.co.il');
        console.log('\n📊 Shufersal Addition Result:', shufersalResult.success ? '✅ SUCCESS' : '❌ FAILED');
        break;

      case 'fix-carrefour':
        console.log('🔧 Mission: Fix broken Carrefour selectors');
        const carrefourResult = await integration.fixBrokenSite('carrefour');
        console.log('\n📊 Carrefour Fix Result:', carrefourResult.success !== false ? '✅ ANALYZED' : '❌ FAILED');
        break;

      case 'health-check':
        console.log('🏥 Mission: System-wide health check');
        const healthResult = await integration.performSystemHealthCheck();
        console.log('\n📊 Health Check Result:', healthResult.success ? '✅ HEALTHY' : '❌ ISSUES FOUND');
        break;

      case 'demo':
        console.log('🚀 MCP Integration Demo');
        console.log('\nAvailable commands:');
        console.log('  add-shufersal  - Add Shufersal site with full analysis');
        console.log('  fix-carrefour  - Fix broken Carrefour selectors'); 
        console.log('  health-check   - Perform system health check');
        console.log('  demo          - Show this help');
        console.log('\nExample usage:');
        console.log('  node mcp-integration.js add-shufersal');
        console.log('  node mcp-integration.js health-check');
        break;

      default:
        console.log('🤖 MCP Integration System Ready');
        console.log('\nUsage: node mcp-integration.js <command>');
        console.log('\nCommands:');
        console.log('  add-shufersal  - Add Shufersal with full analysis');
        console.log('  fix-carrefour  - Fix Carrefour selectors');
        console.log('  health-check   - System health check');
        console.log('  demo          - Show examples');
        console.log('\n🎯 Ready to transform 1 working site into 3+ sites!');
        break;
    }
  } catch (error) {
    console.error('❌ Integration failed:', error.message);
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down MCP Integration...');
  process.exit(0);
});

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default MCPIntegration;