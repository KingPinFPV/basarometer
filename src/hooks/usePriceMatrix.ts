'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface PriceMatrixItem {
  meat_cut_id: string
  meat_cut_name: string
  meat_cut_name_en: string
  category_id: string
  retailer_data: Array<{
    retailer_id: string
    retailer_name: string
    retailer_type: string
    price_per_kg: number
    price_shekel: number
    sale_price_per_kg?: number
    sale_price_shekel?: number
    is_on_sale: boolean
    purchase_date: string
    created_at: string
    store_location?: string
  }>
}

export interface MeatCut {
  id: string
  name_hebrew: string
  name_english: string
  category_id: string
  display_order: number
}

export interface Retailer {
  id: string
  name: string
  type: string
  is_chain: boolean
}

export function usePriceMatrix() {
  const [matrixData, setMatrixData] = useState<PriceMatrixItem[]>([])
  const [meatCuts, setMeatCuts] = useState<MeatCut[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  const loadPriceMatrix = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: matrixError } = await supabase.rpc('get_price_matrix')
      
      if (matrixError) {
        // Handle specific RPC function errors
        if (matrixError.code === 'PGRST202' || matrixError.message?.includes('does not exist')) {
          console.warn('get_price_matrix RPC function not found, using fallback')
          setMatrixData([])
          return
        }
        if (matrixError.message?.includes('400') || matrixError.message?.includes('unauthorized')) {
          console.warn('Price matrix access denied')
          setMatrixData([])
          return
        }
        throw new Error(`שגיאה בטעינת מטריקס המחירים: ${matrixError.message}`)
      }

      setMatrixData(data || [])
    } catch (err) {
      console.error('Error loading price matrix:', err)
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת נתונים')
      setMatrixData([]) // Set empty data on error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadMeatCuts = useCallback(async () => {
    try {
      const { data, error: cutsError } = await supabase.rpc('get_meat_cuts')
      
      if (cutsError) {
        if (cutsError.code === 'PGRST202' || cutsError.message?.includes('does not exist')) {
          console.warn('get_meat_cuts RPC function not found, using fallback')
          setMeatCuts([])
          return
        }
        throw new Error(`שגיאה בטעינת רשימת חתכי בשר: ${cutsError.message}`)
      }

      setMeatCuts(data || [])
    } catch (err) {
      console.error('Error loading meat cuts:', err)
      setMeatCuts([])
    }
  }, [])

  const loadRetailers = useCallback(async () => {
    try {
      const { data, error: retailersError } = await supabase.rpc('get_retailers')
      
      if (retailersError) {
        if (retailersError.code === 'PGRST202' || retailersError.message?.includes('does not exist')) {
          console.warn('get_retailers RPC function not found, using fallback')
          setRetailers([])
          return
        }
        throw new Error(`שגיאה בטעינת רשימת רשתות: ${retailersError.message}`)
      }

      setRetailers(data || [])
    } catch (err) {
      console.error('Error loading retailers:', err)
      setRetailers([])
    }
  }, [])

  const refreshData = useCallback(async () => {
    await Promise.all([
      loadPriceMatrix(),
      loadMeatCuts(),
      loadRetailers()
    ])
  }, [loadPriceMatrix, loadMeatCuts, loadRetailers])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  // Helper function to get price color based on value
  const getPriceColor = useCallback((priceKg: number, isOnSale: boolean) => {
    if (isOnSale) return 'price-sale'
    if (priceKg <= 3000) return 'price-low'    // Up to 30 NIS/kg
    if (priceKg <= 6000) return 'price-medium' // 30-60 NIS/kg
    return 'price-high'                         // Above 60 NIS/kg
  }, [])

  // Helper function to get all unique retailers from matrix data
  const getAllRetailers = useCallback(() => {
    const retailerMap = new Map<string, { id: string; name: string; type: string }>()
    
    matrixData.forEach(item => {
      item.retailer_data.forEach(retailer => {
        if (!retailerMap.has(retailer.retailer_id)) {
          retailerMap.set(retailer.retailer_id, {
            id: retailer.retailer_id,
            name: retailer.retailer_name,
            type: retailer.retailer_type
          })
        }
      })
    })
    
    return Array.from(retailerMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'he'))
  }, [matrixData])

  return {
    matrixData,
    meatCuts,
    retailers,
    isLoading,
    error,
    refreshData,
    getPriceColor,
    getAllRetailers
  }
}