'use client'

import { useState, useMemo, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ScannerProduct {
  id: string
  product_name: string
  normalized_name?: string
  brand?: string
  price: number
  price_per_kg: number
  currency: string
  category: string
  weight?: string
  unit?: string
  store_name: string
  store_site?: string
  retailer_id?: string
  scanner_confidence: number
  scanner_source: string
  scan_timestamp: string
  site_confidence: number
  meat_cut_id?: string
  created_at: string
  updated_at: string
  is_active: boolean
  is_valid: boolean
  validation_notes?: string
  product_hash: string
}

// FORCE OVERRIDE: Direct Supabase hook inline (no external dependencies)
function useDirectSupabaseProducts() {
  const [products, setProducts] = useState<ScannerProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchDirectFromSupabase() {
      console.log('🚀 CLIENT-SIDE USEEFFECT STARTED!')
      
      try {
        setLoading(true)
        setError(null)
        
        console.log('🔄 FORCE FETCHING: Direct from scanner_products table (32 products)')
        
        // Create client directly here to avoid any environment issues
        const { createClient } = await import('@supabase/supabase-js')
        const directClient = createClient(
          'https://ergxrxtuncymyqslmoen.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyZ3hyeHR1bmN5bXlxc2xtb2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0Mjg0NTMsImV4cCI6MjA2NjAwNDQ1M30.0gcTOi6eHqEGUdRPl40y2s_6B2CprtbMvE61zMqvFAk'
        )
        
        console.log('🔧 Direct client created successfully')
        
        const { data, error: fetchError } = await directClient
          .from('scanner_products')
          .select('*')
          .order('product_name')
        
        if (fetchError) {
          console.error('❌ Direct Supabase error:', fetchError)
          if (mounted) setError(`Database error: ${fetchError.message}`)
          return
        }
        
        if (!data) {
          console.error('❌ No data from scanner_products')
          if (mounted) setError('No data returned')
          return
        }
        
        console.log(`✅ FORCE SUCCESS: ${data.length} products from scanner_products`)
        console.log('📊 First 3 products:', data.slice(0, 3).map(p => ({ name: p.product_name, category: p.category, store: p.store_name, price: p.price })))
        
        // Filter for valid products only
        const validProducts = data.filter(product => product.is_valid && product.is_active)
        console.log(`🔍 FILTERING: ${data.length} total → ${validProducts.length} valid products`)
        
        if (mounted) {
          setProducts(validProducts)
          console.log(`🔄 STATE UPDATED: ${validProducts.length} products set in state`)
        }
        
      } catch (err) {
        console.error('❌ Force fetch error:', err)
        if (mounted) setError(`Error: ${err instanceof Error ? err.message : 'Unknown'}`)
      } finally {
        if (mounted) {
          setLoading(false)
          console.log('🏁 LOADING SET TO FALSE')
        }
      }
    }

    // Add a small delay to ensure client-side hydration
    const timer = setTimeout(() => {
      if (mounted) {
        fetchDirectFromSupabase()
      }
    }, 100)
    
    return () => { 
      mounted = false 
      clearTimeout(timer)
    }
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
        product.product_name.toLowerCase().includes(search) ||
        product.normalized_name?.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search) ||
        product.brand?.toLowerCase().includes(search) ||
        product.store_name.toLowerCase().includes(search)
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
          return a.product_name.localeCompare(b.product_name, 'he')
        case 'network_count':
          return a.store_name.localeCompare(b.store_name, 'he')
        case 'min_price':
          return a.price - b.price
        case 'savings':
          return b.scanner_confidence - a.scanner_confidence
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
    const storeGroups = products.reduce((acc, p) => {
      acc[p.store_name] = (acc[p.store_name] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const categories = [...new Set(products.map(p => p.category))]
    
    return {
      total: products.length,
      stores: Object.keys(storeGroups).length,
      categories: categories.length,
      avgPrice: products.length > 0 ? (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2) : '0'
    }
  }, [products])

  // Debug output
  console.log('🔍 COMPARISON PAGE STATE:')
  console.log(`   Loading: ${loading}`)
  console.log(`   Error: ${error}`)
  console.log(`   Products: ${products.length}`)
  console.log(`   Filtered: ${processedProducts.length}`)
  console.log(`   Stats:`, stats)
  console.log(`   Product IDs:`, products.map(p => p.id).slice(0, 3))
  console.log(`   Search term: "${searchTerm}"`)
  console.log(`   Selected category: "${selectedCategory}"`)
  console.log(`   Sort by: "${sortBy}"`)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            טוען נתוני השוואת מחירים...
          </h2>
          <p className="text-gray-600">
            מתחבר ישירות למסד הנתונים (32 מוצרים מהסקנר)
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
            נראה שטבלת scanner_products ריקה
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
                עדכון אחרון: כעת • {stats.total} מוצרים • {stats.stores} רשתות • {stats.categories} קטגוריות
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">
                📊 {stats.total} מוצרים
              </div>
              <div className="text-sm text-gray-600">
                🏪 {stats.stores} רשתות • 📊 מחיר ממוצע: ₪{stats.avgPrice}
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
                <option value="network_count">לפי רשת</option>
                <option value="min_price">מחיר נמוך</option>
                <option value="savings">אמינות גבוהה</option>
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
                    רשת
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    מחיר
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    מחיר לק"ג  
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    אמינות
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.product_name}
                      </div>
                      {product.brand && (
                        <div className="text-sm text-gray-500">
                          מותג: {product.brand}
                        </div>
                      )}
                      {product.unit && (
                        <div className="text-xs text-gray-400">
                          {product.unit}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.store_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(product.scan_timestamp).toLocaleDateString('he-IL')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">
                        ₪{product.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium text-green-600">
                        ₪{product.price_per_kg.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`text-sm font-medium ${
                          product.scanner_confidence > 0.8 ? 'text-green-600' : 
                          product.scanner_confidence > 0.6 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {(product.scanner_confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.scanner_source}
                      </div>
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