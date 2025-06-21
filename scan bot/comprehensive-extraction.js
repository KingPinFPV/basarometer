#!/usr/bin/env node

/**
 * Comprehensive Extraction to 120+ Products
 * Strategy: Scale from current 31 products to 120+ by extracting from our most successful sources
 */

import StealthBrowser from './utils/stealth-browser.js';
import HebrewProductProcessor from './utils/hebrew-product-processor.js';
import { promises as fs } from 'fs';

class ComprehensiveExtractor {
    constructor(options = {}) {
        console.log('🔧 ComprehensiveExtractor constructor called');
        
        this.browser = new StealthBrowser({
            headless: options.headless !== false,
            timeout: 30000,
            debug: options.debug || false
        });
        
        this.processor = new HebrewProductProcessor();
        this.debug = options.debug || false;
        
        // Top verified vendors for scaling
        this.vendors = [
            {
                name: "Meatnet",
                url: "https://meatnet.co.il",
                type: "magento",
                confidence: 0.95,
                expectedProducts: 25,
                categories: [
                    "/collections/all",
                    "/collections/beef",
                    "/collections/בשר-בקר",
                    "/collections/chicken", 
                    "/collections/עוף",
                    "/collections/lamb",
                    "/collections/כבש"
                ]
            },
            {
                name: "הטחנה",
                url: "https://meat-shop.co.il", 
                type: "woocommerce",
                confidence: 0.90,
                expectedProducts: 30,
                categories: [
                    "/collections/all",
                    "/collections/בשר-בקר",
                    "/collections/beef",
                    "/collections/עוף",
                    "/collections/chicken",
                    "/product-category/בשר"
                ]
            },
            {
                name: "מעדני גורמה",
                url: "https://gorme.co.il",
                type: "woocommerce", 
                confidence: 0.88,
                expectedProducts: 35,
                categories: [
                    "/product-category/בשר",
                    "/product-category/עוף",
                    "/product-category/בקר",
                    "/product-category/כבש",
                    "/shop"
                ]
            },
            {
                name: "נתחים",
                url: "https://netachim.co.il",
                type: "woocommerce",
                confidence: 0.85,
                expectedProducts: 25,
                categories: [
                    "/product-category/בשר",
                    "/product-category/עוף",
                    "/shop",
                    "/products"
                ]
            },
            {
                name: "מיטמן",
                url: "https://meatman.co.il",
                type: "woocommerce",
                confidence: 0.82,
                expectedProducts: 20,
                categories: [
                    "/product-category/בשר",
                    "/product-category/עוף",
                    "/shop"
                ]
            }
        ];
    }

