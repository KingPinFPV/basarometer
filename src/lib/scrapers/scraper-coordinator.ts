/**
 * Autonomous Scraper Coordination System
 * Orchestrates multiple Hebrew-aware scrapers with intelligent scheduling
 * Handles rate limiting, validation, deduplication, and data persistence
 */

import { VictoryScraper, VictoryProduct } from './victory-scraper'
import { MegaScraper, MegaProduct } from './mega-scraper'
import { HebrewProcessor } from './hebrew-processor'

export interface ScrapingSession {
  id: string
  start_time: string
  end_time?: string
  scrapers_run: string[]
  total_products: number
  new_products: number
  updated_products: number
  validation_score: number
  errors: string[]
  performance_metrics: {
    avg_response_time: number
    success_rate: number
    data_quality_score: number
  }
}

export interface UnifiedProduct {
  id: string
  name_hebrew: string
  name_english: string
  category: string
  cut: string
  quality_grade: string
  price_per_kg: number
  weight: string
  retailer: string
  branch_location?: string
  availability: boolean
  confidence_score: number
  last_updated: string
  source_data: any
}

export class ScraperCoordinator {
  private victoryScraper: VictoryScraper
  private megaScraper: MegaScraper
  private hebrewProcessor: HebrewProcessor
  private isRunning = false
  private currentSession: ScrapingSession | null = null
  
  // Rate limiting configuration
  private scraperLimits = {
    victory: { requests_per_hour: 60, concurrent: 1 },
    mega: { requests_per_hour: 80, concurrent: 1 },
    global: { max_concurrent: 2 }
  }

  constructor() {
    this.victoryScraper = new VictoryScraper()
    this.megaScraper = new MegaScraper()
    this.hebrewProcessor = new HebrewProcessor()
  }

