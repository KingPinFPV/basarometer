// Discovery Engine - Main Orchestrator
import { supabase } from '@/lib/supabase'
import { 
  BusinessDiscovery, 
  DiscoveryResult, 
  DiscoverySession, 
  BusinessCandidate,
  DiscoveredSource 
} from '@/lib/database.types'
import { IsraeliDirectoriesScraper } from '../scrapers/IsraeliDirectoriesScraper'
import { BusinessValidator } from '../validators/BusinessValidator'
import { ReliabilityEngine } from '../reliability/ReliabilityEngine'
import { ConflictResolver } from '../reliability/ConflictResolver'
import { PatternLearner } from '../reliability/PatternLearner'
import { Logger } from '../utils/Logger'
import { RateLimiter } from '../utils/RateLimiter'

export class DiscoveryEngine {
    private scrapers: Map<string, any>
    private validator: BusinessValidator
    private reliabilityEngine: ReliabilityEngine
    private conflictResolver: ConflictResolver
    private patternLearner: PatternLearner
    private logger: Logger
    private rateLimiter: RateLimiter

    constructor() {
        this.logger = new Logger('DiscoveryEngine')
        this.rateLimiter = new RateLimiter()
        this.initializeScrapers()
        this.setupValidation()
        this.configureReliability()
    }

    private initializeScrapers(): void {
        this.scrapers = new Map()
        this.scrapers.set('israeli_directories', new IsraeliDirectoriesScraper())
        this.logger.info('Scrapers initialized')
    }

    private setupValidation(): void {
        this.validator = new BusinessValidator()
        this.logger.info('Business validator initialized')
    }

    private configureReliability(): void {
        this.reliabilityEngine = new ReliabilityEngine()
        this.conflictResolver = new ConflictResolver()
        this.patternLearner = new PatternLearner()
        this.logger.info('Reliability systems initialized')
    }

    // Main discovery workflow
    async runDiscoverySession(): Promise<DiscoveryResult> {
        const sessionId = `discovery_${Date.now()}`
        const session: DiscoverySession = {
            sessionId,
            startTime: new Date(),
            status: 'running',
            discoveries: [],
            conflicts: [],
            errors: []
        }

        this.logger.info(`Starting discovery session: ${sessionId}`)

        try {
            // Log discovery session start
            await this.logDiscoveryStart(sessionId)

            // 1. Run all scrapers
            const discoveries = await this.executeAllScrapers()
            this.logger.info(`Scrapers found ${discoveries.length} potential sources`)

            // 2. Validate discoveries
            const validated = await this.validateDiscoveries(discoveries)
            this.logger.info(`${validated.length} sources passed validation`)

            // 3. Check for duplicates and conflicts
            const deduplicated = await this.deduplicateResults(validated)
            this.logger.info(`${deduplicated.length} unique sources after deduplication`)

            // 4. Calculate reliability scores
            const scored = await this.scoreReliability(deduplicated)
            this.logger.info(`Reliability scores calculated for ${scored.length} sources`)

            // 5. Store discoveries in database
            const stored = await this.storeDiscoveries(scored)
            this.logger.info(`${stored.length} sources stored in database`)

            // 6. Update learning patterns
            await this.updateLearningPatterns(stored)

            // Complete session
            session.status = 'completed'
            session.endTime = new Date()
            session.discoveries = stored

            const result: DiscoveryResult = {
                totalDiscovered: discoveries.length,
                validated: validated.length,
                approved: stored.filter(s => s.confidence > 0.8).length,
                avgConfidence: this.calculateAverageConfidence(stored),
                discoveries: stored,
                conflicts: [],
                newPatterns: []
            }

            await this.logDiscoveryComplete(sessionId, result)
            this.logger.info(`Discovery session completed: ${sessionId}`)

            return result

        } catch (error) {
            session.status = 'failed'
            session.endTime = new Date()
            session.errors.push(error instanceof Error ? error.message : 'Unknown error')
            
            this.logger.error('Discovery session failed:', error)
            await this.logDiscoveryError(sessionId, error instanceof Error ? error.message : 'Unknown error')
            
            throw error
        }
    }

