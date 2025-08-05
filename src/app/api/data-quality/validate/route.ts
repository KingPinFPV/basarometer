// Data Quality Validation API
// Endpoint to validate and clean meat data contamination

import { NextRequest, NextResponse } from 'next/server'
import { MeatDataValidator } from '@/lib/data-quality/MeatDataValidator'
import { supabase } from '@/lib/supabase'
import { Logger } from '@/lib/discovery/utils/Logger'

const logger = new Logger('DataQualityValidationAPI');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { products, validate_database = false } = body

    if (!products && !validate_database) {
      return NextResponse.json(
        { success: false, error: 'Products array or validate_database flag required' },
        { status: 400 }
      )
    }

    const validator = MeatDataValidator.getInstance()
    await validator.initialize()

    let validationResults
    
    if (validate_database) {
      // Validate all products in database
      validationResults = await validateDatabaseProducts(validator)
    } else {
      // Validate provided products
      validationResults = await validator.validateBulkProducts(products)
    }

    return NextResponse.json({
      success: true,
      data: validationResults,
      cache_stats: validator.getCacheStats()
    })

  } catch (error) {
    logger.error('Data quality validation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to validate data quality',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productName = searchParams.get('product_name')
    const category = searchParams.get('category')

    if (!productName) {
      return NextResponse.json(
        { success: false, error: 'product_name parameter required' },
        { status: 400 }
      )
    }

    const validator = MeatDataValidator.getInstance()
    await validator.initialize()
    
    const result = await validator.validateProduct(productName, category || undefined)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    logger.error('Single product validation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to validate product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function validateDatabaseProducts(validator: MeatDataValidator) {
  // Fetch all products from various tables
  const [meatCuts, scannerProducts, priceReports] = await Promise.all([
    fetchMeatCuts(),
    fetchScannerProducts(),
    fetchPriceReports()
  ])

  // Combine all products for validation
  const allProducts = [
    ...meatCuts.map((cut: any) => ({ name: cut.name_hebrew, category: cut.category?.name_hebrew })),
    ...scannerProducts.map((product: any) => ({ name: product.product_name, category: product.category })),
    ...priceReports.map((report: any) => ({ name: report.product_name, category: report.category }))
  ]

  const report = await validator.validateBulkProducts(allProducts)
  
  // Add database-specific insights
  return {
    ...report,
    database_breakdown: {
      meat_cuts: meatCuts.length,
      scanner_products: scannerProducts.length, 
      price_reports: priceReports.length
    },
    tables_analyzed: ['meat_cuts', 'scanner_products', 'price_reports']
  }
}

async function fetchMeatCuts() {
  try {
    const { data } = await supabase
      .from('meat_cuts')
      .select(`
        name_hebrew,
        name_english,
        category:meat_categories(name_hebrew, name_english)
      `)
    
    return data || []
  } catch (error) {
    logger.warn('Could not fetch meat_cuts:', error)
    return []
  }
}

async function fetchScannerProducts() {
  try {
    const { data } = await supabase
      .from('scanner_products')
      .select('product_name, category')
      .eq('is_valid', true)
    
    return data || []
  } catch (error) {
    logger.warn('Could not fetch scanner_products:', error)
    return []
  }
}

async function fetchPriceReports() {
  try {
    const { data } = await supabase
      .from('price_reports')
      .select('product_name, category')
      .eq('is_active', true)
    
    return data || []
  } catch (error) {
    logger.warn('Could not fetch price_reports:', error)
    return []
  }
}