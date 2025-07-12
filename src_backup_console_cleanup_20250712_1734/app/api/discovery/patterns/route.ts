// Discovery Patterns API - GET/POST learning patterns
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { PatternLearner } from '@/lib/discovery/reliability/PatternLearner'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const pattern_type = searchParams.get('type')
        const active_only = searchParams.get('active_only') === 'true'
        
        const patternLearner = new PatternLearner()
        
        if (pattern_type === 'performance') {
            // Get pattern performance data
            const performance = await patternLearner.getPatternPerformance()
            
            return NextResponse.json({
                success: true,
                type: 'performance',
                performance
            })
        }
        
        // Get patterns
        let query = supabase
            .from('discovery_patterns')
            .select('*')
            .order('success_rate', { ascending: false })
            .order('times_used', { ascending: false })
        
        if (active_only) {
            query = query.eq('is_active', true)
        }
        
        if (pattern_type && pattern_type !== 'performance') {
            query = query.eq('pattern_type', pattern_type)
        }
        
        const { data: patterns, error } = await query
        
        if (error) {
            throw error
        }
        
        // Group patterns by type
        const groupedPatterns = (patterns || []).reduce((acc: any, pattern: any) => {
            if (!acc[pattern.pattern_type]) {
                acc[pattern.pattern_type] = []
            }
            acc[pattern.pattern_type].push(pattern)
            return acc
        }, {})
        
        return NextResponse.json({
            success: true,
            patterns: patterns || [],
            grouped: groupedPatterns,
            total: patterns?.length || 0
        })
    } catch (error) {
        console.error('Patterns API error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch patterns' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { action, pattern_id, pattern_data } = body
        
        const patternLearner = new PatternLearner()
        
        if (action === 'optimize') {
            // Optimize all patterns
            await patternLearner.optimizePatterns()
            
            return NextResponse.json({
                success: true,
                action: 'optimize',
                message: 'Pattern optimization completed'
            })
            
        } else if (action === 'create' && pattern_data) {
            // Create new pattern
            const { error } = await supabase
                .from('discovery_patterns')
                .insert({
                    pattern_type: pattern_data.pattern_type,
                    pattern_value: pattern_data.pattern_value,
                    pattern_regex: pattern_data.pattern_regex,
                    business_type: pattern_data.business_type || 'meat_retailer',
                    confidence_score: pattern_data.confidence_score || 50,
                    success_rate: pattern_data.success_rate || 50,
                    times_used: 0,
                    times_successful: 0,
                    created_by: 'admin',
                    is_active: true
                })
            
            if (error) {
                throw error
            }
            
            return NextResponse.json({
                success: true,
                action: 'create',
                pattern_data
            })
            
        } else if (action === 'toggle' && pattern_id) {
            // Toggle pattern active status
            const { data: pattern } = await supabase
                .from('discovery_patterns')
                .select('is_active')
                .eq('id', pattern_id)
                .single()
            
            if (!pattern) {
                return NextResponse.json(
                    { success: false, error: 'Pattern not found' },
                    { status: 404 }
                )
            }
            
            const { error } = await supabase
                .from('discovery_patterns')
                .update({ is_active: !pattern.is_active })
                .eq('id', pattern_id)
            
            if (error) {
                throw error
            }
            
            return NextResponse.json({
                success: true,
                action: 'toggle',
                pattern_id,
                new_status: !pattern.is_active
            })
            
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid action or missing parameters' },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('Patterns POST error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to process pattern action' },
            { status: 500 }
        )
    }
}