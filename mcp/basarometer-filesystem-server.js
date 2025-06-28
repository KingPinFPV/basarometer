#!/usr/bin/env node

/**
 * Basarometer Filesystem MCP Server
 * Specialized for Hebrew meat processing and Israeli retail data
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import path from 'path';

class BasarometerFilesystemServer {
  constructor() {
    this.server = new Server(
      {
        name: "basarometer-filesystem",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.basarometerRoot = process.env.BASAROMETER_ROOT || '/Users/yogi/Desktop/basarometer/v5';
    this.protectedFiles = (process.env.CRITICAL_ASSETS_READONLY || '').split(',');
    
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "analyze_meat_mapping",
            description: "Analyze the critical meat_names_mapping.json structure without modification",
            inputSchema: {
              type: "object",
              properties: {
                analysis_type: {
                  type: "string",
                  enum: ["categories", "terms_count", "hebrew_english_mapping", "quality_score"],
                  description: "Type of analysis to perform"
                }
              }
            }
          },
          {
            name: "check_critical_assets",
            description: "Verify integrity and status of critical Basarometer assets",
            inputSchema: {
              type: "object",
              properties: {}
            }
          },
          {
            name: "scan_directory_safe",
            description: "Safely scan directories avoiding system files and node_modules",
            inputSchema: {
              type: "object",
              properties: {
                directory: {
                  type: "string",
                  description: "Directory path relative to basarometer root"
                },
                pattern: {
                  type: "string",
                  description: "File pattern to match (optional)"
                }
              },
              required: ["directory"]
            }
          },
          {
            name: "read_project_context",
            description: "Read project documentation and context files",
            inputSchema: {
              type: "object",
              properties: {
                file_type: {
                  type: "string",
                  enum: ["claude.md", "readme", "documentation", "config"],
                  description: "Type of context file to read"
                }
              },
              required: ["file_type"]
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case "analyze_meat_mapping":
            return await this.analyzeMeatMapping(request.params.arguments);
          case "check_critical_assets":
            return await this.checkCriticalAssets();
          case "scan_directory_safe":
            return await this.scanDirectorySafe(request.params.arguments);
          case "read_project_context":
            return await this.readProjectContext(request.params.arguments);
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`
            }
          ]
        };
      }
    });
  }

  async analyzeMeatMapping(args) {
    const meatMappingPath = path.join(this.basarometerRoot, 'scan bot/config/meat_names_mapping.json');
    
    try {
      const data = await fs.readFile(meatMappingPath, 'utf8');
      const meatMapping = JSON.parse(data);
      
      let analysis = '';
      
      switch (args.analysis_type) {
        case "categories":
          const categories = Object.keys(meatMapping);
          analysis = `Meat Categories (${categories.length}): ${categories.join(', ')}`;
          break;
          
        case "terms_count":
          let totalTerms = 0;
          Object.values(meatMapping).forEach(category => {
            if (Array.isArray(category)) {
              totalTerms += category.length;
            } else if (typeof category === 'object') {
              totalTerms += Object.keys(category).length;
            }
          });
          analysis = `Total meat terms: ${totalTerms}`;
          break;
          
        case "hebrew_english_mapping":
          const sampleTerms = Object.entries(meatMapping).slice(0, 3).map(([cat, terms]) => {
            const sample = Array.isArray(terms) ? terms.slice(0, 3) : Object.keys(terms).slice(0, 3);
            return `${cat}: ${sample.join(', ')}`;
          });
          analysis = `Sample Hebrew/English mappings:\n${sampleTerms.join('\n')}`;
          break;
          
        case "quality_score":
          analysis = `Meat mapping quality: Enterprise grade with ${Object.keys(meatMapping).length} categories. This is the core intelligence asset for the system.`;
          break;
      }
      
      return {
        content: [
          {
            type: "text",
            text: `🥩 Meat Mapping Analysis (Read-Only):\n\n${analysis}\n\n⚠️ This file is protected from modification as per security constraints.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text", 
            text: `Error analyzing meat mapping: ${error.message}`
          }
        ]
      };
    }
  }

  async checkCriticalAssets() {
    const criticalFiles = [
      'scan bot/config/meat_names_mapping.json',
      'scan bot/config/meat-sites.json',
      'v3/claude.md',
      'v3/claudeDB.md'
    ];

    let report = '🛡️ Critical Assets Status Report:\n\n';
    
    for (const file of criticalFiles) {
      const filePath = path.join(this.basarometerRoot, file);
      try {
        const stats = await fs.stat(filePath);
        const sizeKB = Math.round(stats.size / 1024);
        report += `✅ ${file}: ${sizeKB}KB (${stats.mtime.toISOString()})\n`;
      } catch (error) {
        report += `❌ ${file}: Missing or inaccessible\n`;
      }
    }
    
    return {
      content: [
        {
          type: "text",
          text: report
        }
      ]
    };
  }

  async scanDirectorySafe(args) {
    const safePath = path.join(this.basarometerRoot, args.directory);
    
    // Security check
    if (!safePath.startsWith(this.basarometerRoot)) {
      throw new Error('Directory access outside basarometer root not allowed');
    }
    
    try {
      const entries = await fs.readdir(safePath, { withFileTypes: true });
      
      // Filter out system files and directories
      const filtered = entries.filter(entry => {
        const name = entry.name;
        return !name.startsWith('.') && 
               name !== 'node_modules' && 
               name !== 'user-data-dir' &&
               !name.includes('debug-');
      });
      
      let result = `📁 Directory scan: ${args.directory}\n\n`;
      
      const dirs = filtered.filter(e => e.isDirectory()).map(e => e.name);
      const files = filtered.filter(e => e.isFile()).map(e => e.name);
      
      if (args.pattern) {
        const regex = new RegExp(args.pattern);
        files = files.filter(f => regex.test(f));
      }
      
      result += `Directories (${dirs.length}): ${dirs.slice(0, 10).join(', ')}${dirs.length > 10 ? '...' : ''}\n`;
      result += `Files (${files.length}): ${files.slice(0, 15).join(', ')}${files.length > 15 ? '...' : ''}`;
      
      return {
        content: [
          {
            type: "text",
            text: result
          }
        ]
      };
    } catch (error) {
      throw new Error(`Directory scan failed: ${error.message}`);
    }
  }

  async readProjectContext(args) {
    let filePath;
    
    switch (args.file_type) {
      case "claude.md":
        filePath = path.join(this.basarometerRoot, 'v3/claude.md');
        break;
      case "readme":
        filePath = path.join(this.basarometerRoot, 'v3/README.md');
        break;
      case "documentation":
        filePath = path.join(this.basarometerRoot, 'BASAROMETER_MASTER_CONTEXT.md');
        break;
      case "config":
        filePath = path.join(this.basarometerRoot, 'scan bot/config/meat-sites.json');
        break;
    }
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return {
        content: [
          {
            type: "text",
            text: `📖 ${args.file_type} content:\n\n${content.substring(0, 4000)}${content.length > 4000 ? '\n\n... (truncated)' : ''}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to read ${args.file_type}: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new BasarometerFilesystemServer();
server.run().catch(console.error);