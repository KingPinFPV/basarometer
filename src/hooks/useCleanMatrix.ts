'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { MeatCategory, Retailer, PriceReport } from '@/types/market'

export function useCleanMatrix() {
  const [categories, setCategories] = useState<MeatCategory[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [priceReports, setPriceReports] = useState<PriceReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchCleanData() {
      try {
        setIsLoading(true)
        
        // Fetch categories with cuts
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('meat_categories')
          .select(`
            *,
            meat_cuts(*)
          `)
          .eq('is_active', true)
          .order('display_order')

        if (categoriesError) throw categoriesError

        // Fetch retailers
        const { data: retailersData, error: retailersError } = await supabase
          .from('retailers')
          .select('*')
          .eq('is_active', true)
          .order('name')

        if (retailersError) throw retailersError

        // Fetch active price reports
        const { data: pricesData, error: pricesError } = await supabase
          .from('price_reports')
          .select('*')
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())

        if (pricesError) throw pricesError

        setCategories(categoriesData)
        setRetailers(retailersData)
        setPriceReports(pricesData)
        setError(null)
      } catch (err) {
        console.error('Clean matrix fetch failed:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCleanData()
  }, [supabase])

  return { categories, retailers, priceReports, isLoading, error }
}