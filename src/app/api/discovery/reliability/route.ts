// Discovery Reliability API - GET/POST reliability scores
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { ReliabilityEngine } from '@/lib/discovery/reliability/ReliabilityEngine'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const sourceId = searchParams.get('source_id')
        
        if (!sourceId) {
            return NextResponse.json(
                { success: false, error: 'source_id parameter required' },
                { status: 400 }
            )
        }
        
        const reliabilityEngine = new ReliabilityEngine()
        
        // Get latest reliability metrics
        const history = await reliabilityEngine.getSourceReliabilityHistory(sourceId)
        
        if (history.length === 0) {
            return NextResponse.json({
                success: true,
                source_id: sourceId,
                current_score: 50, // Default score
                metrics: [],
                trends: null,
                message: 'No reliability data available yet'
            })
        }
        
        // Calculate trends
        const trends = calculateReliabilityTrends(history)
        
        // Get source info
        const { data: source } = await supabase
            .from('discovered_sources')
            .select('name, url, reliability_score')
            .eq('id', sourceId)
            .single()
        
        return NextResponse.json({
            success: true,
            source_id: sourceId,
            source_info: source,
            current_score: history[0]?.overall_quality_score || 50,
            metrics: history,
            trends
        })
    } catch {
        // Error logged: Failed to fetch reliability data
        return NextResponse.json(
            { success: false, error: 'Failed to fetch reliability data' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { source_id, metrics } = body
        
        if (!source_id || !metrics) {
            return NextResponse.json(
                { success: false, error: 'source_id and metrics required' },
                { status: 400 }
            )
        }
        
        const reliabilityEngine = new ReliabilityEngine()
        
        // Calculate and store reliability score
        const score = await reliabilityEngine.calculateReliabilityScore(source_id, metrics)
        
        // Get updated metrics
        const history = await reliabilityEngine.getSourceReliabilityHistory(source_id)
        
        return NextResponse.json({
            success: true,
            source_id,
            new_score: score,
            latest_metrics: history[0] || null
        })
    } catch {
        // Error logged: Failed to update reliability metrics
        return NextResponse.json(
            { success: false, error: 'Failed to update reliability metrics' },
            { status: 500 }
        )
    }
}

interface ReliabilityMetric {
    overall_quality_score: number;
    data_accuracy: number;
    hebrew_quality_score: number;
    meat_relevance_score: number;
    business_legitimacy_score: number;
}

interface ReliabilityTrends {
    overall_trend: number;
    data_accuracy_trend: number;
    hebrew_quality_trend: number;
    meat_relevance_trend: number;
    business_legitimacy_trend: number;
    trend_direction: 'improving' | 'declining';
    data_points: number;
}

function calculateReliabilityTrends(history: ReliabilityMetric[]): ReliabilityTrends | null {
    if (history.length < 2) return null
    
    const latest = history[0]
    const previous = history[1]
    
    return {
        overall_trend: latest.overall_quality_score - previous.overall_quality_score,
        data_accuracy_trend: latest.data_accuracy - previous.data_accuracy,
        hebrew_quality_trend: latest.hebrew_quality_score - previous.hebrew_quality_score,
        meat_relevance_trend: latest.meat_relevance_score - previous.meat_relevance_score,
        business_legitimacy_trend: latest.business_legitimacy_score - previous.business_legitimacy_score,
        trend_direction: latest.overall_quality_score > previous.overall_quality_score ? 'improving' : 'declining',
        data_points: history.length
    }
}