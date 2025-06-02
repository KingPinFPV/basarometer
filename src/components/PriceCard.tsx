'use client'

import { useState, useEffect } from 'react'
import { PriceReportWithDetails } from '@/lib/database.types'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'

interface PriceCardProps {
  priceReport: PriceReportWithDetails
}

export default function PriceCard({ priceReport }: PriceCardProps) {
  const [flashClass, setFlashClass] = useState('')

  useEffect(() => {
    const timeDiff = Date.now() - new Date(priceReport.created_at).getTime()
    if (timeDiff < 5000) {
      setFlashClass('animate-pulse bg-green-100 border-green-300')
      const timer = setTimeout(() => setFlashClass(''), 2000)
      return () => clearTimeout(timer)
    }
  }, [priceReport.created_at])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 2
    }).format(price)
  }

  const getTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true, 
        locale: he 
      })
    } catch {
      return 'זמן לא ידוע'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md border-2 transition-all duration-500 ${flashClass || 'border-gray-200'}`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {priceReport.products?.name || 'מוצר לא ידוע'}
            </h3>
            {priceReport.products?.brand && (
              <p className="text-sm text-gray-600 mb-1">
                מותג: {priceReport.products.brand}
              </p>
            )}
            <p className="text-sm text-gray-600">
              {priceReport.products?.cuts?.name || 'חתיכה לא ידועה'} • {priceReport.products?.cuts?.category || 'קטגוריה לא ידועה'}
            </p>
          </div>
          {priceReport.products?.image_url && (
            <div className="w-16 h-16 bg-gray-200 rounded-lg ml-3 flex items-center justify-center">
              <span className="text-gray-500 text-xs">תמונה</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mb-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(priceReport.price)}
            </div>
            {priceReport.weight && (
              <div className="text-sm text-gray-500">
                {priceReport.weight}{priceReport.unit || 'ק״ג'}
              </div>
            )}
          </div>
          <div className="text-left">
            <div className="text-lg font-semibold text-gray-800">
              {priceReport.retailers?.name || 'חנות לא ידועה'}
            </div>
            <div className="text-sm text-gray-500">
              {priceReport.retailers?.type || 'סוג חנות לא ידוע'}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-2">
          <span>דווח {getTimeAgo(priceReport.created_at)}</span>
          {priceReport.notes && (
            <span className="truncate max-w-32" title={priceReport.notes}>
              💬 {priceReport.notes}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}