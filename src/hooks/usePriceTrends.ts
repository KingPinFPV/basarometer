'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { MeatCut } from '@/lib/database.types'

export interface PriceHistoryEntry {
  id: string
  price_report_id: string
  old_price: number
  new_price: number
  changed_at: string
  change_type: 'increase' | 'decrease' | 'sale_start' | 'sale_end'
}

export interface TrendDataPoint {
  date: string
  price: number
  salePrice?: number
  retailer: string
  isOnSale: boolean
}

export interface PriceTrendAnalysis {
  meatCut: MeatCut
  timeRange: '7d' | '30d' | '90d' | '1y'
  data: TrendDataPoint[]
  avgPrice: number
  minPrice: number
  maxPrice: number
  priceChange: number // Percentage change over period
  volatility: number // Price volatility indicator
  trend: 'rising' | 'falling' | 'stable'
  lastUpdated: string
}

export function usePriceTrends() {
  const [trendsData, setTrendsData] = useState<PriceTrendAnalysis[]>([])
  const [selectedMeatCut, setSelectedMeatCut] = useState<string | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [availableCuts, setAvailableCuts] = useState<MeatCut[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch available meat cuts that have price data
  const fetchAvailableCuts = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('meat_cuts')
        .select(`
          *,
          price_reports!inner(id)
        `)
        .eq('is_active', true)
        .limit(20)

      if (fetchError) throw fetchError

      setAvailableCuts(data || [])
      
      // Auto-select first cut if none selected
      if (data && data.length > 0 && !selectedMeatCut) {
        setSelectedMeatCut(data[0].id)
      }
    } catch (err) {
      console.error('Failed to fetch available cuts:', err)
    }
  }

  // Calculate date range for filtering
  const getDateRange = (timeRange: string): Date => {
    const now = new Date()
    switch (timeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  // Fetch price trends for a specific meat cut
  const fetchPriceTrends = async (meatCutId: string, timeRange: '7d' | '30d' | '90d' | '1y') => {
    if (!meatCutId) return

    setLoading(true)
    setError(null)

    try {
      const fromDate = getDateRange(timeRange)

      // Get price reports for the meat cut within time range
      const { data: priceReports, error: reportsError } = await supabase
        .from('price_reports')
        .select(`
          *,
          retailer:retailers(*),
          meat_cut:meat_cuts(*)
        `)
        .eq('meat_cut_id', meatCutId)
        .eq('is_active', true)
        .gte('created_at', fromDate.toISOString())
        .order('created_at', { ascending: true })

      if (reportsError) throw reportsError

      if (!priceReports || priceReports.length === 0) {
        // No data for this time range - show empty state
        setTrendsData([{
          meatCut: availableCuts.find(cut => cut.id === meatCutId)!,
          timeRange,
          data: [],
          avgPrice: 0,
          minPrice: 0,
          maxPrice: 0,
          priceChange: 0,
          volatility: 0,
          trend: 'stable',
          lastUpdated: new Date().toISOString()
        }])
        return
      }

      // Convert to trend data points
      const trendData: TrendDataPoint[] = priceReports.map(report => ({
        date: report.created_at,
        price: report.price_per_kg / 100, // Convert to shekels
        salePrice: report.is_on_sale && report.sale_price_per_kg ? 
          report.sale_price_per_kg / 100 : undefined,
        retailer: report.retailer.name,
        isOnSale: report.is_on_sale
      }))

      // Calculate statistics
      const prices = trendData.map(d => d.price)
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      
      // Calculate price change (first vs last)
      const firstPrice = prices[0]
      const lastPrice = prices[prices.length - 1]
      const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100

      // Calculate volatility (standard deviation)
      const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length
      const volatility = Math.sqrt(variance) / avgPrice * 100

      // Determine trend
      let trend: 'rising' | 'falling' | 'stable' = 'stable'
      if (priceChange > 5) trend = 'rising'
      else if (priceChange < -5) trend = 'falling'

      const analysis: PriceTrendAnalysis = {
        meatCut: priceReports[0].meat_cut,
        timeRange,
        data: trendData,
        avgPrice,
        minPrice,
        maxPrice,
        priceChange,
        volatility,
        trend,
        lastUpdated: new Date().toISOString()
      }

      setTrendsData([analysis])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price trends')
    } finally {
      setLoading(false)
    }
  }

  // Track price changes (to be called when price reports are added/updated)
  const trackPriceChange = async (
    priceReportId: string,
    oldPrice: number,
    newPrice: number,
    changeType: 'increase' | 'decrease' | 'sale_start' | 'sale_end'
  ) => {
    try {
      const { error: insertError } = await supabase
        .from('price_history')
        .insert({
          price_report_id: priceReportId,
          old_price: oldPrice,
          new_price: newPrice,
          change_type: changeType,
          changed_at: new Date().toISOString()
        })

      if (insertError) throw insertError

      // Refresh trends if this cut is currently being viewed
      if (selectedMeatCut) {
        await fetchPriceTrends(selectedMeatCut, selectedTimeRange)
      }
    } catch (err) {
      console.error('Failed to track price change:', err)
    }
  }

  // Initialize data
  useEffect(() => {
    fetchAvailableCuts()
  }, []) // fetchAvailableCuts is stable, no need to include

  // Fetch trends when selection changes
  useEffect(() => {
    if (selectedMeatCut) {
      fetchPriceTrends(selectedMeatCut, selectedTimeRange)
    }
  }, [selectedMeatCut, selectedTimeRange]) // fetchPriceTrends is stable, no need to include

  return {
    // State
    trendsData,
    selectedMeatCut,
    selectedTimeRange,
    availableCuts,
    loading,
    error,

    // Actions
    setSelectedMeatCut,
    setSelectedTimeRange,
    fetchPriceTrends,
    trackPriceChange,
    fetchAvailableCuts,

    // Computed
    currentTrend: trendsData[0] || null,
    hasData: trendsData.length > 0 && trendsData[0].data.length > 0,
    timeRangeOptions: [
      { value: '7d', label: '7 ימים' },
      { value: '30d', label: '30 ימים' },
      { value: '90d', label: '3 חודשים' },
      { value: '1y', label: 'שנה' }
    ] as const
  }
}