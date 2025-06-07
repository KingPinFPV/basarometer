// Pattern Learner - Learn discovery patterns from successful discoveries
import { supabase } from '@/lib/supabase'
import { BusinessDiscovery, DiscoveryPattern } from '@/lib/database.types'
import { HebrewProcessor } from '../utils/HebrewProcessor'
import { Logger } from '../utils/Logger'

export class PatternLearner {
    private hebrewProcessor: HebrewProcessor
    private logger: Logger

    constructor() {
        this.hebrewProcessor = new HebrewProcessor()
        this.logger = new Logger('PatternLearner')
    }

    async learnFromDiscoveries(discoveries: BusinessDiscovery[]): Promise<void> {
        try {
            // Extract patterns from successful discoveries
            const namePatterns = this.extractNamePatterns(discoveries)
            const urlPatterns = this.extractUrlPatterns(discoveries)
            const contentPatterns = this.extractContentPatterns(discoveries)

            // Update existing patterns or create new ones
            await this.updatePatterns('name', namePatterns)
            await this.updatePatterns('url', urlPatterns)
            await this.updatePatterns('content', contentPatterns)

            this.logger.info(`Updated patterns from ${discoveries.length} discoveries`)

        } catch (error) {
            this.logger.error('Pattern learning failed:', error)
        }
    }

    private extractNamePatterns(discoveries: BusinessDiscovery[]): Array<{pattern: string, confidence: number}> {
        const patterns: Array<{pattern: string, confidence: number}> = []
        
        for (const discovery of discoveries) {
            if (!discovery.name) continue

            const normalizedName = this.hebrewProcessor.normalize(discovery.name)
            
            // Extract Hebrew meat terms
            const meatTerms = this.hebrewProcessor.extractMeatTerms(normalizedName)
            for (const term of meatTerms) {
                patterns.push({
                    pattern: term,
                    confidence: discovery.confidence
                })
            }

            // Extract business name patterns
            const businessPatterns = this.extractBusinessNamePatterns(normalizedName)
            for (const pattern of businessPatterns) {
                patterns.push({
                    pattern,
                    confidence: discovery.confidence
                })
            }
        }

        return this.consolidatePatterns(patterns)
    }

    private extractUrlPatterns(discoveries: BusinessDiscovery[]): Array<{pattern: string, confidence: number}> {
        const patterns: Array<{pattern: string, confidence: number}> = []

        for (const discovery of discoveries) {
            try {
                const url = new URL(discovery.url)
                const hostname = url.hostname.toLowerCase()
                const pathname = url.pathname.toLowerCase()

                // Extract domain patterns
                if (hostname.includes('meat') || hostname.includes('butcher')) {
                    patterns.push({
                        pattern: 'meat',
                        confidence: discovery.confidence
                    })
                }

                // Extract Hebrew transliterated patterns
                const hebrewTerms = ['basar', 'katzav', 'bshir', 'ofot']
                for (const term of hebrewTerms) {
                    if (hostname.includes(term) || pathname.includes(term)) {
                        patterns.push({
                            pattern: term,
                            confidence: discovery.confidence
                        })
                    }
                }

                // Israeli domain pattern
                if (hostname.endsWith('.co.il')) {
                    patterns.push({
                        pattern: '.co.il',
                        confidence: discovery.confidence * 0.8 // Lower weight for domain
                    })
                }

            } catch (error) {
                continue // Skip invalid URLs
            }
        }

        return this.consolidatePatterns(patterns)
    }

    private extractContentPatterns(discoveries: BusinessDiscovery[]): Array<{pattern: string, confidence: number}> {
        const patterns: Array<{pattern: string, confidence: number}> = []

        for (const discovery of discoveries) {
            // Extract from meat categories
            for (const category of discovery.meatCategories) {
                patterns.push({
                    pattern: category,
                    confidence: discovery.confidence
                })
            }

            // Extract from quality indicators
            for (const indicator of discovery.qualityIndicators) {
                patterns.push({
                    pattern: indicator,
                    confidence: discovery.confidence * 0.7 // Lower weight for quality indicators
                })
            }
        }

        return this.consolidatePatterns(patterns)
    }

    private extractBusinessNamePatterns(name: string): string[] {
        const patterns: string[] = []

        // Common Hebrew business name patterns
        const businessPrefixes = ['קצביית', 'בית', 'חנות']
        const businessSuffixes = ['בשר', 'קצב', 'דליקטסן']

        for (const prefix of businessPrefixes) {
            if (name.includes(prefix)) {
                patterns.push(prefix)
            }
        }

        for (const suffix of businessSuffixes) {
            if (name.includes(suffix)) {
                patterns.push(suffix)
            }
        }

        return patterns
    }

