'use client'

import React from 'react'
import { MapPin, Calendar } from 'lucide-react'

interface PriceCardProps {
  id: number
  price: number
  normalizedPrice?: number
  unit: string
  quantity: number
  isOnSale?: boolean
  salePrice?: number
  product: {
    name: string
    cut_name?: string
    subtype_name?: string
  }
  retailer: {
    name: string
    location?: string
  }
  reportedAt: string
  className?: string
}

export default function PriceCard({
  price,
  normalizedPrice,
  unit,
  quantity,
  isOnSale = false,
  salePrice,
  product,
  retailer,
  reportedAt,
  className = ''
}: PriceCardProps) {
  const activePrice = (isOnSale && salePrice) ? salePrice : price
  
  const formatPrice = (price: number) => {
    return `₪${price.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'זה עתה'
    if (diffInHours < 24) return `לפני ${diffInHours} שעות`
    if (diffInHours < 48) return 'אתמול'
    return date.toLocaleDateString('he-IL')
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 text-lg">{product.name}</h3>
          {product.cut_name && (
            <p className="text-sm text-gray-600 mt-1">
              {product.cut_name}
              {product.subtype_name && ` - ${product.subtype_name}`}
            </p>
          )}
        </div>
        {isOnSale && (
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
            מבצע
          </span>
        )}
      </div>

      {/* Price Section */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3 mb-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-2xl font-bold text-blue-700">
              {formatPrice(activePrice)}
            </div>
            <div className="text-sm text-gray-600">
              ל-{quantity} {unit === 'kg' ? 'ק״ג' : unit}
            </div>
          </div>
          
          {normalizedPrice && (
            <div className="text-left">
              <div className="text-lg font-semibold text-green-600">
                {formatPrice(normalizedPrice)}
              </div>
              <div className="text-sm text-gray-500">לקילוגרם</div>
            </div>
          )}
        </div>
        
        {isOnSale && salePrice && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <span className="text-sm text-gray-500 line-through">
              מחיר רגיל: {formatPrice(price)}
            </span>
            <span className="text-green-600 font-medium text-sm mr-2">
              חיסכון: {formatPrice(price - salePrice)}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center">
          <MapPin className="w-4 h-4 ml-1" />
          <span>{retailer.name}</span>
          {retailer.location && (
            <span className="mr-1">• {retailer.location}</span>
          )}
        </div>
        
        <div className="flex items-center">
          <Calendar className="w-4 h-4 ml-1" />
          <span>{formatDate(reportedAt)}</span>
        </div>
      </div>
    </div>
  )
}