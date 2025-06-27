/**
 * Direct Browser Scraping Test
 * Test if we can extract products directly from רמי לוי and שופרסל
 * Bypass the hybrid system to identify the core issue
 */

import { BrowserAIScraper } from './modules/browserAIScraper.js';
import fs from 'fs';

console.log('🧪 Testing Direct Browser Scraping...');

async function testDirectScraping() {
    try {
        const scraper = new BrowserAIScraper({
            debug: true,
            test: true,
            mode: 'full_scan'
        });

        console.log('🎯 Testing רמי לוי extraction...');
        const ramiLevyResults = await scraper.scanSite('rami-levy', {
            maxProducts: 25,
            timeout: 30000
        });

        console.log(`📊 רמי לוי Results: ${ramiLevyResults ? ramiLevyResults.length : 0} products`);
        if (ramiLevyResults && ramiLevyResults.length > 0) {
            console.log('✅ Sample product:', JSON.stringify(ramiLevyResults[0], null, 2));
        }

        console.log('\n🎯 Testing שופרסל extraction...');
        const shufersalResults = await scraper.scanSite('shufersal', {
            maxProducts: 25,
            timeout: 30000
        });

        console.log(`📊 שופרסל Results: ${shufersalResults ? shufersalResults.length : 0} products`);

        const total = (ramiLevyResults?.length || 0) + (shufersalResults?.length || 0);
        console.log(`\n📈 Total Products Extracted: ${total}`);
        console.log(`🎯 Target: 50+ for success`);
        console.log(`📊 Status: ${total >= 25 ? '✅ SUCCESS' : '❌ NEEDS FIXING'}`);

        // Save results for analysis
        const testResults = {
            timestamp: new Date().toISOString(),
            ramiLevy: {
                count: ramiLevyResults?.length || 0,
                products: ramiLevyResults || []
            },
            shufersal: {
                count: shufersalResults?.length || 0,
                products: shufersalResults || []
            },
            totalProducts: total,
            success: total >= 25
        };

        fs.writeFileSync(
            `./output/direct-browser-test-${Date.now()}.json`,
            JSON.stringify(testResults, null, 2)
        );

        return testResults;

    } catch (error) {
        console.error('❌ Direct scraping test failed:', error);
        return { error: error.message, totalProducts: 0, success: false };
    }
}

testDirectScraping()
    .then(results => {
        console.log('\n🏁 Direct Browser Test Complete');
        process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
        console.error('💥 Test crashed:', error);
        process.exit(1);
    });