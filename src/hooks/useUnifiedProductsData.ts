// Direct Unified Products Data Hook - V6.0 Production Data Access
// Fetches directly from unified_products table with all 194 products
// Optimized for the comparison page component

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Logger } from '@/lib/discovery/utils/Logger'

export interface UnifiedProduct {
  id: string
  name: string
  normalized_name: string
  category: string
  network_prices: Record<string, number>
  networks_available: string[]
  network_count: number
  price_statistics: {
    min_price: number
    max_price: number
    avg_price: number
    price_range: number
  }
  market_insights: {
    cross_network_variance: number
    price_volatility: string
    best_value_network: string
    premium_network: string
  }
  updated_at: string
}

export interface UnifiedProductsMetrics {
  total_products: number
  networks_covered: number
  avg_network_count: number
  cross_network_products: number
  total_price_points: number
  last_updated: string
}

const logger = new Logger('useUnifiedProductsData')

export function useUnifiedProductsData(categoryFilter?: string, onlyMeatProducts = false) {
  const [products, setProducts] = useState<UnifiedProduct[]>([])
  const [metrics, setMetrics] = useState<UnifiedProductsMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUnifiedProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      logger.info('Fetching unified products from database', { categoryFilter, onlyMeatProducts })
      
      // Test connection first
      const { data: testData, error: testError } = await supabase
        .from('unified_products')
        .select('count', { count: 'exact', head: true })
        
      if (testError) {
        logger.error('Database connection test failed', testError)
        throw new Error(`Database connection failed: ${testError.message}`)
      }
      
      logger.info('Database connection successful', { totalRecords: testData })

      // Build query
      let query = supabase
        .from('unified_products')
        .select('*')
        .order('network_count', { ascending: false })

      // Apply category filter if provided
      if (categoryFilter) {
        query = query.eq('category', categoryFilter)
      } else if (onlyMeatProducts) {
        // Filter for meat-related categories only
        query = query.in('category', ['בקר', 'עוף', 'פנימיות', 'מעובד', 'כבש', 'חזיר'])
      }

      const { data, error: queryError } = await query

      if (queryError) {
        logger.error('Database query failed', queryError)
        throw new Error(`Database query failed: ${queryError.message}`)
      }

      if (!data) {
        logger.error('No data returned from database')
        throw new Error('No data returned from database')
      }

      logger.info('Successfully fetched unified products', { 
        count: data.length,
        samples: data.slice(0, 3).map(p => ({ id: p.id, name: p.name, category: p.category }))
      })

      // Process and enhance the data
      const processedProducts: UnifiedProduct[] = data.map(product => ({
        id: product.id,
        name: product.name,
        normalized_name: product.normalized_name,
        category: product.category,
        network_prices: product.network_prices || {},
        networks_available: product.networks_available || [],
        network_count: product.network_count || 0,
        price_statistics: product.price_statistics || {
          min_price: 0,
          max_price: 0,
          avg_price: 0,
          price_range: 0
        },
        market_insights: product.market_insights || {
          cross_network_variance: 0,
          price_volatility: 'stable',
          best_value_network: '',
          premium_network: ''
        },
        updated_at: product.updated_at || new Date().toISOString()
      }))

      // Calculate metrics
      const calculatedMetrics: UnifiedProductsMetrics = {
        total_products: processedProducts.length,
        networks_covered: new Set(
          processedProducts.flatMap(p => p.networks_available)
        ).size,
        avg_network_count: processedProducts.length > 0 
          ? processedProducts.reduce((sum, p) => sum + p.network_count, 0) / processedProducts.length
          : 0,
        cross_network_products: processedProducts.filter(p => p.network_count > 1).length,
        total_price_points: processedProducts.reduce((sum, p) => 
          sum + Object.keys(p.network_prices).length, 0
        ),
        last_updated: new Date().toISOString()
      }

      setProducts(processedProducts)
      setMetrics(calculatedMetrics)

      logger.info('Unified Products Metrics calculated', {
        total: calculatedMetrics.total_products,
        networks: calculatedMetrics.networks_covered,
        crossNetwork: calculatedMetrics.cross_network_products,
        avgNetworks: calculatedMetrics.avg_network_count.toFixed(1)
      })

    } catch (err) {
      logger.error('Error fetching unified products', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      
      // Fallback: set empty data rather than crash
      setProducts([])
      setMetrics(null)
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, onlyMeatProducts])

  useEffect(() => {
    fetchUnifiedProducts()
  }, [fetchUnifiedProducts])

  // Real-time subscriptions for live updates
  useEffect(() => {
    if (error) return // Don't subscribe if there are errors

    logger.info('Setting up real-time subscription for unified_products')

    const channel = supabase
      .channel('unified-products-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'unified_products'
      }, (payload) => {
        logger.info('Unified products updated via real-time', { event: payload.eventType, table: payload.table })
        // Debounce refetch to prevent flooding
        setTimeout(() => {
          fetchUnifiedProducts()
        }, 1000)
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logger.warn('Real-time subscription failed, continuing without live updates', { status })
        } else if (status === 'SUBSCRIBED') {
          logger.info('Real-time subscription active for unified_products')
        }
      })

    return () => {
      logger.info('Cleaning up unified products subscription')
      supabase.removeChannel(channel)
    }
  }, [fetchUnifiedProducts, error])

  return {
    products,
    metrics,
    loading,
    error,
    refetch: fetchUnifiedProducts
  }
}

// Helper hook for comparison page compatibility
export function useUnifiedComparisonProducts(categoryFilter?: string) {
  const { products, metrics, loading, error, refetch } = useUnifiedProductsData(categoryFilter, false) // ALL products from unified_products

  // Transform unified products to comparison format
  const comparisonProducts = products.map(product => ({
    id: product.id,
    name_hebrew: product.name,
    name_english: product.name,
    category: product.category,
    quality_tier: 'regular', // Default quality tier
    network_prices: product.network_prices,
    best_price: product.price_statistics.min_price,
    worst_price: product.price_statistics.max_price,
    avg_price: product.price_statistics.avg_price,
    savings_potential: product.price_statistics.max_price > 0 
      ? ((product.price_statistics.max_price - product.price_statistics.min_price) / product.price_statistics.max_price) * 100
      : 0,
    trend: product.market_insights.price_volatility === 'high' ? 'up' as const : 'stable' as const,
    availability_count: product.network_count,
    is_popular: product.network_count > 3, // Popular if available in 3+ networks
    retailers: Object.entries(product.network_prices).map(([network, price]) => ({
      retailer_name: network,
      current_price: price,
      retailer_id: network,
      price_confidence: 1,
      last_updated: product.updated_at,
      is_available: true
    }))
  }))

  const marketInsights = metrics ? {
    total_products: metrics.total_products,
    active_retailers: metrics.networks_covered,
    avg_confidence: 0.95, // High confidence for unified data
    avg_price_per_kg: products.length > 0 
      ? products.reduce((sum, p) => sum + p.price_statistics.avg_price, 0) / products.length
      : 0,
    coverage_percentage: Math.round((metrics.cross_network_products / metrics.total_products) * 100),
    last_updated: metrics.last_updated
  } : null

  return {
    enhancedMeatData: comparisonProducts,
    marketInsights,
    loading,
    error,
    refetch
  }
}