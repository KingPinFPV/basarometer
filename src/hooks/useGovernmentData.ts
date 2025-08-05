// Basarometer V8 - Government Data Hook
// Connects to live government-integrated API endpoint for real-time data
// Specialist: api-integration-specialist + government-data-specialist

'use client'

import { useState, useEffect } from 'react'

interface GovernmentProduct {
  id: string
  name_hebrew: string
  name_english: string
  price: number
  retailer: string
  confidence_score: number
  market_coverage_source: string
  data_sources: string[]
  processing_time_ms: number
}

interface GovernmentDataResponse {
  success: boolean
  data: GovernmentProduct[]
  performance: {
    government_products: number
    fast_cache_products: number
    merged_products: number
    response_time: number
    performance_tier: string
    cache_efficiency: string
    meat_purity_rate: string
    filtering_efficiency: string
  }
  market_coverage: {
    estimated_coverage_percentage: string
    retailers_covered: number
    product_count: number
    market_position: string
    government_integration: boolean
    hebrew_optimization: boolean
    competitive_advantage: string
  }
  basarometer_intelligence: {
    enhanced_products: number
    mapping_accuracy: string
    hebrew_quality_score: number
    optimization_level: string
  }
  response_metadata: {
    timestamp: string
    api_version: string
    data_freshness: string
    market_position: string
    response_time_ms: string
  }
}

export function useGovernmentData() {
  const [data, setData] = useState<GovernmentDataResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGovernmentData() {
      try {
        setLoading(true)
        setError(null)
        
        console.log('🏛️ Fetching government data from integrated endpoint...')
        
        // Fetch from our optimized government endpoint
        const response = await fetch('/api/products/enhanced/government-integrated')
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} - ${response.statusText}`)
        }
        
        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Government API request failed')
        }
        
        console.log('✅ Government data loaded successfully:', {
          products: result.data?.length || 0,
          retailers: result.market_coverage?.retailers_covered || 0,
          coverage: result.market_coverage?.estimated_coverage_percentage || '0%',
          performance: result.performance?.response_time || 0
        })
        
        setData(result)
        
      } catch (err) {
        console.error('❌ Government data fetch error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchGovernmentData()
    
    // Refresh every 5 minutes (government data updates every 6 hours)
    const interval = setInterval(fetchGovernmentData, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  return { data, loading, error }
}

// Enhanced hook for Hebrew search functionality
export function useHebrewMeatSearch(searchTerm: string) {
  const { data } = useGovernmentData()
  const [searchResults, setSearchResults] = useState<GovernmentProduct[]>([])

  useEffect(() => {
    if (!data?.data || !searchTerm) {
      setSearchResults([])
      return
    }

    const hebrewTerms = ['בקר', 'עוף', 'כבש', 'טלה', 'בשר', 'אנטריקוט', 'פילה', 'חזה', 'שוקיים']
    const isHebrewSearch = hebrewTerms.some(term => 
      searchTerm.includes(term) || term.includes(searchTerm)
    )
    
    const filtered = data.data.filter(product => {
      if (isHebrewSearch) {
        return product.name_hebrew?.includes(searchTerm) || 
               product.name_english.toLowerCase().includes(searchTerm.toLowerCase())
      }
      return product.name_english.toLowerCase().includes(searchTerm.toLowerCase()) ||
             product.name_hebrew?.includes(searchTerm)
    })

    setSearchResults(filtered)
    
    console.log('🔍 Hebrew search executed:', {
      searchTerm,
      isHebrewSearch,
      resultsFound: filtered.length
    })
    
  }, [data, searchTerm])

  return searchResults
}

// Hook to get retailer information from government data
export function useGovernmentRetailers() {
  const { data } = useGovernmentData()
  const [retailers, setRetailers] = useState<string[]>([])

  useEffect(() => {
    if (!data?.data) {
      setRetailers([])
      return
    }

    const uniqueRetailers = [...new Set(data.data.map(product => product.retailer))]
    setRetailers(uniqueRetailers)
    
    console.log('🏪 Government retailers extracted:', {
      count: uniqueRetailers.length,
      retailers: uniqueRetailers
    })
    
  }, [data])

  return retailers
}

// Hook to get meat categories from government data
export function useGovernmentMeatCategories() {
  const { data } = useGovernmentData()
  const [categories, setCategories] = useState<Record<string, GovernmentProduct[]>>({})

  useEffect(() => {
    if (!data?.data) {
      setCategories({})
      return
    }

    const categorized: Record<string, GovernmentProduct[]> = {}
    
    // Hebrew meat category detection
    const categoryKeywords = {
      'בקר': ['בקר', 'אנטריקוט', 'פילה', 'בריסקט', 'אסאדו', 'angus', 'wagyu', 'beef'],
      'עוף': ['עוף', 'חזה', 'שוקיים', 'כנפיים', 'פרגיות', 'chicken', 'poultry'],
      'כבש': ['כבש', 'טלה', 'כתף', 'צלי', 'lamb', 'mutton'],
      'עגל': ['עגל', 'אסקלופ', 'שניצל', 'veal'],
      'מעובד': ['נקניקיות', 'קבב', 'מרגז', 'המבורגר', 'processed', 'sausage']
    }

    // Initialize categories
    Object.keys(categoryKeywords).forEach(category => {
      categorized[category] = []
    })

    // Categorize products
    data.data.forEach(product => {
      let categorized_product = false
      
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => 
          product.name_hebrew?.includes(keyword) || 
          product.name_english.toLowerCase().includes(keyword.toLowerCase())
        )) {
          categorized[category].push(product)
          categorized_product = true
          break
        }
      }
      
      // If not categorized, add to בקר as default
      if (!categorized_product) {
        categorized['בקר'].push(product)
      }
    })

    setCategories(categorized)
    
    console.log('📊 Government meat categories:', {
      totalCategories: Object.keys(categorized).length,
      categoryBreakdown: Object.entries(categorized).map(([cat, products]) => ({
        category: cat,
        count: products.length
      }))
    })
    
  }, [data])

  return categories
}