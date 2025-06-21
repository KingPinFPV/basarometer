#!/usr/bin/env node

/**
 * Test Online Meat Platforms Integration
 * Tests the new Israeli online meat delivery platforms
 */

const MultiPlatformScraper = require('./modules/multiPlatformScraper');
const fs = require('fs').promises;
const path = require('path');

class OnlineMeatPlatformTester {
    constructor(options = {}) {
        this.debug = options.debug || false;
        this.maxPlatforms = options.maxPlatforms || 3;
        this.outputDir = './online-platform-tests';
        this.platformConfigs = null;
    }

    async initialize() {
        try {
            // Load platform configurations
            const configPath = path.join(__dirname, 'config', 'online-meat-platforms.json');
            const configData = await fs.readFile(configPath, 'utf8');
            this.platformConfigs = JSON.parse(configData);
            
            // Create output directory
            await fs.mkdir(this.outputDir, { recursive: true });
            
            console.log('🚀 Online Meat Platform Tester initialized');
            console.log(`📋 Found ${Object.keys(this.platformConfigs).length} configured platforms`);
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize tester:', error);
            return false;
        }
    }

    async testAllPlatforms() {
        console.log('🇮🇱 Testing Israeli Online Meat Delivery Platforms...');
        console.log('=' .repeat(60));
        
        const scraper = new MultiPlatformScraper({
            outputDir: this.outputDir,
            debug: this.debug
        });
        
        await scraper.initialize();
        
        const results = [];
        const platformEntries = Object.entries(this.platformConfigs);
        
        // Sort by priority and test top platforms
        const sortedPlatforms = platformEntries
            .sort(([,a], [,b]) => {
                const priorityOrder = { 'very_high': 5, 'high': 4, 'medium': 3, 'low': 2, 'very_low': 1 };
                return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            })
            .slice(0, this.maxPlatforms);
        
        for (const [platformId, config] of sortedPlatforms) {
            console.log(`\n🏪 Testing Platform: ${config.name}`);
            console.log(`🔗 URL: ${config.baseUrl}`);
            console.log(`📊 Expected Products: ${config.expectedProducts || 'Unknown'}`);
            console.log(`⭐ Priority: ${config.priority}`);
            
            try {
                const result = await this.testPlatform(scraper, platformId, config);
                results.push(result);
                
                // Display immediate results
                this.displayPlatformResults(result);
                
            } catch (error) {
                console.error(`❌ Failed to test ${config.name}:`, error.message);
                results.push({
                    platformId,
                    config,
                    error: error.message,
                    successful: false
                });
            }
            
            // Delay between platforms to be respectful
            await this.delay(3000);
        }
        
        // Generate comprehensive report
        await this.generateTestReport(results);
        
        return results;
    }

    async testPlatform(scraper, platformId, config) {
        // Convert config to vendor info format expected by scraper
        const vendorInfo = {
            title: config.name,
            domain: this.extractDomain(config.baseUrl),
            url: config.baseUrl,
            relevanceScore: config.confidence || 0.8,
            analysis: {
                hasOnlineOrdering: true,
                hasDelivery: config.specialFeatures?.deliveryService || 
                             config.specialFeatures?.fastDelivery || 
                             config.specialFeatures?.sameDay || false,
                isKosher: config.specialFeatures?.kosherCertified || 
                         config.specialFeatures?.kosherSpecialty || false
            }
        };
        
        // Test the platform using multi-platform scraper
        const scrapingResult = await scraper.scrapeVendor(vendorInfo);
        
        return {
            platformId,
            config,
            vendorInfo,
            scrapingResult,
            successful: scrapingResult !== null,
            testedAt: new Date().toISOString()
        };
    }

    displayPlatformResults(result) {
        if (!result.successful) {
            console.log('❌ Test failed');
            return;
        }
        
        const scraping = result.scrapingResult.scraping;
        const assessment = result.scrapingResult.assessment;
        
        console.log(`✅ Test completed successfully`);
        console.log(`📦 Products found: ${scraping.productsFound}`);
        console.log(`🎯 Integration viability: ${assessment.integrationViability}`);
        console.log(`📈 Market value: ${assessment.marketValue}`);
        console.log(`⚙️  Integration complexity: ${assessment.integrationComplexity}`);
        console.log(`📊 Estimated daily products: ${assessment.estimatedDailyProducts}`);
        
        if (scraping.products && scraping.products.length > 0) {
            console.log(`\n🥩 Sample Products Found:`);
            scraping.products.slice(0, 3).forEach((product, index) => {
                console.log(`   ${index + 1}. ${product.title}`);
                if (product.price) console.log(`      Price: ${product.price}`);
            });
        }
        
        if (result.scrapingResult.recommendations && result.scrapingResult.recommendations.length > 0) {
            console.log(`\n💡 Recommendations:`);
            result.scrapingResult.recommendations.forEach(rec => {
                console.log(`   • ${rec.message} (${rec.priority})`);
            });
        }
    }

    async generateTestReport(results) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(this.outputDir, `online-platforms-test-report-${timestamp}.json`);
        
        const report = {
            generatedAt: new Date().toISOString(),
            summary: this.generateTestSummary(results),
            platforms: results,
            recommendations: this.generateOverallRecommendations(results),
            nextSteps: this.generateNextSteps(results)
        };
        
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n📋 TEST SUMMARY:');
        console.log('=' .repeat(40));
        console.log(`Total platforms tested: ${results.length}`);
        console.log(`Successful tests: ${results.filter(r => r.successful).length}`);
        console.log(`Failed tests: ${results.filter(r => !r.successful).length}`);
        
