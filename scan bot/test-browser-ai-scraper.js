#!/usr/bin/env node

/**
 * Test script for Browser-AI Scraper (verification mode)
 */

import { BrowserAIScraper } from './modules/browserAIScraper.js';

async function testBrowserAIScraper() {
  console.log('🤖 Testing Browser-AI Scraper (Verification Mode)...\n');
  
  try {
    // Create Browser-AI scraper instance
    const scraper = new BrowserAIScraper({
      test: true,
      debug: true,
      mode: 'verification'
    });
    
    console.log('✅ Browser-AI scraper initialized');
    
    // Initialize browser
    await scraper.initialize();
    
    // Mock government products for verification
    const mockGovernmentProducts = [
      {
        name: "שניצל עוף טרי 500 גרם",
        price: 24.90,
        brand: "עוף טוב", 
        chain: "MEGA",
        confidence: 0.7,
        meatCategory: "עוף"
      },
      {
        name: "אנטריקוט בקר טרי קילו",
        price: 89.90,
        brand: "זוגלובק",
        chain: "RAMI_LEVY", 
        confidence: 0.6,
        meatCategory: "בקר"
      },
      {
        name: "חזה עוף ללא עצם",
        price: 42.50,
        brand: undefined, // Missing brand - needs gap filling
        chain: "SHUFERSAL",
        confidence: 0.5,
        meatCategory: "עוף"
      }
    ];
    
    console.log(`🔍 Testing product verification with ${mockGovernmentProducts.length} products...`);
    
    // Test product verification
    const verificationResults = await scraper.verifyProducts(mockGovernmentProducts);
    
    console.log('\n📋 Verification Results:');
    console.log(`   Products verified: ${verificationResults.length}`);
    
    if (verificationResults.length > 0) {
      console.log('\n🎯 Sample verifications:');
      verificationResults.slice(0, 2).forEach((result, i) => {
        console.log(`   ${i+1}. ${result.governmentProduct.name}`);
        console.log(`      Government price: ₪${result.governmentProduct.price}`);
        console.log(`      Site price: ₪${result.siteProduct?.price || 'N/A'}`);
        console.log(`      Verification confidence: ${result.verification.confidence.toFixed(2)}`);
        console.log(`      Verified: ${result.verification.verified ? '✅' : '❌'}`);
      });
    }
    
    // Test data gap filling
    console.log('\n🔧 Testing data gap filling...');
    const incompleteProducts = mockGovernmentProducts.filter(p => !p.brand || p.confidence < 0.7);
    
    if (incompleteProducts.length > 0) {
      const enhancedProducts = await scraper.fillDataGaps(incompleteProducts);
      
      console.log('\n📈 Enhancement Results:');
      console.log(`   Products enhanced: ${enhancedProducts.length}`);
      
      if (enhancedProducts.length > 0) {
        console.log('\n✨ Sample enhancements:');
        enhancedProducts.forEach((product, i) => {
          const original = incompleteProducts.find(p => p.name === product.name);
          console.log(`   ${i+1}. ${product.name}`);
          console.log(`      Original confidence: ${original.confidence.toFixed(2)}`);
          console.log(`      Enhanced confidence: ${product.confidence.toFixed(2)}`);
          console.log(`      Brand filled: ${!original.brand && product.brand ? '✅' : '❌'}`);
        });
      }
    }
    
    // Cleanup
    await scraper.cleanup();
    
    console.log('\n✅ Browser-AI scraper test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run test
testBrowserAIScraper();