// Quick Compare Drawer - Side-by-side product comparison
// Phase 3 UX Enhancement - Interactive comparison tool
// Mobile-optimized with Hebrew excellence

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  X, 
  Plus, 
  Minus,
  ArrowRight,
  ArrowLeft,
  Share2,
  Download,
  ShoppingCart,
  Star,
  TrendingUp,
  TrendingDown,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface Product {
  id: string
  name_hebrew: string
  name_english: string
  quality_tier: string
  best_price: number
  worst_price: number
  avg_price: number
  trend: 'up' | 'down' | 'stable'
  network_prices: Record<string, number>
  is_popular: boolean
  savings_potential: number
  availability: number
  last_updated: string
}

interface QuickCompareDrawerProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  onAddProduct: (productId: string) => void
  onRemoveProduct: (productId: string) => void
  className?: string
}

interface ComparisonMetric {
  key: string
  label: string
  getValue: (product: Product) => string | number
  getColor?: (value: any, products: Product[]) => string
  format?: (value: any) => string
}

const NETWORKS = [
  { id: 'rami-levy', name: 'רמי לוי', shortName: 'רמי', color: 'bg-blue-100 text-blue-800' },
  { id: 'shufersal', name: 'שופרסל', shortName: 'שופר', color: 'bg-red-100 text-red-800' },
  { id: 'mega', name: 'מגה', shortName: 'מגה', color: 'bg-orange-100 text-orange-800' },
  { id: 'yohananof', name: 'יוחננוף', shortName: 'יוחנן', color: 'bg-purple-100 text-purple-800' },
  { id: 'victory', name: 'ויקטורי', shortName: 'ויקט', color: 'bg-green-100 text-green-800' },
  { id: 'yeinot-bitan', name: 'יינות ביתן', shortName: 'יינות', color: 'bg-pink-100 text-pink-800' },
  { id: 'hazi-hinam', name: 'חצי חינם', shortName: 'חצי', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'tiv-taam', name: 'טיב טעם', shortName: 'טיב', color: 'bg-yellow-100 text-yellow-800' }
]

const QUALITY_TIERS = {
  regular: { label: 'רגיל', color: 'bg-gray-100 text-gray-800', score: 1 },
  premium: { label: 'פרמיום', color: 'bg-blue-100 text-blue-800', score: 2 },
  angus: { label: 'אנגוס', color: 'bg-green-100 text-green-800', score: 3 },
  wagyu: { label: 'וואגיו', color: 'bg-purple-100 text-purple-800', score: 4 },
  veal: { label: 'עגל', color: 'bg-pink-100 text-pink-800', score: 3 }
}

const COMPARISON_METRICS: ComparisonMetric[] = [
  {
    key: 'best_price',
    label: 'מחיר הטוב ביותר',
    getValue: (product) => product.best_price,
    getColor: (value, products) => {
      const min = Math.min(...products.map(p => p.best_price))
      return value === min ? 'text-green-600 font-bold' : 'text-gray-900'
    },
    format: (value) => `₪${value.toFixed(0)}`
  },
  {
    key: 'avg_price',
    label: 'מחיר ממוצע',
    getValue: (product) => product.avg_price,
    format: (value) => `₪${value.toFixed(0)}`
  },
  {
    key: 'savings_potential',
    label: 'פוטנציאל חיסכון',
    getValue: (product) => product.savings_potential,
    getColor: (value) => {
      if (value > 20) return 'text-green-600 font-bold'
      if (value > 10) return 'text-yellow-600'
      return 'text-gray-600'
    },
    format: (value) => `${value.toFixed(0)}%`
  },
  {
    key: 'availability',
    label: 'זמינות ברשתות',
    getValue: (product) => product.availability,
    getColor: (value, products) => {
      const max = Math.max(...products.map(p => p.availability))
      return value === max ? 'text-green-600 font-bold' : 'text-gray-900'
    },
    format: (value) => `${value}/8 רשתות`
  },
  {
    key: 'quality_tier',
    label: 'איכות',
    getValue: (product) => product.quality_tier,
    getColor: (value, products) => {
      const qualityScores = products.map(p => QUALITY_TIERS[p.quality_tier as keyof typeof QUALITY_TIERS]?.score || 1)
      const maxScore = Math.max(...qualityScores)
      const currentScore = QUALITY_TIERS[value as keyof typeof QUALITY_TIERS]?.score || 1
      return currentScore === maxScore ? 'text-purple-600 font-bold' : 'text-gray-900'
    },
    format: (value) => QUALITY_TIERS[value as keyof typeof QUALITY_TIERS]?.label || value
  }
]

