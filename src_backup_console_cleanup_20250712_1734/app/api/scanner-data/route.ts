// Scanner Data API - Direct access to scanner_products table for debugging and integration
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get total count and sample data from scanner_products
    const { count, error: countError } = await supabase
      .from('scanner_products')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error getting scanner_products count:', countError);
      return NextResponse.json({
        success: false,
        error: countError.message,
        count: 0,
        products: []
      });
    }

    // Get all scanner products with full details
    const { data: products, error: dataError } = await supabase
      .from('scanner_products')
      .select('*')
      .order('scan_timestamp', { ascending: false });
    
    if (dataError) {
      console.error('Error getting scanner_products data:', dataError);
      return NextResponse.json({
        success: false,
        error: dataError.message,
        count: count || 0,
        products: []
      });
    }

    // Get recent scanner activity
    const { data: activity, error: activityError } = await supabase
      .from('scanner_activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    // Group products by store
    const productsByStore = products?.reduce((acc: any, product: any) => {
      const store = product.store_name || product.store_site;
      if (!acc[store]) {
        acc[store] = [];
      }
      acc[store].push(product);
      return acc;
    }, {}) || {};

    // Calculate statistics
    const validProducts = products?.filter(p => p.is_valid) || [];
    const highConfidenceProducts = products?.filter(p => p.scanner_confidence >= 0.8) || [];
    
    const avgPrice = products?.length ? 
      products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length : 0;
    
    const avgConfidence = products?.length ?
      products.reduce((sum, p) => sum + (p.scanner_confidence || 0), 0) / products.length : 0;

    // Group by category
    const productsByCategory = products?.reduce((acc: any, product: any) => {
      const category = product.category || 'אחר';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {}) || {};

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total_products: count || 0,
        valid_products: validProducts.length,
        high_confidence_products: highConfidenceProducts.length,
        average_price: Math.round(avgPrice * 100) / 100,
        average_confidence: Math.round(avgConfidence * 100) / 100,
        stores_count: Object.keys(productsByStore).length,
        categories_count: Object.keys(productsByCategory).length
      },
      products_by_store: Object.entries(productsByStore).map(([store, products]: [string, any]) => ({
        store_name: store,
        product_count: products.length,
        avg_price: products.length ? products.reduce((sum: number, p: any) => sum + (p.price || 0), 0) / products.length : 0,
        avg_confidence: products.length ? products.reduce((sum: number, p: any) => sum + (p.scanner_confidence || 0), 0) / products.length : 0
      })),
      products_by_category: Object.entries(productsByCategory).map(([category, products]: [string, any]) => ({
        category,
        product_count: products.length,
        avg_price: products.length ? products.reduce((sum: number, p: any) => sum + (p.price || 0), 0) / products.length : 0
      })),
      recent_activity: activity || [],
      sample_products: products?.slice(0, 10) || [],
      all_products: products || []
    });

  } catch (error) {
    console.error('Scanner data API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      count: 0,
      products: []
    }, { status: 500 });
  }
}