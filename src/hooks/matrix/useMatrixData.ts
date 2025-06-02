'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { MatrixData, MatrixProduct, MatrixRetailer, PriceCell, CategoryData } from '@/types/matrix'
import { calculatePriceColors } from '@/lib/matrix/priceColors'

export function useMatrixData() {
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const fetchMatrixData = async () => {
    try {
      const supabase = createClient()
      setError(null)

      // Fetch all retailers
      const { data: retailers, error: retailersError } = await supabase
        .from('retailers')
        .select('id, name, type, logo_url')
        .order('name')

      if (retailersError) throw new Error(`Retailers fetch failed: ${retailersError.message}`)

      // Fetch products with cuts and price reports
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          brand,
          category,
          normalized_name,
          cuts (
            id,
            name,
            category
          ),
          price_reports (
            id,
            retailer_id,
            price,
            price_per_unit,
            original_price,
            is_promotion,
            confidence_score,
            created_at
          )
        `)
        .eq('is_active', true)
        .order('name')

      if (productsError) throw new Error(`Products fetch failed: ${productsError.message}`)

      // Transform data into matrix structure
      const matrixRetailers: MatrixRetailer[] = retailers?.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type || undefined,
        logo_url: r.logo_url || undefined
      })) || []

      // Group products by category
      const categoryGroups: { [key: string]: MatrixProduct[] } = {}
      
      products?.forEach(product => {
        // Handle cuts as either array or single object
        const cuts = Array.isArray(product.cuts) ? product.cuts[0] : product.cuts
        const category = cuts?.category || product.category || 'אחר'
        
        if (!categoryGroups[category]) {
          categoryGroups[category] = []
        }

        categoryGroups[category].push({
          id: product.id,
          name: product.name,
          brand: product.brand || undefined,
          category,
          cut_name: cuts?.name,
          normalized_name: product.normalized_name || undefined
        })
      })

      // Build price matrix for each category
      const categories: { [categoryName: string]: CategoryData } = {}
      
      Object.entries(categoryGroups).forEach(([categoryName, categoryProducts]) => {
        const priceMatrix: PriceCell[][] = []

        categoryProducts.forEach(product => {
          const productRow: PriceCell[] = []

          matrixRetailers.forEach(retailer => {
            // Find price reports for this product-retailer combination
            const productData = products?.find(p => p.id === product.id)
            const priceReports = productData?.price_reports?.filter(pr => pr.retailer_id === retailer.id) || []
            
            // Get latest price report
            const latestReport = priceReports.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]

            const cell: PriceCell = {
              productId: product.id,
              retailerId: retailer.id,
              price: latestReport?.price,
              pricePerUnit: latestReport?.price_per_unit,
              originalPrice: latestReport?.original_price,
              isPromotion: latestReport?.is_promotion || false,
              confidence: latestReport?.confidence_score || 0,
              lastReported: latestReport ? new Date(latestReport.created_at) : undefined,
              reportCount: priceReports.length,
              priceColor: 'gray',
              hasData: !!latestReport
            }

            productRow.push(cell)
          })

          priceMatrix.push(productRow)
        })

        // Calculate colors for each product row
        priceMatrix.forEach(row => {
          const prices = row.map(cell => cell.price)
          const promotions = row.map(cell => cell.isPromotion)
          const colors = calculatePriceColors(prices, promotions)
          
          row.forEach((cell, index) => {
            cell.priceColor = colors[index]
          })
        })

        categories[categoryName] = {
          name: categoryName,
          products: categoryProducts,
          priceMatrix,
          isExpanded: true
        }
      })

      const totalProducts = Object.values(categories).reduce((sum, cat) => sum + cat.products.length, 0)
      const totalPricePoints = Object.values(categories).reduce((sum, cat) => 
        sum + cat.priceMatrix.flat().filter(cell => cell.hasData).length, 0
      )

      const newMatrixData: MatrixData = {
        categories,
        retailers: matrixRetailers,
        totalProducts,
        totalPricePoints,
        lastUpdated: new Date()
      }

      setMatrixData(newMatrixData)
      setIsConnected(true)
      console.log(`✅ Matrix data loaded: ${totalProducts} products, ${matrixRetailers.length} retailers, ${totalPricePoints} price points`)

    } catch (err) {
      console.error('Matrix data fetch failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to load matrix data')
      setIsConnected(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatrixData()

    const supabase = createClient()

    // Set up real-time subscription for price reports
    const channel = supabase
      .channel('matrix-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_reports'
        },
        (payload) => {
          console.log('Matrix real-time update:', payload)
          // Refresh matrix data when prices change
          fetchMatrixData()
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { 
    matrixData, 
    loading, 
    error, 
    isConnected, 
    refetch: fetchMatrixData 
  }
}