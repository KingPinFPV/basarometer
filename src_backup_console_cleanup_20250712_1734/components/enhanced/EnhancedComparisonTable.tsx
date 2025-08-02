// Enhanced Comparison Table with Mobile-First Design
// Phase 3 UX Enhancement - Interactive, filterable, beautiful comparison matrix
// Built on existing patterns with Hebrew excellence and voice search capabilities

'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Grid3X3,
  List,
  ArrowUpDown,
  Heart,
  Share2,
  Mic,
  MicOff
} from 'lucide-react'
import { useUnifiedComparisonData } from '@/hooks/useUnifiedComparisonData'

interface FilterState {
  search: string
  qualityTier: string
  priceRange: [number, number]
  networks: string[]
  showOnlyPopular: boolean
  showOnlyInStock: boolean
  sortBy: 'price' | 'popularity' | 'quality' | 'name' | 'trend'
  sortOrder: 'asc' | 'desc'
}

interface EnhancedProduct {
  id: string
  name_hebrew: string
  name_english: string
  category: string
  quality_tier: string
  best_price: number
  worst_price: number
  avg_price: number
  trend: 'up' | 'down' | 'stable'
  availability: number
  is_popular: boolean
  network_prices: Record<string, number>
  savings_potential: number
  confidence_score: number
  matched_products: number
  networks_available: string[]
}

const NETWORKS = [
  { id: 'rami-levy', name: 'רמי לוי', color: 'bg-blue-100 text-blue-800' },
  { id: 'shufersal', name: 'שופרסל', color: 'bg-red-100 text-red-800' },
  { id: 'mega', name: 'מגה', color: 'bg-orange-100 text-orange-800' },
  { id: 'yohananof', name: 'יוחננוף', color: 'bg-purple-100 text-purple-800' },
  { id: 'victory', name: 'ויקטורי', color: 'bg-green-100 text-green-800' },
  { id: 'yeinot-bitan', name: 'יינות ביתן', color: 'bg-pink-100 text-pink-800' },
  { id: 'hazi-hinam', name: 'חצי חינם', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'tiv-taam', name: 'טיב טעם', color: 'bg-yellow-100 text-yellow-800' }
]

const QUALITY_TIERS = {
  regular: { label: 'רגיל', color: 'bg-gray-100 text-gray-800', priority: 1 },
  premium: { label: 'פרמיום', color: 'bg-blue-100 text-blue-800', priority: 2 },
  angus: { label: 'אנגוס', color: 'bg-green-100 text-green-800', priority: 3 },
  wagyu: { label: 'וואגיו', color: 'bg-purple-100 text-purple-800', priority: 4 },
  veal: { label: 'עגל', color: 'bg-pink-100 text-pink-800', priority: 3 }
}

