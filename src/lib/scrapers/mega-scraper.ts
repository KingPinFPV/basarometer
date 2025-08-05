/**
 * Mega Retail Chain Scraper
 * Advanced Hebrew-aware scraping for Israeli retail chain
 * Market Share: 12.8% - Priority 3
 */

import { HebrewProcessor } from './hebrew-processor'

export interface MegaProduct {
  id: string
  name_hebrew: string
  name_english: string
  price_per_kg: number
  unit_price?: number
  discount_percentage?: number
  weight: string
  brand: string
  availability: boolean
  branch_locations: string[]
  last_updated: string
  confidence_score: number
}

export class MegaScraper {
  private baseUrl = 'https://www.mega.co.il'
  private hebrewProcessor: HebrewProcessor
  private rateLimitMs = 800 // 0.8 second between requests
  
  constructor() {
    this.hebrewProcessor = new HebrewProcessor()
  }

  /**
   * Scrape Mega meat products across all branches
   */
  async scrapeProducts(): Promise<MegaProduct[]> {
    const products: MegaProduct[] = []
    
    try {
      // Mega meat endpoints
      const meatEndpoints = [
        '/categories/meat',
        '/categories/poultry', 
        '/categories/fresh-meat',
        '/categories/processed-meat'
      ]

      for (const endpoint of meatEndpoints) {
        await this.delay(this.rateLimitMs)
        const endpointProducts = await this.scrapeEndpointProducts(endpoint)
        products.push(...endpointProducts)
      }

      // Remove duplicates based on Hebrew name
      const uniqueProducts = this.removeDuplicateProducts(products)
      
      console.log(`Mega Scraper: Successfully scraped ${uniqueProducts.length} products`)
      return uniqueProducts

    } catch (error) {
      console.error('Mega Scraper Error:', error)
      return []
    }
  }

  /**
   * Scrape products from a specific endpoint
   */
  private async scrapeEndpointProducts(endpoint: string): Promise<MegaProduct[]> {
    const products: MegaProduct[] = []
    
    try {
      const url = `${this.baseUrl}${endpoint}`
      
      // Mock Mega product data structure for implementation
      const mockMegaProducts = this.generateMockMegaProducts(endpoint)
      
      for (const productData of mockMegaProducts) {
        const product = await this.processMegaProduct(productData)
        if (product) {
          products.push(product)
        }
      }

    } catch (error) {
      console.error(`Mega Endpoint Scraper Error [${endpoint}]:`, error)
    }

    return products
  }

  /**
   * Process raw Mega product data
   */
  private async processMegaProduct(rawData: any): Promise<MegaProduct | null> {
    try {
      // Extract and clean Hebrew product name
      const hebrewName = this.hebrewProcessor.cleanRetailerText(
        this.hebrewProcessor.extractHebrewText(rawData.title),
        'mega'
      )
      
      if (!hebrewName) return null

      // Process price information
      const priceData = this.extractMegaPricing(rawData)
      if (!priceData.price_per_kg || priceData.price_per_kg <= 0) return null

      // Extract weight/unit information
      const weight = this.extractWeight(rawData.unit || rawData.weight)
      
      // Extract brand information
      const brand = this.extractBrand(rawData.brand || rawData.manufacturer)

      // Process branch availability
      const branchLocations = this.extractBranchLocations(rawData.availability)

      // Generate English translation
      const englishName = await this.hebrewProcessor.translateToEnglish(hebrewName)

      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(
        hebrewName, 
        priceData.price_per_kg, 
        weight, 
        branchLocations.length
      )

      return {
        id: `mega_${this.generateProductId(hebrewName)}`,
        name_hebrew: hebrewName,
        name_english: englishName,
        price_per_kg: priceData.price_per_kg,
        unit_price: priceData.unit_price,
        discount_percentage: priceData.discount_percentage,
        weight: weight,
        brand: brand,
        availability: branchLocations.length > 0,
        branch_locations: branchLocations,
        last_updated: new Date().toISOString(),
        confidence_score: confidenceScore
      }

    } catch (error) {
      console.error('Mega Product Processing Error:', error)
      return null
    }
  }

