'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Calendar, BarChart3 } from 'lucide-react'
import { useMeatIndex } from '@/hooks/useMeatIndex'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EconomicCharts } from './EconomicCharts'
import { MarketInsights } from './MarketInsights'
import { PricePredictor } from './PricePredictor'

export function MeatIndexDashboard() {
  const {
    currentIndex,
    indexHistory,
    predictions,
    inflationAnalysis,
    seasonalPatterns,
    priceAlerts,
    marketAnomalies,
    loading,
    error,
    isDataAvailable,
    marketStatus,
    alertCount
  } = useMeatIndex()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6" dir="rtl">
        <div className="flex items-center space-x-2 rtl:space-x-reverse text-red-800">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">שגיאה בטעינת נתוני המדד</span>
        </div>
        <p className="text-red-600 mt-2">{error}</p>
      </div>
    )
  }

  if (!isDataAvailable) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6" dir="rtl">
        <div className="flex items-center space-x-2 rtl:space-x-reverse text-yellow-800">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">אין מספיק נתונים</span>
        </div>
        <p className="text-yellow-700 mt-2">נדרשים נתונים נוספים לחישוב המדד הכלכלי</p>
      </div>
    )
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'bearish':
        return <TrendingDown className="w-5 h-5 text-red-600" />
      default:
        return <Minus className="w-5 h-5 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return 'text-green-600'
      case 'bearish':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return 'מגמה חיובית'
      case 'bearish':
        return 'מגמה שלילית'
      default:
        return 'מגמה יציבה'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">מדד הבשר הישראלי</h1>
        <p className="text-gray-600">מעקב אחר מחירי הבשר והמגמות הכלכליות בזמן אמת</p>
      </div>

      {/* Current Index Overview */}
      {currentIndex && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Main Index */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">מדד הבשר היום</h3>
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="text-2xl font-bold text-gray-900">
                ₪{currentIndex.indexValue.toFixed(2)}
              </span>
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                {getTrendIcon(currentIndex.economicTrend)}
                <span className={`text-sm font-medium ${getTrendColor(currentIndex.economicTrend)}`}>
                  {getTrendText(currentIndex.economicTrend)}
                </span>
              </div>
            </div>
          </div>

          {/* Market Volatility */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">תנודתיות שוק</h3>
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="text-2xl font-bold text-gray-900">
                {currentIndex.marketVolatility.toFixed(1)}%
              </span>
              <span className={`text-sm px-2 py-1 rounded-full ${
                currentIndex.marketVolatility > 20 
                  ? 'bg-red-100 text-red-800' 
                  : currentIndex.marketVolatility > 10 
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
              }`}>
                {currentIndex.marketVolatility > 20 ? 'גבוהה' : 
                 currentIndex.marketVolatility > 10 ? 'בינונית' : 'נמוכה'}
              </span>
            </div>
          </div>

          {/* Total Reports */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">דיווחים היום</h3>
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="text-2xl font-bold text-gray-900">
                {currentIndex.totalReports}
              </span>
              <span className="text-sm text-gray-500">דיווחי מחיר</span>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">התראות פעילות</h3>
              <AlertTriangle className={`w-5 h-5 ${alertCount > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="text-2xl font-bold text-gray-900">{alertCount}</span>
              <span className={`text-sm px-2 py-1 rounded-full ${
                alertCount > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {alertCount > 0 ? 'דורש תשומת לב' : 'הכל תקין'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Economic Charts */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">מגמות כלכליות</h2>
            <p className="text-gray-600 text-sm mt-1">גרפים וניתוח של שינויי מחירים</p>
          </div>
          <div className="p-6">
            <EconomicCharts 
              indexHistory={indexHistory}
              currentIndex={currentIndex}
            />
          </div>
        </div>

        {/* Price Predictions */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">תחזיות מחירים</h2>
            <p className="text-gray-600 text-sm mt-1">חיזוי מגמות עתידיות על בסיס AI</p>
          </div>
          <div className="p-6">
            <PricePredictor 
              predictions={predictions}
              currentIndex={currentIndex}
            />
          </div>
        </div>
      </div>

      {/* Market Insights */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">תובנות שוק</h2>
          <p className="text-gray-600 text-sm mt-1">ניתוח מעמיק של מצב השוק והמלצות לצרכנים</p>
        </div>
        <div className="p-6">
          <MarketInsights
            inflationAnalysis={inflationAnalysis}
            seasonalPatterns={seasonalPatterns}
            priceAlerts={priceAlerts}
            marketAnomalies={marketAnomalies}
            currentIndex={currentIndex}
          />
        </div>
      </div>
    </div>
  )
}

export default MeatIndexDashboard