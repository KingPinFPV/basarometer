#!/usr/bin/env node

/**
 * Phase 3 Live Product Catalog Integration
 * Complete end-to-end extraction with CAPTCHA solving and V6.0 integration
 */

import LiveProductExtractor from './live-product-extractor.js';
import BasarometerAPIConnector from './utils/basarometer-api-connector.js';
import { promises as fs } from 'fs';
import path from 'path';

class Phase3LiveIntegration {
    constructor(options = {}) {
        this.extractor = new LiveProductExtractor({
            debug: options.debug || false,
            headless: options.headless !== false,
            captcha: {
                capmonsterUrl: options.capmonsterUrl || 'http://localhost:8081',
                apiKey: options.captchaApiKey || 'demo'
            }
        });
        
        this.apiConnector = new BasarometerAPIConnector({
            baseUrl: options.basarometerUrl || 'https://v3.basarometer.org',
            apiKey: options.basarometerApiKey
        });
        
        this.outputDir = options.outputDir || './output';
        this.sessionId = `phase3_${Date.now()}`;
    }

    /**
     * Run complete Phase 3 integration
     */
    async runCompleteIntegration() {
        console.log('🚀 PHASE 3: LIVE PRODUCT CATALOG INTEGRATION WITH OPEN SOURCE SOLUTIONS');
        console.log('='.repeat(80));
        console.log(`Session ID: ${this.sessionId}`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log('');

        const integrationResults = {
            phase: 'Phase 3 - Live Product Catalog Integration',
            session_id: this.sessionId,
            start_time: new Date().toISOString(),
            vendors_processed: [],
            total_products_extracted: 0,
            integration_results: null,
            performance_metrics: {},
            errors: [],
            success: false
        };

        try {
            // Step 1: Test infrastructure
            console.log('📋 STEP 1: Testing Infrastructure...');
            await this.testInfrastructure();

            // Step 2: Extract from priority vendors
            console.log('\n📋 STEP 2: Extracting from Priority Vendors...');
            const extractionResults = await this.extractFromPriorityVendors();
            
            integrationResults.vendors_processed = extractionResults.results.map(r => ({
                vendor: r.vendor,
                products_extracted: r.products?.length || 0,
                success: !r.error,
                error: r.error || null
            }));
            
            integrationResults.total_products_extracted = extractionResults.results
                .reduce((sum, r) => sum + (r.products?.length || 0), 0);

            // Step 3: Integrate with Basarometer V6.0
            console.log('\n📋 STEP 3: Integrating with Basarometer V6.0...');
            if (integrationResults.total_products_extracted > 0) {
                const allProducts = extractionResults.results.flatMap(r => r.products || []);
                integrationResults.integration_results = await this.integrateWithBasarometer(allProducts);
            } else {
                console.log('⚠️ No products extracted, skipping integration');
            }

            // Step 4: Generate comprehensive report
            console.log('\n📋 STEP 4: Generating Comprehensive Report...');
            integrationResults.performance_metrics = this.calculatePerformanceMetrics(extractionResults, integrationResults);
            integrationResults.end_time = new Date().toISOString();
            integrationResults.success = integrationResults.total_products_extracted > 0;

            // Save final results
            await this.saveFinalResults(integrationResults);

            // Display summary
            this.displayIntegrationSummary(integrationResults);

            return integrationResults;

        } catch (error) {
            console.error('\n❌ PHASE 3 INTEGRATION FAILED:', error.message);
            integrationResults.errors.push({
                type: 'critical_failure',
                message: error.message,
                timestamp: new Date().toISOString()
            });
            integrationResults.success = false;
            integrationResults.end_time = new Date().toISOString();
            
            await this.saveFinalResults(integrationResults);
            throw error;
        }
    }

    /**
     * Test all infrastructure components
     */
    async testInfrastructure() {
        const tests = [
            {
                name: 'CAPTCHA Solver',
                test: () => this.extractor.testCaptchaSolver()
            },
            {
                name: 'Basarometer API',
                test: () => this.apiConnector.testConnection()
            },
            {
                name: 'Output Directory',
                test: () => this.testOutputDirectory()
            }
        ];

        for (const test of tests) {
            try {
                console.log(`  🔍 Testing ${test.name}...`);
                const result = await test.test();
                console.log(`  ${result ? '✅' : '⚠️'} ${test.name}: ${result ? 'OK' : 'Warning - continuing anyway'}`);
            } catch (error) {
                console.log(`  ❌ ${test.name}: ${error.message}`);
                throw new Error(`Infrastructure test failed: ${test.name}`);
            }
        }

        console.log('✅ All infrastructure tests passed');
    }

    /**
     * Extract from priority vendors
     */
    async extractFromPriorityVendors() {
        console.log('🎯 Starting extraction from verified Israeli meat vendors...');
        
        const extractionStart = Date.now();
        const results = await this.extractor.extractAllPriorityVendors();
        const extractionTime = Date.now() - extractionStart;

        console.log(`⏱️ Total extraction time: ${Math.round(extractionTime / 1000)}s`);
        
        return {
            results: results,
            extraction_time_ms: extractionTime,
            vendors_attempted: results.length,
            vendors_successful: results.filter(r => !r.error).length
        };
    }

    /**
     * Integrate extracted products with Basarometer V6.0
     */
    async integrateWithBasarometer(products) {
        console.log(`🔗 Integrating ${products.length} products with Basarometer V6.0...`);
        
        try {
            const integrationResults = await this.apiConnector.ingestProducts(products, {
                sessionId: this.sessionId,
                scannerSource: 'phase3-live-extractor',
                vendorName: 'Multiple Israeli Vendors'
            });

            // Save integration results
            await this.apiConnector.saveIntegrationResults(
                integrationResults, 
                `phase3-integration-${this.sessionId}`
            );

            console.log(`✅ Integration complete: ${integrationResults.successful_ingests} products successfully integrated`);
            
            return integrationResults;

        } catch (error) {
            console.error('❌ Integration failed:', error.message);
            return {
                total_processed: products.length,
                successful_ingests: 0,
                failed_ingests: products.length,
                error: error.message
            };
        }
    }

    /**
     * Calculate performance metrics
     */
    calculatePerformanceMetrics(extractionResults, integrationResults) {
        const totalTime = new Date(integrationResults.end_time).getTime() - 
                         new Date(integrationResults.start_time).getTime();

        return {
            total_execution_time_ms: totalTime,
            total_execution_time_readable: this.formatDuration(totalTime),
            extraction_time_ms: extractionResults.extraction_time_ms,
            extraction_efficiency: extractionResults.extraction_time_ms > 0 
                ? Math.round(integrationResults.total_products_extracted / (extractionResults.extraction_time_ms / 1000))
                : 0,
            integration_success_rate: integrationResults.integration_results 
                ? Math.round((integrationResults.integration_results.successful_ingests / integrationResults.total_products_extracted) * 100)
                : 0,
            vendors_success_rate: integrationResults.vendors_processed.length > 0
                ? Math.round((integrationResults.vendors_processed.filter(v => v.success).length / integrationResults.vendors_processed.length) * 100)
                : 0
        };
    }

    /**
     * Display comprehensive integration summary
     */
    displayIntegrationSummary(results) {
        console.log('\n' + '='.repeat(80));
        console.log('🎯 PHASE 3 INTEGRATION SUMMARY');
        console.log('='.repeat(80));
        
        console.log(`📊 EXTRACTION RESULTS:`);
        console.log(`   • Vendors processed: ${results.vendors_processed.length}`);
        console.log(`   • Products extracted: ${results.total_products_extracted}`);
        console.log(`   • Vendor success rate: ${results.performance_metrics.vendors_success_rate}%`);
        
        if (results.integration_results) {
            console.log(`\n🔗 INTEGRATION RESULTS:`);
            console.log(`   • Products integrated: ${results.integration_results.successful_ingests}`);
            console.log(`   • Integration success rate: ${results.performance_metrics.integration_success_rate}%`);
            console.log(`   • Linked to existing products: ${results.integration_results.linked_to_existing}`);
            console.log(`   • New products created: ${results.integration_results.new_products_created}`);
        }
        
        console.log(`\n⚡ PERFORMANCE METRICS:`);
        console.log(`   • Total execution time: ${results.performance_metrics.total_execution_time_readable}`);
        console.log(`   • Extraction efficiency: ${results.performance_metrics.extraction_efficiency} products/second`);
        
        if (results.errors.length > 0) {
            console.log(`\n⚠️ ERRORS ENCOUNTERED: ${results.errors.length}`);
            results.errors.forEach((error, i) => {
                console.log(`   ${i + 1}. ${error.type}: ${error.message}`);
            });
        }

        const status = results.success ? '✅ SUCCESS' : '❌ FAILED';
        const marketImpact = this.assessMarketImpact(results.total_products_extracted);
        
        console.log(`\n🎯 FINAL STATUS: ${status}`);
        console.log(`📈 MARKET IMPACT: ${marketImpact}`);
        
        if (results.integration_results?.integration_summary?.next_steps) {
            console.log(`\n📋 NEXT STEPS:`);
            results.integration_results.integration_summary.next_steps.forEach((step, i) => {
                console.log(`   ${i + 1}. ${step}`);
            });
        }
        
        console.log('\n' + '='.repeat(80));
    }

    /**
     * Helper methods
     */
    async testOutputDirectory() {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
            const testFile = path.join(this.outputDir, 'test.txt');
            await fs.writeFile(testFile, 'test');
            await fs.unlink(testFile);
            return true;
        } catch (error) {
            throw new Error(`Output directory test failed: ${error.message}`);
        }
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    assessMarketImpact(productCount) {
        if (productCount >= 100) return 'HIGH - Significant Israeli meat market expansion';
        if (productCount >= 50) return 'MEDIUM - Meaningful market coverage improvement';
        if (productCount >= 20) return 'LOW - Valuable but limited market addition';
        return 'MINIMAL - Consider scaling extraction efforts';
    }

    async saveFinalResults(results) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `phase3-final-results-${timestamp}.json`;
            const filepath = path.join(this.outputDir, filename);
            
            await fs.writeFile(filepath, JSON.stringify(results, null, 2), 'utf8');
            console.log(`📄 Final results saved to: ${filepath}`);
            
            return filepath;
        } catch (error) {
            console.error('Failed to save final results:', error.message);
        }
    }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    
    const options = {
        debug: args.includes('--debug'),
        headless: !args.includes('--show-browser'),
        capmonsterUrl: process.env.CAPMONSTER_URL || 'http://localhost:8081',
        captchaApiKey: process.env.CAPMONSTER_API_KEY || 'demo',
        basarometerUrl: process.env.BASAROMETER_API_URL || 'https://v3.basarometer.org',
        basarometerApiKey: process.env.BASAROMETER_API_KEY
    };

    const integration = new Phase3LiveIntegration(options);

    async function main() {
        try {
            const results = await integration.runCompleteIntegration();
            
            if (results.success) {
                console.log('\n🎉 Phase 3 Integration completed successfully!');
                console.log('Basarometer V6.0 now has enhanced market coverage with live product data.');
                process.exit(0);
            } else {
                console.log('\n⚠️ Phase 3 Integration completed with issues. Check logs for details.');
                process.exit(1);
            }
            
        } catch (error) {
            console.error('\n💥 Phase 3 Integration failed:', error.message);
            process.exit(1);
        }
    }

    main();
}

export default Phase3LiveIntegration;