export default function QuickCompareDrawer({ 
  isOpen, 
  onClose, 
  products, 
  onAddProduct, 
  onRemoveProduct,
  className = ''
}: QuickCompareDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'prices' | 'details'>('overview')
  const [isMobile, setIsMobile] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Generate comparison report
  const generateReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      products: products.map(product => ({
        name: product.name_hebrew,
        best_price: product.best_price,
        worst_price: product.worst_price,
        savings: product.savings_potential,
        availability: product.availability
      })),
      summary: {
        cheapest: products.reduce((min, p) => p.best_price < min.best_price ? p : min),
        most_savings: products.reduce((max, p) => p.savings_potential > max.savings_potential ? p : max),
        most_available: products.reduce((max, p) => p.availability > max.availability ? p : max)
      }
    }

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `comparison-report-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Share comparison
  const shareComparison = async () => {
    const bestProduct = products.reduce((min, p) => p.best_price < min.best_price ? p : min)
    const totalSavings = products.reduce((sum, p) => sum + p.savings_potential, 0) / products.length

    const shareText = `השוואת מחירים בבשרומטר:
${products.map(p => `• ${p.name_hebrew}: ₪${p.best_price}`).join('\n')}

הטוב ביותר: ${bestProduct.name_hebrew} ב-₪${bestProduct.best_price}
חיסכון ממוצע: ${totalSavings.toFixed(0)}%

