#!/usr/bin/env node

/**
 * 🇮🇱 Hebrew Integration Bridge for Browser-Use
 * 
 * This bridge connects Basarometer's proven Hebrew processing utilities
 * with AI-driven browser automation concepts, preparing for full browser-use integration.
 * 
 * Key Features:
 * - Hebrew meat detection and categorization
 * - Israeli price format processing (₪, NIS)
 * - RTL text handling and normalization
 * - Confidence scoring based on Shufersal gold standard
 * - Template Intelligence conversion to natural language prompts
 */

// Import paths will be resolved at runtime
// import { isMeatProduct, detectMeatCategory, calculateConfidence } from '../utils/meat-detector.js';
// import { extractPrice, extractUnit, calculatePricePerKg, validatePrice } from '../utils/price-extractor.js';
// import { cleanProductName, generateProductId } from '../utils/name-normalizer.js';
import fs from 'fs/promises';
import path from 'path';

export class HebrewBridge {
  constructor() {
    this.hebrewKeywords = [
      'בשר', 'עוף', 'דגים', 'קצבייה', 'בקר', 'עגל', 'כבש', 
      'טלה', 'פרגית', 'הודו', 'ברווז', 'סלמון', 'טונה', 'דניס',
      'אנטריקוט', 'סטייק', 'צלעות', 'כתף', 'חזה', 'שניצל',
      'קציצות', 'נקניק', 'המבורגר', 'כבד', 'פילה', 'אסאדו'
    ];
    
    this.pricePatterns = [
      /(\d+(?:\.\d+)?)\s*₪/g,
      /(\d+(?:\.\d+)?)\s*שקל/g,
      /(\d+(?:\.\d+)?)\s*NIS/g,
      /₪\s*(\d+(?:\.\d+)?)/g
    ];
    
    this.qualityGrades = {
      'premium': ['פרימיום', 'premium', 'wagyu', 'וואגיו', 'angus', 'אנגוס'],
      'organic': ['אורגני', 'organic', 'ביו', 'bio', 'טבעי'],
      'kosher': ['כשר', 'kosher', 'בד"ץ', 'רבנות'],
      'fresh': ['טרי', 'fresh', 'צונן', 'לא קפוא'],
      'frozen': ['קפוא', 'frozen', 'מוקפא']
    };
  }

  /**
   * Process scraped product data using existing Hebrew utilities
   * @param {Object} rawProduct - Raw product data from scraping
   * @returns {Object} Processed product with confidence scoring
   */
  processProduct(rawProduct) {
    const { name, price, description = '', url = '', image = '' } = rawProduct;
    
    // Simplified processing for demo (would use full utilities in integration)
    const cleanedName = this.cleanProductName(name);
    const isMeat = this.isMeatProduct(cleanedName);
    const category = this.detectMeatCategory(cleanedName);
    const extractedPrice = this.extractPrice(price);
    const unit = this.extractUnit(name + ' ' + description);
    const pricePerKg = this.calculatePricePerKg(extractedPrice, unit);
    const confidence = this.calculateConfidence(cleanedName, category, extractedPrice);
    
    // Additional Hebrew-specific processing
    const grade = this.detectQualityGrade(name + ' ' + description);
    const brand = this.detectHebrewBrand(name);
    const kosherStatus = this.detectKosherStatus(name + ' ' + description);
    
    return {
      id: this.generateProductId(cleanedName),
      name: cleanedName,
      originalName: name,
      category,
      grade,
      brand,
      price: extractedPrice,
      pricePerKg,
      unit,
      kosherStatus,
      isMeat,
      confidence,
      url,
      image,
      processedAt: new Date().toISOString(),
      hebrewProcessed: true
    };
  }

  /**
   * Convert technical selectors to natural language prompts for AI automation
   * @param {Object} siteConfig - Site configuration with selectors
   * @returns {Object} Natural language automation prompts
   */
  generateAutomationPrompts(siteConfig) {
    const { name, selectors, meatCategories } = siteConfig;
    
    return {
      siteNavigation: `Navigate to ${name} website and find the meat/בשר section. Look for categories like בשר בקר, עוף, כבש, or דגים.`,
      
      productDetection: `Find all meat products on the page. Look for containers that include Hebrew text with meat-related keywords: ${this.hebrewKeywords.slice(0, 10).join(', ')}. Each product should have a name, price in Israeli Shekels (₪), and typically an image.`,
      
      dataExtraction: `For each meat product found:
1. Extract the Hebrew product name (look for elements containing Hebrew text)
2. Find the price in Israeli Shekel format (₪ symbol or 'שקל')
3. Get product image URL if available
4. Capture any quality indicators like 'אנגוס', 'פרימיום', 'אורגני', 'כשר'
5. Note the unit of measurement (ק"ג, גרם, יחידה)`,
      
      qualityValidation: `Validate each extracted product:
- Name must contain Hebrew characters and meat-related terms
- Price must be in valid Israeli format (positive number with ₪)
- Ignore non-food items or products without clear meat indicators
- Focus on fresh/frozen meat, poultry, and fish products`,
      
      categories: meatCategories,
      
      hebrewContext: `Important: This is an Israeli retail site with Hebrew (RTL) text. Product names will be in Hebrew. Price format uses Israeli Shekel (₪). Common meat terms include: בשר (meat), עוף (chicken), בקר (beef), כבש (lamb), דגים (fish).`
    };
  }

