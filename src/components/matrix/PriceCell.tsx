'use client'

import React from 'react'
import { PriceCell as PriceCellType } from '@/types/matrix'
import { getPriceColorClass, getPriceColorIndicator } from '@/lib/matrix/priceColors'

interface PriceCellProps {
  cell: PriceCellType
  onReportPrice?: () => void
  onUpdatePrice?: () => void
}

export default function PriceCell({ cell, onReportPrice, onUpdatePrice }: PriceCellProps) {
  const formatPrice = (price: number) => `₪${price.toFixed(2)}`
  
  if (!cell.hasData) {
    return (
      <td className="p-1 md:p-2 text-center border border-gray-200 bg-gray-50">
        <div className="flex flex-col items-center gap-1">
          <span className="text-gray-400 text-xs">אין מחיר</span>
          {onReportPrice && (
            <button
              onClick={onReportPrice}
              className="text-xs px-1 md:px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <span className="hidden md:inline">דווח מחיר</span>
              <span className="md:hidden">דווח</span>
            </button>
          )}
        </div>
      </td>
    )
  }

  const colorClass = getPriceColorClass(cell.priceColor)
  const indicator = getPriceColorIndicator(cell.priceColor)

  return (
    <td className={`p-1 md:p-2 text-center border border-gray-200 ${colorClass}`}>
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          <span className="text-xs">{indicator}</span>
          <span className="font-semibold text-sm md:text-base">
            {cell.price ? formatPrice(cell.price) : '---'}
          </span>
        </div>
        
        {cell.isPromotion && cell.originalPrice && (
          <div className="text-xs text-gray-500 line-through">
            {formatPrice(cell.originalPrice)}
          </div>
        )}
        
        <div className="text-xs text-gray-600 hidden md:block">
          {cell.reportCount > 0 && (
            <span>{cell.reportCount} דיווח{cell.reportCount > 1 ? 'ים' : ''}</span>
          )}
        </div>

        <div className="flex gap-1 mt-1">
          {onUpdatePrice && (
            <button
              onClick={onUpdatePrice}
              className="text-xs px-1 py-0.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              title="עדכן מחיר"
            >
              <span className="hidden md:inline">עדכן</span>
              <span className="md:hidden">↻</span>
            </button>
          )}
          {onReportPrice && (
            <button
              onClick={onReportPrice}
              className="text-xs px-1 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              title="דווח מחיר חדש"
            >
              <span className="hidden md:inline">דווח</span>
              <span className="md:hidden">+</span>
            </button>
          )}
        </div>
      </div>
    </td>
  )
}