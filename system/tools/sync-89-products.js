#!/usr/bin/env node
/**
 * 89-Product Sync Script for Basarometer V6.0
 * Syncs 39 web + 50 government products = 89 total products
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

async function sync89Products() {
  console.log('🚀 Syncing 89 Products to Basarometer V6.0');
  
  try {
    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Load the latest 89 products
    const files = await fs.readdir('../scan bot/');
    const websiteFiles = files.filter(f => f.includes('website_89_products') && f.endsWith('.json'));
    const latestFile = websiteFiles.sort().pop();
    
    if (!latestFile) {
      console.error('❌ No 89 products file found');
      return;
    }
    
    const productsData = await fs.readFile(`../scan bot/${latestFile}`, 'utf8');
    const products = JSON.parse(productsData);
    
    console.log(`📦 Syncing ${products.length} products...`);
    
    // Clear existing products
    await supabase.from('products').delete().neq('id', '');
    console.log('🗑️ Cleared existing products');
    
    // Insert in batches
    const batchSize = 50;
    let synced = 0;
    
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('products')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} error:`, error);
      } else {
        synced += batch.length;
        console.log(`✅ Synced batch ${Math.floor(i/batchSize) + 1}: ${synced}/${products.length}`);
      }
    }
    
    console.log(`\n🎉 89-Product Sync Complete!`);
    console.log(`📊 Products synced: ${synced}/${products.length}`);
    console.log(`🌐 Website: https://v3.basarometer.org`);
    console.log(`🚀 Ready for production with 89 products!`);
    
  } catch (error) {
    console.error('❌ Sync error:', error.message);
  }
}

sync89Products();
