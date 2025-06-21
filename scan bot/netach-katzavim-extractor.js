#!/usr/bin/env node

/**
 * נתח קצבים Full Production Extractor
 * Specialized extraction to scale from 3 products to 50-70 products
 * Handles popup dismissal and multi-category extraction
 */

import StealthBrowser from './utils/stealth-browser.js';
import HebrewProductProcessor from './utils/hebrew-product-processor.js';
import { promises as fs } from 'fs';

class NetachKatzavimExtractor {
    constructor(options = {}) {
        console.log('🔧 NetachKatzavimExtractor constructor called');
        
        this.browser = new StealthBrowser({
            headless: options.headless !== false,
            timeout: 30000,
            debug: options.debug || false
        });
        
        this.processor = new HebrewProductProcessor();
        this.debug = options.debug || false;
        
        // נתח קצבים configuration - Extended categories
        this.config = {
            name: "נתח קצבים",
            baseUrl: "https://orders.netach-katzavim.co.il",
            categories: [
                "/front/catering/4/2025-06-26",  // Category 4 - existing
                "/front/catering/5/2025-06-26",  // Category 5 - new
                "/front/catering/6/2025-06-26",  // Category 6 - new
                "/front/catering/7/2025-06-26",  // Category 7 - new
                "/front/catering/8/2025-06-26",  // Category 8 - new
                "/front/catering/9/2025-06-26",  // Category 9 - new
                "/front/catering/10/2025-06-26", // Category 10 - new
                "/front/catering/14/2025-06-26"  // Category 14 - existing
            ],
            selectors: {
                // Modal/popup handling
                modalClose: "button[aria-label*='סגור'], .close, .modal-close, [class*='close'], .btn-close",
                modalBackground: ".modal-backdrop, .overlay, .modal-overlay",
                warningPopup: ".alert, .warning, .modal, .popup",
                
                // Product selectors - comprehensive
                productContainer: ".product, .item, .product-item, .grid-item, .product-card, .card, [class*='product'], [class*='item'], .col, .column, .menu-item, .dish",
                productName: ".name, .title, .product-name, .product-title, .item-name, .item-title, h1, h2, h3, h4, h5, .heading, [class*='name'], [class*='title'], .dish-name",
                productPrice: ".price, .cost, .amount, .money, .product-price, .item-price, .current-price, .sale-price, [class*='price'], [class*='cost'], .₪, .dish-price",
                productImage: "img, .image, .photo, .product-image, .item-image, [class*='image'], [class*='photo']",
                productDescription: ".description, .details, .product-description, .item-description, [class*='description']"
            }
        };
    }

