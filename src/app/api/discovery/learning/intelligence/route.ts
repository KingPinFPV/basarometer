import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const intelligence = [
            {
                id: 1,
                intelligence_type: 'price_trend',
                market_segment: 'beef',
                trend_direction: 'increasing',
                trend_strength: 72,
                confidence_level: 88,
                geographic_scope: ['תל אביב', 'ירושלים'],
                is_active: true,
                generated_at: new Date().toISOString()
            },
            {
                id: 2,
                intelligence_type: 'quality_shift',
                market_segment: 'premium_cuts',
                trend_direction: 'stable',
                trend_strength: 85,
                confidence_level: 91,
                geographic_scope: ['חיפה', 'באר שבע'],
                is_active: true,
                generated_at: new Date().toISOString()
            }
        ];

        const stats = {
            total_insights: intelligence.length,
            active_insights: intelligence.filter(i => i.is_active).length,
            segments_covered: [...new Set(intelligence.map(i => i.market_segment))].length,
            average_confidence: Math.round(intelligence.reduce((sum, i) => sum + i.confidence_level, 0) / intelligence.length),
            recent_insights: intelligence.length
        };

        return NextResponse.json({
            success: true,
            intelligence,
            stats,
            total: intelligence.length,
            message: "Market intelligence retrieved successfully"
        });
    } catch (error) {
        console.error('Intelligence API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch market intelligence' },
            { status: 500 }
        );
    }
}

export async function POST() {
    return NextResponse.json({
        success: true,
        action: 'generate',
        message: 'Market intelligence generated',
        insights_generated: 6
    });
}