// Scanner Comparison Table - Shows scanner_products data in comparison format
'use client'

import React, { useState, useMemo } from 'react'
import { 
  Search, 
  Filter, 
  Download,
  Star,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'
import { useScannerData } from '@/hooks/useScannerData'

interface ScannerComparisonFilters {
  search: string
  stores: string[]
  categories: string[]
  minConfidence: number
  sortBy: 'name' | 'price' | 'confidence' | 'store'
  sortOrder: 'asc' | 'desc'
}

const STORE_COLORS: Record<string, string> = {
  'SHUFERSAL': 'bg-red-50 text-red-700 border-red-200',
  'RAMI_LEVY': 'bg-blue-50 text-blue-700 border-blue-200',
  'MEGA': 'bg-orange-50 text-orange-700 border-orange-200',
  'VICTORY': 'bg-green-50 text-green-700 border-green-200',
  'YOHANANOF': 'bg-purple-50 text-purple-700 border-purple-200',
  'YEINOT_BITAN': 'bg-pink-50 text-pink-700 border-pink-200',
  'HAZI_HINAM': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'CARREFOUR': 'bg-gray-50 text-gray-700 border-gray-200'
}

export default function ScannerComparisonTable() {
  const { scannerProducts, scannerStats, loading, error, refetch } = useScannerData()
  
  const [filters, setFilters] = useState<ScannerComparisonFilters>({
    search: '',
    stores: [],
    categories: [],
    minConfidence: 0,
    sortBy: 'name',
    sortOrder: 'asc'
  })

  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set())

  // Get unique values for filters
  const uniqueStores = useMemo(() => 
    [...new Set(scannerProducts.map(p => p.store_name))].sort(),
    [scannerProducts]
  )
  
  const uniqueCategories = useMemo(() => 
    [...new Set(scannerProducts.map(p => p.category))].sort(),
    [scannerProducts]
  )

  // Apply filters and sorting
  const filteredProducts = useMemo(() => {
    return scannerProducts
      .filter(product => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          return product.product_name.toLowerCase().includes(searchLower) ||
                 product.category.toLowerCase().includes(searchLower) ||
                 product.store_name.toLowerCase().includes(searchLower)
        }
        return true
      })
      .filter(product => {
        // Store filter
        if (filters.stores.length > 0) {
          return filters.stores.includes(product.store_name)
        }
        return true
      })
      .filter(product => {
        // Category filter
        if (filters.categories.length > 0) {
          return filters.categories.includes(product.category)
        }
        return true
      })
      .filter(product => {
        // Confidence filter
        return product.scanner_confidence >= filters.minConfidence
      })
      .sort((a, b) => {
        const direction = filters.sortOrder === 'asc' ? 1 : -1
        
        switch (filters.sortBy) {
          case 'name':
            return a.product_name.localeCompare(b.product_name, 'he') * direction
          case 'price':
            return (a.price_per_kg - b.price_per_kg) * direction
          case 'confidence':
            return (a.scanner_confidence - b.scanner_confidence) * direction
          case 'store':
            return a.store_name.localeCompare(b.store_name) * direction
          default:
            return 0
        }
      })
  }, [scannerProducts, filters])

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['שם המוצר', 'חנות', 'קטגוריה', 'מחיר', 'מחיר לקילו', 'אמינות', 'תאריך סריקה']
    const rows = filteredProducts.map(product => [
      product.product_name,
      product.store_name,
      product.category,
      `₪${product.price}`,
      `₪${product.price_per_kg}`,
      `${(product.scanner_confidence * 100).toFixed(1)}%`,
      new Date(product.scan_timestamp).toLocaleDateString('he-IL')
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `נתוני-סורק-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-96 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתוני סורק...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-96 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="text-red-600 mb-4">❌</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">שגיאה בטעינת נתונים</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            נסה שוב
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🔍 נתוני הסורק הישיר
            </h2>
            <p className="text-gray-600">
              {scannerStats?.total_products || 0} מוצרים • 
              {scannerStats?.stores_count || 0} חנויות • 
              אמינות ממוצעת: {scannerStats ? (scannerStats.avg_confidence * 100).toFixed(1) : 0}%
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={refetch}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              רענן
            </button>
            
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              ייצא
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {scannerStats && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-600">
                {scannerStats.total_products}
              </div>
              <div className="text-xs text-gray-600">סה״כ מוצרים</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-600">
                ₪{scannerStats.avg_price.toFixed(0)}
              </div>
              <div className="text-xs text-gray-600">מחיר ממוצע</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-purple-600">
                {scannerStats.stores_count}
              </div>
              <div className="text-xs text-gray-600">חנויות</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-orange-600">
                {(scannerStats.avg_confidence * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-600">אמינות</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="חפש מוצר, חנות או קטגוריה..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pr-12 pl-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Store Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">חנויות:</label>
              <div className="flex flex-wrap gap-1">
                {uniqueStores.slice(0, 3).map(store => (
                  <button
                    key={store}
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        stores: prev.stores.includes(store)
                          ? prev.stores.filter(s => s !== store)
                          : [...prev.stores, store]
                      }))
                    }}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      filters.stores.includes(store)
                        ? STORE_COLORS[store] + ' ring-1 ring-blue-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {store}
                  </button>
                ))}
                {uniqueStores.length > 3 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{uniqueStores.length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">קטגוריות:</label>
              <div className="flex flex-wrap gap-1">
                {uniqueCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        categories: prev.categories.includes(category)
                          ? prev.categories.filter(c => c !== category)
                          : [...prev.categories, category]
                      }))
                    }}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      filters.categories.includes(category)
                        ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Confidence Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                אמינות מינימלית: {(filters.minConfidence * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={filters.minConfidence}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  minConfidence: parseFloat(e.target.value) 
                }))}
                className="w-full"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">מיון:</label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-')
                  setFilters(prev => ({ 
                    ...prev, 
                    sortBy: sortBy as any, 
                    sortOrder: sortOrder as any 
                  }))
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="name-asc">שם (א׳-ת׳)</option>
                <option value="name-desc">שם (ת׳-א׳)</option>
                <option value="price-asc">מחיר (נמוך-גבוה)</option>
                <option value="price-desc">מחיר (גבוה-נמוך)</option>
                <option value="confidence-desc">אמינות (גבוהה-נמוכה)</option>
                <option value="store-asc">חנות (א׳-ת׳)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProducts(new Set(filteredProducts.map(p => p.id)))
                      } else {
                        setSelectedProducts(new Set())
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  מוצר
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  חנות
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  קטגוריה
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  מחיר
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  מחיר/ק״ג
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  אמינות
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product, index) => (
                <tr key={product.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedProducts)
                        if (e.target.checked) {
                          newSelected.add(product.id)
                        } else {
                          newSelected.delete(product.id)
                        }
                        setSelectedProducts(newSelected)
                      }}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {product.product_name}
                      {product.scanner_confidence > 0.8 && (
                        <Star className="inline w-3 h-3 text-yellow-500 fill-current ml-1" />
                      )}
                    </div>
                    {product.normalized_name !== product.product_name && (
                      <div className="text-xs text-gray-500">{product.normalized_name}</div>
                    )}
                    {product.brand && (
                      <div className="text-xs text-gray-600">מותג: {product.brand}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      STORE_COLORS[product.store_name] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.store_name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-900">{product.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">
                      ₪{product.price.toFixed(2)}
                    </span>
                    {product.weight && (
                      <div className="text-xs text-gray-500">{product.weight}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-green-600">
                      ₪{product.price_per_kg.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        product.scanner_confidence >= 0.8 ? 'bg-green-500' :
                        product.scanner_confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm font-medium">
                        {(product.scanner_confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        const newDetails = new Set(showDetails)
                        if (newDetails.has(product.id)) {
                          newDetails.delete(product.id)
                        } else {
                          newDetails.add(product.id)
                        }
                        setShowDetails(newDetails)
                      }}
                      className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      {showDetails.has(product.id) ? 
                        <EyeOff className="w-4 h-4" /> : 
                        <Eye className="w-4 h-4" />
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* No Results */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              לא נמצאו מוצרים התואמים לחיפוש
            </h3>
            <p className="text-gray-600">
              נסה לשנות את הפילטרים או מילות החיפוש
            </p>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>מציג {filteredProducts.length} מתוך {scannerProducts.length} מוצרים</span>
          {selectedProducts.size > 0 && (
            <span>נבחרו {selectedProducts.size} מוצרים</span>
          )}
        </div>
      </div>
    </div>
  )
}