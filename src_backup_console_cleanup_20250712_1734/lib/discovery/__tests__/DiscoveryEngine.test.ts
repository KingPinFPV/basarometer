// Discovery Engine Test Suite
import { DiscoveryEngine } from '../core/DiscoveryEngine'
import { BusinessValidator } from '../validators/BusinessValidator'
import { HebrewProcessor } from '../utils/HebrewProcessor'
import { ReliabilityEngine } from '../reliability/ReliabilityEngine'
import { BusinessCandidate, ValidationResult } from '@/lib/database.types'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({ data: null, error: null }))
                }))
            })),
            insert: jest.fn(() => ({
                select: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null }))
                }))
            }))
        })),
        rpc: jest.fn(() => Promise.resolve({ data: 75, error: null }))
    }
}))

describe('Discovery Engine', () => {
    let discoveryEngine: DiscoveryEngine

    beforeEach(() => {
        discoveryEngine = new DiscoveryEngine()
    })

    describe('Hebrew Search Patterns', () => {
        test('should return comprehensive Hebrew meat patterns', () => {
            const patterns = discoveryEngine.getHebrewSearchPatterns()
            
            expect(patterns).toContain('קצביה')
            expect(patterns).toContain('בשר איכות')
            expect(patterns).toContain('בקר טרי')
            expect(patterns).toContain('עוף טרי')
            expect(patterns).toContain('כבש איכות')
            expect(patterns).toContain('בשר כשר')
            expect(patterns.length).toBeGreaterThan(10)
        })
    })

    describe('Israeli Location Patterns', () => {
        test('should return major Israeli cities', () => {
            const locations = discoveryEngine.getIsraeliLocationPatterns()
            
            expect(locations).toContain('תל אביב')
            expect(locations).toContain('ירושלים')
            expect(locations).toContain('חיפה')
            expect(locations).toContain('באר שבע')
            expect(locations).toContain('אשדוד')
            expect(locations.length).toBeGreaterThan(20)
        })
    })

    describe('Single Source Validation', () => {
        test('should validate Israeli meat business correctly', async () => {
            const validBusiness: BusinessCandidate = {
                url: 'https://katzav-hamuvchar.co.il',
                name: 'קצביית המובחר',
                description: 'בשר טרי איכות פרמיום כשר למהדרין',
                location: 'תל אביב',
                business_type: 'meat_retailer'
            }
            
            const result = await discoveryEngine.validateSingleSource(validBusiness)
            
            expect(result.isValid).toBe(true)
            expect(result.confidence).toBeGreaterThan(0.7)
            expect(result.meatCategories).toContain('פרמיום')
            expect(result.qualityIndicators).toContain('כשר')
        })

        test('should reject non-meat business', async () => {
            const invalidBusiness: BusinessCandidate = {
                url: 'https://pizza-shop.co.il',
                name: 'פיצריית רומא',
                description: 'פיצה איטלקית אמיתית',
                location: 'תל אביב',
                business_type: 'restaurant'
            }
            
            const result = await discoveryEngine.validateSingleSource(invalidBusiness)
            
            expect(result.isValid).toBe(false)
            expect(result.confidence).toBeLessThan(0.5)
        })
    })
})

