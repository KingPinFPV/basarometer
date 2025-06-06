// Enhanced Product Matrix API - Market Intelligence Integration
// Serves the MeatIntelligenceMatrix component with comprehensive data
// Built on existing V5.2 patterns with Enhanced Intelligence System

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface QualityBreakdown {
  total_variations: number
  by_quality: Record<string, number>
  most_common_grade: string
  premium_percentage: number
  cuts_analyzed: number
}

interface MarketInsights {
  total_products: number
  active_retailers: number
  avg_confidence: number
  avg_price_per_kg: number
  coverage_percentage: number
  enhanced_cuts_count: number
  trend_indicators: {
    price_direction: string
    availability_trend: string
    quality_trend: string
  }
}

interface PerformanceMetrics {
  data_freshness: number
  system_accuracy: number
  data_completeness: number
  last_scan: string | null
}

interface EnhancedMatrixData {
  success: boolean
  data: {
    enhanced_cuts: EnhancedMeatCut[]
    quality_breakdown: QualityBreakdown
    market_insights: MarketInsights
    performance_metrics: PerformanceMetrics
  }
  metadata: {
    last_updated: string
    data_sources: string[]
    query_time_ms: number
  }
}

interface EnhancedMeatCut {
  id: string
  name_hebrew: string
  name_english: string
  normalized_cut_id: string
  category: {
    id: string
    name_hebrew: string
    name_english: string
  }
  quality_grades: QualityGrade[]
  variations_count: number
  price_data: {
    min_price: number
    max_price: number
    avg_price: number
    price_trend: 'up' | 'down' | 'stable'
  }
  market_metrics: {
    coverage_percentage: number
    availability_score: number
    popularity_rank: number
  }
  retailers: RetailerPriceData[]
}

interface QualityGrade {
  tier: 'regular' | 'premium' | 'angus' | 'wagyu' | 'veal'
  count: number
  avg_price: number
  market_share: number
}

interface RetailerPriceData {
  retailer_id: string
  retailer_name: string
  current_price: number
  price_confidence: number
  last_updated: string
  is_available: boolean
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const quality_filter = searchParams.get('quality')
    const include_scanner = searchParams.get('include_scanner') !== 'false'

    // Fetch enhanced meat cuts with comprehensive data
    let baseQuery = supabase
      .from('meat_cuts')
      .select(`
        *,
        category:meat_categories(*),
        sub_category:meat_sub_categories(*)
      `)
      .eq('is_active', true)

    if (category) {
      baseQuery = baseQuery.eq('meat_categories.name_hebrew', category)
    }

    const { data: meatCuts, error: cutsError } = await baseQuery

    if (cutsError) throw cutsError

    // Fetch quality mappings and name variations
    const { data: qualityMappings, error: mappingsError } = await supabase
      .from('meat_name_mappings')
      .select('*')
      .gte('confidence_score', 0.7)

    if (mappingsError) throw mappingsError