  /**
   * Detect quality grade from Hebrew text
   * @param {string} text - Product text to analyze
   * @returns {string} Detected quality grade
   */
  detectQualityGrade(text) {
    const normalizedText = text.toLowerCase();
    
    for (const [grade, keywords] of Object.entries(this.qualityGrades)) {
      if (keywords.some(keyword => normalizedText.includes(keyword.toLowerCase()))) {
        return grade;
      }
    }
    
    return 'standard';
  }

  /**
   * Detect Hebrew brand names
   * @param {string} text - Product name to analyze
   * @returns {string} Detected brand or null
   */
  detectHebrewBrand(text) {
    const hebrewBrands = [
      'תנובה', 'שטראוס', 'אסם', 'עלית', 'יוטבתה', 'משק טל',
      'זוגלובק', 'כרמל', 'פלטר', 'היימיש', 'מבטחים',
      'שופרסל', 'רמי לוי', 'מגה בעש"ח', 'שם טוב'
    ];
    
    const normalizedText = text.toLowerCase();
    
    for (const brand of hebrewBrands) {
      if (normalizedText.includes(brand)) {
        return brand;
      }
    }
    
    return null;
  }

  /**
   * Detect kosher certification status
   * @param {string} text - Product text to analyze
   * @returns {string} Kosher status
   */
  detectKosherStatus(text) {
    const kosherIndicators = ['כשר', 'בד"ץ', 'רבנות', 'מהדרין', 'חלק ישראל'];
    const normalizedText = text.toLowerCase();
    
    for (const indicator of kosherIndicators) {
      if (normalizedText.includes(indicator)) {
        return 'kosher_certified';
      }
    }
    
    return 'unknown';
  }

  /**
   * Simplified utility methods (would use full Basarometer utilities in production)
   */
  cleanProductName(name) {
    return name?.trim().replace(/\s+/g, ' ') || '';
  }

  isMeatProduct(name) {
    const normalizedName = name.toLowerCase();
    return this.hebrewKeywords.some(keyword => normalizedName.includes(keyword));
  }

  detectMeatCategory(name) {
    const normalizedName = name.toLowerCase();
    if (normalizedName.includes('בקר') || normalizedName.includes('אנטריקוט')) return 'בקר';
    if (normalizedName.includes('עוף') || normalizedName.includes('חזה')) return 'עוף';
    if (normalizedName.includes('כבש') || normalizedName.includes('טלה')) return 'כבש';
    if (normalizedName.includes('דג') || normalizedName.includes('סלמון')) return 'דגים';
    return 'אחר';
  }

  extractPrice(priceText) {
    if (!priceText) return 0;
    const match = priceText.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  extractUnit(text) {
    if (text.includes('ק"ג') || text.includes('קילו')) return 'kg';
    if (text.includes('גרם')) return 'gram';
    return 'unit';
  }

  calculatePricePerKg(price, unit) {
    if (unit === 'kg') return price;
    if (unit === 'gram') return price * 1000; // assume price per gram
    return price;
  }

  calculateConfidence(name, category, price) {
    let confidence = 0;
    
    // Hebrew name quality (0.3)
    if (this.isMeatProduct(name)) confidence += 0.2;
    if (/[\u0590-\u05FF]/.test(name)) confidence += 0.1;
    
    // Category detection (0.2)
    if (category !== 'אחר') confidence += 0.2;
    
    // Price validity (0.3)
    if (price > 0 && price < 1000) confidence += 0.3;
    
    // Quality indicators (0.2)
    if (this.detectQualityGrade(name) !== 'standard') confidence += 0.1;
    if (this.detectHebrewBrand(name)) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  generateProductId(name) {
    // Simple hash-based ID generation
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash).toString(16);
  }

  /**
   * Validate product meets Shufersal gold standard criteria
   * @param {Object} product - Processed product
   * @returns {Object} Validation results
   */
  validateProduct(product) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      confidence: product.confidence
    };

    // Name validation
    if (!product.name || product.name.length < 3) {
      validation.errors.push('Product name too short or missing');
      validation.isValid = false;
    }

    // Hebrew content validation
    const hasHebrew = /[\u0590-\u05FF]/.test(product.name);
    if (!hasHebrew) {
      validation.warnings.push('No Hebrew characters detected in product name');
    }

    // Meat detection validation
    if (!product.isMeat) {
      validation.errors.push('Product not identified as meat');
      validation.isValid = false;
    }

