// Interactive Price Visualization Components
// Phase 3 UX Enhancement - Mini charts and trend indicators
// Real-time price data with Hebrew-optimized design

'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'

interface PricePoint {
  timestamp: string
  price: number
  network: string
  networkId: string
}

interface PriceTrend {
  direction: 'up' | 'down' | 'stable'
  percentage: number
  period: string
}

interface PriceVisualizationProps {
  productId: string
  currentPrices: Record<string, number>
  historicalData?: PricePoint[]
  className?: string
}

interface MiniChartProps {
  data: number[]
  trend: PriceTrend
  height?: number
  color?: string
}

interface PriceComparisonProps {
  prices: Record<string, number>
  networkNames: Record<string, string>
}

interface SavingsIndicatorProps {
  bestPrice: number
  worstPrice: number
  avgPrice: number
  userLocation?: string
}

const NETWORK_COLORS: Record<string, string> = {
  'rami-levy': '#3B82F6',
  'shufersal': '#EF4444',
  'mega': '#F97316',
  'yohananof': '#8B5CF6',
  'victory': '#10B981',
  'yeinot-bitan': '#EC4899',
  'hazi-hinam': '#6366F1',
  'tiv-taam': '#F59E0B'
}

const NETWORK_NAMES: Record<string, string> = {
  'rami-levy': 'רמי לוי',
  'shufersal': 'שופרסל',
  'mega': 'מגה',
  'yohananof': 'יוחננוף',
  'victory': 'ויקטורי',
  'yeinot-bitan': 'יינות ביתן',
  'hazi-hinam': 'חצי חינם',
  'tiv-taam': 'טיב טעם'
}

