'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import { SubCategorySection } from './SubCategorySection'
import type { CategoryWithSubCategories, MeatCut, Retailer, PriceReport } from '@/lib/database.types'

interface CategoryAccordionProps {
  category: CategoryWithSubCategories
  meatCuts: MeatCut[]
  retailers: Retailer[]
  priceMatrix: Record<string, Record<string, PriceReport | null>>
  searchTerm: string
  isExpanded: boolean
  expandedSubCategories: Set<string>
  onToggleCategory: () => void
  onToggleSubCategory: (subCategoryId: string) => void
  getFilteredCuts: (cuts: string[]) => string[]
  useV2Algorithm?: boolean
  onReportPrice?: (cutId: string, retailerId: string) => void
  onAddToShoppingList?: (cutId: string) => void
}

export function CategoryAccordion({
  category,
  meatCuts,
  retailers,
  priceMatrix,
  searchTerm,
  isExpanded,
  expandedSubCategories,
  onToggleCategory,
  onToggleSubCategory,
  getFilteredCuts,
  useV2Algorithm = true,
  onReportPrice,
  onAddToShoppingList
}: CategoryAccordionProps) {
  
  // Get cuts for this category
  const categoryCuts = meatCuts.filter(cut => cut.category_id === category.id)
  const totalCutsCount = categoryCuts.length
  
  // Calculate available cuts count (with search filter)
  const availableCutsIds = categoryCuts.map(cut => cut.id)
  const filteredCutsIds = getFilteredCuts(availableCutsIds)
  const availableCutsCount = filteredCutsIds.length

  // Don't render category if no cuts match search
  if (searchTerm && availableCutsCount === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Category Header */}
      <button
        onClick={onToggleCategory}
        className="w-full p-4 text-right hover:bg-gray-50 transition-colors border-b border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="text-2xl">
              {category.name_english === 'Beef' ? '🥩' :
               category.name_english === 'Chicken' ? '🐔' :
               category.name_english === 'Lamb' ? '🐑' :
               category.name_english === 'Pork' ? '🐷' :
               category.name_english === 'Turkey' ? '🦃' :
               category.name_english === 'Fish' ? '🐟' : '🥩'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {category.name_hebrew}
              </h2>
              <p className="text-sm text-gray-500">
                {searchTerm && availableCutsCount !== totalCutsCount
                  ? `${availableCutsCount}/${totalCutsCount} נתחים זמינים`
                  : `${totalCutsCount} נתחים זמינים`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-sm text-gray-500">
              {category.sub_categories.length} תת-קטגוריות
            </span>
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Sub-Categories */}
          <div className="p-2 space-y-2">
            {category.sub_categories.map((subCategory) => {
              // Get cuts for this sub-category
              const subCategoryCuts = categoryCuts.filter(cut => cut.sub_category_id === subCategory.id)
              const subCategoryCutIds = subCategoryCuts.map(cut => cut.id)
              const filteredSubCategoryCutIds = getFilteredCuts(subCategoryCutIds)
              
              // Don't render sub-category if no cuts match search
              if (searchTerm && filteredSubCategoryCutIds.length === 0) {
                return null
              }

              return (
                <SubCategorySection
                  key={subCategory.id}
                  subCategory={subCategory}
                  cuts={subCategoryCuts}
                  retailers={retailers}
                  priceMatrix={priceMatrix}
                  filteredCutIds={filteredSubCategoryCutIds}
                  isExpanded={expandedSubCategories.has(subCategory.id)}
                  onToggle={() => onToggleSubCategory(subCategory.id)}
                  useV2Algorithm={useV2Algorithm}
                  onReportPrice={onReportPrice}
                  onAddToShoppingList={onAddToShoppingList}
                />
              )
            })}

            {/* Uncategorized cuts (cuts without sub_category_id) */}
            {(() => {
              const uncategorizedCuts = categoryCuts.filter(cut => !cut.sub_category_id)
              const uncategorizedCutIds = uncategorizedCuts.map(cut => cut.id)
              const filteredUncategorizedCutIds = getFilteredCuts(uncategorizedCutIds)
              
              if (uncategorizedCuts.length > 0 && (!searchTerm || filteredUncategorizedCutIds.length > 0)) {
                return (
                  <SubCategorySection
                    key="uncategorized"
                    subCategory={{
                      id: 'uncategorized',
                      category_id: category.id,
                      name_hebrew: 'לא מקוטלג',
                      name_english: 'Uncategorized',
                      icon: '📦',
                      description: null,
                      display_order: 999,
                      is_active: true,
                      created_at: new Date().toISOString(),
                      cuts_count: uncategorizedCuts.length
                    }}
                    cuts={uncategorizedCuts}
                    retailers={retailers}
                    priceMatrix={priceMatrix}
                    filteredCutIds={filteredUncategorizedCutIds}
                    isExpanded={expandedSubCategories.has('uncategorized')}
                    onToggle={() => onToggleSubCategory('uncategorized')}
                    useV2Algorithm={useV2Algorithm}
                    onReportPrice={onReportPrice}
                    onAddToShoppingList={onAddToShoppingList}
                  />
                )
              }
              return null
            })()}
          </div>
        </div>
      )}
    </div>
  )
}