'use client'

import { useState } from 'react'
import { COLOR_LEGEND_V2 } from '@/utils/colorAlgorithmV2'

interface ColorLegendV2Props {
  className?: string
  compact?: boolean
  showDescription?: boolean
}

export function ColorLegendV2({ 
  className = '', 
  compact = false,
  showDescription = true 
}: ColorLegendV2Props) {
  const [isExpanded, setIsExpanded] = useState(!compact)

  if (compact && !isExpanded) {
    return (
      <div className={`color-legend-compact ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span>🎨</span>
          <span>מפתח צבעים</span>
          <span className="text-xs">👁️</span>
        </button>
      </div>
    )
  }

  return (
    <div className={`color-legend bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🎨</span>
          <h3 className="text-sm font-semibold text-gray-800">
            מפתח צבעים - גרסה 2.0
          </h3>
        </div>
        {compact && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Legend Items */}
      <div className="p-3 space-y-2">
        <div className="text-xs text-gray-600 mb-3 text-center">
          סדר עדיפויות (מגבוה לנמוך):
        </div>
        
        {COLOR_LEGEND_V2.map((item) => (
          <div 
            key={item.priority}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* Priority Number */}
            <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
              {item.priority}
            </div>

            {/* Color Sample */}
            <div className={`flex-shrink-0 w-8 h-8 rounded border-2 ${item.color}`} />

            {/* Label and Description */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800">
                {item.label}
              </div>
              {showDescription && (
                <div className="text-xs text-gray-500 leading-tight">
                  {item.description}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Algorithm Info */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="font-medium">אלגוריתם V2.0:</div>
            <div>• מבצעים תמיד בכחול (עדיפות גבוהה)</div>
            <div>• השוואה בתוך קטגוריה בלבד</div>
            <div>• חישוב דינמי על בסיס מחירים עדכניים</div>
            <div>• מחירי מבצע לא נכללים בחישוב טווח</div>
          </div>
        </div>

        {/* Version Info */}
        <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-50">
          Basarometer V5.1 - ColorAlgorithmV2
        </div>
      </div>
    </div>
  )
}

/**
 * Inline color indicator for use within price cells
 */
export function ColorIndicatorInline({ 
  priority, 
  label,
  size = 'sm' 
}: { 
  priority: number
  label: string
  size?: 'xs' | 'sm' | 'md'
}) {
  const sizeClasses = {
    xs: 'w-3 h-3 text-xs',
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-sm'
  }

  const legendItem = COLOR_LEGEND_V2.find(item => item.priority === priority)
  
  if (!legendItem) return null

  return (
    <div className="flex items-center space-x-1">
      <div 
        className={`${sizeClasses[size]} rounded-full border ${legendItem.color} flex items-center justify-center font-bold`}
        title={`${label} - ${legendItem.description}`}
      >
        {priority}
      </div>
      {size !== 'xs' && (
        <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-gray-600`}>
          {label}
        </span>
      )}
    </div>
  )
}

/**
 * Compact horizontal legend for mobile/small spaces
 */
export function ColorLegendHorizontal({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {COLOR_LEGEND_V2.map((item) => (
        <div 
          key={item.priority}
          className="flex items-center space-x-1 bg-white border border-gray-200 rounded px-2 py-1"
        >
          <div className={`w-3 h-3 rounded border ${item.color}`} />
          <span className="text-xs text-gray-700">{item.label}</span>
        </div>
      ))}
    </div>
  )
}