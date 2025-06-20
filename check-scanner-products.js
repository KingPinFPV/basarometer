// check-scanner-products.js
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkScannerProducts() {
  console.log('🔍 Checking Scanner Products Table...\n');
  
  try {
    // Get total count of scanner_products
    const { count, error: countError } = await supabase
      .from('scanner_products')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error getting count:', countError);
      return;
    }
    
    console.log(`📊 Total products in scanner_products table: ${count}`);
    
    // Get sample of products to see the data structure
    const { data: products, error: dataError } = await supabase
      .from('scanner_products')
      .select('*')
      .limit(5);
    
    if (dataError) {
      console.error('❌ Error getting sample data:', dataError);
      return;
    }
    
    console.log('\n📋 Sample products (first 5):');
    console.log('==========================================');
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.product_name}`);
      console.log(`   Brand: ${product.brand || 'N/A'}`);
      console.log(`   Price: ${product.price} ${product.currency || '₪'}`);
      console.log(`   Price/kg: ${product.price_per_kg}`);
      console.log(`   Store: ${product.store_name}`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Confidence: ${product.scanner_confidence}`);
      console.log(`   Timestamp: ${product.scan_timestamp}`);
      console.log(`   Valid: ${product.is_valid}`);
    });
    
    // Get count by store
    const { data: byStore, error: storeError } = await supabase
      .from('scanner_products')
      .select('store_name, store_site')
      .select('store_name, store_site, count(*)', { count: 'exact' });
    
    if (!storeError && byStore) {
      console.log('\n🏪 Products by store:');
      console.log('==========================================');
      
      // Group by store manually since Supabase doesn't support GROUP BY in this way
      const storeGroups = {};
      const { data: allProducts } = await supabase
        .from('scanner_products')
        .select('store_name, store_site');
      
      allProducts?.forEach(product => {
        const key = product.store_name || product.store_site;
        storeGroups[key] = (storeGroups[key] || 0) + 1;
      });
      
      Object.entries(storeGroups).forEach(([store, count]) => {
        console.log(`   ${store}: ${count} products`);
      });
    }
    
    // Get recent activity
    const { data: activity, error: activityError } = await supabase
      .from('scanner_activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (!activityError && activity) {
      console.log('\n🕐 Recent scanner activity:');
      console.log('==========================================');
      activity.forEach((scan, index) => {
        console.log(`\n${index + 1}. Site: ${scan.target_site}`);
        console.log(`   Products found: ${scan.products_found}`);
        console.log(`   Products processed: ${scan.products_processed}`);
        console.log(`   Products valid: ${scan.products_valid}`);
        console.log(`   Confidence: ${scan.average_confidence}`);
        console.log(`   Status: ${scan.status}`);
        console.log(`   Timestamp: ${scan.created_at}`);
      });
    }
    
    // Check for specific confidence and validation stats
    const { data: validProducts, error: validError } = await supabase
      .from('scanner_products')
      .select('*')
      .eq('is_valid', true);
    
    const { data: highConfidenceProducts, error: confError } = await supabase
      .from('scanner_products')
      .select('*')
      .gte('scanner_confidence', 0.8);
    
    console.log('\n📈 Quality Metrics:');
    console.log('==========================================');
    console.log(`Valid products: ${validProducts?.length || 0}`);
    console.log(`High confidence products (>= 0.8): ${highConfidenceProducts?.length || 0}`);
    
    if (count >= 24) {
      console.log('\n✅ SUCCESS: Found 24 or more products in scanner_products table!');
    } else {
      console.log(`\n⚠️  WARNING: Only found ${count} products, expected 24 or more.`);
    }
    
  } catch (error) {
    console.error('❌ Error checking scanner products:', error);
  }
}

checkScannerProducts();