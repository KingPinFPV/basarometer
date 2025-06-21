// Combined Comparison Data Hook - Integrates scanner_products with existing comparison data
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useEnhancedMeatData } from './useEnhancedMeatData'
import { usePriceMatrixData } from './usePriceMatrixData'
import { useScannerData } from './useScannerData'

interface CombinedProduct {
  id: string
  name_hebrew: string
  name_english: string
  category: string
  quality_tier: string
  network_prices: Record<string, number>
  best_price: number
  worst_price: number
  avg_price: number
  savings_potential: number
  trend: 'up' | 'down' | 'stable'
  availability_count: number
  is_popular: boolean
  source: 'enhanced' | 'scanner' | 'combined'
  scanner_confidence?: number
  scan_timestamp?: string
}

interface CombinedStats {
  total_products: number
  enhanced_products: number
  scanner_products: number
  combined_products: number
  avg_confidence: number
  stores_covered: number
  categories_covered: number
}

// Network mapping for scanner data
const SCANNER_STORE_MAPPING: Record<string, string> = {
  'SHUFERSAL': 'shufersal',
  'RAMI_LEVY': 'rami-levy', 
  'MEGA': 'mega',
  'VICTORY': 'victory',
  'YOHANANOF': 'yohananof',
  'YEINOT_BITAN': 'yeinot-bitan',
  'HAZI_HINAM': 'hazi-hinam',
  'CARREFOUR': 'carrefour'
}

const NETWORKS = [
  { id: 'rami-levy', name: 'רמי לוי', dbName: 'רמי לוי' },
  { id: 'shufersal', name: 'שופרסל', dbName: 'שופרסל' },
  { id: 'mega', name: 'מגה', dbName: 'מגא בעש' },
  { id: 'yohananof', name: 'יוחננוף', dbName: 'יוחננוף' },
  { id: 'victory', name: 'ויקטורי', dbName: 'ויקטורי' },
  { id: 'yeinot-bitan', name: 'יינות ביתן', dbName: 'יינות ביתן' },
  { id: 'hazi-hinam', name: 'חצי חינם', dbName: 'חצי חינם' },
  { id: 'carrefour', name: 'קרפור', dbName: 'קרפור' }
]

