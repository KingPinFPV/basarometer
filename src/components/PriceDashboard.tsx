'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import PriceCard from './PriceCard'
import LiveIndicator from './LiveIndicator'

interface PriceReport {
  id: number
  price: number
  normalized_price?: number
  unit: string
  quantity: number
  is_on_sale?: boolean
  sale_price?: number
  reported_at: string
  product: {
    name: string
    cut_name?: string
    subtype_name?: string
  }
  retailer: {
    name: string
    location?: string
  }
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="mr-3 text-gray-600">טוען מחירים...</span>
    </div>
  )
}

export default function PriceDashboard() {
  const [prices, setPrices] = useState<PriceReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  const fetchPrices = async () => {
    try {
      setError(null)
      
      // First, get price reports
      const { data: priceData, error: priceError } = await supabase
        .from('price_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (priceError) {
        console.error('Supabase error:', priceError)
        throw new Error(priceError.message)
      }

      if (!priceData || priceData.length === 0) {
        setPrices([])
        setIsLive(true)
        return
      }

      // Get unique product and retailer IDs
      const productIds = [...new Set(priceData.map(p => p.product_id))]
      const retailerIds = [...new Set(priceData.map(p => p.retailer_id))]

      // Fetch products and retailers
      const [productsResult, retailersResult] = await Promise.all([
        supabase.from('products').select('*').in('id', productIds),
        supabase.from('retailers').select('*').in('id', retailerIds)
      ])

      const products = productsResult.data || []
      const retailers = retailersResult.data || []

      // Create lookup maps
      const productMap = new Map(products.map(p => [p.id, p]))
      const retailerMap = new Map(retailers.map(r => [r.id, r]))

      const formattedPrices: PriceReport[] = priceData.map(item => {
        const product = productMap.get(item.product_id)
        const retailer = retailerMap.get(item.retailer_id)
        
        return {
          id: item.id,
          price: item.price,
          normalized_price: item.price_per_unit || item.price,
          unit: 'kg',
          quantity: item.unit_size || 1,
          is_on_sale: item.is_promotion,
          sale_price: item.original_price && item.is_promotion ? item.price : undefined,
          reported_at: item.created_at,
          product: {
            name: product?.name || 'מוצר לא ידוע',
            cut_name: product?.category
          },
          retailer: {
            name: retailer?.name || 'חנות לא ידועה',
            location: item.location || retailer?.type
          }
        }
      })

      setPrices(formattedPrices)
      setIsLive(true)
      console.log(`✅ Loaded ${formattedPrices.length} price reports`)
      
    } catch (err) {
      console.error('Failed to fetch prices:', err)
      setError(err instanceof Error ? err.message : 'Failed to load prices')
      setIsLive(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrices()

    // Set up real-time subscription
    const subscription = supabase
      .channel('price_reports_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'price_reports' 
        }, 
        (payload) => {
          console.log('Real-time update:', payload)
          // Refresh data on any change
          fetchPrices()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <h2 className="text-red-800 font-semibold mb-2">שגיאה בטעינת המחירים</h2>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button 
          onClick={fetchPrices}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          נסה שוב
        </button>
      </div>
    )
  }

  if (prices.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">אין דיווחי מחירים זמינים כרגע</p>
        <button 
          onClick={fetchPrices}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          רענן
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-3">
          <LiveIndicator isLive={isLive} />
          <div>
            <h2 className="font-semibold text-gray-900">מחירים בזמן אמת</h2>
            <p className="text-sm text-gray-600">
              {prices.length} דיווחים זמינים
            </p>
          </div>
        </div>
        <button 
          onClick={fetchPrices}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          רענן
        </button>
      </div>

      {/* Price Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prices.map((priceReport) => (
          <PriceCard
            key={priceReport.id}
            id={priceReport.id}
            price={priceReport.price}
            normalizedPrice={priceReport.normalized_price}
            unit={priceReport.unit}
            quantity={priceReport.quantity}
            isOnSale={priceReport.is_on_sale}
            salePrice={priceReport.sale_price}
            product={priceReport.product}
            retailer={priceReport.retailer}
            reportedAt={priceReport.reported_at}
          />
        ))}
      </div>
    </div>
  )
}