  /**
   * Extract comprehensive pricing from Mega format
   */
  private extractMegaPricing(rawData: any): {
    price_per_kg: number
    unit_price?: number
    discount_percentage?: number
  } {
    const pricing = {
      price_per_kg: 0,
      unit_price: undefined as number | undefined,
      discount_percentage: undefined as number | undefined
    }

    // Extract main price
    if (rawData.current_price) {
      pricing.price_per_kg = this.hebrewProcessor.extractPrice(rawData.current_price)
    }

    // Extract unit price if different
    if (rawData.unit_price && rawData.unit_price !== rawData.current_price) {
      pricing.unit_price = this.hebrewProcessor.extractPrice(rawData.unit_price)
    }

    // Calculate discount if original price exists
    if (rawData.original_price) {
      const originalPrice = this.hebrewProcessor.extractPrice(rawData.original_price)
      if (originalPrice > pricing.price_per_kg) {
        pricing.discount_percentage = Math.round(
          ((originalPrice - pricing.price_per_kg) / originalPrice) * 100
        )
      }
    }

    return pricing
  }

  /**
   * Extract weight/unit information from Mega format
   */
  private extractWeight(weightText: string): string {
    if (!weightText) return '1kg'
    
    // Mega weight formats
    const weightPatterns = [
      /(\d+(?:\.\d+)?)\s*ק[״\"]*ג/g,     // X ק"ג
      /(\d+(?:\.\d+)?)\s*קילו/g,         // X קילו
      /(\d+(?:\.\d+)?)\s*kg/gi,          // X kg
      /(\d+(?:\.\d+)?)\s*גרם/g,          // X גרם
      /(\d+(?:\.\d+)?)\s*ג[״\"]/g,       // X ג'
      /(\d+(?:\.\d+)?)\s*g/gi,           // X g
      /(\d+)\s*יח[״\"]/g,                 // X יח'
      /(\d+)\s*חתיכות/g                   // X חתיכות
    ]

    for (const pattern of weightPatterns) {
      const match = weightText.match(pattern)
      if (match) {
        return match[0]
      }
    }

    return '1kg'
  }

  /**
   * Extract brand information
   */
  private extractBrand(brandText: string): string {
    if (!brandText) return 'Unknown'
    
    // Clean brand text from Hebrew
    const cleanBrand = this.hebrewProcessor.normalizeHebrewText(brandText)
    
    // Common Israeli meat brands
    const brandMappings: Record<string, string> = {
      'טבע ועוף': 'Teva V\'Of',
      'עולם הטעם': 'Olam HaTaam',
      'מעדני יהודה': 'Maadanei Yehuda',
      'האח הגדול': 'HaAch HaGadol',
      'זוגלובק': 'Zoglovek',
      'תבור': 'Tavor',
      'אל על': 'El Al'
    }

    for (const [hebrew, english] of Object.entries(brandMappings)) {
      if (cleanBrand.includes(hebrew)) {
        return english
      }
    }

    return cleanBrand || 'Unknown'
  }

  /**
   * Extract branch location availability
   */
  private extractBranchLocations(availabilityData: any): string[] {
    if (!availabilityData) return ['mega-general']
    
    // Mock branch processing - would parse actual availability data
    const commonBranches = [
      'mega-tel-aviv',
      'mega-jerusalem', 
      'mega-haifa',
      'mega-beer-sheva',
      'mega-netanya',
      'mega-petah-tikva'
    ]

    // Return random subset for mock data
    const availableBranches = commonBranches.slice(0, Math.floor(Math.random() * 4) + 2)
    return availableBranches
  }

  /**
   * Calculate confidence score for Mega product data
   */
  private calculateConfidenceScore(
    hebrewName: string, 
    price: number, 
    weight: string, 
    branchCount: number
  ): number {
    let score = 0.5 // Base score

    // Hebrew name quality
    if (this.hebrewProcessor.validateHebrewText(hebrewName)) {
      score += 0.15
    }

    // Price reasonableness
    if (price > 8 && price < 400) {
      score += 0.15
    }

    // Weight information present and detailed
    if (weight && weight !== '1kg') {
      score += 0.1
    }

    // Branch availability (more branches = higher confidence)
    score += Math.min(0.1, branchCount * 0.02)

    return Math.min(1.0, score)
  }

  /**
   * Remove duplicate products based on Hebrew name similarity
   */
  private removeDuplicateProducts(products: MegaProduct[]): MegaProduct[] {
    const uniqueMap = new Map<string, MegaProduct>()
    
    for (const product of products) {
      const normalizedName = this.hebrewProcessor.generateNormalizedId(product.name_hebrew)
      
      // Keep product with higher confidence score
      const existing = uniqueMap.get(normalizedName)
      if (!existing || product.confidence_score > existing.confidence_score) {
        uniqueMap.set(normalizedName, product)
      }
    }
    
    return Array.from(uniqueMap.values())
  }

  /**
   * Generate consistent product ID
   */
  private generateProductId(hebrewName: string): string {
    return hebrewName
      .replace(/\s+/g, '_')
      .replace(/[^\u0590-\u05FF\w]/g, '')
      .toLowerCase()
      .substring(0, 32)
  }

  /**
   * Rate limiting delay
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Generate mock Mega products for testing
   */
  private generateMockMegaProducts(endpoint: string): any[] {
    const mockProducts: Record<string, any[]> = {
      '/categories/meat': [
        {
          title: 'אנטריקוט בקר מגא פרימיום',
          current_price: '₪59.90',
          original_price: '₪68.90',
          unit: '1 ק"ג',
          brand: 'מעדני יהודה',
          availability: { branches: 5 }
        },
        {
          title: 'פילה בקר איכות מעולה',
          current_price: '₪89.90',
          unit: '800 גרם',
          brand: 'תבור',
          availability: { branches: 3 }
        },
        {
          title: 'סטייק סינטה בקר',
          current_price: '₪49.90',
          original_price: '₪54.90',
          unit: '1 ק"ג',
          brand: 'האח הגדול',
          availability: { branches: 6 }
        }
      ],
      '/categories/poultry': [
        {
          title: 'חזה עוף טרי מגא',
          current_price: '₪28.90',
          unit: '1 ק"ג',
          brand: 'טבע ועוף',
          availability: { branches: 8 }
        },
        {
          title: 'כנפי עוף טריות',
          current_price: '₪24.90',
          original_price: '₪27.90',
          unit: '1.2 ק"ג',
          brand: 'עולם הטעם',
          availability: { branches: 4 }
        },
        {
          title: 'ירכיים עוף ללא עור',
          current_price: '₪19.90',
          unit: '1 ק"ג',
          brand: 'טבע ועוף',
          availability: { branches: 7 }
        }
      ],
      '/categories/fresh-meat': [
        {
          title: 'כבש קוטלט איכות גבוהה',
          current_price: '₪79.90',
          unit: '600 גרם',
          brand: 'מעדני יהודה',
          availability: { branches: 3 }
        },
        {
          title: 'עגל קוטלט פרימיום',
          current_price: '₪98.90',
          unit: '500 גרם',
          brand: 'תבור',
          availability: { branches: 2 }
        }
      ],
      '/categories/processed-meat': [
        {
          title: 'נקניק בקר מגא',
          current_price: '₪45.90',
          unit: '400 גרם',
          brand: 'זוגלובק',
          availability: { branches: 6 }
        },
        {
          title: 'המבורגר עוף טרי',
          current_price: '₪32.90',
          original_price: '₪36.90',
          unit: '4 יח׳',
          brand: 'עולם הטעם',
          availability: { branches: 5 }
        },
        {
          title: 'קבב בקר וכבש',
          current_price: '₪52.90',
          unit: '6 יח׳',
          brand: 'האח הגדול',
          availability: { branches: 4 }
        }
      ]
    }

    return mockProducts[endpoint] || []
  }
}