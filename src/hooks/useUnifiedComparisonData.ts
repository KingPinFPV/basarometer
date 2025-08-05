// Unified Comparison Data Hook - Phase 0 Product Matching Solution
// Solves the critical duplication issue by grouping identical products from different networks
// Uses advanced Hebrew product normalization and semantic matching

'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  createMasterComparisonData,
  enhancedProductMatching
} from '@/utils/hebrewProductNormalization'
import { useEnhancedMeatData } from './useEnhancedMeatData'
import { usePriceMatrixData } from './usePriceMatrixData'
import { useCombinedComparisonData } from './useCombinedComparisonData'
import { Logger } from '@/lib/discovery/utils/Logger'
import { supabase } from '@/lib/supabase'

export interface UnifiedProduct {
  id: string
  name_hebrew: string
  name_english: string
  category: string
  best_price: number
  worst_price: number
  avg_price: number
  network_prices: Record<string, number>
  availability: number
  savings_potential: number
  confidence_score: number
  matched_products: number
  networks_available: string[]
  trend: 'up' | 'down' | 'stable'
  is_popular: boolean
  quality_tier: string
}

export interface UnificationStats {
  total_raw_products: number
  unified_products: number
  duplication_reduction: number
  networks_covered: number
  average_confidence: number
  top_categories: Array<{ category: string; count: number }>
}

const logger = new Logger('useUnifiedComparisonData')

interface ScannerProduct {
  id: string
  product_name: string
  price: number
  store_name: string
  category?: string
  scanner_confidence?: number
  is_valid: boolean
  is_active: boolean
}

