// Enhanced Analytics API - Admin Intelligence Dashboard
// Serves analytics data for MeatIntelligenceAdmin component
// Built on existing V5.2 patterns with Enhanced Intelligence System

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface AdminAnalytics {
  success: boolean
  data: {
    discovery_queue: DiscoveryQueueAnalytics
    mapping_performance: MappingPerformance
    system_health: SystemHealth
    learning_trends: LearningTrends
  }
  metadata: {
    generated_at: string
    query_time_ms: number
  }
}

interface DiscoveryQueueAnalytics {
  pending_reviews: number
  auto_approved_today: number
  high_confidence_pending: number
  source_breakdown: Record<string, number>
  confidence_distribution: {
    high: number    // 80%+
    medium: number  // 60-80%
    low: number     // <60%
  }
}

interface MappingPerformance {
  total_mappings: number
  accuracy_rate: number
  mappings_added_today: number
  mappings_added_week: number
  top_performing_sources: Array<{
    source: string
    count: number
    avg_confidence: number
  }>
  quality_grade_distribution: Record<string, number>
}

interface SystemHealth {
  data_freshness_score: number
  processing_speed_avg: number
  error_rate: number
  uptime_percentage: number
  scanner_integration_health: {
    success_rate: number
    avg_processing_time: number
    last_successful_scan: string
  }
}

interface LearningTrends {
  weekly_learning_rate: number
  improvement_trajectory: 'improving' | 'stable' | 'declining'
  confidence_trend: Array<{
    date: string
    avg_confidence: number
    volume: number
  }>
  discovery_velocity: Array<{
    date: string
    new_discoveries: number
    auto_approved: number
  }>
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check admin authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify admin status
    const { data: isAdmin, error: adminError } = await supabase
      .rpc('check_user_admin')
    
