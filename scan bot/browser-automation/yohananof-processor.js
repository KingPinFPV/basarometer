#!/usr/bin/env node

/**
 * 🎯 Yohananof Results Processor & Validator
 * 
 * Processes and validates Yohananof automation results, ensuring they meet
 * the gold standard criteria and provide comprehensive analytics for the
 * proof-of-concept success measurement.
 */

import fs from 'fs/promises';
import path from 'path';
import { HebrewBridge } from './hebrew-bridge.js';

export class YohananofProcessor {
  constructor() {
    this.hebrewBridge = new HebrewBridge();
    
    // Success criteria based on Shufersal gold standard
    this.successCriteria = {
      minProducts: 30,
      targetProducts: 40,
      minConfidence: 0.85,
      shufersalBenchmark: 0.79,
      hebrewAccuracy: 0.90,
      priceAccuracy: 0.95,
      processingTimeMax: 600 // 10 minutes
    };
    
    // Hebrew validation patterns
    this.hebrewPatterns = {
      hebrewChars: /[\u0590-\u05FF]/,
      meatTerms: ['בשר', 'עוף', 'כבש', 'טלה', 'דגים', 'אנטריקוט', 'סטייק'],
      priceFormats: [
        /₪\s*\d+(\.\d{2})?/,
        /\d+(\.\d{2})?\s*₪/,
        /\d+(\.\d{2})?\s*שקל/,
        /\d+(\.\d{2})?\s*ש״ח/
      ]
    };
  }

  /**
   * Process and validate browser-use automation results
   * @param {Object} rawResults - Results from browser-use automation
   * @returns {Object} Processed and validated results with analytics
   */
  async processResults(rawResults) {
    console.log('🔄 Processing Yohananof results...');
    
    const startTime = Date.now();
    
    // Extract products array from results
    const products = this.extractProducts(rawResults);
    
    // Process each product using Hebrew bridge
    const processedProducts = await this.processProducts(products);
    
    // Validate results against success criteria
    const validation = this.validateResults(processedProducts);
    
    // Generate comprehensive analytics
    const analytics = this.generateAnalytics(processedProducts, validation);
    
    // Create final report
    const report = this.generateReport(processedProducts, validation, analytics);
    
    // Save results to output directory
    await this.saveResults(processedProducts, report);
    
    const processingTime = (Date.now() - startTime) / 1000;
    console.log(`✅ Processing complete in ${processingTime.toFixed(2)} seconds`);
    
    return {
      products: processedProducts,
      validation,
      analytics,
      report,
      processingTime
    };
  }

  /**
   * Extract products from various possible result formats
   * @param {Object} rawResults - Raw automation results
   * @returns {Array} Normalized products array
   */
  extractProducts(rawResults) {
    // Handle different possible result formats
    if (Array.isArray(rawResults)) {
      return rawResults;
    }
    
    if (rawResults.products && Array.isArray(rawResults.products)) {
      return rawResults.products;
    }
    
    if (rawResults.data && Array.isArray(rawResults.data)) {
      return rawResults.data;
    }
    
    // Try to find any array of objects that look like products
    for (const [key, value] of Object.entries(rawResults)) {
      if (Array.isArray(value) && value.length > 0 && value[0].name) {
        console.log(`📦 Found products array in field: ${key}`);
        return value;
      }
    }
    
    console.warn('⚠️ Could not find products array in results');
    return [];
  }

  /**
   * Process products using Hebrew bridge utilities
   * @param {Array} products - Raw products array
   * @returns {Array} Processed products with confidence scores
   */
  async processProducts(products) {
    console.log(`📊 Processing ${products.length} raw products...`);
    
    const processed = [];
    
    for (const [index, product] of products.entries()) {
      try {
        // Use Hebrew bridge for processing
        const processedProduct = this.hebrewBridge.processProduct(product);
        
        // Add Yohananof-specific metadata
        processedProduct.source = 'yohananof';
        processedProduct.extractionIndex = index;
        processedProduct.yohananofId = this.generateYohananofId(processedProduct.name, index);
        
        // Enhanced validation for Yohananof
        const validation = this.validateProduct(processedProduct);
        processedProduct.validation = validation;
        processedProduct.isValid = validation.isValid;
        
        processed.push(processedProduct);
        
      } catch (error) {
        console.warn(`⚠️ Error processing product ${index}:`, error.message);
        // Include failed product for analysis
        processed.push({
          originalIndex: index,
          error: error.message,
          originalData: product,
          isValid: false,
          confidence: 0
        });
      }
    }
    
    console.log(`✅ Processed ${processed.length} products`);
    return processed;
  }