        const successfulResults = results.filter(r => r.successful);
        if (successfulResults.length > 0) {
            const totalProducts = successfulResults.reduce((sum, r) => 
                sum + (r.scrapingResult?.scraping?.productsFound || 0), 0);
            console.log(`Total products discovered: ${totalProducts}`);
            
            const highViability = successfulResults.filter(r => 
                r.scrapingResult?.assessment?.integrationViability === 'high').length;
            console.log(`High-viability platforms: ${highViability}`);
        }
        
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        return report;
    }

    generateTestSummary(results) {
        const successful = results.filter(r => r.successful);
        const failed = results.filter(r => !r.successful);
        
        const summary = {
            totalTested: results.length,
            successful: successful.length,
            failed: failed.length,
            totalProductsFound: successful.reduce((sum, r) => 
                sum + (r.scrapingResult?.scraping?.productsFound || 0), 0),
            viabilityBreakdown: {
                high: successful.filter(r => r.scrapingResult?.assessment?.integrationViability === 'high').length,
                medium: successful.filter(r => r.scrapingResult?.assessment?.integrationViability === 'medium').length,
                low: successful.filter(r => r.scrapingResult?.assessment?.integrationViability === 'low').length
            },
            marketValueBreakdown: {
                very_high: successful.filter(r => r.scrapingResult?.assessment?.marketValue === 'very_high').length,
                high: successful.filter(r => r.scrapingResult?.assessment?.marketValue === 'high').length,
                medium: successful.filter(r => r.scrapingResult?.assessment?.marketValue === 'medium').length,
                low: successful.filter(r => r.scrapingResult?.assessment?.marketValue === 'low').length
            }
        };
        
        return summary;
    }

    generateOverallRecommendations(results) {
        const recommendations = [];
        const successful = results.filter(r => r.successful);
        
        // High-priority integration candidates
        const highViability = successful.filter(r => 
            r.scrapingResult?.assessment?.integrationViability === 'high');
        
        if (highViability.length > 0) {
            recommendations.push({
                type: 'immediate_integration',
                priority: 'very_high',
                message: `${highViability.length} platforms ready for immediate integration`,
                platforms: highViability.map(r => ({
                    name: r.config.name,
                    products: r.scrapingResult.scraping.productsFound,
                    viability: r.scrapingResult.assessment.integrationViability
                }))
            });
        }
        
        // Platform diversity
        const platformTypes = new Set(successful.map(r => r.config.type));
        if (platformTypes.size >= 3) {
            recommendations.push({
                type: 'market_coverage',
                priority: 'high',
                message: `Good market diversity with ${platformTypes.size} different platform types`,
                types: Array.from(platformTypes)
            });
        }
        
        // Product volume potential
        const totalProducts = successful.reduce((sum, r) => 
            sum + (r.scrapingResult?.scraping?.productsFound || 0), 0);
        
        if (totalProducts >= 100) {
            recommendations.push({
                type: 'scale_potential',
                priority: 'high',
                message: `High scaling potential with ${totalProducts} products discovered across platforms`
            });
        }
        
        return recommendations;
    }

    generateNextSteps(results) {
        const successful = results.filter(r => r.successful);
        const steps = [];
        
        steps.push({
            step: 1,
            action: 'Integrate high-viability platforms',
            description: 'Add successful platforms to meat-sites.json configuration',
            platforms: successful
                .filter(r => r.scrapingResult?.assessment?.integrationViability === 'high')
                .map(r => r.config.name)
        });
        
        steps.push({
            step: 2,
            action: 'Develop platform-specific selectors',
            description: 'Create custom selectors for each platform based on discovered structure',
            requirement: 'Review scraping results and optimize selectors'
        });
        
        steps.push({
            step: 3,
            action: 'Implement automated scanning',
            description: 'Add platforms to regular scanning schedule',
            target: 'Daily automated scans for integrated platforms'
        });
        
        steps.push({
            step: 4,
            action: 'Monitor and optimize',
            description: 'Track performance and adjust configurations',
            metrics: 'Product count, accuracy, response time'
        });
        
        return steps;
    }

    extractDomain(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch (error) {
            return url;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

async function main() {
    console.log('🇮🇱 Basarometer V6.0 - Online Meat Platforms Testing System');
    console.log('Testing Israeli online meat delivery platforms for integration...\n');
    
    try {
        const args = process.argv.slice(2);
        const debug = args.includes('--debug');
        const maxPlatforms = args.includes('--quick') ? 2 : 3;
        
        const tester = new OnlineMeatPlatformTester({
            debug,
            maxPlatforms
        });
        
        const initialized = await tester.initialize();
        if (!initialized) {
            console.error('❌ Failed to initialize platform tester');
            process.exit(1);
        }
        
        const results = await tester.testAllPlatforms();
        
        console.log('\n🎯 Testing completed!');
        console.log('Check the generated report for detailed integration recommendations.');
        
    } catch (error) {
        console.error('❌ Testing process failed:', error);
        process.exit(1);
    }
}

// Handle command line help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('Online Meat Platforms Testing System');
    console.log('');
    console.log('Usage: node test-online-meat-platforms.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --debug        Run with browser visible for debugging');
    console.log('  --quick        Test only top 2 platforms (faster)');
    console.log('');
    console.log('Examples:');
    console.log('  node test-online-meat-platforms.js');
    console.log('  node test-online-meat-platforms.js --debug');
    console.log('  node test-online-meat-platforms.js --quick');
    process.exit(0);
}

// Run the main function
main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});