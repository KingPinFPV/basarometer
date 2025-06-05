'use client'

import { useState } from 'react'
import { usePriceTrends } from '@/hooks/usePriceTrends'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts'
import { TrendingUp, TrendingDown, Activity, Calendar, BarChart3, Info } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'

export default function TrendsPage() {
  const {
    selectedMeatCut,
    selectedTimeRange,
    availableCuts,
    loading,
    error,
    setSelectedMeatCut,
    setSelectedTimeRange,
    currentTrend,
    hasData,
    timeRangeOptions
  } = usePriceTrends()

  const [chartType, setChartType] = useState<'line' | 'area'>('area')

  // Format price for display
  const formatPrice = (price: number): string => {
    return `₪${price.toFixed(2)}`
  }

  // Format date for chart
  const formatDateForChart = (dateStr: string): string => {
    try {
      const date = parseISO(dateStr)
      switch (selectedTimeRange) {
        case '7d':
          return format(date, 'dd/MM', { locale: he })
        case '30d':
          return format(date, 'dd/MM', { locale: he })
        case '90d':
          return format(date, 'MMM', { locale: he })
        case '1y':
          return format(date, 'MMM yy', { locale: he })
        default:
          return format(date, 'dd/MM', { locale: he })
      }
    } catch {
      return dateStr
    }
  }

  // Prepare chart data
  const chartData = currentTrend?.data.map(point => ({
    date: formatDateForChart(point.date),
    price: point.price,
    salePrice: point.salePrice,
    retailer: point.retailer,
    fullDate: point.date
  })) || []

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: {active?: boolean, payload?: Array<{payload: {date: string, price: number, salePrice?: number, retailer: string}, value: number}>, label?: string}) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{`תאריך: ${label}`}</p>
          <p className="text-blue-600">
            {`מחיר רגיל: ${formatPrice(payload[0].value)}`}
          </p>
          {data.salePrice && (
            <p className="text-red-600">
              {`מחיר מבצע: ${formatPrice(data.salePrice)}`}
            </p>
          )}
          <p className="text-sm text-gray-500">{`חנות: ${data.retailer}`}</p>
        </div>
      )
    }
    return null
  }

  // Get trend indicator
  const getTrendIndicator = (trend: string) => {
    if (trend === 'rising') {
      return {
        icon: <TrendingUp className="w-5 h-5 text-red-500" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        label: 'עולה'
      }
    } else if (trend === 'falling') {
      return {
        icon: <TrendingDown className="w-5 h-5 text-green-500" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        label: 'יורד'
      }
    } else {
      return {
        icon: <Activity className="w-5 h-5 text-gray-500" />,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        label: 'יציב'
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                מגמות מחירים
              </h1>
              <p className="text-gray-600">
                מעקב היסטורי אחר שינויי מחירים ומגמות בזמן
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Meat Cut Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                בחר נתח בשר
              </label>
              <select
                value={selectedMeatCut || ''}
                onChange={(e) => setSelectedMeatCut(e.target.value || null)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">בחר נתח...</option>
                {availableCuts.map((cut) => (
                  <option key={cut.id} value={cut.id}>
                    {cut.name_hebrew} ({cut.name_english})
                  </option>
                ))}
              </select>
            </div>

            {/* Time Range Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                טווח זמן
              </label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                {timeRangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Chart Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סוג תרשים
              </label>
              <div className="flex space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => setChartType('area')}
                  className={`flex-1 p-2 rounded-lg transition-colors ${
                    chartType === 'area'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  אזור
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`flex-1 p-2 rounded-lg transition-colors ${
                    chartType === 'line'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  קו
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800 font-medium">שגיאה</div>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Statistics Cards */}
          <div className="lg:col-span-1 space-y-4">
            {currentTrend && hasData && (
              <>
                {/* Trend Card */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">מגמה</h3>
                    {getTrendIndicator(currentTrend.trend).icon}
                  </div>
                  
                  <div className={`p-3 rounded-lg ${getTrendIndicator(currentTrend.trend).bgColor}`}>
                    <div className={`text-2xl font-bold ${getTrendIndicator(currentTrend.trend).color}`}>
                      {getTrendIndicator(currentTrend.trend).label}
                    </div>
                    <div className="text-sm text-gray-600">
                      {currentTrend.priceChange > 0 ? '+' : ''}{currentTrend.priceChange.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Price Stats */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="text-lg font-semibold mb-3">סטטיסטיקות מחיר</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-600">ממוצע</div>
                      <div className="text-xl font-bold text-blue-600">
                        {formatPrice(currentTrend.avgPrice)}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600">הנמוך ביותר</div>
                      <div className="text-lg font-semibold text-green-600">
                        {formatPrice(currentTrend.minPrice)}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600">הגבוה ביותר</div>
                      <div className="text-lg font-semibold text-red-600">
                        {formatPrice(currentTrend.maxPrice)}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600">תנודתיות</div>
                      <div className={`text-lg font-semibold ${
                        currentTrend.volatility > 15 ? 'text-red-600' :
                        currentTrend.volatility > 8 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {currentTrend.volatility.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Points */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="text-lg font-semibold mb-3">נתונים</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">נקודות מידע:</span>
                      <span className="font-medium">{currentTrend.data.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">תקופה:</span>
                      <span className="font-medium">
                        {timeRangeOptions.find(opt => opt.value === selectedTimeRange)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">עדכון אחרון:</span>
                      <span className="font-medium text-sm">
                        {format(parseISO(currentTrend.lastUpdated), 'dd/MM HH:mm', { locale: he })}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Main Chart */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {currentTrend ? `מגמת מחירים - ${currentTrend.meatCut.name_hebrew}` : 'מגמת מחירים'}
                  </h2>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">
                      {timeRangeOptions.find(opt => opt.value === selectedTimeRange)?.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner />
                  </div>
                )}

                {!loading && !selectedMeatCut && (
                  <div className="text-center py-12">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">בחר נתח בשר</p>
                    <p className="text-gray-400">כדי לראות מגמות מחירים</p>
                  </div>
                )}

                {!loading && selectedMeatCut && !hasData && (
                  <div className="text-center py-12">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                      <Info className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">
                        בונים נתונים היסטוריים
                      </h3>
                      <p className="text-blue-600 mb-4">
                        מידע יצטבר עם הזמן - תתחיל לראות מגמות בעוד כמה ימים
                      </p>
                      <div className="text-sm text-blue-500">
                        • המערכת מתחילה לעקוב אחר שינויי מחירים מהיום
                        <br />
                        • גרפים יופיעו ברגע שיהיו מספיק נתונים
                        <br />
                        • כל דיווח חדש יעזור לבנות את התמונה ההיסטורית
                      </div>
                    </div>
                  </div>
                )}

                {!loading && hasData && chartData.length > 0 && (
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'area' ? (
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            interval="preserveStartEnd"
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `₪${value.toFixed(0)}`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="price"
                            stroke="#3B82F6"
                            fill="#3B82F6"
                            fillOpacity={0.3}
                            name="מחיר רגיל"
                          />
                          {chartData.some(d => d.salePrice) && (
                            <Area
                              type="monotone"
                              dataKey="salePrice"
                              stroke="#EF4444"
                              fill="#EF4444"
                              fillOpacity={0.3}
                              name="מחיר מבצע"
                            />
                          )}
                        </AreaChart>
                      ) : (
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            interval="preserveStartEnd"
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `₪${value.toFixed(0)}`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                            name="מחיר רגיל"
                          />
                          {chartData.some(d => d.salePrice) && (
                            <Line
                              type="monotone"
                              dataKey="salePrice"
                              stroke="#EF4444"
                              strokeWidth={2}
                              dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                              name="מחיר מבצע"
                            />
                          )}
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}