export default function EnhancedComparisonTable() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    qualityTier: 'all',
    priceRange: [0, 200],
    networks: [],
    showOnlyPopular: false,
    showOnlyInStock: true,
    sortBy: 'popularity',
    sortOrder: 'desc'
  })
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [favoriteProducts, setFavoriteProducts] = useState<Set<string>>(new Set())
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Unified comparison data with intelligent product matching
  const { 
    unifiedProducts,
    unificationStats, 
    marketInsights,
    loading,
    error: unificationError
  } = useUnifiedComparisonData()

  // Check for voice recognition support
  useEffect(() => {
    setVoiceSupported(typeof window !== 'undefined' && 
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window))
  }, [])

  // Use unified products that are already processed and grouped
  const enhancedProducts = useMemo(() => {
    if (!unifiedProducts) return []
    
    // Convert unified products to match the expected interface
    return unifiedProducts.map(product => ({
      ...product,
      // Ensure compatibility with existing interface
      quality_tier: product.quality_tier || 'regular'
    }))
  }, [unifiedProducts])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return enhancedProducts
      .filter(product => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase()
          return product.name_hebrew.toLowerCase().includes(searchLower) ||
                 product.name_english.toLowerCase().includes(searchLower)
        }
        return true
      })
      .filter(product => {
        // Quality filter
        if (filters.qualityTier !== 'all') {
          return product.quality_tier === filters.qualityTier
        }
        return true
      })
      .filter(product => {
        // Price range filter
        return product.best_price >= filters.priceRange[0] && 
               product.best_price <= filters.priceRange[1]
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
        // Popular filter
        if (filters.showOnlyPopular) {
          return product.is_popular
        }
        return true
      })
      .filter(product => {
        // In stock filter
        if (filters.showOnlyInStock) {
          return product.availability > 0
        }
        return true
      })
      .sort((a, b) => {
        const direction = filters.sortOrder === 'asc' ? 1 : -1
        
        switch (filters.sortBy) {
          case 'price':
            return (a.best_price - b.best_price) * direction
          case 'popularity':
            if (a.is_popular !== b.is_popular) {
              return a.is_popular ? -1 : 1
            }
            return (a.availability - b.availability) * direction
          case 'quality':
            const aPriority = QUALITY_TIERS[a.quality_tier as keyof typeof QUALITY_TIERS]?.priority || 1
            const bPriority = QUALITY_TIERS[b.quality_tier as keyof typeof QUALITY_TIERS]?.priority || 1
            return (bPriority - aPriority) * direction
          case 'trend':
            const trendOrder = { up: 3, stable: 2, down: 1 }
            return (trendOrder[a.trend] - trendOrder[b.trend]) * direction
          case 'name':
          default:
            return a.name_hebrew.localeCompare(b.name_hebrew, 'he') * direction
        }
      })
  }, [enhancedProducts, filters])

  // Voice search functionality
  const startVoiceRecognition = () => {
    if (!voiceSupported || isVoiceRecording || typeof window === 'undefined') return

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.lang = 'he-IL'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsVoiceRecording(true)
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setFilters(prev => ({ ...prev, search: transcript }))
      if (searchInputRef.current) {
        searchInputRef.current.value = transcript
      }
    }

    recognition.onerror = () => {
      setIsVoiceRecording(false)
    }

    recognition.onend = () => {
      setIsVoiceRecording(false)
    }

    recognition.start()
  }

  // Toggle favorite product
  const toggleFavorite = (productId: string) => {
    setFavoriteProducts(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId)
      } else {
        newFavorites.add(productId)
      }
      return newFavorites
    })
  }

  // Share product
  const shareProduct = async (product: EnhancedProduct) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `מחיר ${product.name_hebrew} בבשרומטר`,
          text: `מחיר הטוב ביותר: ₪${product.best_price} - חסכון של עד ${product.savings_potential.toFixed(0)}%`,
          url: window.location.href
        })
      } catch (error) {
        // Fallback to clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(
            `${product.name_hebrew} - מחיר הטוב ביותר: ₪${product.best_price}`
          )
        }
      }
    }
  }

  // Error handling for unification process
  useEffect(() => {
    if (unificationError) {
      console.error('Product unification error:', unificationError)
    }
  }, [unificationError])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">מקבץ מוצרים זהים ויוצר השוואה מאוחדת...</p>
          <p className="text-sm text-gray-500 mt-2">מעבד נתונים בעברית עם אלגוריתם התאמה חכם</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Enhanced Header with Market Intelligence */}
      <div className="bg-gradient-to-l from-blue-50 to-white rounded-lg p-6 border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              מטריצת השוואה מאוחדת חכמה
            </h1>
            <p className="text-gray-600">
              {filteredProducts.length} מוצרים מאוחדים • 
              {unificationStats?.networks_covered || 8} רשתות • 
              {unificationStats?.duplication_reduction || 0}% צמצום כפילויות
            </p>
            {unificationStats && (
              <p className="text-sm text-blue-600 mt-1">
                ⚡ קיבצנו {unificationStats.total_raw_products} מוצרים ל-{unificationStats.unified_products} קבוצות השוואה
              </p>
            )}
          </div>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/70 px-4 py-2 rounded-lg border">
              <div className="text-lg font-bold text-green-600">
                ₪{filteredProducts.length > 0 ? 
                  Math.min(...filteredProducts.map(p => p.best_price)).toFixed(0) : '0'}
              </div>
              <div className="text-xs text-gray-600">מחיר הטוב ביותר</div>
            </div>
            <div className="bg-white/70 px-4 py-2 rounded-lg border">
              <div className="text-lg font-bold text-blue-600">
                {filteredProducts.length > 0 ? 
                  Math.round(filteredProducts.reduce((sum, p) => sum + p.savings_potential, 0) / filteredProducts.length) : 0}%
              </div>
              <div className="text-xs text-gray-600">חיסכון ממוצע</div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Filter Panel */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            חיפוש וסינון חכם
          </h2>
          
          {/* Search Bar with Voice */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="חפש מוצר... (נסה 'אנטריקוט' או 'בשר טחון')"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pr-10 pl-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
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
                  title="חיפוש קולי"
                >
                  {isVoiceRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Quality Filter */}
            <select
              value={filters.qualityTier}
              onChange={(e) => setFilters(prev => ({ ...prev, qualityTier: e.target.value }))}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">כל סוגי האיכות</option>
              {Object.entries(QUALITY_TIERS).map(([tier, config]) => (
                <option key={tier} value={tier}>{config.label}</option>
              ))}
            </select>

            {/* Sort Options */}
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
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="popularity-desc">פופולריות (גבוה לנמוך)</option>
              <option value="price-asc">מחיר (נמוך לגבוה)</option>
              <option value="price-desc">מחיר (גבוה לנמוך)</option>
              <option value="quality-desc">איכות (מעולה לטובה)</option>
              <option value="name-asc">שם (א׳ עד ת׳)</option>
              <option value="trend-desc">מגמת מחיר</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex rounded-lg border">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-r-lg ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 className="w-4 h-4 ml-1" />
                רשת
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-l-lg border-r ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4 ml-1" />
                רשימה
              </button>
            </div>

            {/* Filter Toggles */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, showOnlyPopular: !prev.showOnlyPopular }))}
                className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                  filters.showOnlyPopular 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Star className="w-4 h-4 ml-1" />
                פופולריים
              </button>
            </div>
          </div>

          {/* Network Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">רשתות שיווק:</label>
            <div className="flex flex-wrap gap-2">
              {NETWORKS.map(network => (
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
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filters.networks.includes(network.id)
                      ? network.color + ' ring-2 ring-blue-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {network.name}
                </button>
              ))}
              {filters.networks.length > 0 && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, networks: [] }))}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200"
                >
                  נקה הכל
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Comparison Display */}
      <div className={`grid gap-4 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
          : 'grid-cols-1'
      }`}>
        {filteredProducts.map((product) => (
          <EnhancedProductCard
            key={product.id}
            product={product}
            viewMode={viewMode}
            isExpanded={expandedProduct === product.id}
            isFavorite={favoriteProducts.has(product.id)}
            onToggleExpand={() => setExpandedProduct(
              expandedProduct === product.id ? null : product.id
            )}
            onToggleFavorite={() => toggleFavorite(product.id)}
            onShare={() => shareProduct(product)}
          />
        ))}
      </div>

      {/* No Results */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            לא נמצאו מוצרים
          </h3>
          <p className="text-gray-600 mb-4">
            נסה לשנות את מילות החיפוש או להרחיב את הפילטרים
          </p>
          <button
            onClick={() => setFilters({
              search: '',
              qualityTier: 'all',
              priceRange: [0, 200],
              networks: [],
              showOnlyPopular: false,
              showOnlyInStock: true,
              sortBy: 'popularity',
              sortOrder: 'desc'
            })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            נקה כל הפילטרים
          </button>
        </div>
      )}
    </div>
  )
}