export function useUnifiedComparisonData() {
  const [isUnifying, setIsUnifying] = useState(false)
  const [unificationStats, setUnificationStats] = useState<UnificationStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [directScannerData, setDirectScannerData] = useState<ScannerProduct[]>([])
  const [directLoading, setDirectLoading] = useState(true)

  // FORCE OVERRIDE: Direct fetch from scanner_products instead of complex hooks
  useEffect(() => {
    async function fetchDirectScannerData() {
      try {
        setDirectLoading(true)
        setError(null)
        
        logger.info('Fetching from scanner_products table')
        
        const { data, error: fetchError } = await supabase
          .from('scanner_products')
          .select('*')
          .eq('is_valid', true)
          .eq('is_active', true)
          .order('product_name')
        
        if (fetchError) {
          logger.error('Scanner products fetch error', fetchError)
          setError(`Database error: ${fetchError.message}`)
          return
        }
        
        if (data) {
          logger.info('Scanner products fetched successfully', { count: data.length })
          setDirectScannerData(data)
        }
        
      } catch (err) {
        logger.error('Direct scanner fetch error', err)
        setError(`Error: ${err instanceof Error ? err.message : 'Unknown'}`)
      } finally {
        setDirectLoading(false)
      }
    }
    
    fetchDirectScannerData()
  }, [])

  // Get data from existing hooks
  const { 
    enhancedMeatData, 
    marketInsights,
    loading: meatLoading 
  } = useEnhancedMeatData()
  
  const { 
    priceMatrix, 
    loading: priceLoading 
  } = usePriceMatrixData()

  const {
    combinedProducts: combinedData,
    loading: combinedLoading
  } = useCombinedComparisonData()

  const loading = directLoading || isUnifying

  // Process and unify products
  const unifiedProducts = useMemo(() => {
    // PRIORITIZE SCANNER DATA: Use scanner_products as primary source
    if (directScannerData.length > 0) {
      logger.info('Processing scanner products', { count: directScannerData.length })
      
      try {
        // Convert scanner products to unified format
        const unifiedFromScanner: UnifiedProduct[] = directScannerData.map(product => ({
          id: product.id,
          name_hebrew: product.product_name,
          name_english: product.product_name, // Fallback
          category: product.category || 'לא מסווג',
          best_price: product.price,
          worst_price: product.price, // Single network, so same price
          avg_price: product.price,
          network_prices: { [product.store_name]: product.price },
          availability: 1, // Single network per scanner product
          savings_potential: 0, // No comparison yet for single network
          confidence_score: product.scanner_confidence || 0.8,
          matched_products: 1,
          networks_available: [product.store_name],
          trend: 'stable' as const,
          is_popular: false,
          quality_tier: 'regular'
        }))
        
        // Calculate basic statistics
        const stats: UnificationStats = {
          total_raw_products: directScannerData.length,
          unified_products: unifiedFromScanner.length,
          duplication_reduction: 0, // Scanner data is already unique
          networks_covered: new Set(directScannerData.map(p => p.store_name)).size,
          average_confidence: unifiedFromScanner.reduce((sum, p) => sum + p.confidence_score, 0) / unifiedFromScanner.length,
          top_categories: calculateTopCategories(unifiedFromScanner)
        }
        
        setUnificationStats(stats)
        logger.info('Processed unified products', { count: unifiedFromScanner.length })
        
        return unifiedFromScanner
        
      } catch (err) {
        logger.error('Error processing scanner data', err)
        setError('Failed to process scanner products')
        return []
      }
    }

    // Fallback to complex processing if no scanner data  
    if (!enhancedMeatData && !combinedData) return []
    
    setIsUnifying(true)
    setError(null)

    try {
      // Combine all available product sources
      const allRawProducts: Array<{
        id: string
        name: string
        network: string
        price: number
        category?: string
        brand?: string
        quality_tier?: string
        trend?: 'up' | 'down' | 'stable'
        is_popular?: boolean
        [key: string]: any
      }> = []

      // Add enhanced meat data with price matrix
      if (enhancedMeatData && priceMatrix) {
        enhancedMeatData.forEach(meat => {
          const networkPrices = priceMatrix[meat.id] || {}
          
          // Create separate entries for each network that has this product
          Object.entries(networkPrices).forEach(([networkId, price]) => {
            if (typeof price === 'number' && price > 0) {
              allRawProducts.push({
                id: `${meat.id}_${networkId}`,
                name: meat.name_hebrew,
                network: networkId,
                price: price,
                category: 'בשר',
                quality_tier: meat.quality_grades?.[0]?.tier || 'regular',
                trend: meat.trending_direction || 'stable',
                is_popular: meat.is_popular,
                original_data: meat
              })
            }
          })
        })
      }

      // Add scanner/combined data
      if (combinedData) {
        combinedData.forEach(product => {
          // Skip if already added from enhanced data
          const alreadyExists = allRawProducts.some(p => 
            p.name === product.name_hebrew
          )
          
          if (!alreadyExists && product.best_price > 0) {
            allRawProducts.push({
              id: product.id,
              name: product.name_hebrew,
              network: 'mixed',
              price: product.best_price,
              category: product.category,
              quality_tier: product.quality_tier || 'regular',
              trend: 'stable',
              is_popular: false,
              original_data: product
            })
          }
        })
      }

      // Perform enhanced product matching with Hebrew intelligence
      const productGroups = enhancedProductMatching(allRawProducts, {
        similarityThreshold: 0.75,
        requireSameCategory: true,
        brandAwareness: true
      })

      // Create master comparison data
      const masterData = createMasterComparisonData(productGroups)

      // Enhance with additional properties for UI compatibility
      const enhancedUnifiedProducts: UnifiedProduct[] = masterData.map(product => ({
        ...product,
        name_english: product.name_hebrew, // Fallback for English name
        trend: determineGroupTrend(productGroups.find(g => g.master_id === product.id)),
        is_popular: determineGroupPopularity(productGroups.find(g => g.master_id === product.id)),
        quality_tier: determineGroupQuality(productGroups.find(g => g.master_id === product.id))
      }))

      // Calculate unification statistics
      const stats: UnificationStats = {
        total_raw_products: allRawProducts.length,
        unified_products: enhancedUnifiedProducts.length,
        duplication_reduction: allRawProducts.length > 0 
          ? Math.round(((allRawProducts.length - enhancedUnifiedProducts.length) / allRawProducts.length) * 100)
          : 0,
        networks_covered: new Set(allRawProducts.map(p => p.network)).size,
        average_confidence: enhancedUnifiedProducts.length > 0
          ? enhancedUnifiedProducts.reduce((sum, p) => sum + p.confidence_score, 0) / enhancedUnifiedProducts.length
          : 0,
        top_categories: calculateTopCategories(enhancedUnifiedProducts)
      }

      setUnificationStats(stats)
      setIsUnifying(false)

      return enhancedUnifiedProducts

    } catch (err) {
      logger.error('Error in product unification', err)
      setError('Failed to unify products')
      setIsUnifying(false)
      return []
    }
  }, [directScannerData, enhancedMeatData, priceMatrix, combinedData])

  return {
    unifiedProducts,
    unificationStats,
    marketInsights,
    loading,
    error,
    isUnifying
  }
}

