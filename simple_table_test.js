#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';

async function testDatabase() {
    console.log('🧪 Testing Database Connection and Structure');
    
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
        
        const supabase = createClient(
            envVars.NEXT_PUBLIC_SUPABASE_URL,
            envVars.SUPABASE_SERVICE_ROLE_KEY
        );
        
        console.log('🔍 Checking existing tables...');
        
        // Try to list tables using information_schema
        const { data: tables, error: tablesError } = await supabase
            .rpc('get_tables');
            
        if (tablesError) {
            console.log('⚠️ Cannot list tables via RPC');
        } else {
            console.log('📋 Available tables:', tables);
        }
        
        // Check if we can access any existing tables
        const tablesToCheck = ['scanner_products', 'meat_cuts', 'price_reports', 'retailers'];
        
        for (const table of tablesToCheck) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                    
                if (!error) {
                    console.log(`✅ Table '${table}' exists and accessible`);
                    if (data && data.length > 0) {
                        console.log(`   Sample structure:`, Object.keys(data[0]));
                    }
                } else {
                    console.log(`❌ Table '${table}': ${error.message}`);
                }
            } catch (err) {
                console.log(`❌ Table '${table}' error:`, err.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
    }
}

testDatabase();