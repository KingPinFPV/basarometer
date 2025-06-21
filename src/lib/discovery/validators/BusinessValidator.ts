// Business Validator - Meat Business Validation
import { BusinessCandidate, ValidationResult } from '@/lib/database.types'
import { HebrewProcessor } from '../utils/HebrewProcessor'
import { Logger } from '../utils/Logger'

interface WebContent {
    text: string
    title: string
    metaDescription: string
    headings: string[]
}

export class BusinessValidator {
    private hebrewProcessor: HebrewProcessor
    private meatPatterns!: RegExp[]
    private nonMeatPatterns!: RegExp[]
    private logger: Logger

    constructor() {
        this.hebrewProcessor = new HebrewProcessor()
        this.logger = new Logger('BusinessValidator')
        this.initializeMeatPatterns()
        this.initializeNonMeatPatterns()
    }

    async validateMeatBusiness(business: BusinessCandidate): Promise<ValidationResult> {
        const validationScore = {
            nameScore: 0,
            contentScore: 0,
            urlScore: 0,
            locationScore: 0,
            metaScore: 0,
            overallScore: 0
        }

        try {
            // 1. Validate business name
            validationScore.nameScore = this.validateBusinessName(business.name || '')
            
            // 2. Analyze URL for meat-related terms
            validationScore.urlScore = this.analyzeUrlForMeat(business.url)
            
            // 3. Validate Israeli location
            validationScore.locationScore = this.validateIsraeliLocation(business.location || '')
            
            // 4. Analyze description if available
            if (business.description) {
                validationScore.contentScore = this.analyzeContentForMeat({
                    text: business.description,
                    title: business.name || '',
                    metaDescription: business.description,
                    headings: []
                })
            } else {
                validationScore.contentScore = 50 // Neutral score when no description
            }
            
            // 5. Calculate overall score
            validationScore.overallScore = this.calculateOverallScore(validationScore)
            
            const isValid = validationScore.overallScore >= 70
            const confidence = validationScore.overallScore / 100
            
            return {
                isValid,
                confidence,
                scores: validationScore,
                reasons: this.generateValidationReasons(validationScore, isValid),
                meatCategories: this.detectMeatCategories(business),
                qualityIndicators: this.detectQualityIndicators(business)
            }
        } catch (error) {
            this.logger.error(`Validation failed for ${business.name}:`, error)
            return {
                isValid: false,
                confidence: 0,
                scores: validationScore,
                reasons: ['Validation error occurred'],
                meatCategories: [],
                qualityIndicators: []
            }
        }
    }

    private validateBusinessName(name: string): number {
        if (!name) return 0
        
        const normalizedName = this.hebrewProcessor.normalize(name)
        let score = 0
        
        // Check for positive meat indicators
        for (const pattern of this.meatPatterns) {
            if (pattern.test(normalizedName)) {
                score += 25
            }
        }
        
        // Check for negative indicators
        for (const pattern of this.nonMeatPatterns) {
            if (pattern.test(normalizedName)) {
                score -= 15
            }
        }
        
        // Bonus for Hebrew meat terms
        const hebrewMeatTerms = ['בשר', 'קצב', 'בקר', 'עוף', 'כבש', 'בשרי', 'דליקטסן']
        for (const term of hebrewMeatTerms) {
            if (normalizedName.includes(term)) {
                score += 20
            }
        }
        
        return Math.max(0, Math.min(100, score))
    }

    private analyzeUrlForMeat(url: string): number {
        try {
            const urlObj = new URL(url)
            const urlText = `${urlObj.hostname}${urlObj.pathname}`.toLowerCase()
            
            let score = 0
            
            // Check for meat-related terms in URL
            const meatUrlTerms = [
                'butcher', 'meat', 'beef', 'chicken', 'lamb',
                'basar', 'katzav', 'bshir', 'kasher'
            ]
            
            for (const term of meatUrlTerms) {
                if (urlText.includes(term)) {
                    score += 30
                }
            }
            
            // Check for Israeli domains
            if (urlText.includes('.co.il')) {
                score += 20
            }
            
            return Math.min(100, score)
        } catch {
            return 0
        }
    }

    private validateIsraeliLocation(location: string): number {
        if (!location) return 50 // Neutral when no location
        
        const normalizedLocation = this.hebrewProcessor.normalize(location)
        
        // Major Israeli cities
        const israeliCities = [
            'תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'ראשון לציון',
            'פתח תקווה', 'נתניה', 'אשדוד', 'בני ברק', 'רמת גן',
            'הרצליה', 'כפר סבא', 'רעננה', 'אשקלון', 'רחובות'
        ]
        
        for (const city of israeliCities) {
            if (normalizedLocation.includes(city)) {
                return 100
            }
        }
        
        // Check for Hebrew text (likely Israeli)
        if (this.hebrewProcessor.hasHebrewText(location)) {
            return 80
        }
        
        return 30 // Low score for non-Israeli locations
    }