// Enhanced Product Card Component
interface ProductCardProps {
  product: EnhancedProduct
  viewMode: 'grid' | 'list'
  isExpanded: boolean
  isFavorite: boolean
  onToggleExpand: () => void
  onToggleFavorite: () => void
  onShare: () => void
}

function EnhancedProductCard({ 
  product, 
  viewMode, 
  isExpanded, 
  isFavorite,
  onToggleExpand, 
  onToggleFavorite,
  onShare 
}: ProductCardProps) {
  const qualityConfig = QUALITY_TIERS[product.quality_tier as keyof typeof QUALITY_TIERS] || QUALITY_TIERS.regular
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />
      default: return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getPriceColor = (price: number, bestPrice: number, worstPrice: number) => {
    if (price === bestPrice) return 'text-green-600 font-bold'
    if (price === worstPrice) return 'text-red-600'
    return 'text-yellow-600'
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm hover:shadow-lg transition-all duration-200 ${
      viewMode === 'list' ? 'p-4' : ''
    }`}>
      <div className="p-6 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {product.name_hebrew}
              </h3>
              {product.is_popular && (
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
              )}
              {getTrendIcon(product.trend)}
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              {product.name_english}
            </p>
            
            {/* Quality Badge */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${qualityConfig.color}`}>
              {qualityConfig.label}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleFavorite}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite 
                  ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              title={isFavorite ? 'הסר מהמועדפים' : 'הוסף למועדפים'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onShare}
              className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
              title="שתף מוצר"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-green-600">
                ₪{product.best_price.toFixed(0)}
              </div>
              <div className="text-xs text-gray-600">מחיר הטוב ביותר</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                ₪{product.avg_price.toFixed(0)}
              </div>
              <div className="text-xs text-gray-600">מחיר ממוצע</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {product.savings_potential.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-600">חיסכון פוטנציאלי</div>
            </div>
          </div>
        </div>

        {/* Network Availability & Matching Info */}
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm">
            <span className="text-gray-600">
              זמין ב-{product.availability} רשתות
            </span>
            {product.matched_products > 1 && (
              <span className="text-blue-600 mr-2 font-medium">
                • קיבוץ {product.matched_products} מוצרים
              </span>
            )}
            {product.confidence_score && (
              <span 
                className={`text-xs px-2 py-1 rounded-full mr-2 ${
                  product.confidence_score > 0.8 
                    ? 'bg-green-100 text-green-700' 
                    : product.confidence_score > 0.6
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {Math.round(product.confidence_score * 100)}% דיוק
              </span>
            )}
          </div>
          <button
            onClick={onToggleExpand}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded Network Prices */}
        {isExpanded && (
          <div className="space-y-3 pt-3 border-t animate-fade-in">
            <h4 className="font-medium text-gray-900">מחירים ברשתות:</h4>
            <div className="grid grid-cols-1 gap-2">
              {NETWORKS.map(network => {
                const price = product.network_prices[network.id]
                if (!price) return null
                
                return (
                  <div key={network.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                    <span className={`text-xs px-2 py-1 rounded-full ${network.color}`}>
                      {network.name}
                    </span>
                    <span className={`font-medium ${getPriceColor(price, product.best_price, product.worst_price)}`}>
                      ₪{price.toFixed(0)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}