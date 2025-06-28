'use client'

import { useState, useMemo, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface UnifiedProduct {
  id: string
  name: string
  normalized_name?: string
  category: string
  network_prices: Record<string, number>
  networks_available: string[]
  network_count: number
  price_statistics?: {
    min_price: number
    max_price: number
    avg_price: number
    price_range: number
  }
  savings_analysis?: {
    max_savings_amount: number
    max_savings_percentage: number
    cheapest_network: string
    most_expensive_network: string
  }
  metadata?: any
  created_at?: string
  updated_at?: string
}

// FORCE OVERRIDE: Direct Supabase hook inline (no external dependencies)
function useDirectSupabaseProducts() {
  const [products, setProducts] = useState<UnifiedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchDirectFromSupabase() {
      try {
        setLoading(true)
        setError(null)
        
        console.log('🔄 FORCE FETCHING: Direct from unified_products table')
        
        const { data, error: fetchError } = await supabase
          .from('unified_products')
          .select('*')
          .order('name')
        
        if (fetchError) {
          console.error('❌ Direct Supabase error:', fetchError)
          if (mounted) setError(`Database error: ${fetchError.message}`)
          return
        }
        
        if (!data) {
          console.error('❌ No data from unified_products')
          if (mounted) setError('No data returned')
          return
        }
        
        console.log(`✅ FORCE SUCCESS: ${data.length} products from unified_products`)
        console.log('📊 First 3 products:', data.slice(0, 3).map(p => ({ name: p.name, category: p.category, networks: p.network_count })))
        
        if (mounted) {
          setProducts(data)
        }
        
      } catch (err) {
        console.error('❌ Force fetch error:', err)
        if (mounted) setError(`Error: ${err instanceof Error ? err.message : 'Unknown'}`)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchDirectFromSupabase()
    
    return () => { mounted = false }
  }, [])

  return { products, loading, error }
}

export default function ComparisonPage() {
  // FORCE USE: Direct Supabase connection, bypass all old hooks
  const { products, loading, error } = useDirectSupabaseProducts()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')

  // Process products for display
  const processedProducts = useMemo(() => {
    console.log(`🔄 Processing ${products.length} products for display`)
    
    let filtered = [...products]

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.normalized_name?.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search)
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'he')
        case 'network_count':
          return b.network_count - a.network_count
        case 'min_price':
          const aMin = a.price_statistics?.min_price || 0
          const bMin = b.price_statistics?.min_price || 0
          return aMin - bMin
        case 'savings':
          const aSavings = a.savings_analysis?.max_savings_amount || 0
          const bSavings = b.savings_analysis?.max_savings_amount || 0
          return bSavings - aSavings
        default:
          return 0
      }
    })

    console.log(`📊 After processing: ${filtered.length} products displayed`)
    return filtered
  }, [products, searchTerm, selectedCategory, sortBy])

  // Get available categories
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))].sort()
    console.log('📋 Available categories:', cats)
    return cats
  }, [products])

  // Statistics
  const stats = useMemo(() => {
    const multiNetwork = products.filter(p => p.network_count > 1)
    const singleNetwork = products.filter(p => p.network_count === 1)
    
    return {
      total: products.length,
      multiNetwork: multiNetwork.length,
      singleNetwork: singleNetwork.length
    }
  }, [products])

  // Debug output
  console.log('🔍 COMPARISON PAGE STATE:')
  console.log(`   Loading: ${loading}`)
  console.log(`   Error: ${error}`)
  console.log(`   Products: ${products.length}`)
  console.log(`   Filtered: ${processedProducts.length}`)
  console.log(`   Stats:`, stats)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            טוען נתוני השוואת מחירים...
          </h2>
          <p className="text-gray-600">
            מתחבר ישירות למסד הנתונים (194 מוצרים)
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            שגיאה בטעינת הנתונים
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            טען מחדש
          </button>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            אין מוצרים במסד הנתונים
          </h2>
          <p className="text-gray-600">
            נראה שטבלת unified_products ריקה
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                השוואת מחירי בשר מתקדמת 🥩
              </h1>
              <p className="text-gray-600 mt-1">
                עדכון אחרון: כעת • {stats.total} מוצרים • 13+ רשתות
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">
                📊 {stats.total} מוצרים
              </div>
              <div className="text-sm text-gray-600">
                🔄 {stats.multiNetwork} רב-רשתיים • 📍 {stats.singleNetwork} רשת אחת
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                חיפוש מוצר
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="חפש מוצר... (נתח 'אנטריקוט', 'חזה עוף', 'כבש')"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                קטגוריה
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">כל הקטגוריות ({stats.total})</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category} ({products.filter(p => p.category === category).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מיון לפי
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name">שם המוצר</option>
                <option value="network_count">מספר רשתות</option>
                <option value="min_price">מחיר נמוך</option>
                <option value="savings">חיסכון גדול</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              השוואת מחירים מפורטת ({processedProducts.length} מוצרים)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    מוצר
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    קטגוריה
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    רשתות זמינות
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    מחיר מינימום
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    מחיר מקסימום  
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    חיסכון פוטנציאלי
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      {product.normalized_name && product.normalized_name !== product.name && (
                        <div className="text-sm text-gray-500">
                          {product.normalized_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {product.networks_available.slice(0, 2).join(', ')}
                        {product.networks_available.length > 2 && ` ועוד ${product.networks_available.length - 2}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.network_count} רשתות
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.price_statistics?.min_price ? 
                        `₪${product.price_statistics.min_price.toFixed(2)}` : 
                        'לא זמין'
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.price_statistics?.max_price ? 
                        `₪${product.price_statistics.max_price.toFixed(2)}` : 
                        'לא זמין'
                      }
                    </td>
                    <td className="px-6 py-4">
                      {product.savings_analysis ? (
                        <div>
                          <div className="text-sm font-medium text-green-600">
                            ₪{product.savings_analysis.max_savings_amount.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.savings_analysis.max_savings_percentage.toFixed(1)}%
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">אין השוואה</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {processedProducts.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                לא נמצאו מוצרים
              </h3>
              <p className="text-gray-500">
                נסה לשנות את קריטריוני החיפוש או הסינון
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}