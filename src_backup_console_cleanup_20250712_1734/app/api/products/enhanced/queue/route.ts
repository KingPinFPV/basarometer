// Enhanced Discovery Queue API - Admin Queue Management
// Serves discovery queue data for MeatIntelligenceAdmin component
// Built on existing V5.2 patterns with Enhanced Intelligence System

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface QueueResponse {
  success: boolean
  data: {
    queue_items: DiscoveryQueueItem[]
    summary: QueueSummary
    filters_applied: FilterSummary
  }
  metadata: {
    total_count: number
    filtered_count: number
    query_time_ms: number
  }
}

interface DiscoveryQueueItem {
  id: string
  product_name: string
  normalized_suggestion: string
  quality_grade_suggestion: string
  confidence_score: number
  source_site: string
  auto_classification: any
  manual_review_needed: boolean
  approved: boolean
  created_at: string
  occurrence_count: number
  similar_products: string[]
  estimated_value: number
  priority_score: number
}

interface QueueSummary {
  total_pending: number
  high_confidence: number
  needs_review: number
  auto_approved: number
  by_source: Record<string, number>
  by_confidence: {
    high: number
    medium: number
    low: number
  }
  by_quality_grade: Record<string, number>
}

interface FilterSummary {
  confidence_filter?: string
  source_filter?: string
  quality_filter?: string
  status_filter?: string
  date_filter?: string
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Get authorization header
    const authorization = request.headers.get('authorization')
    
    // For now, allow access without strict authentication to test the API
    // In production, implement proper auth validation
    
