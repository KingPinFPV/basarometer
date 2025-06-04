'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2 } from 'lucide-react'
import { PriceCell } from '.'
import { useToast } from '@/components/ui/Toast'
import { calculatePriceColors, getSaleIndicator } from '@/utils/priceColorLogic'

interface MeatCut {
  id: string
  name_hebrew: string
  name_english: string
  category_id: string
  is_popular: boolean
}

interface Retailer {
  id: string
  name: string
  type: string
  is_active: boolean
}

interface PriceData {
  meat_cut_id: string
  retailer_id: string
  price_per_kg: number
  is_on_sale: boolean
  sale_price_per_kg?: number
  reported_at: string
  confidence_score: number
}

interface PriceMatrixProps {
  refreshKey?: number
  onReportPrice?: (meatCutId: string, retailerId: string) => void
}

export function PriceMatrix({ refreshKey, onReportPrice }: PriceMatrixProps) {
  const [meatCuts, setMeatCuts] = useState<MeatCut[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [priceData, setPriceData] = useState<PriceData[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClientComponentClient()
  const { error } = useToast()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch all data...
      const [meatCutsRes, retailersRes, pricesRes] = await Promise.all([
        supabase.from('meat_cuts').select('*').eq('is_active', true).order('display_order'),
        supabase.from('retailers').select('*').eq('is_active', true),
        supabase.from('price_reports').select('*').eq('is_active', true)
      ])

      if (meatCutsRes.data) setMeatCuts(meatCutsRes.data)
      if (retailersRes.data) setRetailers(retailersRes.data)
      if (pricesRes.data) setPriceData(pricesRes.data)
      
    } catch (err) {
      console.error('Error fetching data:', err)
      error('שגיאה בטעינת הנתונים', 'נסה לרענן את הדף')
    } finally {
      setLoading(false)
    }
  }, [supabase, error])

  useEffect(() => {
    fetchData()
  }, [fetchData, refreshKey])

  // Calculate colors
  const colorMap = calculatePriceColors(priceData)

  // Get price for specific cell
  const getPrice = (meatCutId: string, retailerId: string) => {
    return priceData.find(p => p.meat_cut_id === meatCutId && p.retailer_id === retailerId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin w-8 h-8" />
        <span className="mr-2">טוען נתונים...</span>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto" dir="rtl">
      <div className="min-w-full">
        <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-right font-semibold">מוצר</th>
              {retailers.map(retailer => (
                <th key={retailer.id} className="p-3 text-center font-semibold min-w-32">
                  {retailer.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meatCuts.map(cut => (
              <tr key={cut.id} className="border-t hover:bg-gray-50/50">
                <td className="p-3 font-medium bg-gray-50">
                  <div className="text-right">
                    <div className="font-semibold">{cut.name_hebrew}</div>
                    <div className="text-sm text-gray-500">{cut.name_english}</div>
                  </div>
                </td>
                {retailers.map(retailer => {
                  const price = getPrice(cut.id, retailer.id)
                  const colorKey = `${cut.id}-${retailer.id}`
                  const bgColor = colorMap.get(colorKey) || 'bg-gray-200'
                  
                  return (
                    <PriceCell
                      key={`${cut.id}-${retailer.id}`}
                      price={price}
                      backgroundColor={bgColor}
                      saleIndicator={price ? getSaleIndicator(price.is_on_sale) : ''}
                      meatCutId={cut.id}
                      retailerId={retailer.id}
                      onReport={onReportPrice}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}