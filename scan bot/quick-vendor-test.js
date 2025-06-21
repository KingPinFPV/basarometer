#!/usr/bin/env node

/**
 * Quick test of the real vendor integration
 */

import HebrewVendorDiscovery from './modules/hebrewVendorDiscovery.js';

console.log('🚀 Quick Real Vendor Test...\n');

const discovery = new HebrewVendorDiscovery();

try {
    console.log('📋 Initializing...');
    await discovery.initialize();
    
    console.log('🔍 Loading known vendors...');
    await discovery.loadKnownVendors();
    
    const vendors = Array.from(discovery.discoveredVendors.values());
    console.log(`✅ Loaded ${vendors.length} vendors`);
    
    // Show some vendor details
    vendors.slice(0, 5).forEach((vendor, index) => {
        console.log(`${index + 1}. ${vendor.title}`);
        console.log(`   Domain: ${vendor.domain}`);
        console.log(`   Type: ${vendor.vendorType}`);
        console.log(`   Score: ${vendor.relevanceScore}`);
        console.log(`   URL Valid: ${vendor.analysis?.urlValid ? '✅' : '❌'}`);
        console.log(`   Platform: ${vendor.analysis?.platformDetected || 'Unknown'}`);
        console.log('');
    });
    
    const validVendors = vendors.filter(v => v.analysis?.urlValid === true);
    console.log(`📊 Summary: ${validVendors.length}/${vendors.length} vendors have valid URLs`);
    
} catch (error) {
    console.error('❌ Error:', error.message);
}