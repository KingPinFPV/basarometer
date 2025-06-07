// 🥩 Advanced Comparison Page - V5.2 Enhanced Excel-like Experience
// Professional meat price comparison across all 8 Israeli networks with Excel functionality
// Built on proven V5.2 patterns with Hebrew excellence and enhanced UX

'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { 
  Download, 
  FileSpreadsheet,
  Filter,
  Search,
  Mic,
  MicOff,
  ArrowUpDown,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  Share2,
  Heart,
  Star,
  TrendingUp,
  TrendingDown,
  Calculator,
  MapPin
} from 'lucide-react'
import { useEnhancedMeatData } from '@/hooks/useEnhancedMeatData'
import { usePriceMatrixData } from '@/hooks/usePriceMatrixData'

// Types for Excel-like functionality
interface ComparisonFilters {
  search: string
  networks: string[]
  categories: string[]
  qualityTiers: string[]
  priceRange: [number, number]
  showOnlyAvailable: boolean
  showOnlyTrending: boolean
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface ExcelColumn {
  id: string
  label: string
  visible: boolean
  width: number
  sortable: boolean
  type: 'text' | 'number' | 'price' | 'network'
}

interface ComparisonProduct {
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
  location_availability?: string[]
}

// 8 Israeli Network Configuration - Updated to match exact database names
const NETWORKS = [
  { id: 'rami-levy', name: 'רמי לוי', dbName: 'רמי לוי', shortName: 'רמי', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'shufersal', name: 'שופרסל', dbName: 'שופרסל', shortName: 'שופר', color: 'bg-red-50 text-red-700 border-red-200' },
  { id: 'mega', name: 'מגה', dbName: 'מגא בעש', shortName: 'מגה', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'yohananof', name: 'יוחננוף', dbName: 'יוחננוף', shortName: 'יוחנן', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'victory', name: 'ויקטורי', dbName: 'ויקטורי', shortName: 'ויקט', color: 'bg-green-50 text-green-700 border-green-200' },
  { id: 'yeinot-bitan', name: 'יינות ביתן', dbName: 'יינות ביתן', shortName: 'יינות', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { id: 'hazi-hinam', name: 'חצי חינם', dbName: 'חצי חינם', shortName: 'חצי', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'carrefour', name: 'קרפור', dbName: 'קרפור', shortName: 'קרפור', color: 'bg-gray-50 text-gray-700 border-gray-200' }
]

const QUALITY_TIERS = [
  { id: 'regular', label: 'רגיל', color: 'bg-gray-100 text-gray-800' },
  { id: 'premium', label: 'פרמיום', color: 'bg-blue-100 text-blue-800' },
  { id: 'angus', label: 'אנגוס', color: 'bg-green-100 text-green-800' },
  { id: 'wagyu', label: 'וואגיו', color: 'bg-purple-100 text-purple-800' },
  { id: 'veal', label: 'עגל', color: 'bg-pink-100 text-pink-800' }
]

export default function ComparisonPage() {
  // State management
  const [filters, setFilters] = useState<ComparisonFilters>({
    search: '',
    networks: [],
    categories: [],
    qualityTiers: [],
    priceRange: [0, 300],
    showOnlyAvailable: true,
    showOnlyTrending: false,
    sortBy: 'best_price',
    sortOrder: 'asc'
  })

  const [columns, setColumns] = useState<ExcelColumn[]>([
    { id: 'name', label: 'שם המוצר', visible: true, width: 200, sortable: true, type: 'text' },
    { id: 'category', label: 'קטגוריה', visible: true, width: 120, sortable: true, type: 'text' },
    { id: 'quality', label: 'איכות', visible: true, width: 100, sortable: true, type: 'text' },
    { id: 'best_price', label: 'מחיר הטוב', visible: true, width: 100, sortable: true, type: 'price' },
    { id: 'avg_price', label: 'מחיר ממוצע', visible: true, width: 100, sortable: true, type: 'price' },
    { id: 'savings', label: 'חיסכון %', visible: true, width: 100, sortable: true, type: 'number' },
    ...NETWORKS.map(network => ({
      id: network.id,
      label: network.shortName,
      visible: true,
      width: 80,
      sortable: true,
      type: 'price' as const
    }))
  ])

  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [favoriteProducts, setFavoriteProducts] = useState<Set<string>>(new Set())
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Enhanced hooks for real market data
  const { 
    enhancedMeatData, 
    marketInsights,
    loading: meatLoading 
  } = useEnhancedMeatData()
  
  const { 
    priceMatrix, 
    retailers,
    loading: priceLoading 
  } = usePriceMatrixData()

  // Check for voice recognition support
  useEffect(() => {
    setVoiceSupported(typeof window !== 'undefined' && 
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window))
  }, [])

  // Process data into comparison format
  const comparisonProducts = useMemo(() => {
    if (!enhancedMeatData || !priceMatrix || !retailers) return []
    
    return enhancedMeatData.map(meat => {
      const networkPrices: Record<string, number> = {}
      const priceData = priceMatrix[meat.id] || {}
      
      NETWORKS.forEach(network => {
        // Match retailer by exact database name
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
      const bestPrice = prices.length > 0 ? Math.min(...prices) : 0
      const worstPrice = prices.length > 0 ? Math.max(...prices) : 0
      const avgPrice = prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0
      const savingsPotential = worstPrice > 0 ? ((worstPrice - bestPrice) / worstPrice) * 100 : 0
      
      return {
        id: meat.id,
        name_hebrew: meat.name_hebrew,
        name_english: meat.name_english,
        category: 'בקר', // Default category since enhanced data doesn't include category
        quality_tier: meat.quality_grades?.[0]?.tier || 'regular',
        network_prices: networkPrices,
        best_price: bestPrice,
        worst_price: worstPrice,
        avg_price: avgPrice,
        savings_potential: savingsPotential,
        trend: meat.trending_direction || 'stable',
        availability_count: Object.keys(networkPrices).length,
        is_popular: meat.is_popular || false
      } as ComparisonProduct
    }).filter(product => product.availability_count > 0)
  }, [enhancedMeatData, priceMatrix, retailers])

  // Apply filters and sorting
  const filteredProducts = useMemo(() => {
    return comparisonProducts
      .filter(product => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          return product.name_hebrew.toLowerCase().includes(searchLower) ||
                 product.name_english.toLowerCase().includes(searchLower) ||
                 product.category.toLowerCase().includes(searchLower)
        }
        return true
      })
      .filter(product => {
        // Network filter
        if (filters.networks.length > 0) {
          return filters.networks.some(networkId => 
            networkId in product.network_prices
          )
        }
        return true
      })
      .filter(product => {
        // Quality filter
        if (filters.qualityTiers.length > 0) {
          return filters.qualityTiers.includes(product.quality_tier)
        }
        return true
      })
      .filter(product => {
        // Price range filter
        return product.best_price >= filters.priceRange[0] && 
               product.best_price <= filters.priceRange[1]
      })
      .filter(product => {
        // Availability filter
        if (filters.showOnlyAvailable) {
          return product.availability_count > 0
        }
        return true
      })
      .filter(product => {
        // Trending filter
        if (filters.showOnlyTrending) {
          return product.trend !== 'stable'
        }
        return true
      })
      .sort((a, b) => {
        const direction = filters.sortOrder === 'asc' ? 1 : -1
        
        switch (filters.sortBy) {
          case 'name':
            return a.name_hebrew.localeCompare(b.name_hebrew, 'he') * direction
          case 'best_price':
            return (a.best_price - b.best_price) * direction
          case 'avg_price':
            return (a.avg_price - b.avg_price) * direction
          case 'savings':
            return (a.savings_potential - b.savings_potential) * direction
          case 'availability':
            return (a.availability_count - b.availability_count) * direction
          default:
            if (filters.sortBy.startsWith('network_')) {
              const networkId = filters.sortBy.replace('network_', '')
              const aPrice = a.network_prices[networkId] || 999999
              const bPrice = b.network_prices[networkId] || 999999
              return (aPrice - bPrice) * direction
            }
            return 0
        }
      })
  }, [comparisonProducts, filters])

  // Voice search functionality
  const startVoiceRecognition = () => {
    if (!voiceSupported || isVoiceRecording || typeof window === 'undefined') return

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.lang = 'he-IL'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsVoiceRecording(true)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setFilters(prev => ({ ...prev, search: transcript }))
      if (searchInputRef.current) {
        searchInputRef.current.value = transcript
      }
    }
    recognition.onerror = () => setIsVoiceRecording(false)
    recognition.onend = () => setIsVoiceRecording(false)

    recognition.start()
  }

