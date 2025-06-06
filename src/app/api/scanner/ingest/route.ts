// /src/app/api/scanner/ingest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Scanner data interfaces based on actual v5 output format
interface ScannerProduct {
  id: string;
  name: string;
  originalName: string;
  normalizedName: string;
  brand: string | null;
  weight: number | null;
  price: number;
  unit: string;
  pricePerKg: number;
  site: string;
  siteName: string;
  category: string;
  confidence: number;
  imageUrl?: string;
  timestamp: string;
  isValid: boolean;
}

interface ScannerPayload {
  scanInfo: {
    timestamp: string;
    testMode: boolean;
    targetSite: string;
    totalProducts: number;
    originalProducts: number;
    duplicatesRemoved: number;
    validProducts: number;
    sites: string[];
    categories: string[];
  };
  products: ScannerProduct[];
  errors?: unknown[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const scannerData: ScannerPayload = await request.json();
    
    // Validate API key
    const apiKey = request.headers.get('x-scanner-api-key');
    if (apiKey !== process.env.SCANNER_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Process and transform products
    const processedProducts = await Promise.all(
      scannerData.products
        .filter(product => product.isValid && product.confidence >= 0.5)
        .map(product => transformScannerProduct(product))
    );
    
    // Bulk insert to database
    const { error } = await supabase
      .from('price_reports')
      .insert(processedProducts);
    
    if (error) {
      console.error('Database insertion error:', error);
      throw error;
    }
    
    // Log successful ingestion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await logScannerIngestion(supabase as any, scannerData.scanInfo, processedProducts.length);
    
    return NextResponse.json({
      success: true,
      processed: processedProducts.length,
      duplicatesRemoved: scannerData.scanInfo.duplicatesRemoved,
      averageConfidence: calculateAverageConfidence(scannerData.products),
      scanInfo: scannerData.scanInfo
    });
    
  } catch (error) {
    console.error('Scanner ingestion error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process scanner data', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Transform scanner product to website database format
async function transformScannerProduct(product: ScannerProduct) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Map site to retailer_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const retailerId = await mapSiteToRetailer(supabase as any, product.site);
  
  // Map product name to meat_cut_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meatCutId = await findOrCreateMeatCut(supabase as any, product.normalizedName, product.category);
  
  // Calculate unit type from scanner unit format
  const unitType = normalizeUnit(product.unit);
  
  return {
    meat_cut_id: meatCutId,
    retailer_id: retailerId,
    price_per_kg: product.pricePerKg,
    unit_price: product.price,
    unit_type: unitType,
    confidence_score: product.confidence,
    reported_by: 'scanner-system',
    scanner_source: product.site,
    original_product_name: product.originalName,
    scanner_confidence: product.confidence,
    purchase_date: new Date(product.timestamp).toISOString().split('T')[0],
    location: product.siteName,
    notes: `Auto-scanned from ${product.siteName}. Category: ${product.category}`,
    is_on_sale: false,
    sale_price_per_kg: null,
    verified_at: product.confidence >= 0.85 ? new Date().toISOString() : null,
    is_active: true,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    created_at: new Date(product.timestamp),
    user_id: '00000000-0000-0000-0000-000000000000' // Scanner system user
  };
}

// Site to Retailer mapping based on actual scanner sites
const SITE_RETAILER_MAP: Record<string, string> = {
  'rami-levy': '1',
  'carrefour': '2', 
  'shufersal': '3',
  'yohananof': '4',
  'hazi-hinam': '5',
  'mega': '6',
  'victory': '7',
  'yayno-bitan': '8'
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function mapSiteToRetailer(supabase: any, siteName: string): Promise<string> {
  const normalizedSite = siteName.toLowerCase().replace(/[^a-z-]/g, '');
  const mappedId = SITE_RETAILER_MAP[normalizedSite];
  
  if (mappedId) {
    return mappedId;
  }
  
  // Try to find existing retailer by name
  const { data: retailer } = await supabase
    .from('retailers')
    .select('id')
    .ilike('name', `%${siteName}%`)
    .single();
    
  if (retailer) {
    return retailer.id;
  }
  
  // Default to first retailer if not found
  return '1';
}

// Hebrew Meat Cut Detection and Mapping
const HEBREW_MEAT_CUTS: Record<string, string> = {
  'בשר טחון': 'ground-beef',
  'אנטריקוט': 'entrecote', 
  'פילה': 'fillet',
  'כתף': 'shoulder',
  'צלעות': 'ribs',
  'שניצל': 'schnitzel',
  'עוף שלם': 'whole-chicken',
  'חזה עוף': 'chicken-breast',
  'שוק עוף': 'chicken-thigh',
  'כנפיים': 'chicken-wings',
  'כבד עוף': 'chicken-liver',
  'דגים': 'fish',
  'כבש': 'lamb',
  'טלה': 'veal',
  'בקר': 'beef',
  'עגל': 'calf'
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findOrCreateMeatCut(supabase: any, productName: string, category: string): Promise<string> {
  
  // Try to match existing meat cuts by Hebrew terms
  for (const [hebrewName] of Object.entries(HEBREW_MEAT_CUTS)) {
    if (productName.includes(hebrewName)) {
      const { data } = await supabase
        .from('meat_cuts')
        .select('id')
        .eq('name_hebrew', hebrewName)
        .single();
        
      if (data) return data.id;
    }
  }
  
  // Try to match by category
  const categoryMapping: Record<string, string> = {
    'דגים': 'fish',
    'עוף': 'chicken-breast',
    'בקר': 'ground-beef',
    'כבש': 'lamb',
    'אחר': 'ground-beef'
  };
  
  const defaultCut = categoryMapping[category] || 'ground-beef';
  
  // Find existing cut by category
  const { data: existingCut } = await supabase
    .from('meat_cuts')
    .select('id')
    .eq('name_english', defaultCut)
    .single();
    
  if (existingCut) {
    return existingCut.id;
  }
  
  // Default fallback
  return '1'; // Assuming first meat cut exists
}

// Unit normalization
function normalizeUnit(unit: string): string {
  if (!unit) return 'ק"ג';
  
  const unitLower = unit.toLowerCase();
  
  if (unitLower.includes('ק"ג') || unitLower.includes('קג') || unitLower.includes('kg')) {
    return 'ק"ג';
  }
  
  if (unitLower.includes('גר') || unitLower.includes('gr') || unitLower.includes('gram')) {
    return 'גרם';
  }
  
  if (unitLower.includes('יחידה') || unitLower.includes('יח')) {
    return 'יחידה';
  }
  
  return 'ק"ג'; // Default
}

// Log scanner ingestion for monitoring
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logScannerIngestion(supabase: any, scanInfo: ScannerPayload['scanInfo'], processedCount: number) {
  try {
    await supabase
      .from('scanner_ingestion_logs')
      .insert({
        target_site: scanInfo.targetSite,
        total_products: scanInfo.totalProducts,
        processed_products: processedCount,
        duplicates_removed: scanInfo.duplicatesRemoved,
        average_confidence: calculateAverageConfidence([]),
        processing_time_ms: Date.now() - new Date(scanInfo.timestamp).getTime(),
        status: 'success',
        metadata: {
          test_mode: scanInfo.testMode,
          categories: scanInfo.categories,
          sites: scanInfo.sites
        }
      });
  } catch (error) {
    console.error('Failed to log scanner ingestion:', error);
  }
}

// Calculate average confidence score
function calculateAverageConfidence(products: ScannerProduct[]): number {
  if (products.length === 0) return 0;
  
  const total = products.reduce((sum, product) => sum + product.confidence, 0);
  return Math.round((total / products.length) * 100) / 100;
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({ 
    status: 'Scanner API endpoint active',
    timestamp: new Date().toISOString()
  });
}