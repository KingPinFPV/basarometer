'use client'

import { useState, useMemo } from 'react'
import { usePriceMatrix } from '@/hooks/usePriceMatrix'
import { AuthTrigger } from '@/components/auth/AuthGuard'
import { RefreshCw, Plus, Tag, TrendingUp, AlertCircle } from 'lucide-react'

interface PriceMatrixProps {
  onReportPrice?: (meatCutId: string, retailerId: string) => void
}

export function PriceMatrix({ onReportPrice }: PriceMatrixProps) {
  const { matrixData, isLoading, error, refreshData, getPriceColor, getAllRetailers } = usePriceMatrix()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Get unique categories for filtering
  const categories = useMemo(() => {
    const categorySet = new Set<string>()
    matrixData.forEach(item => {
      if (item.category_id) {
        categorySet.add(item.category_id)
      }
    })
    return Array.from(categorySet)
  }, [matrixData])

  // Filter data by category
  const filteredData = useMemo(() => {
    if (selectedCategory === 'all') return matrixData
    return matrixData.filter(item => item.category_id === selectedCategory)
  }, [matrixData, selectedCategory])

  // Get all retailers for the header
  const allRetailers = getAllRetailers()

  // Loading state
  if (isLoading) {
    return (
      <div className="card p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-900">טוען מטריקס מחירים...</h3>
          <p className="text-gray-600 text-center">
            אנא המתן בזמן שאנחנו טוענים את הנתונים העדכניים ביותר
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="card p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <h3 className="text-lg font-semibold text-red-700">שגיאה בטעינת המטריקס</h3>
          <p className="text-gray-600 text-center">{error}</p>
          <button
            onClick={refreshData}
            className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2 rtl:space-x-reverse"
          >
            <RefreshCw className="w-4 h-4" />
            <span>נסה שוב</span>
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (filteredData.length === 0) {
    return (
      <div className="card p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <TrendingUp className="w-8 h-8 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">אין נתוני מחירים זמינים</h3>
          <p className="text-gray-600 text-center">
            בקרוב יהיו זמינים נתוני מחירים מהקהילה
          </p>
          <button
            onClick={refreshData}
            className="btn-primary px-4 py-2 rounded-lg flex items-center space-x-2 rtl:space-x-reverse"
          >
            <RefreshCw className="w-4 h-4" />
            <span>רענן נתונים</span>
          </button>
        </div>
      </div>
    )
  }

  const handleReportPrice = (meatCutId: string, retailerId: string) => {
    if (onReportPrice) {
      onReportPrice(meatCutId, retailerId)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">מטריקס מחירי בשר</h2>
            <p className="text-gray-600">
              השוואת מחירים מתקדמת מ-{filteredData.length} סוגי בשר ב-{allRetailers.length} רשתות
            </p>
          </div>
          
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="focus-ring px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="all">כל הקטגוריות</option>
                {categories.map(categoryId => (
                  <option key={categoryId} value={categoryId}>
                    קטגוריה {categoryId.slice(0, 8)}...
                  </option>
                ))}
              </select>
            )}
            
            {/* Refresh Button */}
            <button
              onClick={refreshData}
              className="btn-secondary px-3 py-2 rounded-lg flex items-center space-x-2 rtl:space-x-reverse"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>רענן</span>
            </button>
          </div>
        </div>
      </div>

      {/* Price Matrix */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            {/* Table Header */}
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="sticky right-0 bg-gray-50 px-6 py-4 text-right text-sm font-semibold text-gray-900 border-l border-gray-200">
                  חתך בשר
                </th>
                {allRetailers.map(retailer => (
                  <th
                    key={retailer.id}
                    className="px-4 py-4 text-center text-sm font-semibold text-gray-900 min-w-[120px]"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{retailer.name}</div>
                      <div className="text-xs text-gray-500 capitalize">
                        {retailer.type === 'supermarket' ? 'סופרמרקט' : 
                         retailer.type === 'butcher' ? 'קצביה' : retailer.type}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-200">
              {filteredData.map(meatCut => (
                <tr key={meatCut.meat_cut_id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Meat Cut Name */}
                  <td className="sticky right-0 bg-white hover:bg-gray-50/50 px-6 py-4 border-l border-gray-200">
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900">
                        {meatCut.meat_cut_name}
                      </div>
                      {meatCut.meat_cut_name_en && (
                        <div className="text-xs text-gray-500">
                          {meatCut.meat_cut_name_en}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Price Cells */}
                  {allRetailers.map(retailer => {
                    const priceData = meatCut.retailer_data.find(
                      r => r.retailer_id === retailer.id
                    )

                    return (
                      <td key={retailer.id} className="px-4 py-4 text-center">
                        {priceData ? (
                          <div className="space-y-2">
                            {/* Price Display */}
                            <div className="space-y-1">
                              <div
                                className={`text-lg font-bold ${getPriceColor(
                                  priceData.price_per_kg,
                                  priceData.is_on_sale
                                )}`}
                              >
                                ₪{priceData.price_shekel.toFixed(2)}
                              </div>
                              
                              {/* Sale Price */}
                              {priceData.is_on_sale && priceData.sale_price_shekel && (
                                <div className="flex items-center justify-center space-x-1 rtl:space-x-reverse">
                                  <Tag className="w-3 h-3 text-purple-500" />
                                  <span className="text-sm font-semibold text-purple-600">
                                    ₪{priceData.sale_price_shekel.toFixed(2)}
                                  </span>
                                </div>
                              )}
                              
                              {/* Date */}
                              <div className="text-xs text-gray-500">
                                {new Date(priceData.purchase_date).toLocaleDateString('he-IL')}
                              </div>
                              
                              {/* Location */}
                              {priceData.store_location && (
                                <div className="text-xs text-gray-400 truncate max-w-20">
                                  {priceData.store_location}
                                </div>
                              )}
                            </div>

                            {/* Report Button */}
                            <AuthTrigger
                              onSuccess={() => handleReportPrice(meatCut.meat_cut_id, retailer.id)}
                              className="w-full px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors border border-blue-200"
                            >
                              דווח מחיר
                            </AuthTrigger>
                          </div>
                        ) : (
                          // No Price Data
                          <div className="space-y-2">
                            <div className="text-sm text-gray-400 py-2">
                              אין מחיר
                            </div>
                            <AuthTrigger
                              onSuccess={() => handleReportPrice(meatCut.meat_cut_id, retailer.id)}
                              className="w-full px-2 py-1 text-xs bg-green-50 text-green-600 hover:bg-green-100 rounded-md transition-colors border border-green-200 flex items-center justify-center space-x-1 rtl:space-x-reverse"
                            >
                              <Plus className="w-3 h-3" />
                              <span>דווח</span>
                            </AuthTrigger>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">מקרא צבעים</h3>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">מחיר זול (עד ₪30)</span>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600">מחיר בינוני (₪30-60)</span>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">מחיר יקר (מעל ₪60)</span>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-gray-600">מבצע</span>
          </div>
        </div>
      </div>
    </div>
  )
}