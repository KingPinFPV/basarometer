// Discovery Analytics Coverage API - GET market coverage statistics
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_request: Request) {
    try {
        // Get all discovered sources
        const { data: sources, error: sourcesError } = await supabase
            .from('discovered_sources')
            .select(`
                *,
                source_reliability_metrics(overall_quality_score)
            `)
            .eq('admin_approved', true)
        
        if (sourcesError) {
            throw sourcesError
        }
        
        // Get existing retailers for comparison
        const { data: existingRetailers, error: retailersError } = await supabase
            .from('retailers')
            .select('*')
            .eq('is_active', true)
        
        if (retailersError) {
            throw retailersError
        }
        
        // Calculate coverage metrics
        const coverage = calculateCoverageMetrics(sources || [], existingRetailers || [])
        
        return NextResponse.json({
            success: true,
            coverage,
            discovered_sources: sources?.length || 0,
            existing_retailers: existingRetailers?.length || 0
        })
    } catch (error) {
        // Discovery coverage API error: error?.message
        return NextResponse.json(
            { success: false, error: 'Failed to fetch coverage metrics' },
            { status: 500 }
        )
    }
}

function calculateCoverageMetrics(sources: any[], existingRetailers: any[]): any {
    // Geographic coverage analysis
    const locationCoverage = analyzeLocationCoverage(sources)
    
    // Business type coverage
    const businessTypeCoverage = analyzeBusinessTypeCoverage(sources)
    
    // Quality distribution
    const qualityDistribution = analyzeQualityDistribution(sources)
    
    // Discovery method effectiveness
    const methodEffectiveness = analyzeMethodEffectiveness(sources)
    
    // Market expansion potential
    const expansionPotential = calculateExpansionPotential(sources, existingRetailers)
    
    // Hebrew content quality
    const hebrewQuality = analyzeHebrewContentQuality(sources)
    
    return {
        geographic: locationCoverage,
        business_types: businessTypeCoverage,
        quality: qualityDistribution,
        methods: methodEffectiveness,
        expansion: expansionPotential,
        hebrew_quality: hebrewQuality,
        summary: {
            total_approved_sources: sources.length,
            unique_locations: locationCoverage.unique_cities.length,
            avg_reliability: sources.length > 0 
                ? sources.reduce((sum, s) => sum + (s.reliability_score || 0), 0) / sources.length
                : 0,
            high_quality_percentage: sources.length > 0
                ? (sources.filter(s => (s.reliability_score || 0) >= 80).length / sources.length) * 100
                : 0
        }
    }
}

function analyzeLocationCoverage(sources: any[]): any {
    const locationCounts: Record<string, number> = {}
    const uniqueCities = new Set<string>()
    
    for (const source of sources) {
        if (source.location) {
            const location = source.location.trim()
            locationCounts[location] = (locationCounts[location] || 0) + 1
            uniqueCities.add(location)
        }
    }
    
    // Major Israeli cities for coverage analysis
    const majorCities = [
        'תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'ראשון לציון',
        'פתח תקווה', 'נתניה', 'אשדוד', 'בני ברק', 'רמת גן'
    ]
    
    const cityCoverage = majorCities.map(city => ({
        city,
        sources_count: Object.keys(locationCounts).filter(loc => loc.includes(city)).length,
        covered: Object.keys(locationCounts).some(loc => loc.includes(city))
    }))
    
    const coverageRate = (cityCoverage.filter(c => c.covered).length / majorCities.length) * 100
    
    return {
        unique_cities: Array.from(uniqueCities),
        location_distribution: locationCounts,
        major_cities_coverage: cityCoverage,
        coverage_rate: Math.round(coverageRate * 100) / 100
    }
}

function analyzeBusinessTypeCoverage(sources: any[]): any {
    const typeCounts: Record<string, number> = {}
    
    for (const source of sources) {
        const type = source.business_type || 'unknown'
        typeCounts[type] = (typeCounts[type] || 0) + 1
    }
    
    return typeCounts
}

function analyzeQualityDistribution(sources: any[]): any {
    const distribution = {
        excellent: 0,  // 90-100
        good: 0,       // 70-89
        fair: 0,       // 50-69
        poor: 0        // <50
    }
    
    for (const source of sources) {
        const score = source.reliability_score || 0
        if (score >= 90) distribution.excellent++
        else if (score >= 70) distribution.good++
        else if (score >= 50) distribution.fair++
        else distribution.poor++
    }
    
    const total = sources.length
    const percentages = {
        excellent: total > 0 ? (distribution.excellent / total) * 100 : 0,
        good: total > 0 ? (distribution.good / total) * 100 : 0,
        fair: total > 0 ? (distribution.fair / total) * 100 : 0,
        poor: total > 0 ? (distribution.poor / total) * 100 : 0
    }
    
    return {
        counts: distribution,
        percentages: Object.fromEntries(
            Object.entries(percentages).map(([k, v]) => [k, Math.round(v * 100) / 100])
        )
    }
}

function analyzeMethodEffectiveness(sources: any[]): any {
    const methodStats: Record<string, {count: number, avgReliability: number, approvalRate: number}> = {}
    
    for (const source of sources) {
        const method = source.discovery_method || 'unknown'
        
        if (!methodStats[method]) {
            methodStats[method] = {count: 0, avgReliability: 0, approvalRate: 0}
        }
        
        methodStats[method].count++
        methodStats[method].avgReliability += source.reliability_score || 0
    }
    
    // Calculate averages and rates
    for (const method in methodStats) {
        const stats = methodStats[method]
        stats.avgReliability = stats.count > 0 ? stats.avgReliability / stats.count : 0
        stats.approvalRate = 100 // All sources in this query are approved
    }
    
    return methodStats
}

function calculateExpansionPotential(sources: any[], existingRetailers: any[]): any {
    const totalSources = sources.length + existingRetailers.length
    const newSourcesRatio = sources.length / Math.max(totalSources, 1)
    
    const expansionRate = newSourcesRatio * 100
    
    let potential = 'low'
    if (expansionRate > 50) potential = 'high'
    else if (expansionRate > 25) potential = 'medium'
    
    return {
        new_sources: sources.length,
        existing_retailers: existingRetailers.length,
        total_coverage: totalSources,
        expansion_rate: Math.round(expansionRate * 100) / 100,
        potential_level: potential,
        market_saturation: Math.round((1 - newSourcesRatio) * 100 * 100) / 100
    }
}

function analyzeHebrewContentQuality(sources: any[]): any {
    let hebrewSourcesCount = 0
    let totalHebrewQuality = 0
    
    for (const source of sources) {
        const name = source.name || ''
        const location = source.location || ''
        const hasHebrew = /[\u0590-\u05FF]/.test(name + location)
        
        if (hasHebrew) {
            hebrewSourcesCount++
            // Simulate Hebrew quality scoring based on content
            const hebrewWords = (name + location).match(/[\u0590-\u05FF]+/g) || []
            const qualityScore = Math.min(100, hebrewWords.length * 15 + 40)
            totalHebrewQuality += qualityScore
        }
    }
    
    const avgHebrewQuality = hebrewSourcesCount > 0 ? totalHebrewQuality / hebrewSourcesCount : 0
    const hebrewCoverageRate = (hebrewSourcesCount / Math.max(sources.length, 1)) * 100
    
    return {
        hebrew_sources: hebrewSourcesCount,
        total_sources: sources.length,
        hebrew_coverage_rate: Math.round(hebrewCoverageRate * 100) / 100,
        avg_hebrew_quality: Math.round(avgHebrewQuality * 100) / 100
    }
}