    private async executeAllScrapers(): Promise<BusinessCandidate[]> {
        const allDiscoveries: BusinessCandidate[] = []

        for (const [name, scraper] of this.scrapers) {
            try {
                this.logger.info(`Running scraper: ${name}`)
                
                // Rate limiting
                await this.rateLimiter.waitForSlot()

                const discoveries = await scraper.scrape()
                allDiscoveries.push(...discoveries)
                
                this.logger.info(`${name} found ${discoveries.length} candidates`)
            } catch (error) {
                this.logger.error(`Scraper ${name} failed:`, error)
                continue
            }
        }

        return allDiscoveries
    }

    private async validateDiscoveries(candidates: BusinessCandidate[]): Promise<BusinessDiscovery[]> {
        const validated: BusinessDiscovery[] = []

        for (const candidate of candidates) {
            try {
                const validation = await this.validator.validateMeatBusiness(candidate)
                
                if (validation.isValid) {
                    const discovery: BusinessDiscovery = {
                        url: candidate.url,
                        name: candidate.name || 'Unknown Business',
                        location: candidate.location,
                        business_type: candidate.business_type || 'meat_retailer',
                        discoveryMethod: 'automated_scraping',
                        discoverySource: 'israeli_directories',
                        confidence: validation.confidence,
                        meatCategories: validation.meatCategories,
                        qualityIndicators: validation.qualityIndicators
                    }
                    
                    validated.push(discovery)
                    this.logger.debug(`Validated: ${discovery.name} (${discovery.confidence})`)
                } else {
                    this.logger.debug(`Failed validation: ${candidate.name} - ${validation.reasons.join(', ')}`)
                }
            } catch (error) {
                this.logger.error(`Validation failed for ${candidate.url}:`, error)
                continue
            }
        }

        return validated
    }

    private async deduplicateResults(discoveries: BusinessDiscovery[]): Promise<BusinessDiscovery[]> {
        const urlSet = new Set<string>()
        const deduplicated: BusinessDiscovery[] = []

        // Check against existing sources in database
        const { data: existingSources } = await supabase
            .from('discovered_sources')
            .select('url')

        const existingUrls = new Set(existingSources?.map(s => s.url) || [])

        for (const discovery of discoveries) {
            const normalizedUrl = this.normalizeUrl(discovery.url)
            
            if (!urlSet.has(normalizedUrl) && !existingUrls.has(normalizedUrl)) {
                urlSet.add(normalizedUrl)
                deduplicated.push(discovery)
            } else {
                this.logger.debug(`Duplicate detected: ${discovery.url}`)
            }
        }

        return deduplicated
    }

    private async scoreReliability(discoveries: BusinessDiscovery[]): Promise<BusinessDiscovery[]> {
        for (const discovery of discoveries) {
            try {
                // Basic scoring based on validation results
                let reliabilityScore = discovery.confidence * 100

                // Bonus for Hebrew content
                if (this.hasHebrewContent(discovery.name)) {
                    reliabilityScore += 10
                }

                // Bonus for meat-specific indicators
                if (discovery.meatCategories.length > 0) {
                    reliabilityScore += discovery.meatCategories.length * 5
                }

                // Bonus for quality indicators
                if (discovery.qualityIndicators.includes('כשר')) {
                    reliabilityScore += 15
                }

                discovery.confidence = Math.min(1, reliabilityScore / 100)
                
            } catch (error) {
                this.logger.error(`Reliability scoring failed for ${discovery.url}:`, error)
                discovery.confidence = 0.5 // Default fallback
            }
        }

        return discoveries
    }

