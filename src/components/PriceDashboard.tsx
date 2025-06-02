'use client'

import { useLivePrices } from '@/hooks/useLivePrices'
import PriceCard from './PriceCard'
import LiveIndicator from './LiveIndicator'
import { RefreshCw, TrendingDown, TrendingUp, DollarSign } from 'lucide-react'

export default function PriceDashboard() {
  const { prices, loading, error, isConnected } = useLivePrices()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">טוען מחירים...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">שגיאה בטעינת המחירים: {error}</p>
      </div>
    )
  }

  const stats = {
    total: prices.length,
    avgPrice: prices.length > 0 ? prices.reduce((sum, p) => sum + p.price, 0) / prices.length : 0,
    recentCount: prices.filter(p => {
      const timeDiff = Date.now() - new Date(p.created_at).getTime()
      return timeDiff < 24 * 60 * 60 * 1000
    }).length
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            🔴 מחירי בשר בזמן אמת
          </h1>
          <LiveIndicator isConnected={isConnected} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-700">דיווחי מחיר</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <TrendingDown className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">
              ₪{stats.avgPrice.toFixed(2)}
            </div>
            <div className="text-sm text-green-700">מחיר ממוצע</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">{stats.recentCount}</div>
            <div className="text-sm text-orange-700">דיווחים ב-24 שעות</div>
          </div>
        </div>

        <p className="text-gray-600 text-center">
          מחירי בשר עדכניים מחנויות ברחבי הארץ • עדכונים חיים כל שנייה
        </p>
      </div>

      {prices.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">אין דיווחי מחיר זמינים כרגע</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prices.map((priceReport) => (
            <PriceCard 
              key={`${priceReport.id}-${priceReport.updated_at}`} 
              priceReport={priceReport} 
            />
          ))}
        </div>
      )}
    </div>
  )
}