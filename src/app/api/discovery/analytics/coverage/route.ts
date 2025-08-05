// Discovery Analytics Coverage API - GET market coverage statistics
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

<<<<<<< HEAD
=======
interface DiscoveredSource {
  id: string;
  name: string;
  url: string;
  category: string;
  location?: string;
  business_type?: string;
  status: string;
  created_at: string;
  reliability_score?: number;
}

interface ExistingRetailer {
  id: string;
  name: string;
  category: string;
  location?: string;
}

interface CoverageMetrics {
  geographic: Record<string, number>;
  business_types: Record<string, number>;
  quality: Record<string, number>;
  methods: Record<string, number>;
  expansion: any;
  hebrew_quality: any;
  summary: any;
}

>>>>>>> 7546903e90eac003c6dbdc64da3b3253f6a8ab69
export async function GET() {
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
    } catch {
        // Discovery coverage API error: error?.message
        return NextResponse.json(
            { success: false, error: 'Failed to fetch coverage metrics' },
            { status: 500 }
        )
    }
}

<<<<<<< HEAD
interface DiscoveredSource {
    id: string;
    name: string;
    location?: string;
    business_type?: string;
    reliability_score?: number;
    discovery_method?: string;
    admin_approved: boolean;
}

interface Retailer {
    id: string;
    name: string;
    is_active: boolean;
}

interface CoverageMetrics {
    geographic: LocationCoverage;
    business_types: Record<string, number>;
    quality: QualityDistribution;
    methods: Record<string, MethodStats>;
    expansion: ExpansionPotential;
    hebrew_quality: HebrewQuality;
    summary: CoverageSummary;
}

interface LocationCoverage {
    unique_cities: string[];
    location_distribution: Record<string, number>;
    major_cities_coverage: CityCoverage[];
    coverage_rate: number;
}

interface CityCoverage {
    city: string;
    sources_count: number;
    covered: boolean;
}

interface QualityDistribution {
    counts: {
        excellent: number;
        good: number;
        fair: number;
        poor: number;
    };
    percentages: Record<string, number>;
}

interface MethodStats {
    count: number;
    avgReliability: number;
    approvalRate: number;
}

interface ExpansionPotential {
    new_sources: number;
    existing_retailers: number;
    total_coverage: number;
    expansion_rate: number;
    potential_level: string;
    market_saturation: number;
}

interface HebrewQuality {
    hebrew_sources: number;
    total_sources: number;
    hebrew_coverage_rate: number;
    avg_hebrew_quality: number;
}

interface CoverageSummary {
    total_approved_sources: number;
    unique_locations: number;
    avg_reliability: number;
    high_quality_percentage: number;
}

function calculateCoverageMetrics(sources: DiscoveredSource[], existingRetailers: Retailer[]): CoverageMetrics {
=======
function calculateCoverageMetrics(sources: DiscoveredSource[], existingRetailers: ExistingRetailer[]): CoverageMetrics {
>>>>>>> 7546903e90eac003c6dbdc64da3b3253f6a8ab69
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

function analyzeLocationCoverage(sources: DiscoveredSource[]): LocationCoverage {
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

function analyzeBusinessTypeCoverage(sources: DiscoveredSource[]): Record<string, number> {
    const typeCounts: Record<string, number> = {}
    
    for (const source of sources) {
        const type = source.business_type || 'unknown'
        typeCounts[type] = (typeCounts[type] || 0) + 1
    }
    
    return typeCounts
}

function analyzeQualityDistribution(sources: DiscoveredSource[]): QualityDistribution {
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

function analyzeMethodEffectiveness(sources: DiscoveredSource[]): Record<string, MethodStats> {
    const methodStats: Record<string, MethodStats> = {}
    
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

function calculateExpansionPotential(sources: DiscoveredSource[], existingRetailers: Retailer[]): ExpansionPotential {
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

function analyzeHebrewContentQuality(sources: DiscoveredSource[]): HebrewQuality {
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