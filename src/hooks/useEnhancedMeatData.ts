// Enhanced Meat Data Hook with Real Market Intelligence
// Integrates with 54+ normalized cuts and quality grade classification
// Built on existing Supabase patterns from claude.md

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface QualityGrade {
  id: string
  name_hebrew: string
  name_english: string
  tier: 'regular' | 'premium' | 'angus' | 'wagyu' | 'veal'
  color: string
  description: string
}

interface EnhancedMeatCut {
  id: string
  name_hebrew: string
  name_english: string
  normalized_cut_id: string
  quality_grades: QualityGrade[]
  variations_count: number
  avg_price_range: {
    min: number
    max: number
  }
  is_popular: boolean
  market_coverage: number
  trending_direction: 'up' | 'down' | 'stable'
  last_price_update: string
}

interface QualityBreakdown {
  total_variations: number
  by_quality: Record<string, number>
  most_common_grade: string
  premium_percentage: number
}

interface MarketInsights {
  total_products: number
  active_retailers: number
  avg_confidence: number
  avg_price_per_kg: number
  coverage_percentage: number
  last_updated: string
  trend_indicators: {
    price_direction: 'up' | 'down' | 'stable'
    availability_trend: 'increasing' | 'decreasing' | 'stable'
    quality_trend: 'improving' | 'declining' | 'stable'
  }
}

export function useEnhancedMeatData(categoryFilter?: string) {
  const [enhancedMeatData, setEnhancedMeatData] = useState<EnhancedMeatCut[]>([])
  const [qualityBreakdown, setQualityBreakdown] = useState<QualityBreakdown | null>(null)
  const [marketInsights, setMarketInsights] = useState<MarketInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Fetch enhanced meat data with intelligence using API endpoint
  const fetchEnhancedMeatData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch from the enhanced matrix API endpoint that includes ALL products
      const apiUrl = `/api/products/enhanced/matrix${categoryFilter ? `?category=${encodeURIComponent(categoryFilter)}` : ''}`
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'API request failed')
      }
      
      // FIXED: Extract data from correct nested structure
      const enhancedCuts = result.data?.enhanced_cuts || []
      const qualityBreakdown = result.data?.quality_breakdown || {
        total_variations: 0,
        by_quality: {},
        most_common_grade: 'regular',
        premium_percentage: 0
      }
      const marketInsights = result.data?.market_insights || {
        total_products: 0,
        active_retailers: 0,
        avg_confidence: 0,
        avg_price_per_kg: 0,
        coverage_percentage: 0,
        last_updated: new Date().toISOString(),
        trend_indicators: { price_direction: 'stable', availability_trend: 'stable', quality_trend: 'stable' }
      }
      
      // Debug info for API data extraction (removed for production)

      setEnhancedMeatData(enhancedCuts)
      setQualityBreakdown(qualityBreakdown)
      setMarketInsights(marketInsights)

      // Reset retry count on success
      setRetryCount(0)

    } catch (err) {
      console.error('Error fetching enhanced meat data:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      
      // Only set error state for non-400 errors or after multiple retries
      if (retryCount >= 2 || !errorMessage.includes('400')) {
        setError(errorMessage)
      } else {
        // Retry with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          fetchEnhancedMeatData()
        }, delay)
        return
      }
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, retryCount])

  useEffect(() => {
    fetchEnhancedMeatData()
  }, [fetchEnhancedMeatData])

  // Real-time subscriptions for live updates (with error handling)
  useEffect(() => {
    if (error) return // Don't subscribe if there are errors

    const channel = supabase
      .channel('enhanced-meat-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'meat_name_mappings'
      }, () => {
        // Debounce the refetch to prevent flooding
        const timeoutId = setTimeout(() => {
          fetchEnhancedMeatData()
        }, 2000)
        return () => clearTimeout(timeoutId)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'scanner_products'
      }, () => {
        // Debounce the refetch to prevent flooding
        const timeoutId = setTimeout(() => {
          fetchEnhancedMeatData()
        }, 2000)
        return () => clearTimeout(timeoutId)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIPTION_ERROR') {
          console.warn('Real-time subscription failed, continuing without live updates')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchEnhancedMeatData, error])

  return {
    enhancedMeatData,
    qualityBreakdown,
    marketInsights,
    loading,
    error,
    refetch: fetchEnhancedMeatData
  }
}

