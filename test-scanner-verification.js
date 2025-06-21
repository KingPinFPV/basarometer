// test-scanner-verification.js - Comprehensive scanner data verification
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyScannerData() {
  console.log('🔍 COMPREHENSIVE SCANNER DATA VERIFICATION\n');
  console.log('============================================\n');
  
  try {
    // 1. Verify scanner_products table exists and get count
    console.log('1️⃣ CHECKING SCANNER_PRODUCTS TABLE:');
    console.log('=====================================');
    
    const { count, error: countError } = await supabase
      .from('scanner_products')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error accessing scanner_products:', countError.message);
      return;
    }
    
    console.log(`✅ Total products in scanner_products: ${count}`);
    
    if (count === 0) {
      console.log('⚠️  WARNING: No products found in scanner_products table!');
      return;
    }
    
    if (count >= 24) {
      console.log('✅ SUCCESS: 24+ products confirmed in database!');
    } else {
      console.log(`⚠️  WARNING: Only ${count} products found, expected 24+`);
    }
    
    // 2. Get detailed breakdown
    console.log('\n2️⃣ PRODUCT BREAKDOWN ANALYSIS:');
    console.log('===============================');
    
    const { data: allProducts, error: dataError } = await supabase
      .from('scanner_products')
      .select('*')
      .order('scan_timestamp', { ascending: false });
    
    if (dataError) {
      console.error('❌ Error fetching product details:', dataError.message);
      return;
    }
    
    // Group by store
    const byStore = {};
    const byCategory = {};
    const byDate = {};
    
    allProducts.forEach(product => {
      const store = product.store_name || product.store_site || 'Unknown';
      const category = product.category || 'אחר';
      const date = product.scan_timestamp ? new Date(product.scan_timestamp).toDateString() : 'Unknown';
      
      byStore[store] = (byStore[store] || 0) + 1;
      byCategory[category] = (byCategory[category] || 0) + 1;
      byDate[date] = (byDate[date] || 0) + 1;
    });
    
    console.log('\n📊 Products by Store:');
    Object.entries(byStore).forEach(([store, count]) => {
      console.log(`   ${store}: ${count} products`);
    });
    
    console.log('\n📊 Products by Category:');
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} products`);
    });
    
    console.log('\n📊 Products by Date:');
    Object.entries(byDate).forEach(([date, count]) => {
      console.log(`   ${date}: ${count} products`);
    });
    
    // 3. Data quality analysis
    console.log('\n3️⃣ DATA QUALITY ANALYSIS:');
    console.log('==========================');
    
    const validProducts = allProducts.filter(p => p.is_valid);
    const highConfidenceProducts = allProducts.filter(p => p.scanner_confidence >= 0.8);
    const lowConfidenceProducts = allProducts.filter(p => p.scanner_confidence < 0.5);
    
    const avgPrice = allProducts.length ? 
      allProducts.reduce((sum, p) => sum + (p.price || 0), 0) / allProducts.length : 0;
    
    const avgConfidence = allProducts.length ?
      allProducts.reduce((sum, p) => sum + (p.scanner_confidence || 0), 0) / allProducts.length : 0;
    
    console.log(`Valid products: ${validProducts.length}/${allProducts.length} (${Math.round(validProducts.length/allProducts.length*100)}%)`);
    console.log(`High confidence (≥0.8): ${highConfidenceProducts.length} products`);
    console.log(`Low confidence (<0.5): ${lowConfidenceProducts.length} products`);
    console.log(`Average price: ₪${avgPrice.toFixed(2)}`);
    console.log(`Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    
    // 4. Sample products display
    console.log('\n4️⃣ SAMPLE PRODUCTS (First 5):');
    console.log('==============================');
    
    allProducts.slice(0, 5).forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.product_name}`);
      console.log(`   🏪 Store: ${product.store_name}`);
      console.log(`   💰 Price: ₪${product.price} (₪${product.price_per_kg}/kg)`);
      console.log(`   📦 Category: ${product.category}`);
      console.log(`   🎯 Confidence: ${(product.scanner_confidence * 100).toFixed(1)}%`);
      console.log(`   ✅ Valid: ${product.is_valid ? 'Yes' : 'No'}`);
      console.log(`   📅 Scanned: ${new Date(product.scan_timestamp).toLocaleString('he-IL')}`);
    });
    
    // 5. Check scanner activity logs
    console.log('\n5️⃣ SCANNER ACTIVITY LOGS:');
    console.log('==========================');
    
    const { data: activity, error: activityError } = await supabase
      .from('scanner_activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (!activityError && activity && activity.length > 0) {
      activity.forEach((scan, index) => {
        console.log(`\n${index + 1}. Target Site: ${scan.target_site}`);
        console.log(`   📊 Products Found: ${scan.products_found}`);
        console.log(`   ✅ Products Valid: ${scan.products_valid}`);
        console.log(`   🎯 Avg Confidence: ${(scan.average_confidence * 100).toFixed(1)}%`);
        console.log(`   📅 Scan Time: ${new Date(scan.created_at).toLocaleString('he-IL')}`);
        console.log(`   🔄 Status: ${scan.status}`);
      });
    } else {
      console.log('❌ No scanner activity logs found');
    }
    
    // 6. Test compatibility with comparison page data structure
    console.log('\n6️⃣ COMPARISON PAGE COMPATIBILITY CHECK:');
    console.log('=======================================');
    
    const sampleProduct = allProducts[0];
    const comparisonFormat = {
      id: sampleProduct.id,
      name_hebrew: sampleProduct.product_name,
      name_english: sampleProduct.normalized_name || '',
      category: sampleProduct.category,
      price: sampleProduct.price,
      price_per_kg: sampleProduct.price_per_kg,
      store_name: sampleProduct.store_name,
      confidence: sampleProduct.scanner_confidence,
      scan_timestamp: sampleProduct.scan_timestamp
    };
    
    console.log('✅ Sample product in comparison format:');
    console.log(JSON.stringify(comparisonFormat, null, 2));
    
    // 7. Final assessment
    console.log('\n7️⃣ FINAL ASSESSMENT:');
    console.log('=====================');
    
    if (count >= 24) {
      console.log('🎉 SUCCESS: Scanner data is properly stored!');
      console.log(`   • ${count} products confirmed in database`);
      console.log(`   • ${Object.keys(byStore).length} different stores`);
      console.log(`   • ${Object.keys(byCategory).length} product categories`);
      console.log(`   • ${validProducts.length} valid products ready for comparison`);
      console.log('\n✅ READY FOR COMPARISON PAGE INTEGRATION');
    } else {
      console.log('⚠️  ISSUE: Insufficient scanner data');
      console.log(`   • Only ${count} products found (expected 24+)`);
      console.log('   • Check scanner ingestion process');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyScannerData();