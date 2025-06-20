#!/usr/bin/env node

/**
 * 🎯 Template Intelligence Converter
 * 
 * Converts proven Shufersal Template System patterns into natural language
 * automation prompts for AI-driven browser control. This preserves the gold
 * standard 0.79 confidence achievement while enabling scalable site addition.
 * 
 * Core Innovation: Transform technical CSS selectors into contextual AI instructions
 * that understand Hebrew retail patterns and Israeli market specifics.
 */

import fs from 'fs/promises';
import path from 'path';
import { HebrewBridge } from './hebrew-bridge.js';

export class TemplateConverter {
  constructor() {
    this.hebrewBridge = new HebrewBridge();
    
    // Shufersal Gold Standard Template (0.79 confidence, 48 products)
    this.goldStandardPatterns = {
      productDetection: {
        containers: ['.miglog-prod', '.product-tile', '.product-card'],
        reliability: 0.95,
        hebrewCompatible: true
      },
      nameExtraction: {
        selectors: ['.miglog-prod-name', '.prod-name', '.title'],
        hebrewText: true,
        reliability: 0.92
      },
      priceExtraction: {
        selectors: ['.miglog-price', '.price', '.prod-price'],
        shekelFormat: true,
        reliability: 0.98
      },
      qualityIndicators: {
        premium: ['אנגוס', 'פרימיום', 'angus', 'premium'],
        organic: ['אורגני', 'organic', 'ביו'],
        kosher: ['כשר', 'בד"ץ', 'רבנות']
      }
    };

    // Common Israeli retail patterns learned from existing sites
    this.retailPatterns = {
      navigation: {
        hebrewMenus: ['תפריט', 'קטגוריות', 'מוצרים', 'בשר'],
        meatSections: ['בשר', 'קצביה', 'בשר ודגים', 'בשר בקר', 'עוף'],
        commonPaths: ['/meat', '/butcher', '/קצביה', '/בשר']
      },
      productLayouts: {
        gridBased: ['grid', 'tile', 'card', 'item'],
        listBased: ['list', 'row', 'product'],
        hebrewRTL: true
      },
      priceFormats: {
        shekel: ['₪', 'שקל', 'שח"ח', 'NIS'],
        patterns: [/\d+\.?\d*\s*₪/, /₪\s*\d+\.?\d*/],
        unitsHebrew: ['ק"ג', 'גרם', 'יחידה', 'חבילה']
      }
    };
  }

  /**
   * Convert site configuration to AI automation instructions
   * @param {Object} siteConfig - Technical site configuration
   * @param {string} siteName - Site identifier
   * @returns {Object} AI-ready automation prompts
   */
  convertSiteToPrompts(siteConfig, siteName) {
    const { name, baseUrl, meatCategories, selectors } = siteConfig;
    
    // Apply Template Intelligence from Shufersal success
    const automationInstructions = {
      metadata: {
        siteName,
        displayName: name,
        baseUrl,
        templateSource: 'shufersal_gold_standard',
        confidence: 'targeting_0.8+',
        hebrewOptimized: true,
        generatedAt: new Date().toISOString()
      },

      // Phase 1: Site Navigation and Discovery
      navigationPhase: {
        instruction: `Navigate to ${name} (${baseUrl}) and locate the meat section. Look for Hebrew navigation terms like ${this.retailPatterns.navigation.meatSections.join(', ')}.`,
        
        meatSectionDiscovery: `Search for meat categories using these patterns:
1. Look for Hebrew text containing: ${this.retailPatterns.navigation.meatSections.join(', ')}
2. Check common URL patterns: ${this.retailPatterns.navigation.commonPaths.join(', ')}
3. Find navigation menus or category links
4. Verify pages contain meat-related products before proceeding`,

        categoryTargets: meatCategories.map(cat => ({
          url: `${baseUrl}${cat}`,
          description: `Meat category page - expect Hebrew product names and ₪ prices`
        })),

        waitConditions: `Wait for page content to load. Look for product containers or Hebrew text indicating successful page load.`
      },

      // Phase 2: Product Detection and Extraction  
      extractionPhase: {
        instruction: `Extract meat products using Template Intelligence patterns. Focus on Hebrew text and Israeli price formats.`,

        productIdentification: `Find product containers on the page:
1. Look for repeated container elements (similar to Shufersal's .miglog-prod pattern)
2. Each container should have: Hebrew product name, ₪ price, optional image
3. Ignore non-meat items - focus on products with Hebrew meat keywords: ${this.hebrewBridge.hebrewKeywords.slice(0, 8).join(', ')}
4. Common container patterns: ${this.getAllContainerPatterns(selectors.productContainer)}`,

        nameExtraction: `Extract Hebrew product names:
1. Look for main text elements within product containers
2. Names should contain Hebrew characters and meat-related terms
3. Common name patterns: ${this.getNamePatterns(selectors.productName)}
4. Validate names contain actual Hebrew text (not just numbers/symbols)`,

        priceExtraction: `Extract Israeli prices (₪ format):
1. Look for price elements with ₪ symbol or Hebrew price indicators
2. Accept formats: "₪45.90", "45.90 ₪", "45 שקל"
3. Common price patterns: ${this.getPricePatterns(selectors.productPrice)}
4. Validate prices are positive numbers with proper currency formatting`,

        qualityDetection: `Identify quality indicators in Hebrew:
1. Premium terms: ${this.goldStandardPatterns.qualityIndicators.premium.join(', ')}
2. Organic terms: ${this.goldStandardPatterns.qualityIndicators.organic.join(', ')}
3. Kosher terms: ${this.goldStandardPatterns.qualityIndicators.kosher.join(', ')}
4. Include quality info in extracted data for accurate categorization`,

        imageExtraction: `Capture product images when available:
1. Look for img elements within product containers
2. Get full image URLs (handle relative paths)
3. Prioritize clear product photos over placeholder images`
      },

      // Phase 3: Validation and Quality Control
      validationPhase: {
        instruction: `Validate extracted products against Shufersal gold standard (targeting 0.8+ confidence).`,

        meatValidation: `Ensure products are actually meat:
1. Hebrew names must contain meat keywords: ${this.hebrewBridge.hebrewKeywords.slice(0, 6).join(', ')}
2. Exclude items like condiments, utensils, or non-food products
3. Verify category context (meat section, butcher, etc.)`,

        hebrewValidation: `Validate Hebrew text quality:
1. Names must contain Hebrew characters (not just transliteration)
2. Text should be properly encoded (no ?????, squares, or garbled characters)
3. Handle RTL (right-to-left) text display correctly`,

        priceValidation: `Validate Israeli pricing:
1. Prices must be positive numbers with valid ₪ format
2. Reasonable price ranges (₪5-500 for typical meat products)
3. Handle thousands separators if present (1,250 ₪)`,

        duplicateDetection: `Remove duplicates using Template Intelligence:
1. Compare normalized Hebrew names (ignore spaces, punctuation)
2. Check for same product with different packaging sizes
3. Prefer products with higher confidence scores when duplicates found`,

        confidenceScoring: `Calculate confidence based on Shufersal template:
1. Hebrew name quality (0.0-0.3): Contains meat terms, proper Hebrew encoding
2. Price validity (0.0-0.3): Valid ₪ format, reasonable range
3. Category context (0.0-0.2): Found in meat section, relevant page
4. Quality indicators (0.0-0.2): Brand, grade, kosher status detected
5. Target: 0.8+ overall confidence (Shufersal gold standard: 0.79)`
      },

      // Phase 4: Results Compilation
      resultsPhase: {
        instruction: `Compile results in Basarometer-compatible format with Hebrew optimization.`,

        outputFormat: `Structure each product as:
{
  "id": "generated_hash_id",
  "name": "hebrew_product_name",
  "originalName": "exact_scraped_text", 
  "category": "detected_meat_category",
  "grade": "quality_level",
  "brand": "detected_brand_if_any",
  "price": numeric_price_value,
  "pricePerKg": calculated_per_kg_price,
  "unit": "detected_unit",
  "confidence": confidence_score,
  "kosherStatus": "kosher_certification_status",
  "url": "product_or_page_url",
  "image": "image_url_if_available",
  "hebrewProcessed": true,
  "extractedAt": "ISO_timestamp"
}`,

        qualityTargets: `Achievement targets based on Shufersal success:
- Minimum products: 30+ unique meat items
- Average confidence: 0.8+ (improvement over 0.79 gold standard)
- Hebrew accuracy: 95%+ proper encoding and meat detection
- Price accuracy: 98%+ valid ₪ format recognition
- Duplicate rate: <5% after deduplication
- Processing time: <3 minutes total`,

        errorHandling: `Handle common issues:
1. Dynamic loading: Wait for content, scroll if needed
2. Hebrew encoding: Verify proper UTF-8 handling
3. Price variants: Handle sale prices, unit prices, bulk discounts
4. Navigation issues: Retry with alternative selectors
5. Empty results: Verify site structure, check for changes`
      }
    };

    // Add site-specific optimizations based on existing patterns
    if (siteName === 'shufersal') {
      automationInstructions.optimizations = this.getShufersalOptimizations();
    } else if (siteName === 'rami-levy') {
      automationInstructions.optimizations = this.getRamiLevyOptimizations();
    }

    return automationInstructions;
  }

  /**
   * Generate natural language analysis prompts for new site discovery
   * @param {string} siteName - Target site name
   * @param {string} siteUrl - Target site URL
   * @returns {Object} Site analysis prompts for AI exploration
   */
  generateSiteAnalysisPrompts(siteName, siteUrl) {
    return {
      metadata: {
        target: siteName,
        url: siteUrl,
        analysisType: 'template_intelligence_discovery',
        baseTemplate: 'shufersal_gold_standard',
        goalConfidence: '0.8+',
        expectedProducts: '30-50'
      },

      discoveryPhase: {
        title: 'Israeli Retail Site Analysis for Template Intelligence',
        
        initialAnalysis: `Analyze ${siteName} (${siteUrl}) as an Israeli retail website. This should be similar to successful sites like Shufersal, Rami Levy, or Carrefour. 

Key analysis goals:
1. Identify the meat/בשר section structure and navigation
2. Understand Hebrew text layout and RTL considerations  
3. Map product container patterns and data organization
4. Document Israeli price formatting (₪ symbols and patterns)
5. Detect quality indicators and kosher certifications

Expected outcomes: Generate Template Intelligence for 30+ meat products with 0.8+ confidence.`,

        navigationMapping: `Map the site's navigation to find meat sections:

1. **Main Navigation Analysis:**
   - Look for Hebrew menu items: ${this.retailPatterns.navigation.hebrewMenus.join(', ')}
   - Find meat-related categories: ${this.retailPatterns.navigation.meatSections.join(', ')}
   - Document URL patterns and category organization
   - Note any mega-menus, dropdowns, or category filters

2. **Meat Section Discovery:**
   - Navigate to identified meat categories
   - Document category names and URLs (Hebrew + transliterated)
   - Map subcategories: beef/בקר, chicken/עוף, lamb/כבש, fish/דגים
   - Identify premium sections: organic, kosher, imports

3. **URL Pattern Documentation:**
   - Record category URL structures
   - Note any encoded Hebrew characters in URLs
   - Document pagination or infinite scroll patterns
   - Check for search functionality and filters`,

        productStructureAnalysis: `Analyze product display patterns using Template Intelligence:

1. **Container Pattern Recognition:**
   - Identify repeated product containers (like Shufersal's .miglog-prod)
   - Document CSS classes and HTML structure
   - Note grid vs list layouts and responsive behavior
   - Check for product card consistency across categories

2. **Hebrew Text Analysis:**
   - Document Hebrew product name placement and styling
   - Verify proper RTL text handling and encoding
   - Identify font usage and text hierarchy
   - Note any text truncation or expansion mechanisms

3. **Price Display Patterns:**
   - Map Israeli price formatting: ₪ symbol placement, number formatting
   - Document sale prices, discounts, and promotional pricing
   - Identify unit pricing (per kg, per item) display methods
   - Note any currency conversion or alternative pricing

4. **Quality Indicator Mapping:**
   - Find premium/quality badges: אנגוס, פרימיום, אורגני
   - Locate kosher certifications: כשר, בד"ץ, רבנות
   - Document brand prominence and placement
   - Identify origin indicators: מקומי, יבוא, etc.`,

        templateGeneration: `Generate Template Intelligence configuration:

1. **Selector Mapping:**
   - Primary selectors based on discovered patterns
   - Fallback selectors for reliability (Shufersal approach)
   - Hebrew-specific selectors for proper text extraction
   - Price selectors optimized for ₪ format detection

2. **Automation Instruction Creation:**
   - Convert technical selectors to natural language prompts
   - Include Hebrew context and RTL considerations
   - Document expected product count and confidence targets
   - Create validation rules based on Template Intelligence

3. **Quality Assurance Rules:**
   - Meat detection validation using Hebrew keywords
   - Price format validation for Israeli standards
   - Duplicate detection and prevention strategies
   - Confidence scoring calibrated to Shufersal gold standard

4. **Configuration Export:**
   - Technical config for immediate integration
   - Natural language prompts for AI automation
   - Quality targets and success metrics
   - Troubleshooting guide for common issues`
      },

      validationPhase: {
        title: 'Template Intelligence Validation',
        
        testingProtocol: `Validate the generated Template Intelligence:

1. **Product Extraction Test:**
   - Extract 20-30 meat products using generated config
   - Verify Hebrew names are properly encoded and meaningful
   - Confirm prices are in valid ₪ format with reasonable values
   - Check for appropriate meat categorization

2. **Quality Metrics Validation:**
   - Calculate confidence scores using Shufersal methodology
   - Verify meat detection accuracy (target: 90%+)
   - Validate Hebrew text quality (no encoding issues)
   - Confirm price accuracy and format compliance

3. **Comparison with Gold Standard:**
   - Compare results with Shufersal's 0.79 confidence achievement
   - Analyze product diversity and category coverage
   - Evaluate processing time and efficiency
   - Document any superior performance areas

4. **Edge Case Testing:**
   - Test with sale prices and promotional items
   - Validate handling of out-of-stock products
   - Check behavior with premium/imported items
   - Verify kosher and organic product detection`,

        optimizationRecommendations: `Provide Template Intelligence optimization recommendations:

1. **Performance Optimization:**
   - Suggest selector refinements based on test results
   - Recommend wait times and loading strategies
   - Propose pagination handling improvements
   - Identify opportunities for parallel processing

2. **Accuracy Enhancement:**
   - Recommend Hebrew text processing improvements
   - Suggest additional meat keyword detection patterns
   - Propose confidence scoring refinements
   - Identify quality indicator enhancement opportunities

3. **Scalability Preparation:**
   - Document patterns applicable to similar Israeli retail sites
   - Suggest template variations for different site architectures
   - Recommend monitoring and maintenance strategies
   - Prepare integration guidelines for rapid scaling`
      }
    };
  }

  /**
   * Convert technical selectors to natural language patterns
   */
  getAllContainerPatterns(selectors) {
    return selectors.split(',').map(s => s.trim()).slice(0, 5);
  }

  getNamePatterns(selectors) {
    return selectors.split(',').map(s => s.trim()).slice(0, 3);
  }

  getPricePatterns(selectors) {
    return selectors.split(',').map(s => s.trim()).slice(0, 3);
  }

  /**
   * Shufersal-specific optimizations (gold standard template)
   */
  getShufersalOptimizations() {
    return {
      proven: true,
      confidence: 0.79,
      products: 48,
      optimizations: [
        'Use .miglog-prod as primary container selector',
        'Wait for miglog-specific loading indicators', 
        'Handle Hebrew text in .miglog-prod-name elements',
        'Extract prices from .miglog-price with ₪ format',
        'Apply 3-second rate limiting between requests'
      ]
    };
  }

  /**
   * Rami Levy specific patterns
   */
  getRamiLevyOptimizations() {
    return {
      proven: true,
      confidence: 0.73,
      products: 205,
      optimizations: [
        'Use .product-flex as primary container',
        'Handle dynamic loading with scroll detection',
        'Extract from .online-product-name for Hebrew names',
        'Parse prices from .product-price elements',
        'Apply 3-second rate limiting for stability'
      ]
    };
  }

