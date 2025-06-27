#!/usr/bin/env node
/**
 * Simple 89-Product Sync using the existing schema format
 */

import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';

async function simpleProductSync() {
    console.log('🚀 Simple 89-Product Sync to Basarometer V6.0');
    console.log('='.repeat(50));
    
    try {
        // Initialize Supabase
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
            envVars.SUPABASE_SERVICE_ROLE_KEY
        );
        
        console.log('✅ Supabase initialized');
        
        // Load 89 products
        const productsData = await fs.readFile('../scan bot/website_89_products_2025-06-27T17-28-39-377Z.json', 'utf8');
        const products = JSON.parse(productsData);
        
        console.log(`📦 Loaded ${products.length} products`);
        
        // Transform products to match existing schema exactly
        const transformedProducts = products.map(p => ({
            id: crypto.randomUUID(),
            product_name: String(p.name).trim(),
            normalized_name: String(p.name).trim(),
            brand: p.vendor || '',
            price: typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0,
            price_per_kg: typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0,
            currency: '₪',
            category: p.category || 'בשר',
            weight: null,
            unit: p.unit || '1kg',
            store_name: String(p.vendor).trim(),
            store_site: null,
            retailer_id: null,
            scanner_confidence: 0.85,
            scanner_source: 'web_scanner',
            scan_timestamp: new Date().toISOString(),
            site_confidence: 0.85,
            meat_cut_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true,
            is_valid: true,
            validation_notes: '89-product deployment',
            product_hash: `hash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }));
        
        console.log(`📊 Transformed ${transformedProducts.length} products`);
        
        // Clear previous 89-product deployment
        const { error: deleteError } = await supabase
            .from('scanner_products')
            .delete()
            .eq('validation_notes', '89-product deployment');
            
        if (deleteError) {
            console.log('⚠️ Clear previous products:', deleteError.message);
        } else {
            console.log('🗑️ Cleared previous deployment');
        }
        
        // Insert products one by one to avoid batch issues
        let deployed = 0;
        let errors = [];
        
        console.log('\n🚀 Deploying products individually...');
        
        for (let i = 0; i < transformedProducts.length; i++) {
            const product = transformedProducts[i];
            
            try {
                const { data, error } = await supabase
                    .from('scanner_products')
                    .insert([product]);
                    
                if (error) {
                    console.log(`   ❌ Product ${i+1} failed: ${error.message}`);
                    errors.push(`Product ${i+1}: ${error.message}`);
                } else {
                    deployed++;
                    if (deployed % 10 === 0) {
                        console.log(`   ✅ Progress: ${deployed}/${transformedProducts.length} products deployed`);
                    }
                }
                
                // Small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (err) {
                console.log(`   ❌ Product ${i+1} exception: ${err.message}`);
                errors.push(`Product ${i+1}: ${err.message}`);
            }
        }
        
        // Verify deployment
        const { data: verifyData, error: verifyError, count } = await supabase
            .from('scanner_products')
            .select('*', { count: 'exact' })
            .eq('validation_notes', '89-product deployment')
            .limit(5);
            
        console.log('\n🔍 Deployment Results:');
        console.log(`📊 Products deployed: ${deployed}/${transformedProducts.length}`);
        console.log(`✅ Success rate: ${((deployed / transformedProducts.length) * 100).toFixed(1)}%`);
        console.log(`🔍 Verified count: ${count || 0}`);
        
        if (verifyData && verifyData.length > 0) {
            console.log('\n📋 Sample deployed products:');
            verifyData.slice(0, 3).forEach((product, i) => {
                console.log(`   ${i+1}. ${product.product_name} - ${product.price}₪ (${product.store_name})`);
            });
        }
        
        if (errors.length > 0) {
            console.log('\n⚠️ Errors encountered:');
            errors.slice(0, 5).forEach(error => {
                console.log(`   - ${error}`);
            });
            if (errors.length > 5) {
                console.log(`   ... and ${errors.length - 5} more errors`);
            }
        }
        
        // Create deployment report
        const report = {
            deployment_timestamp: new Date().toISOString(),
            products_deployed: deployed,
            total_products: transformedProducts.length,
            success_rate: ((deployed / transformedProducts.length) * 100).toFixed(1),
            verified_count: count || 0,
            errors: errors.slice(0, 10), // Store first 10 errors
            deployment_status: deployed > 0 ? 'SUCCESS' : 'FAILED'
        };
        
        await fs.writeFile('simple_deployment_report.json', JSON.stringify(report, null, 2));
        
        if (deployed > 0) {
            console.log('\n🎉 SUCCESS: Products deployed to Basarometer V6.0!');
            console.log('🧪 Ready for local testing: npm run dev');
            console.log('🌐 Live website: https://v3.basarometer.org');
        } else {
            console.log('\n⚠️ Deployment failed - check errors above');
        }
        
        return report;
        
    } catch (error) {
        console.error('\n❌ Simple sync failed:', error.message);
        return null;
    }
}

simpleProductSync();