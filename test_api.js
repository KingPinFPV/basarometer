#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';

async function testAPI() {
    console.log('🧪 Testing Products API');
    
    try {
        // Load environment
        const envContent = await fs.readFile('.env.local', 'utf8');
        const envVars = {};
        
        envContent.split('\n').forEach(line => {
            if (line.includes('=')) {
                const [key, value] = line.split('=');
                if (key && value) {
                    envVars[key.trim()] = value.trim().replace(/"/g, '');
                }
            }
        });
        
        const supabase = createClient(
            envVars.NEXT_PUBLIC_SUPABASE_URL,
            envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY  // Use anon key like frontend would
        );
        
        console.log('✅ API initialized with public credentials');
        
        // Test 1: Get total count of 89-product deployment
        const { data: deployedProducts, error: deployedError, count: deployedCount } = await supabase
            .from('scanner_products')
            .select('*', { count: 'exact' })
            .eq('validation_notes', '89-product deployment')
            .limit(10);
        
        if (deployedError) {
            console.error('❌ API test failed:', deployedError.message);
            return;
        }
        
        console.log(`📊 89-Product Deployment: ${deployedCount} products available`);
        
        // Test 2: Get all scanner products (total)
        const { count: totalCount, error: totalError } = await supabase
            .from('scanner_products')
            .select('*', { count: 'exact', head: true });
            
        if (!totalError) {
            console.log(`📊 Total products in database: ${totalCount}`);
        }
        
        // Test 3: Sample products with details
        console.log('\n📋 Sample deployed products:');
        deployedProducts.slice(0, 5).forEach((product, i) => {
            console.log(`   ${i+1}. ${product.product_name}`);
            console.log(`      💰 Price: ${product.price}₪ (${product.price_per_kg}₪/kg)`);
            console.log(`      🏪 Store: ${product.store_name}`);
            console.log(`      📂 Category: ${product.category}`);
            console.log(`      📦 Unit: ${product.unit}`);
            console.log(`      🎯 Confidence: ${product.scanner_confidence}`);
            console.log('');
        });
        
        // Test 4: Group by store
        const { data: storeGroups, error: storeError } = await supabase
            .from('scanner_products')
            .select('store_name')
            .eq('validation_notes', '89-product deployment');
            
        if (!storeError) {
            const storeCounts = {};
            storeGroups.forEach(p => {
                storeCounts[p.store_name] = (storeCounts[p.store_name] || 0) + 1;
            });
            
            console.log('🏪 Products by store:');
            Object.entries(storeCounts).forEach(([store, count]) => {
                console.log(`   ${store}: ${count} products`);
            });
        }
        
        // Test 5: API endpoint simulation
        console.log('\n🌐 API Endpoint Simulation:');
        console.log('GET /api/products would return:');
        console.log(`{
  "total": ${deployedCount},
  "products": [${deployedProducts.slice(0, 2).map(p => `
    {
      "id": "${p.id}",
      "name": "${p.product_name}",
      "price": ${p.price},
      "vendor": "${p.store_name}",
      "category": "${p.category}"
    }`).join(',')}
  ]
}`);
        
        console.log('\n✅ API tests completed successfully!');
        console.log('🎯 Ready for local development testing');
        
        return true;
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
        return false;
    }
}

testAPI();