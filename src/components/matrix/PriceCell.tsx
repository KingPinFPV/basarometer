import React from 'react'
import { AuthTrigger } from '@/components/auth/AuthGuard'
import { Plus } from 'lucide-react'

interface PriceCellProps {
  price?: {
    price_per_kg: number
    is_on_sale: boolean
    sale_price_per_kg?: number
  }
  backgroundColor: string
  saleIndicator: string
  meatCutId: string
  retailerId: string
  onReport?: (meatCutId: string, retailerId: string) => void
}

export function PriceCell({ 
  price, 
  backgroundColor, 
  saleIndicator,
  meatCutId,
  retailerId,
  onReport
}: PriceCellProps) {
  const formatPrice = (price: number) => {
    return `₪${price.toFixed(2)}`
  }

  const handleReport = () => {
    if (onReport) {
      onReport(meatCutId, retailerId)
    }
  }

  return (
    <td className={`p-3 text-center ${backgroundColor}`}>
      {price ? (
        <div className="space-y-2">
          <div className={`text-lg font-bold rounded-md px-2 py-1 ${backgroundColor}`}>
            {price.is_on_sale && price.sale_price_per_kg ? (
              <>
                {formatPrice(price.sale_price_per_kg)}
                <span className="text-sm text-gray-500 ml-1">
                  ({formatPrice(price.price_per_kg)})
                </span>
              </>
            ) : (
              formatPrice(price.price_per_kg)
            )}
            {saleIndicator}
          </div>
          <AuthTrigger
            onSuccess={handleReport}
            className="w-full px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors border border-blue-200"
          >
            דווח מחיר
          </AuthTrigger>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm text-gray-400 py-2">
            אין מחיר
          </div>
          <AuthTrigger
            onSuccess={handleReport}
            className="w-full px-2 py-1 text-xs bg-green-50 text-green-600 hover:bg-green-100 rounded-md transition-colors border border-green-200 flex items-center justify-center space-x-1 rtl:space-x-reverse"
          >
            <Plus className="w-3 h-3" />
            <span>דווח</span>
          </AuthTrigger>
        </div>
      )}
    </td>
  )
} 