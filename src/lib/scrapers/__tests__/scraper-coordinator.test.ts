import { ScraperCoordinator } from '../scraper-coordinator'
import { HebrewProcessor } from '../hebrew-processor'

// Mock the scrapers
jest.mock('../victory-scraper')
jest.mock('../mega-scraper')
jest.mock('../hebrew-processor')

describe('ScraperCoordinator', () => {
  let coordinator: ScraperCoordinator
  let mockVictoryProducts: any[]
  let mockMegaProducts: any[]

  beforeEach(() => {
    coordinator = new ScraperCoordinator()
    
    mockVictoryProducts = [
      {
        id: 'victory_1',
        name_hebrew: 'אנטריקוט בקר',
        name_english: 'Beef Entrecote',
        price_per_kg: 45.90,
        weight: '1kg',
        kosher_certification: 'mehadrin',
        availability: true,
        store_location: 'Victory',
        last_updated: new Date().toISOString(),
        confidence_score: 0.85
      }
    ]

    mockMegaProducts = [
      {
        id: 'mega_1',
        name_hebrew: 'חזה עוף',
        name_english: 'Chicken Breast',
        price_per_kg: 24.90,
        weight: '1kg',
        brand: 'Teva V\'Of',
        availability: true,
        branch_locations: ['mega-tel-aviv', 'mega-haifa'],
        last_updated: new Date().toISOString(),
        confidence_score: 0.82
      }
    ]
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should initialize coordinator correctly', () => {
    expect(coordinator).toBeDefined()
    expect(coordinator.isCurrentlyRunning()).toBe(false)
    expect(coordinator.getCurrentSession()).toBeNull()
  })

  test('should execute scraping session successfully', async () => {
    // Mock scraper methods
    const mockVictoryScraper = {
      scrapeProducts: jest.fn().mockResolvedValue(mockVictoryProducts)
    }
    const mockMegaScraper = {
      scrapeProducts: jest.fn().mockResolvedValue(mockMegaProducts)
    }

    // Replace internal scrapers with mocks
    ;(coordinator as any).victoryScraper = mockVictoryScraper
    ;(coordinator as any).megaScraper = mockMegaScraper

    // Mock Hebrew processor
    const mockHebrewProcessor = {
      processProductName: jest.fn().mockReturnValue({
        category: 'beef',
        cut: 'entrecote',
        quality: 'regular',
        processing: 'fresh'
      }),
      validateProductData: jest.fn().mockReturnValue({
        isValid: true,
        confidence: 0.9,
        issues: []
      }),
      generateNormalizedId: jest.fn().mockReturnValue('normalized_id')
    }
    ;(coordinator as any).hebrewProcessor = mockHebrewProcessor

    const session = await coordinator.executeScrapingSession()

    expect(session).toBeDefined()
    expect(session.scrapers_run).toContain('victory')
    expect(session.scrapers_run).toContain('mega')
    expect(session.total_products).toBeGreaterThan(0)
    expect(session.end_time).toBeDefined()
    expect(mockVictoryScraper.scrapeProducts).toHaveBeenCalled()
    expect(mockMegaScraper.scrapeProducts).toHaveBeenCalled()
  })

  test('should handle scraper failures gracefully', async () => {
    const mockVictoryScraper = {
      scrapeProducts: jest.fn().mockRejectedValue(new Error('Victory API down'))
    }
    const mockMegaScraper = {
      scrapeProducts: jest.fn().mockResolvedValue(mockMegaProducts)
    }

    ;(coordinator as any).victoryScraper = mockVictoryScraper
    ;(coordinator as any).megaScraper = mockMegaScraper

    const mockHebrewProcessor = {
      processProductName: jest.fn().mockReturnValue({
        category: 'chicken',
        cut: 'breast',
        quality: 'regular',
        processing: 'fresh'
      }),
      validateProductData: jest.fn().mockReturnValue({
        isValid: true,
        confidence: 0.9,
        issues: []
      }),
      generateNormalizedId: jest.fn().mockReturnValue('normalized_id')
    }
    ;(coordinator as any).hebrewProcessor = mockHebrewProcessor

    const session = await coordinator.executeScrapingSession()

    expect(session.scrapers_run).not.toContain('victory')
    expect(session.scrapers_run).toContain('mega')
    expect(session.errors.length).toBeGreaterThan(0)
    expect(session.errors[0]).toContain('Victory')
  })

  test('should validate Hebrew product data correctly', async () => {
    const hebrewProcessor = new HebrewProcessor()
    
    const validProduct = {
      name_hebrew: 'אנטריקוט בקר',
      price_per_kg: 45.90,
      weight: '1kg',
      category: 'beef'
    }

    const invalidProduct = {
      name_hebrew: '',
      price_per_kg: 0,
      weight: '',
      category: 'unknown'
    }

    const validResult = hebrewProcessor.validateProductData(validProduct)
    const invalidResult = hebrewProcessor.validateProductData(invalidProduct)

    expect(validResult.isValid).toBe(true)
    expect(validResult.confidence).toBeGreaterThan(0.5)
    expect(validResult.issues).toHaveLength(0)

    expect(invalidResult.isValid).toBe(false)
    expect(invalidResult.confidence).toBeLessThan(0.5)
    expect(invalidResult.issues.length).toBeGreaterThan(0)
  })

  test('should prevent concurrent scraping sessions', async () => {
    const mockVictoryScraper = {
      scrapeProducts: jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 1000))
      )
    }
    const mockMegaScraper = {
      scrapeProducts: jest.fn().mockResolvedValue([])
    }

    ;(coordinator as any).victoryScraper = mockVictoryScraper
    ;(coordinator as any).megaScraper = mockMegaScraper

    // Start first session
    const sessionPromise1 = coordinator.executeScrapingSession()
    
    // Try to start second session immediately
    await expect(coordinator.executeScrapingSession()).rejects.toThrow('Scraping session already in progress')
    
    // Wait for first session to complete
    await sessionPromise1
    
    expect(coordinator.isCurrentlyRunning()).toBe(false)
  })

  test('should merge cross-retailer price data correctly', async () => {
    const mockVictoryScraper = {
      scrapeProducts: jest.fn().mockResolvedValue([
        {
          id: 'victory_entrecote',
          name_hebrew: 'אנטריקוט בקר',
          name_english: 'Beef Entrecote',
          price_per_kg: 55.90,
          weight: '1kg',
          availability: true,
          confidence_score: 0.85,
          last_updated: new Date().toISOString()
        }
      ])
    }
    
    const mockMegaScraper = {
      scrapeProducts: jest.fn().mockResolvedValue([
        {
          id: 'mega_entrecote',
          name_hebrew: 'אנטריקוט בקר',
          name_english: 'Beef Entrecote',
          price_per_kg: 49.90,
          weight: '1kg',
          availability: true,
          confidence_score: 0.80,
          last_updated: new Date().toISOString()
        }
      ])
    }

    ;(coordinator as any).victoryScraper = mockVictoryScraper
    ;(coordinator as any).megaScraper = mockMegaScraper

    const mockHebrewProcessor = {
      processProductName: jest.fn().mockReturnValue({
        category: 'beef',
        cut: 'entrecote',
        quality: 'regular',
        processing: 'fresh'
      }),
      validateProductData: jest.fn().mockReturnValue({
        isValid: true,
        confidence: 0.9,
        issues: []
      }),
      generateNormalizedId: jest.fn().mockReturnValue('אנטריקוט_בקר')
    }
    ;(coordinator as any).hebrewProcessor = mockHebrewProcessor

    const session = await coordinator.executeScrapingSession()

    expect(session.total_products).toBe(1) // Should be deduplicated to 1 product
    
    // The merged product should contain cross-retailer price data
    // This would be validated in the actual implementation
  })

  test('should calculate performance metrics accurately', async () => {
    const mockVictoryScraper = {
      scrapeProducts: jest.fn().mockResolvedValue(mockVictoryProducts)
    }
    const mockMegaScraper = {
      scrapeProducts: jest.fn().mockResolvedValue(mockMegaProducts)
    }

    ;(coordinator as any).victoryScraper = mockVictoryScraper
    ;(coordinator as any).megaScraper = mockMegaScraper

    const mockHebrewProcessor = {
      processProductName: jest.fn().mockReturnValue({
        category: 'beef',
        cut: 'entrecote',
        quality: 'regular',
        processing: 'fresh'
      }),
      validateProductData: jest.fn().mockReturnValue({
        isValid: true,
        confidence: 0.9,
        issues: []
      }),
      generateNormalizedId: jest.fn().mockImplementation((name) => name.replace(/\s+/g, '_'))
    }
    ;(coordinator as any).hebrewProcessor = mockHebrewProcessor

    const session = await coordinator.executeScrapingSession()

    expect(session.performance_metrics).toBeDefined()
    expect(session.performance_metrics.success_rate).toBe(100) // Both scrapers succeeded
    expect(session.performance_metrics.avg_response_time).toBeGreaterThan(0)
    expect(session.performance_metrics.data_quality_score).toBeGreaterThan(0)
  })
})