// hooks/usePriceData.ts - Safe data loading without auth dependency

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type MeatCut = Database['public']['Tables']['meat_cuts']['Row']
type Retailer = Database['public']['Tables']['retailers']['Row']
type PriceReport = Database['public']['Tables']['price_reports']['Row']

export function usePriceData() {
  const [priceReports, setPriceReports] = useState<PriceReport[]>([])
  const [meatCuts, setMeatCuts] = useState<MeatCut[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  }, [])

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