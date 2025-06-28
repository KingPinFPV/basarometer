// Discovery Sources API - GET/POST discovered sources
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { DiscoveryEngine } from '@/lib/discovery/core/DiscoveryEngine'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const reliability = searchParams.get('min_reliability')
        
        let query = supabase
            .from('discovered_sources')
            .select(`
                *,
                source_reliability_metrics(
                    overall_quality_score,
                    metric_date
                )
            `)
        
        if (status) {
            query = query.eq('status', status)
        }
        
        if (reliability) {
            query = query.gte('reliability_score', parseInt(reliability))
        }
        
        query = query.order('reliability_score', { ascending: false })
                    .order('discovery_date', { ascending: false })
        
        const { data: sources, error } = await query
        
        if (error) {
            console.error('Failed to fetch sources:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to fetch sources' },
                { status: 500 }
            )
        }
        
        return NextResponse.json({
            success: true,
            sources: sources || [],
            total: sources?.length || 0
        })
    } catch (error) {
        console.error('Sources API error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { url, name, discovery_method, business_type } = body
        
        // Validate required fields
        if (!url) {
            return NextResponse.json(
                { success: false, error: 'URL is required' },
                { status: 400 }
            )
        }
        
        const discoveryEngine = new DiscoveryEngine()
        
        // Validate the source
        const validation = await discoveryEngine.validateSingleSource({
            url,
            name,
            business_type
        })
        
        if (!validation.isValid) {
            return NextResponse.json({
                success: false,
                error: 'Source validation failed',
                validation
            }, { status: 400 })
        }
        
        // Add to database
        const { data: result, error } = await supabase
            .from('discovered_sources')
            .insert({
                url,
                name: name || 'Manual Addition',
                discovery_method: discovery_method || 'manual',
                business_type: business_type || 'meat_retailer',
                reliability_score: Math.round(validation.confidence * 100),
                status: 'validated',
                admin_approved: validation.confidence > 0.8,
                product_categories: validation.meatCategories,
                quality_indicators: validation.qualityIndicators,
                validation_notes: `Manually added with ${Math.round(validation.confidence * 100)}% confidence`
            })
            .select()
            .single()
        
        if (error) {
            console.error('Failed to add source:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to add source' },
                { status: 500 }
            )
        }
        
        return NextResponse.json({
            success: true,
            source: result,
            validation
        })
    } catch (error) {
        console.error('Sources POST error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}