    /**
     * Execute comprehensive extraction to reach 120+ products
     */
    async extractToTarget() {
        console.log('\n🎯 COMPREHENSIVE EXTRACTION TO 120+ PRODUCTS');
        console.log('='.repeat(60));
        console.log('⏰ Extraction start time:', new Date().toISOString());
        console.log('🎯 Current: ~31 products | Target: 120+ products');
        console.log('📊 Vendors to extract:', this.vendors.length);

        const extractionResults = {
            timestamp: new Date().toISOString(),
            currentProducts: 31,
            targetProducts: 120,
            vendors_tested: this.vendors.length,
            products_found: 0,
            hebrew_processing_success: 0,
            extraction_success: false,
            vendors_success: 0,
            all_products: [],
            vendor_results: [],
            errors: []
        };

        try {
            const startTime = Date.now();
            
            // Step 1: Launch stealth browser
            console.log('\n🚀 Step 1: Launching stealth browser...');
            await this.browser.launch();
            console.log('✅ Browser launched successfully');

            // Step 2: Extract from each vendor
            console.log('\n📂 Step 2: Multi-vendor extraction...');
            console.log(`🎯 Testing ${this.vendors.length} vendors for comprehensive coverage`);
            
            for (let i = 0; i < this.vendors.length; i++) {
                const vendor = this.vendors[i];
                
                try {
                    console.log(`\n🏪 Vendor ${i + 1}/${this.vendors.length}: ${vendor.name}`);
                    console.log(`🔗 URL: ${vendor.url}`);
                    console.log(`📊 Expected products: ${vendor.expectedProducts}`);
                    
                    const vendorResult = await this.extractFromVendor(vendor);
                    extractionResults.vendor_results.push(vendorResult);
                    
                    if (vendorResult.success) {
                        extractionResults.vendors_success++;
                        extractionResults.all_products.push(...vendorResult.products);
                        console.log(`✅ ${vendor.name}: ${vendorResult.products.length} products found`);
                    } else {
                        console.log(`❌ ${vendor.name}: Failed - ${vendorResult.error}`);
                    }
                    
                    // Small delay between vendors
                    await this.sleep(3000);
                    
                } catch (vendorError) {
                    console.error(`❌ ${vendor.name} failed:`, vendorError.message);
                    extractionResults.errors.push({
                        vendor: vendor.name,
                        error: vendorError.message
                    });
                }
            }

            // Step 3: Deduplicate and process
            console.log('\n🧹 Step 3: Deduplication and Hebrew processing...');
            const uniqueProducts = this.deduplicateProducts(extractionResults.all_products);
            console.log(`📊 Deduplication: ${extractionResults.all_products.length} → ${uniqueProducts.length} products`);
            
            const processedProducts = uniqueProducts.map(product => 
                this.processor.processProduct(product)
            );

            const hebrewProducts = processedProducts.filter(p => {
                if (!p.processed) return false;
                const hasHebrew = p.processed.isHebrew;
                const hasMeatKeywords = this.containsMeatKeywords(p.name || '');
                const goodConfidence = p.processed.confidence > 0.4;
                return (hasHebrew || hasMeatKeywords) && goodConfidence;
            });

            extractionResults.products_found = uniqueProducts.length;
            extractionResults.hebrew_processing_success = hebrewProducts.length;
            
            // Add current products to reach target
            const totalWithCurrent = extractionResults.hebrew_processing_success + 31; // Add current 31
            extractionResults.extraction_success = totalWithCurrent >= 120;

            // Step 4: Save results
            await this.saveExtractionResults(extractionResults, hebrewProducts);

            // Step 5: Display results
            this.displayExtractionSummary(extractionResults);

            const endTime = Date.now();
            extractionResults.performance_metrics = {
                total_time_ms: endTime - startTime,
                total_time_readable: this.formatDuration(endTime - startTime)
            };

            return extractionResults;

        } catch (error) {
            console.error('\n❌ Extraction failed:', error.message);
            extractionResults.extraction_success = false;
            extractionResults.errors.push({
                type: 'critical_failure',
                message: error.message
            });
            
            return extractionResults;
        } finally {
            console.log('\n🧹 Cleanup: Closing browser...');
            try {
                await this.browser.close();
            } catch (closeError) {
                console.error('⚠️ Error closing browser:', closeError.message);
            }
        }
    }

