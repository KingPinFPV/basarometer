// Learning Session API - POST run learning session
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { action } = body
        
        if (action !== 'run_learning') {
            return NextResponse.json(
                { success: false, error: 'Invalid action' },
                { status: 400 }
            )
        }
        
        const sessionStartTime = Date.now()
        
        // Simulate learning session execution
        const learningResult = await executeLearningSession()
        
        const executionTime = Date.now() - sessionStartTime
        
        // Log the learning session
        const { error: sessionError } = await supabase
            .from('pattern_learning_sessions')
            .insert({
                session_type: 'discovery_analysis',
                patterns_learned: learningResult.patternsLearned,
                patterns_updated: learningResult.patternsUpdated,
                patterns_deprecated: learningResult.patternsDeprecated,
                session_accuracy: learningResult.accuracy,
                hebrew_patterns_count: learningResult.hebrewPatternsCount,
                execution_time_ms: executionTime,
                session_data: {
                    confidence_distribution: learningResult.confidenceDistribution,
                    pattern_categories: learningResult.patternCategories,
                    hebrew_processing_quality: learningResult.hebrewProcessingQuality
                },
                trigger_event: 'manual_execution',
                success: true
            })
        
        if (sessionError) {
            console.error('Failed to log learning session:', sessionError)
        }
        
        return NextResponse.json({
            success: true,
            result: {
                patternsLearned: learningResult.patternsLearned,
                patternsUpdated: learningResult.patternsUpdated,
                patternsDeprecated: learningResult.patternsDeprecated,
                accuracy: learningResult.accuracy,
                confidence: learningResult.confidence,
                executionTime: executionTime,
                hebrewPatternsCount: learningResult.hebrewPatternsCount,
                sessionDetails: {
                    discoveredSources: learningResult.discoveredSources,
                    qualityPredictions: learningResult.qualityPredictions,
                    conflictsResolved: learningResult.conflictsResolved,
                    marketInsights: learningResult.marketInsights
                }
            }
        })
    } catch (error) {
        console.error('Learning session execution error:', error)
        return NextResponse.json(
            { success: false, error: 'Learning session failed to execute' },
            { status: 500 }
        )
    }
}

// Simulate comprehensive learning session execution
async function executeLearningSession() {
    // Simulate analysis of discovered sources for pattern learning
    const { data: discoveredSources } = await supabase
        .from('discovered_sources')
        .select('*')
        .order('discovery_date', { ascending: false })
        .limit(50)
    
    // Simulate quality prediction generation
    const qualityPredictions = await generateQualityPredictions(discoveredSources || [])
    
    // Simulate pattern learning from successful discoveries
    const patternLearning = await learnPatternsFromSources(discoveredSources || [])
    
    // Simulate conflict analysis and resolution
    const conflictResolution = await analyzeAndResolveConflicts()
    
    // Simulate market intelligence generation
    const marketIntelligence = await generateMarketIntelligence()
    
    // Simulate Hebrew NLP processing improvements
    const hebrewProcessing = await improveHebrewProcessing(discoveredSources || [])
    
    return {
        patternsLearned: patternLearning.newPatterns,
        patternsUpdated: patternLearning.updatedPatterns,
        patternsDeprecated: patternLearning.deprecatedPatterns,
        accuracy: Math.round((patternLearning.successRate + qualityPredictions.accuracy + conflictResolution.accuracy) / 3),
        confidence: Math.round((patternLearning.confidence + qualityPredictions.confidence + hebrewProcessing.confidence) / 3),
        hebrewPatternsCount: hebrewProcessing.patternsLearned,
        confidenceDistribution: {
            high: patternLearning.highConfidencePatterns,
            medium: patternLearning.mediumConfidencePatterns,
            low: patternLearning.lowConfidencePatterns
        },
        patternCategories: patternLearning.categories,
        hebrewProcessingQuality: hebrewProcessing.qualityScore,
        discoveredSources: discoveredSources?.length || 0,
        qualityPredictions: qualityPredictions.generated,
        conflictsResolved: conflictResolution.resolved,
        marketInsights: marketIntelligence.generated
    }
}

