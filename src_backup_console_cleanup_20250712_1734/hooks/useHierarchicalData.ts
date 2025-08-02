import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { CategoryWithSubCategories, HierarchicalData } from '@/lib/database.types'

export function useHierarchicalData() {
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalData[]>([])
  const [categoriesWithSubCategories, setCategoriesWithSubCategories] = useState<CategoryWithSubCategories[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHierarchicalData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch hierarchical data for forms
      const { data: hierarchical, error: hierarchicalError } = await supabase
        .rpc('get_meat_cuts_hierarchical')

      if (hierarchicalError) throw hierarchicalError

      // Fetch categories with sub-categories for accordion
      const { data: categories, error: categoriesError } = await supabase
        .rpc('get_categories_with_subcategories')

      if (categoriesError) throw categoriesError

      setHierarchicalData(hierarchical || [])
      setCategoriesWithSubCategories(categories || [])

    } catch (err) {
      console.error('Error fetching hierarchical data:', err)
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים ההיררכיים')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHierarchicalData()
  }, [fetchHierarchicalData])

  return {
    hierarchicalData,
    categoriesWithSubCategories,
    loading,
    error,
    refetch: fetchHierarchicalData
  }
}