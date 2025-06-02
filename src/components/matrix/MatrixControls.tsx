'use client'

import React from 'react'
import { MatrixFilters } from '@/types/matrix'

interface MatrixControlsProps {
  filters: MatrixFilters
  onFiltersChange: (filters: MatrixFilters) => void
  categories: string[]
}

export default function MatrixControls({ filters, onFiltersChange, categories }: MatrixControlsProps) {
  const updateFilter = <K extends keyof MatrixFilters>(key: K, value: MatrixFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleCategory = (category: string) => {
    const isSelected = filters.selectedCategories.includes(category)
    const newSelection = isSelected
      ? filters.selectedCategories.filter(c => c !== category)
      : [...filters.selectedCategories, category]
    updateFilter('selectedCategories', newSelection)
  }

  const selectAllCategories = () => {
    updateFilter('selectedCategories', categories)
  }

  const clearCategorySelection = () => {
    updateFilter('selectedCategories', [])
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="promotions-only"
            checked={filters.showPromotionsOnly}
            onChange={(e) => updateFilter('showPromotionsOnly', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="promotions-only" className="text-sm text-gray-700">
            הצג רק מבצעים
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="hide-empty"
            checked={filters.hideEmptyRows}
            onChange={(e) => updateFilter('hideEmptyRows', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="hide-empty" className="text-sm text-gray-700">
            הסתר מוצרים ללא מחירים
          </label>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="min-reports" className="text-sm text-gray-700">
            מינימום דיווחים:
          </label>
          <input
            type="number"
            id="min-reports"
            min="0"
            max="10"
            value={filters.minReports}
            onChange={(e) => updateFilter('minReports', parseInt(e.target.value) || 0)}
            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>

      {/* Category Selection */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">קטגוריות:</span>
          <button
            onClick={selectAllCategories}
            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            בחר הכל
          </button>
          <button
            onClick={clearCategorySelection}
            className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            נקה בחירה
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isSelected = filters.selectedCategories.length === 0 || filters.selectedCategories.includes(category)
            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1 text-sm rounded border transition-colors ${
                  isSelected
                    ? 'bg-blue-100 border-blue-300 text-blue-800'
                    : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            )
          })}
        </div>
      </div>

      {/* Applied Filters Summary */}
      {(filters.showPromotionsOnly || filters.hideEmptyRows || filters.minReports > 0 || filters.selectedCategories.length > 0) && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <span className="font-medium text-blue-800">מסננים פעילים: </span>
          <span className="text-blue-700">
            {[
              filters.showPromotionsOnly && 'מבצעים בלבד',
              filters.hideEmptyRows && 'הסתר מוצרים ללא מחירים',
              filters.minReports > 0 && `מינימום ${filters.minReports} דיווחים`,
              filters.selectedCategories.length > 0 && `${filters.selectedCategories.length} קטגוריות נבחרו`
            ].filter(Boolean).join(', ')}
          </span>
        </div>
      )}
    </div>
  )
}