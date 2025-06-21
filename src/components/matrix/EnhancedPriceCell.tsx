'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { getEnhancedPriceColor, formatPriceDisplay, getConfidenceStyle } from '@/utils/enhancedPriceColors'
import type { PriceReport, MeatCut, Retailer } from '@/lib/database.types'

interface EnhancedPriceCellProps {
  priceReport: PriceReport | null
  meatCut: MeatCut
  retailer: Retailer
  allReportsForCut: PriceReport[]
}

export function EnhancedPriceCell({
  priceReport,
  meatCut,
  retailer,
  allReportsForCut
}: EnhancedPriceCellProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  const colorResult = getEnhancedPriceColor(priceReport, meatCut, allReportsForCut)
  
  if (!priceReport) {
    return (
      <div className="border-b border-gray-200 p-3 text-center min-h-[100px] flex flex-col justify-center bg-gray-50">
        <div className="text-gray-400 text-sm mb-2">אין מידע</div>
        <button 
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
          onClick={() => {
            // TODO: Open price report modal
          }}
        >
          דווח מחיר
        </button>
      </div>
    )
  }

  const priceDisplay = formatPriceDisplay(priceReport)
  const confidenceStyle = getConfidenceStyle(priceReport.confidence_score)
  
  const isExpired = priceReport.expires_at && new Date(priceReport.expires_at) < new Date()
  const timeAgo = formatDistanceToNow(new Date(priceReport.created_at), { 
    addSuffix: true,
    locale: he 
  })

  return (
    <div 
      className={`
        ${colorResult.background} ${colorResult.border} border-b border-gray-200 p-3 text-center 
        min-h-[100px] flex flex-col justify-center transition-all hover:shadow-md
        cursor-pointer relative ${confidenceStyle}
        ${isExpired ? 'opacity-60' : ''}
      `}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Sale Indicator */}
      {priceReport.is_on_sale && (
        <div className="absolute top-1 right-1 text-xs">
          {priceDisplay.saleIndicator}
        </div>
      )}

      {/* Main Price */}
      <div className={`text-lg font-bold ${colorResult.text} mb-1`}>
        {priceDisplay.mainPrice}
      </div>

      {/* Original Price (if on sale) */}
      {priceDisplay.originalPrice && (
        <div className="text-xs text-gray-500 line-through mb-1">
          {priceDisplay.originalPrice}
        </div>
      )}

      {/* Sale Badge */}
      {priceReport.is_on_sale && (
        <div className="text-xs text-red-600 font-medium mb-1">
          מבצע!
        </div>
      )}

      {/* Time Indicator */}
      <div className="text-xs text-gray-500">
        {isExpired ? 'פג תוקף' : 'עדכן'}
      </div>
      
      {/* Time Ago */}
      <div className="text-xs text-gray-400">
        {timeAgo}
      </div>

      {/* Confidence Indicator */}
      <div className="flex justify-center mt-1">
        {[...Array(5)].map((_, i) => (
          <span 
            key={i} 
            className={`text-xs ${i < priceReport.confidence_score ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ⭐
          </span>
        ))}
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-10 p-3 text-xs">
          <div className="space-y-1">
            <div>מחיר ל-ק&quot;ג: {priceDisplay.mainPrice}</div>
            {priceReport.location && (
              <div>מיקום: {priceReport.location}</div>
            )}
            <div>רמת ביטחון: {priceReport.confidence_score}/5</div>
            {priceReport.verified_at && (
              <div className="text-green-600">✓ מאומת</div>
            )}
            {isExpired && (
              <div className="text-red-600">⚠️ פג תוקף</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}