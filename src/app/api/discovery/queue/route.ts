// Discovery Queue API - GET/POST discovery queue management
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { DiscoveryEngine } from '@/lib/discovery/core/DiscoveryEngine'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const limit = parseInt(searchParams.get('limit') || '50')
        
        let query = supabase
            .from('discovered_sources')
            .select('*')
            .order('discovery_date', { ascending: false })
            .limit(limit)
        
        if (status) {
            query = query.eq('status', status)
        }
        
        const { data: queue, error } = await query
        
        if (error) {
            throw error
        }
        
        // Get queue statistics
        const { data: stats } = await supabase
            .from('discovery_dashboard_stats')
            .select('*')
            .single()
        
        return NextResponse.json({
            success: true,
            queue: queue || [],
            stats: stats || {
                total_sources: 0,
                pending_sources: 0,
                approved_sources: 0,
                avg_reliability: 0,
                recent_scans: 0
            },
            total: queue?.length || 0
        })
    } catch (error) {
        console.error('Discovery queue API error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch discovery queue' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { action, source_id, admin_notes } = body
        
        if (!action) {
            return NextResponse.json(
                { success: false, error: 'action is required' },
                { status: 400 }
            )
        }
        
        if (action === 'run_discovery') {
            // Run a new discovery session
            const discoveryEngine = new DiscoveryEngine()
            const result = await discoveryEngine.runDiscoverySession()
            
            return NextResponse.json({
                success: true,
                action: 'run_discovery',
                result
            })
            
        } else if (action === 'approve' && source_id) {
            // Approve a pending source
            const { error } = await supabase
                .from('discovered_sources')
                .update({
                    status: 'approved',
                    admin_approved: true,
                    admin_notes: admin_notes || 'Approved by admin'
                })
                .eq('id', source_id)
            
            if (error) {
                throw error
            }
            
            return NextResponse.json({
                success: true,
                action: 'approve',
                source_id
            })
            
        } else if (action === 'reject' && source_id) {
            // Reject a pending source
            const { error } = await supabase
                .from('discovered_sources')
                .update({
                    status: 'rejected',
                    admin_approved: false,
                    admin_notes: admin_notes || 'Rejected by admin'
                })
                .eq('id', source_id)
            
            if (error) {
                throw error
            }
            
            return NextResponse.json({
                success: true,
                action: 'reject',
                source_id
            })
            
        } else if (action === 'prioritize' && source_id) {
            // Prioritize a source for processing
            // First get current reliability score
            const { data: sourceData } = await supabase
                .from('discovered_sources')
                .select('reliability_score')
                .eq('id', source_id)
                .single()
            
            const currentScore = sourceData?.reliability_score || 0
            
            const { error } = await supabase
                .from('discovered_sources')
                .update({
                    reliability_score: currentScore + 10,
                    admin_notes: admin_notes || 'Prioritized by admin'
                })
                .eq('id', source_id)
            
            if (error) {
                throw error
            }
            
            return NextResponse.json({
                success: true,
                action: 'prioritize',
                source_id
            })
            
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid action or missing parameters' },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('Discovery queue POST error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to process queue action' },
            { status: 500 }
        )
    }
}