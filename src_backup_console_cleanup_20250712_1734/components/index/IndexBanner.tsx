'use client'

import React from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus, BarChart3, ArrowLeft } from 'lucide-react'
import { useMeatIndex } from '@/hooks/useMeatIndex'

export function IndexBanner() {
  const { currentIndex, loading, error, alertCount } = useMeatIndex()

  if (loading || error || !currentIndex) {
    return null // Don't show banner if there's no data
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'bearish':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4 text-gray-600" />
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
        return 'עלייה'
      case 'bearish':
        return 'ירידה'
      default:
        return 'יציב'
    }
  }

  const getIndexStatus = (indexValue: number) => {
    if (indexValue > 70) return { text: 'מחירים גבוהים', color: 'text-red-600' }
    if (indexValue < 45) return { text: 'מחירים נמוכים', color: 'text-green-600' }
    return { text: 'מחירים סבירים', color: 'text-blue-600' }
  }

  const indexStatus = getIndexStatus(currentIndex.indexValue)

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3">
          <div className="flex items-center justify-between">
            {/* Main Index Info */}
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">מדד הבשר היום:</span>
                <span className="text-lg font-bold text-gray-900">₪{currentIndex.indexValue.toFixed(2)}</span>
              </div>

              <div className="hidden sm:flex items-center space-x-2 rtl:space-x-reverse">
                {getTrendIcon(currentIndex.economicTrend)}
                <span className={`text-sm font-medium ${getTrendColor(currentIndex.economicTrend)}`}>
                  {getTrendText(currentIndex.economicTrend)}
                </span>
              </div>

              <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse">
                <span className={`text-sm px-2 py-1 rounded-full ${indexStatus.color} bg-white border`}>
                  {indexStatus.text}
                </span>
              </div>

              <div className="hidden lg:flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-600">
                <span>תנודתיות: {currentIndex.marketVolatility.toFixed(1)}%</span>
                <span>•</span>
                <span>{currentIndex.totalReports} דיווחים</span>
              </div>
            </div>

            {/* Alerts & CTA */}
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              {alertCount > 0 && (
                <div className="hidden sm:flex items-center space-x-1 rtl:space-x-reverse">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-600 font-medium">{alertCount} התראות</span>
                </div>
              )}

              <Link 
                href="/index" 
                className="flex items-center space-x-1 rtl:space-x-reverse bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-200"
              >
                <span className="hidden sm:inline">צפה במדד המלא</span>
                <span className="sm:hidden">מדד</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Mobile Trend Info */}
          <div className="sm:hidden mt-2 flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                {getTrendIcon(currentIndex.economicTrend)}
                <span className={`text-sm font-medium ${getTrendColor(currentIndex.economicTrend)}`}>
                  {getTrendText(currentIndex.economicTrend)}
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${indexStatus.color} bg-white border`}>
                {indexStatus.text}
              </span>
            </div>
            
            {alertCount > 0 && (
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-600 font-medium">{alertCount} התראות</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default IndexBanner