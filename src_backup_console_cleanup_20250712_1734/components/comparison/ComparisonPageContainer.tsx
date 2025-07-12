'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Filter, Grid3X3, List, Search } from 'lucide-react'
import { useUnifiedComparisonData } from '@/hooks/useUnifiedComparisonData'
import { categorizeProductList, getAllCategories } from '@/utils/productCategorization'
import { calculatePriceAnalysis } from '@/utils/priceCalculations'
import { CategoryTabs } from './CategoryTabs'
import { ProductCard } from './ProductCard'
import { ComparisonFilters } from './ComparisonFilters'
import { LoadingState, ErrorState, EmptyState } from './LoadingState'
import styles from '@/styles/comparison.module.css'

interface FilterState {
  search: string
  category: string
  networks: string[]
  priceRange: [number, number]
  sortBy: 'pricePerKg_asc' | 'pricePerKg_desc' | 'price_asc' | 'price_desc' | 'name_asc'
}

export function ComparisonPageContainer() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    networks: [],
    priceRange: [0, 300],
    sortBy: 'pricePerKg_asc'
  })
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Get unified product data
  const { 
    unifiedProducts,
    unificationStats, 
    loading,
    error 
  } = useUnifiedComparisonData()

  // Categorize and enhance products with price analysis
  const { categorizedProducts, categoryStats } = useMemo(() => {
    if (!unifiedProducts || unifiedProducts.length === 0) {
      return { categorizedProducts: [], categoryStats: {} }
    }

    // Categorize all products
    const result = categorizeProductList(unifiedProducts)
    
    // Enhance each product with price analysis
    const enhancedProducts = result.categorizedProducts.map(product => {
      // Convert network_prices object to array format for analysis
      const networkPricesArray = Object.entries(product.network_prices || {})
        .map(([network, price]) => ({
          network,
          price: typeof price === 'number' ? price : price.price || 0,
          weight: '1 ק״ג', // Default weight unit
          unit: 'ק״ג'
        }))
        .filter(item => item.price > 0)

      const priceAnalysis = calculatePriceAnalysis(networkPricesArray)
      
      return {
        ...product,
        priceAnalysis,
        networkPricesArray
      }
    })

    return {
      categorizedProducts: enhancedProducts,
      categoryStats: result.categoryStats
    }
  }, [unifiedProducts])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return categorizedProducts
      .filter(product => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          return product.name_hebrew.toLowerCase().includes(searchLower) ||
                 (product.name_english || '').toLowerCase().includes(searchLower)
        }
        return true
      })
      .filter(product => {
        // Category filter
        if (filters.category !== 'all') {
          return product.category === filters.category
        }
        return true
      })
      .filter(product => {
        // Network filter
        if (filters.networks.length > 0) {
          return filters.networks.some(networkId => 
            networkId in (product.network_prices || {})
          )
        }
        return true
      })
      .filter(product => {
        // Price range filter
        const bestPrice = product.priceAnalysis.bestPricePerKg
        return bestPrice >= filters.priceRange[0] && 
               bestPrice <= filters.priceRange[1]
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'pricePerKg_asc':
            return a.priceAnalysis.bestPricePerKg - b.priceAnalysis.bestPricePerKg
          case 'pricePerKg_desc':
            return b.priceAnalysis.bestPricePerKg - a.priceAnalysis.bestPricePerKg
          case 'price_asc':
            return a.priceAnalysis.bestPrice - b.priceAnalysis.bestPrice
          case 'price_desc':
            return b.priceAnalysis.bestPrice - a.priceAnalysis.bestPrice
          case 'name_asc':
          default:
            return a.name_hebrew.localeCompare(b.name_hebrew, 'he')
        }
      })
  }, [categorizedProducts, filters])

  // Loading state
  if (loading) {
    return <LoadingState viewMode={viewMode} />
  }

  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                השוואת מחירי בשר מקצועית
              </h1>
              <p className="text-lg text-gray-600">
                {filteredProducts.length} מוצרים • 
                {unificationStats?.networks_covered || 6} רשתות • 
                מחירים לק״ג ומדד חיסכון
              </p>
              {unificationStats && (
                <p className="text-sm text-blue-600 mt-1">
                  ⚡ {unificationStats.unified_products} מוצרים מאוחדים מתוך {unificationStats.total_raw_products} רשומות
                </p>
              )}
            </div>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-3">
              <div className="bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  ₪{filteredProducts.length > 0 ? 
                    Math.min(...filteredProducts.map(p => p.priceAnalysis.bestPricePerKg)).toFixed(0) : '0'}
                </div>
                <div className="text-sm text-green-700">הטוב ביותר לק״ג</div>
              </div>
              <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredProducts.length > 0 ? 
                    Math.round(filteredProducts.reduce((sum, p) => sum + p.priceAnalysis.savingsPotential, 0) / filteredProducts.length) : 0}%
                </div>
                <div className="text-sm text-blue-700">חיסכון ממוצע</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        categoryStats={categoryStats}
        activeCategory={filters.category}
        onCategoryChange={(category) => setFilters(prev => ({ ...prev, category }))}
      />

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ComparisonFilters
          filters={filters}
          onFiltersChange={setFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalProducts={filteredProducts.length}
        />

        {/* Products Grid/List */}
        <div className={`mt-6 ${styles.productGrid} ${styles.fadeIn} ${
          viewMode === 'grid' ? styles.grid : ''
        } gap-6`}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              viewMode={viewMode}
            />
          ))}
        </div>

        {/* No Results */}
        {filteredProducts.length === 0 && (
          <EmptyState
            onClearFilters={() => setFilters({
              search: '',
              category: 'all',
              networks: [],
              priceRange: [0, 300],
              sortBy: 'pricePerKg_asc'
            })}
          />
        )}
      </div>
    </div>
  )
}