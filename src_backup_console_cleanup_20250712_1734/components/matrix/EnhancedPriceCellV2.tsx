'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { getColorAlgorithmV2, formatPriceWithContext } from '@/utils/colorAlgorithmV2'
import { PriceCalculatorComponent } from '@/components/price/PriceCalculatorComponent'
import { ColorIndicatorInline } from '@/components/ui/ColorLegendV2'
import type { PriceReport, MeatCut, Retailer } from '@/lib/database.types'

interface EnhancedPriceCellV2Props {
  priceReport: PriceReport | null
  meatCut: MeatCut
  retailer: Retailer
  allReportsInCategory: PriceReport[]
  onReportPrice?: () => void
  onAddToShoppingList?: () => void
  showCalculator?: boolean
  compact?: boolean
}

export function EnhancedPriceCellV2({
  priceReport,
  meatCut,
  allReportsInCategory,
  onReportPrice,
  onAddToShoppingList,
  showCalculator = false,
  compact = false
}: EnhancedPriceCellV2Props) {
  const [showDetails, setShowDetails] = useState(false)
  const [showPriceCalculator, setShowPriceCalculator] = useState(showCalculator)
  
  const colorResult = getColorAlgorithmV2(priceReport, meatCut, allReportsInCategory)
  
  if (!priceReport) {
    return (
      <div className="border-b border-gray-200 p-3 text-center min-h-[100px] flex flex-col justify-center bg-gray-50">
        <div className="text-gray-400 text-sm mb-2">אין מידע</div>
        
        {/* Action Buttons */}
        <div className="space-y-1">
          <button 
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors w-full"
            onClick={onReportPrice}
          >
            דווח מחיר
          </button>
          
          {onAddToShoppingList && (
            <button 
              className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors w-full"
              onClick={onAddToShoppingList}
            >
              הוסף לרשימה
            </button>
          )}
        </div>
      </div>
    )
  }

  const priceDisplay = formatPriceWithContext(priceReport, colorResult)
  const isExpired = priceReport.expires_at && new Date(priceReport.expires_at) < new Date()
  const timeAgo = formatDistanceToNow(new Date(priceReport.created_at), { 
    addSuffix: true,
    locale: he 
  })

  return (
    <div 
      className={`
        ${colorResult.background} ${colorResult.border} border-b border-gray-200 
        ${compact ? 'min-h-[80px] p-2' : 'min-h-[100px] p-3'} 
        md:p-3 text-center flex flex-col justify-center transition-all hover:shadow-md
        cursor-pointer relative price-cell-mobile
        ${isExpired ? 'opacity-60' : ''}
      `}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Priority Indicator */}
      <div className="absolute top-1 left-1">
        <ColorIndicatorInline 
          priority={colorResult.priority} 
          label={colorResult.label}
          size="xs"
        />
      </div>

      {/* Sale Indicator */}
      {priceReport.is_on_sale && (
        <div className="absolute top-1 right-1 text-xs">
          {priceDisplay.saleIndicator}
        </div>
      )}

      {/* Price Calculator Component */}
      {showPriceCalculator ? (
        <PriceCalculatorComponent 
          priceReport={priceReport}
          meatCut={meatCut}
          showConverter={showDetails}
          className="mb-2"
        />
      ) : (
        <>
          {/* Main Price */}
          <div className={`${compact ? 'text-md' : 'text-lg md:text-xl'} font-bold ${colorResult.text} mb-1 price-text`}>
            {priceDisplay.mainPrice}
          </div>

          {/* Original Price (if on sale) */}
          {priceDisplay.originalPrice && (
            <div className="text-xs md:text-sm text-gray-500 line-through mb-1">
              {priceDisplay.originalPrice}
            </div>
          )}

          {/* Context Label */}
          <div className={`text-xs md:text-sm ${colorResult.text} font-medium mb-1 price-label`}>
            {priceDisplay.contextLabel}
          </div>

          {/* Normalized Display */}
          <div className="text-xs md:text-sm text-gray-500">
            {(priceReport.price_per_kg / 1000).toFixed(2)} ₪/100גר
          </div>
        </>
      )}

      {/* Time Indicators */}
      {!compact && (
        <div className="text-xs text-gray-500 mt-1">
          {isExpired ? 'פג תוקף' : timeAgo}
        </div>
      )}

      {/* Confidence Stars */}
      {!compact && (
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
      )}

      {/* Action Buttons (when not expanded) */}
      {!showDetails && onAddToShoppingList && (
        <button 
          className="absolute bottom-1 right-1 text-xs md:text-sm bg-green-500 text-white px-2 py-1 md:px-3 md:py-1.5 rounded hover:bg-green-600 transition-colors mobile-action-btn"
          onClick={(e) => {
            e.stopPropagation()
            onAddToShoppingList()
          }}
        >
          +
        </button>
      )}

      {/* Expanded Details */}
      {showDetails && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-10 p-3 text-xs">
          <div className="space-y-2">
            {/* Price Calculator Toggle */}
            <div className="flex justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowPriceCalculator(!showPriceCalculator)
                }}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
              >
                {showPriceCalculator ? 'הסתר מחשבון' : 'הצג מחשבון'}
              </button>
            </div>

            {/* Price Info */}
            <div className="space-y-1">
              <div>מחיר ל-ק&quot;ג: {priceDisplay.mainPrice}</div>
              {priceReport.location && (
                <div>מיקום: {priceReport.location}</div>
              )}
              <div>רמת ביטחון: {priceReport.confidence_score}/5</div>
              <div>קטגוריה: {colorResult.label}</div>
              
              {priceReport.verified_at && (
                <div className="text-green-600">✓ מאומת</div>
              )}
              {isExpired && (
                <div className="text-red-600">⚠️ פג תוקף</div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2 border-t border-gray-100">
              {onReportPrice && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onReportPrice()
                  }}
                  className="flex-1 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                >
                  עדכן מחיר
                </button>
              )}
              
              {onAddToShoppingList && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddToShoppingList()
                  }}
                  className="flex-1 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition-colors"
                >
                  הוסף לרשימה
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}