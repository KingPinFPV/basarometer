#!/usr/bin/env node

import StealthBrowser from './utils/stealth-browser.js';
import HebrewProductProcessor from './utils/hebrew-product-processor.js';
import CaptchaSolver from './utils/captcha-solver.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class LiveProductExtractor {
    constructor(options = {}) {
        this.captchaSolver = new CaptchaSolver(options.captcha || {});
        this.browser = new StealthBrowser({
            captchaSolver: this.captchaSolver,
            headless: options.headless !== false,
            ...options.browser
        });
        this.processor = new HebrewProductProcessor();
        this.vendors = null;
        this.outputDir = options.outputDir || './output';
        this.debugMode = options.debug || false;
    }

    /**
     * Load vendor configuration
     */
    async loadVendors() {
        try {
            const vendorPath = path.join(__dirname, 'config', 'known-israeli-meat-vendors.json');
            const vendorData = await fs.readFile(vendorPath, 'utf8');
            this.vendors = JSON.parse(vendorData);
            console.log(`✅ Loaded ${this.vendors.manual_vendor_database.total_real_vendors} vendors`);
        } catch (error) {
            console.error('❌ Failed to load vendor configuration:', error.message);
            throw error;
        }
    }

    /**
     * Extract products from הטחנה (Priority Vendor)
     */
    async extractHatachana() {
        const vendor = this.vendors.manual_vendor_database.verified_vendors
            .find(v => v.name.includes('הטחנה'));
        
        if (!vendor) {
            throw new Error('הטחנה vendor not found in configuration');
        }

        console.log(`🎯 Starting extraction from ${vendor.name} (${vendor.url})`);

        try {
            await this.browser.launch();
            
            // Navigate to main meat category
            const meatUrl = `${vendor.url}/categories/meat`;
            await this.browser.goto(meatUrl);
            
            if (this.debugMode) {
                await this.browser.screenshot(`./debug-hatachana-${Date.now()}.png`);
            }

            // Define selectors for הטחנה
            const selectors = {
                product: '.product-item, .product-card, [data-product-id]',
                name: '.product-name, .product-title, h3, h4',
                price: '.price, .product-price, .current-price',
                image: 'img',
                link: 'a'
            };

            // Extract raw products
            const rawProducts = await this.browser.extractProducts(selectors);
            console.log(`📦 Found ${rawProducts.length} raw products`);

            // Process with Hebrew-aware AI
            const processedProducts = rawProducts.map(product => 
                this.processor.processProduct(product)
            );

            // Filter high-confidence meat products
            const meatProducts = this.processor.filterByConfidence(processedProducts, 0.6)
                .filter(p => p.processed.detectedMeat);

            // Sort by relevance
            const sortedProducts = this.processor.sortByRelevance(meatProducts);

            console.log(`🥩 Extracted ${sortedProducts.length} meat products with >60% confidence`);

            // Generate report
            const report = this.processor.generateReport(processedProducts);
            
            // Save results
            await this.saveResults('hatachana', {
                vendor: vendor,
                products: sortedProducts,
                report: report,
                timestamp: new Date().toISOString(),
                extraction_method: 'live_scraping_with_captcha_solving'
            });

            return {
                vendor: vendor.name,
                products: sortedProducts,
                report: report
            };

        } catch (error) {
            console.error(`❌ הטחנה extraction failed:`, error.message);
            
            if (this.debugMode) {
                await this.browser.screenshot(`./debug-hatachana-error-${Date.now()}.png`);
            }
            
            throw error;
        } finally {
            await this.browser.close();
        }
    }

    /**
     * Extract products from Meatnet (Magento Platform)
     */
    async extractMeatnet() {
        const vendor = this.vendors.manual_vendor_database.high_priority_vendors
            .find(v => v.name === 'Meatnet');
        
        if (!vendor) {
            throw new Error('Meatnet vendor not found in configuration');
        }

        console.log(`🎯 Starting extraction from ${vendor.name} (${vendor.url})`);

        try {
            await this.browser.launch();
            
            // Try multiple potential meat category URLs for Magento
            const potentialUrls = [
                `${vendor.url}/meat`,
                `${vendor.url}/catalog/category/view/id/meat`,
                `${vendor.url}/basar`,
                `${vendor.url}/בשר`,
                `${vendor.url}/products/meat`
            ];

            let products = [];
            
            for (const url of potentialUrls) {
                try {
                    console.log(`🔗 Trying ${url}`);
                    await this.browser.goto(url);
                    
                    // Magento-specific selectors
                    const selectors = {
                        product: '.product-item, .item, .product',
                        name: '.product-item-name a, .product-name, h2 a, h3 a',
                        price: '.price, .regular-price, .special-price',
                        image: '.product-image-photo, .product-image img',
                        link: '.product-item-link, .product-link'
                    };

                    const rawProducts = await this.browser.extractProducts(selectors);
                    
                    if (rawProducts.length > 0) {
                        console.log(`📦 Found ${rawProducts.length} products at ${url}`);
                        products = rawProducts;
                        break;
                    }
                } catch (urlError) {
                    console.log(`⚠️ URL ${url} failed: ${urlError.message}`);
                    continue;
                }
            }

            if (products.length === 0) {
                throw new Error('No products found at any Meatnet URL');
            }

            // Process products
            const processedProducts = products.map(product => 
                this.processor.processProduct(product)
            );

            const meatProducts = this.processor.filterByConfidence(processedProducts, 0.6)
                .filter(p => p.processed.detectedMeat);

            const sortedProducts = this.processor.sortByRelevance(meatProducts);

            console.log(`🥩 Extracted ${sortedProducts.length} meat products from Meatnet`);

            const report = this.processor.generateReport(processedProducts);
            
            await this.saveResults('meatnet', {
                vendor: vendor,
                products: sortedProducts,
                report: report,
                timestamp: new Date().toISOString(),
                extraction_method: 'magento_platform_scraping'
            });

            return {
                vendor: vendor.name,
                products: sortedProducts,
                report: report
            };

        } catch (error) {
            console.error(`❌ Meatnet extraction failed:`, error.message);
            throw error;
        } finally {
            await this.browser.close();
        }
    }

    /**
     * Extract from all priority vendors
     */
    async extractAllPriorityVendors() {
        await this.loadVendors();
        
        const results = [];
        const priorityVendors = ['הטחנה', 'Meatnet'];
        
        for (const vendorName of priorityVendors) {
            try {
                console.log(`\n🚀 Starting extraction from ${vendorName}...`);
                
                let result;
                if (vendorName === 'הטחנה') {
                    result = await this.extractHatachana();
                } else if (vendorName === 'Meatnet') {
                    result = await this.extractMeatnet();
                }
                
                results.push(result);
                
                // Human-like delay between vendors
                await this.sleep(5000 + Math.random() * 5000);
                
            } catch (error) {
                console.error(`❌ Failed to extract from ${vendorName}:`, error.message);
                results.push({
                    vendor: vendorName,
                    error: error.message,
                    products: [],
                    report: null
                });
            }
        }

        // Generate combined report
        const combinedReport = this.generateCombinedReport(results);
        
        await this.saveResults('combined_extraction', {
            results: results,
            combinedReport: combinedReport,
            timestamp: new Date().toISOString(),
            totalProducts: results.reduce((sum, r) => sum + (r.products?.length || 0), 0)
        });

        console.log('\n📊 EXTRACTION SUMMARY:');
        console.log(`Total vendors processed: ${results.length}`);
        console.log(`Total products extracted: ${combinedReport.totalProducts}`);
        console.log(`Average confidence: ${combinedReport.averageConfidence.toFixed(2)}`);
        
        return results;
    }

    /**
     * Generate combined report from multiple vendors
     */
    generateCombinedReport(results) {
        const allProducts = results.flatMap(r => r.products || []);
        
        return {
            totalProducts: allProducts.length,
            byVendor: results.map(r => ({
                vendor: r.vendor,
                products: r.products?.length || 0,
                error: r.error || null
            })),
            averageConfidence: allProducts.length > 0 
                ? allProducts.reduce((sum, p) => sum + (p.processed?.confidence || 0), 0) / allProducts.length
                : 0,
            priceRange: this.processor.calculatePriceRange(allProducts),
            meatTypes: [...new Set(allProducts.map(p => p.processed?.detectedMeat).filter(Boolean))],
            brands: [...new Set(allProducts.map(p => p.processed?.brand).filter(Boolean))]
        };
    }

    /**
     * Save results to files
     */
    async saveResults(filename, data) {
        try {
            // Ensure output directory exists
            await fs.mkdir(this.outputDir, { recursive: true });
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const jsonPath = path.join(this.outputDir, `${filename}-${timestamp}.json`);
            
            await fs.writeFile(jsonPath, JSON.stringify(data, null, 2), 'utf8');
            console.log(`💾 Results saved to ${jsonPath}`);

            // Also save CSV for easy analysis
            if (data.products && data.products.length > 0) {
                const csvPath = path.join(this.outputDir, `${filename}-${timestamp}.csv`);
                await this.saveCsv(csvPath, data.products);
                console.log(`📊 CSV saved to ${csvPath}`);
            }
        } catch (error) {
            console.error('❌ Failed to save results:', error.message);
        }
    }

    /**
     * Save products as CSV
     */
    async saveCsv(filepath, products) {
        const headers = [
            'Name', 'Normalized Name', 'Price', 'Price per KG', 'Meat Type', 
            'Quality Grade', 'Brand', 'Cut', 'Category', 'Confidence', 'URL'
        ];
        
        const rows = products.map(p => [
            p.name || '',
            p.processed?.normalizedName || '',
            p.price || '',
            p.processed?.pricePerKg || '',
            p.processed?.detectedMeat || '',
            p.processed?.qualityGrade || '',
            p.processed?.brand || '',
            p.processed?.cut?.name || '',
            p.processed?.category || '',
            p.processed?.confidence || 0,
            p.url || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        await fs.writeFile(filepath, csvContent, 'utf8');
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Test CAPTCHA solver connection
     */
    async testCaptchaSolver() {
        console.log('🧪 Testing CAPTCHA solver connection...');
        const connected = await this.captchaSolver.testConnection();
        
        if (connected) {
            console.log('✅ CAPTCHA solver ready');
        } else {
            console.log('❌ CAPTCHA solver not available - continuing without it');
        }
        
        return connected;
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const debug = args.includes('--debug');
    const headless = !args.includes('--show-browser');
    const vendor = args.find(arg => arg.startsWith('--vendor='))?.split('=')[1];

    const extractor = new LiveProductExtractor({
        debug: debug,
        headless: headless
    });

    async function main() {
        try {
            console.log('🚀 Starting Live Product Extraction with CAPTCHA solving...');
            
            // Test CAPTCHA solver
            await extractor.testCaptchaSolver();
            
            if (vendor === 'hatachana') {
                await extractor.extractHatachana();
            } else if (vendor === 'meatnet') {
                await extractor.extractMeatnet();  
            } else {
                await extractor.extractAllPriorityVendors();
            }
            
            console.log('✅ Extraction completed successfully!');
        } catch (error) {
            console.error('❌ Extraction failed:', error.message);
            process.exit(1);
        }
    }

    main();
}

export default LiveProductExtractor;