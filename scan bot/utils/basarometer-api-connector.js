import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Connect extracted product data to the existing Basarometer V6.0 comparison system
 * Integrates with the enterprise-grade UI and database infrastructure
 */
class BasarometerAPIConnector {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || process.env.BASAROMETER_API_URL || 'https://v3.basarometer.org';
        this.apiKey = options.apiKey || process.env.BASAROMETER_API_KEY;
        this.timeout = options.timeout || 30000;
        this.retryAttempts = options.retryAttempts || 3;
        this.outputDir = options.outputDir || './output';
    }

    /**
     * Ingest extracted products into the Basarometer V6.0 system
     */
    async ingestProducts(products, options = {}) {
        if (!products || products.length === 0) {
            throw new Error('No products provided for ingestion');
        }

        console.log(`🔗 Connecting ${products.length} products to Basarometer V6.0...`);

        try {
            // Transform products to match V6.0 API schema
            const transformedProducts = this.transformProductsForAPI(products, options);
            
            // Batch products for optimal API performance
            const batches = this.createBatches(transformedProducts, 20);
            
            const results = {
                total_processed: 0,
                successful_ingests: 0,
                failed_ingests: 0,
                linked_to_existing: 0,
                new_products_created: 0,
                errors: [],
                integration_summary: null
            };

            // Process each batch
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} products)...`);

                try {
                    const batchResult = await this.ingestBatch(batch);
                    
                    results.total_processed += batch.length;
                    results.successful_ingests += batchResult.successful || 0;
                    results.failed_ingests += batchResult.failed || 0;
                    results.linked_to_existing += batchResult.linked || 0;
                    results.new_products_created += batchResult.created || 0;

                    if (batchResult.errors) {
                        results.errors.push(...batchResult.errors);
                    }

                    // Small delay between batches to respect API limits
                    if (i < batches.length - 1) {
                        await this.sleep(1000);
                    }

                } catch (batchError) {
                    console.error(`❌ Batch ${i + 1} failed:`, batchError.message);
                    results.failed_ingests += batch.length;
                    results.errors.push({
                        batch: i + 1,
                        error: batchError.message,
                        products_affected: batch.length
                    });
                }
            }

            // Generate integration summary
            results.integration_summary = await this.generateIntegrationSummary(results);

            console.log(`✅ Integration complete: ${results.successful_ingests}/${results.total_processed} products`);
            return results;

        } catch (error) {
            console.error('❌ Failed to ingest products:', error.message);
            throw error;
        }
    }

    /**
     * Transform extracted products to match Basarometer V6.0 API schema
     */
    transformProductsForAPI(products, options = {}) {
        return products.map((product, index) => {
            const processed = product.processed || {};
            
            return {
                // Core identification
                external_id: `scan_${Date.now()}_${index}`,
                name_hebrew: processed.normalizedName || product.name || '',
                name_english: this.translateToEnglish(processed.normalizedName || product.name),
                
                // Price information
                price: this.parsePrice(product.price),
                price_per_kg: processed.pricePerKg || null,
                unit_info: processed.unit || null,
                
                // Product classification
                category: this.mapCategory(processed.category || processed.detectedMeat),
                meat_type: processed.detectedMeat || null,
                cut_name: processed.cut?.name || null,
                cut_category: processed.cut?.category || null,
                
                // Quality and brand
                quality_grade: processed.qualityGrade || 'standard',
                brand: processed.brand || null,
                
                // Vendor information
                vendor_name: options.vendorName || 'Unknown',
                vendor_url: product.url || '',
                
                // Confidence and metadata
                confidence_score: processed.confidence || 0,
                extraction_method: 'live_scraping_with_captcha_solving',
                extracted_at: new Date().toISOString(),
                
                // Scanner integration fields
                scanner_source: options.scannerSource || 'live-product-extractor',
                scan_session_id: options.sessionId || `session_${Date.now()}`,
                
                // Original data for debugging
                raw_data: {
                    original_name: product.name,
                    original_price: product.price,
                    extraction_metadata: processed
                }
            };
        });
    }

    /**
     * Ingest a batch of products via the V6.0 API
     */
    async ingestBatch(products) {
        const endpoint = `${this.baseUrl}/api/scanner/ingest`;
        
        try {
            const response = await axios.post(endpoint, {
                products: products,
                batch_metadata: {
                    batch_size: products.length,
                    extraction_timestamp: new Date().toISOString(),
                    api_version: 'v6.0',
                    integration_source: 'live-product-extractor'
                }
            }, {
                timeout: this.timeout,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Basarometer-Live-Extractor/1.0',
                    ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
                }
            });

            if (response.status === 200 && response.data) {
                return {
                    successful: response.data.successful_ingests || products.length,
                    failed: response.data.failed_ingests || 0,
                    linked: response.data.linked_to_existing || 0,
                    created: response.data.new_products_created || 0,
                    errors: response.data.errors || []
                };
            } else {
                throw new Error(`Unexpected API response: ${response.status}`);
            }

        } catch (error) {
            if (error.response) {
                console.error(`API Error ${error.response.status}:`, error.response.data);
                throw new Error(`API ingestion failed: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
            } else if (error.request) {
                throw new Error('Network error: Unable to reach Basarometer API');
            } else {
                throw error;
            }
        }
    }

    /**
     * Retrieve comparison data for integrated products
     */
    async getComparisonData(options = {}) {
        const endpoint = `${this.baseUrl}/api/products/comparison`;
        
        try {
            const response = await axios.get(endpoint, {
                params: {
                    include_scanner_data: true,
                    min_confidence: options.minConfidence || 0.6,
                    categories: options.categories?.join(','),
                    vendors: options.vendors?.join(','),
                    limit: options.limit || 100
                },
                timeout: this.timeout,
                headers: {
                    ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
                }
            });

            return response.data;

        } catch (error) {
            console.error('Failed to retrieve comparison data:', error.message);
            throw error;
        }
    }

    /**
     * Link extracted products to existing meat cuts in the database
     */
    async linkToExistingMeatCuts(products) {
        const endpoint = `${this.baseUrl}/api/products/auto-link`;
        
        try {
            const response = await axios.post(endpoint, {
                products: products.map(p => ({
                    name_hebrew: p.name_hebrew,
                    category: p.category,
                    cut_name: p.cut_name,
                    meat_type: p.meat_type,
                    confidence_score: p.confidence_score
                }))
            }, {
                timeout: this.timeout,
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
                }
            });

            return response.data.links || [];

        } catch (error) {
            console.warn('Auto-linking failed, proceeding without links:', error.message);
            return [];
        }
    }

    /**
     * Generate integration summary and analytics
     */
    async generateIntegrationSummary(results) {
        const successRate = results.total_processed > 0 
            ? Math.round((results.successful_ingests / results.total_processed) * 100) 
            : 0;

        return {
            success_rate: successRate,
            integration_quality: this.assessIntegrationQuality(successRate, results),
            market_coverage_impact: this.estimateMarketImpact(results),
            next_steps: this.generateNextSteps(results),
            api_performance: {
                total_batches: Math.ceil(results.total_processed / 20),
                average_batch_success: successRate,
                error_rate: Math.round((results.failed_ingests / results.total_processed) * 100)
            }
        };
    }

    /**
     * Helper methods
     */
    createBatches(array, batchSize) {
        const batches = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }

    parsePrice(priceText) {
        if (!priceText) return null;
        const match = priceText.match(/(\d+\.?\d*)/);
        return match ? parseFloat(match[1]) : null;
    }

    mapCategory(extractedCategory) {
        if (!extractedCategory) return 'לא מזוהה';
        
        const categoryMap = {
            'בקר': 'בשר בקר',
            'עוף': 'עוף',
            'כבש': 'בשר כבש',
            'עגל': 'בשר עגל',
            'הודו': 'הודו',
            'beef': 'בשר בקר',
            'chicken': 'עוף',
            'lamb': 'בשר כבש',
            'veal': 'בשר עגל',
            'turkey': 'הודו'
        };

        return categoryMap[extractedCategory] || extractedCategory;
    }

    translateToEnglish(hebrewText) {
        if (!hebrewText) return '';
        
        // Basic Hebrew to English mapping for common meat terms
        const translations = {
            'אנטריקוט': 'Entrecote',
            'רוסטביף': 'Roast Beef',
            'סטייק': 'Steak',
            'שניצל': 'Schnitzel',
            'כתף': 'Shoulder',
            'ירך': 'Thigh',
            'חזה': 'Breast',
            'כנף': 'Wing',
            'בקר': 'Beef',
            'עוף': 'Chicken',
            'כבש': 'Lamb',
            'עגל': 'Veal'
        };

        let result = hebrewText;
        Object.entries(translations).forEach(([hebrew, english]) => {
            result = result.replace(new RegExp(hebrew, 'g'), english);
        });

        return result;
    }

    assessIntegrationQuality(successRate, results) {
        if (successRate >= 90) return 'Excellent';
        if (successRate >= 75) return 'Good';
        if (successRate >= 60) return 'Fair';
        return 'Needs Improvement';
    }

    estimateMarketImpact(results) {
        const totalProducts = results.successful_ingests;
        if (totalProducts >= 100) return 'High - Significant market coverage improvement';
        if (totalProducts >= 50) return 'Medium - Moderate market expansion';
        if (totalProducts >= 20) return 'Low - Limited but valuable addition';
        return 'Minimal - Consider scaling extraction';
    }

    generateNextSteps(results) {
        const steps = [];
        
        if (results.success_rate < 75) {
            steps.push('Improve extraction selectors to increase success rate');
        }
        
        if (results.linked_to_existing < results.successful_ingests * 0.5) {
            steps.push('Enhance auto-linking algorithm for better product matching');
        }
        
        if (results.errors.length > 0) {
            steps.push('Review and resolve extraction errors for failed products');
        }
        
        steps.push('Monitor price changes and update comparison data regularly');
        steps.push('Expand to additional vendor sites for broader market coverage');
        
        return steps;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Save integration results for analysis
     */
    async saveIntegrationResults(results, filename = 'integration-results') {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filepath = path.join(this.outputDir, `${filename}-${timestamp}.json`);
            
            await fs.writeFile(filepath, JSON.stringify(results, null, 2), 'utf8');
            console.log(`💾 Integration results saved to ${filepath}`);
            
            return filepath;
        } catch (error) {
            console.error('Failed to save integration results:', error.message);
        }
    }

    /**
     * Test API connectivity
     */
    async testConnection() {
        try {
            console.log(`🔍 Testing connection to ${this.baseUrl}...`);
            
            const response = await axios.get(`${this.baseUrl}/api/health`, {
                timeout: 10000,
                headers: {
                    ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
                }
            });

            if (response.status === 200) {
                console.log('✅ Basarometer V6.0 API connection successful');
                return true;
            } else {
                console.log(`⚠️ Unexpected response: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.error('❌ API connection failed:', error.message);
            return false;
        }
    }
}

export default BasarometerAPIConnector;