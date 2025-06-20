#!/usr/bin/env node

/**
 * Test script for Government Data Scraper
 */

import { GovernmentDataScraper } from './modules/governmentDataScraper.js';

async function testGovernmentScraper() {
  console.log('🏛️ Testing Government Data Scraper...\n');
  
  try {
    // Create scraper instance in test mode
    const scraper = new GovernmentDataScraper({
      test: true,
      debug: true
    });
    
    console.log('✅ Government scraper initialized');
    console.log(`📊 Available chains: ${scraper.availableChains.length}`);
    console.log(`🎯 Test mode: ${scraper.maxChains} chains max`);
    
    // Test single chain scraping
    console.log('\n🔍 Testing single chain scraping (MEGA)...');
    await scraper.scrapeChain('MEGA');
    
    console.log('\n📋 Current stats:');
    console.log(`   Chains scanned: ${scraper.stats.chainsScanned}`);
    console.log(`   Total products: ${scraper.stats.totalProducts}`);
    console.log(`   Meat products: ${scraper.stats.meatProducts}`);
    console.log(`   Errors: ${scraper.stats.failed}`);
    
    if (scraper.results.length > 0) {
      console.log('\n🥩 Sample meat products found:');
      scraper.results.slice(0, 3).forEach((product, i) => {
        console.log(`   ${i+1}. ${product.name} - ₪${product.price} (${(product.confidence || 0).toFixed(2)})`);
      });
    }
    
    // Export results
    const exportInfo = scraper.exportResults();
    console.log(`\n💾 Results exported to: ${exportInfo.jsonFile}`);
    
    console.log('\n✅ Government scraper test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run test
testGovernmentScraper();