describe('Business Validator', () => {
    let validator: BusinessValidator

    beforeEach(() => {
        validator = new BusinessValidator()
    })

    describe('Hebrew Meat Business Validation', () => {
        test('should identify Hebrew meat business names', async () => {
            const testCases = [
                {
                    name: 'קצביית הגליל',
                    expected: true,
                    description: 'Classic Hebrew butcher name'
                },
                {
                    name: 'בשר טרי - דוד',
                    expected: true,
                    description: 'Fresh meat business'
                },
                {
                    name: 'דליקטסן בן שמחון',
                    expected: true,
                    description: 'Delicatessen business'
                },
                {
                    name: 'בית הבשר הכשר',
                    expected: true,
                    description: 'Kosher meat house'
                },
                {
                    name: 'מסעדת השף',
                    expected: false,
                    description: 'Restaurant (should be rejected)'
                },
                {
                    name: 'חנות ירקות',
                    expected: false,
                    description: 'Vegetable shop (should be rejected)'
                }
            ]

            for (const testCase of testCases) {
                const business: BusinessCandidate = {
                    url: 'https://example.co.il',
                    name: testCase.name,
                    business_type: 'meat_retailer'
                }

                const result = await validator.validateMeatBusiness(business)
                
                expect(result.isValid).toBe(testCase.expected)
                console.log(`${testCase.description}: ${testCase.name} - Valid: ${result.isValid}, Confidence: ${result.confidence}`)
            }
        })

        test('should detect meat categories correctly', async () => {
            const business: BusinessCandidate = {
                url: 'https://example.co.il',
                name: 'קצביית המובחר',
                description: 'בקר איכות, עוף טרי, כבש מובחר, בשר אורגני כשר למהדרין',
                location: 'תל אביב'
            }

            const result = await validator.validateMeatBusiness(business)
            
            expect(result.meatCategories).toContain('בקר')
            expect(result.meatCategories).toContain('עוף')
            expect(result.meatCategories).toContain('כבש')
            expect(result.meatCategories).toContain('אורגני')
            expect(result.qualityIndicators).toContain('כשר')
        })

        test('should validate Israeli locations', async () => {
            const israeliLocations = [
                'תל אביב',
                'ירושלים',
                'חיפה',
                'באר שבע',
                'ראשון לציון'
            ]

            for (const location of israeliLocations) {
                const business: BusinessCandidate = {
                    url: 'https://example.co.il',
                    name: 'קצביית הגליל',
                    location
                }

                const result = await validator.validateMeatBusiness(business)
                
                expect(result.scores.locationScore).toBeGreaterThan(70)
                console.log(`Location: ${location} - Score: ${result.scores.locationScore}`)
            }
        })
    })
})

describe('Hebrew Processor', () => {
    let hebrewProcessor: HebrewProcessor

    beforeEach(() => {
        hebrewProcessor = new HebrewProcessor()
    })

    describe('Hebrew Text Processing', () => {
        test('should normalize Hebrew text correctly', () => {
            const text = '  קצביית   המובחר  בשר  איכות  '
            const normalized = hebrewProcessor.normalize(text)
            
            expect(normalized).toBe('קצביית המובחר בשר איכות')
            expect(normalized).not.toContain('  ') // No double spaces
        })

        test('should detect Hebrew text', () => {
            expect(hebrewProcessor.hasHebrewText('קצביית המובחר')).toBe(true)
            expect(hebrewProcessor.hasHebrewText('Butcher Shop')).toBe(false)
            expect(hebrewProcessor.hasHebrewText('Mixed בשר text')).toBe(true)
        })

        test('should extract Hebrew words', () => {
            const text = 'This is mixed בשר and קצב text'
            const hebrewWords = hebrewProcessor.extractHebrewWords(text)
            
            expect(hebrewWords).toContain('בשר')
            expect(hebrewWords).toContain('קצב')
            expect(hebrewWords).not.toContain('This')
        })

        test('should identify Hebrew-dominant text', () => {
            expect(hebrewProcessor.isHebrewDominant('קצביית המובחר בתל אביב')).toBe(true)
            expect(hebrewProcessor.isHebrewDominant('Butcher Shop in Tel Aviv')).toBe(false)
            expect(hebrewProcessor.isHebrewDominant('בשר meat')).toBe(true) // Hebrew should dominate
        })

        test('should extract meat terms', () => {
            const text = 'קצביית המובחר מוכרת בשר בקר טרי ועוף איכות כשר'
            const meatTerms = hebrewProcessor.extractMeatTerms(text)
            
            expect(meatTerms).toContain('קצב')
            expect(meatTerms).toContain('בשר')
            expect(meatTerms).toContain('בקר')
            expect(meatTerms).toContain('עוף')
            expect(meatTerms).toContain('כשר')
            expect(meatTerms).toContain('טרי')
        })

        test('should calculate Hebrew quality score', () => {
            const highQualityText = 'קצביית המובחר - בשר בקר ועוף איכות כשר למהדרין'
            const lowQualityText = 'Butcher shop with some בשר'
            
            const highScore = hebrewProcessor.calculateHebrewQuality(highQualityText)
            const lowScore = hebrewProcessor.calculateHebrewQuality(lowQualityText)
            
            expect(highScore).toBeGreaterThan(80)
            expect(lowScore).toBeLessThan(60)
            expect(highScore).toBeGreaterThan(lowScore)
        })
    })

    describe('Business Name Processing', () => {
        test('should normalize business names consistently', () => {
            const variants = [
                'קצביית המובחר',
                'קצביה המובחר',
                'קצב המובחר'
            ]

            const normalized = variants.map(name => hebrewProcessor.normalizeBusinessName(name))
            
            // All should normalize to use 'קצב'
            normalized.forEach(name => {
                expect(name).toContain('קצב')
                expect(name).not.toContain('קצביית')
                expect(name).not.toContain('קצביה')
            })
        })
    })
})