// Helper functions for determining group properties

function determineGroupTrend(group: any): 'up' | 'down' | 'stable' {
  if (!group || !group.products) return 'stable'
  
  const trends = group.products
    .map((p: any) => p.original_data?.trend || p.original_data?.trending_direction)
    .filter(Boolean)
  
  if (trends.length === 0) return 'stable'
  
  const upCount = trends.filter((t: string) => t === 'up').length
  const downCount = trends.filter((t: string) => t === 'down').length
  
  if (upCount > downCount) return 'up'
  if (downCount > upCount) return 'down'
  return 'stable'
}

function determineGroupPopularity(group: any): boolean {
  if (!group || !group.products) return false
  
  const popularityScores = group.products
    .map((p: any) => p.original_data?.is_popular || p.is_popular)
    .filter(Boolean)
  
  // If more than half of the products in the group are popular, consider the group popular
  return popularityScores.length > group.products.length / 2
}

function determineGroupQuality(group: any): string {
  if (!group || !group.products) return 'regular'
  
  const qualities = group.products
    .map((p: any) => p.quality_tier || p.original_data?.quality_tier)
    .filter(Boolean)
  
  if (qualities.length === 0) return 'regular'
  
  // Quality priority: wagyu > angus > premium > veal > regular
  const qualityPriority = { wagyu: 5, angus: 4, premium: 3, veal: 2, regular: 1 }
  
  const bestQuality = qualities.reduce((best, current) => {
    const currentScore = qualityPriority[current as keyof typeof qualityPriority] || 1
    const bestScore = qualityPriority[best as keyof typeof qualityPriority] || 1
    return currentScore > bestScore ? current : best
  }, 'regular')
  
  return bestQuality
}

function calculateTopCategories(products: UnifiedProduct[]): Array<{ category: string; count: number }> {
  const categoryCounts = products.reduce((acc, product) => {
    const category = product.category || 'לא מזוהה'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

// Additional hook for debugging and analysis
export function useProductMatchingAnalysis() {
  const { unifiedProducts, unificationStats } = useUnifiedComparisonData()
  
  const analysis = useMemo(() => {
    if (!unifiedProducts || unifiedProducts.length === 0) return null
    
    return {
      // Duplication analysis
      duplicates_eliminated: unificationStats?.duplication_reduction || 0,
      
      // Network coverage analysis
      network_distribution: unifiedProducts.reduce((acc, product) => {
        product.networks_available.forEach(network => {
          acc[network] = (acc[network] || 0) + 1
        })
        return acc
      }, {} as Record<string, number>),
      
      // Price savings analysis
      total_savings_potential: unifiedProducts.reduce((sum, product) => 
        sum + product.savings_potential, 0
      ) / unifiedProducts.length,
      
      // Confidence analysis
      high_confidence_matches: unifiedProducts.filter(p => p.confidence_score > 0.8).length,
      low_confidence_matches: unifiedProducts.filter(p => p.confidence_score < 0.6).length,
      
      // Multi-network products
      multi_network_products: unifiedProducts.filter(p => p.availability > 1).length,
      single_network_products: unifiedProducts.filter(p => p.availability === 1).length
    }
  }, [unifiedProducts, unificationStats])
  
  return analysis
}