    // Fetch current price data from integrated view
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: priceData, error: priceError } = await supabase
      .from('integrated_price_view')
      .select('*')
      .eq('is_active', true)
      .gte('created_at', thirtyDaysAgo)

    if (priceError) throw priceError

    // Fetch scanner data if requested
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scannerData: any[] = []
    if (include_scanner) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: scanData, error: scanError } = await supabase
        .from('scanner_products')
        .select('*')
        .eq('is_active', true)
        .gte('scan_timestamp', sevenDaysAgo)

      if (scanError) throw scanError
      scannerData = scanData || []
    }

    // Fetch retailers for context
    const { data: retailers, error: retailersError } = await supabase
      .from('retailers')
      .select('id, name, type')
      .eq('is_active', true)

    if (retailersError) throw retailersError

    // Process and enhance the data
    const enhancedCuts = await processEnhancedMatrixData(
      meatCuts || [],
      qualityMappings || [],
      priceData || [],
      scannerData,
      retailers || [],
      quality_filter
    )

    // Calculate comprehensive quality breakdown
    const qualityBreakdown = calculateQualityBreakdown(qualityMappings || [], enhancedCuts)

    // Calculate market insights
    const marketInsights = calculateMarketInsights(
      enhancedCuts,
      priceData || [],
      scannerData,
      retailers || []
    )

    // Calculate performance metrics
    const performanceMetrics = calculatePerformanceMetrics(
      priceData || [],
      scannerData,
      qualityMappings || []
    )

    const queryTime = Date.now() - startTime

    const response: EnhancedMatrixData = {
      success: true,
      data: {
        enhanced_cuts: enhancedCuts,
        quality_breakdown: qualityBreakdown,
        market_insights: marketInsights,
        performance_metrics: performanceMetrics
      },
      metadata: {
        last_updated: new Date().toISOString(),
        data_sources: ['meat_cuts', 'meat_name_mappings', 'integrated_price_view', ...(include_scanner ? ['scanner_products'] : [])],
        query_time_ms: queryTime
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Enhanced Matrix API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch enhanced matrix data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Process raw data into enhanced matrix format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processEnhancedMatrixData(
  meatCuts: any[],
  qualityMappings: any[],
  priceData: any[],
  scannerData: any[],
  retailers: any[],
  qualityFilter?: string | null
): Promise<EnhancedMeatCut[]> {
  const enhancedCuts = meatCuts
    .map(cut => {
      // Find variations and quality grades for this cut
      const variations = qualityMappings.filter(mapping => 
        mapping.normalized_name === cut.name_hebrew ||
        mapping.meat_cut_id === cut.id
      )

      // Extract and filter quality grades
      const qualityGrades = extractQualityGrades(variations, priceData, cut.id)
      
      if (qualityFilter && !qualityGrades.some(grade => grade.tier === qualityFilter)) {
        return null // Filter out cuts that don't match quality filter
      }

      // Calculate price data
      const cutPrices = priceData
        .filter(price => price.meat_cut_id === cut.id)
        .map(price => parseFloat(price.price_per_kg))
        .filter(price => !isNaN(price))

      const priceMetrics = calculatePriceMetrics(cutPrices, scannerData, cut.id)

      // Calculate market metrics
      const marketMetrics = calculateMarketMetrics(priceData, cut.id, retailers.length)

      // Get retailer-specific data
      const retailerData = getRetailerPriceData(priceData, cut.id, retailers)

      return {
        id: cut.id,
        name_hebrew: cut.name_hebrew,
        name_english: cut.name_english || '',
        normalized_cut_id: cut.normalized_cut_id || generateNormalizedId(cut.name_hebrew),
        category: {
          id: cut.category?.id || '',
          name_hebrew: cut.category?.name_hebrew || '',
          name_english: cut.category?.name_english || ''
        },
        quality_grades: qualityGrades,
        variations_count: variations.length,
        price_data: priceMetrics,
        market_metrics: marketMetrics,
        retailers: retailerData
      }
    })
    .filter(Boolean) as EnhancedMeatCut[]

  return enhancedCuts.sort((a, b) => {
    // Sort by popularity and market coverage
    if (a.market_metrics.popularity_rank !== b.market_metrics.popularity_rank) {
      return a.market_metrics.popularity_rank - b.market_metrics.popularity_rank
    }
    return b.market_metrics.coverage_percentage - a.market_metrics.coverage_percentage
  })
}

// Extract quality grades with market data
function extractQualityGrades(variations: any[], priceData: any[], cutId: string): QualityGrade[] {
  const gradeMap = new Map<string, { count: number; prices: number[] }>()

  variations.forEach(variation => {
    const tier = variation.quality_grade || 'regular'
    if (!gradeMap.has(tier)) {
      gradeMap.set(tier, { count: 0, prices: [] })
    }
    gradeMap.get(tier)!.count++
  })

  // Add price data for each grade
  priceData
    .filter(price => price.meat_cut_id === cutId)
    .forEach(price => {
      const grade = price.scanner_grade || 'regular'
      if (gradeMap.has(grade)) {
        gradeMap.get(grade)!.prices.push(parseFloat(price.price_per_kg))
      }
    })

  const totalVariations = variations.length

  return Array.from(gradeMap.entries()).map(([tier, data]) => ({
    tier: tier as any,
    count: data.count,
    avg_price: data.prices.length > 0 ? data.prices.reduce((a, b) => a + b, 0) / data.prices.length : 0,
    market_share: totalVariations > 0 ? (data.count / totalVariations) * 100 : 0
  }))
}

// Calculate comprehensive price metrics
function calculatePriceMetrics(prices: number[], scannerData: any[], cutId: string): any {
  if (prices.length === 0) {
    return {
      min_price: 0,
      max_price: 0,
      avg_price: 0,
      price_trend: 'stable'
    }
  }

  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length

  // Calculate trend from scanner data
  const recentPrices = scannerData
    .filter(product => product.meat_cut_id === cutId)
    .sort((a, b) => new Date(b.scan_timestamp).getTime() - new Date(a.scan_timestamp).getTime())
    .slice(0, 10)
    .map(product => parseFloat(product.price_per_kg))
    .filter(price => !isNaN(price))

  const priceTrend = calculatePriceTrend(recentPrices)

  return {
    min_price: minPrice,
    max_price: maxPrice,
    avg_price: avgPrice,
    price_trend: priceTrend
  }
}

// Calculate market metrics
function calculateMarketMetrics(priceData: any[], cutId: string, totalRetailers: number): any {
  const cutData = priceData.filter(price => price.meat_cut_id === cutId)
  const uniqueRetailers = new Set(cutData.map(price => price.retailer_id)).size
  
  const coveragePercentage = totalRetailers > 0 ? (uniqueRetailers / totalRetailers) * 100 : 0
  const availabilityScore = Math.min(100, coveragePercentage * 1.2) // Boost score slightly
  
  // Calculate popularity rank based on price reports count and coverage
  const popularityScore = cutData.length * 0.6 + coveragePercentage * 0.4
  const popularityRank = Math.ceil(popularityScore / 10) // Simplified ranking

  return {
    coverage_percentage: Math.round(coveragePercentage),
    availability_score: Math.round(availabilityScore),
    popularity_rank: popularityRank
  }
}

// Get retailer-specific price data
function getRetailerPriceData(priceData: any[], cutId: string, retailers: any[]): RetailerPriceData[] {
  const retailerMap = new Map(retailers.map(r => [r.id, r]))
  
  const cutPrices = priceData.filter(price => price.meat_cut_id === cutId)
  const retailerPrices = new Map<string, any>()

  // Get latest price for each retailer
  cutPrices.forEach(price => {
    const retailerId = price.retailer_id
    if (!retailerPrices.has(retailerId) || 
        new Date(price.created_at) > new Date(retailerPrices.get(retailerId).created_at)) {
      retailerPrices.set(retailerId, price)
    }
  })

  return Array.from(retailerPrices.entries()).map(([retailerId, priceInfo]) => {
    const retailer = retailerMap.get(retailerId)
    return {
      retailer_id: retailerId,
      retailer_name: retailer?.name || 'Unknown',
      current_price: parseFloat(priceInfo.price_per_kg) || 0,
      price_confidence: parseFloat(priceInfo.confidence) || 0,
      last_updated: priceInfo.created_at,
      is_available: true
    }
  })
}

// Calculate comprehensive quality breakdown
function calculateQualityBreakdown(mappings: any[], enhancedCuts: EnhancedMeatCut[]): any {
  const totalVariations = mappings.length
  const byQuality: Record<string, number> = {}
  
  mappings.forEach(mapping => {
    const grade = mapping.quality_grade || 'regular'
    byQuality[grade] = (byQuality[grade] || 0) + 1
  })

  const mostCommonGrade = Object.entries(byQuality)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'regular'
  
  const premiumCount = (byQuality.premium || 0) + (byQuality.angus || 0) + (byQuality.wagyu || 0)
  const premiumPercentage = totalVariations > 0 ? (premiumCount / totalVariations) * 100 : 0

  return {
    total_variations: totalVariations,
    by_quality: byQuality,
    most_common_grade: mostCommonGrade,
    premium_percentage: Math.round(premiumPercentage),
    cuts_analyzed: enhancedCuts.length
  }
}

// Calculate comprehensive market insights
function calculateMarketInsights(
  enhancedCuts: EnhancedMeatCut[],
  priceData: any[],
  scannerData: any[],
  retailers: any[]
): any {
  const totalProducts = priceData.length
  const activeRetailers = retailers.length
  
  const avgConfidence = scannerData.length > 0 
    ? scannerData.reduce((sum, p) => sum + (parseFloat(p.scanner_confidence) || 0), 0) / scannerData.length
    : 0

  const avgPricePerKg = priceData.length > 0
    ? priceData.reduce((sum, p) => sum + (parseFloat(p.price_per_kg) || 0), 0) / priceData.length
    : 0

  const totalCoverage = enhancedCuts.length > 0
    ? enhancedCuts.reduce((sum, cut) => sum + cut.market_metrics.coverage_percentage, 0) / enhancedCuts.length
    : 0

  return {
    total_products: totalProducts,
    active_retailers: activeRetailers,
    avg_confidence: Math.round(avgConfidence * 100) / 100,
    avg_price_per_kg: Math.round(avgPricePerKg * 100) / 100,
    coverage_percentage: Math.round(totalCoverage),
    enhanced_cuts_count: enhancedCuts.length,
    trend_indicators: {
      price_direction: calculateOverallPriceTrend(priceData),
      availability_trend: calculateAvailabilityTrend(scannerData),
      quality_trend: calculateQualityTrend(scannerData)
    }
  }
}

// Calculate performance metrics
function calculatePerformanceMetrics(
  priceData: any[],
  scannerData: any[],
  mappings: any[]
): any {
  const dataFreshness = calculateDataFreshness(priceData, scannerData)
  const systemAccuracy = calculateSystemAccuracy(mappings)
  const dataCompletenesss = calculateDataCompleteness(priceData, scannerData)

  return {
    data_freshness: dataFreshness,
    system_accuracy: systemAccuracy,
    data_completeness: dataCompletenesss,
    last_scan: scannerData.length > 0 ? scannerData[0].scan_timestamp : null
  }
}

// Helper functions
function generateNormalizedId(hebrewName: string): string {
  return hebrewName
    .replace(/\s+/g, '_')
    .replace(/[^\u0590-\u05FF\w]/g, '')
    .toLowerCase()
}

function calculatePriceTrend(prices: number[]): 'up' | 'down' | 'stable' {
  if (prices.length < 2) return 'stable'
  
  const recent = prices.slice(0, Math.ceil(prices.length / 2))
  const older = prices.slice(Math.ceil(prices.length / 2))
  
  const recentAvg = recent.reduce((sum, p) => sum + p, 0) / recent.length
  const olderAvg = older.reduce((sum, p) => sum + p, 0) / older.length
  
  const threshold = olderAvg * 0.05 // 5% threshold
  
  if (recentAvg > olderAvg + threshold) return 'up'
  if (recentAvg < olderAvg - threshold) return 'down'
  return 'stable'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
function calculateOverallPriceTrend(_priceData: any[]): 'up' | 'down' | 'stable' {
  // Simplified implementation
  return 'stable'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
function calculateAvailabilityTrend(_scannerData: any[]): 'increasing' | 'decreasing' | 'stable' {
  // Simplified implementation
  return 'stable'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
function calculateQualityTrend(_scannerData: any[]): 'improving' | 'declining' | 'stable' {
  // Simplified implementation
  return 'stable'
}

function calculateDataFreshness(priceData: any[], scannerData: any[]): number {
  const now = Date.now()
  const oneDayMs = 24 * 60 * 60 * 1000
  
  const freshPrices = priceData.filter(p => 
    now - new Date(p.created_at).getTime() < oneDayMs
  ).length
  
  const freshScans = scannerData.filter(s => 
    now - new Date(s.scan_timestamp).getTime() < oneDayMs
  ).length

  const totalRecords = priceData.length + scannerData.length
  const freshRecords = freshPrices + freshScans
  
  return totalRecords > 0 ? Math.round((freshRecords / totalRecords) * 100) : 0
}

function calculateSystemAccuracy(mappings: any[]): number {
  const highConfidenceMappings = mappings.filter(m => m.confidence_score >= 0.8).length
  return mappings.length > 0 ? Math.round((highConfidenceMappings / mappings.length) * 100) : 0
}

function calculateDataCompleteness(priceData: any[], scannerData: any[]): number {
  const completeRecords = priceData.filter(p => 
    p.price_per_kg && p.retailer_id && p.meat_cut_id
  ).length + scannerData.filter(s => 
    s.price_per_kg && s.product_name && s.store_name
  ).length
  
  const totalRecords = priceData.length + scannerData.length
  return totalRecords > 0 ? Math.round((completeRecords / totalRecords) * 100) : 0
}