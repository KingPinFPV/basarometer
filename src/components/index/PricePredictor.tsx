'use client'

import React, { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar, 
  Brain,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import type { PricePrediction, MeatIndexData } from '@/hooks/useMeatIndex'

interface PricePredictorProps {
  predictions: Map<string, PricePrediction>
  currentIndex: MeatIndexData | null
}

export function PricePredictor({ predictions, currentIndex }: PricePredictorProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1w' | '1m' | '3m'>('1m')

  const timeframeOptions = [
    { value: '1w', label: 'שבוע', icon: Calendar },
    { value: '1m', label: 'חודש', icon: BarChart3 },
    { value: '3m', label: '3 חודשים', icon: Target }
  ]

  const currentPrediction = predictions.get(selectedTimeframe)

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100'
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 80) return 'ביטחון גבוה'
    if (confidence >= 60) return 'ביטחון בינוני'
    return 'ביטחון נמוך'
  }

  const getPredictionTrend = (current: number, predicted: number) => {
    const change = predicted - current
    const percentage = (change / current) * 100
    
    if (Math.abs(percentage) < 1) return 'stable'
    return percentage > 0 ? 'up' : 'down'
  }

  const getPredictionIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-red-500" />
      case 'down':
        return <TrendingDown className="w-5 h-5 text-green-500" />
      default:
        return <BarChart3 className="w-5 h-5 text-gray-500" />
    }
  }

  const getPredictionColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-red-600'
      case 'down': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const calculateChange = (current: number, predicted: number) => {
    const change = predicted - current
    const percentage = (change / current) * 100
    return { absolute: change, percentage }
  }

  if (!currentIndex || !currentPrediction) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500" dir="rtl">
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>אין מספיק נתונים לחיזוי</p>
        </div>
      </div>
    )
  }

  const trend = getPredictionTrend(currentIndex.indexValue, currentPrediction.predictedIndex)
  const change = calculateChange(currentIndex.indexValue, currentPrediction.predictedIndex)

  return (
    <div className="space-y-6" dir="rtl">
      {/* Timeframe Selection */}
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <Brain className="w-5 h-5 text-blue-600" />
        <span className="text-sm font-medium text-gray-700">תחזית לטווח:</span>
        <div className="flex space-x-1 rtl:space-x-reverse bg-gray-100 rounded-lg p-1">
          {timeframeOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                onClick={() => setSelectedTimeframe(option.value as '1w' | '1m' | '3m')}
                className={`flex items-center space-x-1 rtl:space-x-reverse px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  selectedTimeframe === option.value
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{option.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Prediction */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            תחזית מחיר - {timeframeOptions.find(o => o.value === selectedTimeframe)?.label}
          </h3>
          <div className={`flex items-center space-x-1 rtl:space-x-reverse px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(currentPrediction.confidence)}`}>
            {currentPrediction.confidence >= 70 ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{getConfidenceText(currentPrediction.confidence)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Current Index */}
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">מדד נוכחי</span>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              ₪{currentIndex.indexValue.toFixed(2)}
            </span>
          </div>

          {/* Predicted Index */}
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">מדד צפוי</span>
              {getPredictionIcon(trend)}
            </div>
            <span className={`text-2xl font-bold ${getPredictionColor(trend)}`}>
              ₪{currentPrediction.predictedIndex.toFixed(2)}
            </span>
          </div>

          {/* Change */}
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">שינוי צפוי</span>
              {getPredictionIcon(trend)}
            </div>
            <div className="space-y-1">
              <span className={`text-xl font-bold ${getPredictionColor(trend)}`}>
                {change.absolute > 0 ? '+' : ''}₪{change.absolute.toFixed(2)}
              </span>
              <div className={`text-sm font-medium ${getPredictionColor(trend)}`}>
                {change.percentage > 0 ? '+' : ''}{change.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">רמת ביטחון בחיזוי</span>
            <span className="text-sm text-gray-600">{currentPrediction.confidence}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                currentPrediction.confidence >= 80 ? 'bg-green-500' :
                currentPrediction.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${currentPrediction.confidence}%` }}
            ></div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900">המלצת הפעולה</span>
          </div>
          <p className="text-gray-700">{currentPrediction.recommendation}</p>
        </div>
      </div>

      {/* Prediction Factors */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">גורמים להשפעה על החיזוי</h3>
        <div className="space-y-3">
          {currentPrediction.factors.map((factor, index) => (
            <div key={index} className="flex items-start space-x-3 rtl:space-x-reverse">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-700">{factor}</span>
            </div>
          ))}
        </div>
      </div>

      {/* All Predictions Summary */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">סיכום תחזיות לכל הטווחים</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from(predictions.entries()).map(([timeframe, prediction]) => {
            const option = timeframeOptions.find(o => o.value === timeframe)
            const predictionTrend = getPredictionTrend(currentIndex.indexValue, prediction.predictedIndex)
            const predictionChange = calculateChange(currentIndex.indexValue, prediction.predictedIndex)
            
            if (!option) return null
            
            const Icon = option.icon
            
            return (
              <div key={timeframe} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-3">
                  <Icon className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900">{option.label}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">מדד צפוי:</span>
                    <span className={`font-medium ${getPredictionColor(predictionTrend)}`}>
                      ₪{prediction.predictedIndex.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">שינוי:</span>
                    <span className={`font-medium ${getPredictionColor(predictionTrend)}`}>
                      {predictionChange.percentage > 0 ? '+' : ''}{predictionChange.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ביטחון:</span>
                    <span className={`text-sm px-2 py-1 rounded-full ${getConfidenceColor(prediction.confidence)}`}>
                      {prediction.confidence}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PricePredictor