// Mini Trend Chart Component
function MiniChart({ data, trend, height = 40, color = '#3B82F6' }: MiniChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-xs text-gray-400">אין נתונים</div>
      </div>
    )
  }

  const minValue = Math.min(...data)
  const maxValue = Math.max(...data)
  const range = maxValue - minValue || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = ((maxValue - value) / range) * (height - 8) + 4
    return { x, y, value }
  })

  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ')

  const getTrendColor = () => {
    switch (trend.direction) {
      case 'up': return '#EF4444'
      case 'down': return '#10B981'
      default: return color
    }
  }

  return (
    <div className="relative" style={{ height }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 100 ${height}`}
        className="overflow-visible"
      >
        {/* Background Grid */}
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f3f4f6" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5" />

        {/* Price Line */}
        <path
          d={pathData}
          fill="none"
          stroke={getTrendColor()}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data Points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={hoveredIndex === index ? "3" : "2"}
            fill={getTrendColor()}
            className="transition-all duration-200 cursor-pointer"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <title>₪{point.value.toFixed(0)}</title>
          </circle>
        ))}

        {/* Trend Area */}
        <path
          d={`${pathData} L 100 ${height} L 0 ${height} Z`}
          fill={getTrendColor()}
          opacity="0.1"
        />
      </svg>

      {/* Hover Tooltip */}
      {hoveredIndex !== null && (
        <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          ₪{points[hoveredIndex].value.toFixed(0)}
        </div>
      )}
    </div>
  )
}

// Price Comparison Bars
function PriceComparisonBars({ prices, networkNames }: PriceComparisonProps) {
  const sortedPrices = useMemo(() => {
    return Object.entries(prices)
      .filter(([_, price]) => price > 0)
      .sort(([_, a], [__, b]) => a - b)
  }, [prices])

  if (sortedPrices.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        אין מחירים זמינים
      </div>
    )
  }

  const maxPrice = Math.max(...sortedPrices.map(([_, price]) => price))
  const minPrice = Math.min(...sortedPrices.map(([_, price]) => price))

  return (
    <div className="space-y-2" dir="rtl">
      {sortedPrices.map(([networkId, price], index) => {
        const percentage = (price / maxPrice) * 100
        const isLowest = price === minPrice
        const isHighest = price === maxPrice
        
        return (
          <div key={networkId} className="flex items-center gap-3">
            <div className="w-20 text-xs text-gray-600 text-left">
              {networkNames[networkId] || networkId}
            </div>
            <div className="flex-1 relative">
              <div className="bg-gray-100 rounded-full h-4 relative overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isLowest ? 'bg-green-500' : 
                    isHighest ? 'bg-red-500' : 
                    'bg-blue-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              {isLowest && (
                <CheckCircle className="absolute right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 text-green-600" />
              )}
            </div>
            <div className={`text-sm font-medium w-16 text-left ${
              isLowest ? 'text-green-600' : 
              isHighest ? 'text-red-600' : 
              'text-gray-900'
            }`}>
              ₪{price.toFixed(0)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Savings Indicator Component
function SavingsIndicator({ bestPrice, worstPrice, avgPrice, userLocation }: SavingsIndicatorProps) {
  const savings = worstPrice - bestPrice
  const savingsPercentage = worstPrice > 0 ? (savings / worstPrice) * 100 : 0
  
  const getSavingsLevel = () => {
    if (savingsPercentage < 5) return { level: 'low', color: 'text-gray-600', bgColor: 'bg-gray-100' }
    if (savingsPercentage < 15) return { level: 'medium', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    return { level: 'high', color: 'text-green-600', bgColor: 'bg-green-100' }
  }

  const savingsLevel = getSavingsLevel()

  return (
    <div className={`p-3 rounded-lg ${savingsLevel.bgColor}`} dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className={`w-4 h-4 ${savingsLevel.color}`} />
          <span className={`text-sm font-medium ${savingsLevel.color}`}>
            פוטנציאל חיסכון
          </span>
        </div>
        <div className={`text-lg font-bold ${savingsLevel.color}`}>
          ₪{savings.toFixed(0)}
        </div>
      </div>
      
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>מחיר הטוב ביותר:</span>
          <span className="font-medium text-green-600">₪{bestPrice.toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span>מחיר הגבוה ביותר:</span>
          <span className="font-medium text-red-600">₪{worstPrice.toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span>חיסכון אחוזי:</span>
          <span className={`font-medium ${savingsLevel.color}`}>
            {savingsPercentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {userLocation && (
        <div className="mt-2 text-xs text-gray-500">
          מבוסס על מיקום: {userLocation}
        </div>
      )}
    </div>
  )
}

// Price Alert Component
function PriceAlert({ 
  currentPrice, 
  targetPrice, 
  trend 
}: { 
  currentPrice: number
  targetPrice?: number
  trend: PriceTrend 
}) {
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    if (targetPrice && currentPrice <= targetPrice) {
      setShowAlert(true)
      const timer = setTimeout(() => setShowAlert(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [currentPrice, targetPrice])

  if (!showAlert || !targetPrice) return null

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 animate-fade-in" dir="rtl">
      <div className="flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span className="text-sm font-medium text-green-800">
          התראת מחיר הושגה!
        </span>
      </div>
      <div className="text-xs text-green-700 mt-1">
        המחיר ירד ל-₪{currentPrice.toFixed(0)} (מתחת ליעד ₪{targetPrice.toFixed(0)})
      </div>
    </div>
  )
}

// Main Price Visualization Component
export default function PriceVisualization({ 
  productId, 
  currentPrices, 
  historicalData = [],
  className = ''
}: PriceVisualizationProps) {
  const [activeTab, setActiveTab] = useState<'comparison' | 'trend' | 'savings'>('comparison')
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week')

  // Process historical data for trend analysis
  const trendData = useMemo(() => {
    if (!historicalData.length) return { data: [], trend: { direction: 'stable' as const, percentage: 0, period: timeRange } }

    const sortedData = [...historicalData]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-30) // Last 30 data points

    const prices = sortedData.map(point => point.price)
    
    // Calculate trend
    const firstHalf = prices.slice(0, Math.floor(prices.length / 2))
    const secondHalf = prices.slice(Math.floor(prices.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, p) => sum + p, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, p) => sum + p, 0) / secondHalf.length
    
    const percentage = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0
    const direction = Math.abs(percentage) < 2 ? 'stable' : percentage > 0 ? 'up' : 'down'

    return {
      data: prices,
      trend: { direction, percentage: Math.abs(percentage), period: timeRange }
    }
  }, [historicalData, timeRange])

  // Calculate price statistics
  const priceStats = useMemo(() => {
    const priceValues = Object.values(currentPrices).filter(p => p > 0)
    
    if (priceValues.length === 0) {
      return { min: 0, max: 0, avg: 0, median: 0 }
    }

    const sorted = [...priceValues].sort((a, b) => a - b)
    
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: priceValues.reduce((sum, p) => sum + p, 0) / priceValues.length,
      median: sorted[Math.floor(sorted.length / 2)]
    }
  }, [currentPrices])

  const tabs = [
    { id: 'comparison', label: 'השוואה', icon: BarChart3 },
    { id: 'trend', label: 'מגמה', icon: Activity },
    { id: 'savings', label: 'חיסכון', icon: Target }
  ]

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`} dir="rtl">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            ניתוח מחירים
          </h3>
          
          {/* Time Range Selector */}
          {activeTab === 'trend' && (
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {[
                { id: 'day', label: 'יום' },
                { id: 'week', label: 'שבוע' },
                { id: 'month', label: 'חודש' }
              ].map(period => (
                <button
                  key={period.id}
                  onClick={() => setTimeRange(period.id as any)}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    timeRange === period.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 rtl:space-x-reverse">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'comparison' && (
          <div className="space-y-4">
            <PriceComparisonBars prices={currentPrices} networkNames={NETWORK_NAMES} />
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="text-lg font-bold text-green-600">₪{priceStats.min.toFixed(0)}</div>
                <div className="text-xs text-green-700">הזול ביותר</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="text-lg font-bold text-blue-600">₪{priceStats.avg.toFixed(0)}</div>
                <div className="text-xs text-blue-700">ממוצע</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="text-lg font-bold text-purple-600">₪{priceStats.median.toFixed(0)}</div>
                <div className="text-xs text-purple-700">חציון</div>
              </div>
              <div className="text-center p-2 bg-red-50 rounded">
                <div className="text-lg font-bold text-red-600">₪{priceStats.max.toFixed(0)}</div>
                <div className="text-xs text-red-700">היקר ביותר</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trend' && (
          <div className="space-y-4">
            {/* Trend Chart */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  מגמת מחירים - {timeRange === 'day' ? 'יום אחרון' : timeRange === 'week' ? 'שבוע אחרון' : 'חודש אחרון'}
                </span>
                <div className={`flex items-center gap-1 text-sm ${
                  trendData.trend.direction === 'up' ? 'text-red-600' :
                  trendData.trend.direction === 'down' ? 'text-green-600' :
                  'text-gray-600'
                }`}>
                  {trendData.trend.direction === 'up' ? <TrendingUp className="w-4 h-4" /> :
                   trendData.trend.direction === 'down' ? <TrendingDown className="w-4 h-4" /> :
                   <Minus className="w-4 h-4" />}
                  {trendData.trend.percentage.toFixed(1)}%
                </div>
              </div>
              
              <MiniChart 
                data={trendData.data} 
                trend={trendData.trend}
                height={60}
              />
            </div>

            {/* Trend Analysis */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-2">ניתוח מגמה:</h4>
              <div className="text-sm text-gray-700 space-y-1">
                {trendData.trend.direction === 'up' && (
                  <p>📈 המחירים עולים בממוצע {trendData.trend.percentage.toFixed(1)}% ב{timeRange === 'day' ? 'יום האחרון' : timeRange === 'week' ? 'שבוע האחרון' : 'חודש האחרון'}</p>
                )}
                {trendData.trend.direction === 'down' && (
                  <p>📉 המחירים יורדים בממוצע {trendData.trend.percentage.toFixed(1)}% ב{timeRange === 'day' ? 'יום האחרון' : timeRange === 'week' ? 'שבוע האחרון' : 'חודש האחרון'}</p>
                )}
                {trendData.trend.direction === 'stable' && (
                  <p>📊 המחירים יציבים עם שינויים קטנים של {trendData.trend.percentage.toFixed(1)}%</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'savings' && (
          <div className="space-y-4">
            <SavingsIndicator
              bestPrice={priceStats.min}
              worstPrice={priceStats.max}
              avgPrice={priceStats.avg}
            />
            
            {/* Savings Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                טיפים לחיסכון:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• קנה ב{NETWORK_NAMES[Object.entries(currentPrices).sort(([,a], [,b]) => a - b)[0]?.[0]] || 'הרשת הזולה ביותר'} לחיסכון מקסימלי</li>
                <li>• שלב עם מוצרים נוספים לחיסכון משמעותי יותר</li>
                <li>• עקב אחר מבצעים שבועיים ברשתות השונות</li>
                {priceStats.max - priceStats.min > 10 && (
                  <li>• הפרש של ₪{(priceStats.max - priceStats.min).toFixed(0)} - כדאי להשוות!</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}