    // Price validation
    if (!product.price || product.price <= 0) {
      validation.errors.push('Invalid or missing price');
      validation.isValid = false;
    }

    // Confidence threshold (Shufersal standard: 0.79+)
    if (product.confidence < 0.7) {
      validation.warnings.push(`Low confidence score: ${product.confidence.toFixed(2)}`);
    }

    // Grade validation
    if (product.grade === 'standard' && product.price > 100) {
      validation.warnings.push('High price for standard grade - verify quality indicators');
    }

    return validation;
  }

  /**
   * Generate comprehensive site analysis prompts based on Template Intelligence
   * @param {string} siteName - Target site name
   * @param {string} siteUrl - Target site URL
   * @returns {Object} Analysis prompts for AI automation
   */
  generateSiteAnalysisPrompts(siteName, siteUrl) {
    return {
      initialResearch: `Analyze the Hebrew retail website ${siteName} (${siteUrl}). This is an Israeli grocery/supermarket site. Find the meat section (בשר) and identify:
1. Main navigation structure
2. Meat categories available (בשר בקר, עוף, דגים, etc.)
3. Product listing format and layout
4. Hebrew text patterns and RTL layout considerations`,

      categoryDiscovery: `Navigate through the meat categories and document:
1. Category URLs and names (in Hebrew)
2. Product container structure
3. How product names are displayed (Hebrew text elements)
4. Price format and location (₪ symbol usage)
5. Image placement and structure
6. Pagination or load-more mechanisms`,

      productSampling: `Extract 5-10 sample meat products and analyze:
1. HTML structure of product containers
2. CSS selectors for name, price, image
3. Hebrew text encoding and display
4. Price formatting patterns
5. Quality indicators or certifications
6. Brand name placement`,

      templateGeneration: `Based on the analysis, generate configuration for:
1. Base URL and category paths
2. CSS selectors for product elements
3. Wait selectors for dynamic loading
4. Hebrew-specific text processing needs
5. Price extraction patterns for Israeli market
6. Quality validation criteria`,

      validation: `Test the generated configuration by:
1. Scraping 20-30 meat products
2. Validating Hebrew text extraction
3. Checking price parsing accuracy
4. Verifying meat category detection
5. Calculating confidence scores
6. Ensuring no duplicates or invalid products`
    };
  }

  /**
   * Export processed data in Basarometer-compatible formats
   * @param {Array} products - Processed products array
   * @param {string} siteName - Source site name
   * @returns {Object} Export data in JSON and CSV formats
   */
  async exportResults(products, siteName) {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const outputDir = '../output';
    
    // JSON format (detailed)
    const jsonData = {
      metadata: {
        siteName,
        timestamp,
        totalProducts: products.length,
        validProducts: products.filter(p => p.confidence > 0.7).length,
        averageConfidence: products.reduce((sum, p) => sum + p.confidence, 0) / products.length,
        hebrewProcessed: true,
        categories: [...new Set(products.map(p => p.category))],
        grades: [...new Set(products.map(p => p.grade))]
      },
      products
    };

    // CSV format (compatible with existing system)
    const csvHeaders = ['id', 'name', 'category', 'grade', 'brand', 'price', 'pricePerKg', 'unit', 'confidence', 'kosherStatus'];
    const csvData = products.map(p => 
      csvHeaders.map(header => p[header] || '').join(',')
    );
    csvData.unshift(csvHeaders.join(','));

    try {
      await fs.writeFile(
        path.join(outputDir, `basarometer-${siteName}-${timestamp}.json`),
        JSON.stringify(jsonData, null, 2)
      );
      
      await fs.writeFile(
        path.join(outputDir, `basarometer-${siteName}-${timestamp}.csv`),
        csvData.join('\n')
      );

      return {
        jsonFile: `basarometer-${siteName}-${timestamp}.json`,
        csvFile: `basarometer-${siteName}-${timestamp}.csv`,
        summary: jsonData.metadata
      };
    } catch (error) {
      console.error('Export error:', error);
      return { error: error.message };
    }
  }
}

// Example usage for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const bridge = new HebrewBridge();
  
  // Test product processing
  const testProduct = {
    name: 'אנטריקוט אנגוס טרי 500 גרם',
    price: '₪89.90',
    description: 'בשר בקר איכות פרימיום כשר למהדרין'
  };
  
  const processed = bridge.processProduct(testProduct);
  console.log('🧪 Test Product Processing:');
  console.log(JSON.stringify(processed, null, 2));
  
  // Test automation prompt generation
  const testSiteConfig = {
    name: 'יוחננוף',
    selectors: { productContainer: '.product-item' },
    meatCategories: ['/meat/beef', '/meat/chicken']
  };
  
  const prompts = bridge.generateAutomationPrompts(testSiteConfig);
  console.log('\n🤖 Automation Prompts:');
  console.log(JSON.stringify(prompts, null, 2));
}

export default HebrewBridge;