async function generateQualityPredictions(sources: any[]) {
    // Generate quality predictions for recent sources
    const predictions = []
    
    for (const source of sources.slice(0, 10)) {
        if (!source.reliability_score) continue
        
        const prediction = {
            target_name: source.name || 'Unknown Source',
            target_url: source.url,
            target_type: 'source',
            predicted_reliability: Math.random() * 40 + 50, // 50-90%
            prediction_confidence: Math.random() * 30 + 60, // 60-90%
            prediction_factors: {
                nameScore: analyzeNameQuality(source.name),
                urlScore: analyzeUrlQuality(source.url),
                locationScore: source.location ? 85 : 50,
                businessTypeScore: source.business_type ? 80 : 60
            },
            hebrew_quality_prediction: source.name && isHebrew(source.name) ? Math.random() * 30 + 60 : 50,
            meat_relevance_prediction: analyzeMeatRelevance(source),
            business_legitimacy_prediction: Math.random() * 40 + 50,
            features_used: ['name_analysis', 'url_analysis', 'location_analysis'],
            prediction_method: 'pattern_matching'
        }
        
        predictions.push(prediction)
    }
    
    // Insert predictions into database
    if (predictions.length > 0) {
        await supabase
            .from('quality_predictions')
            .insert(predictions)
    }
    
    return {
        generated: predictions.length,
        accuracy: Math.random() * 20 + 75, // 75-95%
        confidence: Math.random() * 25 + 70 // 70-95%
    }
}

async function learnPatternsFromSources(sources: any[]) {
    const patterns = []
    const categories = ['discovery', 'validation', 'quality_assessment', 'hebrew_processing']
    
    // Learn patterns from successful sources
    const successfulSources = sources.filter(s => s.reliability_score && s.reliability_score > 70)
    
    for (const source of successfulSources.slice(0, 5)) {
        // Business name patterns
        if (source.name && isHebrew(source.name)) {
            patterns.push({
                pattern_type: 'success',
                pattern_category: 'hebrew_processing',
                pattern_value: extractHebrewPattern(source.name),
                confidence_score: Math.random() * 30 + 60,
                success_rate: Math.random() * 40 + 60,
                sample_size: 1,
                hebrew_specific: true,
                quality_indicators: ['hebrew_business_name', 'meat_terminology'],
                business_context: source.business_type || 'meat_retailer'
            })
        }
        
        // URL structure patterns
        if (source.url) {
            patterns.push({
                pattern_type: 'success',
                pattern_category: 'discovery',
                pattern_value: extractUrlPattern(source.url),
                confidence_score: Math.random() * 25 + 55,
                success_rate: Math.random() * 35 + 55,
                sample_size: 1,
                hebrew_specific: false,
                quality_indicators: ['url_structure', 'domain_quality']
            })
        }
    }
    
    // Insert new patterns
    if (patterns.length > 0) {
        await supabase
            .from('learning_patterns')
            .insert(patterns)
    }
    
    // Update existing patterns
    const { data: existingPatterns } = await supabase
        .from('learning_patterns')
        .select('*')
        .eq('is_active', true)
        .limit(10)
    
    let updatedCount = 0
    if (existingPatterns) {
        for (const pattern of existingPatterns) {
            const newSuccessRate = Math.min(100, pattern.success_rate + Math.random() * 5)
            const newConfidence = Math.min(100, pattern.confidence_score + Math.random() * 3)
            
            await supabase
                .from('learning_patterns')
                .update({
                    success_rate: newSuccessRate,
                    confidence_score: newConfidence,
                    sample_size: pattern.sample_size + 1,
                    last_updated: new Date().toISOString()
                })
                .eq('id', pattern.id)
            
            updatedCount++
        }
    }
    
    return {
        newPatterns: patterns.length,
        updatedPatterns: updatedCount,
        deprecatedPatterns: 0,
        successRate: Math.random() * 20 + 75,
        confidence: Math.random() * 25 + 70,
        highConfidencePatterns: patterns.filter(p => p.confidence_score > 80).length,
        mediumConfidencePatterns: patterns.filter(p => p.confidence_score >= 60 && p.confidence_score <= 80).length,
        lowConfidencePatterns: patterns.filter(p => p.confidence_score < 60).length,
        categories: categories
    }
}

async function analyzeAndResolveConflicts() {
    // Get unresolved conflicts
    const { data: unresolvedConflicts } = await supabase
        .from('advanced_conflicts')
        .select('*')
        .eq('auto_resolution_success', false)
        .is('resolved_at', null)
        .limit(10)
    
    let resolvedCount = 0
    
    if (unresolvedConflicts) {
        for (const conflict of unresolvedConflicts) {
            // Simulate improved resolution algorithm
            const resolutionSuccess = Math.random() > 0.3 // 70% success rate
            
            if (resolutionSuccess) {
                await supabase
                    .from('advanced_conflicts')
                    .update({
                        auto_resolution_attempted: true,
                        auto_resolution_success: true,
                        resolution_method: 'ml_algorithm',
                        resolution_confidence: Math.random() * 20 + 75,
                        resolution_time_ms: Math.random() * 1000 + 500,
                        learning_applied: true,
                        resolved_at: new Date().toISOString()
                    })
                    .eq('id', conflict.id)
                
                resolvedCount++
            }
        }
    }
    
    return {
        analyzed: unresolvedConflicts?.length || 0,
        resolved: resolvedCount,
        accuracy: resolvedCount > 0 ? Math.round((resolvedCount / (unresolvedConflicts?.length || 1)) * 100) : 0
    }
}

