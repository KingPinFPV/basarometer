'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { calculatePriceColors, getSaleIndicator, getCellBackgroundColor, formatPriceDisplay } from '@/utils/priceColorLogic'
import { AuthTrigger } from '@/components/auth/AuthGuard'
import { RefreshCw, Plus, Tag, TrendingUp, AlertCircle } from 'lucide-react'
import { PriceLegend } from '@/components/PriceLegend'
import { PriceReport } from '@/types/market'

interface PriceMatrixProps {
  onReportPrice: (meatCutId: string, retailerId: string) => void
}

interface MeatCut {
  id: string
  name_hebrew: string
  category_id: string
}

interface Retailer {
  id: string
  name: string
}

interface PriceData {
  meat_cut_id: string
  retailer_id: string
  price_per_kg: number
  is_on_sale: boolean
  sale_price_per_kg: number | null
}

export function PriceMatrix({ onReportPrice }: PriceMatrixProps) {
  const [meatCuts, setMeatCuts] = useState<MeatCut[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [priceData, setPriceData] = useState<PriceData[]>([])
  const [colorMap, setColorMap] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)

  const supabase = createClientComponentClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    
    // Fetch meat cuts
    const { data: meatCutsData } = await supabase
      .from('meat_cuts')
      .select('id, name_hebrew, category_id')
      .eq('is_active', true)
      .order('display_order')
    
    // Fetch retailers
    const { data: retailersData } = await supabase
      .from('retailers')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
    
    // Fetch latest prices
    const { data: pricesData } = await supabase
      .from('latest_prices_view')
      .select('meat_cut_id, retailer_id, price_per_kg, is_on_sale, sale_price_per_kg')
    
    if (meatCutsData && retailersData && pricesData) {
      setMeatCuts(meatCutsData)
      setRetailers(retailersData)
      setPriceData(pricesData)
      
      // Calculate colors
      const colors = calculatePriceColors(pricesData)
      setColorMap(colors)
    }
    
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getPriceForCell = (meatCutId: string, retailerId: string) => {
    return priceData.find(
      p => p.meat_cut_id === meatCutId && p.retailer_id === retailerId
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">מטריקס מחירי בשר</h2>
            <p className="text-gray-600">
              השוואת מחירים מתקדמת מ-{meatCuts.length} סוגי בשר ב-{retailers.length} רשתות
            </p>
          </div>
          
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {/* Refresh Button */}
            <button
              onClick={fetchData}
              className="btn-secondary px-3 py-2 rounded-lg flex items-center space-x-2 rtl:space-x-reverse"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
                {retailers.map(retailer => (
                  <th
                    key={retailer.id}
                    className="px-4 py-4 text-center text-sm font-semibold text-gray-900 min-w-[120px]"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{retailer.name}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-200">
              {meatCuts.map(meatCut => (
                <tr key={meatCut.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* Meat Cut Name */}
                  <td className="sticky right-0 bg-white hover:bg-gray-50/50 px-6 py-4 border-l border-gray-200">
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-900">
                        {meatCut.name_hebrew}
                      </div>
                    </div>
                  </td>

                  {/* Price Cells */}
                  {retailers.map(retailer => {
                    const price = getPriceForCell(meatCut.id, retailer.id)
                    const cellKey = `${meatCut.id}-${retailer.id}`
                    const bgColor = getCellBackgroundColor(colorMap, cellKey)

                    return (
                      <td key={retailer.id} className={`px-4 py-4 text-center ${bgColor}`}>
                        {price ? (
                          <div className="space-y-2">
                            {/* Price Display */}
                            <div className="space-y-1">
                              <div className={`text-lg font-bold ${bgColor} rounded-md px-2 py-1`}>
                                {formatPriceDisplay(price.price_per_kg, price.is_on_sale, price.sale_price_per_kg)}
                                {getSaleIndicator(price.is_on_sale)}
                              </div>
                            </div>

                            {/* Report Button */}
                            <AuthTrigger
                              onSuccess={() => onReportPrice(meatCut.id, retailer.id)}
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
                              onSuccess={() => onReportPrice(meatCut.id, retailer.id)}
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

      {/* Price Legend */}
      <PriceLegend />
    </div>
  )
}