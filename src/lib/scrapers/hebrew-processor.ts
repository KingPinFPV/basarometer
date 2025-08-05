/**
 * Hebrew Text Processing Utility
 * Advanced Hebrew language processing for Israeli retail data
 * Handles RTL text, normalization, validation, and translation
 */

export class HebrewProcessor {
  private hebrewRegex = /[\u0590-\u05FF]/
  private meatTermMappings: Record<string, string>

  constructor() {
    this.meatTermMappings = {
      // Meat types
      'בקר': 'beef',
      'עוף': 'chicken', 
      'כבש': 'lamb',
      'עגל': 'veal',
      'הודו': 'turkey',
      
      // Cuts
      'אנטריקוט': 'entrecote',
      'פילה': 'filet',
      'חזה': 'breast',
      'ירך': 'thigh',
      'כנף': 'wing',
      'שוק': 'drumstick',
      'כתף': 'shoulder',
      'צלעות': 'ribs',
      'קוטלט': 'cutlet',
      'סינטה': 'sirloin',
      'צוואר': 'neck',
      'רגל': 'leg',
      
      // Quality grades
      'פרימיום': 'premium',
      'רגיל': 'regular',
      'אנגוס': 'angus',
      'וואגיו': 'wagyu',
      'אורגני': 'organic',
      'שדה חופשי': 'free_range',
      
      // Processing
      'טחון': 'ground',
      'מעושן': 'smoked',
      'מיושן': 'aged',
      'מתובל': 'seasoned',
      'טרי': 'fresh',
      'קפוא': 'frozen',
      'מבושל': 'cooked',
      'צלוי': 'roasted',
      
      // Units
      'ק״ג': 'kg',
      'קילו': 'kg',
      'גרם': 'gram',
      'ליברה': 'pound',
      'יחידה': 'unit',
      'חבילה': 'package'
    }
  }

