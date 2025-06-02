'use client'

import React, { useState } from 'react'
import { useMatrixData } from '@/hooks/matrix/useMatrixData'
import { MatrixFilters, MatrixActions } from '@/types/matrix'
import CategorySection from './CategorySection'
import MatrixControls from './MatrixControls'
import LiveIndicator from '../LiveIndicator'

interface MatrixTableProps {
  actions?: MatrixActions
}

export default function MatrixTable({ actions }: MatrixTableProps) {
  const { matrixData, loading, error, isConnected, refetch } = useMatrixData()
  const [filters, setFilters] = useState<MatrixFilters>({
    showPromotionsOnly: false,
    hideEmptyRows: false,
    selectedCategories: [],
    minReports: 0
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-600">טוען מטריקס מחירים...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <h2 className="text-red-800 font-semibold mb-2">שגיאה בטעינת מטריקס המחירים</h2>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button 
          onClick={refetch}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          נסה שוב
        </button>
      </div>
    )
  }

  if (!matrixData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">אין נתוני מטריקס זמינים</p>
        <button 
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          רענן
        </button>
      </div>
    )
  }

  // Filter categories based on filters
  const filteredCategories = Object.entries(matrixData.categories).filter(([categoryName]) => {
    if (filters.selectedCategories.length > 0 && !filters.selectedCategories.includes(categoryName)) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6 rtl">
      {/* Matrix Header */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <LiveIndicator isLive={isConnected} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">מטריקס מחירים</h1>
              <p className="text-sm text-gray-600">
                {matrixData.totalProducts} מוצרים × {matrixData.retailers.length} חנויות = {matrixData.totalPricePoints} נקודות מחיר
              </p>
            </div>
          </div>
          <button 
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            רענן מטריקס
          </button>
        </div>

        <MatrixControls 
          filters={filters} 
          onFiltersChange={setFilters}
          categories={Object.keys(matrixData.categories)}
        />
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
          <table className="w-full border-collapse min-w-[800px]">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-2 md:p-3 text-right border-r border-gray-200 bg-white sticky right-0 z-20 min-w-[150px] md:min-w-[200px]">
                  <span className="font-bold text-gray-900 text-sm md:text-base">מוצר</span>
                </th>
                {matrixData.retailers.map((retailer) => (
                  <th key={retailer.id} className="p-2 md:p-3 text-center border border-gray-200 min-w-[100px] md:min-w-[120px]">
                    <div className="flex flex-col items-center gap-1">
                      {retailer.logo_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={retailer.logo_url} 
                          alt={retailer.name}
                          className="w-6 h-6 md:w-8 md:h-8 object-contain"
                        />
                      )}
                      <span className="font-semibold text-xs md:text-sm text-gray-900">{retailer.name}</span>
                      {retailer.type && (
                        <span className="text-xs text-gray-500 hidden md:inline">{retailer.type}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredCategories.map(([categoryName, categoryData]) => (
                <CategorySection
                  key={categoryName}
                  category={categoryData}
                  retailers={matrixData.retailers}
                  actions={actions}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matrix Legend */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">מקרא צבעים</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span>💚 מחיר זול</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span>💛 מחיר ממוצע</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span>❤️ מחיר יקר</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span>💙 במבצע</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
            <span>⚫ אין מחיר</span>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        עודכן לאחרונה: {matrixData.lastUpdated.toLocaleString('he-IL')}
      </div>
    </div>
  )
}