    if (adminError || !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Fetch discovery queue data
    const { data: queueData, error: queueError } = await supabase
      .from('meat_discovery_queue')
      .select('*')
      .order('created_at', { ascending: false })

    if (queueError) throw queueError

    // Fetch mapping data
    const { data: mappingData, error: mappingError } = await supabase
      .from('meat_name_mappings')
      .select('*')
      .order('created_at', { ascending: false })

    if (mappingError) throw mappingError

    // Fetch scanner activity for health metrics
    const { data: scannerActivity, error: scannerError } = await supabase
      .from('scanner_activity')
      .select('*')
      .order('scan_timestamp', { ascending: false })
      .limit(100)

    if (scannerError) throw scannerError

    // Process analytics data
    const discoveryAnalytics = calculateDiscoveryQueueAnalytics(queueData || [])
    const mappingPerformance = calculateMappingPerformance(mappingData || [])
    const systemHealth = calculateSystemHealth(scannerActivity || [], mappingData || [])
    const learningTrends = calculateLearningTrends(queueData || [], mappingData || [])

    const queryTime = Date.now() - startTime

    const response: AdminAnalytics = {
      success: true,
      data: {
        discovery_queue: discoveryAnalytics,
        mapping_performance: mappingPerformance,
        system_health: systemHealth,
        learning_trends: learningTrends
      },
      metadata: {
        generated_at: new Date().toISOString(),
        query_time_ms: queryTime
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Enhanced Analytics API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Calculate discovery queue analytics
function calculateDiscoveryQueueAnalytics(queueData: any[]): DiscoveryQueueAnalytics {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const pendingReviews = queueData.filter(item => 
    item.manual_review_needed && !item.approved
  ).length

  const autoApprovedToday = queueData.filter(item => 
    !item.manual_review_needed && 
    new Date(item.created_at) >= today
  ).length

  const highConfidencePending = queueData.filter(item => 
    item.manual_review_needed && 
    !item.approved && 
    item.confidence_score >= 0.8
  ).length

  // Source breakdown
  const sourceBreakdown: Record<string, number> = {}
  queueData.forEach(item => {
    const source = item.source_site || 'unknown'
    sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1
  })

  // Confidence distribution
  const confidenceDistribution = {
    high: queueData.filter(item => item.confidence_score >= 0.8).length,
    medium: queueData.filter(item => item.confidence_score >= 0.6 && item.confidence_score < 0.8).length,
    low: queueData.filter(item => item.confidence_score < 0.6).length
  }

  return {
    pending_reviews: pendingReviews,
    auto_approved_today: autoApprovedToday,
    high_confidence_pending: highConfidencePending,
    source_breakdown: sourceBreakdown,
    confidence_distribution: confidenceDistribution
  }
}

// Calculate mapping performance metrics
function calculateMappingPerformance(mappingData: any[]): MappingPerformance {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const totalMappings = mappingData.length
  
  // Calculate accuracy rate
  const totalConfidenceSum = (mappingData || []).reduce((sum, mapping) => 
    sum + (mapping?.confidence_score || 0), 0
  )
  const accuracyRate = totalMappings > 0 ? (totalConfidenceSum / totalMappings) * 100 : 0

  // Count recent additions
  const mappingsAddedToday = mappingData.filter(mapping => 
    new Date(mapping.created_at) >= today
  ).length

  const mappingsAddedWeek = mappingData.filter(mapping => 
    new Date(mapping.created_at) >= weekAgo
  ).length

  // Top performing sources
  const sourceStats = new Map<string, { count: number; confidenceSum: number }>()
  mappingData.forEach(mapping => {
    const source = mapping.source || 'manual'
    if (!sourceStats.has(source)) {
      sourceStats.set(source, { count: 0, confidenceSum: 0 })
    }
    const stats = sourceStats.get(source)!
    stats.count++
    stats.confidenceSum += mapping.confidence_score || 0
  })

  const topPerformingSources = Array.from(sourceStats.entries())
    .map(([source, stats]) => ({
      source,
      count: stats.count,
      avg_confidence: stats.count > 0 ? stats.confidenceSum / stats.count : 0
    }))
    .sort((a, b) => b.avg_confidence - a.avg_confidence)
    .slice(0, 5)

  // Quality grade distribution
  const qualityGradeDistribution: Record<string, number> = {}
  mappingData.forEach(mapping => {
    const grade = mapping.quality_grade || 'regular'
    qualityGradeDistribution[grade] = (qualityGradeDistribution[grade] || 0) + 1
  })

  return {
    total_mappings: totalMappings,
    accuracy_rate: Math.round(accuracyRate * 100) / 100,
    mappings_added_today: mappingsAddedToday,
    mappings_added_week: mappingsAddedWeek,
    top_performing_sources: topPerformingSources,
    quality_grade_distribution: qualityGradeDistribution
  }
}

// Calculate system health metrics
function calculateSystemHealth(
  scannerActivity: any[], 
  mappingData: any[]
): SystemHealth {
  const now = Date.now()
  const oneDayMs = 24 * 60 * 60 * 1000

  // Data freshness score
  const recentMappings = mappingData.filter(mapping => 
    now - new Date(mapping.last_seen || mapping.created_at).getTime() < oneDayMs
  ).length
  const dataFreshnessScore = mappingData.length > 0 ? 
    Math.round((recentMappings / mappingData.length) * 100) : 0

  // Processing speed from scanner activity
  const avgProcessingSpeed = scannerActivity.length > 0 ?
    (scannerActivity || []).reduce((sum, activity) => sum + (activity?.scan_duration_seconds || 0), 0) / scannerActivity.length : 0

  // Error rate from scanner activity
  const failedScans = scannerActivity.filter(activity => activity.status !== 'completed').length
  const errorRate = scannerActivity.length > 0 ? 
    Math.round((failedScans / scannerActivity.length) * 100) : 0

  // Scanner integration health
  const successfulScans = scannerActivity.filter(activity => activity.status === 'completed').length
  const scannerSuccessRate = scannerActivity.length > 0 ? 
    Math.round((successfulScans / scannerActivity.length) * 100) : 0

  const avgScanProcessingTime = scannerActivity.length > 0 ?
    scannerActivity
      .filter(activity => activity.status === 'completed')
      .reduce((sum, activity) => sum + (activity?.scan_duration_seconds || 0), 0) / successfulScans : 0

  const lastSuccessfulScan = scannerActivity.find(activity => activity.status === 'completed')?.scan_timestamp || ''

  return {
    data_freshness_score: dataFreshnessScore,
    processing_speed_avg: Math.round(avgProcessingSpeed * 100) / 100,
    error_rate: errorRate,
    uptime_percentage: 100 - errorRate, // Simplified calculation
    scanner_integration_health: {
      success_rate: scannerSuccessRate,
      avg_processing_time: Math.round(avgScanProcessingTime * 100) / 100,
      last_successful_scan: lastSuccessfulScan
    }
  }
}

// Calculate learning trends
function calculateLearningTrends(queueData: any[], mappingData: any[]): LearningTrends {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  // Weekly learning rate
  const thisWeekMappings = mappingData.filter(mapping => 
    new Date(mapping.created_at) >= weekAgo
  ).length

  const lastWeekMappings = mappingData.filter(mapping => {
    const createdAt = new Date(mapping.created_at)
    return createdAt >= twoWeeksAgo && createdAt < weekAgo
  }).length

  const weeklyLearningRate = lastWeekMappings > 0 ? 
    ((thisWeekMappings - lastWeekMappings) / lastWeekMappings) * 100 : 0

  // Improvement trajectory
  let improvementTrajectory: 'improving' | 'stable' | 'declining' = 'stable'
  if (weeklyLearningRate > 10) improvementTrajectory = 'improving'
  else if (weeklyLearningRate < -10) improvementTrajectory = 'declining'

  // Confidence trend (last 7 days)
  const confidenceTrend = generateDailyTrends(mappingData, 7, 'confidence')

  // Discovery velocity (last 7 days)
  const discoveryVelocity = generateDailyDiscoveryTrends(queueData, 7)

  return {
    weekly_learning_rate: Math.round(weeklyLearningRate * 100) / 100,
    improvement_trajectory: improvementTrajectory,
    confidence_trend: confidenceTrend,
    discovery_velocity: discoveryVelocity
  }
}

// Generate daily confidence trends
function generateDailyTrends(mappingData: any[], days: number, metric: 'confidence'): Array<{ date: string; avg_confidence: number; volume: number }> {
  const trends: Array<{ date: string; avg_confidence: number; volume: number }> = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0]
    const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)

    const dayMappings = mappingData.filter(mapping => {
      const createdAt = new Date(mapping.created_at)
      return createdAt >= date && createdAt < nextDate
    })

    const avgConfidence = dayMappings.length > 0 ?
      (dayMappings || []).reduce((sum, mapping) => sum + (mapping?.confidence_score || 0), 0) / dayMappings.length : 0

    trends.push({
      date: dateStr,
      avg_confidence: Math.round(avgConfidence * 1000) / 1000,
      volume: dayMappings.length
    })
  }

  return trends
}

// Generate daily discovery velocity trends
function generateDailyDiscoveryTrends(queueData: any[], days: number): Array<{ date: string; new_discoveries: number; auto_approved: number }> {
  const trends: Array<{ date: string; new_discoveries: number; auto_approved: number }> = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0]
    const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)

    const dayDiscoveries = queueData.filter(item => {
      const createdAt = new Date(item.created_at)
      return createdAt >= date && createdAt < nextDate
    })

    const autoApproved = dayDiscoveries.filter(item => !item.manual_review_needed).length

    trends.push({
      date: dateStr,
      new_discoveries: dayDiscoveries.length,
      auto_approved: autoApproved
    })
  }

  return trends
}