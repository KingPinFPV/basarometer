// Conflict Resolution API - POST resolve specific conflicts
import { NextResponse } from 'next/server'
import { ConflictResolver } from '@/lib/discovery/reliability/ConflictResolver'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { conflict_id, method, resolved_price, admin_notes, admin_id } = body
        
        if (!conflict_id) {
            return NextResponse.json(
                { success: false, error: 'conflict_id is required' },
                { status: 400 }
            )
        }
        
        const conflictResolver = new ConflictResolver()
        
        if (method === 'manual' && admin_id) {
            // Manual admin resolution
            if (!resolved_price || !admin_notes) {
                return NextResponse.json(
                    { success: false, error: 'resolved_price and admin_notes required for manual resolution' },
                    { status: 400 }
                )
            }
            
            const success = await conflictResolver.resolveManually(
                conflict_id,
                resolved_price,
                admin_notes,
                admin_id
            )
            
            if (!success) {
                return NextResponse.json(
                    { success: false, error: 'Manual resolution failed' },
                    { status: 500 }
                )
            }
            
            return NextResponse.json({
                success: true,
                method: 'manual',
                conflict_id,
                resolved_price,
                resolved_by: 'admin'
            })
            
        } else {
            // Automatic resolution
            const resolution = await conflictResolver.resolveConflict(conflict_id, 'algorithm')
            
            if (!resolution) {
                return NextResponse.json(
                    { success: false, error: 'Automatic resolution failed' },
                    { status: 500 }
                )
            }
            
            return NextResponse.json({
                success: true,
                method: 'algorithm',
                resolution
            })
        }
    } catch {
        // Conflict resolution error logged
        return NextResponse.json(
            { success: false, error: 'Resolution failed' },
            { status: 500 }
        )
    }
}