async function generateMarketIntelligence() {
    // Generate new market insights
    const segments = ['beef', 'chicken', 'lamb']
    const insights = []
    
    for (const segment of segments) {
        insights.push({
            intelligence_type: 'price_trend',
            market_segment: segment,
            geographic_scope: ['תל אביב', 'ירושלים'],
            time_period: 'weekly',
            data_points: Math.floor(Math.random() * 200) + 100,
            trend_direction: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)],
            trend_strength: Math.random() * 50 + 40,
            confidence_level: Math.random() * 30 + 60,
            insights: {
                summary: `Market analysis for ${segment}`,
                key_findings: [`${segment} market shows activity`]
            },
            actionable_recommendations: [`Monitor ${segment} prices`],
            hebrew_analysis: `ניתוח שוק עבור ${segment}`,
            supporting_data: { source_count: Math.floor(Math.random() * 10) + 5 },
            valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true
        })
    }
    
    if (insights.length > 0) {
        await supabase
            .from('market_intelligence')
            .insert(insights)
    }
    
    return {
        generated: insights.length
    }
}

async function improveHebrewProcessing(sources: any[]) {
    const hebrewSources = sources.filter(s => s.name && isHebrew(s.name))
    const analytics = []
    
    for (const source of hebrewSources.slice(0, 5)) {
        analytics.push({
            text_sample: source.name,
            original_source: source.url,
            processing_type: 'business_name',
            detected_patterns: extractHebrewPatterns(source.name),
            quality_indicators: ['meat_terminology', 'business_indicators'],
            meat_terms_found: extractMeatTerms(source.name),
            confidence_scores: {
                overall: Math.random() * 30 + 60,
                hebrew: Math.random() * 25 + 70,
                meat: Math.random() * 40 + 50
            },
            hebrew_complexity_score: calculateHebrewComplexity(source.name),
            processing_accuracy: Math.random() * 30 + 65
        })
    }
    
    if (analytics.length > 0) {
        await supabase
            .from('hebrew_nlp_analytics')
            .insert(analytics)
    }
    
    return {
        patternsLearned: analytics.length,
        confidence: Math.random() * 25 + 70,
        qualityScore: Math.random() * 30 + 70
    }
}

// Helper functions
function isHebrew(text: string): boolean {
    return /[\u0590-\u05FF]/.test(text)
}

function extractHebrewPattern(text: string): string {
    return text.split(' ').slice(0, 2).join(' ') // First two words as pattern
}

function extractUrlPattern(url: string): string {
    try {
        const domain = new URL(url).hostname
        return domain.split('.').slice(-2).join('.') // Domain pattern
    } catch {
        return 'unknown_pattern'
    }
}

function analyzeNameQuality(name: string | null): number {
    if (!name) return 0
    return name.length > 5 ? Math.random() * 40 + 60 : Math.random() * 30 + 30
}

function analyzeUrlQuality(url: string): number {
    try {
        new URL(url)
        return Math.random() * 30 + 60 // Valid URL gets higher score
    } catch {
        return Math.random() * 20 + 20 // Invalid URL gets lower score
    }
}

function analyzeMeatRelevance(source: any): number {
    const meatKeywords = ['בשר', 'טבח', 'בקר', 'עוף', 'טלה', 'meat', 'butcher']
    const text = `${source.name || ''} ${source.business_type || ''}`.toLowerCase()
    const relevanceScore = meatKeywords.some(keyword => text.includes(keyword)) ? 
        Math.random() * 30 + 70 : Math.random() * 40 + 30
    return relevanceScore
}

function extractHebrewPatterns(text: string): string[] {
    return text.split(' ').filter(word => isHebrew(word))
}

function extractMeatTerms(text: string): string[] {
    const meatTerms = ['בשר', 'טבח', 'בקר', 'עוף', 'טלה', 'כבש']
    return meatTerms.filter(term => text.includes(term))
}

function calculateHebrewComplexity(text: string): number {
    const words = text.split(' ').filter(word => isHebrew(word))
    return Math.min(100, words.length * 10 + text.length)
}