    private async storeDiscoveries(discoveries: BusinessDiscovery[]): Promise<BusinessDiscovery[]> {
        const stored: BusinessDiscovery[] = []

        for (const discovery of discoveries) {
            try {
                const { data, error } = await supabase
                    .from('discovered_sources')
                    .insert({
                        url: discovery.url,
                        name: discovery.name,
                        location: discovery.location,
                        business_type: discovery.business_type,
                        discovery_method: discovery.discoveryMethod,
                        discovery_source: discovery.discoverySource,
                        reliability_score: Math.round(discovery.confidence * 100),
                        status: discovery.confidence > 0.8 ? 'approved' : 'pending',
                        admin_approved: discovery.confidence > 0.8,
                        product_categories: discovery.meatCategories,
                        quality_indicators: discovery.qualityIndicators,
                        validation_notes: `Auto-discovered with ${Math.round(discovery.confidence * 100)}% confidence`
                    })
                    .select()
                    .single()

                if (error) {
                    this.logger.error(`Failed to store discovery ${discovery.url}:`, error)
                    continue
                }

                stored.push(discovery)
                this.logger.debug(`Stored: ${discovery.name}`)

            } catch (error) {
                this.logger.error(`Storage failed for ${discovery.url}:`, error)
                continue
            }
        }

        return stored
    }

    private async updateLearningPatterns(discoveries: BusinessDiscovery[]): Promise<void> {
        try {
            await this.patternLearner.learnFromDiscoveries(discoveries)
            this.logger.info('Learning patterns updated')
        } catch (error) {
            this.logger.error('Pattern learning failed:', error)
        }
    }

    // Utility methods
    private normalizeUrl(url: string): string {
        try {
            const urlObj = new URL(url)
            return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`.toLowerCase()
        } catch {
            return url.toLowerCase()
        }
    }

    private hasHebrewContent(text: string): boolean {
        return /[\u0590-\u05FF]/.test(text)
    }

    private calculateAverageConfidence(discoveries: BusinessDiscovery[]): number {
        if (discoveries.length === 0) return 0
        const sum = discoveries.reduce((acc, d) => acc + d.confidence, 0)
        return sum / discoveries.length
    }

    // Logging methods
    private async logDiscoveryStart(sessionId: string): Promise<void> {
        await supabase
            .from('discovery_search_log')
            .insert({
                search_method: 'automated_session',
                search_query: sessionId,
                search_date: new Date().toISOString(),
                success: true
            })
    }

    private async logDiscoveryComplete(sessionId: string, result: DiscoveryResult): Promise<void> {
        await supabase
            .from('discovery_search_log')
            .insert({
                search_method: 'automated_session_complete',
                search_query: sessionId,
                search_results_count: result.totalDiscovered,
                successful_discoveries: result.validated,
                search_date: new Date().toISOString(),
                success: true
            })
    }

    private async logDiscoveryError(sessionId: string, error: string): Promise<void> {
        await supabase
            .from('discovery_search_log')
            .insert({
                search_method: 'automated_session_error',
                search_query: sessionId,
                search_date: new Date().toISOString(),
                error_message: error,
                success: false
            })
    }

    // Hebrew-first discovery patterns
    getHebrewSearchPatterns(): string[] {
        return [
            'קצביה',
            'חנות בשר',
            'בשר איכות',
            'בשרי משלוחים',
            'בקר טרי',
            'עוף טרי',
            'כבש איכות',
            'בשר כשר',
            'בשר חלק',
            'קצב מקצועי',
            'בשר פרמיום',
            'דליקטסן בשר'
        ]
    }

    // Israeli location patterns
    getIsraeliLocationPatterns(): string[] {
        return [
            'תל אביב', 'יפו', 'רמת גן', 'גבעתיים', 'בני ברק',
            'ירושלים', 'בית שמש', 'מעלה אדומים',
            'חיפה', 'נהריה', 'עכו', 'קריות',
            'באר שבע', 'אשדוד', 'אשקלון',
            'רחובות', 'ראשון לציון', 'נס ציונה',
            'פתח תקווה', 'הרצליה', 'רעננה', 'כפר סבא',
            'נתניה', 'הוד השרון', 'רמת השרון',
            'מודיעין', 'בית שאן', 'טבריה', 'צפת',
            'אילת', 'דימונה', 'קרית גת', 'לוד'
        ]
    }

    // Manual discovery method for admin use
    async validateSingleSource(candidate: BusinessCandidate): Promise<ValidationResult> {
        return await this.validator.validateMeatBusiness(candidate)
    }

    // Get discovery statistics
    async getDiscoveryStats(): Promise<any> {
        const { data: stats } = await supabase
            .from('discovery_dashboard_stats')
            .select('*')
            .single()

        return stats
    }
}