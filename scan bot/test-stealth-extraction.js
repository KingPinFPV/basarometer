#!/usr/bin/env node

/**
 * Test Stealth Extraction - Verify working solution without external CAPTCHA dependencies
 * Focus on הטחנה (verified vendor) to validate the stealth-first approach
 */

import StealthBrowser from './utils/stealth-browser.js';
import HebrewProductProcessor from './utils/hebrew-product-processor.js';
import { promises as fs } from 'fs';

class StealthExtractionTest {
    constructor(options = {}) {
        console.log('🔧 StealthExtractionTest constructor called with options:', options);
        
        console.log('🌐 Creating StealthBrowser instance...');
        this.browser = new StealthBrowser({
            headless: options.headless !== false,
            timeout: 30000,
            debug: options.debug || false
        });
        console.log('✅ StealthBrowser created');
        
        console.log('🔤 Creating HebrewProductProcessor instance...');
        this.processor = new HebrewProductProcessor();
        console.log('✅ HebrewProductProcessor created');
        
        this.debug = options.debug || false;
        console.log('🐛 Debug mode:', this.debug ? 'ENABLED' : 'DISABLED');
        console.log('✅ StealthExtractionTest constructor completed');
    }

    /**
     * Test extraction from הטחנה (verified working vendor)
     */
    async testHatachanaExtraction() {
        console.log('\n🧪 TESTING STEALTH EXTRACTION FROM הטחנה');
        console.log('='.repeat(60));
        console.log('⏰ Function start time:', new Date().toISOString());

        const testResults = {
            timestamp: new Date().toISOString(),
            vendor: 'הטחנה (meat-shop.co.il)',
            stealth_effectiveness: null,
            products_found: 0,
            hebrew_processing_success: 0,
            extraction_success: false,
            errors: [],
            performance_metrics: {}
        };

        try {
            const startTime = Date.now();
            console.log('⏱️ Tracking start time:', startTime);

            // Step 1: Launch stealth browser
            console.log('\n🚀 Step 1: Launching stealth browser...');
            console.log('🔄 Calling browser.launch()...');
            await this.browser.launch();
            console.log('✅ Browser launch completed successfully');

            // Step 2: Test multiple הטחנה URLs - Updated 2025
            console.log('\n📋 Step 2: Testing multiple הטחנה URLs...');
            const testUrls = [
                'https://meat-shop.co.il/collections/all',
                'https://meat-shop.co.il/collections/בשר-בקר',
                'https://meat-shop.co.il/collections/beef',
                'https://meat-shop.co.il/collections/עוף',
                'https://meat-shop.co.il/collections/chicken',
                'https://meat-shop.co.il/products',
                'https://meat-shop.co.il'
            ];
            
            console.log('🎯 URLs to test:', testUrls);
            let bestResult = null;

            for (let i = 0; i < testUrls.length; i++) {
                const url = testUrls[i];
                try {
                    console.log(`\n🔗 Testing URL ${i + 1}/${testUrls.length}: ${url}...`);
                    console.log('⏳ Calling testSingleUrl()...');
                    
                    const result = await this.testSingleUrl(url);
                    console.log(`📊 Result for ${url}:`, {
                        success: result.success,
                        products_found: result.products.length,
                        stealth_score: result.stealthScore
                    });
                    
                    if (result.products.length > 0 && (!bestResult || result.products.length > bestResult.products.length)) {
                        console.log(`🏆 New best result! ${result.products.length} products`);
                        bestResult = result;
                    } else {
                        console.log(`📉 No improvement. Current best: ${bestResult?.products.length || 0} products`);
                    }

                    // Small delay between tests
                    console.log('⏱️ Waiting 2 seconds before next test...');
                    await this.sleep(2000);
                    console.log('✅ Delay completed');

                } catch (urlError) {
                    console.warn(`⚠️ URL test failed for ${url}:`, urlError.message);
                    console.error('🔍 URL error stack:', urlError.stack);
                    testResults.errors.push({
                        url: url,
                        error: urlError.message,
                        stack: urlError.stack
                    });
                }
            }
            
            console.log('\n📊 URL testing phase completed');
            console.log('🏆 Best result:', bestResult ? `${bestResult.products.length} products from ${bestResult.url}` : 'No products found');

            // Step 3: Process best results
            if (bestResult && bestResult.products.length > 0) {
                console.log(`\n🧠 Step 3: Processing ${bestResult.products.length} products with Hebrew NLP...`);
                
                const processedProducts = bestResult.products.map(product => 
                    this.processor.processProduct(product)
                );

                // Enhanced Hebrew meat product filtering
                const hebrewProducts = processedProducts.filter(p => {
                    if (!p.processed) return false;
                    
                    // Check for Hebrew text or meat keywords
                    const hasHebrew = p.processed.isHebrew;
                    const hasMeatKeywords = this.containsMeatKeywords(p.name || '');
                    const goodConfidence = p.processed.confidence > 0.4; // Lower threshold for meat
                    
                    return (hasHebrew || hasMeatKeywords) && goodConfidence;
                });

                testResults.products_found = bestResult.products.length;
                testResults.hebrew_processing_success = hebrewProducts.length;
                testResults.extraction_success = hebrewProducts.length > 0;
                testResults.stealth_effectiveness = bestResult.stealthScore;

                // Save test results
                await this.saveTestResults(testResults, processedProducts);

                console.log('\n📊 TEST RESULTS:');
                console.log(`   • Products found: ${testResults.products_found}`);
                console.log(`   • Hebrew products: ${testResults.hebrew_processing_success}`);
                console.log(`   • Success rate: ${Math.round((testResults.hebrew_processing_success / testResults.products_found) * 100)}%`);
                console.log(`   • Stealth score: ${testResults.stealth_effectiveness}/100`);

            } else {
                testResults.extraction_success = false;
                testResults.errors.push({
                    type: 'no_products_found',
                    message: 'No products found at any tested URL'
                });
            }

            const endTime = Date.now();
            testResults.performance_metrics = {
                total_time_ms: endTime - startTime,
                total_time_readable: this.formatDuration(endTime - startTime)
            };

            return testResults;

        } catch (error) {
            console.error('\n❌ Test failed with error:', error.message);
            console.error('📋 Full error stack:', error.stack);
            console.error('🔍 Error type:', error.constructor.name);
            
            testResults.extraction_success = false;
            testResults.errors.push({
                type: 'critical_failure',
                message: error.message,
                stack: error.stack
            });
            
            console.log('📊 Returning error results:', testResults);
            return testResults;
        } finally {
            console.log('\n🧹 Cleanup: Closing browser...');
            try {
                await this.browser.close();
                console.log('✅ Browser closed successfully');
            } catch (closeError) {
                console.error('⚠️ Error closing browser:', closeError.message);
            }
        }
    }