  /**
   * Load and convert existing site configurations
   * @param {string} configPath - Path to meat-sites.json
   * @returns {Object} Converted automation prompts for all sites
   */
  async convertAllSites(configPath) {
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      const siteConfigs = JSON.parse(configData);
      
      const convertedSites = {};
      
      for (const [siteName, config] of Object.entries(siteConfigs)) {
        if (!config.disabled) {
          convertedSites[siteName] = this.convertSiteToPrompts(config, siteName);
        }
      }
      
      return {
        metadata: {
          convertedAt: new Date().toISOString(),
          totalSites: Object.keys(convertedSites).length,
          templateSource: 'shufersal_gold_standard',
          targetConfidence: '0.8+',
          hebrewOptimized: true
        },
        sites: convertedSites
      };
    } catch (error) {
      console.error('Configuration conversion error:', error);
      return { error: error.message };
    }
  }

  /**
   * Generate Yohananof-specific analysis prompts
   * @returns {Object} Yohananof analysis configuration
   */
  generateYohananofAnalysis() {
    return {
      siteName: 'yohananof',
      displayName: 'יוחננוף',
      baseUrl: 'https://www.yohananof.co.il',
      
      analysisPrompts: this.generateSiteAnalysisPrompts('יוחננוף', 'https://www.yohananof.co.il'),
      
      expectedPatterns: {
        meatCategories: ['קצביה', 'בשר', 'בשר ודגים'],
        hebrewLayout: true,
        shekelPricing: true,
        kosherProducts: true,
        expectedProducts: '40-60',
        targetConfidence: 0.8
      },

      templateIntelligenceApplication: {
        baseTemplate: 'shufersal_patterns',
        adaptations: [
          'Apply Hebrew meat keyword detection',
          'Use ₪ price extraction patterns',
          'Implement RTL text handling',
          'Apply confidence scoring methodology',
          'Use proven container detection patterns'
        ]
      }
    };
  }
}

// Export for use in integration scripts
export default TemplateConverter;

// CLI usage for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const converter = new TemplateConverter();
  
  console.log('🎯 Template Intelligence Converter Test\n');
  
  // Test Shufersal conversion
  const shufersalConfig = {
    name: 'שופרסל',
    baseUrl: 'https://www.shufersal.co.il',
    meatCategories: ['/online/he/A07'],
    selectors: {
      productContainer: '.miglog-prod',
      productName: '.miglog-prod-name',
      productPrice: '.miglog-price',
      productImage: 'img.miglog-image'
    }
  };
  
  const prompts = converter.convertSiteToPrompts(shufersalConfig, 'shufersal');
  console.log('🏆 Shufersal Template Intelligence Conversion:');
  console.log(JSON.stringify(prompts.extractionPhase.productIdentification, null, 2));
  
  // Test Yohananof analysis generation
  const yohananofAnalysis = converter.generateYohananofAnalysis();
  console.log('\n🎯 Yohananof Analysis Generation:');
  console.log(JSON.stringify(yohananofAnalysis.expectedPatterns, null, 2));
}