'use client'

import React from 'react'
import { useCleanMatrix } from '@/hooks/useCleanMatrix'
import { formatPrice, getPriceColor, type MeatCategory, type Retailer, type PriceReport } from '@/types/market'

export default function CleanMatrix() {
  const { categories, retailers, priceReports, isLoading, error } = useCleanMatrix()

  if (isLoading) {
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
        <p className="text-sm text-gray-600 mt-2">
          יש צורך להחיל את הסכמה החדשה לבסיס הנתונים
        </p>
      </div>
    )
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">🗄️ בסיס נתונים חדש ונקי</h2>
        <p className="text-gray-600 mb-4">V3 מוכן לסכמה חדשה עם מבנה ישראלי</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-right">
          <h3 className="font-semibold text-blue-800 mb-2">שלבים להפעלת הסכמה החדשה:</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. פתח את Supabase Dashboard: https://supabase.com/dashboard/project/ergxrxtuncymyqslmoen</li>
            <li>2. עבור ל-SQL Editor</li>
            <li>3. הפעל את supabase_v3_schema.sql</li>
            <li>4. הפעל את supabase_v3_data.sql</li>
            <li>5. רענן את הדף</li>
          </ol>
        </div>
      </div>
    )
  }

  // Build price lookup map
  const priceMap = new Map()
  priceReports.forEach((report: PriceReport) => {
    const key = `${report.meat_cut_id}-${report.retailer_id}`
    priceMap.set(key, report)
  })

  const getPriceCell = (cutId: string, retailerId: string) => {
    const key = `${cutId}-${retailerId}`
    return priceMap.get(key)
  }

  return (
    <div className="space-y-6 rtl">
      {/* Header */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">🇮🇱 מטריקס מחירי בשר ישראלי</h1>
        <p className="text-sm text-gray-600">
          {categories.reduce((total, cat) => total + (cat.meat_cuts?.length || 0), 0)} חתכי בשר × {retailers.length} חנויות
        </p>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="p-3 text-right border-r border-gray-200 bg-white sticky right-0 z-20 min-w-[200px]">
                  <span className="font-bold text-gray-900">מוצר</span>
                </th>
                {retailers.map((retailer: Retailer) => (
                  <th key={retailer.id} className="p-3 text-center border border-gray-200 min-w-[120px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-semibold text-sm text-gray-900">{retailer.name}</span>
                      <span className="text-xs text-gray-500">{retailer.type}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {categories.map((category: MeatCategory) => (
                <React.Fragment key={category.id}>
                  {/* Category Header */}
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
                    <td colSpan={retailers.length + 1} className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-800">
                          {category.name_hebrew} ({category.meat_cuts?.length || 0} מוצרים)
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Product Rows */}
                  {category.meat_cuts?.map((cut) => (
                    <tr key={cut.id} className="hover:bg-gray-50">
                      {/* Product Name */}
                      <td className="p-3 border-r border-gray-200 bg-white sticky right-0 min-w-[200px]">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{cut.name_hebrew}</span>
                          {cut.name_english && (
                            <span className="text-sm text-gray-600">{cut.name_english}</span>
                          )}
                          {cut.is_popular && (
                            <span className="text-xs text-green-600">פופולרי</span>
                          )}
                        </div>
                      </td>

                      {/* Price Cells */}
                      {retailers.map((retailer: Retailer) => {
                        const priceData = getPriceCell(cut.id, retailer.id)
                        
                        if (!priceData) {
                          return (
                            <td key={retailer.id} className="p-2 text-center border border-gray-200 bg-gray-50">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-gray-400 text-xs">אין מחיר</span>
                                <button className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                                  דווח מחיר
                                </button>
                              </div>
                            </td>
                          )
                        }

                        const priceColor = getPriceColor(
                          priceData.price_per_kg,
                          cut.typical_price_range_min || 0,
                          cut.typical_price_range_max || 99999,
                          priceData.is_on_sale
                        )

                        const colorClasses: Record<string, string> = {
                          green: 'bg-green-100 text-green-800 border-green-200',
                          red: 'bg-red-100 text-red-800 border-red-200',
                          blue: 'bg-blue-100 text-blue-800 border-blue-200',
                          yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                          gray: 'bg-gray-100 text-gray-500 border-gray-200'
                        }

                        return (
                          <td key={retailer.id} className={`p-2 text-center border border-gray-200 ${colorClasses[priceColor] || colorClasses.gray}`}>
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-semibold">
                                {formatPrice(priceData.price_per_kg)}
                              </span>
                              {priceData.is_on_sale && (
                                <span className="text-xs text-blue-600">במבצע!</span>
                              )}
                              <div className="flex gap-1">
                                <button className="text-xs px-1 py-0.5 bg-green-500 text-white rounded hover:bg-green-600">
                                  עדכן
                                </button>
                              </div>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">מקרא צבעים</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span>מחיר זול</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span>מחיר ממוצע</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span>מחיר יקר</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span>במבצע</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
            <span>אין מחיר</span>
          </div>
        </div>
      </div>
    </div>
  )
}