// Process raw data into enhanced meat cuts
async function processEnhancedMeatData(
  meatCuts: any[],
  qualityMappings: any[],
  priceData: any[],
  scannerData: any[]
): Promise<EnhancedMeatCut[]> {
  if (!Array.isArray(meatCuts)) return []
  
  return meatCuts.map(cut => {
    // Find variations for this cut
    const variations = Array.isArray(qualityMappings) ? qualityMappings.filter(mapping => 
      mapping?.normalized_name === cut?.name_hebrew ||
      mapping?.meat_cut_id === cut?.id
    ) : []

    // Extract quality grades
    const qualityGrades = extractQualityGrades(variations)

    // Calculate price range from current market data
    const cutPrices = Array.isArray(priceData) ? priceData
      .filter(price => price?.meat_cut_id === cut?.id)
      .map(price => parseFloat(price?.price_per_kg))
      .filter(price => !isNaN(price)) : []

    const priceRange = Array.isArray(cutPrices) && cutPrices.length > 0 ? {
      min: Math.min(...cutPrices),
      max: Math.max(...cutPrices)
    } : { min: 0, max: 0 }

    // Calculate market coverage (percentage of retailers carrying this cut)
    const uniqueRetailers = Array.isArray(priceData) ? new Set(
      priceData
        .filter(price => price?.meat_cut_id === cut?.id)
        .map(price => price?.retailer_id)
        .filter(Boolean)
    ).size : 0

    const totalRetailers = Array.isArray(priceData) ? new Set(priceData.map(price => price?.retailer_id).filter(Boolean)).size : 0
    const marketCoverage = totalRetailers > 0 ? (uniqueRetailers / totalRetailers) * 100 : 0

    // Calculate trending direction from recent scanner data
    const recentPrices = Array.isArray(scannerData) ? scannerData
      .filter(product => product?.meat_cut_id === cut?.id)
      .sort((a, b) => new Date(b?.scan_timestamp).getTime() - new Date(a?.scan_timestamp).getTime())
      .slice(0, 10)
      .map(product => parseFloat(product?.price_per_kg))
      .filter(price => !isNaN(price)) : []

    const trendingDirection = calculateTrendingDirection(recentPrices)

    return {
      id: cut?.id || '',
      name_hebrew: cut?.name_hebrew || '',
      name_english: cut?.name_english || '',
      normalized_cut_id: cut?.normalized_cut_id || generateNormalizedId(cut?.name_hebrew || ''),
      quality_grades: qualityGrades,
      variations_count: variations.length,
      avg_price_range: priceRange,
      is_popular: cut.is_popular || marketCoverage > 50,
      market_coverage: Math.round(marketCoverage),
      trending_direction: trendingDirection,
      last_price_update: getLatestPriceUpdate(priceData, cut.id)
    }
  })
}

// Extract quality grades from variations
function extractQualityGrades(variations: any[]): QualityGrade[] {
  const gradeMap = new Map<string, QualityGrade>()

  if (Array.isArray(variations)) {
    variations.forEach(variation => {
      const tier = variation?.quality_grade || 'regular'
      
      if (!gradeMap.has(tier)) {
        gradeMap.set(tier, {
          id: tier,
          name_hebrew: getHebrewGradeName(tier),
          name_english: tier,
          tier: tier as any,
          color: getGradeColor(tier),
          description: getGradeDescription(tier)
        })
      }
    })
  }

  return Array.from(gradeMap.values())
}

// Calculate quality breakdown statistics
function calculateQualityBreakdown(mappings: any[]): QualityBreakdown {
  const byQuality: Record<string, number> = {}
  
  if (Array.isArray(mappings)) {
    mappings.forEach(mapping => {
      const grade = mapping?.quality_grade || 'regular'
      byQuality[grade] = (byQuality[grade] || 0) + 1
    })
  }

  const totalVariations = Array.isArray(mappings) ? mappings.length : 0
  const mostCommonGrade = Object.entries(byQuality)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'regular'
  
  const premiumCount = (byQuality.premium || 0) + (byQuality.angus || 0) + (byQuality.wagyu || 0)
  const premiumPercentage = totalVariations > 0 ? (premiumCount / totalVariations) * 100 : 0

  return {
    total_variations: totalVariations,
    by_quality: byQuality,
    most_common_grade: mostCommonGrade,
    premium_percentage: Math.round(premiumPercentage)
  }
}

