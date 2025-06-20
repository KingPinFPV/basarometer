#!/usr/bin/env node

/**
 * Eight Network Validation Test
 * Tests all 8 networks to ensure proper integration
 * Part of the Tiv Taam integration mission
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔬 Eight Network Validation Test');
console.log('📅 Date:', new Date().toISOString());
console.log('🎯 Mission: Validate 8-network integration including Tiv Taam');

class EightNetworkValidator {
  constructor() {
    this.configPath = path.join(__dirname, 'config', 'meat-sites.json');
    this.results = {
      networks: [],
      summary: {
        total: 0,
        configured: 0,
        withGovernmentData: 0,
        highPriority: 0,
        expectedProducts: 0
      }
    };
  }

  async validateNetworks() {
    console.log('\n📊 Loading network configurations...');
    
    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      const networks = JSON.parse(configData);
      
      console.log(`✅ Loaded ${Object.keys(networks).length} network configurations`);
      
      for (const [networkId, config] of Object.entries(networks)) {
        await this.validateNetwork(networkId, config);
      }
      
      this.generateSummary();
      this.exportResults();
      
    } catch (error) {
      console.error('❌ Error loading configurations:', error.message);
      return false;
    }
    
    return true;
  }

  async validateNetwork(networkId, config) {
    console.log(`\n🏪 Validating: ${config.name} (${networkId})`);
    
    const validation = {
      id: networkId,
      name: config.name,
      baseUrl: config.baseUrl,
      status: 'unknown',
      issues: [],
      features: {
        meatCategories: config.meatCategories?.length || 0,
        selectors: Object.keys(config.selectors || {}).length,
        hebrewKeywords: config.hebrewMeatKeywords?.length || 0,
        expectedProducts: config.expected_products || 0,
        confidence: config.confidence || 0,
        governmentData: !!config.governmentData?.enabled,
        chainType: config.chain_type || 'unknown'
      }
    };

    // Validate essential components
    this.validateEssentials(validation, config);
    this.validateSelectors(validation, config);
    this.validateHebrewSupport(validation, config);
    this.validateCategories(validation, config);
    
    // Special validation for Tiv Taam
    if (networkId === 'tiv-taam') {
      this.validateTivTaam(validation, config);
    }
    
    // Determine overall status
    validation.status = validation.issues.length === 0 ? 'ready' : 
                       validation.issues.length <= 2 ? 'needs-attention' : 'critical';
    
    this.results.networks.push(validation);
    
    // Log results
    const statusEmoji = validation.status === 'ready' ? '✅' : 
                       validation.status === 'needs-attention' ? '⚠️' : '❌';
    
    console.log(`   ${statusEmoji} Status: ${validation.status.toUpperCase()}`);
    console.log(`   📦 Expected products: ${validation.features.expectedProducts}`);
    console.log(`   🔧 Selectors: ${validation.features.selectors}`);
    console.log(`   🇮🇱 Hebrew keywords: ${validation.features.hebrewKeywords}`);
    console.log(`   📂 Categories: ${validation.features.meatCategories}`);
    console.log(`   🏛️ Government data: ${validation.features.governmentData ? 'Yes' : 'No'}`);
    
    if (validation.issues.length > 0) {
      console.log(`   ⚠️ Issues (${validation.issues.length}):`);
      validation.issues.forEach(issue => console.log(`      • ${issue}`));
    }
  }

  validateEssentials(validation, config) {
    if (!config.baseUrl) {
      validation.issues.push('Missing baseUrl');
    }
    if (!config.name) {
      validation.issues.push('Missing name');
    }
    if (!config.meatCategories || config.meatCategories.length === 0) {
      validation.issues.push('No meat categories defined');
    }
  }

  validateSelectors(validation, config) {
    const requiredSelectors = ['productContainer', 'productName', 'productPrice'];
    const selectors = config.selectors || {};
    
    requiredSelectors.forEach(selector => {
      if (!selectors[selector]) {
        validation.issues.push(`Missing required selector: ${selector}`);
      }
    });
    
    // Check for comprehensive selector coverage
    const optionalSelectors = ['productImage', 'productBrand', 'pricePerKg', 'nextPage'];
    const hasOptional = optionalSelectors.filter(s => selectors[s]).length;
    
    if (hasOptional < 2) {
      validation.issues.push('Limited selector coverage - consider adding more selectors');
    }
  }

  validateHebrewSupport(validation, config) {
    if (!config.hebrewMeatKeywords || config.hebrewMeatKeywords.length < 10) {
      validation.issues.push('Insufficient Hebrew meat keywords (need at least 10)');
    }
    
    if (!config.hebrewProcessing?.enabled) {
      validation.issues.push('Hebrew processing not enabled');
    }
  }

  validateCategories(validation, config) {
    if (config.meatCategories) {
      config.meatCategories.forEach((category, index) => {
        if (!category.startsWith('/')) {
          validation.issues.push(`Category ${index + 1} should start with /`);
        }
      });
    }
  }

  validateTivTaam(validation, config) {
    console.log('   🎯 Special Tiv Taam validation...');
    
    // Check for government data integration
    if (!config.governmentData?.enabled) {
      validation.issues.push('Tiv Taam should have government data enabled');
    }
    
    if (!config.governmentData?.chainCode === 'TIV_TAAM') {
      validation.issues.push('Tiv Taam government chain code incorrect');
    }
    
    // Check for mainstream orientation
    if (config.chain_type !== 'mainstream') {
      validation.issues.push('Tiv Taam should be configured as mainstream chain');
    }
    
    // Expected high product count
    if (config.expected_products < 80) {
      validation.issues.push('Tiv Taam expected products should be 80+');
    }
    
    // Check categories are correct format
    const correctCategories = ['/categories/90082/products', '/categories/90083/products', '/categories/90084/products'];
    const hasCorrectCategories = correctCategories.every(cat => config.meatCategories.includes(cat));
    
    if (!hasCorrectCategories) {
      validation.issues.push('Tiv Taam categories may not be correct - should use /categories/90082/products format');
    }
  }

  generateSummary() {
    const networks = this.results.networks;
    
    this.results.summary = {
      total: networks.length,
      configured: networks.length,
      ready: networks.filter(n => n.status === 'ready').length,
      needsAttention: networks.filter(n => n.status === 'needs-attention').length,
      critical: networks.filter(n => n.status === 'critical').length,
      withGovernmentData: networks.filter(n => n.features.governmentData).length,
      expectedProducts: networks.reduce((sum, n) => sum + n.features.expectedProducts, 0),
      avgConfidence: networks.reduce((sum, n) => sum + n.features.confidence, 0) / networks.length
    };
    
    console.log('\n📊 EIGHT NETWORK VALIDATION SUMMARY');
    console.log('=====================================');
    console.log(`Total Networks: ${this.results.summary.total}/8 expected`);
    console.log(`✅ Ready: ${this.results.summary.ready}`);
    console.log(`⚠️ Needs Attention: ${this.results.summary.needsAttention}`);
    console.log(`❌ Critical Issues: ${this.results.summary.critical}`);
    console.log(`🏛️ Government Data Enabled: ${this.results.summary.withGovernmentData}`);
    console.log(`📦 Total Expected Products: ${this.results.summary.expectedProducts}`);
    console.log(`🎯 Average Confidence: ${this.results.summary.avgConfidence.toFixed(2)}`);
    
    // Mission status
    const missionStatus = this.results.summary.total >= 8 && 
                         this.results.summary.critical === 0 && 
                         this.results.summary.expectedProducts >= 400;
    
    console.log(`\n🎯 MISSION STATUS: ${missionStatus ? '✅ READY FOR 8-NETWORK DEPLOYMENT' : '⚠️ NEEDS WORK'}`);
    
    if (!missionStatus) {
      console.log('\n📋 Mission Requirements:');
      console.log('   • 8 networks configured ✓');
      console.log(`   • No critical issues (currently ${this.results.summary.critical})`);
      console.log(`   • 400+ expected products (currently ${this.results.summary.expectedProducts})`);
      console.log('   • All networks ready for deployment');
    }
  }

  exportResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + 'T' + 
                      new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    
    const exportData = {
      validation: {
        timestamp: new Date().toISOString(),
        mission: 'Eight Network Integration - Tiv Taam Addition',
        version: '8.0 - Complete Network Coverage'
      },
      summary: this.results.summary,
      networks: this.results.networks,
      recommendations: this.generateRecommendations()
    };

    const outputPath = path.join(__dirname, 'output', `eight-network-validation-${timestamp}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    
    console.log(`\n💾 Validation results exported: ${path.basename(outputPath)}`);
    return outputPath;
  }

  generateRecommendations() {
    const recommendations = [];
    
    const criticalNetworks = this.results.networks.filter(n => n.status === 'critical');
    const attentionNetworks = this.results.networks.filter(n => n.status === 'needs-attention');
    
    if (criticalNetworks.length > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Fix critical network issues',
        networks: criticalNetworks.map(n => n.id),
        description: 'These networks have critical configuration issues that prevent deployment'
      });
    }
    
    if (attentionNetworks.length > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'Address configuration warnings',
        networks: attentionNetworks.map(n => n.id),
        description: 'These networks have minor issues that should be resolved for optimal performance'
      });
    }
    
    if (this.results.summary.expectedProducts < 500) {
      recommendations.push({
        priority: 'medium',
        action: 'Optimize expected product counts',
        description: 'Consider increasing expected product counts to reach 500+ products for better market coverage'
      });
    }
    
    const noGovData = this.results.networks.filter(n => !n.features.governmentData);
    if (noGovData.length > 0) {
      recommendations.push({
        priority: 'low',
        action: 'Consider government data integration',
        networks: noGovData.map(n => n.id),
        description: 'Government data can provide higher confidence scores and additional validation'
      });
    }
    
    return recommendations;
  }
}

// Run the validation
async function main() {
  const validator = new EightNetworkValidator();
  const success = await validator.validateNetworks();
  
  console.log(`\n🏁 Eight Network Validation ${success ? 'completed successfully' : 'failed'}`);
  process.exit(success ? 0 : 1);
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Validation failed:', error);
    process.exit(1);
  });
}

export { EightNetworkValidator };