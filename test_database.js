import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

async function testDatabase() {
  console.log('🔍 Testing database connection and table structure...');
  
  try {
    // Load environment variables
    const envContent = await fs.readFile('.env.local', 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^"|"$/g, '');
      }
    });
    
    const supabase = createClient(
      envVars.NEXT_PUBLIC_SUPABASE_URL,
      envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    console.log('✅ Supabase client created');
    
    // Test different table names that might contain products
    const possibleTables = [
      'meat_cuts',
      'scanner_products', 
      'products',
      'unified_products',
      'price_reports',
      'meat_categories',
      'retailers',
      'meat_sub_categories',
      'meat_name_mappings',
      'meat_discovery_queue'
    ];
    
    console.log('\n📊 Testing tables:');
    
    for (const tableName of possibleTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: ${count || 0} records`);
          
          // If this table has records, let's see what fields it has
          if (count > 0) {
            const { data: sample } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            
            if (sample && sample.length > 0) {
              console.log(`   📋 Fields: ${Object.keys(sample[0]).join(', ')}`);
            }
          }
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }
    
    // Try to get the actual table with products by looking for tables with product-like fields
    console.log('\n🔍 Looking for tables with product data...');
    
    for (const tableName of possibleTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(5);
        
        if (!error && data && data.length > 0) {
          const sample = data[0];
          const fields = Object.keys(sample);
          
          // Check if this table looks like it contains products
          const hasProductFields = fields.some(field => 
            field.includes('name') || 
            field.includes('product') || 
            field.includes('price') ||
            field.includes('store') ||
            field.includes('retailer')
          );
          
          if (hasProductFields) {
            console.log(`\n🎯 Found product-like table: ${tableName}`);
            console.log(`   📝 Sample record:`, JSON.stringify(sample, null, 2));
          }
        }
      } catch (err) {
        // Skip this table
      }
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

testDatabase();