#!/usr/bin/env node

/**
 * Israeli Meat Vendor Discovery Runner
 * Discovers and analyzes meat vendors across the Israeli market ecosystem
 */

const HebrewVendorDiscovery = require('./modules/hebrewVendorDiscovery');
const fs = require('fs').promises;
const path = require('path');

async function main() {
    console.log('🇮🇱 Basarometer V6.0 - Israeli Meat Market Discovery System');
    console.log('=' .repeat(60));
    
    try {
        // Initialize discovery system
        const discovery = new HebrewVendorDiscovery({
            outputDir: './discovered-vendors',
            maxResults: 20,
            searchDelay: 2000
        });
        
        const initialized = await discovery.initialize();
        if (!initialized) {
            console.error('❌ Failed to initialize discovery system');
            process.exit(1);
        }
        
        // Run comprehensive vendor discovery
        console.log('🚀 Starting comprehensive Israeli meat vendor discovery...');
        console.log('This will search for:');
        console.log('  📦 Online meat delivery platforms');
        console.log('  🏪 Local butcher shops');
        console.log('  🥩 Specialty meat stores');
        console.log('  🏬 Supermarket chains');
        console.log('  🏭 Wholesale suppliers');
        console.log('');
        
        const startTime = Date.now();
        await discovery.discoverVendors();
        const endTime = Date.now();
        
        const duration = Math.round((endTime - startTime) / 1000);
        console.log('');
        console.log('✅ Discovery process completed!');
        console.log(`⏱️  Total time: ${duration} seconds`);
        console.log('');
        
        // Display summary
        const analysis = discovery.analysis;
        if (analysis) {
            console.log('📊 DISCOVERY SUMMARY:');
            console.log(`   Total vendors discovered: ${analysis.totalVendors}`);
            console.log(`   High-relevance vendors: ${analysis.highRelevance}`);
            console.log(`   Online-capable vendors: ${analysis.onlineCapable}`);
            console.log(`   With delivery service: ${analysis.withDelivery}`);
            console.log(`   Kosher certified: ${analysis.kosherCertified}`);
            console.log('');
            
            console.log('🏷️  VENDOR TYPES:');
            Object.entries(analysis.byType).forEach(([type, count]) => {
                console.log(`   ${type.replace(/_/g, ' ')}: ${count}`);
            });
            console.log('');
            
            if (Object.keys(analysis.byLocation).length > 0) {
                console.log('🗺️  TOP LOCATIONS:');
                Object.entries(analysis.byLocation)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .forEach(([location, count]) => {
                        console.log(`   ${location}: ${count} vendors`);
                    });
                console.log('');
            }
        }
        
        // Show next steps
        console.log('🎯 NEXT STEPS:');
        console.log('1. Review the generated vendor discovery report');
        console.log('2. Check the priority vendors list for immediate integration');
        console.log('3. Use the multi-platform scraping system for selected vendors');
        console.log('4. Expand the meat-sites.json configuration with new vendors');
        console.log('');
        console.log('📁 Files generated in: ./discovered-vendors/');
        
    } catch (error) {
        console.error('❌ Discovery process failed:', error);
        process.exit(1);
    }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log('Israeli Meat Vendor Discovery System');
    console.log('');
    console.log('Usage: node discover-israeli-meat-vendors.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --quick        Run quick discovery (fewer search terms)');
    console.log('  --verbose      Enable verbose logging');
    console.log('');
    console.log('Examples:');
    console.log('  node discover-israeli-meat-vendors.js');
    console.log('  node discover-israeli-meat-vendors.js --quick');
    process.exit(0);
}

// Run the main function
main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});