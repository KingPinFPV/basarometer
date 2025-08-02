// Reliability Engine - Calculate reliability scores for sources
import { supabase } from '@/lib/supabase'
import { ReliabilityScoring, BusinessDiscovery } from '@/lib/database.types'
import { Logger } from '../utils/Logger'

export class ReliabilityEngine {
    private logger: Logger

    constructor() {
        this.logger = new Logger('ReliabilityEngine')
    }

    async calculateReliabilityScore(
        sourceId: string, 
        metrics: Partial<ReliabilityScoring>
    ): Promise<number> {
        try {
            // Insert metrics into database
            const { error } = await supabase
                .from('source_reliability_metrics')
                .insert({
                    source_id: sourceId,
                    data_accuracy: metrics.dataAccuracy || 50,
                    price_consistency: metrics.priceConsistency || 50,
                    hebrew_quality_score: metrics.hebrewQuality || 50,
                    meat_relevance_score: metrics.meatRelevance || 50,
                    business_legitimacy_score: metrics.businessLegitimacy || 50,
                    overall_quality_score: metrics.overallScore || 50
                })

            if (error) {
                this.logger.error('Failed to insert reliability metrics:', error)
                return 50 // Default score
            }

            // Calculate weighted score using database function
            const { data, error: funcError } = await supabase
                .rpc('update_reliability_score', { source_id_param: sourceId })

            if (funcError) {
                this.logger.error('Failed to calculate reliability score:', funcError)
                return this.calculateLocalScore(metrics)
            }

            return data || this.calculateLocalScore(metrics)

        } catch (error) {
            this.logger.error('Reliability calculation failed:', error)
            return this.calculateLocalScore(metrics)
        }
    }

    private calculateLocalScore(metrics: Partial<ReliabilityScoring>): number {
        const weights = {
            dataAccuracy: 0.25,
            priceConsistency: 0.20,
            hebrewQuality: 0.15,
            meatRelevance: 0.15,
            businessLegitimacy: 0.15,
            overallScore: 0.10
        }

        const score = (
            (metrics.dataAccuracy || 50) * weights.dataAccuracy +
            (metrics.priceConsistency || 50) * weights.priceConsistency +
            (metrics.hebrewQuality || 50) * weights.hebrewQuality +
            (metrics.meatRelevance || 50) * weights.meatRelevance +
            (metrics.businessLegitimacy || 50) * weights.businessLegitimacy +
            (metrics.overallScore || 50) * weights.overallScore
        )

        return Math.round(score)
    }

    async evaluateBusinessDiscovery(discovery: BusinessDiscovery): Promise<ReliabilityScoring> {
        const scoring: ReliabilityScoring = {
            dataAccuracy: this.evaluateDataAccuracy(discovery),
            priceConsistency: 50, // Will be calculated after price data is available
            hebrewQuality: this.evaluateHebrewQuality(discovery),
            meatRelevance: this.evaluateMeatRelevance(discovery),
            businessLegitimacy: this.evaluateBusinessLegitimacy(discovery),
            overallScore: 0
        }

        // Calculate overall score
        scoring.overallScore = this.calculateLocalScore(scoring)

        return scoring
    }

    private evaluateDataAccuracy(discovery: BusinessDiscovery): number {
        let score = 50 // Base score

        // Name quality
        if (discovery.name && discovery.name.length > 5) score += 15
        if (discovery.name && discovery.name.length > 15) score += 10

        // URL validity
        try {
            new URL(discovery.url)
            score += 20
        } catch {
            score -= 20
        }

        // Location data
        if (discovery.location) score += 15

        return Math.max(0, Math.min(100, score))
    }

    private evaluateHebrewQuality(discovery: BusinessDiscovery): number {
        let score = 0

        const text = `${discovery.name} ${discovery.location || ''}`.toLowerCase()

        // Hebrew text presence
        if (/[\u0590-\u05FF]/.test(text)) score += 40

        // Hebrew meat terms
        const hebrewMeatTerms = ['בשר', 'קצב', 'בקר', 'עוף', 'כבש', 'דליקטסן']
        for (const term of hebrewMeatTerms) {
            if (text.includes(term)) score += 15
        }

        // Hebrew quality terms
        const qualityTerms = ['כשר', 'איכות', 'טרי', 'פרמיום']
        for (const term of qualityTerms) {
            if (text.includes(term)) score += 5
        }

        return Math.min(100, score)
    }

    private evaluateMeatRelevance(discovery: BusinessDiscovery): number {
        let score = 50 // Base score

        // Meat categories
        score += discovery.meatCategories.length * 15

        // Quality indicators
        score += discovery.qualityIndicators.length * 10

        // Business type confirmation
        if (discovery.business_type === 'meat_retailer') score += 20

        // Discovery confidence
        score += (discovery.confidence * 20)

        return Math.min(100, score)
    }

    private evaluateBusinessLegitimacy(discovery: BusinessDiscovery): number {
        let score = 50 // Base score

        // URL legitimacy
        try {
            const url = new URL(discovery.url)
            if (url.hostname.includes('.co.il')) score += 25
            if (url.hostname.includes('.com')) score += 15
            if (url.protocol === 'https:') score += 10
        } catch {
            score -= 30
        }

        // Business name legitimacy
        if (discovery.name && discovery.name.length > 3) score += 10
        if (discovery.name && !discovery.name.includes('test')) score += 5

        // Contact information (if available)
        if (discovery.contactInfo) score += 15

        return Math.max(0, Math.min(100, score))
    }

    async getSourceReliabilityHistory(sourceId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('source_reliability_metrics')
            .select('*')
            .eq('source_id', sourceId)
            .order('metric_date', { ascending: false })
            .limit(10)

        if (error) {
            this.logger.error('Failed to fetch reliability history:', error)
            return []
        }

        return data || []
    }

    async getReliabilityTrends(): Promise<any> {
        const { data, error } = await supabase
            .from('source_reliability_metrics')
            .select(`
                metric_date,
                overall_quality_score,
                data_accuracy,
                hebrew_quality_score,
                meat_relevance_score
            `)
            .gte('metric_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order('metric_date', { ascending: true })

        if (error) {
            this.logger.error('Failed to fetch reliability trends:', error)
            return null
        }

        return this.calculateTrends(data || [])
    }

    private calculateTrends(data: any[]): any {
        if (data.length < 2) return null

        const latest = data[data.length - 1]
        const previous = data[data.length - 2]

        return {
            overallTrend: latest.overall_quality_score - previous.overall_quality_score,
            dataAccuracyTrend: latest.data_accuracy - previous.data_accuracy,
            hebrewQualityTrend: latest.hebrew_quality_score - previous.hebrew_quality_score,
            meatRelevanceTrend: latest.meat_relevance_score - previous.meat_relevance_score,
            totalDataPoints: data.length
        }
    }
}