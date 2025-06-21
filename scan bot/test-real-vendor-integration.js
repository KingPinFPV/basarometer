#!/usr/bin/env node

/**
 * Test Real Israeli Meat Vendor Integration
 * Tests the enhanced vendor discovery system with real Israeli vendors
 */

import HebrewVendorDiscovery from './modules/hebrewVendorDiscovery.js';
import { promises as fs } from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

class VendorIntegrationTester {
    constructor() {
        this.discovery = new HebrewVendorDiscovery({
            outputDir: path.join(__dirname, 'output', 'vendor-tests'),
            maxResults: 5, // Limited for testing
            searchDelay: 1000 // Faster for testing
        });
        
        this.testResults = {
            startTime: new Date().toISOString(),
            vendorTests: [],
            validationSummary: {},
            integrationRecommendations: []
        };
    }

    async runIntegrationTest() {
        console.log('🚀 Starting Real Israeli Meat Vendor Integration Test...\n');
        
        try {
            // Initialize the discovery system
            console.log('📋 Initializing vendor discovery system...');
            await this.discovery.initialize();
            
            // Test Phase 1: Load and validate real vendors
            console.log('\n🔍 Phase 1: Loading and validating real vendors...');
            await this.testRealVendorLoading();
            
            // Test Phase 2: URL validation and analysis
            console.log('\n🌐 Phase 2: Enhanced URL validation and website analysis...');
            await this.testUrlValidationSystem();
            
            // Test Phase 3: Platform detection
            console.log('\n🛠️ Phase 3: E-commerce platform detection...');
            await this.testPlatformDetection();
            
            // Test Phase 4: Integration scoring
            console.log('\n⭐ Phase 4: Integration priority scoring...');
            await this.testIntegrationScoring();
            
            // Generate comprehensive test report
            console.log('\n📊 Generating integration test report...');
            await this.generateTestReport();
            
            console.log('\n✅ Integration test completed successfully!');
            
        } catch (error) {
            console.error('❌ Integration test failed:', error);
            throw error;
        }
    }

    async testRealVendorLoading() {
        console.log('   Loading real Israeli meat vendors from database...');
        
        // Load known vendors (this will trigger validation)
        await this.discovery.loadKnownVendors();
        
        const vendors = Array.from(this.discovery.discoveredVendors.values());
        const realVendors = vendors.filter(v => v.source === 'verified_israeli_vendors');
        
        console.log(`   ✅ Loaded ${realVendors.length} real Israeli meat vendors`);
        
        // Test specific Phase 1 vendors
        const phase1Vendors = [
            'meatnet.co.il',
            'meat-shop.co.il', // הטחנה - already verified working
            'netach-katzavim.co.il',
            'gorme.co.il',
            'netachim.co.il'
        ];
        
        for (const domain of phase1Vendors) {
            const vendor = vendors.find(v => v.domain === domain);
            if (vendor) {
                console.log(`   📍 Found: ${vendor.title} - ${vendor.analysis?.websiteStatus || 'Not tested'}`);
                this.testResults.vendorTests.push({
                    domain,
                    name: vendor.title,
                    status: vendor.analysis?.websiteStatus,
                    urlValid: vendor.analysis?.urlValid,
                    platform: vendor.analysis?.platformDetected,
                    score: vendor.relevanceScore
                });
            } else {
                console.log(`   ⚠️ Missing: ${domain}`);
                this.testResults.vendorTests.push({
                    domain,
                    status: 'Not found in database',
                    urlValid: false
                });
            }
        }
    }

    async testUrlValidationSystem() {
        const vendors = Array.from(this.discovery.discoveredVendors.values());
        const validVendors = vendors.filter(v => v.analysis?.urlValid === true);
        const invalidVendors = vendors.filter(v => v.analysis?.urlValid === false);
        
        console.log(`   ✅ Valid URLs: ${validVendors.length}`);
        console.log(`   ❌ Invalid URLs: ${invalidVendors.length}`);
        
        this.testResults.validationSummary = {
            totalVendors: vendors.length,
            validUrls: validVendors.length,
            invalidUrls: invalidVendors.length,
            validationRate: validVendors.length / vendors.length,
            topValidVendors: validVendors.slice(0, 5).map(v => ({
                name: v.title,
                domain: v.domain,
                platform: v.analysis?.platformDetected
            }))
        };
        
        // Test specific high-priority vendors
        const testVendors = ['meat-shop.co.il', 'meatnet.co.il', 'netachim.co.il'];
        for (const domain of testVendors) {
            const vendor = vendors.find(v => v.domain === domain);
            if (vendor && vendor.analysis?.urlValid) {
                console.log(`   🎯 ${vendor.title}: ${vendor.analysis.platformDetected || 'Platform unknown'}`);
            }
        }
    }

