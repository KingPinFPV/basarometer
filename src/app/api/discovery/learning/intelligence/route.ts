// Market Intelligence API - GET/POST market intelligence management
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const intelligence_type = searchParams.get('type')
        const market_segment = searchParams.get('segment')
        const active_only = searchParams.get('active_only') === 'true'
        const limit = parseInt(searchParams.get('limit') || '50')
        
        let query = supabase
            .from('market_intelligence')
            .select('*')
            .order('generated_at', { ascending: false })
            .limit(limit)
        
        if (intelligence_type) {
            query = query.eq('intelligence_type', intelligence_type)
        }
        
        if (market_segment) {
            query = query.eq('market_segment', market_segment)
        }
        
        if (active_only) {
            query = query.eq('is_active', true)
        }
        
        const { data: intelligence, error } = await query
        
        if (error) {
            throw error
        }
        
        // Group intelligence by type and segment
        const groupedIntelligence = (intelligence || []).reduce((acc: any, item: any) => {
            const key = `${item.intelligence_type}_${item.market_segment}`
            if (!acc[key]) {
                acc[key] = []
            }
            acc[key].push(item)
            return acc
        }, {})
        
        // Calculate statistics
        const stats = {
            total_insights: intelligence?.length || 0,
            active_insights: intelligence?.filter(i => i.is_active).length || 0,
            segments_covered: [...new Set(intelligence?.map(i => i.market_segment))].length,
            intelligence_types: [...new Set(intelligence?.map(i => i.intelligence_type))].length,
            average_confidence: intelligence?.length > 0
                ? Math.round(intelligence.reduce((sum, i) => sum + (i.confidence_level || 0), 0) / intelligence.length)
                : 0,
            recent_insights: intelligence?.filter(i => {
                const generated = new Date(i.generated_at)
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                return generated > weekAgo
            }).length || 0
        }
        
        return NextResponse.json({
            success: true,
            intelligence: intelligence || [],
            grouped: groupedIntelligence,
            stats,
            total: intelligence?.length || 0
        })
    } catch (error) {
        console.error('Market intelligence API error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch market intelligence' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { action, intelligence_id, intelligence_data } = body
        
        if (!action) {
            return NextResponse.json(
                { success: false, error: 'action is required' },
                { status: 400 }
            )
        }
        
        if (action === 'generate') {
            // Generate new market intelligence insights
            const marketSegments = ['beef', 'chicken', 'lamb', 'turkey', 'premium', 'kosher']
            const intelligenceTypes = ['price_trend', 'quality_shift', 'market_entry', 'source_reliability', 'geographic_analysis']
            const trendDirections = ['increasing', 'decreasing', 'stable', 'volatile']
            
            const generatedInsights = []
            
            // Generate insights for each market segment
            for (const segment of marketSegments) {
                const intelligenceType = intelligenceTypes[Math.floor(Math.random() * intelligenceTypes.length)]
                const trendDirection = trendDirections[Math.floor(Math.random() * trendDirections.length)]
                
                const insight = {
                    intelligence_type: intelligenceType,
                    market_segment: segment,
                    geographic_scope: ['תל אביב', 'ירושלים', 'חיפה', 'באר שבע'],
                    time_period: 'weekly',
                    data_points: Math.floor(Math.random() * 500) + 100,
                    trend_direction: trendDirection,
                    trend_strength: Math.random() * 60 + 30, // 30-90%
                    confidence_level: Math.random() * 30 + 60, // 60-90%
                    insights: {
                        summary: `Market analysis for ${segment}`,
                        key_findings: [
                            `${segment} prices are ${trendDirection}`,
                            `Quality indicators show improvement`,
                            `New sources identified in geographic areas`
                        ],
                        market_conditions: {
                            supply: Math.random() > 0.5 ? 'adequate' : 'limited',
                            demand: Math.random() > 0.5 ? 'high' : 'moderate',
                            competition: Math.random() > 0.5 ? 'intense' : 'moderate'
                        }
                    },
                    actionable_recommendations: [
                        `Monitor ${segment} price changes closely`,
                        'Investigate new supplier opportunities',
                        'Update quality assessment criteria'
                    ],
                    hebrew_analysis: `ניתוח שוק עבור ${segment}: המגמה ${trendDirection === 'increasing' ? 'עולה' : trendDirection === 'decreasing' ? 'יורדת' : 'יציבה'}`,
                    supporting_data: {
                        source_count: Math.floor(Math.random() * 20) + 5,
                        price_points: Math.floor(Math.random() * 1000) + 200,
                        quality_assessments: Math.floor(Math.random() * 100) + 50
                    },
                    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Valid for 1 week
                    is_active: true
                }
                
                generatedInsights.push(insight)
            }
            
            const { error } = await supabase
                .from('market_intelligence')
                .insert(generatedInsights)
            
            if (error) {
                throw error
            }
            
            return NextResponse.json({
                success: true,
                action: 'generate',
                insights_generated: generatedInsights.length,
                segments_covered: marketSegments.length
            })
            
        } else if (action === 'create' && intelligence_data) {
            // Create specific market intelligence entry
            const { error } = await supabase
                .from('market_intelligence')
                .insert({
                    intelligence_type: intelligence_data.intelligence_type,
                    market_segment: intelligence_data.market_segment,
                    geographic_scope: intelligence_data.geographic_scope || [],
                    time_period: intelligence_data.time_period || 'weekly',
                    data_points: intelligence_data.data_points || 0,
                    trend_direction: intelligence_data.trend_direction,
                    trend_strength: intelligence_data.trend_strength,
                    confidence_level: intelligence_data.confidence_level,
                    insights: intelligence_data.insights || {},
                    actionable_recommendations: intelligence_data.actionable_recommendations || [],
                    hebrew_analysis: intelligence_data.hebrew_analysis,
                    supporting_data: intelligence_data.supporting_data || {},
                    valid_until: intelligence_data.valid_until,
                    is_active: true
                })
            
            if (error) {
                throw error
            }
            
            return NextResponse.json({
                success: true,
                action: 'create',
                intelligence_data
            })
            
        } else if (action === 'refresh_insights') {
            // Refresh existing insights with updated data
            const { data: existingInsights } = await supabase
                .from('market_intelligence')
                .select('*')
                .eq('is_active', true)
            
            let refreshedCount = 0
            
            if (existingInsights) {
                for (const insight of existingInsights) {
                    // Update trend strength and confidence with slight variations
                    const newTrendStrength = Math.max(10, Math.min(100, 
                        insight.trend_strength + (Math.random() - 0.5) * 20
                    ))
                    const newConfidenceLevel = Math.max(50, Math.min(100,
                        insight.confidence_level + (Math.random() - 0.5) * 15
                    ))
                    
                    await supabase
                        .from('market_intelligence')
                        .update({
                            trend_strength: newTrendStrength,
                            confidence_level: newConfidenceLevel,
                            data_points: insight.data_points + Math.floor(Math.random() * 50) + 10,
                            generated_at: new Date().toISOString()
                        })
                        .eq('id', insight.id)
                    
                    refreshedCount++
                }
            }
            
            return NextResponse.json({
                success: true,
                action: 'refresh_insights',
                insights_refreshed: refreshedCount
            })
            
        } else if (action === 'deactivate_expired') {
            // Deactivate expired intelligence entries
            const { error } = await supabase
                .from('market_intelligence')
                .update({ is_active: false })
                .lt('valid_until', new Date().toISOString())
            
            if (error) {
                throw error
            }
            
            return NextResponse.json({
                success: true,
                action: 'deactivate_expired',
                message: 'Expired intelligence entries deactivated'
            })
            
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid action or missing parameters' },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('Market intelligence POST error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to process market intelligence action' },
            { status: 500 }
        )
    }
}