  // Excel export functionality
  const exportToExcel = () => {
    const headers = columns.filter(col => col.visible).map(col => col.label)
    const rows = filteredProducts.map(product => {
      return columns.filter(col => col.visible).map(col => {
        switch (col.id) {
          case 'name':
            return product.name_hebrew
          case 'category':
            return product.category
          case 'quality':
            return QUALITY_TIERS.find(t => t.id === product.quality_tier)?.label || product.quality_tier
          case 'best_price':
            return `₪${product.best_price.toFixed(2)}`
          case 'avg_price':
            return `₪${product.avg_price.toFixed(2)}`
          case 'savings':
            return `${product.savings_potential.toFixed(1)}%`
          default:
            if (col.id.startsWith('network_')) {
              const networkId = col.id.replace('network_', '')
              const price = product.network_prices[networkId]
              return price ? `₪${price.toFixed(2)}` : '-'
            }
            return NETWORKS.find(n => n.id === col.id)?.name 
              ? (product.network_prices[col.id] ? `₪${product.network_prices[col.id].toFixed(2)}` : '-')
              : ''
        }
      })
    })

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `השוואת-מחירי-בשר-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const loading = meatLoading || priceLoading

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">טוען טבלת השוואה מתקדמת...</p>
          <p className="text-sm text-gray-500 mt-2">מעבד נתונים מ-8 רשתות שיווק</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header Section */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🥩 השוואת מחירי בשר מתקדמת
              </h1>
              <p className="text-gray-600">
                {filteredProducts.length} מוצרים • 
                {marketInsights?.active_retailers || 8} רשתות • 
                עדכון אחרון: כעת
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                ייצא לאקסל
              </button>
              
              <button
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                עמודות
              </button>
              
              <div className="bg-white/70 px-4 py-2 rounded-lg border">
                <div className="text-lg font-bold text-green-600">
                  ₪{filteredProducts.length > 0 ? 
                    Math.min(...filteredProducts.map(p => p.best_price)).toFixed(0) : '0'}
                </div>
                <div className="text-xs text-gray-600">מחיר הטוב ביותר</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-6 space-y-4">
            {/* Search Bar */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="חפש מוצר... (נסה 'אנטריקוט', 'בשר טחון', 'כבש')"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pr-12 pl-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                />
                {voiceSupported && (
                  <button
                    onClick={startVoiceRecognition}
                    disabled={isVoiceRecording}
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                      isVoiceRecording 
                        ? 'text-red-600 bg-red-50' 
                        : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title="חיפוש קולי בעברית"
                  >
                    {isVoiceRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Network Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">רשתות:</label>
                <div className="flex flex-wrap gap-1">
                  {NETWORKS.slice(0, 4).map(network => (
                    <button
                      key={network.id}
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          networks: prev.networks.includes(network.id)
                            ? prev.networks.filter(id => id !== network.id)
                            : [...prev.networks, network.id]
                        }))
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        filters.networks.includes(network.id)
                          ? network.color + ' ring-1 ring-blue-500'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {network.shortName}
                    </button>
                  ))}
                  {NETWORKS.length > 4 && (
                    <span className="text-xs text-gray-500 px-2 py-1">
                      +{NETWORKS.length - 4} נוספות
                    </span>
                  )}
                </div>
              </div>

              {/* Quality Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">איכות:</label>
                <div className="flex flex-wrap gap-1">
                  {QUALITY_TIERS.slice(0, 3).map(tier => (
                    <button
                      key={tier.id}
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          qualityTiers: prev.qualityTiers.includes(tier.id)
                            ? prev.qualityTiers.filter(id => id !== tier.id)
                            : [...prev.qualityTiers, tier.id]
                        }))
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                        filters.qualityTiers.includes(tier.id)
                          ? tier.color + ' ring-1 ring-blue-500'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Controls */}
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-')
                  setFilters(prev => ({ 
                    ...prev, 
                    sortBy, 
                    sortOrder: sortOrder as any 
                  }))
                }}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="best_price-asc">מחיר הטוב ביותר ↑</option>
                <option value="best_price-desc">מחיר הטוב ביותר ↓</option>
                <option value="savings-desc">חיסכון הגדול ביותר</option>
                <option value="name-asc">שם (א׳ עד ת׳)</option>
                <option value="availability-desc">זמינות ברשתות</option>
              </select>

              {/* Toggle Filters */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, showOnlyAvailable: !prev.showOnlyAvailable }))}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.showOnlyAvailable 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  זמינים
                </button>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => setFilters({
                  search: '',
                  networks: [],
                  categories: [],
                  qualityTiers: [],
                  priceRange: [0, 300],
                  showOnlyAvailable: true,
                  showOnlyTrending: false,
                  sortBy: 'best_price',
                  sortOrder: 'asc'
                })}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors"
              >
                נקה הכל
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                השוואת מחירים מפורטת ({filteredProducts.length} מוצרים)
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  נבחרו {selectedProducts.size} מוצרים
                </span>
                {selectedProducts.size > 0 && (
                  <button
                    onClick={() => setSelectedProducts(new Set())}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    נקה בחירה
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Excel-like Table - Responsive Design */}
          <div className="overflow-x-auto">
            {/* Mobile Card View for Small Screens */}
            <div className="block md:hidden space-y-4">
              {filteredProducts.map((product, index) => (
                <MobileProductCard
                  key={product.id}
                  product={product}
                  isSelected={selectedProducts.has(product.id)}
                  isFavorite={favoriteProducts.has(product.id)}
                  onSelect={(checked) => {
                    const newSelected = new Set(selectedProducts)
                    if (checked) {
                      newSelected.add(product.id)
                    } else {
                      newSelected.delete(product.id)
                    }
                    setSelectedProducts(newSelected)
                  }}
                  onToggleFavorite={() => {
                    const newFavorites = new Set(favoriteProducts)
                    if (newFavorites.has(product.id)) {
                      newFavorites.delete(product.id)
                    } else {
                      newFavorites.add(product.id)
                    }
                    setFavoriteProducts(newFavorites)
                  }}
                />
              ))}
            </div>

            {/* Desktop Table View */}
            <table className="w-full hidden md:table">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-l">
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
                  {columns.filter(col => col.visible).map(column => (
                    <th 
                      key={column.id}
                      className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-l cursor-pointer hover:bg-gray-200"
                      style={{ width: column.width }}
                      onClick={() => {
                        if (column.sortable) {
                          setFilters(prev => ({
                            ...prev,
                            sortBy: column.id,
                            sortOrder: prev.sortBy === column.id && prev.sortOrder === 'asc' ? 'desc' : 'asc'
                          }))
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        {column.label}
                        {column.sortable && (
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product, index) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    index={index}
                    columns={columns}
                    isSelected={selectedProducts.has(product.id)}
                    isFavorite={favoriteProducts.has(product.id)}
                    onSelect={(checked) => {
                      const newSelected = new Set(selectedProducts)
                      if (checked) {
                        newSelected.add(product.id)
                      } else {
                        newSelected.delete(product.id)
                      }
                      setSelectedProducts(newSelected)
                    }}
                    onToggleFavorite={() => {
                      const newFavorites = new Set(favoriteProducts)
                      if (newFavorites.has(product.id)) {
                        newFavorites.delete(product.id)
                      } else {
                        newFavorites.add(product.id)
                      }
                      setFavoriteProducts(newFavorites)
                    }}
                  />
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
              <p className="text-gray-600 mb-4">
                נסה לשנות את מילות החיפוש או להרחיב את הפילטרים
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Column Settings Modal */}
      {showColumnSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">הגדרות עמודות</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {columns.map(column => (
                <div key={column.id} className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={column.visible}
                      onChange={(e) => {
                        setColumns(prev => prev.map(col => 
                          col.id === column.id 
                            ? { ...col, visible: e.target.checked }
                            : col
                        ))
                      }}
                      className="rounded border-gray-300 mr-2"
                    />
                    {column.label}
                  </label>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowColumnSettings(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Product Row Component
interface ProductRowProps {
  product: ComparisonProduct
  index: number
  columns: ExcelColumn[]
  isSelected: boolean
  isFavorite: boolean
  onSelect: (checked: boolean) => void
  onToggleFavorite: () => void
}

function ProductRow({ 
  product, 
  index, 
  columns, 
  isSelected, 
  isFavorite, 
  onSelect, 
  onToggleFavorite 
}: ProductRowProps) {
  const getBestPriceColor = (price: number) => {
    if (price === product.best_price) return 'text-green-600 font-bold bg-green-50'
    if (price === product.worst_price) return 'text-red-600 bg-red-50'
    return 'text-yellow-600 bg-yellow-50'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-red-500" />
      case 'down': return <TrendingDown className="w-3 h-3 text-green-500" />
      default: return null
    }
  }

  return (
    <tr className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
      <td className="px-4 py-3 border-l">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="rounded border-gray-300"
        />
      </td>
      
      {columns.filter(col => col.visible).map(column => (
        <td key={column.id} className="px-4 py-3 text-sm border-l" style={{ width: column.width }}>
          {column.id === 'name' && (
            <div>
              <div className="font-medium text-gray-900 flex items-center gap-1">
                {product.name_hebrew}
                {product.is_popular && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                {getTrendIcon(product.trend)}
              </div>
              <div className="text-xs text-gray-500">{product.name_english}</div>
            </div>
          )}
          
          {column.id === 'category' && (
            <span className="text-gray-900">{product.category}</span>
          )}
          
          {column.id === 'quality' && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              QUALITY_TIERS.find(t => t.id === product.quality_tier)?.color || 'bg-gray-100 text-gray-800'
            }`}>
              {QUALITY_TIERS.find(t => t.id === product.quality_tier)?.label || product.quality_tier}
            </span>
          )}
          
          {column.id === 'best_price' && (
            <span className="font-bold text-green-600">
              ₪{product.best_price.toFixed(0)}
            </span>
          )}
          
          {column.id === 'avg_price' && (
            <span className="text-gray-900">
              ₪{product.avg_price.toFixed(0)}
            </span>
          )}
          
          {column.id === 'savings' && (
            <span className="font-medium text-blue-600">
              {product.savings_potential.toFixed(0)}%
            </span>
          )}
          
          {NETWORKS.find(n => n.id === column.id) && (
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              product.network_prices[column.id]
                ? getBestPriceColor(product.network_prices[column.id])
                : 'text-gray-400'
            }`}>
              {product.network_prices[column.id] 
                ? `₪${product.network_prices[column.id].toFixed(0)}`
                : '-'
              }
            </span>
          )}
        </td>
      ))}
      
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFavorite}
            className={`p-1 rounded transition-colors ${
              isFavorite 
                ? 'text-red-500 bg-red-50' 
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
            title={isFavorite ? 'הסר מהמועדפים' : 'הוסף למועדפים'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `מחיר ${product.name_hebrew}`,
                  text: `מחיר הטוב ביותר: ₪${product.best_price} - חסכון של עד ${product.savings_potential.toFixed(0)}%`
                })
              }
            }}
            className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
            title="שתף מוצר"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// Mobile Product Card Component for Small Screens