export function useCombinedComparisonData(categoryFilter?: string) {
  const [combinedProducts, setCombinedProducts] = useState<CombinedProduct[]>([])
  const [combinedStats, setCombinedStats] = useState<CombinedStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data from all sources
  const { 
    enhancedMeatData, 
    marketInsights,
    loading: enhancedLoading 
  } = useEnhancedMeatData(categoryFilter)
  
  const { 
    priceMatrix, 
    retailers,
    loading: priceLoading 
  } = usePriceMatrixData()

  const {
    scannerProducts,
    scannerStats,
    loading: scannerLoading
  } = useScannerData()

  // Combine and process all data sources
  const processData = useCallback(() => {
    try {
      setLoading(true)
      setError(null)

      const combined: CombinedProduct[] = []

      // Process enhanced meat data (existing system)
      if (enhancedMeatData && priceMatrix && retailers) {
        enhancedMeatData.forEach(meat => {
          const networkPrices: Record<string, number> = {}
          const priceData = priceMatrix[meat.id] || {}
          
          NETWORKS.forEach(network => {
            const matchingRetailer = retailers.find(retailer => 
              retailer.name === network.dbName
            )
            
            if (matchingRetailer) {
              const priceReport = priceData[matchingRetailer.id]
              if (priceReport && typeof priceReport === 'object' && 'price_per_kg' in priceReport) {
                const price = priceReport.price_per_kg / 100 // Convert from agorot to shekels
                if (typeof price === 'number' && !isNaN(price) && price > 0) {
                  networkPrices[network.id] = price
                }
              }
            }
          })
          
          const prices = Object.values(networkPrices).filter(p => p > 0)
          if (prices.length > 0) {
            const bestPrice = Math.min(...prices)
            const worstPrice = Math.max(...prices)
            const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length
            const savingsPotential = worstPrice > 0 ? ((worstPrice - bestPrice) / worstPrice) * 100 : 0
            
            combined.push({
              id: meat.id,
              name_hebrew: meat.name_hebrew,
              name_english: meat.name_english,
              category: 'בקר', // Default category
              quality_tier: meat.quality_grades?.[0]?.tier || 'regular',
              network_prices: networkPrices,
              best_price: bestPrice,
              worst_price: worstPrice,
              avg_price: avgPrice,
              savings_potential: savingsPotential,
              trend: meat.trending_direction || 'stable',
              availability_count: Object.keys(networkPrices).length,
              is_popular: meat.is_popular || false,
              source: 'enhanced'
            })
          }
        })
      }

      // Process scanner data (direct from scanner_products)
      if (scannerProducts) {
        scannerProducts.forEach(product => {
          // Map scanner store name to network ID
          const networkId = SCANNER_STORE_MAPPING[product.store_name] || product.store_name.toLowerCase()
          
          // Check if we already have this product from enhanced data
          const existingProduct = combined.find(p => 
            p.name_hebrew.toLowerCase().includes(product.product_name.toLowerCase()) ||
            product.product_name.toLowerCase().includes(p.name_hebrew.toLowerCase())
          )

          if (existingProduct) {
            // Merge scanner data with existing product
            existingProduct.network_prices[networkId] = product.price_per_kg
            existingProduct.scanner_confidence = product.scanner_confidence
            existingProduct.scan_timestamp = product.scan_timestamp
            existingProduct.source = 'combined'
            
            // Recalculate prices
            const prices = Object.values(existingProduct.network_prices).filter(p => p > 0)
            existingProduct.best_price = Math.min(...prices)
            existingProduct.worst_price = Math.max(...prices)
            existingProduct.avg_price = prices.reduce((sum, p) => sum + p, 0) / prices.length
            existingProduct.savings_potential = existingProduct.worst_price > 0 ? 
              ((existingProduct.worst_price - existingProduct.best_price) / existingProduct.worst_price) * 100 : 0
            existingProduct.availability_count = Object.keys(existingProduct.network_prices).length
          } else {
            // Add as new scanner-only product
            combined.push({
              id: product.id,
              name_hebrew: product.product_name,
              name_english: product.normalized_name || product.product_name,
              category: product.category,
              quality_tier: 'regular',
              network_prices: { [networkId]: product.price_per_kg },
              best_price: product.price_per_kg,
              worst_price: product.price_per_kg,
              avg_price: product.price_per_kg,
              savings_potential: 0,
              trend: 'stable',
              availability_count: 1,
              is_popular: product.scanner_confidence > 0.8,
              source: 'scanner',
              scanner_confidence: product.scanner_confidence,
              scan_timestamp: product.scan_timestamp
            })
          }
        })
      }

      // Apply category filter if specified
      const filteredProducts = categoryFilter ? 
        combined.filter(p => p.category === categoryFilter) : 
        combined

      setCombinedProducts(filteredProducts)

      // Calculate combined statistics
      const enhancedCount = filteredProducts.filter(p => p.source === 'enhanced').length
      const scannerCount = filteredProducts.filter(p => p.source === 'scanner').length
      const combinedCount = filteredProducts.filter(p => p.source === 'combined').length
      
      const avgConfidence = filteredProducts
        .filter(p => p.scanner_confidence)
        .reduce((sum, p) => sum + (p.scanner_confidence || 0), 0) / 
        filteredProducts.filter(p => p.scanner_confidence).length || 0

      const allNetworkIds = new Set<string>()
      const allCategories = new Set<string>()
      
      filteredProducts.forEach(product => {
        Object.keys(product.network_prices).forEach(networkId => allNetworkIds.add(networkId))
        allCategories.add(product.category)
      })

      setCombinedStats({
        total_products: filteredProducts.length,
        enhanced_products: enhancedCount,
        scanner_products: scannerCount,
        combined_products: combinedCount,
        avg_confidence: avgConfidence,
        stores_covered: allNetworkIds.size,
        categories_covered: allCategories.size
      })

    } catch (err) {
      console.error('Error processing combined data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [enhancedMeatData, priceMatrix, retailers, scannerProducts, categoryFilter])

  // Update data when any source changes
  useEffect(() => {
    if (!enhancedLoading && !priceLoading && !scannerLoading) {
      processData()
    }
  }, [enhancedLoading, priceLoading, scannerLoading, processData])

  return {
    combinedProducts,
    combinedStats,
    loading: loading || enhancedLoading || priceLoading || scannerLoading,
    error,
    refetch: processData
  }
}