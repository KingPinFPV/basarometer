// Enhanced Product Approval API - Admin Discovery Queue Management
// Handles approval/rejection of auto-discovered meat cuts
// Built on existing V5.2 patterns with Enhanced Intelligence System

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface ApprovalRequest {
  discovery_id: string
  approved: boolean
  admin_notes?: string
  override_classification?: {
    normalized_name?: string
    quality_grade?: string
    confidence_adjustment?: number
  }
}

interface ApprovalResponse {
  success: boolean
  message: string
  data?: {
    mapping_created: boolean
    mapping_id?: string
    updated_discovery_id: string
    system_learning_impact: {
      confidence_boost: number
      similar_items_affected: number
    }
  }
  error?: string
}

export async function POST(request: NextRequest) {
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

    const approvalData: ApprovalRequest = await request.json()
    
    if (!approvalData.discovery_id) {
      return NextResponse.json(
        { success: false, error: 'discovery_id is required' },
        { status: 400 }
      )
    }

    // Fetch the discovery item
    const { data: discoveryItem, error: fetchError } = await supabase
      .from('meat_discovery_queue')
      .select('*')
      .eq('id', approvalData.discovery_id)
      .single()

    if (fetchError || !discoveryItem) {
      return NextResponse.json(
        { success: false, error: 'Discovery item not found' },
        { status: 404 }
      )
    }

    let mappingCreated = false
    let mappingId: string | undefined
    let systemLearningImpact = {
      confidence_boost: 0,
      similar_items_affected: 0
    }

    if (approvalData.approved) {
      // Create new mapping rule
      const mappingData = {
        original_name: discoveryItem.product_name,
        normalized_name: approvalData.override_classification?.normalized_name || 
                        discoveryItem.normalized_suggestion,
        quality_grade: approvalData.override_classification?.quality_grade || 
                      discoveryItem.quality_grade_suggestion,
        confidence_score: approvalData.override_classification?.confidence_adjustment || 
                         discoveryItem.confidence_score,
        source: 'admin_approved',
        auto_learned: false,
        usage_count: 1
      }

      const { data: newMapping, error: mappingError } = await supabase
        .from('meat_name_mappings')
        .insert(mappingData)
        .select()
        .single()

      if (mappingError) {
        // Error:('Error creating mapping:', mappingError)
        return NextResponse.json(
          { success: false, error: 'Failed to create mapping rule' },
          { status: 500 }
        )
      }

      mappingCreated = true
      mappingId = newMapping.id

      // Calculate system learning impact
      systemLearningImpact = await calculateLearningImpact(
        discoveryItem,
        mappingData,
        approvalData.approved
      )

      // Update similar pending items with improved confidence
      await updateSimilarItems(discoveryItem, mappingData.confidence_score)
    }

    // Update the discovery item
    const { error: updateError } = await supabase
      .from('meat_discovery_queue')
      .update({
        approved: approvalData.approved,
        manual_review_needed: false,
        admin_notes: approvalData.admin_notes
      })
      .eq('id', approvalData.discovery_id)

    if (updateError) {
      // Error:('Error updating discovery item:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update discovery item' },
        { status: 500 }
      )
    }

    // Log admin action for audit trail
    await logAdminAction({
      admin_user_id: user.id,
      action: approvalData.approved ? 'approve_discovery' : 'reject_discovery',
      discovery_id: approvalData.discovery_id,
      mapping_id: mappingId,
      notes: approvalData.admin_notes
    })

    const response: ApprovalResponse = {
      success: true,
      message: approvalData.approved ? 
        'Discovery approved and mapping rule created successfully' :
        'Discovery rejected successfully',
      data: {
        mapping_created: mappingCreated,
        mapping_id: mappingId,
        updated_discovery_id: approvalData.discovery_id,
        system_learning_impact: systemLearningImpact
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    // Error:('Enhanced Approval API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process approval',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Bulk approval endpoint
export async function PUT(request: NextRequest) {
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

    const { discovery_ids, approved }: { discovery_ids: string[], approved: boolean } = await request.json()
    
    if (!Array.isArray(discovery_ids) || discovery_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'discovery_ids array is required' },
        { status: 400 }
      )
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      mappings_created: 0
    }

    // Process each discovery item
    for (const discoveryId of discovery_ids) {
      results.processed++
      
      try {
        // Fetch discovery item
        const { data: discoveryItem, error: fetchError } = await supabase
          .from('meat_discovery_queue')
          .select('*')
          .eq('id', discoveryId)
          .single()

        if (fetchError || !discoveryItem) {
          results.failed++
          continue
        }

        if (approved) {
          // Create mapping rule
          const { error: mappingError } = await supabase
            .from('meat_name_mappings')
            .insert({
              original_name: discoveryItem.product_name,
              normalized_name: discoveryItem.normalized_suggestion,
              quality_grade: discoveryItem.quality_grade_suggestion,
              confidence_score: discoveryItem.confidence_score,
              source: 'admin_bulk_approved',
              auto_learned: false,
              usage_count: 1
            })

          if (!mappingError) {
            results.mappings_created++
          }
        }

        // Update discovery item
        const { error: updateError } = await supabase
          .from('meat_discovery_queue')
          .update({
            approved: approved,
            manual_review_needed: false
          })
          .eq('id', discoveryId)

        if (!updateError) {
          results.successful++
        } else {
          results.failed++
        }

      } catch (_error) {
        // Error:(`Error processing discovery ${discoveryId}:`, _error)
        results.failed++
      }
    }

    // Log bulk admin action
    await logAdminAction({
      admin_user_id: user.id,
      action: approved ? 'bulk_approve_discoveries' : 'bulk_reject_discoveries',
      discovery_ids: discovery_ids,
      bulk_results: results
    })

    return NextResponse.json({
      success: true,
      message: `Bulk ${approved ? 'approval' : 'rejection'} completed`,
      results: results
    })

  } catch (error) {
    // Error:('Bulk Approval API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process bulk approval',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Calculate the impact of this approval on the learning system
interface DiscoveryItem {
  id: string
  product_name: string
  confidence_score: number
}

interface MappingData {
  original_name: string
  normalized_name: string
  quality_grade: string
  confidence_score: number
  source: string
  auto_learned: boolean
  usage_count: number
}

async function calculateLearningImpact(
  discoveryItem: DiscoveryItem,
  _mappingData: MappingData,
  approved: boolean
): Promise<{ confidence_boost: number; similar_items_affected: number }> {
  if (!approved) {
    return { confidence_boost: 0, similar_items_affected: 0 }
  }

  // Find similar items in the queue
  const { data: similarItems, error } = await supabase
    .from('meat_discovery_queue')
    .select('*')
    .eq('approved', false)
    .ilike('product_name', `%${discoveryItem.product_name.split(' ')[0]}%`)
    .neq('id', discoveryItem.id)

  if (error) {
    // Error:('Error finding similar items:', error)
    return { confidence_boost: 0, similar_items_affected: 0 }
  }

  // Calculate confidence boost based on approval
  const confidenceBoost = Math.min(0.1, (1 - discoveryItem.confidence_score) * 0.5)

  return {
    confidence_boost: Math.round(confidenceBoost * 1000) / 1000,
    similar_items_affected: similarItems?.length || 0
  }
}

// Update confidence scores for similar items
async function updateSimilarItems(discoveryItem: DiscoveryItem, approvedConfidence: number) {
  const confidenceBoost = Math.min(0.05, (1 - approvedConfidence) * 0.2)

  // Find and update similar items (simplified approach without SQL functions)
  const { data: similarItems, error: fetchError } = await supabase
    .from('meat_discovery_queue')
    .select('id, confidence_score')
    .eq('approved', false)
    .ilike('product_name', `%${discoveryItem.product_name.split(' ')[0]}%`)
    .neq('id', discoveryItem.id)

  if (fetchError) {
    // Error:('Error fetching similar items:', fetchError)
    return
  }

  // Update each item individually
  if (similarItems && similarItems.length > 0) {
    const updates = similarItems.map(item => ({
      id: item.id,
      confidence_score: Math.min(1.0, item.confidence_score + confidenceBoost)
    }))

    const { error } = await supabase
      .from('meat_discovery_queue')
      .upsert(updates)

    if (error) {
      // Error:('Error updating similar items:', error)
    }
  }
}

// Log admin actions for audit trail
interface BulkResults {
  processed: number
  successful: number
  failed: number
  mappings_created: number
}

async function logAdminAction(_actionData: {
  admin_user_id: string
  action: string
  discovery_id?: string
  discovery_ids?: string[]
  mapping_id?: string
  notes?: string
  bulk_results?: BulkResults
}) {
  try {
    // Create a simple audit log entry
    // Note: You might want to create an admin_audit_log table for this
    // Admin action logged (// Debug: removed for production)

    // For now, we'll just log to console
    // In a full implementation, you'd insert into an audit table
    
  } catch (_error) {
    // Error:('Error logging admin action:', _error)
  }
}