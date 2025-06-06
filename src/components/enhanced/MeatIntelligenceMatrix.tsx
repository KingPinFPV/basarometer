// Enhanced Price Matrix with Intelligent Meat Classification
// Building on existing PriceMatrix patterns with mobile-first responsive design
// Supports 54+ normalized cuts with quality grade separation

'use client'

import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, Search, Filter, Star } from 'lucide-react'
import { usePriceMatrixData } from '@/hooks/usePriceMatrixData'
import { useEnhancedMeatData } from '@/hooks/useEnhancedMeatData'

interface QualityGrade {
  id: string
  name_hebrew: string
  name_english: string
  tier: 'regular' | 'premium' | 'angus' | 'wagyu' | 'veal'
  color: string
  description: string
}

interface EnhancedMeatCut {
  id: string
  name_hebrew: string
  name_english: string
  normalized_cut_id: string
  quality_grades: QualityGrade[]
  variations_count: number
  avg_price_range: {
    min: number
    max: number
  }
  is_popular: boolean
  market_coverage: number // percentage of retailers carrying this cut
}

const QUALITY_TIERS: Record<string, { color: string; bgColor: string; label: string }> = {
  regular: { color: 'text-gray-700', bgColor: 'bg-gray-100', label: 'רגיל' },
  premium: { color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'פרמיום' },
  angus: { color: 'text-green-700', bgColor: 'bg-green-100', label: 'אנגוס' },
  wagyu: { color: 'text-purple-700', bgColor: 'bg-purple-100', label: 'וואגיו' },
  veal: { color: 'text-pink-700', bgColor: 'bg-pink-100', label: 'עגל' }
}

export default function MeatIntelligenceMatrix() {
  const [selectedCategory] = useState<string>('בקר')
  const [qualityFilter, setQualityFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showOnlyPopular, setShowOnlyPopular] = useState(false)

  // Enhanced hooks for meat intelligence data
  const { 
    enhancedMeatData, 
    qualityBreakdown, 
    marketInsights,
    loading: meatLoading 
  } = useEnhancedMeatData(selectedCategory)
  
  const { 
    priceMatrix, 
    loading: priceLoading 
  } = usePriceMatrixData()

  // Filter and sort meat cuts based on intelligence
  const filteredMeatCuts = useMemo(() => {
    if (!enhancedMeatData) return []
    
    return enhancedMeatData
      .filter(cut => {
        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          return cut.name_hebrew.toLowerCase().includes(searchLower) ||
                 cut.name_english.toLowerCase().includes(searchLower)
        }
        return true
      })
      .filter(cut => {
        // Quality filter
        if (qualityFilter !== 'all') {
          return cut.quality_grades.some(grade => grade.tier === qualityFilter)
        }
        return true
      })
      .filter(cut => {
        // Popular filter
        if (showOnlyPopular) {
          return cut.is_popular
        }
        return true
      })
      .sort((a, b) => {
        // Sort by popularity first, then by market coverage
        if (a.is_popular !== b.is_popular) {
          return a.is_popular ? -1 : 1
        }
        return b.market_coverage - a.market_coverage
      })
  }, [enhancedMeatData, searchTerm, qualityFilter, showOnlyPopular])

  const loading = meatLoading || priceLoading

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתוני בשר חכמים...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Enhanced Header with Market Intelligence */}
      <div className="bg-gradient-to-l from-blue-50 to-white rounded-lg p-6 border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              מטריצת בשר חכמה
            </h1>
            <p className="text-gray-600">
              {filteredMeatCuts.length} נתחים זמינים • 
              {qualityBreakdown?.total_variations || 0} וריאציות בשוק • 
              {marketInsights?.active_retailers || 0} רשתות פעילות
            </p>
          </div>
          
          {/* Quality Distribution */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(QUALITY_TIERS).map(([tier, config]) => {
              const count = qualityBreakdown?.by_quality?.[tier] || 0
              if (count === 0) return null
              
              return (
                <span 
                  key={tier} 
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
                >
                  {config.label}: {count}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="חפש נתח בשר..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Quality Filter */}
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[120px]"
            >
              <option value="all">כל האיכויות</option>
              {Object.entries(QUALITY_TIERS).map(([tier, config]) => (
                <option key={tier} value={tier}>{config.label}</option>
              ))}
            </select>

            {/* Toggles */}
            <div className="flex gap-2">
              <button
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showOnlyPopular 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setShowOnlyPopular(!showOnlyPopular)}
              >
                <Star className="h-4 w-4 ml-1" />
                פופולריים
              </button>
              
              <button
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? 'רשימה' : 'רשת'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Meat Cuts Display */}
      <div className={`grid gap-4 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
          : 'grid-cols-1'
      }`}>
        {filteredMeatCuts.map((cut) => (
          <EnhancedMeatCutCard 
            key={cut.id}
            cut={cut}
            priceData={priceMatrix}
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* Market Intelligence Summary */}
      {marketInsights && (
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              תובנות שוק
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {marketInsights.total_products}
                </div>
                <div className="text-sm text-gray-600">מוצרים פעילים</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(marketInsights.avg_confidence * 100)}%
                </div>
                <div className="text-sm text-gray-600">דיוק זיהוי</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  ₪{marketInsights.avg_price_per_kg?.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">מחיר ממוצע לק&quot;ג</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {marketInsights.active_retailers}
                </div>
                <div className="text-sm text-gray-600">רשתות פעילות</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced Meat Cut Card Component
function EnhancedMeatCutCard({ 
  cut, 
  priceData, 
  viewMode 
}: {
  cut: EnhancedMeatCut
  priceData: Record<string, unknown>
  viewMode: 'grid' | 'list'
}) {
  const [expanded, setExpanded] = useState(false)

  const cutPriceData = priceData?.[cut.id] || {}
  const bestPrice = Math.min(...Object.values(cutPriceData).filter(Boolean))
  const worstPrice = Math.max(...Object.values(cutPriceData).filter(Boolean))

  return (
    <div className={`bg-white rounded-lg border shadow-sm hover:shadow-lg transition-shadow ${
      viewMode === 'list' ? 'p-4' : ''
    }`}>
      <div className="p-6 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold leading-tight mb-2 text-gray-900">
              {cut.name_hebrew}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {cut.name_english}
            </p>
            
            {/* Quality Grades */}
            <div className="flex flex-wrap gap-1">
              {cut.quality_grades.map((grade) => {
                const config = QUALITY_TIERS[grade.tier]
                return (
                  <span 
                    key={grade.id}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
                  >
                    {config.label}
                  </span>
                )
              })}
            </div>
          </div>

          {cut.is_popular && (
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
          )}
        </div>
      </div>

      <div className="px-6 pb-6">
        {/* Price Range */}
        {bestPrice && worstPrice && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">טווח מחירים</span>
              <span className="text-xs text-gray-600">
                {cut.market_coverage}% כיסוי שוק
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-green-600">
                ₪{bestPrice.toFixed(0)}
              </span>
              <span className="text-sm text-gray-500">-</span>
              <span className="text-lg font-bold text-red-600">
                ₪{worstPrice.toFixed(0)}
              </span>
            </div>
          </div>
        )}

        {/* Variations Count */}
        <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
          <span>{cut.variations_count} וריאציות בשוק</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="space-y-3 pt-3 border-t">
            <div>
              <h4 className="font-medium mb-2">זמין ברשתות:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(cutPriceData).map(([retailer, price]) => (
                  <div key={retailer} className="flex justify-between">
                    <span>{retailer}</span>
                    <span className="font-medium">₪{price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}