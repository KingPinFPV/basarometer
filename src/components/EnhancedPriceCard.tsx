'use client'

import React from 'react'
import { MapPin, Calendar, Bot, User, Shield, Star } from 'lucide-react'

interface EnhancedPriceCardProps {
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
  
  // Enhanced scanner data
  scannerSource?: string
  originalProductName?: string
  scannerConfidence?: number
  detectedBrand?: string
  scannerGrade?: string
  reportedBy?: string
  isVerified?: boolean
}

export default function EnhancedPriceCard({
  price,
  normalizedPrice,
  unit,
  quantity,
  isOnSale = false,
  salePrice,
  product,
  retailer,
  reportedAt,
  className = '',
  scannerSource,
  originalProductName,
  scannerConfidence,
  detectedBrand,
  scannerGrade,
  reportedBy: _reportedBy,
  isVerified = false
}: EnhancedPriceCardProps) {
  const activePrice = (isOnSale && salePrice) ? salePrice : price
  const isFromScanner = !!scannerSource
  const confidenceScore = scannerConfidence || 0
  
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

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.85) return 'text-green-700 bg-green-100 border-green-200'
    if (confidence >= 0.7) return 'text-blue-700 bg-blue-100 border-blue-200'
    if (confidence >= 0.5) return 'text-yellow-700 bg-yellow-100 border-yellow-200'
    return 'text-red-700 bg-red-100 border-red-200'
  }

  const getGradeDisplay = (grade?: string): string => {
    const gradeMap: Record<string, string> = {
      'premium': 'פרימיום',
      'angus': 'אנגוס',
      'organic': 'אורגני',
      'kosher': 'כשר',
      'fresh': 'טרי',
      'frozen': 'קפוא',
      'regular': 'רגיל'
    }
    return gradeMap[grade || 'regular'] || grade || 'רגיל'
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${
      isFromScanner ? 'border-r-4 border-r-blue-500' : ''
    } ${className}`}>
      
      {/* Enhanced Header with Scanner Info */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 text-lg">{product.name}</h3>
          
          {/* Original scanner name if different */}
          {isFromScanner && originalProductName && originalProductName !== product.name && (
            <p className="text-sm text-gray-500 italic mt-1">
              שם מקורי: {originalProductName}
            </p>
          )}
          
          {product.cut_name && (
            <p className="text-sm text-gray-600 mt-1">
              {product.cut_name}
              {product.subtype_name && ` - ${product.subtype_name}`}
            </p>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          {/* Scanner Badge */}
          {isFromScanner && (
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                <Bot className="w-3 h-3" />
                סריקה אוטומטית
              </span>
            </div>
          )}
          
          {/* Sale Badge */}
          {isOnSale && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              מבצע
            </span>
          )}
          
          {/* Verified Badge */}
          {isVerified && (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" />
              מאומת
            </span>
          )}
        </div>
      </div>

      {/* Enhanced Product Info */}
      {(detectedBrand || scannerGrade) && (
        <div className="flex gap-2 mb-3">
          {detectedBrand && (
            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
              מותג: {detectedBrand}
            </span>
          )}
          {scannerGrade && (
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              איכות: {getGradeDisplay(scannerGrade)}
            </span>
          )}
        </div>
      )}

      {/* Confidence Score for Scanner Data */}
      {isFromScanner && (
        <div className="mb-3">
          <div className={`text-xs px-2 py-1 rounded-full border inline-flex items-center gap-1 ${
            getConfidenceColor(confidenceScore)
          }`}>
            <Star className="w-3 h-3" />
            רמת ביטחון: {(confidenceScore * 100).toFixed(0)}%
          </div>
        </div>
      )}

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

      {/* Enhanced Footer */}
      <div className="space-y-2">
        {/* Store and Location */}
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
        
        {/* Source Information */}
        <div className="flex items-center justify-between text-xs text-gray-400 border-t pt-2">
          <div className="flex items-center gap-1">
            {isFromScanner ? (
              <>
                <Bot className="w-3 h-3" />
                <span>סריקה אוטומטית מ-{scannerSource}</span>
              </>
            ) : (
              <>
                <User className="w-3 h-3" />
                <span>דיווח משתמש</span>
              </>
            )}
          </div>
          
          {isFromScanner && (
            <div className="text-xs text-gray-400">
              מקור: {scannerSource}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}