    private analyzeContentForMeat(content: WebContent): number {
        if (!content.text) return 0
        
        const normalizedContent = this.hebrewProcessor.normalize(content.text)
        let score = 0
        
        // Hebrew meat product patterns
        const meatProducts = [
            'אנטריקוט', 'פילה', 'שניצל', 'קבב', 'המבורגר',
            'פולקה', 'רוסטביף', 'סטייק', 'צלעות', 'כנפיים',
            'שוקיים', 'כבד', 'לב', 'קורקבן', 'גרגר',
            'טחון', 'נקניק', 'נקניקיות', 'בשר טחון',
            'כבש', 'טלה', 'בקר', 'עוף', 'הודו'
        ]
        
        // Count meat product mentions
        let productMentions = 0
        for (const product of meatProducts) {
            const matches = (normalizedContent.match(new RegExp(product, 'g')) || []).length
            productMentions += matches
        }
        
        // Score based on product density
        const contentLength = normalizedContent.length
        if (contentLength > 0) {
            const productDensity = productMentions / (contentLength / 1000) // per 1000 chars
            score += Math.min(50, productDensity * 15)
        }
        
        // Check for meat-related Hebrew terms
        const meatTerms = [
            'כשר', 'חלק', 'בשרי', 'טרי', 'איכות', 'פרמיום',
            'מקורי', 'טבעי', 'אורגני', 'משקל', 'קילו', 'ק"ג'
        ]
        
        for (const term of meatTerms) {
            if (normalizedContent.includes(term)) {
                score += 5
            }
        }
        
        // Check for business operation terms
        const businessTerms = [
            'משלוח', 'הזמנה', 'טלפון', 'כתובת', 'שעות פתיחה',
            'מחיר', 'מחירון', 'מבצע', 'הנחה', 'לקוחות'
        ]
        
        for (const term of businessTerms) {
            if (normalizedContent.includes(term)) {
                score += 3
            }
        }
        
        return Math.min(100, score)
    }

    private calculateOverallScore(scores: any): number {
        const weights = {
            nameScore: 0.35,
            urlScore: 0.20,
            locationScore: 0.20,
            contentScore: 0.20,
            metaScore: 0.05
        }
        
        return Math.round(
            scores.nameScore * weights.nameScore +
            scores.urlScore * weights.urlScore +
            scores.locationScore * weights.locationScore +
            scores.contentScore * weights.contentScore +
            scores.metaScore * weights.metaScore
        )
    }

    private generateValidationReasons(scores: any, isValid: boolean): string[] {
        const reasons: string[] = []
        
        if (isValid) {
            if (scores.nameScore > 70) reasons.push('Strong meat business indicators in name')
            if (scores.urlScore > 70) reasons.push('URL contains meat-related terms')
            if (scores.locationScore > 80) reasons.push('Located in Israel')
            if (scores.contentScore > 70) reasons.push('Content mentions meat products')
        } else {
            if (scores.nameScore < 50) reasons.push('Business name lacks meat indicators')
            if (scores.urlScore < 30) reasons.push('URL does not suggest meat business')
            if (scores.locationScore < 50) reasons.push('Location not clearly Israeli')
            if (scores.contentScore < 30) reasons.push('Content lacks meat-related terms')
        }
        
        return reasons
    }

    private detectMeatCategories(business: BusinessCandidate): string[] {
        const categories: Set<string> = new Set()
        const content = (business.description || business.name || '').toLowerCase()
        const normalizedContent = this.hebrewProcessor.normalize(content)
        
        // Detect meat types
        if (/בקר|אנטריקוט|פילה|סטייק|beef|cow/.test(normalizedContent)) {
            categories.add('בקר')
        }
        if (/עוף|כנפיים|שוקיים|חזה|chicken|poultry/.test(normalizedContent)) {
            categories.add('עוף')
        }
        if (/כבש|טלה|lamb/.test(normalizedContent)) {
            categories.add('כבש')
        }
        if (/נקניק|סלמי|בשר מעובד|sausage|salami/.test(normalizedContent)) {
            categories.add('בשר מעובד')
        }
        if (/הודו|turkey/.test(normalizedContent)) {
            categories.add('הודו')
        }
        
        // Detect quality levels
        if (/פרמיום|איכות גבוהה|מובחר|premium|quality/.test(normalizedContent)) {
            categories.add('פרמיום')
        }
        if (/אורגני|טבעי|organic|natural/.test(normalizedContent)) {
            categories.add('אורגני')
        }
        if (/כשר|kosher/.test(normalizedContent)) {
            categories.add('כשר')
        }
        if (/חלק|halal/.test(normalizedContent)) {
            categories.add('חלק')
        }
        
        return Array.from(categories)
    }

    private detectQualityIndicators(business: BusinessCandidate): string[] {
        const indicators: Set<string> = new Set()
        const content = (business.description || business.name || '').toLowerCase()
        const normalizedContent = this.hebrewProcessor.normalize(content)
        
        // Quality certifications
        if (/כשר/.test(normalizedContent)) indicators.add('כשר')
        if (/חלק/.test(normalizedContent)) indicators.add('חלק')
        if (/אורגני/.test(normalizedContent)) indicators.add('אורגני')
        if (/איכות/.test(normalizedContent)) indicators.add('איכות')
        if (/טרי/.test(normalizedContent)) indicators.add('טרי')
        if (/פרמיום/.test(normalizedContent)) indicators.add('פרמיום')
        if (/מקצועי/.test(normalizedContent)) indicators.add('מקצועי')
        if (/משלוח/.test(normalizedContent)) indicators.add('משלוח')
        
        return Array.from(indicators)
    }

    private initializeMeatPatterns(): void {
        this.meatPatterns = [
            /קצב/,
            /בשר/,
            /בקר/,
            /עוף/,
            /כבש/,
            /בשרי/,
            /meat/i,
            /butcher/i,
            /דליקטסן/,
            /אנטריקוט/,
            /פילה/,
            /טחון/,
            /נקניק/,
            /כשר.*בשר/,
            /בית.*בשר/
        ]
    }
        
    private initializeNonMeatPatterns(): void {
        this.nonMeatPatterns = [
            /מסעדה/,
            /פיצה/,
            /המבורגר(?!.*בשר)/,
            /מזון.*מהיר/,
            /דגים/,
            /צמחוני/,
            /ויגן/,
            /פרות/,
            /ירקות/,
            /פלאפל/,
            /הומוס/,
            /שווארמה(?!.*בשר)/,
            /קפה/,
            /מאפה/
        ]
    }
}