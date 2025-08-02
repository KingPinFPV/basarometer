import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { MeatCut, Retailer, PriceReport, CategoryWithSubCategories } from '@/lib/database.types'
import { Logger } from '@/lib/discovery/utils/Logger'

const logger = new Logger('usePriceMatrixData');

interface PriceMatrixData {
  categoriesWithSubCategories: CategoryWithSubCategories[]
  meatCuts: MeatCut[]
  retailers: Retailer[]
  priceReports: PriceReport[]
  priceMatrix: Record<string, Record<string, PriceReport | null>>
}

export function usePriceMatrixData() {
  const [data, setData] = useState<PriceMatrixData>({
    categoriesWithSubCategories: [],
    meatCuts: [],
    retailers: [],
    priceReports: [],
    priceMatrix: {}
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch hierarchical categories with sub-categories
      const { data: hierarchical, error: hierarchicalError } = await supabase
        .rpc('get_categories_with_subcategories')

      if (hierarchicalError) throw hierarchicalError

      // Fetch all meat cuts
      const { data: cuts, error: cutsError } = await supabase
        .from('meat_cuts')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      if (cutsError) throw cutsError

      // Fetch active retailers
      const { data: retailers, error: retailersError } = await supabase
        .from('retailers')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (retailersError) throw retailersError

      // Fetch active price reports
      const { data: reports, error: reportsError } = await supabase
        .from('price_reports')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (reportsError) throw reportsError

      // Build price matrix (meat_cut_id -> retailer_id -> price_report)
      const matrix: Record<string, Record<string, PriceReport | null>> = {}
      
      cuts.forEach(cut => {
        matrix[cut.id] = {}
        retailers.forEach(retailer => {
          // Find the most recent price report for this cut and retailer
          const report = reports.find(r => 
            r.meat_cut_id === cut.id && r.retailer_id === retailer.id
          )
          matrix[cut.id][retailer.id] = report || null
        })
      })

      setData({
        categoriesWithSubCategories: hierarchical || [],
        meatCuts: cuts || [],
        retailers: retailers || [],
        priceReports: reports || [],
        priceMatrix: matrix
      })

    } catch (err) {
      logger.error('Error fetching price matrix data:', err)
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת נתוני המטריצה')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    ...data,
    loading,
    error,
    refetch: fetchData
  }
}