describe('Reliability Engine', () => {
    let reliabilityEngine: ReliabilityEngine

    beforeEach(() => {
        reliabilityEngine = new ReliabilityEngine()
    })

    describe('Business Discovery Evaluation', () => {
        test('should evaluate high-quality discovery correctly', async () => {
            const highQualityDiscovery = {
                url: 'https://katzav-premium.co.il',
                name: 'קצביית הפרמיום - בשר איכות',
                location: 'תל אביב',
                business_type: 'meat_retailer',
                discoveryMethod: 'automated_scraping',
                discoverySource: 'israeli_directories',
                confidence: 0.95,
                meatCategories: ['בקר', 'עוף', 'פרמיום'],
                qualityIndicators: ['כשר', 'איכות', 'טרי']
            }

            const scoring = await reliabilityEngine.evaluateBusinessDiscovery(highQualityDiscovery)
            
            expect(scoring.dataAccuracy).toBeGreaterThan(70)
            expect(scoring.hebrewQuality).toBeGreaterThan(80)
            expect(scoring.meatRelevance).toBeGreaterThan(80)
            expect(scoring.businessLegitimacy).toBeGreaterThan(70)
            expect(scoring.overallScore).toBeGreaterThan(75)
        })

        test('should penalize low-quality discovery', async () => {
            const lowQualityDiscovery = {
                url: 'http://bad-url-example',
                name: 'XYZ',
                location: '',
                business_type: 'unknown',
                discoveryMethod: 'automated_scraping',
                discoverySource: 'israeli_directories',
                confidence: 0.3,
                meatCategories: [],
                qualityIndicators: []
            }

            const scoring = await reliabilityEngine.evaluateBusinessDiscovery(lowQualityDiscovery)
            
            expect(scoring.dataAccuracy).toBeLessThan(60)
            expect(scoring.hebrewQuality).toBeLessThan(50)
            expect(scoring.meatRelevance).toBeLessThan(60)
            expect(scoring.overallScore).toBeLessThan(55)
        })
    })
})