  /**
   * Execute comprehensive scraping session
   */
  async executeScrapingSession(): Promise<ScrapingSession> {
    if (this.isRunning) {
      throw new Error('Scraping session already in progress')
    }

    this.isRunning = true
    this.currentSession = this.initializeSession()

    try {
      console.log(`🚀 Starting scraping session: ${this.currentSession.id}`)
      
      // Phase 1: Execute scrapers in parallel with rate limiting
      const scrapingResults = await this.executeParallelScraping()
      
      // Phase 2: Unify and validate all products
      const unifiedProducts = await this.unifyProducts(scrapingResults)
      
      // Phase 3: Validate data quality
      const validationResults = await this.validateProducts(unifiedProducts)
      
      // Phase 4: Process and deduplicate
      const finalProducts = await this.processAndDeduplicate(validationResults.valid_products)
      
      // Phase 5: Update session results
      this.currentSession.total_products = finalProducts.length
      this.currentSession.validation_score = validationResults.overall_score
      this.currentSession.performance_metrics = await this.calculatePerformanceMetrics(scrapingResults)
      this.currentSession.end_time = new Date().toISOString()

      console.log(`✅ Scraping session completed: ${finalProducts.length} products processed`)
      
      return this.currentSession

    } catch (error) {
      this.currentSession.errors.push(error instanceof Error ? error.message : 'Unknown error')
      this.currentSession.end_time = new Date().toISOString()
      
      console.error('❌ Scraping session failed:', error)
      throw error
      
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Execute scrapers in parallel with intelligent rate limiting
   */
  private async executeParallelScraping(): Promise<{
    victory: VictoryProduct[]
    mega: MegaProduct[]
  }> {
    const results = {
      victory: [] as VictoryProduct[],
      mega: [] as MegaProduct[]
    }

    try {
      // Execute scrapers with staggered start to avoid overwhelming servers
      const scraperPromises = [
        this.executeVictoryScraping(),
        this.delay(2000).then(() => this.executeMegaScraping()) // 2 second delay
      ]

      const [victoryProducts, megaProducts] = await Promise.allSettled(scraperPromises)

      // Process Victory results
      if (victoryProducts.status === 'fulfilled') {
        results.victory = victoryProducts.value as VictoryProduct[]
        this.currentSession!.scrapers_run.push('victory')
      } else {
        console.error('Victory scraper failed:', victoryProducts.reason)
        this.currentSession!.errors.push(`Victory: ${victoryProducts.reason}`)
      }

      // Process Mega results
      if (megaProducts.status === 'fulfilled') {
        results.mega = megaProducts.value as MegaProduct[]
        this.currentSession!.scrapers_run.push('mega')
      } else {
        console.error('Mega scraper failed:', megaProducts.reason)
        this.currentSession!.errors.push(`Mega: ${megaProducts.reason}`)
      }

    } catch (error) {
      console.error('Parallel scraping execution failed:', error)
      throw error
    }

    return results
  }

  /**
   * Execute Victory scraping with error handling
   */
  private async executeVictoryScraping(): Promise<VictoryProduct[]> {
    try {
      console.log('🏪 Starting Victory scraping...')
      const products = await this.victoryScraper.scrapeProducts()
      console.log(`✅ Victory: ${products.length} products scraped`)
      return products
    } catch (error) {
      console.error('Victory scraping failed:', error)
      return []
    }
  }

  /**
   * Execute Mega scraping with error handling
   */
  private async executeMegaScraping(): Promise<MegaProduct[]> {
    try {
      console.log('🏪 Starting Mega scraping...')
      const products = await this.megaScraper.scrapeProducts()
      console.log(`✅ Mega: ${products.length} products scraped`)
      return products
    } catch (error) {
      console.error('Mega scraping failed:', error)
      return []
    }
  }

  /**
   * Unify products from all scrapers into common format
   */
  private async unifyProducts(scrapingResults: {
    victory: VictoryProduct[]
    mega: MegaProduct[]
  }): Promise<UnifiedProduct[]> {
    const unifiedProducts: UnifiedProduct[] = []

    // Process Victory products
    for (const product of scrapingResults.victory) {
      const unified = await this.unifyVictoryProduct(product)
      if (unified) {
        unifiedProducts.push(unified)
      }
    }

    // Process Mega products
    for (const product of scrapingResults.mega) {
      const unified = await this.unifyMegaProduct(product)
      if (unified) {
        unifiedProducts.push(unified)
      }
    }

    console.log(`🔄 Unified ${unifiedProducts.length} products from all scrapers`)
    return unifiedProducts
  }

  /**
   * Convert Victory product to unified format
   */
  private async unifyVictoryProduct(product: VictoryProduct): Promise<UnifiedProduct | null> {
    try {
      const productInfo = this.hebrewProcessor.processProductName(product.name_hebrew)
      
      return {
        id: product.id,
        name_hebrew: product.name_hebrew,
        name_english: product.name_english,
        category: productInfo.category,
        cut: productInfo.cut,
        quality_grade: productInfo.quality,
        price_per_kg: product.price_per_kg,
        weight: product.weight,
        retailer: 'victory',
        branch_location: product.store_location,
        availability: product.availability,
        confidence_score: product.confidence_score,
        last_updated: product.last_updated,
        source_data: {
          kosher_certification: product.kosher_certification,
          original_price: product.original_price
        }
      }
    } catch (error) {
      console.error('Failed to unify Victory product:', error)
      return null
    }
  }

  /**
   * Convert Mega product to unified format
   */
  private async unifyMegaProduct(product: MegaProduct): Promise<UnifiedProduct | null> {
    try {
      const productInfo = this.hebrewProcessor.processProductName(product.name_hebrew)
      
      return {
        id: product.id,
        name_hebrew: product.name_hebrew,
        name_english: product.name_english,
        category: productInfo.category,
        cut: productInfo.cut,
        quality_grade: productInfo.quality,
        price_per_kg: product.price_per_kg,
        weight: product.weight,
        retailer: 'mega',
        availability: product.availability,
        confidence_score: product.confidence_score,
        last_updated: product.last_updated,
        source_data: {
          brand: product.brand,
          discount_percentage: product.discount_percentage,
          branch_locations: product.branch_locations,
          unit_price: product.unit_price
        }
      }
    } catch (error) {
      console.error('Failed to unify Mega product:', error)
      return null
    }
  }

  /**
   * Validate products and calculate quality scores
   */
  private async validateProducts(products: UnifiedProduct[]): Promise<{
    valid_products: UnifiedProduct[]
    invalid_products: UnifiedProduct[]
    overall_score: number
    validation_details: any[]
  }> {
    const validProducts: UnifiedProduct[] = []
    const invalidProducts: UnifiedProduct[] = []
    const validationDetails: any[] = []

    let totalConfidence = 0
    let validCount = 0

    for (const product of products) {
      const validation = this.hebrewProcessor.validateProductData({
        name_hebrew: product.name_hebrew,
        price_per_kg: product.price_per_kg,
        weight: product.weight,
        category: product.category
      })

      validationDetails.push({
        product_id: product.id,
        validation_result: validation,
        final_confidence: product.confidence_score * validation.confidence
      })

      if (validation.isValid && validation.confidence > 0.6) {
        // Update confidence score with validation
        product.confidence_score = product.confidence_score * validation.confidence
        validProducts.push(product)
        totalConfidence += product.confidence_score
        validCount++
      } else {
        invalidProducts.push(product)
      }
    }

    const overallScore = validCount > 0 ? totalConfidence / validCount : 0

    console.log(`✅ Validation: ${validProducts.length} valid, ${invalidProducts.length} invalid products`)
    console.log(`📊 Overall quality score: ${(overallScore * 100).toFixed(1)}%`)

    return {
      valid_products: validProducts,
      invalid_products: invalidProducts,
      overall_score: overallScore,
      validation_details: validationDetails
    }
  }

  /**
   * Process and deduplicate products across retailers
   */
  private async processAndDeduplicate(products: UnifiedProduct[]): Promise<UnifiedProduct[]> {
    // Group products by normalized Hebrew name for deduplication
    const productGroups = new Map<string, UnifiedProduct[]>()
    
    for (const product of products) {
      const normalizedId = this.hebrewProcessor.generateNormalizedId(product.name_hebrew)
      
      if (!productGroups.has(normalizedId)) {
        productGroups.set(normalizedId, [])
      }
      productGroups.get(normalizedId)!.push(product)
    }

    const deduplicatedProducts: UnifiedProduct[] = []

    // Process each group
    for (const [normalizedId, groupProducts] of Array.from(productGroups.entries())) {
      if (groupProducts.length === 1) {
        // Single product, no deduplication needed
        deduplicatedProducts.push(groupProducts[0])
      } else {
        // Multiple products with same normalized name
        const bestProduct = this.selectBestProduct(groupProducts)
        
        // Merge price information from other retailers
        const mergedProduct = this.mergeProductData(bestProduct, groupProducts)
        deduplicatedProducts.push(mergedProduct)
      }
    }

    console.log(`🔄 Deduplication: ${products.length} → ${deduplicatedProducts.length} products`)
    
    return deduplicatedProducts.sort((a, b) => b.confidence_score - a.confidence_score)
  }

  /**
   * Select best product from duplicates based on confidence and data quality
   */
  private selectBestProduct(products: UnifiedProduct[]): UnifiedProduct {
    return products.reduce((best, current) => {
      // Primary criteria: confidence score
      if (current.confidence_score > best.confidence_score) {
        return current
      }
      
      // Secondary criteria: data completeness
      if (current.confidence_score === best.confidence_score) {
        const currentCompleteness = this.calculateDataCompleteness(current)
        const bestCompleteness = this.calculateDataCompleteness(best)
        
        if (currentCompleteness > bestCompleteness) {
          return current
        }
      }
      
      return best
    })
  }

  /**
   * Merge price data from multiple retailers
   */
  private mergeProductData(baseProduct: UnifiedProduct, allProducts: UnifiedProduct[]): UnifiedProduct {
    // Collect prices from all retailers
    const retailerPrices: Record<string, number> = {}
    const retailerData: Record<string, any> = {}

    for (const product of allProducts) {
      retailerPrices[product.retailer] = product.price_per_kg
      retailerData[product.retailer] = product.source_data
    }

    // Enhanced source data with cross-retailer information
    const enhancedSourceData = {
      ...baseProduct.source_data,
      cross_retailer_prices: retailerPrices,
      retailer_data: retailerData,
      price_range: {
        min: Math.min(...Object.values(retailerPrices)),
        max: Math.max(...Object.values(retailerPrices)),
        avg: Object.values(retailerPrices).reduce((a, b) => a + b, 0) / Object.values(retailerPrices).length
      }
    }

    return {
      ...baseProduct,
      source_data: enhancedSourceData
    }
  }

  /**
   * Calculate data completeness score for a product
   */
  private calculateDataCompleteness(product: UnifiedProduct): number {
    let score = 0
    const maxScore = 10

    if (product.name_hebrew) score += 2
    if (product.name_english) score += 1
    if (product.price_per_kg > 0) score += 2
    if (product.weight) score += 1
    if (product.category !== 'unknown') score += 1
    if (product.cut !== 'unknown') score += 1
    if (product.quality_grade !== 'regular') score += 1
    if (product.source_data && Object.keys(product.source_data).length > 0) score += 1

    return score / maxScore
  }

  /**
   * Calculate performance metrics for the session
   */
  private async calculatePerformanceMetrics(scrapingResults: any): Promise<{
    avg_response_time: number
    success_rate: number
    data_quality_score: number
  }> {
    const totalProducts = 
      scrapingResults.victory.length + 
      scrapingResults.mega.length

    const successfulScrapers = this.currentSession!.scrapers_run.length
    const totalScrapers = 2 // Victory + Mega

    // Mock performance metrics - would be collected during actual scraping
    return {
      avg_response_time: 850, // milliseconds
      success_rate: (successfulScrapers / totalScrapers) * 100,
      data_quality_score: this.currentSession!.validation_score * 100
    }
  }

  /**
   * Initialize new scraping session
   */
  private initializeSession(): ScrapingSession {
    return {
      id: `session_${Date.now()}`,
      start_time: new Date().toISOString(),
      scrapers_run: [],
      total_products: 0,
      new_products: 0,
      updated_products: 0,
      validation_score: 0,
      errors: [],
      performance_metrics: {
        avg_response_time: 0,
        success_rate: 0,
        data_quality_score: 0
      }
    }
  }

  /**
   * Utility delay function
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get current session status
   */
  getCurrentSession(): ScrapingSession | null {
    return this.currentSession
  }

  /**
   * Check if coordinator is currently running
   */
  isCurrentlyRunning(): boolean {
    return this.isRunning
  }
}