interface MobileProductCardProps {
  product: ComparisonProduct
  isSelected: boolean
  isFavorite: boolean
  onSelect: (checked: boolean) => void
  onToggleFavorite: () => void
}

function MobileProductCard({ 
  product, 
  isSelected, 
  isFavorite, 
  onSelect, 
  onToggleFavorite 
}: MobileProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getBestPriceColor = (price: number) => {
    if (price === product.best_price) return 'text-green-600 font-bold'
    if (price === product.worst_price) return 'text-red-600'
    return 'text-yellow-600'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-red-500" />
      case 'down': return <TrendingDown className="w-3 h-3 text-green-500" />
      default: return null
    }
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="rounded border-gray-300 mt-1"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900 flex items-center gap-1 mb-1">
              {product.name_hebrew}
              {product.is_popular && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
              {getTrendIcon(product.trend)}
            </div>
            <div className="text-xs text-gray-500 mb-2">{product.name_english}</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">{product.category}</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                QUALITY_TIERS.find(t => t.id === product.quality_tier)?.color || 'bg-gray-100 text-gray-800'
              }`}>
                {QUALITY_TIERS.find(t => t.id === product.quality_tier)?.label || product.quality_tier}
              </span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFavorite}
            className={`p-2 rounded transition-colors ${
              isFavorite 
                ? 'text-red-500 bg-red-50' 
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
          >
            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Price Summary */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg font-bold text-green-600">
              ₪{product.best_price.toFixed(0)}
            </div>
            <div className="text-xs text-gray-600">מחיר הטוב</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              ₪{product.avg_price.toFixed(0)}
            </div>
            <div className="text-xs text-gray-600">ממוצע</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">
              {product.savings_potential.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-600">חיסכון</div>
          </div>
        </div>
      </div>

      {/* Network Availability */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600">
          זמין ב-{product.availability_count} רשתות
        </span>
        <div className="flex gap-1">
          {NETWORKS.slice(0, 4).map(network => (
            <div
              key={network.id}
              className={`w-2 h-2 rounded-full ${
                product.network_prices[network.id] 
                  ? 'bg-green-500' 
                  : 'bg-gray-300'
              }`}
              title={network.name}
            />
          ))}
          {NETWORKS.length > 4 && (
            <span className="text-xs text-gray-500">+{NETWORKS.length - 4}</span>
          )}
        </div>
      </div>

      {/* Expanded Network Prices */}
      {isExpanded && (
        <div className="pt-3 border-t space-y-2">
          <h4 className="font-medium text-gray-900 text-sm">מחירים ברשתות:</h4>
          <div className="grid grid-cols-2 gap-2">
            {NETWORKS.map(network => {
              const price = product.network_prices[network.id]
              if (!price) return null
              
              return (
                <div key={network.id} className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded text-sm">
                  <span className="text-gray-700">{network.shortName}</span>
                  <span className={getBestPriceColor(price)}>
                    ₪{price.toFixed(0)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}