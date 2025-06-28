'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Star, TrendingUp, TrendingDown, Minus, Heart, Share2 } from 'lucide-react'
import { getCategoryInfo } from '@/utils/productCategorization'
import { formatPricePerKg, getPriceColorClass, getSavingsText } from '@/utils/priceCalculations'
import styles from '@/styles/comparison.module.css'

const NETWORKS = {
  'rami_levy': { name: 'רמי לוי', color: 'bg-blue-100 text-blue-800' },
  'shufersal': { name: 'שופרסל', color: 'bg-red-100 text-red-800' },
  'mega': { name: 'מגה', color: 'bg-orange-100 text-orange-800' },
  'yohananof': { name: 'יוחננוף', color: 'bg-purple-100 text-purple-800' },
  'victory': { name: 'ויקטורי', color: 'bg-green-100 text-green-800' },
  'carrefour': { name: 'קרפור', color: 'bg-cyan-100 text-cyan-800' },
  'government': { name: 'ממשלתי', color: 'bg-indigo-100 text-indigo-800' },
  'yeinot_bitan': { name: 'יינות ביתן', color: 'bg-pink-100 text-pink-800' }
}

interface ProductCardProps {
  product: any
  viewMode: 'grid' | 'list'
}

export function ProductCard({ product, viewMode }: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  
  const categoryInfo = getCategoryInfo(product.category)
  const { priceAnalysis, networkPricesArray } = product

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />
      default: return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const shareProduct = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `מחיר ${product.name_hebrew} בבשרומטר`,
          text: `מחיר הטוב ביותר: ${formatPricePerKg(priceAnalysis.bestPricePerKg)} לק״ג - חסכון של עד ${priceAnalysis.savingsPotential.toFixed(0)}%`,
          url: window.location.href
        })
      } catch (error) {
        // Fallback to clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(
            `${product.name_hebrew} - מחיר הטוב ביותר: ${formatPricePerKg(priceAnalysis.bestPricePerKg)} לק״ג`
          )
        }
      }
    }
  }

  return (
    <div className={`${styles.productCard} bg-white rounded-xl border border-gray-200 shadow-sm ${
      viewMode === 'list' ? 'p-6' : 'overflow-hidden'
    }`}>
      {/* Card Header */}
      <div className={viewMode === 'grid' ? 'p-6 pb-4' : ''}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{categoryInfo.icon}</span>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                {product.name_hebrew}
              </h3>
              {product.is_popular && (
                <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
              )}
              {getTrendIcon(product.trend)}
            </div>
            
            {product.name_english && (
              <p className="text-sm text-gray-600 mb-3">
                {product.name_english}
              </p>
            )}
            
            {/* Category Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {categoryInfo.name}
              </span>
              <span className="text-xs text-gray-500">
                זמין ב-{priceAnalysis.networksCount} רשתות
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite 
                  ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
              title={isFavorite ? 'הסר מהמועדפים' : 'הוסף למועדפים'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={shareProduct}
              className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
              title="שתף מוצר"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Price Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
            <div className="text-xl font-bold text-green-600">
              {formatPricePerKg(priceAnalysis.bestPricePerKg)}
            </div>
            <div className="text-xs text-green-700 font-medium">הטוב ביותר לק״ג</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
            <div className="text-xl font-bold text-blue-600">
              {formatPricePerKg(priceAnalysis.avgPricePerKg)}
            </div>
            <div className="text-xs text-blue-700 font-medium">ממוצע לק״ג</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
            <div className="text-xl font-bold text-orange-600">
              {priceAnalysis.savingsPotential.toFixed(0)}%
            </div>
            <div className="text-xs text-orange-700 font-medium">חיסכון פוטנציאלי</div>
          </div>
        </div>

        {/* Best Value Highlight */}
        {priceAnalysis.pricesWithBadges.length > 0 && (
          <div className="bg-gradient-to-l from-yellow-50 to-white rounded-lg p-4 border border-yellow-200 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    הטוב ביותר: {NETWORKS[priceAnalysis.pricesWithBadges[0].network]?.name || priceAnalysis.pricesWithBadges[0].network}
                  </div>
                  <div className="text-xs text-gray-600">
                    חסכון של {priceAnalysis.pricesWithBadges.length > 1 ? 
                      priceAnalysis.pricesWithBadges[priceAnalysis.pricesWithBadges.length - 1].savingsFromBest : 0}% 
                    מהיקר ביותר
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  {formatPricePerKg(priceAnalysis.pricesWithBadges[0].pricePerKg)}
                </div>
                <div className="text-xs text-gray-600">לק״ג</div>
              </div>
            </div>
          </div>
        )}

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <>
              <span>הסתר פירוט מחירים</span>
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>הצג פירוט מחירים ברשתות ({priceAnalysis.networksCount})</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Expanded Network Prices */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-100 animate-fade-in">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>מחירים ברשתות</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              מחירים לק״ג
            </span>
          </h4>
          <div className="space-y-3">
            {priceAnalysis.pricesWithBadges.map((networkPrice, index) => {
              const networkInfo = NETWORKS[networkPrice.network] || { 
                name: networkPrice.network, 
                color: 'bg-gray-100 text-gray-600' 
              }
              
              return (
                <div key={networkPrice.network} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    {networkPrice.badge && (
                      <span className="text-lg" title={networkPrice.badge.label}>
                        {networkPrice.badge.emoji}
                      </span>
                    )}
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${networkInfo.color}`}>
                      {networkInfo.name}
                    </span>
                    <span className="text-xs text-gray-500">#{networkPrice.ranking}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {networkPrice.savingsFromBest > 0 && (
                      <span className="text-xs text-red-600 font-medium">
                        +{networkPrice.savingsFromBest}%
                      </span>
                    )}
                    <div className="text-right">
                      <div className={`font-bold ${getPriceColorClass(networkPrice.ranking)}`}>
                        {formatPricePerKg(networkPrice.pricePerKg)}
                      </div>
                      <div className="text-xs text-gray-500">
                        (₪{networkPrice.price.toFixed(0)} סה״כ)
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Price Range Summary */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xs text-blue-700 text-center">
              <strong>טווח מחירים לק״ג:</strong>{' '}
              {formatPricePerKg(priceAnalysis.bestPricePerKg)} - {formatPricePerKg(priceAnalysis.worstPricePerKg)}
              {' '}• <strong>הפרש:</strong> {formatPricePerKg(priceAnalysis.worstPricePerKg - priceAnalysis.bestPricePerKg)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}