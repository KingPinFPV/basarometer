#!/usr/bin/env node

/**
 * Integration Script for Online Meat Platforms
 * Merges new online meat delivery platforms into the existing meat-sites.json configuration
 */

const fs = require('fs').promises;
const path = require('path');

class OnlinePlatformIntegrator {
    constructor() {
        this.meatSitesPath = path.join(__dirname, 'config', 'meat-sites.json');
        this.onlinePlatformsPath = path.join(__dirname, 'config', 'online-meat-platforms.json');
        this.backupPath = path.join(__dirname, 'backups', `meat-sites-backup-${Date.now()}.json`);
    }

    async integrate() {
        console.log('🔧 Basarometer V6.0 - Online Meat Platforms Integration');
        console.log('=' .repeat(60));
        
        try {
            // Load existing configurations
            console.log('📂 Loading existing configurations...');
            const existingConfig = await this.loadExistingConfig();
            const onlinePlatforms = await this.loadOnlinePlatforms();
            
            // Create backup
            console.log('💾 Creating backup of existing configuration...');
            await this.createBackup(existingConfig);
            
            // Merge configurations
            console.log('🔄 Merging online platforms with existing configuration...');
            const mergedConfig = await this.mergeConfigurations(existingConfig, onlinePlatforms);
            
            // Validate merged configuration
            console.log('✅ Validating merged configuration...');
            const validation = this.validateConfiguration(mergedConfig);
            
            if (!validation.valid) {
                throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Save merged configuration
            console.log('💾 Saving merged configuration...');
            await this.saveMergedConfiguration(mergedConfig);
            
            // Generate integration report
            console.log('📋 Generating integration report...');
            const report = await this.generateIntegrationReport(existingConfig, mergedConfig);
            
            console.log('\n✅ Integration completed successfully!');
            this.displayIntegrationSummary(report);
            
            return report;
            
        } catch (error) {
            console.error('❌ Integration failed:', error.message);
            throw error;
        }
    }

    async loadExistingConfig() {
        try {
            const data = await fs.readFile(this.meatSitesPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            throw new Error(`Failed to load existing meat-sites.json: ${error.message}`);
        }
    }

    async loadOnlinePlatforms() {
        try {
            const data = await fs.readFile(this.onlinePlatformsPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            throw new Error(`Failed to load online-meat-platforms.json: ${error.message}`);
        }
    }

    async createBackup(config) {
        try {
            await fs.mkdir(path.dirname(this.backupPath), { recursive: true });
            await fs.writeFile(this.backupPath, JSON.stringify(config, null, 2));
            console.log(`   Backup saved to: ${this.backupPath}`);
        } catch (error) {
            throw new Error(`Failed to create backup: ${error.message}`);
        }
    }

    async mergeConfigurations(existingConfig, onlinePlatforms) {
        const merged = { ...existingConfig };
        
        // Convert online platform configs to meat-sites format
        for (const [platformId, platformConfig] of Object.entries(onlinePlatforms)) {
            // Skip if already exists (avoid overwriting)
            if (merged[platformId]) {
                console.log(`   ⚠️  Skipping ${platformId} - already exists in configuration`);
                continue;
            }
            
            // Convert to meat-sites format
            const convertedConfig = this.convertToMeatSitesFormat(platformConfig);
            merged[platformId] = convertedConfig;
            
            console.log(`   ✅ Added ${platformConfig.name} (${platformId})`);
        }
        
        return merged;
    }

    convertToMeatSitesFormat(platformConfig) {
        // Convert online platform config to the standard meat-sites.json format
        return {
            name: platformConfig.name,
            baseUrl: platformConfig.baseUrl,
            type: platformConfig.type || 'online_meat_delivery',
            meatCategories: platformConfig.meatCategories || [],
            selectors: platformConfig.selectors || {},
            waitSelectors: platformConfig.waitSelectors || [
                platformConfig.selectors?.productContainer || '.product',
                'body'
            ],
            rateLimit: platformConfig.rateLimit || 3000,
            maxPages: platformConfig.maxPages || 5,
            hebrewMeatKeywords: platformConfig.hebrewMeatKeywords || [
                "בשר", "עוף", "בקר", "כבש", "עגל", "טלה", "הודו",
                "קצביה", "אנטריקוט", "פילה", "סטייק", "שניצל"
            ],
            confidence: platformConfig.confidence || 0.8,
            expectedProducts: platformConfig.expectedProducts || 50,
            specialFeatures: platformConfig.specialFeatures || {},
            premiumFeatures: platformConfig.premiumFeatures || {},
            priority: platformConfig.priority || 'medium',
            user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            headers: {
                "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Cache-Control": "no-cache",
                "Referer": platformConfig.baseUrl
            },
            // Mark as online platform for special handling
            platformType: 'online_delivery',
            integrationSource: 'online-meat-platforms',
            integratedAt: new Date().toISOString()
        };
    }

    validateConfiguration(config) {
        const errors = [];
        const warnings = [];
        
        for (const [siteId, siteConfig] of Object.entries(config)) {
            // Required fields validation
            if (!siteConfig.name) {
                errors.push(`${siteId}: Missing 'name' field`);
            }
            
            if (!siteConfig.baseUrl) {
                errors.push(`${siteId}: Missing 'baseUrl' field`);
            }
            
            if (!siteConfig.selectors) {
                errors.push(`${siteId}: Missing 'selectors' field`);
            } else {
                // Validate essential selectors
                if (!siteConfig.selectors.productContainer) {
                    warnings.push(`${siteId}: Missing 'productContainer' selector`);
                }
                if (!siteConfig.selectors.productName) {
                    warnings.push(`${siteId}: Missing 'productName' selector`);
                }
                if (!siteConfig.selectors.productPrice) {
                    warnings.push(`${siteId}: Missing 'productPrice' selector`);
                }
            }
            
            // URL validation
            if (siteConfig.baseUrl && !this.isValidUrl(siteConfig.baseUrl)) {
                errors.push(`${siteId}: Invalid baseUrl format`);
            }
            
            // Rate limit validation
            if (siteConfig.rateLimit && siteConfig.rateLimit < 1000) {
                warnings.push(`${siteId}: Rate limit ${siteConfig.rateLimit}ms might be too aggressive`);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors,
            warnings,
            totalSites: Object.keys(config).length
        };
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    async saveMergedConfiguration(config) {
        try {
            await fs.writeFile(this.meatSitesPath, JSON.stringify(config, null, 2));
            console.log(`   Configuration saved to: ${this.meatSitesPath}`);
        } catch (error) {
            throw new Error(`Failed to save merged configuration: ${error.message}`);
        }
    }

    async generateIntegrationReport(originalConfig, mergedConfig) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(__dirname, 'integration-reports', `online-platforms-integration-${timestamp}.json`);
        
        const originalSites = Object.keys(originalConfig);
        const mergedSites = Object.keys(mergedConfig);
        const newSites = mergedSites.filter(site => !originalSites.includes(site));
        
        const report = {
            integrationDate: new Date().toISOString(),
            summary: {
                originalSitesCount: originalSites.length,
                newSitesAdded: newSites.length,
                totalSitesAfterMerge: mergedSites.length,
                integrationSuccess: true
            },
            originalSites: originalSites,
            newSitesAdded: newSites.map(siteId => ({
                id: siteId,
                name: mergedConfig[siteId].name,
                type: mergedConfig[siteId].type,
                baseUrl: mergedConfig[siteId].baseUrl,
                expectedProducts: mergedConfig[siteId].expectedProducts,
                priority: mergedConfig[siteId].priority
            })),
            totalSitesAfterMerge: mergedSites,
            expectedTotalProducts: this.calculateExpectedProducts(mergedConfig),
            marketCoverage: this.analyzeMarketCoverage(mergedConfig),
            recommendations: this.generateRecommendations(mergedConfig)
        };
        
        // Save report
        try {
            await fs.mkdir(path.dirname(reportPath), { recursive: true });
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            console.log(`   Integration report saved to: ${reportPath}`);
        } catch (error) {
            console.warn(`   Warning: Could not save integration report: ${error.message}`);
        }
        
        return report;
    }

    calculateExpectedProducts(config) {
        return Object.values(config).reduce((total, siteConfig) => {
            return total + (siteConfig.expectedProducts || 30);
        }, 0);
    }

    analyzeMarketCoverage(config) {
        const coverage = {
            totalVendors: Object.keys(config).length,
            byType: {},
            byPriority: {},
            onlineDelivery: 0,
            traditionalSupermarkets: 0,
            specialtyStores: 0
        };
        
        for (const siteConfig of Object.values(config)) {
            // Count by type
            const type = siteConfig.type || siteConfig.platformType || 'traditional';
            coverage.byType[type] = (coverage.byType[type] || 0) + 1;
            
            // Count by priority
            const priority = siteConfig.priority || 'medium';
            coverage.byPriority[priority] = (coverage.byPriority[priority] || 0) + 1;
            
            // Count by category
            if (type.includes('online') || siteConfig.platformType === 'online_delivery') {
                coverage.onlineDelivery++;
            } else if (type.includes('specialty') || siteConfig.specialFeatures) {
                coverage.specialtyStores++;
            } else {
                coverage.traditionalSupermarkets++;
            }
        }
        
        return coverage;
    }

    generateRecommendations(config) {
        const recommendations = [];
        
        const onlinePlatforms = Object.values(config).filter(site => 
            site.platformType === 'online_delivery' || site.type?.includes('online'));
        
        if (onlinePlatforms.length >= 3) {
            recommendations.push({
                type: 'testing_priority',
                message: `With ${onlinePlatforms.length} online platforms added, prioritize testing and optimization`,
                action: 'Run test-online-meat-platforms.js to validate integrations'
            });
        }
        
        const highPriorityPlatforms = Object.values(config).filter(site => 
            site.priority === 'very_high' || site.priority === 'high');
        
        if (highPriorityPlatforms.length >= 5) {
            recommendations.push({
                type: 'scaling_readiness',
                message: `${highPriorityPlatforms.length} high-priority platforms ready for production scaling`,
                action: 'Consider implementing automated daily scanning schedule'
            });
        }
        
        const expectedTotal = this.calculateExpectedProducts(config);
        if (expectedTotal >= 500) {
            recommendations.push({
                type: 'infrastructure_scaling',
                message: `Expected ${expectedTotal} products requires infrastructure scaling`,
                action: 'Review database capacity and scanning performance optimization'
            });
        }
        
        return recommendations;
    }

    displayIntegrationSummary(report) {
        console.log('\n📊 INTEGRATION SUMMARY:');
        console.log('=' .repeat(40));
        console.log(`Original sites: ${report.summary.originalSitesCount}`);
        console.log(`New sites added: ${report.summary.newSitesAdded}`);
        console.log(`Total sites after merge: ${report.summary.totalSitesAfterMerge}`);
        console.log(`Expected total products: ${report.expectedTotalProducts}`);
        
        if (report.newSitesAdded.length > 0) {
            console.log('\n🆕 NEW PLATFORMS ADDED:');
            report.newSitesAdded.forEach(site => {
                console.log(`   • ${site.name} (${site.type}) - ${site.expectedProducts} products expected`);
            });
        }
        
        console.log('\n🎯 MARKET COVERAGE:');
        console.log(`   Online delivery platforms: ${report.marketCoverage.onlineDelivery}`);
        console.log(`   Traditional supermarkets: ${report.marketCoverage.traditionalSupermarkets}`);
        console.log(`   Specialty stores: ${report.marketCoverage.specialtyStores}`);
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            report.recommendations.forEach(rec => {
                console.log(`   • ${rec.message}`);
                console.log(`     Action: ${rec.action}`);
            });
        }
        
        console.log('\n🚀 NEXT STEPS:');
        console.log('   1. Run test-online-meat-platforms.js to validate new integrations');
        console.log('   2. Test individual platforms with basarometer-scanner.js');
        console.log('   3. Monitor performance and adjust rate limits as needed');
        console.log('   4. Consider scaling to daily automated scans');
    }
}

async function main() {
    try {
        const integrator = new OnlinePlatformIntegrator();
        await integrator.integrate();
        
        console.log('\n✅ Integration process completed successfully!');
        console.log('Your Basarometer scanner now includes Israeli online meat delivery platforms.');
        
    } catch (error) {
        console.error('\n❌ Integration process failed:', error.message);
        process.exit(1);
    }
}

// Handle command line help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('Online Meat Platforms Integration Tool');
    console.log('');
    console.log('Usage: node integrate-online-platforms.js');
    console.log('');
    console.log('This script merges the online meat delivery platforms configuration');
    console.log('into the existing meat-sites.json file for the Basarometer scanner.');
    console.log('');
    console.log('Features:');
    console.log('  • Automatic backup of existing configuration');
    console.log('  • Validation of merged configuration');
    console.log('  • Integration report generation');
    console.log('  • Market coverage analysis');
    process.exit(0);
}

// Run the main function
main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});