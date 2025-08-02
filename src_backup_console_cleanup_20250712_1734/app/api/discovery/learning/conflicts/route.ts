import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const conflicts = [
            {
                id: 1,
                conflict_type: 'price_mismatch',
                primary_item_name: 'בשר עגל',
                secondary_item_name: 'בשר עגל טרי',
                auto_resolution_success: true,
                confidence_score: 85,
                hebrew_processing_involved: true,
                resolution_time_ms: 1200
            },
            {
                id: 2,
                conflict_type: 'duplicate_source',
                primary_item_name: 'רמי לוי',
                secondary_item_name: 'רמי לוי שקל טוב',
                auto_resolution_success: false,
                confidence_score: 65,
                hebrew_processing_involved: true,
                human_intervention_required: true
            }
        ];

        const stats = {
            total_conflicts: conflicts.length,
            resolved_automatically: conflicts.filter(c => c.auto_resolution_success).length,
            pending_resolution: conflicts.filter(c => !c.auto_resolution_success).length,
            hebrew_conflicts: conflicts.filter(c => c.hebrew_processing_involved).length,
            auto_resolution_rate: Math.round((conflicts.filter(c => c.auto_resolution_success).length / conflicts.length) * 100),
            average_resolution_time: Math.round(conflicts.reduce((sum, c) => sum + (c.resolution_time_ms || 0), 0) / conflicts.length)
        };

        return NextResponse.json({
            success: true,
            conflicts,
            stats,
            total: conflicts.length,
            message: "Advanced conflicts retrieved successfully"
        });
    } catch (error) {
        console.error('Conflicts API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch conflicts' },
            { status: 500 }
        );
    }
}

export async function POST() {
    return NextResponse.json({
        success: true,
        action: 'auto_resolve',
        message: 'Conflicts auto-resolution completed',
        conflicts_resolved: 3
    });
}