    private consolidatePatterns(patterns: Array<{pattern: string, confidence: number}>): Array<{pattern: string, confidence: number}> {
        const patternMap = new Map<string, {totalConfidence: number, count: number}>()

        for (const {pattern, confidence} of patterns) {
            const existing = patternMap.get(pattern) || {totalConfidence: 0, count: 0}
            patternMap.set(pattern, {
                totalConfidence: existing.totalConfidence + confidence,
                count: existing.count + 1
            })
        }

        const consolidated: Array<{pattern: string, confidence: number}> = []
        for (const [pattern, data] of patternMap) {
            consolidated.push({
                pattern,
                confidence: data.totalConfidence / data.count
            })
        }

        return consolidated.filter(p => p.confidence > 0.5) // Only keep patterns with decent confidence
    }

    private async updatePatterns(
        type: string, 
        patterns: Array<{pattern: string, confidence: number}>
    ): Promise<void> {
        for (const {pattern, confidence} of patterns) {
            try {
                // Check if pattern already exists
                const { data: existing, error: selectError } = await supabase
                    .from('discovery_patterns')
                    .select('*')
                    .eq('pattern_type', type)
                    .eq('pattern_value', pattern)
                    .single()

                if (selectError && selectError.code !== 'PGRST116') {
                    this.logger.error('Error checking existing pattern:', selectError)
                    continue
                }

                if (existing) {
                    // Update existing pattern
                    const newTimesUsed = existing.times_used + 1
                    const newTimesSuccessful = existing.times_successful + (confidence > 0.7 ? 1 : 0)
                    const newSuccessRate = (newTimesSuccessful / newTimesUsed) * 100

                    await supabase
                        .from('discovery_patterns')
                        .update({
                            times_used: newTimesUsed,
                            times_successful: newTimesSuccessful,
                            success_rate: newSuccessRate,
                            confidence_score: (existing.confidence_score + confidence * 100) / 2 // Average
                        })
                        .eq('id', existing.id)

                } else {
                    // Create new pattern
                    await supabase
                        .from('discovery_patterns')
                        .insert({
                            pattern_type: type,
                            pattern_value: pattern,
                            pattern_regex: this.createRegexFromPattern(pattern),
                            business_type: 'meat_retailer',
                            confidence_score: confidence * 100,
                            success_rate: confidence > 0.7 ? 100 : 50,
                            times_used: 1,
                            times_successful: confidence > 0.7 ? 1 : 0,
                            created_by: 'system',
                            is_active: true
                        })
                }

            } catch (error) {
                this.logger.error(`Failed to update pattern ${pattern}:`, error)
                continue
            }
        }
    }

    private createRegexFromPattern(pattern: string): string {
        // Escape special regex characters and create a flexible pattern
        const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        
        // Add word boundary considerations for Hebrew
        if (this.hebrewProcessor.hasHebrewText(pattern)) {
            return `.*${escaped}.*`
        } else {
            return `\\b${escaped}\\b`
        }
    }

    async getActivePatterns(): Promise<DiscoveryPattern[]> {
        const { data, error } = await supabase
            .from('discovery_patterns')
            .select('*')
            .eq('is_active', true)
            .order('success_rate', { ascending: false })

        if (error) {
            this.logger.error('Failed to fetch active patterns:', error)
            return []
        }

        return data || []
    }

    async getPatternPerformance(): Promise<any> {
        const { data, error } = await supabase
            .from('discovery_patterns')
            .select(`
                pattern_type,
                COUNT(*) as total_patterns,
                AVG(success_rate) as avg_success_rate,
                AVG(confidence_score) as avg_confidence,
                SUM(times_used) as total_usage
            `)
            .eq('is_active', true)
            .group(['pattern_type'])

        if (error) {
            this.logger.error('Failed to fetch pattern performance:', error)
            return null
        }

        return data
    }

    async optimizePatterns(): Promise<void> {
        try {
            // Deactivate poorly performing patterns
            await supabase
                .from('discovery_patterns')
                .update({ is_active: false })
                .lt('success_rate', 30)
                .gt('times_used', 10)

            // Boost confidence of high-performing patterns
            await supabase
                .from('discovery_patterns')
                .update({ 
                    confidence_score: supabase.rpc('least', [95, supabase.raw('confidence_score * 1.1')])
                })
                .gt('success_rate', 80)
                .gt('times_used', 5)

            this.logger.info('Pattern optimization completed')

        } catch (error) {
            this.logger.error('Pattern optimization failed:', error)
        }
    }
}