    /**
     * Execute full production extraction
     */
    async extractAllProducts() {
        console.log('\n🔥 נתח קצבים FULL PRODUCTION EXTRACTION');
        console.log('='.repeat(60));
        console.log('⏰ Extraction start time:', new Date().toISOString());
        console.log('🎯 Target: Scale from 3 products to 50-70 products');
        console.log('📊 Categories to extract:', this.config.categories.length);

        const extractionResults = {
            timestamp: new Date().toISOString(),
            vendor: 'נתח קצבים',
            target_products: '50-70',
            categories_tested: this.config.categories.length,
            products_found: 0,
            hebrew_processing_success: 0,
            extraction_success: false,
            categories_success: 0,
            all_products: [],
            category_results: [],
            errors: []
        };

        try {
            const startTime = Date.now();
            
            // Step 1: Launch stealth browser
            console.log('\n🚀 Step 1: Launching stealth browser...');
            await this.browser.launch();
            console.log('✅ Browser launched successfully');

            // Step 2: Extract from all categories
            console.log('\n📂 Step 2: Multi-category extraction...');
            console.log(`🎯 Testing ${this.config.categories.length} categories for full coverage`);
            
            for (let i = 0; i < this.config.categories.length; i++) {
                const category = this.config.categories[i];
                const categoryNum = category.match(/\/(\d+)\//)[1];
                
                try {
                    console.log(`\n📁 Category ${i + 1}/${this.config.categories.length}: ${categoryNum}`);
                    console.log(`🔗 URL: ${this.config.baseUrl}${category}`);
                    
                    const categoryResult = await this.extractFromCategory(category);
                    extractionResults.category_results.push(categoryResult);
                    
                    if (categoryResult.success) {
                        extractionResults.categories_success++;
                        extractionResults.all_products.push(...categoryResult.products);
                        console.log(`✅ Category ${categoryNum}: ${categoryResult.products.length} products found`);
                    } else {
                        console.log(`❌ Category ${categoryNum}: Failed - ${categoryResult.error}`);
                    }
                    
                    // Small delay between categories
                    await this.sleep(2000);
                    
                } catch (categoryError) {
                    console.error(`❌ Category ${categoryNum} failed:`, categoryError.message);
                    extractionResults.errors.push({
                        category: categoryNum,
                        error: categoryError.message
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
            extractionResults.extraction_success = hebrewProducts.length >= 20; // Success if 20+ products

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
     * Extract products from a single category
     */
    async extractFromCategory(categoryPath) {
        const url = this.config.baseUrl + categoryPath;
        const categoryNum = categoryPath.match(/\/(\d+)\//)[1];
        
        try {
            console.log(`    🌐 Navigating to category ${categoryNum}...`);
            await this.browser.goto(url);
            
            // Wait for initial load
            await this.sleep(3000);
            
            // Handle popups/modals
            console.log(`    ⚠️ Checking for popups/modals...`);
            await this.handlePopups();
            
            // Wait for content to load after popup dismissal
            await this.sleep(5000);
            
            if (this.debug) {
                const screenshotPath = `./debug-netach-category-${categoryNum}-${Date.now()}.png`;
                console.log(`    📸 Debug screenshot: ${screenshotPath}`);
                await this.browser.page.screenshot({ 
                    path: screenshotPath, 
                    fullPage: true 
                });
            }
            
            // Extract products using multiple selector strategies
            console.log(`    🔍 Extracting products from category ${categoryNum}...`);
            const products = await this.extractProductsFromPage();
            
            console.log(`    📊 Category ${categoryNum}: Found ${products.length} products`);
            
            return {
                category: categoryNum,
                url: url,
                products: products,
                success: products.length > 0,
                error: products.length === 0 ? 'No products found' : null
            };
            
        } catch (error) {
            console.error(`    ❌ Category ${categoryNum} extraction failed:`, error.message);
            return {
                category: categoryNum,
                url: url,
                products: [],
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Handle popups and modals
     */
    async handlePopups() {
        try {
            // Wait a moment for any popups to appear
            await this.sleep(2000);
            
            // Try to close modal using different strategies
            const closeStrategies = [
                // Strategy 1: Direct close button
                async () => {
                    const closeBtn = await this.browser.page.$('button[aria-label*="סגור"], .close, .modal-close, [class*="close"], .btn-close');
                    if (closeBtn) {
                        console.log('    ✅ Found close button, clicking...');
                        await closeBtn.click();
                        return true;
                    }
                    return false;
                },
                
                // Strategy 2: Click modal background
                async () => {
                    const modalBg = await this.browser.page.$('.modal-backdrop, .overlay, .modal-overlay');
                    if (modalBg) {
                        console.log('    ✅ Found modal background, clicking...');
                        await modalBg.click();
                        return true;
                    }
                    return false;
                },
                
                // Strategy 3: Press Escape key
                async () => {
                    console.log('    ⌨️ Trying Escape key...');
                    await this.browser.page.keyboard.press('Escape');
                    return true;
                },
                
                // Strategy 4: Click outside modal
                async () => {
                    console.log('    🖱️ Clicking outside modal...');
                    await this.browser.page.click('body', { force: true });
                    return true;
                }
            ];
            
            for (const strategy of closeStrategies) {
                try {
                    const success = await strategy();
                    if (success) {
                        await this.sleep(1000); // Wait for modal to close
                        break;
                    }
                } catch (strategyError) {
                    console.log('    ⚠️ Strategy failed:', strategyError.message);
                }
            }
            
        } catch (error) {
            console.log('    ⚠️ Popup handling failed:', error.message);
        }
    }

    /**
     * Extract products from current page
     */
    async extractProductsFromPage() {
        const products = [];
        
        // Multiple selector strategies for comprehensive extraction
        const selectorStrategies = [
            {
                name: 'Menu Items Strategy',
                product: '.menu-item, .dish, .product-item',
                name: '.dish-name, .item-name, .product-name, h3, h4',
                price: '.dish-price, .item-price, .price, .cost'
            },
            {
                name: 'Card Layout Strategy', 
                product: '.card, .product-card, .item-card',
                name: '.card-title, .title, .name, h3, h4',
                price: '.card-price, .price, .cost, .amount'
            },
            {
                name: 'Grid Layout Strategy',
                product: '.col, .column, .grid-item',
                name: '.name, .title, h1, h2, h3, h4, h5',
                price: '.price, .cost, .money, .₪'
            },
            {
                name: 'Broad Product Strategy',
                product: '.product, .item, [class*="product"], [class*="item"]',
                name: '[class*="name"], [class*="title"], .heading',
                price: '[class*="price"], [class*="cost"]'
            }
        ];
        
        console.log(`    🔍 Testing ${selectorStrategies.length} extraction strategies...`);
        
        for (let i = 0; i < selectorStrategies.length; i++) {
            const strategy = selectorStrategies[i];
            try {
                console.log(`      📋 Strategy ${i + 1}: ${strategy.name}...`);
                const strategyProducts = await this.browser.extractProducts(strategy);
                
                if (strategyProducts.length > 0) {
                    console.log(`      ✅ Found ${strategyProducts.length} products with ${strategy.name}`);
                    products.push(...strategyProducts);
                } else {
                    console.log(`      ❌ No products found with ${strategy.name}`);
                }
                
            } catch (strategyError) {
                console.log(`      ⚠️ ${strategy.name} failed:`, strategyError.message);
            }
        }
        
        console.log(`    📊 Total products found: ${products.length}`);
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
            'כבד', 'לב', 'צלעות', 'כנפיים', 'חזה', 'שוק',
            'נתח', 'קצבים', 'בשר', 'מנה', 'מנות'
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
            const jsonPath = `./output/netach-katzavim-extraction-${timestamp}.json`;
            await fs.writeFile(jsonPath, JSON.stringify({
                ...results,
                detailed_products: products
            }, null, 2), 'utf8');

            // Save CSV if products found
            if (products.length > 0) {
                const csvPath = `./output/netach-katzavim-products-${timestamp}.csv`;
                await this.saveProductsCsv(csvPath, products);
            }

            console.log(`💾 Results saved to ./output/netach-katzavim-*-${timestamp}.*`);

        } catch (error) {
            console.error('Failed to save results:', error.message);
        }
    }

    /**
     * Save products as CSV
     */
    async saveProductsCsv(filepath, products) {
        const headers = [
            'Name', 'Price', 'Hebrew Detected', 'Meat Keywords', 'Confidence', 'Category', 'Brand', 'Description'
        ];
        
        const rows = products.map(p => [
            p.name || '',
            p.price || '',
            p.processed?.isHebrew || false,
            this.containsMeatKeywords(p.name || '') ? 'Yes' : 'No',
            p.processed?.confidence || 0,
            p.processed?.category || '',
            p.processed?.brand || '',
            p.description || ''
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
        console.log('🔥 נתח קצבים PRODUCTION EXTRACTION SUMMARY');
        console.log('='.repeat(60));
        
        const success = results.extraction_success ? '✅ SUCCESS' : '❌ NEEDS MORE';
        console.log(`Status: ${success}`);
        console.log(`Target: Scale from 3 to 50-70 products`);
        console.log(`Categories tested: ${results.categories_tested}`);
        console.log(`Categories successful: ${results.categories_success}`);
        console.log(`Total products found: ${results.products_found}`);
        console.log(`Hebrew processed: ${results.hebrew_processing_success}`);
        console.log(`Success rate: ${Math.round((results.categories_success / results.categories_tested) * 100)}%`);
        
        if (results.hebrew_processing_success >= 50) {
            console.log('\n🎯 TARGET ACHIEVED! 50+ products extracted');
            console.log('✅ Ready for database integration and website push');
        } else if (results.hebrew_processing_success >= 20) {
            console.log('\n📈 GOOD PROGRESS! 20+ products extracted');
            console.log('🔄 Consider additional categories or refinement');
        } else {
            console.log('\n⚠️ NEEDS IMPROVEMENT - Less than 20 products');
            console.log('🔧 Review selectors and category URLs');
        }
        
        console.log('\n📊 Category breakdown:');
        results.category_results.forEach(cat => {
            const status = cat.success ? '✅' : '❌';
            console.log(`   ${status} Category ${cat.category}: ${cat.products.length} products`);
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
    console.log('🔥 נתח קצבים FULL PRODUCTION EXTRACTION STARTING...');
    console.log('='.repeat(50));
    
    const args = process.argv.slice(2);
    const options = {
        debug: args.includes('--debug'),
        headless: !args.includes('--show-browser')
    };
    
    const extractor = new NetachKatzavimExtractor(options);

    async function main() {
        try {
            console.log('🎯 Starting full production extraction...');
            const results = await extractor.extractAllProducts();
            
            if (results.extraction_success) {
                console.log('\n🎉 PRODUCTION EXTRACTION SUCCESSFUL!');
                console.log(`✅ Extracted ${results.hebrew_processing_success} products`);
                console.log('🚀 Ready for database integration');
                process.exit(0);
            } else {
                console.log('\n⚠️ Extraction needs improvement');
                console.log(`📊 Found ${results.hebrew_processing_success} products (target: 50-70)`);
                process.exit(1);
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

export default NetachKatzavimExtractor;