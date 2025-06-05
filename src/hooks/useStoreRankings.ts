'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Retailer, PriceReport, MeatCategory } from '@/lib/database.types'

export interface StoreRanking {
  retailer: Retailer
  avgPrice: number
  reportCount: number
  avgRating?: number
  rank: number
  categoryBreakdown: {
    [categoryId: string]: {
      categoryName: string
      avgPrice: number
      reportCount: number
      rank: number
    }
  }
  priceAdvantage: number // Percentage better/worse than average
  confidenceScore: number // Based on report count
}

export interface UserRanking {
  user_id: string
  display_name: string
  reputation_score: number
  total_reports: number
  verified_reports: number
  avatar_url?: string
  rank: number
  badge: 'contributor' | 'expert' | 'trusted' | 'beginner'
}

export function useStoreRankings() {
  const [storeRankings, setStoreRankings] = useState<StoreRanking[]>([])
  const [userRankings, setUserRankings] = useState<UserRanking[]>([])
  const [categories, setCategories] = useState<MeatCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch categories for filtering
  const fetchCategories = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('meat_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      if (fetchError) throw fetchError
      setCategories(data || [])
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  // Calculate store rankings
  const calculateStoreRankings = async (categoryId?: string) => {
    setLoading(true)
    setError(null)

    try {
      // Build query for price reports
      let query = supabase
        .from('price_reports')
        .select(`
          *,
          retailer:retailers(*),
          meat_cut:meat_cuts(
            *,
            category:meat_categories(*)
          )
        `)
        .eq('is_active', true)

      // Filter by category if specified
      if (categoryId) {
        query = query.eq('meat_cut.category_id', categoryId)
      }

      const { data: priceReports, error: reportsError } = await query

      if (reportsError) throw reportsError

      // Group by retailer
      const retailerData = new Map<string, {
        retailer: Retailer
        reports: PriceReport[]
        categoryData: Map<string, { reports: PriceReport[], categoryName: string }>
      }>()

      priceReports.forEach(report => {
        const retailerId = report.retailer.id
        const categoryId = report.meat_cut.category.id
        const categoryName = report.meat_cut.category.name_hebrew

        if (!retailerData.has(retailerId)) {
          retailerData.set(retailerId, {
            retailer: report.retailer,
            reports: [],
            categoryData: new Map()
          })
        }

        const data = retailerData.get(retailerId)!
        data.reports.push(report)

        if (!data.categoryData.has(categoryId)) {
          data.categoryData.set(categoryId, {
            reports: [],
            categoryName
          })
        }

        data.categoryData.get(categoryId)!.reports.push(report)
      })

      // Calculate rankings
      const rankings: StoreRanking[] = Array.from(retailerData.values())
        .map(data => {
          // Calculate average price (considering sale prices)
          const effectivePrices = data.reports.map(report => 
            report.is_on_sale && report.sale_price_per_kg 
              ? report.sale_price_per_kg 
              : report.price_per_kg
          )

          const avgPrice = effectivePrices.reduce((sum, price) => sum + price, 0) / effectivePrices.length

          // Calculate category breakdown
          const categoryBreakdown: StoreRanking['categoryBreakdown'] = {}
          data.categoryData.forEach((catData, catId) => {
            const catPrices = catData.reports.map(report =>
              report.is_on_sale && report.sale_price_per_kg 
                ? report.sale_price_per_kg 
                : report.price_per_kg
            )
            const catAvgPrice = catPrices.reduce((sum, price) => sum + price, 0) / catPrices.length

            categoryBreakdown[catId] = {
              categoryName: catData.categoryName,
              avgPrice: catAvgPrice / 100, // Convert to shekels
              reportCount: catData.reports.length,
              rank: 0 // Will be calculated below
            }
          })

          // Calculate confidence score based on report count
          const confidenceScore = Math.min(5, Math.floor(data.reports.length / 5))

          return {
            retailer: data.retailer,
            avgPrice: avgPrice / 100, // Convert to shekels
            reportCount: data.reports.length,
            rank: 0, // Will be calculated below
            categoryBreakdown,
            priceAdvantage: 0, // Will be calculated below
            confidenceScore
          }
        })
        .filter(ranking => ranking.reportCount > 0) // Only include stores with data

      // Sort by average price (lowest first) and assign ranks
      rankings.sort((a, b) => a.avgPrice - b.avgPrice)
      rankings.forEach((ranking, index) => {
        ranking.rank = index + 1
      })

      // Calculate price advantage relative to market average
      if (rankings.length > 0) {
        const marketAverage = rankings.reduce((sum, r) => sum + r.avgPrice, 0) / rankings.length
        rankings.forEach(ranking => {
          ranking.priceAdvantage = ((marketAverage - ranking.avgPrice) / marketAverage) * 100
        })
      }

      // Calculate category ranks
      const allCategories = new Set<string>()
      rankings.forEach(r => {
        Object.keys(r.categoryBreakdown).forEach(catId => allCategories.add(catId))
      })

      allCategories.forEach(catId => {
        const categoryRankings = rankings
          .filter(r => r.categoryBreakdown[catId])
          .sort((a, b) => a.categoryBreakdown[catId].avgPrice - b.categoryBreakdown[catId].avgPrice)

        categoryRankings.forEach((ranking, index) => {
          ranking.categoryBreakdown[catId].rank = index + 1
        })
      })

      setStoreRankings(rankings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate store rankings')
    } finally {
      setLoading(false)
    }
  }

  // Calculate user rankings/leaderboard
  const calculateUserRankings = async () => {
    setLoading(true)

    try {
      const { data: userProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('reputation_score', { ascending: false })
        .limit(50)

      if (profilesError) throw profilesError

      const rankings: UserRanking[] = (userProfiles || []).map((profile, index) => {
        // Determine badge based on reputation and reports
        let badge: UserRanking['badge'] = 'beginner'
        if (profile.reputation_score >= 100 && profile.verified_reports >= 10) {
          badge = 'trusted'
        } else if (profile.reputation_score >= 50 && profile.total_reports >= 20) {
          badge = 'expert'
        } else if (profile.total_reports >= 5) {
          badge = 'contributor'
        }

        return {
          user_id: profile.user_id,
          display_name: profile.display_name || 'משתמש אנונימי',
          reputation_score: profile.reputation_score || 0,
          total_reports: profile.total_reports || 0,
          verified_reports: profile.verified_reports || 0,
          avatar_url: profile.avatar_url,
          rank: index + 1,
          badge
        }
      })

      setUserRankings(rankings)
    } catch (err) {
      console.error('Failed to calculate user rankings:', err)
    } finally {
      setLoading(false)
    }
  }

  // Update user reputation (called after actions)
  const updateUserReputation = async (userId: string, action: 'report_added' | 'report_verified' | 'report_flagged') => {
    try {
      let reputationChange = 0
      let reportCountChange = 0
      let verifiedChange = 0

      switch (action) {
        case 'report_added':
          reputationChange = 5
          reportCountChange = 1
          break
        case 'report_verified':
          reputationChange = 10
          verifiedChange = 1
          break
        case 'report_flagged':
          reputationChange = -5
          break
      }

      // Get current profile
      const { data: currentProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        // Create profile if doesn't exist
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            reputation_score: Math.max(0, reputationChange),
            total_reports: reportCountChange,
            verified_reports: verifiedChange
          })

        if (createError) throw createError
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            reputation_score: Math.max(0, (currentProfile.reputation_score || 0) + reputationChange),
            total_reports: (currentProfile.total_reports || 0) + reportCountChange,
            verified_reports: (currentProfile.verified_reports || 0) + verifiedChange
          })
          .eq('user_id', userId)

        if (updateError) throw updateError
      }

      // Refresh rankings
      await calculateUserRankings()
    } catch (err) {
      console.error('Failed to update user reputation:', err)
    }
  }

  // Initialize data
  useEffect(() => {
    fetchCategories()
    calculateStoreRankings()
    calculateUserRankings()
  }, [])

  // Recalculate when category filter changes
  useEffect(() => {
    calculateStoreRankings(selectedCategoryId || undefined)
  }, [selectedCategoryId])

  return {
    // State
    storeRankings,
    userRankings,
    categories,
    selectedCategoryId,
    loading,
    error,

    // Actions
    setSelectedCategoryId,
    calculateStoreRankings,
    calculateUserRankings,
    updateUserReputation,

    // Computed
    topStore: storeRankings[0] || null,
    topUser: userRankings[0] || null,
    totalStores: storeRankings.length,
    totalUsers: userRankings.length
  }
}