import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

// Import both data sources
import GovernmentDataProcessor from './government_data_processor.js';

// ES Module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UnifiedDataAggregator {
    constructor(options = {}) {
        this.debug = options.debug || false;
        this.governmentProcessor = new GovernmentDataProcessor({ debug: this.debug });
        this.webScraperCommand = 'node';
        this.webScraperScript = path.join(__dirname, 'basarometer-scanner.js');
        this.outputDir = path.join(__dirname, 'unified_output');
        this.government_limit = options.government_limit || 30;
        this.web_scraper_test = options.test || true;
    }
    
    async initialize() {
        // Create output directory
        await fs.promises.mkdir(this.outputDir, { recursive: true });
        
        if (this.debug) {
            console.log('✅ Unified aggregator initialized');
        }
    }
    
    async runWebScraper() {
        console.log('\n=== Running Web Scraper ===');
        
        try {
            return new Promise((resolve, reject) => {
                const args = [this.webScraperScript];
                
                if (this.web_scraper_test) {
                    args.push('--test');
                }
                
                if (this.debug) {
                    args.push('--debug');
                }
                
                // Run specifically on Rami Levy for testing
                args.push('--site', 'rami-levy');
                
                if (this.debug) {
                    console.log('🔧 Web scraper command:', [this.webScraperCommand, ...args].join(' '));
                }
                
                const scraper = spawn(this.webScraperCommand, args, {
                    stdio: 'pipe',
                    cwd: __dirname
                });
                
                let output = '';
                let errorOutput = '';
                
                scraper.stdout.on('data', (data) => {
                    const text = data.toString();
                    output += text;
                    if (this.debug) {
                        console.log(text.trim());
                    }
                });
                
                scraper.stderr.on('data', (data) => {
                    const text = data.toString();
                    errorOutput += text;
                    if (this.debug) {
                        console.error(text.trim());
                    }
                });
                
                scraper.on('close', async (code) => {
                    if (code === 0) {
                        console.log('✅ Web scraper completed successfully');
                        try {
                            const products = await this.loadWebScraperResults();
                            resolve(products);
                        } catch (error) {
                            reject(new Error(`Failed to load web scraper results: ${error.message}`));
                        }
                    } else {
                        reject(new Error(`Web scraper failed with code ${code}: ${errorOutput}`));
                    }
                });
                
                scraper.on('error', (error) => {
                    reject(new Error(`Failed to start web scraper: ${error.message}`));
                });
            });
            
        } catch (error) {
            console.error('❌ Web scraper error:', error.message);
            return [];
        }
    }
    
    async loadWebScraperResults() {
        // Load the latest scraper output files from the output directory
        try {
            const outputPath = path.join(__dirname, 'output');
            const files = await fs.promises.readdir(outputPath);
            const jsonFiles = files.filter(f => f.includes('basarometer-scan') && f.endsWith('.json'));
            
            if (jsonFiles.length === 0) {
                console.log('⚠️ No web scraper output files found');
                return [];
            }
            
            // Get the most recent file
            const latestFile = jsonFiles.sort().pop();
            const filePath = path.join(outputPath, latestFile);
            
            if (this.debug) {
                console.log(`📁 Loading web scraper data from: ${latestFile}`);
            }
            
            const data = await fs.promises.readFile(filePath, 'utf8');
            const scanResult = JSON.parse(data);
            
            // Extract products array from the scan result
            const products = scanResult.products || [];
            
            console.log(`✅ Loaded ${products.length} products from web scraper`);
            return products;
            
        } catch (error) {
            console.error('❌ Error loading web scraper results:', error.message);
            return [];
        }
    }
    
    async runGovernmentDataCollection() {
        console.log('\\n=== Running Government Data Collection ===');
        
        try {
            // Test with RAMI_LEVY first to match the web scraper
            const result = await this.governmentProcessor.scrapeSpecificChain('RAMI_LEVY', this.government_limit);
            
            if (result.success) {
                console.log(`✅ Government data: ${result.products.length} products`);
                return result.products;
            } else {
                console.log(`⚠️ Government data failed: ${result.error}`);
                return [];
            }
            
        } catch (error) {
            console.error('❌ Government data error:', error.message);
            return [];
        }
    }
    
    calculateSimilarityScore(name1, name2) {
        // Simple similarity calculation based on common words
        const words1 = name1.toLowerCase().split(/\\s+/);
        const words2 = name2.toLowerCase().split(/\\s+/);
        
        const commonWords = words1.filter(word => words2.includes(word));
        const totalWords = Math.max(words1.length, words2.length);
        
        return commonWords.length / totalWords;
    }
    
    async combineAndDeduplicateData(webProducts, govProducts) {
        console.log('\\n=== Combining and Deduplicating Data ===');
        
        const allProducts = [];
        const seenProducts = new Map();
        
        // Add web scraper products (priority source)
        for (const product of webProducts) {
            const key = `${product.name}-${product.site}`.toLowerCase().replace(/\\s+/g, '-');
            
            if (!seenProducts.has(key)) {
                seenProducts.set(key, true);
                allProducts.push({
                    ...product,
                    data_source: 'web_scraper',
                    priority: 'high',
                    source_confidence: product.confidence || 0.8
                });
            }
        }
        
        // Add government products (fill gaps)
        let govAdded = 0;
        for (const product of govProducts) {
            const key = `${product.name}-${product.site}`.toLowerCase().replace(/\\s+/g, '-');
            
            // Check if this product is too similar to existing ones
            let isDuplicate = false;
            for (const existingProduct of allProducts) {
                const similarity = this.calculateSimilarityScore(product.name, existingProduct.name);
                if (similarity > 0.7) { // 70% similarity threshold
                    isDuplicate = true;
                    break;
                }
            }
            
            if (!seenProducts.has(key) && !isDuplicate) {
                seenProducts.set(key, true);
                allProducts.push({
                    ...product,
                    data_source: 'government_data',
                    priority: 'medium',
                    source_confidence: product.confidence || 0.7
                });
                govAdded++;
            }
        }
        
        console.log(`✅ Combined dataset: ${allProducts.length} unique products`);
        console.log(`📊 Web scraper: ${webProducts.length} | Government added: ${govAdded} | Total unique: ${allProducts.length}`);
        
        return allProducts;
    }
    
    async saveUnifiedResults(products) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Save JSON
        const jsonFile = path.join(this.outputDir, `unified-products-${timestamp}.json`);
        await fs.promises.writeFile(jsonFile, JSON.stringify(products, null, 2));
        
        // Save CSV
        const csvFile = path.join(this.outputDir, `unified-products-${timestamp}.csv`);
        const csv = this.convertToCSV(products);
        await fs.promises.writeFile(csvFile, csv);
        
        // Create summary
        const sourceBreakdown = {};
        products.forEach(p => {
            sourceBreakdown[p.data_source] = (sourceBreakdown[p.data_source] || 0) + 1;
        });
        
        const vendorBreakdown = {};
        products.forEach(p => {
            const vendor = p.siteName || p.vendor || 'Unknown';
            vendorBreakdown[vendor] = (vendorBreakdown[vendor] || 0) + 1;
        });
        
        const summary = {
            timestamp: new Date().toISOString(),
            total_products: products.length,
            sources: sourceBreakdown,
            vendors: vendorBreakdown,
            average_confidence: products.reduce((sum, p) => sum + (p.source_confidence || 0), 0) / products.length,
            files: {
                json: jsonFile,
                csv: csvFile
            }
        };
        
        const summaryFile = path.join(this.outputDir, `unified-summary-${timestamp}.json`);
        await fs.promises.writeFile(summaryFile, JSON.stringify(summary, null, 2));
        
        console.log(`✅ Unified results saved:`);
        console.log(`   JSON: ${path.basename(jsonFile)}`);
        console.log(`   CSV: ${path.basename(csvFile)}`);
        console.log(`   Summary: ${path.basename(summaryFile)}`);
        
        return summary;
    }
    
    convertToCSV(products) {
        if (products.length === 0) return '';
        
        // Get all unique keys from all products
        const allKeys = new Set();
        products.forEach(product => {
            Object.keys(product).forEach(key => allKeys.add(key));
        });
        
        const headers = Array.from(allKeys);
        const csvHeaders = headers.join(',');
        
        const rows = products.map(product => 
            headers.map(header => {
                const value = product[header];
                if (value === null || value === undefined) return '';
                if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
                return value;
            }).join(',')
        );
        
        return [csvHeaders, ...rows].join('\\n');
    }
    
    async runUnifiedCollection() {
        console.log('🚀 Starting Unified Data Collection - Basarometer V6.0 Hybrid System');
        
        await this.initialize();
        
        try {
            // Run both systems in parallel for efficiency
            console.log('⚡ Running both data sources in parallel...');
            
            const [webProducts, govProducts] = await Promise.all([
                this.runWebScraper(),
                this.runGovernmentDataCollection()
            ]);
            
            // Combine and save results
            const unifiedProducts = await this.combineAndDeduplicateData(webProducts, govProducts);
            const summary = await this.saveUnifiedResults(unifiedProducts);
            
            console.log('\\n🎯 UNIFIED COLLECTION COMPLETE');
            console.log(`📊 Total Products: ${summary.total_products}`);
            console.log(`🌐 Web Scraper: ${summary.sources.web_scraper || 0}`);
            console.log(`🏛️ Government: ${summary.sources.government_data || 0}`);
            console.log(`📈 Average Confidence: ${summary.average_confidence.toFixed(2)}`);
            console.log(`🏪 Vendors: ${Object.keys(summary.vendors).length}`);
            
            // Success criteria check
            if (summary.total_products >= 50) {
                console.log('\\n✅ SUCCESS: Hybrid system achieved 50+ products target!');
                if (summary.total_products >= 100) {
                    console.log('🎉 EXCELLENT: Exceeded 100+ products!');
                }
            } else {
                console.log(`\\n⚠️ NEEDS IMPROVEMENT: Only ${summary.total_products} products (target: 50+)`);
            }
            
            return summary;
            
        } catch (error) {
            console.error('❌ Unified collection failed:', error.message);
            return {
                success: false,
                error: error.message,
                total_products: 0
            };
        }
    }
}

// Test function
async function runUnifiedDataCollection() {
    console.log('🧪 Testing Unified Data Collection System');
    
    const aggregator = new UnifiedDataAggregator({ 
        debug: true,
        test: true,
        government_limit: 20  // Smaller limit for testing
    });
    
    return await aggregator.runUnifiedCollection();
}

export default UnifiedDataAggregator;

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runUnifiedDataCollection().catch(console.error);
}