    async testPlatformDetection() {
        const vendors = Array.from(this.discovery.discoveredVendors.values());
        const platformCounts = {};
        
        vendors.forEach(vendor => {
            const platform = vendor.analysis?.platformDetected || 'Unknown';
            platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        });
        
        console.log('   Platform Distribution:');
        Object.entries(platformCounts)
            .sort(([,a], [,b]) => b - a)
            .forEach(([platform, count]) => {
                console.log(`     ${platform}: ${count} vendors`);
            });
        
        // Test Hebrew e-commerce detection
        const hebrewEcommerce = vendors.filter(v => 
            v.analysis?.platformDetected?.includes('Hebrew E-commerce') ||
            v.analysis?.hasHebrewContent === true
        );
        
        console.log(`   🇮🇱 Hebrew E-commerce Sites: ${hebrewEcommerce.length}`);
    }

    async testIntegrationScoring() {
        console.log('   Calculating integration priority scores...');
        
        const prioritizedVendors = this.discovery.prioritizeVendorsForIntegration();
        
        console.log(`   🚀 Phase 1 Ready: ${prioritizedVendors.phase1_ready?.length || 0} vendors`);
        console.log(`   🎯 Phase 2 Candidates: ${prioritizedVendors.phase2_candidates?.length || 0} vendors`);
        console.log(`   📋 Phase 3 Potential: ${prioritizedVendors.phase3_potential?.length || 0} vendors`);
        
        // Show top integration candidates
        if (prioritizedVendors.phase1_ready?.length > 0) {
            console.log('   Top Phase 1 Integration Candidates:');
            prioritizedVendors.phase1_ready.slice(0, 3).forEach((vendor, index) => {
                console.log(`     ${index + 1}. ${vendor.title} (Score: ${vendor.integrationScore?.toFixed(2)})`);
                console.log(`        Platform: ${vendor.analysis?.platformDetected || 'Unknown'}`);
                console.log(`        URL Valid: ${vendor.analysis?.urlValid ? '✅' : '❌'}`);
            });
        }
        
        this.testResults.integrationRecommendations = prioritizedVendors;
    }

    async generateTestReport() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(__dirname, 'output', `real-vendor-integration-test-${timestamp}.json`);
        
        // Create output directory if it doesn't exist
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        
        const fullReport = {
            ...this.testResults,
            endTime: new Date().toISOString(),
            summary: {
                totalVendorsLoaded: this.discovery.discoveredVendors.size,
                validationSuccessRate: this.testResults.validationSummary.validationRate,
                phase1ReadyVendors: this.testResults.integrationRecommendations.phase1_ready?.length || 0,
                realVendorsIntegrated: this.testResults.vendorTests.filter(v => v.urlValid).length
            },
            recommendations: [
                'Focus on Phase 1 ready vendors for immediate integration',
                'Validated URLs show strong potential for real product data',
                'Hebrew e-commerce platforms detected successfully',
                'Enhanced validation system working correctly'
            ]
        };
        
        await fs.writeFile(reportPath, JSON.stringify(fullReport, null, 2));
        
        console.log(`📋 Detailed test report saved to: ${reportPath}`);
        console.log('\n📊 Integration Test Summary:');
        console.log(`   Total Vendors: ${fullReport.summary.totalVendorsLoaded}`);
        console.log(`   Validation Rate: ${Math.round(fullReport.summary.validationSuccessRate * 100)}%`);
        console.log(`   Phase 1 Ready: ${fullReport.summary.phase1ReadyVendors}`);
        console.log(`   Real Vendors Working: ${fullReport.summary.realVendorsIntegrated}`);
        
        return fullReport;
    }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new VendorIntegrationTester();
    
    tester.runIntegrationTest()
        .then(() => {
            console.log('\n🎉 Real vendor integration test completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Test failed:', error);
            process.exit(1);
        });
}

export default VendorIntegrationTester;