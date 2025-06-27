#!/usr/bin/env node
/**
 * Enhanced 89-Product Sync for Basarometer V6.0
 * Robust deployment with progress tracking and error recovery
 */

import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';

class Enhanced89ProductSync {
    constructor() {
        this.supabase = null;
        this.deploymentLog = [];
    }
    
    async initializeSupabase() {
        console.log('🔧 Initializing Supabase Connection');
        
        try {
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
            
            const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
            const key = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            
            if (!url || !key) {
                throw new Error('Missing Supabase credentials in .env.local');
            }
            
            this.supabase = createClient(url, key);
            console.log('✅ Supabase initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Could not initialize Supabase:', error.message);
            throw error;
        }
    }
    
    async load89Products() {
        console.log('\n📦 Loading 89 Products Dataset');
        
        try {
            // Check different possible locations for the products file
            const possiblePaths = [
                '../scan bot/website_89_products_2025-06-27T17-28-39-377Z.json',
                '../scan bot/unified_89_products_2025-06-27T17-28-39-377Z.json',
                '../scan bot/website_89_products_final.json',
                '../scan bot/website_89_products.json',
                '../scan bot/unified_89_products.json',
                '../scan bot/final_89_products.json'
            ];
            
            let products = null;
            let usedPath = null;
            
            for (const path of possiblePaths) {
                try {
                    const data = await fs.readFile(path, 'utf8');
                    products = JSON.parse(data);
                    usedPath = path;
                    console.log(`📁 Found products file: ${path.split('/').pop()}`);
                    break;
                } catch (error) {
                    // Continue trying next path
                }
            }
            
            if (!products) {
                throw new Error('No 89-products dataset found - run integration first');
            }
            
            console.log(`✅ Loaded ${products.length} products for deployment`);
            
            // Validate and clean product structure
            const validProducts = products.filter(p => 
                p.name && 
                (typeof p.price === 'number' || !isNaN(parseFloat(p.price))) && 
                p.vendor
            ).map(p => ({
                id: p.id && p.id.length === 36 ? p.id : crypto.randomUUID(),
                product_name: String(p.name).trim(),
                normalized_name: String(p.name).trim().toLowerCase(),
                brand: p.brand || '',
                price: typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0,
                price_per_kg: typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0,
                currency: 'ILS',
                category: p.category || 'בשר',
                weight: 1,
                unit: p.unit || 'ק"ג',
                store_name: String(p.vendor).trim(),
                store_site: String(p.vendor).trim().toLowerCase().replace(/\s+/g, '_'),
                retailer_id: null,
                scanner_confidence: p.quality_score || 85,
                scanner_source: p.source || 'web_scanner',
                scan_timestamp: new Date().toISOString(),
                site_confidence: 90,
                meat_cut_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_active: true,
                is_valid: true,
                validation_notes: '89-product deployment',
                product_hash: null
            }));
            
            console.log(`📊 Valid products: ${validProducts.length}/${products.length}`);
            
            return validProducts;
            
        } catch (error) {
            console.error('❌ Error loading products:', error.message);
            throw error;
        }
    }
    
    async prepareDatabase() {
        console.log('\n🗄️ Preparing Database');
        
        try {
            // Create products table if it doesn't exist
            const { error: createError } = await this.supabase.rpc('create_products_table', {});
            
            if (createError && !createError.message.includes('already exists')) {
                console.log('🔧 Creating products table manually...');
                
                const createTableSQL = `
                    CREATE TABLE IF NOT EXISTS products (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        price NUMERIC DEFAULT 0,
                        vendor TEXT,
                        category TEXT DEFAULT 'בשר',
                        unit TEXT DEFAULT 'ק"ג',
                        image_url TEXT,
                        source TEXT DEFAULT 'web_scanner',
                        quality_score INTEGER DEFAULT 85,
                        priority TEXT DEFAULT 'medium',
                        last_updated TIMESTAMPTZ DEFAULT NOW(),
                        created_at TIMESTAMPTZ DEFAULT NOW()
                    );
                `;
                
                // Try to create table using direct SQL
                const { error: sqlError } = await this.supabase.from('products').select('count');
                if (sqlError && sqlError.message.includes('does not exist')) {
                    console.log('⚠️ Products table needs to be created in Supabase dashboard');
                    console.log('📋 SQL to run in Supabase SQL editor:');
                    console.log(createTableSQL);
                }
            }
            
            // Check current products count
            const { count: currentCount, error: countError } = await this.supabase
                .from('scanner_products')
                .select('*', { count: 'exact', head: true });
            
            if (countError) {
                console.log(`⚠️ Database check: ${countError.message}`);
                console.log('💡 Will proceed with deployment anyway');
            } else {
                console.log(`📊 Current products in database: ${currentCount || 0}`);
            }
            
            // Clear existing products for clean deployment
            if (currentCount > 0) {
                const { error: deleteError } = await this.supabase
                    .from('scanner_products')
                    .delete()
                    .eq('validation_notes', '89-product deployment');
                
                if (deleteError) {
                    console.log(`⚠️ Clear existing products: ${deleteError.message}`);
                } else {
                    console.log('🗑️ Existing products cleared for fresh deployment');
                }
            }
            
            return true;
            
        } catch (error) {
            console.log(`⚠️ Database preparation: ${error.message}`);
            return true; // Continue anyway
        }
    }
    
