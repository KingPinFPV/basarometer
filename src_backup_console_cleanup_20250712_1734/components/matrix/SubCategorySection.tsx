'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import { EnhancedPriceCell } from './EnhancedPriceCell'
import { EnhancedPriceCellV2 } from './EnhancedPriceCellV2'
import type { MeatSubCategory, MeatCut, Retailer, PriceReport } from '@/lib/database.types'

interface SubCategorySectionProps {
  subCategory: MeatSubCategory & { cuts_count?: number }
  cuts: MeatCut[]
  retailers: Retailer[]
  priceMatrix: Record<string, Record<string, PriceReport | null>>
  filteredCutIds: string[]
  isExpanded: boolean
  onToggle: () => void
  useV2Algorithm?: boolean
  onReportPrice?: (cutId: string, retailerId: string) => void
  onAddToShoppingList?: (cutId: string) => void
}

export function SubCategorySection({
  subCategory,
  cuts,
  retailers,
  priceMatrix,
  filteredCutIds,
  isExpanded,
  onToggle,
  useV2Algorithm = true,
  onReportPrice,
  onAddToShoppingList
}: SubCategorySectionProps) {
  
  // Only show cuts that match the filter
  const visibleCuts = cuts.filter(cut => filteredCutIds.includes(cut.id))
  
  // Get all price reports in this category for V2 color algorithm
  const allReportsInCategory = visibleCuts.flatMap(cut => 
    Object.values(priceMatrix[cut.id] || {}).filter(Boolean) as PriceReport[]
  )
  
  if (visibleCuts.length === 0) {
    return null
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden sub-category-mobile">
      {/* Sub-Category Header */}
      <button
        onClick={onToggle}
        className="w-full p-3 md:p-4 text-right hover:bg-gray-50 transition-colors bg-gray-50 touch-action-manipulation"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <span className="text-lg">{subCategory.icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {subCategory.name_hebrew}
              </h3>
              <p className="text-sm text-gray-500">
                {visibleCuts.length} נתחים
              </p>
            </div>
          </div>
          <div className="flex items-center">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded Matrix */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {visibleCuts.map((cut) => (
            <div key={cut.id} className="border-b border-gray-100 last:border-b-0">
              <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-0">
                {/* Cut Name */}
                <div className="bg-gray-50 p-4 border-r border-gray-200 flex flex-col justify-center">
                  <div className="font-bold text-gray-800 text-right">
                    {cut.name_hebrew}
                  </div>
                  {cut.name_english && (
                    <div className="text-sm text-gray-500 text-right">
                      {cut.name_english}
                    </div>
                  )}
                  {cut.is_popular && (
                    <div className="text-xs text-blue-600 text-right mt-1">
                      ⭐ פופולרי
                    </div>
                  )}
                </div>
                
                {/* Price Cells */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-0">
                  {retailers.map((retailer) => {
                    const priceReport = priceMatrix[cut.id]?.[retailer.id]
                    
                    if (useV2Algorithm) {
                      return (
                        <EnhancedPriceCellV2
                          key={`${cut.id}-${retailer.id}`}
                          priceReport={priceReport}
                          meatCut={cut}
                          retailer={retailer}
                          allReportsInCategory={allReportsInCategory}
                          onReportPrice={() => onReportPrice?.(cut.id, retailer.id)}
                          onAddToShoppingList={() => onAddToShoppingList?.(cut.id)}
                          showCalculator={false}
                          compact={false}
                        />
                      )
                    }
                    
                    return (
                      <EnhancedPriceCell
                        key={`${cut.id}-${retailer.id}`}
                        priceReport={priceReport}
                        meatCut={cut}
                        retailer={retailer}
                        allReportsForCut={Object.values(priceMatrix[cut.id] || {}).filter(Boolean) as PriceReport[]}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}