  /**
   * Extract Hebrew text from mixed content
   */
  extractHebrewText(text: string): string {
    if (!text) return ''
    
    // Remove HTML tags if present
    const cleanText = text.replace(/<[^>]*>/g, ' ')
    
    // Extract Hebrew characters and common punctuation
    const hebrewMatches = cleanText.match(/[\u0590-\u05FF\s\d.,״""'()]+/g)
    
    if (!hebrewMatches) return ''
    
    return hebrewMatches.join(' ').trim()
  }

  /**
   * Validate if text contains Hebrew characters
   */
  validateHebrewText(text: string): boolean {
    return this.hebrewRegex.test(text)
  }

  /**
   * Normalize Hebrew text spacing and punctuation
   */
  normalizeHebrewText(text: string): string {
    if (!text) return ''
    
    return text
      .replace(/\s+/g, ' ')              // Multiple spaces to single
      .replace(/״/g, '"')                // Hebrew quotes to regular
      .replace(/׳/g, "'")                // Hebrew apostrophe
      .replace(/[,،]/g, ',')             // Various commas to standard
      .trim()
  }

  /**
   * Generate normalized product ID from Hebrew name
   */
  generateNormalizedId(hebrewName: string): string {
    return hebrewName
      .replace(/\s+/g, '_')
      .replace(/[^\u0590-\u05FF\w]/g, '')
      .toLowerCase()
  }

  /**
   * Translate Hebrew meat terms to English using mapping
   */
  async translateToEnglish(hebrewText: string): Promise<string> {
    if (!this.validateHebrewText(hebrewText)) {
      return hebrewText // Return as-is if no Hebrew
    }

    const words = hebrewText.split(/\s+/)
    const translatedWords: string[] = []

    for (const word of words) {
      const cleanWord = word.replace(/[^\u0590-\u05FF]/g, '')
      const translation = this.meatTermMappings[cleanWord]
      
      if (translation) {
        translatedWords.push(translation)
      } else {
        // Keep Hebrew words that don't have translations
        translatedWords.push(word)
      }
    }

    return translatedWords.join(' ').trim()
  }

  /**
   * Process Hebrew meat product name for categorization
   */
  processProductName(hebrewName: string): {
    category: string
    cut: string
    quality: string
    processing: string
    normalized_id: string
  } {
    const normalized = this.normalizeHebrewText(hebrewName)
    const words = normalized.split(/\s+/)
    
    let category = 'unknown'
    let cut = 'unknown'
    let quality = 'regular'
    let processing = 'fresh'

    // Identify category (meat type)
    for (const word of words) {
      if (['בקר', 'beef'].some(term => word.includes(term))) {
        category = 'beef'
        break
      }
      if (['עוף', 'chicken'].some(term => word.includes(term))) {
        category = 'chicken'
        break
      }
      if (['כבש', 'lamb'].some(term => word.includes(term))) {
        category = 'lamb'
        break
      }
      if (['עגל', 'veal'].some(term => word.includes(term))) {
        category = 'veal'
        break
      }
      if (['הודו', 'turkey'].some(term => word.includes(term))) {
        category = 'turkey'
        break
      }
    }

    // Identify cut
    for (const word of words) {
      const cutMapping = this.findCutMapping(word)
      if (cutMapping) {
        cut = cutMapping
        break
      }
    }

    // Identify quality grade
    for (const word of words) {
      if (['פרימיום', 'premium'].some(term => word.includes(term))) {
        quality = 'premium'
        break
      }
      if (['אנגוס', 'angus'].some(term => word.includes(term))) {
        quality = 'angus'
        break
      }
      if (['וואגיו', 'wagyu'].some(term => word.includes(term))) {
        quality = 'wagyu'
        break
      }
      if (['אורגני', 'organic'].some(term => word.includes(term))) {
        quality = 'organic'
        break
      }
    }

    // Identify processing method
    for (const word of words) {
      if (['מעושן', 'smoked'].some(term => word.includes(term))) {
        processing = 'smoked'
        break
      }
      if (['טחון', 'ground'].some(term => word.includes(term))) {
        processing = 'ground'
        break
      }
      if (['מתובל', 'seasoned'].some(term => word.includes(term))) {
        processing = 'seasoned'
        break
      }
    }

    return {
      category,
      cut,
      quality, 
      processing,
      normalized_id: this.generateNormalizedId(normalized)
    }
  }

  /**
   * Find cut mapping from Hebrew word
   */
  private findCutMapping(word: string): string | null {
    const cutMappings: Record<string, string> = {
      'אנטריקוט': 'entrecote',
      'פילה': 'filet',
      'חזה': 'breast',
      'ירך': 'thigh',
      'כנף': 'wing',
      'שוק': 'drumstick',
      'כתף': 'shoulder',
      'צלעות': 'ribs',
      'קוטלט': 'cutlet',
      'סינטה': 'sirloin',
      'צוואר': 'neck',
      'רגל': 'leg'
    }

    for (const [hebrew, english] of Object.entries(cutMappings)) {
      if (word.includes(hebrew)) {
        return english
      }
    }

    return null
  }

  /**
   * Extract price from Hebrew text
   */
  extractPrice(text: string): number {
    if (!text) return 0

    // Israeli price patterns: ₪45.90, 45.90 ₪, 45.90 שח, 45.90
    const pricePatterns = [
      /₪\s*(\d+(?:[,.]?\d{1,2})?)/g,
      /(\d+(?:[,.]?\d{1,2})?)\s*₪/g,
      /(\d+(?:[,.]?\d{1,2})?)\s*שח/g,
      /(\d+(?:[,.]?\d{1,2})?)(?=\s|$)/g
    ]

    for (const pattern of pricePatterns) {
      const match = text.match(pattern)
      if (match) {
        const priceStr = match[0].replace(/[₪שח,\s]/g, '')
        const price = parseFloat(priceStr)
        if (!isNaN(price) && price > 0) {
          return price
        }
      }
    }

    return 0
  }

  /**
   * Validate Hebrew product data completeness
   */
  validateProductData(product: any): {
    isValid: boolean
    confidence: number
    issues: string[]
  } {
    const issues: string[] = []
    let confidence = 1.0

    // Check Hebrew name
    if (!product.name_hebrew || !this.validateHebrewText(product.name_hebrew)) {
      issues.push('Missing or invalid Hebrew name')
      confidence -= 0.3
    }

    // Check price
    if (!product.price_per_kg || product.price_per_kg <= 0) {
      issues.push('Missing or invalid price')
      confidence -= 0.2
    }

    // Check weight
    if (!product.weight) {
      issues.push('Missing weight information')
      confidence -= 0.1
    }

    // Check category
    const processedName = this.processProductName(product.name_hebrew || '')
    if (processedName.category === 'unknown') {
      issues.push('Unable to determine meat category')
      confidence -= 0.2
    }

    return {
      isValid: issues.length === 0,
      confidence: Math.max(0, confidence),
      issues
    }
  }

  /**
   * Format Hebrew text for RTL display
   */
  formatForRTL(text: string): string {
    if (!this.validateHebrewText(text)) {
      return text
    }

    // Add RTL marker for proper rendering
    return `\u202B${text}\u202C`
  }

  /**
   * Clean Hebrew text from retailer-specific formatting
   */
  cleanRetailerText(text: string, retailer: string): string {
    let cleaned = this.normalizeHebrewText(text)

    // Retailer-specific cleaning patterns
    const retailerPatterns: Record<string, RegExp[]> = {
      'victory': [
        /ויקטורי/g,
        /מבצע/g,
        /הנחה/g
      ],
      'mega': [
        /מגא/g,
        /מגא\s*בעש/g
      ],
      'shufersal': [
        /שופרסל/g,
        /של\s*שופרסל/g
      ]
    }

    const patterns = retailerPatterns[retailer] || []
    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '').trim()
    }

    return cleaned
  }
}