    /**
     * Test a single URL for product extraction
     */
    async testSingleUrl(url) {
        console.log(`\n🎯 testSingleUrl() called for: ${url}`);
        try {
            // Navigate with stealth and redirect handling
            console.log('🌐 Navigating to URL with stealth...');
            await this.browser.goto(url);
            console.log('✅ Initial navigation completed');
            
            // Wait for page stability and handle redirects (Puppeteer API)
            console.log('⏳ Waiting for page stability...');
            await this.browser.page.waitForLoadState ? 
                await this.browser.page.waitForLoadState('networkidle', { timeout: 10000 }) :
                await this.browser.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
            
            // Check if we were redirected
            const currentUrl = this.browser.page.url();
            if (currentUrl !== url) {
                console.log(`🔄 Redirected from ${url} to ${currentUrl}`);
                // Additional wait after redirect
                await this.sleep(2000);
            }
            
            // Wait for content to load
            await this.browser.page.waitForTimeout ? 
                await this.browser.page.waitForTimeout(3000) :
                await this.sleep(3000);
            console.log('✅ Page stability achieved');

            if (this.debug) {
                const screenshotPath = `./debug-test-${Date.now()}.png`;
                console.log(`📸 Taking debug screenshot: ${screenshotPath}`);
                try {
                    // Use browser.screenshot if available, otherwise use page.screenshot
                    if (this.browser.screenshot) {
                        await this.browser.screenshot(screenshotPath);
                    } else {
                        await this.browser.page.screenshot({ 
                            path: screenshotPath, 
                            type: 'png',
                            fullPage: true 
                        });
                    }
                    console.log('✅ Screenshot saved successfully');
                } catch (screenshotError) {
                    console.warn('⚠️ Screenshot failed:', screenshotError.message);
                }
            }

            // Test different selector combinations for הטחנה - Updated 2025
            const selectorSets = [
                {
                    name: 'Modern Shopify 2025',
                    product: '.product-card, .product-item, .grid__item, .card-wrapper, [data-product-id]',
                    name: '.card__heading, .product-title, .product__title, .card__title, .h3, .h4',
                    price: '.price--on-sale, .price__current, .money, .price, .price-item'
                },
                {
                    name: 'Shopify Dawn Theme',
                    product: '.card-product, .product-grid-item, .collection-product-card',
                    name: '.card-information__text h3, .product-title, .card__heading',
                    price: '.price .price-item--regular, .price--on-sale .price-item--regular'
                },
                {
                    name: 'Hebrew E-commerce Updated',
                    product: '.מוצר, .פריט, .קארד, .product, .item-card',
                    name: '.שם-מוצר, .כותרת, .product-name, h3, h4, .title',
                    price: '.מחיר, .עלות, .₪, .price, .cost'
                },
                {
                    name: 'Fallback Broad Search',
                    product: 'article, .grid-item, [class*="product"], [class*="card"], [data-*="product"]',
                    name: 'h1, h2, h3, h4, .title, [class*="title"], [class*="name"]',
                    price: '[class*="price"], [class*="cost"], [class*="money"], .₪'
                }
            ];

            let bestProducts = [];
            let stealthScore = 0;

            // Try each selector set
            console.log(`🔍 Testing ${selectorSets.length} different selector sets...`);
            for (let i = 0; i < selectorSets.length; i++) {
                const selectors = selectorSets[i];
                try {
                    console.log(`  🔍 Testing selector set ${i + 1}/${selectorSets.length}: ${selectors.name}...`);
                    console.log('  📋 Selectors:', selectors);
                    
                    console.log('  ⏳ Calling browser.extractProducts()...');
                    const products = await this.browser.extractProducts(selectors);
                    console.log(`  📊 Extracted ${products.length} products`);
                    
                    if (products.length > bestProducts.length) {
                        bestProducts = products;
                        console.log(`  🏆 New best! ${products.length} products with ${selectors.name}`);
                    } else {
                        console.log(`  📉 No improvement. Current best: ${bestProducts.length} products`);
                    }

                } catch (selectorError) {
                    console.log(`  ⚠️ ${selectors.name} selectors failed:`, selectorError.message);
                    console.error('  🔍 Selector error stack:', selectorError.stack);
                }
            }

            console.log(`🏆 Best extraction result: ${bestProducts.length} products`);

            // Test stealth effectiveness
            console.log('🥷 Testing stealth effectiveness...');
            stealthScore = await this.testStealthScore();
            console.log(`📊 Stealth score: ${stealthScore}/100`);

            return {
                url: url,
                products: bestProducts,
                stealthScore: stealthScore,
                success: bestProducts.length > 0
            };

        } catch (error) {
            console.error(`URL test failed for ${url}:`, error.message);
            return {
                url: url,
                products: [],
                stealthScore: 0,
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Test stealth effectiveness
     */
    async testStealthScore() {
        try {
            const score = await this.browser.page.evaluate(() => {
                let score = 0;
                
                // Check for automation detection
                if (typeof navigator.webdriver === 'undefined') score += 25;
                
                // Check Hebrew support
                if (navigator.language === 'he-IL') score += 25;
                
                // Check timezone
                try {
                    if (Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Jerusalem') score += 25;
                } catch (e) {}
                
                // Check user agent quality
                if (navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('HeadlessChrome')) score += 25;
                
                return score;
            });

            return score;
        } catch (error) {
            console.warn('Stealth score test failed:', error.message);
            return 0;
        }
    }

    /**
     * Save test results for analysis
     */
    async saveTestResults(testResults, products = []) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            // Save JSON results
            const jsonPath = `./output/stealth-test-${timestamp}.json`;
            await fs.writeFile(jsonPath, JSON.stringify({
                ...testResults,
                detailed_products: products
            }, null, 2), 'utf8');

            // Save CSV if products found
            if (products.length > 0) {
                const csvPath = `./output/stealth-test-products-${timestamp}.csv`;
                await this.saveProductsCsv(csvPath, products);
            }

            console.log(`💾 Test results saved to ./output/stealth-test-${timestamp}.*`);

        } catch (error) {
            console.error('Failed to save test results:', error.message);
        }
    }

    /**
     * Save products as CSV
     */
    async saveProductsCsv(filepath, products) {
        const headers = [
            'Name', 'Price', 'Hebrew Detected', 'Meat Type', 'Confidence', 'Category', 'Brand'
        ];
        
        const rows = products.map(p => [
            p.name || '',
            p.price || '',
            p.processed?.isHebrew || false,
            p.processed?.detectedMeat || '',
            p.processed?.confidence || 0,
            p.processed?.category || '',
            p.processed?.brand || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        await fs.writeFile(filepath, csvContent, 'utf8');
    }

    /**
     * Helper methods
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Check if product name contains meat-related keywords
     */
    containsMeatKeywords(productName) {
        if (!productName) return false;
        
        const meatKeywords = [
            // Hebrew meat terms
            'בשר', 'עוף', 'כבש', 'עגל', 'בקר', 'טלה',
            'אנטריקוט', 'פילה', 'אסאדו', 'קבב',
            'המבורגר', 'שניצל', 'כבד', 'לב',
            // English meat terms
            'beef', 'chicken', 'lamb', 'veal', 'turkey',
            'steak', 'filet', 'ribeye', 'sirloin', 'chuck',
            'burger', 'schnitzel', 'kebab', 'sausage'
        ];
        
        const lowerName = productName.toLowerCase();
        return meatKeywords.some(keyword => lowerName.includes(keyword.toLowerCase()));
    }

    /**
     * Display final test summary
     */
    displayTestSummary(testResults) {
        console.log('\n' + '='.repeat(60));
        console.log('🧪 STEALTH EXTRACTION TEST SUMMARY');
        console.log('='.repeat(60));
        
        const status = testResults.extraction_success ? '✅ SUCCESS' : '❌ FAILED';
        console.log(`Status: ${status}`);
        console.log(`Vendor: ${testResults.vendor}`);
        console.log(`Products found: ${testResults.products_found}`);
        console.log(`Hebrew processing: ${testResults.hebrew_processing_success}`);
        console.log(`Stealth effectiveness: ${testResults.stealth_effectiveness}/100`);
        console.log(`Total time: ${testResults.performance_metrics?.total_time_readable}`);
        
        if (testResults.errors.length > 0) {
            console.log(`\n⚠️ Errors encountered: ${testResults.errors.length}`);
            testResults.errors.forEach((error, i) => {
                console.log(`   ${i + 1}. ${error.type || 'Unknown'}: ${error.message}`);
            });
        }

        if (testResults.extraction_success) {
            console.log('\n✅ STEALTH EXTRACTION WORKING');
            console.log('Ready to proceed with full Phase 3 integration');
        } else {
            console.log('\n❌ STEALTH EXTRACTION NEEDS ADJUSTMENT');
            console.log('Review selectors and stealth techniques');
        }
        
        console.log('='.repeat(60));
    }
}

// CLI execution
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
    console.log('🚀 STEALTH EXTRACTION TEST STARTING...');
    console.log('='.repeat(50));
    
    const args = process.argv.slice(2);
    console.log('📋 Command line arguments:', args);
    
    const options = {
        debug: args.includes('--debug'),
        headless: !args.includes('--show-browser')
    };
    
    console.log('⚙️ Options configured:', options);
    console.log('🔧 Creating StealthExtractionTest instance...');
    
    const tester = new StealthExtractionTest(options);
    console.log('✅ Test instance created successfully');

    async function main() {
        console.log('\n📋 MAIN FUNCTION STARTING...');
        
        try {
            console.log('🧪 Starting Stealth Extraction Test...');
            console.log('⏰ Test start time:', new Date().toISOString());
            
            console.log('\n🎯 Calling testHatachanaExtraction()...');
            const results = await tester.testHatachanaExtraction();
            
            console.log('\n📊 Test completed, displaying summary...');
            tester.displayTestSummary(results);
            
            if (results.extraction_success) {
                console.log('\n🎉 Test successful! Stealth extraction is working.');
                console.log('✅ Exiting with success code 0');
                process.exit(0);
            } else {
                console.log('\n⚠️ Test failed. Check logs and adjust selectors.');
                console.log('❌ Exiting with error code 1');
                process.exit(1);
            }
            
        } catch (error) {
            console.error('\n💥 Test crashed with error:', error.message);
            console.error('📋 Full error stack:', error.stack);
            console.log('❌ Exiting with error code 1');
            process.exit(1);
        }
    }

    console.log('\n🚀 Calling main function...');
    main().catch(error => {
        console.error('💥 Main function failed:', error.message);
        console.error('📋 Stack trace:', error.stack);
        process.exit(1);
    });
}

export default StealthExtractionTest;