    /**
     * Extract products from a single vendor
     */
    async extractFromVendor(vendor) {
        try {
            console.log(`    🌐 Navigating to ${vendor.name}...`);
            
            let bestProducts = [];
            let bestUrl = '';
            
            // Try each category URL for this vendor
            for (const category of vendor.categories) {
                const url = vendor.url + category;
                
                try {
                    console.log(`      🔗 Testing: ${category}`);
                    await this.browser.goto(url);
                    await this.sleep(3000);
                    
                    if (this.debug) {
                        const screenshotPath = `./debug-${vendor.name.replace(/[^א-תa-zA-Z0-9]/g, '-')}-${Date.now()}.png`;
                        console.log(`      📸 Debug screenshot: ${screenshotPath}`);
                        await this.browser.page.screenshot({ 
                            path: screenshotPath, 
                            fullPage: true 
                        });
                    }
                    
                    const products = await this.extractProductsFromPage(vendor);
                    
                    if (products.length > bestProducts.length) {
                        bestProducts = products;
                        bestUrl = url;
                        console.log(`      🏆 New best: ${products.length} products from ${category}`);
                    }
                    
                    await this.sleep(2000);
                    
                } catch (categoryError) {
                    console.log(`      ⚠️ Category ${category} failed:`, categoryError.message);
                }
            }
            
            console.log(`    📊 ${vendor.name}: Found ${bestProducts.length} products from ${bestUrl}`);
            
            return {
                vendor: vendor.name,
                url: bestUrl,
                products: bestProducts,
                success: bestProducts.length > 0,
                error: bestProducts.length === 0 ? 'No products found in any category' : null
            };
            
        } catch (error) {
            console.error(`    ❌ ${vendor.name} extraction failed:`, error.message);
            return {
                vendor: vendor.name,
                url: vendor.url,
                products: [],
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Extract products from current page using multiple strategies
     */
    async extractProductsFromPage(vendor) {
        const products = [];
        
        // Platform-specific selector strategies
        const selectorStrategies = [
            // WooCommerce strategy
            {
                name: `WooCommerce (${vendor.type})`,
                product: '.product, .woocommerce-loop-product__title, .product-item, .wc-product',
                name: '.woocommerce-loop-product__title, .product-title, .entry-title, h2.product-title, h3',
                price: '.price, .amount, .woocommerce-Price-amount, .price-current'
            },
            // Shopify strategy
            {
                name: `Shopify (${vendor.type})`,
                product: '.product-card, .grid__item, .card-wrapper, [data-product-id]',
                name: '.card__heading, .product-title, .product__title, .card__title, h3, h4',
                price: '.price--on-sale, .price__current, .money, .price'
            },
            // Magento strategy
            {
                name: `Magento (${vendor.type})`,
                product: '.product-item, .item, .product, .catalog-item',
                name: '.product-item-name, .product-name, .item-name, h3, h4',
                price: '.price, .regular-price, .final-price, .cost'
            },
            // Hebrew E-commerce strategy
            {
                name: 'Hebrew E-commerce',
                product: '.מוצר, .פריט, .קארד, .product, .item',
                name: '.שם-מוצר, .כותרת, .product-name, h3, h4, .title',
                price: '.מחיר, .עלות, .₪, .price, .cost'
            },
            // Broad fallback strategy
            {
                name: 'Broad Fallback',
                product: 'article, .grid-item, [class*="product"], [class*="card"], [data-*="product"]',
                name: 'h1, h2, h3, h4, .title, [class*="title"], [class*="name"]',
                price: '[class*="price"], [class*="cost"], [class*="money"], .₪'
            }
        ];
        
        console.log(`      🔍 Testing ${selectorStrategies.length} extraction strategies...`);
        
        for (let i = 0; i < selectorStrategies.length; i++) {
            const strategy = selectorStrategies[i];
            try {
                console.log(`        📋 Strategy ${i + 1}: ${strategy.name}...`);
                const strategyProducts = await this.browser.extractProducts(strategy);
                
                if (strategyProducts.length > 0) {
                    console.log(`        ✅ Found ${strategyProducts.length} products with ${strategy.name}`);
                    products.push(...strategyProducts);
                    break; // Use first successful strategy
                } else {
                    console.log(`        ❌ No products found with ${strategy.name}`);
                }
                
            } catch (strategyError) {
                console.log(`        ⚠️ ${strategy.name} failed:`, strategyError.message);
            }
        }
        
        console.log(`      📊 Total products found: ${products.length}`);
        return products;
    }

    /**
     * Deduplicate products based on name similarity
     */
    deduplicateProducts(products) {
        const unique = [];
        const seen = new Set();
        
        for (const product of products) {
            const key = (product.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
            if (key && !seen.has(key)) {
                seen.add(key);
                unique.push(product);
            }
        }
        
        return unique;
    }

    /**
     * Check for meat-related keywords
     */
    containsMeatKeywords(productName) {
        if (!productName) return false;
        
        const meatKeywords = [
            'בשר', 'עוף', 'כבש', 'עגל', 'בקר', 'טלה', 'הודו',
            'אנטריקוט', 'פילה', 'אסאדו', 'קבב', 'המבורגר', 'שניצל',
            'כבד', 'לב', 'צלעות', 'כנפיים', 'חזה', 'שוק', 'סטייק'
        ];
        
        const lowerName = productName.toLowerCase();
        return meatKeywords.some(keyword => lowerName.includes(keyword));
    }

    /**
     * Save extraction results
     */
    async saveExtractionResults(results, products) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            // Save JSON results
            const jsonPath = `./output/comprehensive-extraction-${timestamp}.json`;
            await fs.writeFile(jsonPath, JSON.stringify({
                ...results,
                detailed_products: products
            }, null, 2), 'utf8');

            // Save CSV if products found
            if (products.length > 0) {
                const csvPath = `./output/comprehensive-products-${timestamp}.csv`;
                await this.saveProductsCsv(csvPath, products);
            }

            console.log(`💾 Results saved to ./output/comprehensive-*-${timestamp}.*`);

        } catch (error) {
            console.error('Failed to save results:', error.message);
        }
    }

    /**
     * Save products as CSV
     */
    async saveProductsCsv(filepath, products) {
        const headers = [
            'Name', 'Price', 'Hebrew Detected', 'Meat Keywords', 'Confidence', 'Category', 'Brand', 'Vendor'
        ];
        
        const rows = products.map(p => [
            p.name || '',
            p.price || '',
            p.processed?.isHebrew || false,
            this.containsMeatKeywords(p.name || '') ? 'Yes' : 'No',
            p.processed?.confidence || 0,
            p.processed?.category || '',
            p.processed?.brand || '',
            p.vendor || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        await fs.writeFile(filepath, csvContent, 'utf8');
    }

    /**
     * Display extraction summary
     */
    displayExtractionSummary(results) {
        console.log('\n' + '='.repeat(60));
        console.log('🎯 COMPREHENSIVE EXTRACTION SUMMARY');
        console.log('='.repeat(60));
        
        const totalWithCurrent = results.hebrew_processing_success + 31;
        const success = totalWithCurrent >= 120 ? '✅ TARGET ACHIEVED!' : '🔄 SCALING UP';
        
        console.log(`Status: ${success}`);
        console.log(`Current products: 31 (Hybrid + Meatnet + הטחנה)`);
        console.log(`New products found: ${results.hebrew_processing_success}`);
        console.log(`Total products: ${totalWithCurrent}`);
        console.log(`Target: 120+ products`);
        console.log(`Progress: ${Math.round((totalWithCurrent / 120) * 100)}%`);
        console.log(`Vendors tested: ${results.vendors_tested}`);
        console.log(`Vendors successful: ${results.vendors_success}`);
        
        if (totalWithCurrent >= 120) {
            console.log('\n🎉 TARGET ACHIEVED! 120+ products extracted');
            console.log('✅ Ready for database integration and website deployment');
            console.log('🚀 Next step: Push all products to Supabase and update v3.basarometer.org');
        } else if (totalWithCurrent >= 80) {
            console.log('\n📈 EXCELLENT PROGRESS! 80+ products extracted');
            console.log(`🔄 Need ${120 - totalWithCurrent} more products to reach target`);
            console.log('💡 Consider additional vendors or deeper category extraction');
        } else {
            console.log('\n⚠️ MODERATE PROGRESS - Continue scaling');
            console.log('🔧 Review vendor success rates and optimize extraction');
        }
        
        console.log('\n📊 Vendor breakdown:');
        results.vendor_results.forEach(vendor => {
            const status = vendor.success ? '✅' : '❌';
            console.log(`   ${status} ${vendor.vendor}: ${vendor.products.length} products`);
        });
        
        console.log('='.repeat(60));
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
}

// CLI execution
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
    console.log('🎯 COMPREHENSIVE EXTRACTION TO 120+ PRODUCTS STARTING...');
    console.log('='.repeat(50));
    
    const args = process.argv.slice(2);
    const options = {
        debug: args.includes('--debug'),
        headless: !args.includes('--show-browser')
    };
    
    const extractor = new ComprehensiveExtractor(options);

    async function main() {
        try {
            console.log('🎯 Starting comprehensive extraction to 120+ products...');
            const results = await extractor.extractToTarget();
            
            const totalProducts = results.hebrew_processing_success + 31;
            
            if (results.extraction_success) {
                console.log('\n🎉 TARGET ACHIEVED! 120+ PRODUCTS EXTRACTED!');
                console.log(`✅ Total products: ${totalProducts}`);
                console.log('🚀 Ready for database integration and website deployment');
                process.exit(0);
            } else {
                console.log('\n📈 Scaling in progress...');
                console.log(`📊 Current total: ${totalProducts} products (target: 120+)`);
                console.log(`🎯 Found ${results.hebrew_processing_success} new products from vendors`);
                process.exit(0); // Still success, just haven't reached 120 yet
            }
            
        } catch (error) {
            console.error('\n💥 Extraction failed:', error.message);
            process.exit(1);
        }
    }

    main().catch(error => {
        console.error('💥 Main function failed:', error.message);
        process.exit(1);
    });
}

export default ComprehensiveExtractor;