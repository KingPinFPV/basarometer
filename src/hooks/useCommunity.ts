'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Retailer } from '@/lib/database.types'

export interface StoreReview {
  id: string
  retailer_id: string
  user_id: string
  quality_rating: number
  service_rating: number
  cleanliness_rating: number
  content: string
  created_at: string
  updated_at: string
  likes_count: number
  is_flagged: boolean
  is_approved: boolean
  retailer?: Retailer
  user_profile?: {
    display_name: string
    reputation_score: number
    avatar_url?: string
  }
}

export interface CommunityInsights {
  retailer: Retailer
  totalReviews: number
  averageRating: number
  qualityAverage: number
  serviceAverage: number
  cleanlinessAverage: number
  recentTrend: 'improving' | 'declining' | 'stable'
  topPositives: string[]
  topConcerns: string[]
  recommendationScore: number
}

export interface TrendingStore {
  retailer: Retailer
  activityScore: number
  recentReviews: number
  averageRating: number
  trend: 'rising' | 'falling' | 'stable'
}

export function useCommunity() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<StoreReview[]>([])
  const [trendingStores, setTrendingStores] = useState<TrendingStore[]>([])
  const [communityInsights, setCommunityInsights] = useState<Map<string, CommunityInsights>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch recent community reviews
  const fetchRecentReviews = async (limit: number = 20) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('store_reviews')
        .select(`
          *,
          retailer:retailers(*),
          user_profile:user_profiles(display_name, reputation_score, avatar_url)
        `)
        .eq('is_approved', true)
        .eq('is_flagged', false)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (fetchError) throw fetchError

      setReviews(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }

  // Submit a new store review
  const submitReview = async (
    retailerId: string,
    qualityRating: number,
    serviceRating: number,
    cleanlinessRating: number,
    content: string
  ): Promise<boolean> => {
    if (!user) {
      setError('התחבר כדי לכתוב ביקורת')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Check if user already reviewed this store
      const { data: existingReview, error: checkError } = await supabase
        .from('store_reviews')
        .select('id')
        .eq('retailer_id', retailerId)
        .eq('user_id', user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }

      if (existingReview) {
        setError('כבר כתבת ביקורת לחנות זו')
        return false
      }

      // Submit new review
      const { error: insertError } = await supabase
        .from('store_reviews')
        .insert({
          retailer_id: retailerId,
          user_id: user.id,
          quality_rating: qualityRating,
          service_rating: serviceRating,
          cleanliness_rating: cleanlinessRating,
          content: content.trim(),
          is_approved: true, // Auto-approve for now, can add moderation later
          is_flagged: false
        })

      if (insertError) throw insertError

      // Update user reputation
      await updateUserReputation(user.id, 'review_submitted')

      // Refresh reviews
      await fetchRecentReviews()

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Get store insights and community data
  const getStoreInsights = async (retailerId: string): Promise<CommunityInsights | null> => {
    try {
      const { data: reviews, error: reviewsError } = await supabase
        .from('store_reviews')
        .select(`
          *,
          retailer:retailers(*),
          user_profile:user_profiles(display_name, reputation_score)
        `)
        .eq('retailer_id', retailerId)
        .eq('is_approved', true)
        .eq('is_flagged', false)

      if (reviewsError) throw reviewsError

      if (!reviews || reviews.length === 0) return null

      const retailer = reviews[0].retailer
      const totalReviews = reviews.length

      // Calculate averages
      const qualityAverage = reviews.reduce((sum, r) => sum + r.quality_rating, 0) / totalReviews
      const serviceAverage = reviews.reduce((sum, r) => sum + r.service_rating, 0) / totalReviews
      const cleanlinessAverage = reviews.reduce((sum, r) => sum + r.cleanliness_rating, 0) / totalReviews
      const averageRating = (qualityAverage + serviceAverage + cleanlinessAverage) / 3

      // Analyze trends (simple version - last 5 vs previous 5 reviews)
      let recentTrend: 'improving' | 'declining' | 'stable' = 'stable'
      if (reviews.length >= 10) {
        const recent5 = reviews.slice(0, 5)
        const previous5 = reviews.slice(5, 10)
        
        const recentAvg = recent5.reduce((sum, r) => 
          sum + (r.quality_rating + r.service_rating + r.cleanliness_rating) / 3, 0) / 5
        const previousAvg = previous5.reduce((sum, r) => 
          sum + (r.quality_rating + r.service_rating + r.cleanliness_rating) / 3, 0) / 5
        
        if (recentAvg > previousAvg + 0.3) recentTrend = 'improving'
        else if (recentAvg < previousAvg - 0.3) recentTrend = 'declining'
      }

      // Extract common themes (simplified)
      const positiveWords = ['נקי', 'טוב', 'מעולה', 'איכותי', 'טרי', 'זול', 'מומלץ']
      const concernWords = ['יקר', 'לא טרי', 'מלוכלך', 'שירות גרוע', 'איטי']

      const allContent = reviews.map(r => r.content).join(' ')
      const topPositives = positiveWords.filter(word => allContent.includes(word))
      const topConcerns = concernWords.filter(word => allContent.includes(word))

      // Calculate recommendation score
      const recommendationScore = Math.round(averageRating * 20) // Convert 1-5 to 0-100

      const insights: CommunityInsights = {
        retailer,
        totalReviews,
        averageRating,
        qualityAverage,
        serviceAverage,
        cleanlinessAverage,
        recentTrend,
        topPositives: topPositives.slice(0, 3),
        topConcerns: topConcerns.slice(0, 3),
        recommendationScore
      }

      // Cache insights
      setCommunityInsights(prev => new Map(prev).set(retailerId, insights))

      return insights
    } catch (err) {
      console.error('Failed to get store insights:', err)
      return null
    }
  }

  // Calculate trending stores
  const calculateTrendingStores = async () => {
    try {
      const { data: retailers, error: retailersError } = await supabase
        .from('retailers')
        .select('*')
        .eq('is_active', true)

      if (retailersError) throw retailersError

      const trendingData: TrendingStore[] = []

      for (const retailer of retailers || []) {
        const { data: recentReviews, error: reviewsError } = await supabase
          .from('store_reviews')
          .select('*')
          .eq('retailer_id', retailer.id)
          .eq('is_approved', true)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days

        if (reviewsError) continue

        const recentCount = recentReviews?.length || 0
        if (recentCount === 0) continue

        const averageRating = recentReviews!.reduce((sum, r) => 
          sum + (r.quality_rating + r.service_rating + r.cleanliness_rating) / 3, 0) / recentCount

        // Activity score based on recent reviews and ratings
        const activityScore = recentCount * averageRating

        trendingData.push({
          retailer,
          activityScore,
          recentReviews: recentCount,
          averageRating,
          trend: averageRating >= 4 ? 'rising' : averageRating <= 2.5 ? 'falling' : 'stable'
        })
      }

      // Sort by activity score and take top 10
      const trending = trendingData
        .sort((a, b) => b.activityScore - a.activityScore)
        .slice(0, 10)

      setTrendingStores(trending)
    } catch (err) {
      console.error('Failed to calculate trending stores:', err)
    }
  }

  // Update user reputation based on community activity
  const updateUserReputation = async (userId: string, action: 'review_submitted' | 'review_liked' | 'review_flagged') => {
    try {
      let reputationChange = 0
      let reportCountChange = 0

      switch (action) {
        case 'review_submitted':
          reputationChange = 10
          reportCountChange = 1
          break
        case 'review_liked':
          reputationChange = 2
          break
        case 'review_flagged':
          reputationChange = -5
          break
      }

      const { data: currentProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

      if (currentProfile) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            reputation_score: Math.max(0, (currentProfile.reputation_score || 0) + reputationChange),
            total_reports: (currentProfile.total_reports || 0) + reportCountChange
          })
          .eq('user_id', userId)

        if (updateError) throw updateError
      } else {
        // Create new profile
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            reputation_score: Math.max(0, reputationChange),
            total_reports: reportCountChange
          })

        if (createError) throw createError
      }
    } catch (err) {
      console.error('Failed to update user reputation:', err)
    }
  }

  // Like a review
  const likeReview = async (reviewId: string): Promise<boolean> => {
    if (!user) return false

    try {
      // For now, just update reputation of review author
      const { data: review, error: reviewError } = await supabase
        .from('store_reviews')
        .select('user_id')
        .eq('id', reviewId)
        .single()

      if (reviewError) throw reviewError

      await updateUserReputation(review.user_id, 'review_liked')
      return true
    } catch (err) {
      console.error('Failed to like review:', err)
      return false
    }
  }

  // Flag a review as inappropriate
  const flagReview = async (reviewId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { error: flagError } = await supabase
        .from('store_reviews')
        .update({ is_flagged: true })
        .eq('id', reviewId)

      if (flagError) throw flagError

      // Update reputation of review author
      const { data: review, error: reviewError } = await supabase
        .from('store_reviews')
        .select('user_id')
        .eq('id', reviewId)
        .single()

      if (!reviewError) {
        await updateUserReputation(review.user_id, 'review_flagged')
      }

      return true
    } catch (err) {
      console.error('Failed to flag review:', err)
      return false
    }
  }

  // Initialize data
  useEffect(() => {
    fetchRecentReviews()
    calculateTrendingStores()
  }, [])

  return {
    // State
    reviews,
    trendingStores,
    communityInsights,
    loading,
    error,

    // Actions
    fetchRecentReviews,
    submitReview,
    getStoreInsights,
    calculateTrendingStores,
    likeReview,
    flagReview,

    // Computed
    hasReviews: reviews.length > 0,
    totalReviews: reviews.length,
    canSubmitReview: !!user
  }
}