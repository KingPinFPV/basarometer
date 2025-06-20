#!/usr/bin/env node

/**
 * Test script for Hybrid Scanner Orchestrator
 */

import { HybridScannerOrchestrator } from './modules/hybridScannerOrchestrator.js';

async function testHybridOrchestrator() {
  console.log('🔄 Testing Hybrid Scanner Orchestrator...\n');
  
  try {
    // Test in hybrid mode with debug enabled
    const orchestrator = new HybridScannerOrchestrator({
      test: true,
      debug: true,
      mode: 'hybrid',
      verificationRatio: 0.5 // Verify 50% of products in test mode
    });
    
    console.log('✅ Hybrid orchestrator initialized');
    
    // Run the complete hybrid scan
    console.log('\n🚀 Starting complete hybrid intelligence scan...\n');
    const results = await orchestrator.performHybridScan();
    
    // Display results
    if (results.success) {
      console.log('🎉 Hybrid scan completed successfully!\n');
      
      console.log('📊 Final Statistics:');
      console.log(`   Government products: ${results.stats.governmentProducts}`);
      console.log(`   Browser verifications: ${results.stats.browserVerifications}`);
      console.log(`   Final merged products: ${results.stats.mergedProducts}`);
      console.log(`   Average confidence: ${results.stats.avgConfidence.toFixed(3)}`);
      console.log(`   Market coverage: ${results.stats.coverage.toFixed(1)}%`);
      
      if (results.qualityReport) {
        console.log('\n📈 Quality Report:');
        console.log(`   Unique chains: ${results.qualityReport.uniqueChains}`);
        console.log(`   Verified products: ${results.qualityReport.verifiedProducts}`);
        console.log(`   Complete products: ${results.qualityReport.completeProducts}`);
        
        console.log('\n🎯 Quality Distribution:');
        console.log(`   Excellent (≥0.9): ${results.qualityReport.qualityGrades.excellent}`);
        console.log(`   Good (0.7-0.9): ${results.qualityReport.qualityGrades.good}`);
        console.log(`   Fair (0.5-0.7): ${results.qualityReport.qualityGrades.fair}`);
        console.log(`   Poor (<0.5): ${results.qualityReport.qualityGrades.poor}`);
      }
      
      if (results.products && results.products.length > 0) {
        console.log('\n🥩 Sample Hybrid Products:');
        results.products.slice(0, 5).forEach((product, i) => {
          console.log(`   ${i+1}. ${product.name}`);
          console.log(`      Price: ₪${product.price} | Confidence: ${product.hybridConfidence.toFixed(3)}`);
          console.log(`      Source: ${product.source} | Chain: ${product.chain}`);
          console.log(`      Verified: ${product.verified ? '✅' : '❌'}`);
        });
      }
      
      // Export results
      const exportInfo = orchestrator.exportResults();
      console.log(`\n💾 Results exported to: ${exportInfo.jsonFile}`);
      
    } else {
      console.log('❌ Hybrid scan failed:', results.error);
      
      if (results.errors && results.errors.length > 0) {
        console.log('\n🚨 Errors encountered:');
        results.errors.forEach((error, i) => {
          console.log(`   ${i+1}. [${error.source}] ${error.error}`);
        });
      }
    }
    
    console.log('\n✅ Hybrid orchestrator test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run test
testHybridOrchestrator();