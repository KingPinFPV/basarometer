'use client'

import { usePriceData } from '@/hooks/usePriceData'

export default function PriceMatrix() {
  const { priceReports, meatCuts, retailers, loading, error, refetch } = usePriceData()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-2 text-gray-600">טוען נתונים...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-800 font-medium">שגיאה בטעינת נתונים</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <button 
            onClick={refetch}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            נסה שוב
          </button>
        </div>
      </div>
    )
  }

  if (!priceReports.length && !meatCuts.length && !retailers.length) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-500 text-lg">📭 אין נתונים להצגה</div>
        <button 
          onClick={refetch}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          רענן נתונים
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 m-4">
      {/* Header with stats */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">מטריצת מחירי בשר</h2>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>📊 {priceReports.length} דיווחי מחיר</span>
          <span>🥩 {meatCuts.length} מוצרי בשר</span>
          <span>🏪 {retailers.length} קמעונאים</span>
        </div>
      </div>

      {/* Quick data preview for debugging */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">דיווחי מחיר אחרונים</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded">
            <thead className="bg-gray-50">
              <tr>
                <th className="border-b px-4 py-2 text-right">מוצר</th>
                <th className="border-b px-4 py-2 text-right">קמעונאי</th>
                <th className="border-b px-4 py-2 text-right">מחיר לקילו</th>
                <th className="border-b px-4 py-2 text-right">תאריך</th>
                <th className="border-b px-4 py-2 text-right">מיקום</th>
              </tr>
            </thead>
            <tbody>
              {priceReports.slice(0, 10).map((report) => {
                const meatCut = meatCuts.find(cut => cut.id === report.meat_cut_id)
                const retailer = retailers.find(r => r.id === report.retailer_id)
                
                return (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="border-b px-4 py-2">
                      {meatCut?.name_hebrew || 'לא ידוע'}
                    </td>
                    <td className="border-b px-4 py-2">
                      {retailer?.name || 'לא ידוע'}
                    </td>
                    <td className="border-b px-4 py-2 font-medium">
                      ₪{(report.price_per_kg / 100).toFixed(2)}
                      {report.is_on_sale && (
                        <span className="text-red-600 text-xs mr-1">🔥</span>
                      )}
                    </td>
                    <td className="border-b px-4 py-2 text-sm text-gray-600">
                      {new Date(report.purchase_date).toLocaleDateString('he-IL')}
                    </td>
                    <td className="border-b px-4 py-2 text-sm text-gray-600">
                      {report.location || '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Debug info */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-500">🔍 מידע טכני לדיבוג</summary>
        <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
          <div>Last price report: {priceReports[0]?.created_at}</div>
          <div>Total data points: {priceReports.length + meatCuts.length + retailers.length}</div>
          <div>Supabase connection: ✅ Working</div>
        </div>
      </details>
    </div>
  )
}