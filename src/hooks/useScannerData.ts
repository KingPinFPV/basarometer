// Scanner Data Hook - Direct access to scanner_products table
// Provides scanner products for comparison page integration

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface ScannerProduct {
  id: string
  product_name: string
  normalized_name: string
  brand?: string
  price: number
  price_per_kg: number
  currency: string
  category: string
  weight?: string
  unit?: string
  store_name: string
  store_site: string
  scanner_confidence: number
  scanner_source: string
  scan_timestamp: string
  site_confidence: number
  product_hash: string
  is_valid: boolean
  validation_notes?: string
  created_at: string
}

interface ScannerStats {
  total_products: number
  valid_products: number
  stores_count: number
  categories_count: number
  avg_price: number
  avg_confidence: number
  latest_scan: string
}

interface ScannerActivity {
  id: string
  target_site: string
  products_found: number
  products_processed: number
  products_valid: number
  average_confidence: number
  status: string
  created_at: string
  metadata?: any
}

export function useScannerData(storeFilter?: string, categoryFilter?: string) {
  const [scannerProducts, setScannerProducts] = useState<ScannerProduct[]>([])
  const [scannerStats, setScannerStats] = useState<ScannerStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<ScannerActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchScannerData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query with filters
      let query = supabase
        .from('scanner_products')
        .select('*')
        .eq('is_valid', true)
        .order('scan_timestamp', { ascending: false })

      if (storeFilter) {
        query = query.eq('store_name', storeFilter)
      }

      if (categoryFilter) {
        query = query.eq('category', categoryFilter)
      }

      const { data: products, error: productsError } = await query

      if (productsError) {
        throw productsError
      }

      setScannerProducts(products || [])

      // Calculate statistics
      if (products && products.length > 0) {
        const validProducts = products.filter(p => p.is_valid)
        const stores = new Set(products.map(p => p.store_name))
        const categories = new Set(products.map(p => p.category))
        
        const avgPrice = products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length
        const avgConfidence = products.reduce((sum, p) => sum + (p.scanner_confidence || 0), 0) / products.length
        
        const latestScan = products.sort((a, b) => 
          new Date(b.scan_timestamp).getTime() - new Date(a.scan_timestamp).getTime()
        )[0]?.scan_timestamp

        setScannerStats({
          total_products: products.length,
          valid_products: validProducts.length,
          stores_count: stores.size,
          categories_count: categories.size,
          avg_price: avgPrice,
          avg_confidence: avgConfidence,
          latest_scan: latestScan
        })
      }

      // Fetch recent scanner activity
      const { data: activity, error: activityError } = await supabase
        .from('scanner_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (!activityError && activity) {
        setRecentActivity(activity)
      }

    } catch (err) {
      console.error('Error fetching scanner data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [storeFilter, categoryFilter])

  useEffect(() => {
    fetchScannerData()
  }, [fetchScannerData])

  // Real-time subscriptions for scanner updates
  useEffect(() => {
    const channel = supabase
      .channel('scanner-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'scanner_products'
      }, () => {
        // Debounce the refetch
        setTimeout(() => {
          fetchScannerData()
        }, 1000)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'scanner_activity'
      }, () => {
        // Debounce the refetch
        setTimeout(() => {
          fetchScannerData()
        }, 1000)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchScannerData])

  // Transform scanner products to comparison format
  const comparisonProducts = scannerProducts.map(product => ({
    id: product.id,
    name_hebrew: product.product_name,
    name_english: product.normalized_name || product.product_name,
    category: product.category,
    quality_tier: 'regular', // Default since scanner data doesn't include quality tiers
    network_prices: {
      [getNetworkId(product.store_name)]: product.price_per_kg
    },
    best_price: product.price_per_kg,
    worst_price: product.price_per_kg,
    avg_price: product.price_per_kg,
    savings_potential: 0, // Will be calculated when comparing across networks
    trend: 'stable' as const,
    availability_count: 1,
    is_popular: product.scanner_confidence > 0.8,
    store_name: product.store_name,
    confidence: product.scanner_confidence,
    scan_timestamp: product.scan_timestamp
  }))

  return {
    scannerProducts,
    comparisonProducts,
    scannerStats,
    recentActivity,
    loading,
    error,
    refetch: fetchScannerData
  }
}

// Helper function to map store names to network IDs
function getNetworkId(storeName: string): string {
  const mapping: Record<string, string> = {
    'SHUFERSAL': 'shufersal',
    'RAMI_LEVY': 'rami-levy',
    'MEGA': 'mega',
    'VICTORY': 'victory',
    'YOHANANOF': 'yohananof',
    'YEINOT_BITAN': 'yeinot-bitan',
    'HAZI_HINAM': 'hazi-hinam',
    'CARREFOUR': 'carrefour'
  }
  
  return mapping[storeName] || storeName.toLowerCase().replace('_', '-')
}