// Hebrew Product Normalization & Semantic Matching Engine
// Phase 0: Intelligent Product Matching System for Basarometer V6.0
// Solves the critical issue of duplicate products from different networks

export interface NormalizedProduct {
  normalized_name: string
  brand: string | null
  product_type: string
  weight_info: string | null
  quality_grade: string | null
  original_name: string
  confidence_score: number
}

export interface ProductMatch {
  master_id: string
  master_name: string
  products: {
    id: string
    name: string
    network: string
    price: number
    original_data: Record<string, unknown>
  }[]
  confidence_score: number
  category: string
}

// Hebrew text normalization patterns
const HEBREW_NORMALIZATION_PATTERNS = {
  // Weight normalization
  weights: [
    { pattern: /ק[״'''"\"]*ג/g, replacement: 'קילו' },
    { pattern: /קילו?גרם/g, replacement: 'קילו' },
    { pattern: /1000\s*גר[״'''"\"]*?ם/g, replacement: 'קילו' },
    { pattern: /גר[״'''"\"]*ם/g, replacement: 'גרם' },
    { pattern: /ק״ג/g, replacement: 'קילו' }
  ],
  
  // Common Hebrew product terms
  products: [
    { pattern: /כנפיים?\s+עוף/g, replacement: 'כנפיים עוף' },
    { pattern: /כנפי\s+עוף/g, replacement: 'כנפיים עוף' },
    { pattern: /כנפיים?\s+של?\s+עוף/g, replacement: 'כנפיים עוף' },
    { pattern: /בשר\s+טחון/g, replacement: 'בשר טחון' },
    { pattern: /בקר\s+טחון/g, replacement: 'בשר טחון בקר' },
    { pattern: /בשר\s+כתוש/g, replacement: 'בשר טחון' },
    { pattern: /אנטריקו[טת]/g, replacement: 'אנטריקוט' },
    { pattern: /פילה?/g, replacement: 'פילה' },
    { pattern: /צלעות?/g, replacement: 'צלעות' },
    { pattern: /שווארמה?/g, replacement: 'שווארמה' },
    { pattern: /קבב/g, replacement: 'קבב' },
    { pattern: /קופתאות?/g, replacement: 'קופתאות' }
  ],
  
  // Brand normalization
  brands: [
    { pattern: /מעולה/g, replacement: 'מעולה' },
    { pattern: /גוד\s+מיט/g, replacement: 'גוד מיט' },
    { pattern: /רמת\s+הגולן/g, replacement: 'רמת הגולן' },
    { pattern: /עוף\s+טוב/g, replacement: 'עוף טוב' },
    { pattern: /זוגלובק/g, replacement: 'זוגלובק' },
    { pattern: /טבעי/g, replacement: 'טבעי' }
  ],
  
  // Quality grades
  qualities: [
    { pattern: /פרי?מיום/g, replacement: 'פרמיום' },
    { pattern: /אנ?גוס/g, replacement: 'אנגוס' },
    { pattern: /וואגיו/g, replacement: 'וואגיו' },
    { pattern: /עגל/g, replacement: 'עגל' },
    { pattern: /ביו/g, replacement: 'אורגני' },
    { pattern: /אורגנ[יה]/g, replacement: 'אורגני' }
  ],
  
  // Cleaning patterns
  cleanup: [
    { pattern: /\s+/g, replacement: ' ' }, // Multiple spaces
    { pattern: /^\s+|\s+$/g, replacement: '' }, // Trim
    { pattern: /[״'''"\"]/g, replacement: '' }, // Hebrew quotes
    { pattern: /\s*-\s*/g, replacement: ' ' }, // Dashes
    { pattern: /\s*,\s*/g, replacement: ' ' }, // Commas
    { pattern: /\./g, replacement: '' } // Periods
  ]
}

// Hebrew meat categories for classification
const MEAT_CATEGORIES = {
  'עוף': ['עוף', 'כנפיים', 'חזה', 'שוק', 'ירך', 'שלם', 'פרגית'],
  'בקר': ['בקר', 'בשר טחון', 'אנטריקוט', 'פילה', 'צלעות', 'כתף', 'שק'],
  'עגל': ['עגל', 'צווארון עגל', 'כבד עגל', 'לשון עגל'],
  'כבש': ['כבש', 'כבשה', 'צלעות כבש', 'ירך כבש'],
  'חזיר': ['בייקון', 'נקניק', 'חזיר'],
  'מעובד': ['שווארמה', 'קבב', 'קופתאות', 'נקניק', 'נקניקיות']
}

// Brand recognition patterns
const BRAND_PATTERNS = [
  /^(מעולה|גוד מיט|רמת הגולן|עוף טוב|זוגלובק|טבעי|כרמל|אסם|שטראוס)\s+/,
  /\s+(מעולה|גוד מיט|רמת הגולן|עוף טוב|זוגלובק|טבעי|כרמל|אסם|שטראוס)$/
]

/**
 * Normalizes Hebrew product name for comparison
 */
export function normalizeHebrewProductName(productName: string): NormalizedProduct {
  if (!productName || typeof productName !== 'string') {
    return {
      normalized_name: '',
      brand: null,
      product_type: '',
      weight_info: null,
      quality_grade: null,
      original_name: productName,
      confidence_score: 0
    }
  }

  let normalized = productName.toLowerCase()
  let brand: string | null = null
  let weightInfo: string | null = null
  let qualityGrade: string | null = null
  let confidenceScore = 0.8

  // Extract brand information
  for (const pattern of BRAND_PATTERNS) {
    const brandMatch = normalized.match(pattern)
    if (brandMatch) {
      brand = brandMatch[1] || brandMatch[0].trim()
      normalized = normalized.replace(pattern, ' ').trim()
      confidenceScore += 0.1
      break
    }
  }

  // Extract weight information
  const weightMatch = normalized.match(/(\d+\.?\d*)\s*(קילו|גרם|ק״ג|ק''ג)/g)
  if (weightMatch) {
    weightInfo = weightMatch[0]
    confidenceScore += 0.05
  }

  // Extract quality grade
  for (const quality of HEBREW_NORMALIZATION_PATTERNS.qualities) {
    if (quality.pattern.test(normalized)) {
      qualityGrade = quality.replacement
      normalized = normalized.replace(quality.pattern, ' ').trim()
      confidenceScore += 0.05
      break
    }
  }

  // Apply normalization patterns
  for (const patternGroup of Object.values(HEBREW_NORMALIZATION_PATTERNS)) {
    for (const { pattern, replacement } of patternGroup) {
      normalized = normalized.replace(pattern, replacement)
    }
  }

  // Determine product category
  let productType = 'לא מזוהה'
  for (const [category, keywords] of Object.entries(MEAT_CATEGORIES)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      productType = category
      confidenceScore += 0.1
      break
    }
  }

  return {
    normalized_name: normalized.trim(),
    brand,
    product_type: productType,
    weight_info: weightInfo,
    quality_grade: qualityGrade,
    original_name: productName,
    confidence_score: Math.min(confidenceScore, 1.0)
  }
}

/**
 * Calculates similarity between two normalized product names using Hebrew-aware fuzzy matching
 */
export function calculateHebrewSimilarity(name1: string, name2: string): number {
  if (!name1 || !name2) return 0
  
  const normalized1 = name1.toLowerCase().trim()
  const normalized2 = name2.toLowerCase().trim()
  
  // Exact match
  if (normalized1 === normalized2) return 1.0
  
  // Calculate Levenshtein distance for Hebrew
  const distance = hebrewLevenshteinDistance(normalized1, normalized2)
  const maxLength = Math.max(normalized1.length, normalized2.length)
  
  if (maxLength === 0) return 1.0
  
  const similarity = 1 - (distance / maxLength)
  
  // Bonus for Hebrew word order (RTL considerations)
  const words1 = normalized1.split(/\s+/)
  const words2 = normalized2.split(/\s+/)
  
  const wordOverlap = words1.filter(word => 
    words2.some(word2 => hebrewLevenshteinDistance(word, word2) <= 1)
  ).length
  
  const wordBonus = wordOverlap / Math.max(words1.length, words2.length) * 0.2
  
  return Math.min(similarity + wordBonus, 1.0)
}

/**
 * Hebrew-aware Levenshtein distance calculation
 */
function hebrewLevenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }
  
  return matrix[str2.length][str1.length]
}

/**
 * Groups products by semantic similarity to create unified comparison rows
 */
export function groupProductsBySemanticSimilarity(
  products: Array<{
    id: string
    name: string
    network: string
    price: number
    [key: string]: unknown
  }>,
  similarityThreshold = 0.75
): ProductMatch[] {
  const normalized = products.map(product => ({
    ...product,
    normalized: normalizeHebrewProductName(product.name)
  }))
  
  const groups: ProductMatch[] = []
  const processed = new Set<string>()
  
  for (const product of normalized) {
    if (processed.has(product.id)) continue
    
    const group: ProductMatch = {
      master_id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      master_name: product.normalized.normalized_name || product.name,
      products: [{...product, original_data: product}],
      confidence_score: product.normalized.confidence_score,
      category: product.normalized.product_type
    }
    
    processed.add(product.id)
    
    // Find similar products
    for (const otherProduct of normalized) {
      if (processed.has(otherProduct.id)) continue
      
      const similarity = calculateHebrewSimilarity(
        product.normalized.normalized_name,
        otherProduct.normalized.normalized_name
      )
      
      // Also check if they have the same product type and similar characteristics
      const sameCategory = product.normalized.product_type === otherProduct.normalized.product_type
      const similarQuality = product.normalized.quality_grade === otherProduct.normalized.quality_grade
      
      if (similarity >= similarityThreshold && sameCategory) {
        group.products.push({...otherProduct, original_data: otherProduct})
        processed.add(otherProduct.id)
        
        // Adjust confidence based on group size and quality match
        if (similarQuality) {
          group.confidence_score = Math.min(group.confidence_score + 0.05, 1.0)
        }
      }
    }
    
    groups.push(group)
  }
  
  // Sort groups by confidence and then by number of networks
  return groups.sort((a, b) => {
    const confidenceDiff = b.confidence_score - a.confidence_score
    if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff
    return b.products.length - a.products.length
  })
}

/**
 * Creates master comparison data for unified product rows
 */
export function createMasterComparisonData(productGroups: ProductMatch[]) {
  return productGroups.map(group => {
    const networkPrices: Record<string, number> = {}
    const networks = new Set<string>()
    
    // Collect prices from all networks for this product group
    group.products.forEach(product => {
      networkPrices[product.network] = product.price
      networks.add(product.network)
    })
    
    const prices = Object.values(networkPrices).filter(p => p > 0)
    const bestPrice = prices.length > 0 ? Math.min(...prices) : 0
    const worstPrice = prices.length > 0 ? Math.max(...prices) : 0
    const avgPrice = prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0
    const savingsPotential = worstPrice > 0 ? ((worstPrice - bestPrice) / worstPrice) * 100 : 0
    
    return {
      id: group.master_id,
      name_hebrew: group.master_name,
      name_english: group.products[0]?.name || '', // Fallback
      category: group.category,
      best_price: bestPrice,
      worst_price: worstPrice,
      avg_price: avgPrice,
      network_prices: networkPrices,
      availability: networks.size,
      savings_potential: savingsPotential,
      confidence_score: group.confidence_score,
      matched_products: group.products.length,
      networks_available: Array.from(networks)
    }
  })
}

/**
 * Enhanced product matching with additional intelligence
 */
export function enhancedProductMatching(
  products: Array<{
    id: string
    name: string
    network: string
    price: number
    category?: string
    brand?: string
    [key: string]: unknown
  }>,
  options: {
    similarityThreshold?: number
    requireSameCategory?: boolean
    brandAwareness?: boolean
  } = {}
): ProductMatch[] {
  const {
    similarityThreshold = 0.75,
    requireSameCategory = true,
    brandAwareness = true
  } = options
  
  const normalized = products.map(product => {
    const norm = normalizeHebrewProductName(product.name)
    return {
      ...product,
      normalized: norm,
      // Use provided category if available, otherwise use normalized
      category: product.category || norm.product_type,
      // Use provided brand if available, otherwise use normalized
      brand: product.brand || norm.brand
    }
  })
  
  const groups: ProductMatch[] = []
  const processed = new Set<string>()
  
  for (const product of normalized) {
    if (processed.has(product.id)) continue
    
    const group: ProductMatch = {
      master_id: `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      master_name: product.normalized.normalized_name || product.name,
      products: [{...product, original_data: product}],
      confidence_score: product.normalized.confidence_score,
      category: product.category
    }
    
    processed.add(product.id)
    
    // Find similar products with enhanced matching
    for (const otherProduct of normalized) {
      if (processed.has(otherProduct.id)) continue
      
      const nameSimilarity = calculateHebrewSimilarity(
        product.normalized.normalized_name,
        otherProduct.normalized.normalized_name
      )
      
      // Category matching
      const sameCategory = !requireSameCategory || product.category === otherProduct.category
      
      // Brand matching (if brand awareness is enabled)
      const brandMatch = !brandAwareness || 
        !product.brand || 
        !otherProduct.brand || 
        product.brand === otherProduct.brand
      
      // Quality matching
      const qualityMatch = product.normalized.quality_grade === otherProduct.normalized.quality_grade
      
      // Enhanced similarity score considering all factors
      let enhancedSimilarity = nameSimilarity
      if (sameCategory) enhancedSimilarity += 0.1
      if (brandMatch) enhancedSimilarity += 0.05
      if (qualityMatch) enhancedSimilarity += 0.05
      
      if (enhancedSimilarity >= similarityThreshold && sameCategory) {
        group.products.push({...otherProduct, original_data: otherProduct})
        processed.add(otherProduct.id)
        
        // Update group confidence
        group.confidence_score = Math.min(
          (group.confidence_score + otherProduct.normalized.confidence_score) / 2 + 0.05,
          1.0
        )
      }
    }
    
    groups.push(group)
  }
  
  return groups.sort((a, b) => {
    const confidenceDiff = b.confidence_score - a.confidence_score
    if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff
    return b.products.length - a.products.length
  })
}