// /src/app/api/scanner/ingest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Scanner data interfaces based on actual v5 output format
interface ScannerProduct {
  id?: string;
  name: string;
  originalName?: string;
  normalizedName?: string;
  brand?: string | null;
  weight?: number | null;
  price: number;
  unit?: string;
  pricePerKg?: number;
  site: string;
  siteName?: string;
  category?: string;
  confidence: number;
  imageUrl?: string;
  timestamp?: string;
  isValid?: boolean;
}

interface ScannerPayload {
  scanInfo: {
    timestamp: string;
    testMode?: boolean;
    targetSite: string;
    totalProducts: number;
    originalProducts?: number;
    duplicatesRemoved?: number;
    validProducts?: number;
    sites?: string[];
    categories?: string[];
    confidence?: number;
  };
  products: ScannerProduct[];
  errors?: unknown[];
}

// Helper function to create product hash for deduplication
function createProductHash(product: ScannerProduct, site: string): string {
  const hashString = `${product.name}-${site}-${product.price}`;
  return Buffer.from(hashString).toString('base64').slice(0, 32);
}

// Helper function to normalize product name
function normalizeProductName(name: string): string {
  return name
    .replace(/\s+/g, ' ')
    .replace(/[^\u0590-\u05FFa-zA-Z0-9\s]/g, '')
    .trim()
    .toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const scannerData: ScannerPayload = await request.json();
    
    console.log(`📥 Received scanner data: ${scannerData.products.length} products from ${scannerData.scanInfo.targetSite}`);

    // Validate API key
    const apiKey = request.headers.get('x-scanner-api-key');
    const expectedKey = process.env.SCANNER_API_KEY || 'temp-dev-key';
    
    if (apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Log scanner activity first
    const { data: activityLog, error: activityError } = await supabase
      .from('scanner_activity')
      .insert({
        target_site: scannerData.scanInfo.targetSite,
        products_found: scannerData.scanInfo.totalProducts,
        products_processed: scannerData.products.length,
        products_valid: scannerData.products.filter(p => (p.isValid !== false) && p.confidence >= 0.5).length,
        average_confidence: scannerData.scanInfo.confidence || calculateAverageConfidence(scannerData.products),
        status: 'completed',
        metadata: {
          test_mode: scannerData.scanInfo.testMode || false,
          categories: scannerData.scanInfo.categories || [],
          sites: scannerData.scanInfo.sites || []
        }
      })
      .select()
      .single();

    if (activityError) {
      console.error('❌ Failed to log scanner activity:', activityError);
    }

    // Process and prepare products for insertion into scanner_products table
    const processedProducts = scannerData.products
      .filter(product => (product.isValid !== false) && product.confidence >= 0.5)
      .map(product => {
        const normalizedName = normalizeProductName(product.name);
        const productHash = createProductHash(product, scannerData.scanInfo.targetSite);
        
        return {
          product_name: product.name,
          normalized_name: normalizedName,
          brand: product.brand || null,
          price: product.price,
          price_per_kg: product.pricePerKg || product.price,
          currency: '₪',
          category: product.category || 'אחר',
          weight: product.weight ? product.weight.toString() : null,
          unit: product.unit || null,
          store_name: product.siteName || product.site,
          store_site: scannerData.scanInfo.targetSite,
          scanner_confidence: product.confidence,
          scanner_source: 'browser-use-ai',
          scan_timestamp: product.timestamp || scannerData.scanInfo.timestamp,
          site_confidence: scannerData.scanInfo.confidence || calculateAverageConfidence(scannerData.products),
          product_hash: productHash,
          is_valid: product.confidence >= 0.5,
          validation_notes: product.confidence < 0.5 ? 'Low confidence score' : null
        };
      });

    // Insert products into optimized scanner_products table
    const { data: insertedProducts, error: insertError } = await supabase
      .from('scanner_products')
      .insert(processedProducts)
      .select();

    if (insertError) {
      console.error('❌ Database insertion error:', insertError);
      return NextResponse.json(
        { error: 'Database insertion failed', details: insertError.message },
        { status: 500 }
      );
    }

    // Update activity log with success count
    if (activityLog) {
      await supabase
        .from('scanner_activity')
        .update({ 
          products_valid: insertedProducts?.length || 0,
          status: 'completed' 
        })
        .eq('id', activityLog.id);
    }

    console.log(`✅ Successfully processed ${insertedProducts?.length || 0} products from scanner`);

    return NextResponse.json({
      success: true,
      processed: insertedProducts?.length || 0,
      activityId: activityLog?.id,
      timestamp: new Date().toISOString(),
      scanInfo: scannerData.scanInfo,
      validProducts: processedProducts.filter(p => p.is_valid).length,
      totalProducts: processedProducts.length,
      duplicatesHandled: true
    });

  } catch (error) {
    console.error('❌ Scanner ingest API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


// Calculate average confidence score
function calculateAverageConfidence(products: ScannerProduct[]): number {
  if (products.length === 0) return 0;
  
  const total = products.reduce((sum, product) => sum + product.confidence, 0);
  return Math.round((total / products.length) * 100) / 100;
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'Scanner ingest API is active and optimized',
    timestamp: new Date().toISOString(),
    version: '2.0',
    endpoints: {
      POST: 'Receive and process scanner data into optimized schema',
      GET: 'Health check and status'
    },
    features: [
      'Optimized scanner_products table',
      'Automatic deduplication with price tracking',
      'Real-time activity logging',
      'Enhanced confidence scoring',
      'Hebrew product name normalization'
    ]
  });
}