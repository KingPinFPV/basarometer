import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GovernmentDataProcessor {
    constructor(options = {}) {
        this.debug = options.debug || false;
        this.pythonScript = path.join(__dirname, 'government_data_extractor.py');
        this.outputDir = path.join(__dirname, 'government_output');
        this.tempDir = path.join(__dirname, 'temp');
    }
    
    async initialize() {
        // Create output directories
        await fs.promises.mkdir(this.outputDir, { recursive: true });
        await fs.promises.mkdir(this.tempDir, { recursive: true });
        
        if (this.debug) {
            console.log('✅ Government data processor initialized');
        }
    }
    
    async testConnection() {
        console.log('🔬 Testing il-supermarket-scraper connection...');
        
        return new Promise((resolve) => {
            const testProcess = spawn('python3', ['-c', 
                'from il_supermarket_scarper.scrappers_factory import ScraperFactory; print("✅ il-supermarket-scraper available")'
            ], { stdio: 'pipe' });
            
            let output = '';
            testProcess.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            testProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ il-supermarket-scraper is properly installed');
                    resolve(true);
                } else {
                    console.log('❌ il-supermarket-scraper not available');
                    console.log('💡 Install with: pip3 install il-supermarket-scraper');
                    resolve(false);
                }
            });
        });
    }
    
    async fetchGovernmentData(options = {}) {
        console.log('=== Fetching Government Data via il-supermarket-scraper ===');
        
        try {
            await this.initialize();
            
            // Check if Python scraper is available
            const isAvailable = await this.testConnection();
            if (!isAvailable) {
                return {
                    success: false,
                    error: 'il-supermarket-scraper not available',
                    products: []
                };
            }
            
            // Run the Python scraper
            const result = await this.runPythonScraper(options);
            
            if (result.success && result.products.length > 0) {
                console.log(`✅ Government data: ${result.products.length} products extracted`);
                
                // Save processed data
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const outputFile = path.join(this.outputDir, `government-products-${timestamp}.json`);
                await fs.promises.writeFile(outputFile, JSON.stringify(result, null, 2));
                
                console.log(`📁 Government data saved: ${outputFile}`);
                return result;
            } else {
                console.log('⚠️ No government data extracted');
                return {
                    success: false,
                    error: result.error || 'No data extracted',
                    products: []
                };
            }
            
        } catch (error) {
            console.error('❌ Government data extraction failed:', error.message);
            return {
                success: false,
                error: error.message,
                products: []
            };
        }
    }
    
    async runPythonScraper(options = {}) {
        return new Promise((resolve, reject) => {
            if (this.debug) {
                console.log('🐍 Running Python il-supermarket-scraper...');
            }
            
            // Build command arguments
            const args = [this.pythonScript];
            
            if (this.debug) {
                args.push('--debug');
            }
            
            if (options.limit) {
                args.push('--limit', options.limit.toString());
            }
            
            if (options.chain) {
                args.push('--chain', options.chain);
            }
            
            // Create temporary output file
            const tempOutputFile = path.join(this.tempDir, `temp-gov-${Date.now()}.json`);
            args.push('--output', tempOutputFile);
            
            if (this.debug) {
                console.log('🔧 Python command:', ['python3', ...args].join(' '));
            }
            
            const pythonProcess = spawn('python3', args, {
                stdio: ['ignore', 'pipe', 'pipe']
            });
            
            let stdout = '';
            let stderr = '';
            
            pythonProcess.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                if (this.debug) {
                    console.log(output.trim());
                }
            });
            
            pythonProcess.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                // Always show stderr as it contains the status messages
                console.log(output.trim());
            });
            
            pythonProcess.on('close', async (code) => {
                try {
                    if (code === 0) {
                        // Read the output file
                        const data = await fs.promises.readFile(tempOutputFile, 'utf8');
                        const result = JSON.parse(data);
                        
                        // Clean up temp file
                        await fs.promises.unlink(tempOutputFile);
                        
                        resolve(result);
                    } else {
                        reject(new Error(`Python scraper failed with code ${code}: ${stderr}`));
                    }
                } catch (error) {
                    reject(new Error(`Failed to process Python output: ${error.message}`));
                }
            });
            
            pythonProcess.on('error', (error) => {
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });
        });
    }
    
    async getAvailableChains() {
        try {
            const result = await this.runPythonScraper({ limit: 1 });
            
            // The available chains are in the summary
            if (result.success && result.summary) {
                return Object.keys(result.summary.chain_results || {});
            }
            
            return [];
        } catch (error) {
            console.error('❌ Error getting available chains:', error.message);
            return [];
        }
    }
    
    async scrapeSpecificChain(chainName, limit = 50) {
        console.log(`🔍 Scraping specific chain: ${chainName}`);
        
        const result = await this.runPythonScraper({
            chain: chainName,
            limit: limit
        });
        
        return result;
    }
    
    async scrapeAllChains(limitPerChain = 25) {
        console.log('🔍 Scraping all available chains');
        
        const result = await this.runPythonScraper({
            limit: limitPerChain
        });
        
        return result;
    }
}

// Test function
async function testGovernmentProcessor() {
    console.log('🧪 Testing Government Data Processor');
    
    const processor = new GovernmentDataProcessor({ debug: true });
    
    // Test connection first
    const isAvailable = await processor.testConnection();
    if (!isAvailable) {
        console.log('⚠️ Please install il-supermarket-scraper first');
        return [];
    }
    
    // Test with a small limit
    console.log('\n📋 Testing with RAMI_LEVY chain...');
    const result = await processor.scrapeSpecificChain('RAMI_LEVY', 10);
    
    console.log('\n=== Government Data Test Results ===');
    console.log(`Success: ${result.success}`);
    console.log(`Total products: ${result.products ? result.products.length : 0}`);
    
    if (result.products && result.products.length > 0) {
        console.log('Sample product:', JSON.stringify(result.products[0], null, 2));
    }
    
    if (result.error) {
        console.log('Error:', result.error);
    }
    
    return result.products || [];
}

export default GovernmentDataProcessor;

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testGovernmentProcessor().catch(console.error);
}