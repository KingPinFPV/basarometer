'use client'

import React from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calendar, 
  Target,
  Snowflake,
  Sun,
  Leaf,
  Flower2,
  Info,
  AlertTriangle as ExclamationTriangle
} from 'lucide-react'
import type { 
  InflationAnalysis, 
  SeasonalPattern, 
  PriceAlert, 
  MarketAnomaly, 
  MeatIndexData 
} from '@/hooks/useMeatIndex'

interface MarketInsightsProps {
  inflationAnalysis: InflationAnalysis | null
  seasonalPatterns: SeasonalPattern[]
  priceAlerts: PriceAlert[]
  marketAnomalies: MarketAnomaly[]
  currentIndex: MeatIndexData | null
}

export function MarketInsights({
  inflationAnalysis,
  seasonalPatterns,
  priceAlerts,
  marketAnomalies,
  currentIndex
}: MarketInsightsProps) {
  const getCurrentSeasonIcon = () => {
    const month = new Date().getMonth()
    if (month >= 11 || month <= 1) return <Snowflake className="w-5 h-5 text-blue-500" />
    if (month >= 2 && month <= 4) return <Flower2 className="w-5 h-5 text-pink-500" />
    if (month >= 5 && month <= 7) return <Sun className="w-5 h-5 text-yellow-500" />
    return <Leaf className="w-5 h-5 text-orange-500" />
  }

  const getCurrentSeasonData = () => {
    const currentMonth = new Date().getMonth() + 1
    return seasonalPatterns.find(pattern => pattern.month === currentMonth)
  }

  const getAlertIcon = (type: string, severity: string) => {
    if (severity === 'high') return <ExclamationTriangle className="w-5 h-5 text-red-500" />
    if (type === 'significant_rise') return <TrendingUp className="w-5 h-5 text-red-500" />
    if (type === 'significant_drop') return <TrendingDown className="w-5 h-5 text-green-500" />
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />
  }

  const getAlertBgColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200'
      case 'medium': return 'bg-yellow-50 border-yellow-200'
      case 'low': return 'bg-blue-50 border-blue-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getAlertTextColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-800'
      case 'medium': return 'text-yellow-800'
      case 'low': return 'text-blue-800'
      default: return 'text-gray-800'
    }
  }

  const currentSeason = getCurrentSeasonData()

  return (
    <div className="space-y-8" dir="rtl">
      {/* Inflation Analysis */}
      {inflationAnalysis && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
            <Target className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">ניתוח אינפלציה</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">אינפלציה חודשית</span>
                {inflationAnalysis.monthlyInflation > 0 ? 
                  <TrendingUp className="w-4 h-4 text-red-500" /> : 
                  <TrendingDown className="w-4 h-4 text-green-500" />
                }
              </div>
              <span className={`text-xl font-bold ${
                inflationAnalysis.monthlyInflation > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {inflationAnalysis.monthlyInflation > 0 ? '+' : ''}{inflationAnalysis.monthlyInflation.toFixed(1)}%
              </span>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">אינפלציה שנתית</span>
                {inflationAnalysis.yearlyInflation > 0 ? 
                  <TrendingUp className="w-4 h-4 text-red-500" /> : 
                  <TrendingDown className="w-4 h-4 text-green-500" />
                }
              </div>
              <span className={`text-xl font-bold ${
                inflationAnalysis.yearlyInflation > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {inflationAnalysis.yearlyInflation > 0 ? '+' : ''}{inflationAnalysis.yearlyInflation.toFixed(1)}%
              </span>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">יחסית לאינפלציה הכללית</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  inflationAnalysis.meatInflationTrend === 'higher' ? 'bg-red-100 text-red-800' :
                  inflationAnalysis.meatInflationTrend === 'lower' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {inflationAnalysis.meatInflationTrend === 'higher' ? 'גבוהה' :
                   inflationAnalysis.meatInflationTrend === 'lower' ? 'נמוכה' : 'דומה'}
                </span>
              </div>
              <span className={`text-xl font-bold ${
                inflationAnalysis.comparedToGeneral > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {inflationAnalysis.comparedToGeneral > 0 ? '+' : ''}{inflationAnalysis.comparedToGeneral.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-gray-900">השפעה על המשפחה</span>
            </div>
            <p className="text-gray-700">{inflationAnalysis.impact}</p>
          </div>
        </div>
      )}

      {/* Current Season Analysis */}
      {currentSeason && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
            {getCurrentSeasonIcon()}
            <h3 className="text-lg font-semibold text-gray-900">ניתוח עונתי - {currentSeason.monthName}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">שינוי מחיר צפוי</span>
                {currentSeason.typicalIndexChange > 0 ? 
                  <TrendingUp className="w-4 h-4 text-red-500" /> : 
                  currentSeason.typicalIndexChange < 0 ?
                  <TrendingDown className="w-4 h-4 text-green-500" /> :
                  <Calendar className="w-4 h-4 text-gray-500" />
                }
              </div>
              <span className={`text-xl font-bold ${
                currentSeason.typicalIndexChange > 0 ? 'text-red-600' : 
                currentSeason.typicalIndexChange < 0 ? 'text-green-600' : 'text-gray-600'
              }`}>
                {currentSeason.typicalIndexChange > 0 ? '+' : ''}{currentSeason.typicalIndexChange.toFixed(1)}%
              </span>
            </div>

            <div className="bg-white rounded-lg p-4 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">מקדם עונתי</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  currentSeason.seasonalFactor > 1.05 ? 'bg-red-100 text-red-800' :
                  currentSeason.seasonalFactor < 0.95 ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {currentSeason.seasonalFactor > 1.05 ? 'עונת יוקר' :
                   currentSeason.seasonalFactor < 0.95 ? 'עונת זול' : 'רגיל'}
                </span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {currentSeason.seasonalFactor.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-green-100">
            <h4 className="font-medium text-gray-900 mb-3">המלצות עונתיות</h4>
            <ul className="space-y-2">
              {currentSeason.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-2 rtl:space-x-reverse">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Price Alerts */}
      {priceAlerts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">התראות מחיר</h3>
          <div className="space-y-3">
            {priceAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`rounded-lg p-4 border ${getAlertBgColor(alert.severity)}`}
              >
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  {getAlertIcon(alert.type, alert.severity)}
                  <div className="flex-1">
                    <h4 className={`font-medium ${getAlertTextColor(alert.severity)} mb-1`}>
                      {alert.title}
                    </h4>
                    <p className={`text-sm ${getAlertTextColor(alert.severity)} mb-2`}>
                      {alert.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        קטגוריות מושפעות: {alert.affectedCategories.join(', ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.createdAt).toLocaleDateString('he-IL')}
                      </span>
                    </div>
                    {alert.actionRecommendation && (
                      <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                        <span className="text-sm font-medium text-gray-900">המלצת פעולה: </span>
                        <span className="text-sm text-gray-700">{alert.actionRecommendation}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Anomalies */}
      {marketAnomalies.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">חריגות שוק</h3>
          <div className="space-y-3">
            {marketAnomalies.map((anomaly) => (
              <div 
                key={anomaly.id} 
                className="bg-orange-50 border border-orange-200 rounded-lg p-4"
              >
                <div className="flex items-start space-x-3 rtl:space-x-reverse">
                  <ExclamationTriangle className="w-5 h-5 text-orange-500" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-orange-800">
                        חריגה זוהתה: {anomaly.type === 'price_spike' ? 'זינוק מחיר' : 
                                      anomaly.type === 'unusual_pattern' ? 'דפוס חריג' : 'בעיית נתונים'}
                      </h4>
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                        ביטחון: {anomaly.detectionConfidence}%
                      </span>
                    </div>
                    <p className="text-sm text-orange-700 mb-2">{anomaly.description}</p>
                    <p className="text-xs text-gray-600 mb-2">
                      חנויות מושפעות: {anomaly.affectedStores.join(', ')}
                    </p>
                    <div className="bg-white rounded border border-orange-200 p-2">
                      <span className="text-sm font-medium text-gray-900">פעולה מוצעת: </span>
                      <span className="text-sm text-gray-700">{anomaly.suggestedAction}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Summary */}
      {currentIndex && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">סיכום מצב השוק</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">מצב נוכחי</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• מדד הבשר: ₪{currentIndex.indexValue.toFixed(2)}</li>
                <li>• תנודתיות: {currentIndex.marketVolatility.toFixed(1)}%</li>
                <li>• מגמה: {
                  currentIndex.economicTrend === 'bullish' ? 'חיובית' :
                  currentIndex.economicTrend === 'bearish' ? 'שלילית' : 'יציבה'
                }</li>
                <li>• דיווחים: {currentIndex.totalReports}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">המלצות</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                {currentIndex.indexValue > 65 && <li>• שקול דחיית רכישות גדולות</li>}
                {currentIndex.indexValue < 50 && <li>• זמן מצוין לרכישת כמויות גדולות</li>}
                {currentIndex.marketVolatility > 20 && <li>• המתן ליציבות בשוק</li>}
                {currentIndex.marketVolatility < 10 && <li>• שוק יציב - זמן טוב לתכנון</li>}
                <li>• עקוב אחר מבצעים בחנויות מובילות</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MarketInsights