// Calculate comprehensive market insights
function calculateMarketInsights(
  enhancedCuts: EnhancedMeatCut[],
  priceData: any[],
  scannerData: any[]
): MarketInsights {
  const totalProducts = Array.isArray(priceData) ? priceData.length : 0
  const activeRetailers = Array.isArray(priceData) ? new Set(priceData.map(p => p?.retailer_id).filter(Boolean)).size : 0
  
  const avgConfidence = Array.isArray(scannerData) && scannerData.length > 0 
    ? scannerData.reduce((sum, p) => sum + (parseFloat(p?.scanner_confidence) || 0), 0) / scannerData.length
    : 0

  const avgPricePerKg = Array.isArray(priceData) && priceData.length > 0
    ? priceData.reduce((sum, p) => sum + (parseFloat(p?.price_per_kg) || 0), 0) / priceData.length
    : 0

  const coveragePercentage = Array.isArray(enhancedCuts) && enhancedCuts.length > 0
    ? enhancedCuts.reduce((sum, cut) => sum + (cut?.market_coverage || 0), 0) / enhancedCuts.length
    : 0

  return {
    total_products: totalProducts,
    active_retailers: activeRetailers,
    avg_confidence: avgConfidence,
    avg_price_per_kg: avgPricePerKg,
    coverage_percentage: Math.round(coveragePercentage),
    last_updated: new Date().toISOString(),
    trend_indicators: {
      price_direction: calculateOverallPriceTrend(priceData),
      availability_trend: calculateAvailabilityTrend(scannerData),
      quality_trend: calculateQualityTrend(scannerData)
    }
  }
}

// Helper functions
function getHebrewGradeName(tier: string): string {
  const names: Record<string, string> = {
    regular: 'רגיל',
    premium: 'פרמיום',
    angus: 'אנגוס',
    wagyu: 'וואגיו',
    veal: 'עגל'
  }
  return names[tier] || tier
}

function getGradeColor(tier: string): string {
  const colors: Record<string, string> = {
    regular: '#6B7280',
    premium: '#3B82F6',
    angus: '#10B981',
    wagyu: '#8B5CF6',
    veal: '#EC4899'
  }
  return colors[tier] || '#6B7280'
}

function getGradeDescription(tier: string): string {
  const descriptions: Record<string, string> = {
    regular: 'איכות סטנדרטית',
    premium: 'איכות מעולה',
    angus: 'בקר אנגוס מובחר',
    wagyu: 'בקר וואגיו יפני',
    veal: 'בשר עגל צעיר'
  }
  return descriptions[tier] || ''
}

function generateNormalizedId(hebrewName: string): string {
  return hebrewName
    .replace(/\s+/g, '_')
    .replace(/[^\u0590-\u05FF\w]/g, '')
    .toLowerCase()
}

function calculateTrendingDirection(prices: number[]): 'up' | 'down' | 'stable' {
  if (prices.length < 2) return 'stable'
  
  const recent = prices.slice(0, Math.ceil(prices.length / 2))
  const older = prices.slice(Math.ceil(prices.length / 2))
  
  const recentAvg = Array.isArray(recent) && recent.length > 0 ? recent.reduce((sum, p) => sum + (p || 0), 0) / recent.length : 0
  const olderAvg = Array.isArray(older) && older.length > 0 ? older.reduce((sum, p) => sum + (p || 0), 0) / older.length : 0
  
  const threshold = olderAvg * 0.05 // 5% threshold
  
  if (recentAvg > olderAvg + threshold) return 'up'
  if (recentAvg < olderAvg - threshold) return 'down'
  return 'stable'
}

function getLatestPriceUpdate(priceData: any[], cutId: string): string {
  if (!Array.isArray(priceData) || !cutId) {
    return new Date().toISOString()
  }
  
  const cutPrices = priceData
    .filter(price => price?.meat_cut_id === cutId)
    .sort((a, b) => new Date(b?.created_at).getTime() - new Date(a?.created_at).getTime())
  
  return cutPrices[0]?.created_at || new Date().toISOString()
}

function calculateOverallPriceTrend(priceData: any[]): 'up' | 'down' | 'stable' {
  // Implementation for overall price trend analysis
  return 'stable'
}

function calculateAvailabilityTrend(scannerData: any[]): 'increasing' | 'decreasing' | 'stable' {
  // Implementation for availability trend analysis
  return 'stable'
}

function calculateQualityTrend(scannerData: any[]): 'improving' | 'declining' | 'stable' {
  // Implementation for quality trend analysis
  return 'stable'
}