#בשרומטר #השוואת_מחירים`

    if (typeof navigator !== 'undefined') {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'השוואת מחירים - בשרומטר',
            text: shareText,
            url: window.location.href
          })
        } catch (error) {
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareText)
          }
        }
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText)
      }
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 left-0 h-full bg-white shadow-xl z-50 transform transition-transform duration-300 overflow-hidden flex flex-col ${
          isMobile ? 'w-full' : 'w-96'
        } ${className}`}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gradient-to-l from-blue-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              השוואה מהירה
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="text-sm text-gray-600 mb-3">
            {products.length} מוצרים נבחרו להשוואה
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={shareComparison}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Share2 className="w-3 h-3" />
              שתף
            </button>
            <button
              onClick={generateReport}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Download className="w-3 h-3" />
              הורד דוח
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex-shrink-0 flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'סקירה', icon: Star },
            { id: 'prices', label: 'מחירים', icon: TrendingUp },
            { id: 'details', label: 'פרטים', icon: CheckCircle }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                אין מוצרים להשוואה
              </h3>
              <p className="text-gray-600 mb-4">
                הוסף מוצרים למטריצת ההשוואה כדי לראות ניתוח מפורט
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                בחר מוצרים
              </button>
            </div>
          ) : (
            <div className="p-4">
              {activeTab === 'overview' && (
                <OverviewTab products={products} onRemoveProduct={onRemoveProduct} />
              )}
              {activeTab === 'prices' && (
                <PricesTab products={products} />
              )}
              {activeTab === 'details' && (
                <DetailsTab products={products} />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {products.length > 0 && (
          <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-2 gap-3 text-center text-sm">
              <div>
                <div className="font-bold text-green-600">
                  ₪{Math.min(...products.map(p => p.best_price)).toFixed(0)}
                </div>
                <div className="text-gray-600">הזול ביותר</div>
              </div>
              <div>
                <div className="font-bold text-blue-600">
                  {Math.round(products.reduce((sum, p) => sum + p.savings_potential, 0) / products.length)}%
                </div>
                <div className="text-gray-600">חיסכון ממוצע</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// Overview Tab Component
function OverviewTab({ products, onRemoveProduct }: { products: Product[], onRemoveProduct: (id: string) => void }) {
  const bestProduct = products.reduce((min, p) => p.best_price < min.best_price ? p : min)
  const mostSavings = products.reduce((max, p) => p.savings_potential > max.savings_potential ? p : max)

  return (
    <div className="space-y-4">
      {/* Key Insights */}
      <div className="space-y-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">הטוב ביותר</span>
          </div>
          <div className="text-green-900">
            {bestProduct.name_hebrew} ב-₪{bestProduct.best_price.toFixed(0)}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">חיסכון מקסימלי</span>
          </div>
          <div className="text-blue-900">
            {mostSavings.name_hebrew} - עד {mostSavings.savings_potential.toFixed(0)}% חיסכון
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">מוצרים בהשוואה:</h3>
        {products.map(product => (
          <div key={product.id} className="bg-white border rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  {product.name_hebrew}
                </h4>
                <div className="text-sm text-gray-600 mb-2">
                  {product.name_english}
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    QUALITY_TIERS[product.quality_tier as keyof typeof QUALITY_TIERS]?.color || 'bg-gray-100 text-gray-800'
                  }`}>
                    {QUALITY_TIERS[product.quality_tier as keyof typeof QUALITY_TIERS]?.label || product.quality_tier}
                  </span>
                  {product.is_popular && (
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">מחיר טוב: </span>
                    <span className="font-medium text-green-600">₪{product.best_price.toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">חיסכון: </span>
                    <span className="font-medium text-blue-600">{product.savings_potential.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onRemoveProduct(product.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="הסר מההשוואה"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Metrics */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">מדדי השוואה:</h3>
        <div className="bg-gray-50 rounded-lg p-3">
          {COMPARISON_METRICS.map(metric => (
            <div key={metric.key} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
              <span className="text-sm text-gray-600">{metric.label}:</span>
              <div className="flex gap-2">
                {products.map(product => {
                  const value = metric.getValue(product)
                  const color = metric.getColor ? metric.getColor(value, products) : 'text-gray-900'
                  const formatted = metric.format ? metric.format(value) : String(value)
                  
                  return (
                    <span key={product.id} className={`text-sm ${color}`}>
                      {formatted}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Prices Tab Component
function PricesTab({ products }: { products: Product[] }) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">מחירים ברשתות:</h3>
      
      {NETWORKS.map(network => {
        const networkPrices = products.map(product => ({
          product,
          price: product.network_prices[network.id] || 0
        })).filter(item => item.price > 0)

        if (networkPrices.length === 0) return null

        const minPrice = Math.min(...networkPrices.map(item => item.price))
        const maxPrice = Math.max(...networkPrices.map(item => item.price))

        return (
          <div key={network.id} className="bg-white border rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${network.color}`}>
                {network.name}
              </span>
              <span className="text-xs text-gray-600">
                {networkPrices.length}/{products.length} מוצרים
              </span>
            </div>

            <div className="space-y-2">
              {networkPrices.map(({ product, price }) => (
                <div key={product.id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-900 truncate flex-1 ml-2">
                    {product.name_hebrew}
                  </span>
                  <span className={`text-sm font-medium ${
                    price === minPrice ? 'text-green-600' :
                    price === maxPrice ? 'text-red-600' :
                    'text-gray-900'
                  }`}>
                    ₪{price.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Details Tab Component
function DetailsTab({ products }: { products: Product[] }) {
  return (
    <div className="space-y-4">
      {products.map(product => (
        <div key={product.id} className="bg-white border rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">
            {product.name_hebrew}
          </h4>
          
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-600">מחיר הטוב ביותר:</span>
                <div className="font-medium text-green-600">₪{product.best_price.toFixed(0)}</div>
              </div>
              <div>
                <span className="text-gray-600">מחיר הגבוה ביותר:</span>
                <div className="font-medium text-red-600">₪{product.worst_price.toFixed(0)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-600">פוטנציאל חיסכון:</span>
                <div className="font-medium text-blue-600">{product.savings_potential.toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-gray-600">זמינות:</span>
                <div className="font-medium">{product.availability}/8 רשתות</div>
              </div>
            </div>

            <div>
              <span className="text-gray-600">מגמה:</span>
              <div className="flex items-center gap-1 mt-1">
                {product.trend === 'up' ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-red-500" />
                    <span className="text-red-500">עולה</span>
                  </>
                ) : product.trend === 'down' ? (
                  <>
                    <TrendingDown className="w-4 h-4 text-green-500" />
                    <span className="text-green-500">יורד</span>
                  </>
                ) : (
                  <>
                    <Minus className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-500">יציב</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <span className="text-gray-600">עדכון אחרון:</span>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs">
                  {new Date(product.last_updated).toLocaleDateString('he-IL')}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}