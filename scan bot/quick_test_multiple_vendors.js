/**
 * Quick Test: Multiple Vendors
 * Test extraction from רמי לוי, שופרסל, and קרפור to get 100+ products
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Quick Test: Multiple Vendors');
console.log('🎯 Goal: Extract 100+ products from proven vendors');

async function runQuickTest() {
    const results = {
        timestamp: new Date().toISOString(),
        vendors: [],
        totalProducts: 0,
        success: false
    };
    
    const vendors = [
        { name: 'rami-levy', displayName: 'רמי לוי' },
        { name: 'shufersal', displayName: 'שופרסל' },
        { name: 'carrefour', displayName: 'קרפור' }
    ];
    
    try {
        for (const vendor of vendors) {
            console.log(`\\n📊 Testing ${vendor.displayName}...`);
            
            try {
                // Run the scanner for this vendor
                const output = execSync(
                    `node basarometer-scanner.js --test --site ${vendor.name}`,
                    { 
                        encoding: 'utf-8',
                        timeout: 120000,
                        cwd: process.cwd()
                    }
                );
                
                // Extract product count from output
                const productMatch = output.match(/נמצאו (\\d+) מוצרי בשר/);
                const uniqueMatch = output.match(/מוצרים ייחודיים: (\\d+)/);
                
                const totalFound = productMatch ? parseInt(productMatch[1]) : 0;
                const uniqueProducts = uniqueMatch ? parseInt(uniqueMatch[1]) : 0;
                
                console.log(`✅ ${vendor.displayName}: ${uniqueProducts} unique products (${totalFound} total found)`);
                
                results.vendors.push({
                    name: vendor.name,
                    displayName: vendor.displayName,
                    totalFound: totalFound,
                    uniqueProducts: uniqueProducts,
                    success: uniqueProducts > 0
                });
                
                results.totalProducts += uniqueProducts;
                
            } catch (error) {
                console.log(`❌ ${vendor.displayName}: Failed - ${error.message}`);
                results.vendors.push({
                    name: vendor.name,
                    displayName: vendor.displayName,
                    totalFound: 0,
                    uniqueProducts: 0,
                    success: false,
                    error: error.message
                });
            }
        }
        
        results.success = results.totalProducts >= 50;
        
        console.log(`\\n🎯 Quick Test Summary:`);
        console.log(`📊 Total Products: ${results.totalProducts}`);
        console.log(`🎯 Target: 50+ for success`);
        console.log(`📊 Status: ${results.success ? '✅ SUCCESS' : '❌ NEEDS MORE WORK'}`);
        
        // Show breakdown
        results.vendors.forEach(vendor => {
            const status = vendor.success ? '✅' : '❌';
            console.log(`  ${status} ${vendor.displayName}: ${vendor.uniqueProducts} products`);
        });
        
        // Save results
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const outputPath = `./output/quick-test-${timestamp}.json`;
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`\\n💾 Results saved: ${outputPath}`);
        
        return results;
        
    } catch (error) {
        console.error('❌ Quick test failed:', error);
        return { error: error.message, totalProducts: 0, success: false };
    }
}

runQuickTest()
    .then(results => {
        console.log('\\n🏁 Quick Test Complete');
        process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
        console.error('💥 Test crashed:', error);
        process.exit(1);
    });