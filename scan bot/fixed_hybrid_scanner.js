/**
 * Fixed Hybrid Scanner
 * Uses the working basarometer-scanner.js logic directly
 * Bypasses the broken government data pipeline
 */

import BasarometerScanner from './basarometer-scanner.js';
import fs from 'fs';
import path from 'path';

console.log('🚀 Fixed Hybrid Scanner Starting...');

async function runFixedHybridScan() {
    const startTime = Date.now();
    
    try {
        console.log('🔧 Initializing working browser scanner...');
        
        // Use the working scanner with both רמי לוי and שופרסל
        console.log('📊 Testing רמי לוי extraction...');
        const ramiLevyScanner = new BasarometerScanner({
            test: true,
            debug: false,
            site: 'rami-levy'
        });
        
        await ramiLevyScanner.run();
        
        console.log('📊 Testing שופרסל extraction...');
        const shufersalScanner = new BasarometerScanner({
            test: true,
            debug: false,
            site: 'shufersal'
        });
        
        await shufersalScanner.run();
        
        console.log('📊 Testing קרפור extraction...');
        const carrefourScanner = new BasarometerScanner({
            test: true,
            debug: false,
            site: 'carrefour'
        });
        
        await carrefourScanner.run();
        
        // Collect results from all scanners
        const allResults = [
            ...(ramiLevyScanner.results || []),
            ...(shufersalScanner.results || []),
            ...(carrefourScanner.results || [])
        ];
        
        const processingTime = (Date.now() - startTime) / 1000;
        
        console.log(`\\n🎯 Fixed Hybrid Scan Summary:`);
        console.log(`📊 Found ${allResults.length} total products`);
        console.log(`✅ רמי לוי: ${ramiLevyScanner.results?.length || 0} products`);
        console.log(`✅ שופרסל: ${shufersalScanner.results?.length || 0} products`);
        console.log(`✅ קרפור: ${carrefourScanner.results?.length || 0} products`);
        console.log(`⏱️ Processing time: ${processingTime} seconds`);
        console.log(`🎯 Target: 50+ products for success`);
        console.log(`📊 Status: ${allResults.length >= 50 ? '✅ SUCCESS' : '❌ NEEDS MORE WORK'}`);
        
        // Save combined results
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const combinedResults = {
            timestamp: new Date().toISOString(),
            scanInfo: {
                mode: 'fixed_hybrid',
                totalProducts: allResults.length,
                ramiLevyProducts: ramiLevyScanner.results?.length || 0,
                shufersalProducts: shufersalScanner.results?.length || 0,
                carrefourProducts: carrefourScanner.results?.length || 0,
                processingTime: processingTime,
                success: allResults.length >= 50
            },
            products: allResults
        };
        
        const outputPath = `./output/fixed-hybrid-scan-${timestamp}.json`;
        fs.writeFileSync(outputPath, JSON.stringify(combinedResults, null, 2));
        console.log(`💾 Results saved: ${outputPath}`);
        
        return combinedResults;
        
    } catch (error) {
        console.error('❌ Fixed hybrid scan failed:', error);
        return { error: error.message, totalProducts: 0, success: false };
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runFixedHybridScan()
        .then(results => {
            console.log('\\n🏁 Fixed Hybrid Scanner Complete');
            process.exit(results.success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Scanner crashed:', error);
            process.exit(1);
        });
}

export { runFixedHybridScan };