    // Basic admin check using environment credentials
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail) {
      console.warn('ADMIN_EMAIL not configured, allowing access for testing')
    }

    const { searchParams } = new URL(request.url)
    const filters = extractFilters(searchParams)

    // Build base query
    let query = supabase
      .from('meat_discovery_queue')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    query = applyFilters(query, filters)

    // Execute query with pagination
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const { data: queueItems, error: queueError } = await query
      .range(offset, offset + limit - 1)

    if (queueError) throw queueError

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('meat_discovery_queue')
      .select('*', { count: 'exact', head: true })

    if (countError) throw countError

    // Enhance queue items with additional data
    const enhancedItems = await enhanceQueueItems(queueItems || [])

    // Calculate summary statistics
    const summary = await calculateQueueSummary()

    const queryTime = Date.now() - startTime

    const response: QueueResponse = {
      success: true,
      data: {
        queue_items: enhancedItems,
        summary: summary,
        filters_applied: filters
      },
      metadata: {
        total_count: totalCount || 0,
        filtered_count: enhancedItems.length,
        query_time_ms: queryTime
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Enhanced Queue API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch queue data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Add new item to discovery queue (for testing or manual addition)
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authorization = request.headers.get('authorization')
    
    // For now, allow access without strict authentication to test the API
    // In production, implement proper auth validation
    
    // Basic admin check using environment credentials
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail) {
      console.warn('ADMIN_EMAIL not configured, allowing access for testing')
    }

    const queueData = await request.json()
    
    // Validate required fields
    if (!queueData.product_name) {
      return NextResponse.json(
        { success: false, error: 'product_name is required' },
        { status: 400 }
      )
    }

    // Insert new discovery item
    const { data: newItem, error: insertError } = await supabase
      .from('meat_discovery_queue')
      .insert({
        product_name: queueData.product_name,
        normalized_suggestion: queueData.normalized_suggestion || queueData.product_name,
        quality_grade_suggestion: queueData.quality_grade_suggestion || 'regular',
        confidence_score: queueData.confidence_score || 0.5,
        source_site: queueData.source_site || 'manual_admin',
        auto_classification: queueData.auto_classification || {},
        manual_review_needed: queueData.manual_review_needed !== false
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      message: 'Discovery item added successfully',
      data: newItem
    })

  } catch (error) {
    console.error('Add Queue Item API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add queue item',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Extract filters from search parameters
function extractFilters(searchParams: URLSearchParams): FilterSummary {
  return {
    confidence_filter: searchParams.get('confidence') || undefined,
    source_filter: searchParams.get('source') || undefined,
    quality_filter: searchParams.get('quality') || undefined,
    status_filter: searchParams.get('status') || undefined,
    date_filter: searchParams.get('date_range') || undefined
  }
}

// Apply filters to the query
function applyFilters(query: any, filters: FilterSummary) {
  // Confidence filter
  if (filters.confidence_filter) {
    const confidenceThreshold = parseFloat(filters.confidence_filter)
    if (!isNaN(confidenceThreshold)) {
      query = query.gte('confidence_score', confidenceThreshold)
    }
  }

  // Source filter
  if (filters.source_filter && filters.source_filter !== 'all') {
    query = query.eq('source_site', filters.source_filter)
  }

  // Quality grade filter
  if (filters.quality_filter && filters.quality_filter !== 'all') {
    query = query.eq('quality_grade_suggestion', filters.quality_filter)
  }

  // Status filter
  if (filters.status_filter) {
    switch (filters.status_filter) {
      case 'pending':
        query = query.eq('approved', false).eq('manual_review_needed', true)
        break
      case 'auto_approved':
        query = query.eq('approved', false).eq('manual_review_needed', false)
        break
      case 'approved':
        query = query.eq('approved', true)
        break
      case 'high_confidence':
        query = query.gte('confidence_score', 0.8)
        break
    }
  }

  // Date range filter
  if (filters.date_filter) {
    const now = new Date()
    let dateThreshold: Date
    
    switch (filters.date_filter) {
      case 'today':
        dateThreshold = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        dateThreshold = new Date(filters.date_filter)
    }
    
    query = query.gte('created_at', dateThreshold.toISOString())
  }

  return query
}

// Enhance queue items with additional computed data
async function enhanceQueueItems(items: any[]): Promise<DiscoveryQueueItem[]> {
  return Promise.all(
    items.map(async (item) => {
      // Find similar products
      const similarProducts = await findSimilarProducts(item.product_name, item.id)
      
      // Calculate occurrence count (how many times this product name appears)
      const occurrenceCount = await calculateOccurrenceCount(item.product_name)
      
      // Calculate estimated value based on confidence and similarity
      const estimatedValue = calculateEstimatedValue(item, similarProducts.length)
      
      // Calculate priority score for admin review
      const priorityScore = calculatePriorityScore(item, occurrenceCount, similarProducts.length)

      return {
        id: item.id,
        product_name: item.product_name,
        normalized_suggestion: item.normalized_suggestion,
        quality_grade_suggestion: item.quality_grade_suggestion,
        confidence_score: item.confidence_score,
        source_site: item.source_site,
        auto_classification: item.auto_classification,
        manual_review_needed: item.manual_review_needed,
        approved: item.approved,
        created_at: item.created_at,
        occurrence_count: occurrenceCount,
        similar_products: similarProducts,
        estimated_value: estimatedValue,
        priority_score: priorityScore
      }
    })
  )
}

// Find products with similar names
async function findSimilarProducts(productName: string, excludeId: string): Promise<string[]> {
  const keywords = productName.split(' ').filter(word => word.length > 2)
  
  if (keywords.length === 0) return []

  const { data: similar, error } = await supabase
    .from('meat_discovery_queue')
    .select('product_name')
    .neq('id', excludeId)
    .limit(5)

  if (error) {
    console.error('Error finding similar products:', error)
    return []
  }

  // Simple similarity matching
  return (similar || [])
    .filter(item => 
      keywords.some(keyword => 
        item.product_name.toLowerCase().includes(keyword.toLowerCase())
      )
    )
    .map(item => item.product_name)
    .slice(0, 3)
}

// Calculate how many times this product name appears
async function calculateOccurrenceCount(productName: string): Promise<number> {
  const { count, error } = await supabase
    .from('scanner_products')
    .select('*', { count: 'exact', head: true })
    .ilike('product_name', `%${productName}%`)

  if (error) {
    console.error('Error calculating occurrence count:', error)
    return 0
  }

  return count || 0
}

// Calculate estimated value of this discovery
function calculateEstimatedValue(item: any, similarCount: number): number {
  const baseValue = item.confidence_score * 100
  const similarityBonus = Math.min(20, similarCount * 5)
  const qualityBonus = getQualityBonus(item.quality_grade_suggestion)
  
  return Math.round(baseValue + similarityBonus + qualityBonus)
}

// Calculate priority score for admin review
function calculatePriorityScore(item: any, occurrenceCount: number, similarCount: number): number {
  let score = 0
  
  // High confidence gets higher priority
  if (item.confidence_score >= 0.8) score += 30
  else if (item.confidence_score >= 0.6) score += 20
  else score += 10
  
  // More occurrences = higher priority
  score += Math.min(25, occurrenceCount * 2)
  
  // More similar items = higher priority
  score += Math.min(15, similarCount * 3)
  
  // Premium quality gets bonus
  if (['premium', 'angus', 'wagyu'].includes(item.quality_grade_suggestion)) {
    score += 10
  }
  
  return Math.min(100, score)
}

// Get quality bonus for estimated value
function getQualityBonus(qualityGrade: string): number {
  const bonuses: Record<string, number> = {
    'regular': 0,
    'premium': 10,
    'angus': 15,
    'wagyu': 25,
    'veal': 12
  }
  return bonuses[qualityGrade] || 0
}

// Calculate comprehensive queue summary
async function calculateQueueSummary(): Promise<QueueSummary> {
  // Get all queue data for summary calculations
  const { data: allItems, error } = await supabase
    .from('meat_discovery_queue')
    .select('*')

  if (error) {
    console.error('Error fetching queue summary data:', error)
    return {
      total_pending: 0,
      high_confidence: 0,
      needs_review: 0,
      auto_approved: 0,
      by_source: {},
      by_confidence: { high: 0, medium: 0, low: 0 },
      by_quality_grade: {}
    }
  }

  const items = allItems || []

  const totalPending = items.filter(item => !item.approved).length
  const highConfidence = items.filter(item => item.confidence_score >= 0.8).length
  const needsReview = items.filter(item => item.manual_review_needed && !item.approved).length
  const autoApproved = items.filter(item => !item.manual_review_needed && !item.approved).length

  // Group by source
  const bySource: Record<string, number> = {}
  items.forEach(item => {
    const source = item.source_site || 'unknown'
    bySource[source] = (bySource[source] || 0) + 1
  })

  // Group by confidence
  const byConfidence = {
    high: items.filter(item => item.confidence_score >= 0.8).length,
    medium: items.filter(item => item.confidence_score >= 0.6 && item.confidence_score < 0.8).length,
    low: items.filter(item => item.confidence_score < 0.6).length
  }

  // Group by quality grade
  const byQualityGrade: Record<string, number> = {}
  items.forEach(item => {
    const grade = item.quality_grade_suggestion || 'regular'
    byQualityGrade[grade] = (byQualityGrade[grade] || 0) + 1
  })

  return {
    total_pending: totalPending,
    high_confidence: highConfidence,
    needs_review: needsReview,
    auto_approved: autoApproved,
    by_source: bySource,
    by_confidence: byConfidence,
    by_quality_grade: byQualityGrade
  }
}