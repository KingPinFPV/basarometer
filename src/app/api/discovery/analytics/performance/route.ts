// Discovery Analytics Performance API - GET discovery performance metrics
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const days = parseInt(searchParams.get('days') || '30')
        
        const fromDate = new Date()
        fromDate.setDate(fromDate.getDate() - days)
        
        // Get discovery session logs
        const { data: sessionLogs, error: logsError } = await supabase
            .from('discovery_search_log')
            .select('*')
            .gte('search_date', fromDate.toISOString())
            .order('search_date', { ascending: false })
        
        if (logsError) {
            throw logsError
        }
        
        // Get source creation metrics
        const { data: sourceMetrics, error: sourceError } = await supabase
            .from('discovered_sources')
            .select(`
                discovery_date,
                discovery_method,
                reliability_score,
                status,
                admin_approved
            `)
            .gte('discovery_date', fromDate.toISOString().split('T')[0])
        
        if (sourceError) {
            throw sourceError
        }
        
        // Get reliability trends
        const { data: reliabilityTrends, error: reliabilityError } = await supabase
            .from('source_reliability_metrics')
            .select(`
                metric_date,
                overall_quality_score,
                data_accuracy,
                hebrew_quality_score,
                meat_relevance_score
            `)
            .gte('metric_date', fromDate.toISOString().split('T')[0])
            .order('metric_date', { ascending: true })
        
        if (reliabilityError) {
            throw reliabilityError
        }
        
        // Calculate performance metrics
        const performance = calculatePerformanceMetrics(
            sessionLogs || [],
            sourceMetrics || [],
            reliabilityTrends || []
        )
        
        return NextResponse.json({
            success: true,
            period_days: days,
            performance,
            raw_data: {
                session_logs: sessionLogs || [],
                source_metrics: sourceMetrics || [],
                reliability_trends: reliabilityTrends || []
            }
        })
    } catch (error) {
        console.error('Discovery performance API error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch performance metrics' },
            { status: 500 }
        )
    }
}

function calculatePerformanceMetrics(
    sessionLogs: any[],
    sourceMetrics: any[],
    reliabilityTrends: any[]
): any {
    // Discovery session performance
    const totalSessions = sessionLogs.length
    const successfulSessions = sessionLogs.filter(log => log.success).length
    const sessionSuccessRate = totalSessions > 0 ? (successfulSessions / totalSessions) * 100 : 0
    
    const totalDiscovered = sessionLogs.reduce((sum, log) => sum + (log.search_results_count || 0), 0)
    const totalValidated = sessionLogs.reduce((sum, log) => sum + (log.successful_discoveries || 0), 0)
    const validationRate = totalDiscovered > 0 ? (totalValidated / totalDiscovered) * 100 : 0
    
    // Source quality metrics
    const avgReliabilityScore = sourceMetrics.length > 0 
        ? sourceMetrics.reduce((sum, s) => sum + (s.reliability_score || 0), 0) / sourceMetrics.length
        : 0
    
    const approvalRate = sourceMetrics.length > 0
        ? (sourceMetrics.filter(s => s.admin_approved).length / sourceMetrics.length) * 100
        : 0
    
    // Discovery method breakdown
    const methodBreakdown = sourceMetrics.reduce((acc: any, source: any) => {
        const method = source.discovery_method || 'unknown'
        acc[method] = (acc[method] || 0) + 1
        return acc
    }, {})
    
    // Status breakdown
    const statusBreakdown = sourceMetrics.reduce((acc: any, source: any) => {
        const status = source.status || 'unknown'
        acc[status] = (acc[status] || 0) + 1
        return acc
    }, {})
    
    // Reliability trend analysis
    let reliabilityTrend = 'stable'
    if (reliabilityTrends.length >= 2) {
        const recent = reliabilityTrends.slice(-7) // Last 7 days
        const earlier = reliabilityTrends.slice(-14, -7) // Previous 7 days
        
        if (recent.length > 0 && earlier.length > 0) {
            const recentAvg = recent.reduce((sum, r) => sum + (r.overall_quality_score || 0), 0) / recent.length
            const earlierAvg = earlier.reduce((sum, r) => sum + (r.overall_quality_score || 0), 0) / earlier.length
            
            const improvement = ((recentAvg - earlierAvg) / earlierAvg) * 100
            
            if (improvement > 5) reliabilityTrend = 'improving'
            else if (improvement < -5) reliabilityTrend = 'declining'
        }
    }
    
    // Calculate daily discovery rate
    const dailyRate = sourceMetrics.length > 0 ? sourceMetrics.length / Math.max(1, getDaysBetween(sourceMetrics)) : 0
    
    return {
        summary: {
            total_sessions: totalSessions,
            session_success_rate: Math.round(sessionSuccessRate * 100) / 100,
            total_discovered: totalDiscovered,
            total_validated: totalValidated,
            validation_rate: Math.round(validationRate * 100) / 100,
            avg_reliability_score: Math.round(avgReliabilityScore * 100) / 100,
            approval_rate: Math.round(approvalRate * 100) / 100,
            daily_discovery_rate: Math.round(dailyRate * 100) / 100
        },
        breakdowns: {
            discovery_methods: methodBreakdown,
            source_status: statusBreakdown
        },
        trends: {
            reliability_trend: reliabilityTrend,
            reliability_data: reliabilityTrends
        },
        quality_metrics: {
            high_quality_sources: sourceMetrics.filter(s => (s.reliability_score || 0) >= 80).length,
            medium_quality_sources: sourceMetrics.filter(s => (s.reliability_score || 0) >= 60 && (s.reliability_score || 0) < 80).length,
            low_quality_sources: sourceMetrics.filter(s => (s.reliability_score || 0) < 60).length
        }
    }
}

function getDaysBetween(sourceMetrics: any[]): number {
    if (sourceMetrics.length === 0) return 1
    
    const dates = sourceMetrics.map(s => new Date(s.discovery_date)).sort()
    const firstDate = dates[0]
    const lastDate = dates[dates.length - 1]
    
    const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(1, diffDays)
}