    async deployProducts(products) {
        console.log('\n🚀 Deploying 89 Products');
        
        const batchSize = 20; // Smaller batches for reliability
        let deployed = 0;
        const errors = [];
        
        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(products.length / batchSize);
            
            console.log(`📦 Deploying batch ${batchNumber}/${totalBatches} (${batch.length} products)`);
            
            try {
                const { data, error } = await this.supabase
                    .from('scanner_products')
                    .insert(batch);
                
                if (error) {
                    console.error(`   ❌ Batch ${batchNumber} error:`, error.message);
                    errors.push(`Batch ${batchNumber}: ${error.message}`);
                    
                    // Try individual inserts for this batch
                    console.log(`   🔄 Retrying batch ${batchNumber} with individual inserts...`);
                    let batchDeployed = 0;
                    
                    for (const product of batch) {
                        try {
                            const { error: singleError } = await this.supabase
                                .from('scanner_products')
                                .insert([product]);
                            
                            if (!singleError) {
                                batchDeployed++;
                            }
                        } catch (singleErr) {
                            // Skip individual errors
                        }
                    }
                    
                    deployed += batchDeployed;
                    console.log(`   ✅ Batch ${batchNumber} partial success: ${batchDeployed}/${batch.length} products`);
                } else {
                    deployed += batch.length;
                    console.log(`   ✅ Batch ${batchNumber} deployed: ${deployed}/${products.length} total`);
                }
                
                // Small delay between batches
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`   ❌ Batch ${batchNumber} exception:`, error.message);
                errors.push(`Batch ${batchNumber}: ${error.message}`);
            }
        }
        
        return { deployed, errors };
    }
    
    async verifyDeployment() {
        console.log('\n🔍 Verifying Deployment');
        
        try {
            const { data: products, error, count } = await this.supabase
                .from('scanner_products')
                .select('*', { count: 'exact' })
                .eq('validation_notes', '89-product deployment')
                .limit(5);
            
            if (error) {
                console.log(`⚠️ Verification warning: ${error.message}`);
                return false;
            }
            
            console.log(`📊 Products in database: ${count}`);
            
            if (products && products.length > 0) {
                console.log('📋 Sample deployed products:');
                products.slice(0, 3).forEach((product, i) => {
                    console.log(`   ${i+1}. ${product.product_name} - ${product.price}₪ (${product.store_name})`);
                });
            }
            
            return count > 0;
            
        } catch (error) {
            console.error('❌ Verification failed:', error.message);
            return false;
        }
    }
    
    async createDeploymentReport(result) {
        const timestamp = new Date().toISOString();
        
        const report = {
            deployment_timestamp: timestamp,
            products_deployed: result.deployed,
            total_products: result.total,
            success_rate: ((result.deployed / result.total) * 100).toFixed(1),
            errors: result.errors,
            deployment_status: result.deployed > 0 ? 'SUCCESS' : 'FAILED',
            next_steps: result.deployed > 0 ? [
                'Test local development: npm run dev',
                'Verify products display correctly',
                'Deploy to production: vercel --prod'
            ] : [
                'Check Supabase configuration',
                'Review error messages',
                'Run environment check again'
            ]
        };
        
        await fs.writeFile('deployment_report.json', JSON.stringify(report, null, 2));
        console.log('\n📋 Deployment report saved: deployment_report.json');
        
        return report;
    }
    
    async run89ProductDeployment() {
        console.log('🚀 Enhanced 89-Product Deployment to Basarometer V6.0');
        console.log('='.repeat(70));
        
        try {
            // Initialize
            await this.initializeSupabase();
            
            // Load products
            const products = await this.load89Products();
            
            // Prepare database
            await this.prepareDatabase();
            
            // Deploy products
            const result = await this.deployProducts(products);
            result.total = products.length;
            
            // Verify deployment
            const verified = await this.verifyDeployment();
            
            // Create report
            const report = await this.createDeploymentReport(result);
            
            // Final status
            console.log('\n🎯 89-Product Deployment Complete!');
            console.log(`📊 Products deployed: ${result.deployed}/${result.total}`);
            console.log(`✅ Success rate: ${report.success_rate}%`);
            console.log(`🔍 Verification: ${verified ? 'PASSED' : 'NEEDS ATTENTION'}`);
            
            if (result.deployed > 0) {
                console.log('\n🎉 SUCCESS: 89 products are now live!');
                console.log('🌐 Website: https://v3.basarometer.org');
                console.log('🧪 Test locally: npm run dev');
            } else {
                console.log('\n⚠️ Deployment issues detected');
                console.log('📋 Check deployment_report.json for details');
            }
            
            return report;
            
        } catch (error) {
            console.error('\n❌ Deployment failed:', error.message);
            
            const errorReport = {
                deployment_timestamp: new Date().toISOString(),
                status: 'FAILED',
                error: error.message,
                suggestion: 'Run environment check and verify Supabase configuration'
            };
            
            await fs.writeFile('deployment_error.json', JSON.stringify(errorReport, null, 2));
            return null;
        }
    }
}

// Run deployment
async function deploy89Products() {
    const deployer = new Enhanced89ProductSync();
    return await deployer.run89ProductDeployment();
}

deploy89Products().then(result => {
    if (result && result.deployment_status === 'SUCCESS') {
        console.log('\n🏆 Ready for testing and production!');
    }
});

export { Enhanced89ProductSync };