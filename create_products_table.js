#!/usr/bin/env node
/**
 * Create Products Table in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';

async function createProductsTable() {
    console.log('🗄️ Creating Products Table in Supabase');
    
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
            envVars.SUPABASE_SERVICE_ROLE_KEY
        );
        
        // Create products table using SQL
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
            
            -- Create index for better performance
            CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor);
            CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
            CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
        `;
        
        console.log('📋 Executing SQL to create products table...');
        
        const { data, error } = await supabase.rpc('exec_sql', { 
            sql: createTableSQL 
        });
        
        if (error) {
            console.log('⚠️ RPC exec_sql not available, trying alternative method...');
            
            // Try direct table creation query
            const { error: queryError } = await supabase
                .from('_pg_stat_statements')
                .select('*')
                .limit(1);
                
            if (queryError) {
                console.log('💡 Please create the products table manually in Supabase:');
                console.log('1. Go to https://supabase.com/dashboard');
                console.log('2. Select your project');
                console.log('3. Go to SQL Editor');
                console.log('4. Run this SQL:');
                console.log(createTableSQL);
                return false;
            }
        } else {
            console.log('✅ Products table created successfully!');
        }
        
        // Test if table exists by trying to select from it
        const { data: testData, error: testError } = await supabase
            .from('products')
            .select('count')
            .limit(1);
            
        if (testError) {
            console.log('❌ Table creation verification failed:', testError.message);
            return false;
        } else {
            console.log('✅ Products table verified and ready for data!');
            return true;
        }
        
    } catch (error) {
        console.error('❌ Failed to create products table:', error.message);
        return false;
    }
}

createProductsTable().then(success => {
    if (success) {
        console.log('\n🎯 Database ready for 89-product deployment!');
    } else {
        console.log('\n⚠️ Manual table creation required');
    }
});