// Integration Tests
describe('Discovery Engine Integration', () => {
    test('should handle end-to-end discovery workflow', async () => {
        const discoveryEngine = new DiscoveryEngine()
        
        // Test that the discovery engine can be instantiated and basic methods work
        const hebrewPatterns = discoveryEngine.getHebrewSearchPatterns()
        const israeliLocations = discoveryEngine.getIsraeliLocationPatterns()
        
        expect(hebrewPatterns.length).toBeGreaterThan(0)
        expect(israeliLocations.length).toBeGreaterThan(0)
        
        // Test validation
        const testBusiness: BusinessCandidate = {
            url: 'https://test-butcher.co.il',
            name: 'קצביית הבדיקה',
            description: 'בשר איכות לבדיקה',
            location: 'תל אביב'
        }
        
        const validation = await discoveryEngine.validateSingleSource(testBusiness)
        expect(validation).toBeDefined()
        expect(typeof validation.isValid).toBe('boolean')
        expect(typeof validation.confidence).toBe('number')
        expect(Array.isArray(validation.meatCategories)).toBe(true)
        expect(Array.isArray(validation.qualityIndicators)).toBe(true)
    })

    test('should maintain Hebrew excellence standards', async () => {
        const hebrewProcessor = new HebrewProcessor()
        
        // Test critical Hebrew patterns
        const criticalPatterns = [
            'קצביה', 'בשר', 'בקר', 'עוף', 'כבש',
            'פרמיום', 'איכות', 'טרי', 'כשר', 'חלק'
        ]
        
        for (const pattern of criticalPatterns) {
            expect(hebrewProcessor.hasHebrewText(pattern)).toBe(true)
            expect(hebrewProcessor.extractMeatTerms(pattern).length).toBeGreaterThan(0)
        }
        
        // Test Hebrew quality scoring
        const businessNames = [
            'קצביית המובחר',
            'בשר טרי דוד',
            'דליקטסן פרמיום',
            'בית הבשר הכשר'
        ]
        
        for (const name of businessNames) {
            const quality = hebrewProcessor.calculateHebrewQuality(name)
            expect(quality).toBeGreaterThan(70) // Hebrew excellence threshold
        }
    })
})

// Performance Tests
describe('Discovery Engine Performance', () => {
    test('should complete validation within performance targets', async () => {
        const validator = new BusinessValidator()
        const testBusiness: BusinessCandidate = {
            url: 'https://performance-test.co.il',
            name: 'קצביית המהירות',
            description: 'בדיקת ביצועים',
            location: 'תל אביב'
        }
        
        const startTime = Date.now()
        const result = await validator.validateMeatBusiness(testBusiness)
        const endTime = Date.now()
        
        const executionTime = endTime - startTime
        expect(executionTime).toBeLessThan(1000) // Should complete within 1 second
        expect(result).toBeDefined()
    })

    test('should handle Hebrew processing efficiently', () => {
        const hebrewProcessor = new HebrewProcessor()
        const longHebrewText = 'קצביית המובחר '.repeat(100) + 'בשר איכות פרמיום '.repeat(100)
        
        const startTime = Date.now()
        const quality = hebrewProcessor.calculateHebrewQuality(longHebrewText)
        const endTime = Date.now()
        
        const executionTime = endTime - startTime
        expect(executionTime).toBeLessThan(100) // Should complete within 100ms
        expect(quality).toBeGreaterThan(0)
    })
})

// Error Handling Tests
describe('Discovery Engine Error Handling', () => {
    test('should handle invalid URLs gracefully', async () => {
        const discoveryEngine = new DiscoveryEngine()
        const invalidBusiness: BusinessCandidate = {
            url: 'invalid-url',
            name: 'Test Business'
        }
        
        const result = await discoveryEngine.validateSingleSource(invalidBusiness)
        expect(result.isValid).toBe(false)
        expect(result.reasons).toContain('URL does not suggest meat business')
    })

    test('should handle empty input gracefully', async () => {
        const hebrewProcessor = new HebrewProcessor()
        
        expect(hebrewProcessor.normalize('')).toBe('')
        expect(hebrewProcessor.hasHebrewText('')).toBe(false)
        expect(hebrewProcessor.extractMeatTerms('')).toEqual([])
        expect(hebrewProcessor.calculateHebrewQuality('')).toBe(0)
    })
})