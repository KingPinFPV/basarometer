// hooks/usePriceData.ts - Safe data loading without auth dependency

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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

interface PriceReport {
  id: string
  meat_cut_id: string
  retailer_id: string
  price_per_kg: number
  is_on_sale: boolean
  sale_price_per_kg?: number
  purchase_date: string
  location?: string
  created_at: string
}

export function usePriceData() {
  const [priceReports, setPriceReports] = useState<PriceReport[]>([])
  const [meatCuts, setMeatCuts] = useState<MeatCut[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [meatCutsRes, retailersRes, priceReportsRes] = await Promise.all([
        supabase
          .from('meat_cuts')
          .select('*')
          .eq('is_active', true)
          .order('display_order'),
        supabase
          .from('retailers')
          .select('*')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('price_reports')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
      ])

      if (meatCutsRes.error) throw new Error(meatCutsRes.error.message)
      if (retailersRes.error) throw new Error(retailersRes.error.message)
      if (priceReportsRes.error) throw new Error(priceReportsRes.error.message)

      setMeatCuts(meatCutsRes.data || [])
      setRetailers(retailersRes.data || [])
      setPriceReports(priceReportsRes.data || [])

    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    priceReports,
    meatCuts,
    retailers,
    loading,
    error,
    refetch: fetchData
  }
}