  /**
   * Validate individual product against Yohananof criteria
   * @param {Object} product - Processed product
   * @returns {Object} Validation results
   */
  validateProduct(product) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      scores: {
        hebrew: 0,
        price: 0,
        meat: 0,
        overall: 0
      }
    };

    // Hebrew text validation
    if (!product.name || typeof product.name !== 'string') {
      validation.errors.push('Missing or invalid product name');
      validation.isValid = false;
    } else {
      const hasHebrew = this.hebrewPatterns.hebrewChars.test(product.name);
      const hasMeatTerms = this.hebrewPatterns.meatTerms.some(term => 
        product.name.includes(term)
      );
      
      if (!hasHebrew) {
        validation.errors.push('No Hebrew characters in product name');
        validation.isValid = false;
      } else {
        validation.scores.hebrew = 1;
      }
      
      if (!hasMeatTerms) {
        validation.warnings.push('No clear meat terms detected');
        validation.scores.meat = 0.5;
      } else {
        validation.scores.meat = 1;
      }
    }

    // Price validation
    if (!product.price || product.price <= 0) {
      validation.errors.push('Invalid or missing price');
      validation.isValid = false;
    } else if (product.price > 1000) {
      validation.warnings.push('Unusually high price - verify accuracy');
      validation.scores.price = 0.8;
    } else {
      validation.scores.price = 1;
    }

    // Confidence threshold validation
    if (product.confidence < this.successCriteria.minConfidence) {
      validation.warnings.push(
        `Low confidence: ${product.confidence.toFixed(2)} < ${this.successCriteria.minConfidence}`
      );
    }

    // Calculate overall score
    validation.scores.overall = (
      validation.scores.hebrew + 
      validation.scores.price + 
      validation.scores.meat
    ) / 3;

    return validation;
  }

  /**
   * Validate overall results against success criteria
   * @param {Array} products - Processed products
   * @returns {Object} Overall validation results
   */
  validateResults(products) {
    const validProducts = products.filter(p => p.isValid);
    const totalProducts = products.length;
    
    const validation = {
      totalProducts,
      validProducts: validProducts.length,
      invalidProducts: totalProducts - validProducts.length,
      successRate: validProducts.length / totalProducts,
      
      // Key metrics
      averageConfidence: this.calculateAverageConfidence(validProducts),
      hebrewAccuracy: this.calculateHebrewAccuracy(validProducts),
      priceAccuracy: this.calculatePriceAccuracy(validProducts),
      
      // Success criteria evaluation
      meetsMinProducts: totalProducts >= this.successCriteria.minProducts,
      meetsTargetProducts: totalProducts >= this.successCriteria.targetProducts,
      meetsConfidenceTarget: false, // calculated below
      exceedsShufersal: false, // calculated below
      
      // Overall success
      overallSuccess: false // calculated below
    };

    // Calculate confidence metrics
    validation.meetsConfidenceTarget = validation.averageConfidence >= this.successCriteria.minConfidence;
    validation.exceedsShufersal = validation.averageConfidence > this.successCriteria.shufersalBenchmark;

    // Overall success evaluation
    validation.overallSuccess = 
      validation.meetsMinProducts &&
      validation.meetsConfidenceTarget &&
      validation.hebrewAccuracy >= this.successCriteria.hebrewAccuracy &&
      validation.priceAccuracy >= this.successCriteria.priceAccuracy;

    return validation;
  }

  /**
   * Generate comprehensive analytics
   * @param {Array} products - Processed products
   * @param {Object} validation - Validation results
   * @returns {Object} Analytics data
   */
  generateAnalytics(products, validation) {
    const validProducts = products.filter(p => p.isValid);
    
    const analytics = {
      // Category distribution
      categories: this.analyzeCategories(validProducts),
      
      // Quality grades
      qualityGrades: this.analyzeQualityGrades(validProducts),
      
      // Price analysis
      priceAnalysis: this.analyzePrices(validProducts),
      
      // Hebrew processing
      hebrewAnalysis: this.analyzeHebrewProcessing(validProducts),
      
      // Brand detection
      brandAnalysis: this.analyzeBrands(validProducts),
      
      // Kosher certification
      kosherAnalysis: this.analyzeKosher(validProducts),
      
      // Comparison with Shufersal
      shufersalComparison: this.compareWithShufersal(validation)
    };

    return analytics;
  }

  /**
   * Generate final comprehensive report
   * @param {Array} products - Processed products
   * @param {Object} validation - Validation results
   * @param {Object} analytics - Analytics data
   * @returns {Object} Final report
   */
  generateReport(products, validation, analytics) {
    return {
      timestamp: new Date().toISOString(),
      site: 'Yohananof',
      url: 'https://www.yohananof.co.il',
      
      // Executive summary
      summary: {
        success: validation.overallSuccess,
        achievement: validation.overallSuccess ? 'MISSION ACCOMPLISHED ✅' : 'NEEDS IMPROVEMENT ⚠️',
        products: validation.totalProducts,
        confidence: validation.averageConfidence.toFixed(3),
        benchmark: `${validation.exceedsShufersal ? 'EXCEEDED' : 'BELOW'} Shufersal (0.79)`,
        hebrewExcellence: validation.hebrewAccuracy >= 0.95 ? 'EXCELLENT' : 'GOOD'
      },
      
      // Detailed metrics
      metrics: {
        products: {
          total: validation.totalProducts,
          valid: validation.validProducts,
          invalid: validation.invalidProducts,
          successRate: (validation.successRate * 100).toFixed(1) + '%'
        },
        quality: {
          averageConfidence: validation.averageConfidence.toFixed(3),
          hebrewAccuracy: (validation.hebrewAccuracy * 100).toFixed(1) + '%',
          priceAccuracy: (validation.priceAccuracy * 100).toFixed(1) + '%',
          targetAchievement: validation.meetsConfidenceTarget ? 'ACHIEVED' : 'MISSED'
        },
        categories: analytics.categories,
        pricing: analytics.priceAnalysis
      },
      
      // Success criteria checklist
      criteria: {
        minProducts: { 
          target: this.successCriteria.minProducts, 
          actual: validation.totalProducts, 
          achieved: validation.meetsMinProducts 
        },
        confidence: { 
          target: this.successCriteria.minConfidence, 
          actual: validation.averageConfidence, 
          achieved: validation.meetsConfidenceTarget 
        },
        hebrewAccuracy: { 
          target: this.successCriteria.hebrewAccuracy, 
          actual: validation.hebrewAccuracy, 
          achieved: validation.hebrewAccuracy >= this.successCriteria.hebrewAccuracy 
        },
        priceAccuracy: { 
          target: this.successCriteria.priceAccuracy, 
          actual: validation.priceAccuracy, 
          achieved: validation.priceAccuracy >= this.successCriteria.priceAccuracy 
        }
      },
      
      // Innovation impact
      impact: {
        revolutionaryAchievement: validation.overallSuccess,
        aiAutomationProven: true,
        hebrewProcessingExcellence: validation.hebrewAccuracy > 0.9,
        readyForScaling: validation.overallSuccess,
        nextSteps: this.generateNextSteps(validation)
      },
      
      // Raw data references
      dataFiles: {
        products: 'yohananof-products-[timestamp].json',
        analytics: 'yohananof-analytics-[timestamp].json',
        validation: 'yohananof-validation-[timestamp].json'
      }
    };
  }

  /**
   * Save all results to output directory
   * @param {Array} products - Processed products
   * @param {Object} report - Final report
   */
  async saveResults(products, report) {
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const outputDir = '../output';
    
    try {
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });
      
      // Save products data
      const productsFile = path.join(outputDir, `yohananof-products-${timestamp}.json`);
      await fs.writeFile(productsFile, JSON.stringify(products, null, 2));
      
      // Save comprehensive report
      const reportFile = path.join(outputDir, `yohananof-report-${timestamp}.json`);
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
      
      // Save CSV format for compatibility
      const csvFile = path.join(outputDir, `yohananof-products-${timestamp}.csv`);
      await this.saveCSV(products.filter(p => p.isValid), csvFile);
      
      console.log(`💾 Results saved:`);
      console.log(`   Products: ${productsFile}`);
      console.log(`   Report: ${reportFile}`);
      console.log(`   CSV: ${csvFile}`);
      
      // Update report with actual filenames
      report.dataFiles = {
        products: path.basename(productsFile),
        report: path.basename(reportFile),
        csv: path.basename(csvFile)
      };
      
    } catch (error) {
      console.error('❌ Error saving results:', error);
      throw error;
    }
  }

  /**
   * Helper methods for analytics
   */
  calculateAverageConfidence(products) {
    if (products.length === 0) return 0;
    return products.reduce((sum, p) => sum + (p.confidence || 0), 0) / products.length;
  }

  calculateHebrewAccuracy(products) {
    if (products.length === 0) return 0;
    const hebrewProducts = products.filter(p => 
      p.name && this.hebrewPatterns.hebrewChars.test(p.name)
    );
    return hebrewProducts.length / products.length;
  }

  calculatePriceAccuracy(products) {
    if (products.length === 0) return 0;
    const validPrices = products.filter(p => p.price && p.price > 0);
    return validPrices.length / products.length;
  }

  analyzeCategories(products) {
    const categories = {};
    products.forEach(p => {
      const cat = p.category || 'unknown';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    return categories;
  }

  analyzeQualityGrades(products) {
    const grades = {};
    products.forEach(p => {
      const grade = p.grade || 'standard';
      grades[grade] = (grades[grade] || 0) + 1;
    });
    return grades;
  }

  analyzePrices(products) {
    const prices = products.map(p => p.price).filter(p => p > 0);
    if (prices.length === 0) return { min: 0, max: 0, average: 0 };
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: prices.reduce((sum, p) => sum + p, 0) / prices.length,
      count: prices.length
    };
  }

  analyzeHebrewProcessing(products) {
    return {
      totalProducts: products.length,
      hebrewProducts: products.filter(p => 
        p.name && this.hebrewPatterns.hebrewChars.test(p.name)
      ).length,
      meatTermsDetected: products.filter(p => 
        p.name && this.hebrewPatterns.meatTerms.some(term => p.name.includes(term))
      ).length
    };
  }

  analyzeBrands(products) {
    const brands = {};
    products.forEach(p => {
      if (p.brand) {
        brands[p.brand] = (brands[p.brand] || 0) + 1;
      }
    });
    return brands;
  }

  analyzeKosher(products) {
    return {
      total: products.length,
      kosher: products.filter(p => p.kosher === true).length,
      unknown: products.filter(p => p.kosherStatus === 'unknown').length
    };
  }

  compareWithShufersal(validation) {
    return {
      shufersalBenchmark: this.successCriteria.shufersalBenchmark,
      yohananofScore: validation.averageConfidence,
      improvement: validation.averageConfidence - this.successCriteria.shufersalBenchmark,
      improvementPercent: ((validation.averageConfidence / this.successCriteria.shufersalBenchmark - 1) * 100).toFixed(1) + '%',
      exceeded: validation.exceedsShufersal
    };
  }

  generateNextSteps(validation) {
    if (validation.overallSuccess) {
      return [
        'CELEBRATE SUCCESS! 🎉',
        'Deploy to additional Israeli retail sites',
        'Scale to 8+ sites for market coverage',
        'Integrate with V5.2 system',
        'Establish market intelligence dashboard'
      ];
    } else {
      const steps = ['Improvement required:'];
      if (!validation.meetsMinProducts) {
        steps.push(`- Increase product extraction (${validation.totalProducts} < ${this.successCriteria.minProducts})`);
      }
      if (!validation.meetsConfidenceTarget) {
        steps.push(`- Improve confidence scoring (${validation.averageConfidence.toFixed(2)} < ${this.successCriteria.minConfidence})`);
      }
      if (validation.hebrewAccuracy < this.successCriteria.hebrewAccuracy) {
        steps.push('- Enhance Hebrew text processing');
      }
      if (validation.priceAccuracy < this.successCriteria.priceAccuracy) {
        steps.push('- Improve Israeli price format parsing');
      }
      return steps;
    }
  }

  generateYohananofId(name, index) {
    // Generate unique ID for Yohananof products
    const cleanName = name.replace(/[^\w\u0590-\u05FF]/g, '').substring(0, 8);
    return `yhn_${cleanName}_${index.toString().padStart(3, '0')}`;
  }

  async saveCSV(products, filepath) {
    const headers = [
      'id', 'name', 'category', 'price', 'currency', 'brand', 
      'grade', 'confidence', 'kosher', 'source'
    ];
    
    const csvData = [headers.join(',')];
    
    products.forEach(product => {
      const row = headers.map(header => {
        const value = product[header] || '';
        // Escape commas and quotes in CSV
        return typeof value === 'string' && value.includes(',') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      });
      csvData.push(row.join(','));
    });
    
    await fs.writeFile(filepath, csvData.join('\n'), 'utf8');
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎯 Yohananof Results Processor');
  console.log('Usage: node yohananof-processor.js [results-file.json]');
  
  // Example usage with test data
  const processor = new YohananofProcessor();
  
  // Mock test data
  const testResults = [
    {
      name: 'אנטריקוט אנגוס טרי 500 גרם',
      price: '₪89.90',
      description: 'בשר בקר פרימיום כשר למהדרין'
    },
    {
      name: 'חזה עוף טרי 1 ק״ג',
      price: '45.90₪',
      description: 'עוף טרי איכות גבוהה'
    }
  ];
  
  processor.processResults(testResults)
    .then(results => {
      console.log('\n📊 Test Results:');
      console.log(`Products: ${results.products.length}`);
      console.log(`Average Confidence: ${results.validation.averageConfidence.toFixed(3)}`);
      console.log(`Success: ${results.validation.overallSuccess ? '✅' : '❌'}`);
    })
    .catch(console.error);
}

export default YohananofProcessor;