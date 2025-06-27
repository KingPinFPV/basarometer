#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';

async function getTableStructure() {
    console.log('🔍 Getting Complete Table Structure');
    
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
        
        // Get one existing product to see all fields
        const { data: sample, error } = await supabase
            .from('scanner_products')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('❌ Error fetching sample:', error.message);
        } else if (sample && sample.length > 0) {
            console.log('📋 Complete field structure:');
            const product = sample[0];
            Object.keys(product).forEach(key => {
                const value = product[key];
                const type = value === null ? 'null' : typeof value;
                console.log(`   ${key}: ${JSON.stringify(value)} (${type})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Failed to get structure:', error.message);
    }
}

getTableStructure();