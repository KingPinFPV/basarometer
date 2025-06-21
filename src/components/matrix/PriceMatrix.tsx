'use client'

import React, { useMemo, useCallback } from 'react'
import { usePriceData } from '@/hooks/usePriceData'

interface PriceCell {
  price: number | null
  isOnSale: boolean
  reportId: string | null
  lastUpdated: string | null
  confidence: number
}

const ColorfulPriceMatrix = React.memo(function ColorfulPriceMatrix() {
  const { priceReports, meatCuts, retailers, loading, error } = usePriceData()

  // יצירת מטריצה עם צבעים - optimized calculation
  const matrix = useMemo(() => {
    if (!priceReports.length || !meatCuts.length || !retailers.length) {
      return { grid: {}, allPrices: [], minPrice: 0, maxPrice: 0 }
    }

    const grid: Record<string, Record<string, PriceCell>> = {}
    const allPrices: number[] = []

    // בניית הגריד
    meatCuts.forEach(cut => {
      grid[cut.id] = {}
      retailers.forEach(retailer => {
        const report = priceReports.find(r => 
          r.meat_cut_id === cut.id && r.retailer_id === retailer.id
        )
        
        const price = report?.price_per_kg || null
        if (price) allPrices.push(price)
        
        grid[cut.id][retailer.id] = {
          price,
          isOnSale: report?.is_on_sale || false,
          reportId: report?.id || null,
          lastUpdated: report?.created_at || null,
          confidence: report?.confidence_score || 0
        }
      })
    })

    const minPrice = Math.min(...allPrices)
    const maxPrice = Math.max(...allPrices)

    return { grid, allPrices, minPrice, maxPrice }
  }, [priceReports, meatCuts, retailers])

  // Memoized color functions for better performance
  const getPriceColor = useCallback((price: number | null): string => {
    if (!price || matrix.allPrices.length === 0) return 'bg-gray-50'
    
    const { minPrice, maxPrice } = matrix
    const range = maxPrice - minPrice
    const normalized = (price - minPrice) / range

    if (normalized <= 0.33) return 'bg-green-100 border-green-200' // זול
    if (normalized <= 0.66) return 'bg-yellow-100 border-yellow-200' // בינוני  
    return 'bg-red-100 border-red-200' // יקר
  }, [matrix])

  const getTextColor = useCallback((price: number | null): string => {
    if (!price || matrix.allPrices.length === 0) return 'text-gray-400'
    
    const { minPrice, maxPrice } = matrix
    const range = maxPrice - minPrice
    const normalized = (price - minPrice) / range

    if (normalized <= 0.33) return 'text-green-800'
    if (normalized <= 0.66) return 'text-yellow-800'
    return 'text-red-800'
  }, [matrix])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="mr-4 text-gray-600 text-lg">טוען מטריצת מחירים...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
        <div className="text-red-800 font-medium text-lg">שגיאה בטעינת נתונים</div>
        <p className="text-red-600 mt-2">{error}</p>
      </div>
    )
  }

  if (!matrix.allPrices.length) {
    return (
      <div className="text-center p-12">
        <div className="text-gray-500 text-xl">📭 אין נתונים להצגה</div>
        <p className="text-gray-400 mt-2">היו ראשונים לדווח על מחירים!</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* כותרת עם סטטיסטיקות */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          בשרומטר V3 - פלטפורמת הקהילה
        </h1>
        <p className="text-gray-600 mb-4">
          השוואת מחירי בשר מתקדמת עם דיווחי קהילתיים ונכחיים
        </p>
        
        {/* מקרא צבעים */}
        <div className="flex justify-center items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-sm text-gray-600">הכי זול</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span className="text-sm text-gray-600">מחיר בינוני</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span className="text-sm text-gray-600">הכי יקר</span>
          </div>
        </div>
      </div>

      {/* סטטיסטיקות */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            מטריקס מחירי בשר ישראלי
          </div>
          <div className="flex justify-center gap-8 text-sm text-gray-600">
            <span>📊 {priceReports.length} דיווחי מחיר</span>
            <span>🥩 {meatCuts.length} מוצרי בשר</span>
            <span>🏪 {retailers.length} קמעונאים</span>
          </div>
        </div>
      </div>

      {/* הגריד */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-0">
          {/* כותרת ריקה */}
          <div className="bg-gray-100 p-4 border-b border-r border-gray-200">
            <div className="font-bold text-gray-700 text-right">מוצר</div>
          </div>
          
          {/* כותרות קמעונאים */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-0">
            {retailers.map((retailer) => (
              <div 
                key={retailer.id}
                className="bg-gray-100 p-3 border-b border-gray-200 text-center min-h-[80px] flex flex-col justify-center"
              >
                <div className="font-semibold text-gray-700 text-sm mb-1">
                  {retailer.name}
                </div>
                <div className="text-xs text-gray-500">
                  {retailer.type || 'supermarket'}
                </div>
              </div>
            ))}
          </div>

          {/* שורות המוצרים */}
          {meatCuts.map((cut) => (
            <div key={cut.id} className="contents">
              {/* שם המוצר */}
              <div className="bg-gray-50 p-4 border-b border-r border-gray-200 flex flex-col justify-center">
                <div className="font-bold text-gray-800 text-right">
                  {cut.name_hebrew}
                </div>
                <div className="text-sm text-gray-500 text-right">
                  {cut.name_english}
                </div>
                <div className="text-xs text-gray-400 text-right mt-1">
                  מחירים
                </div>
              </div>
              
              {/* תאי מחירים */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-0">
                {retailers.map((retailer) => {
                  const cell = matrix.grid[cut.id]?.[retailer.id]
                  const price = cell?.price
                  const priceInShekels = price ? (price / 100).toFixed(2) : null
                  
                  return (
                    <div
                      key={`${cut.id}-${retailer.id}`}
                      className={`
                        ${getPriceColor(price)} 
                        border-b border-gray-200 p-3 text-center min-h-[100px] 
                        flex flex-col justify-center transition-all hover:shadow-md
                      `}
                    >
                      {priceInShekels ? (
                        <>
                          <div className={`text-lg font-bold ${getTextColor(price)}`}>
                            ₪{priceInShekels}
                          </div>
                          {cell?.isOnSale && (
                            <div className="text-xs text-red-600 font-medium">
                              🔥 מבצע
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            עדכן
                          </div>
                          {cell?.lastUpdated && (
                            <div className="text-xs text-gray-400">
                              {new Date(cell.lastUpdated).toLocaleDateString('he-IL')}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="text-gray-400 text-sm">אין מידע</div>
                          <button className="text-xs bg-blue-500 text-white px-2 py-1 rounded mt-2 hover:bg-blue-600">
                            דווח מחיר
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* מידע נוסף */}
      <div className="mt-6 text-center text-sm text-gray-500">
        עדכון אחרון: {new Date().toLocaleString('he-IL')} | 
        נתונים מקהילת בשרומטר V3 ❤️
      </div>
    </div>
  )
})

export { ColorfulPriceMatrix }
export default ColorfulPriceMatrix