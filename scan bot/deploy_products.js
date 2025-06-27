import fs from 'fs/promises';
import path from 'path';

const botsDir = '/Users/yogi/Desktop/basarometer/v5/scan bot';
const websiteDir = '/Users/yogi/Desktop/basarometer/v5/v3';

console.log('🌐 Deploying Products to V6.0 Website');
console.log('=====================================');

try {
    // Load the unified products
    const productsFile = path.join(botsDir, 'unified_output/unified-products-2025-06-27T16-27-11-271Z.json');
    const productsData = await fs.readFile(productsFile, 'utf8');
    const products = JSON.parse(productsData);
    
    console.log(`📦 Loaded ${products.length} products for deployment`);
    
    // Transform to website-ready format
    const websiteProducts = products.map(product => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: product.name,
        price: parseFloat(product.price) || 0,
        vendor: product.siteName || product.vendor,
        category: product.category || 'בשר',
        unit: product.unit || 'ק"ג',
        image_url: product.imageUrl || '/images/default-meat.jpg',
        source: product.data_source || 'web_scraper',
        confidence: product.confidence || 0.7,
        price_per_kg: product.pricePerKg || product.price,
        weight: product.weight || null,
        brand: product.brand || null,
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString()
    }));
    
    console.log(`🔄 Transformed ${websiteProducts.length} products for website`);
    
    // Create data directory in website
    const dataDir = path.join(websiteDir, 'data');
    await fs.mkdir(dataDir, { recursive: true });
    console.log(`📁 Created data directory: ${dataDir}`);
    
    // Save products data
    const localFile = path.join(dataDir, 'products.json');
    await fs.writeFile(localFile, JSON.stringify(websiteProducts, null, 2));
    console.log(`✅ Products saved: ${localFile}`);
    
    // Create API endpoint directory
    const apiDir = path.join(websiteDir, 'src/app/api/products/sync');
    await fs.mkdir(apiDir, { recursive: true });
    console.log(`🔌 Created API directory: ${apiDir}`);
    
    // Create API route
    const apiContent = `import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const dataPath = path.join(process.cwd(), 'data/products.json');
    const productsData = await fs.readFile(dataPath, 'utf8');
    const products = JSON.parse(productsData);

    return NextResponse.json({ 
      products,
      count: products.length,
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch products',
      products: [],
      count: 0
    }, { status: 500 });
  }
}`;
    
    const apiFile = path.join(apiDir, 'route.ts');
    await fs.writeFile(apiFile, apiContent);
    console.log(`🔌 API endpoint created: ${apiFile}`);
    
    // Create summary
    const vendors = [...new Set(websiteProducts.map(p => p.vendor))];
    const avgPrice = websiteProducts.reduce((a, b) => a + b.price, 0) / websiteProducts.length;
    const avgConfidence = websiteProducts.reduce((a, b) => a + b.confidence, 0) / websiteProducts.length;
    
    console.log('\n📊 Deployment Summary:');
    console.log(`   Products: ${websiteProducts.length}`);
    console.log(`   Vendors: ${vendors.join(', ')}`);
    console.log(`   Average Price: ${avgPrice.toFixed(2)}₪`);
    console.log(`   Average Confidence: ${avgConfidence.toFixed(2)}`);
    
    console.log('\n✅ Deployment Complete!');
    console.log('🚀 Next steps:');
    console.log('   1. cd /Users/yogi/Desktop/basarometer/v5/v3/');
    console.log('   2. npm run dev');
    console.log('   3. Visit http://localhost:3000/api/products/sync');
    
} catch (error) {
    console.error('❌ Deployment failed:', error.message);
}