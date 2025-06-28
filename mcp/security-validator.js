#!/usr/bin/env node

/**
 * Basarometer MCP Security Validator
 * Ensures critical assets are protected from modification
 */

import { promises as fs } from 'fs';
import path from 'path';

class SecurityValidator {
  constructor() {
    this.basarometerRoot = process.env.BASAROMETER_ROOT || '/Users/yogi/Desktop/basarometer/v5';
    this.protectedFiles = [
      'scan bot/config/meat_names_mapping.json',
      'scan bot/meat_names_mapping.json', 
      'test bot/config/meat_names_mapping.json',
      'test bot/meat_names_mapping.json'
    ];
    this.protectedDirectories = [
      'v3/node_modules',
      'scan bot/node_modules',
      'test bot/node_modules',
      'scan bot/user-data-dir',
      'test bot/user-data-dir'
    ];
  }

  async validateFileAccess(filePath) {
    const normalizedPath = path.resolve(filePath);
    const basePath = path.resolve(this.basarometerRoot);
    
    // Security check: ensure path is within basarometer root
    if (!normalizedPath.startsWith(basePath)) {
      throw new Error('Security violation: Path outside basarometer root not allowed');
    }
    
    // Check if file is protected
    const relativePath = path.relative(basePath, normalizedPath);
    
    for (const protectedFile of this.protectedFiles) {
      if (relativePath === protectedFile || relativePath.endsWith(protectedFile)) {
        return {
          allowed: false,
          reason: 'Critical asset - read-only access only',
          file: protectedFile
        };
      }
    }
    
    // Check if in protected directory
    for (const protectedDir of this.protectedDirectories) {
      if (relativePath.startsWith(protectedDir)) {
        return {
          allowed: false,
          reason: 'System directory - read-only access only',
          directory: protectedDir
        };
      }
    }
    
    return { allowed: true };
  }

  async validateDirectoryAccess(dirPath) {
    const normalizedPath = path.resolve(dirPath);
    const basePath = path.resolve(this.basarometerRoot);
    
    // Security check: ensure path is within basarometer root
    if (!normalizedPath.startsWith(basePath)) {
      throw new Error('Security violation: Directory outside basarometer root not allowed');
    }
    
    const relativePath = path.relative(basePath, normalizedPath);
    
    // Check system directories
    const systemDirs = ['node_modules', 'user-data-dir', '.git', 'temp'];
    for (const sysDir of systemDirs) {
      if (relativePath.includes(sysDir)) {
        return {
          allowed: false,
          reason: `System directory (${sysDir}) - limited access`,
          directory: relativePath
        };
      }
    }
    
    return { allowed: true };
  }

  async auditCriticalAssets() {
    const report = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      assets: []
    };
    
    for (const assetPath of this.protectedFiles) {
      const fullPath = path.join(this.basarometerRoot, assetPath);
      
      try {
        const stats = await fs.stat(fullPath);
        const sizeKB = Math.round(stats.size / 1024);
        
        report.assets.push({
          path: assetPath,
          status: 'exists',
          size: `${sizeKB}KB`,
          modified: stats.mtime.toISOString(),
          protected: true
        });
      } catch (error) {
        report.assets.push({
          path: assetPath,
          status: 'missing',
          error: error.message,
          protected: true
        });
        report.status = 'warning';
      }
    }
    
    return report;
  }

  async checkMeatMappingIntegrity() {
    const meatMappingPath = path.join(this.basarometerRoot, 'scan bot/config/meat_names_mapping.json');
    
    try {
      const data = await fs.readFile(meatMappingPath, 'utf8');
      const meatMapping = JSON.parse(data);
      
      const categories = Object.keys(meatMapping);
      let totalTerms = 0;
      
      Object.values(meatMapping).forEach(category => {
        if (Array.isArray(category)) {
          totalTerms += category.length;
        } else if (typeof category === 'object') {
          totalTerms += Object.keys(category).length;
        }
      });
      
      return {
        status: 'healthy',
        categories: categories.length,
        totalTerms,
        integrity: 'verified',
        message: `Meat mapping contains ${categories.length} categories with ${totalTerms} Hebrew/English terms`
      };
    } catch (error) {
      return {
        status: 'error',
        integrity: 'failed',
        error: error.message
      };
    }
  }

  async generateSecurityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      basarometerRoot: this.basarometerRoot,
      security: {
        protectedFiles: this.protectedFiles.length,
        protectedDirectories: this.protectedDirectories.length,
        accessControlActive: true
      },
      audit: await this.auditCriticalAssets(),
      meatMapping: await this.checkMeatMappingIntegrity()
    };
    
    return report;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new SecurityValidator();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'audit':
      console.log('🔍 Auditing critical assets...');
      const audit = await validator.auditCriticalAssets();
      console.log(JSON.stringify(audit, null, 2));
      break;
      
    case 'check-meat-mapping':
      console.log('🥩 Checking meat mapping integrity...');
      const integrity = await validator.checkMeatMappingIntegrity();
      console.log(JSON.stringify(integrity, null, 2));
      break;
      
    case 'report':
      console.log('📊 Generating security report...');
      const report = await validator.generateSecurityReport();
      console.log(JSON.stringify(report, null, 2));
      break;
      
    default:
      console.log('🛡️  Basarometer Security Validator');
      console.log('Usage: node security-validator.js [audit|check-meat-mapping|report]');
      break;
  }
}

export default SecurityValidator;