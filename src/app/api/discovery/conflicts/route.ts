// Discovery Conflicts API - GET/POST price conflicts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ConflictResolver } from '@/lib/discovery/reliability/ConflictResolver'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') // 'resolved' or 'unresolved'
        const limit = parseInt(searchParams.get('limit') || '50')
        
        const conflictResolver = new ConflictResolver()
        
        let conflicts
        if (status === 'unresolved') {
            conflicts = await conflictResolver.getUnresolvedConflicts()
        } else {
            // Get all conflicts with filtering
            let query = supabase
                .from('price_conflicts')
                .select(`
                    *,
                    meat_cuts(name_hebrew),
                    source1:discovered_sources!price_conflicts_source1_id_fkey(name, reliability_score),
                    source2:discovered_sources!price_conflicts_source2_id_fkey(name, reliability_score)
                `)
                .order('created_at', { ascending: false })
                .limit(limit)
            
            if (status === 'resolved') {
                query = query.eq('resolved', true)
            }
            
            const { data, error } = await query
            
            if (error) {
                throw error
            }
            
            conflicts = data || []
        }
        
        // Get summary statistics
        const stats = await conflictResolver.getConflictResolutionStats()
        
        return NextResponse.json({
            success: true,
            conflicts,
            stats,
            total: conflicts.length
        })
    } catch (error) {
        console.error('Conflicts API error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch conflicts' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { action } = body
        
        const conflictResolver = new ConflictResolver()
        
        if (action === 'detect') {
            // Detect new price conflicts
            const conflicts = await conflictResolver.detectPriceConflicts()
            
            return NextResponse.json({
                success: true,
                action: 'detect',
                new_conflicts: conflicts.length,
                conflicts
            })
            
        } else if (action === 'resolve_all') {
            // Auto-resolve all pending conflicts
            const resolved = await conflictResolver.resolveAllPendingConflicts()
            
            return NextResponse.json({
                success: true,
                action: 'resolve_all',
                resolved_count: resolved
            })
            
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid action. Use "detect" or "resolve_all"' },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('Conflicts POST error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to process conflict action' },
            { status: 500 }
        )
    }
}