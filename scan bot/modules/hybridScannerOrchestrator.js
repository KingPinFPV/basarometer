/**
 * Hybrid Scanner Orchestrator
 * Coordinates government data scraper + Browser-AI verification
 * Implements intelligent data merging, deduplication, and quality scoring
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { GovernmentDataScraper } from './governmentDataScraper.js';
import { BrowserAIScraper } from './browserAIScraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class HybridScannerOrchestrator {
  constructor(options = {}) {
    this.debugMode = options.debug || false;
    this.testMode = options.test || false;
    this.mode = options.mode || 'hybrid'; // 'government', 'browser', 'hybrid'
    this.verificationRatio = options.verificationRatio || 0.3; // % of gov products to verify
    
    this.results = [];
    this.errors = [];
    this.stats = {
      totalSources: 0,
      governmentProducts: 0,
      browserVerifications: 0,
      mergedProducts: 0,
      avgConfidence: 0,
      coverage: 0
    };
    
    console.log(`🔄 Hybrid Orchestrator initialized (mode: ${this.mode})`);
  }

  async performHybridScan() {
    console.log('🚀 Starting Hybrid Intelligence Scan...\n');
    
    try {
      let governmentData = null;
      let browserVerifications = null;
      
      // Phase 1: Government Data Collection
      if (this.mode === 'government' || this.mode === 'hybrid') {
        console.log('📊 Phase 1: Government Data Collection');
        governmentData = await this.runGovernmentScraper();
        this.stats.governmentProducts = governmentData?.products?.length || 0;
        console.log(`   ✅ Collected ${this.stats.governmentProducts} government products\\n`);
      }
      
      // Phase 2: Browser-AI Verification (selective)
      if (this.mode === 'browser' || this.mode === 'hybrid') {
        console.log('🤖 Phase 2: Browser-AI Verification');
        
        if (this.mode === 'hybrid' && governmentData?.products) {
          // Hybrid mode: verify selected government products
          browserVerifications = await this.runBrowserVerification(governmentData.products);
        } else {
          // Browser-only mode: full scan
          browserVerifications = await this.runBrowserFullScan();
        }
        
        this.stats.browserVerifications = browserVerifications?.length || 0;
        console.log(`   ✅ Completed ${this.stats.browserVerifications} browser verifications\\n`);
      }
      
      // Phase 3: Intelligent Data Merging
      console.log('🔄 Phase 3: Intelligent Data Merging');
      const mergedResults = await this.mergeAndScore(governmentData, browserVerifications);
      this.stats.mergedProducts = mergedResults.length;
      console.log(`   ✅ Merged into ${this.stats.mergedProducts} final products\\n`);
      
      // Phase 4: Quality Assessment
      console.log('📈 Phase 4: Quality Assessment');
      const qualityReport = this.assessQuality(mergedResults);
      this.stats.avgConfidence = qualityReport.avgConfidence;
      this.stats.coverage = qualityReport.coverage;
      
      console.log(`   📊 Average confidence: ${qualityReport.avgConfidence.toFixed(3)}`);
      console.log(`   🎯 Market coverage: ${qualityReport.coverage.toFixed(1)}%`);
      console.log(`   ✅ Quality assessment complete\\n`);
      
      this.results = mergedResults;
      
      return {
        success: true,
        stats: this.stats,
        products: this.results,
        errors: this.errors,
        qualityReport
      };
      
    } catch (error) {
      console.error('💥 Hybrid scan failed:', error.message);
      this.errors.push({ source: 'orchestrator', error: error.message });
      return {
        success: false,
        error: error.message,
        stats: this.stats,
        products: this.results,
        errors: this.errors
      };
    }
  }

  async runGovernmentScraper() {
    const govScraper = new GovernmentDataScraper({
      debug: this.debugMode,
      test: this.testMode
    });
    
    if (this.testMode) {
      // For testing, just scrape one chain
      await govScraper.scrapeChain('MEGA');
      // Return the actual results structure, not export format
      return {
        success: true,
        products: govScraper.results,
        stats: govScraper.stats,
        errors: govScraper.errors
      };
    } else {
      // Full government scan
      return await govScraper.scrapeAllChains();
    }
  }

  async runBrowserVerification(governmentProducts) {
    const browserScraper = new BrowserAIScraper({
      debug: this.debugMode,
      test: this.testMode,
      mode: 'verification'
    });
    
    try {
      await browserScraper.initialize();
      
      // Select products for verification based on confidence and other factors
      const productsToVerify = this.selectProductsForVerification(governmentProducts);
      
      console.log(`   🎯 Selected ${productsToVerify.length} products for verification`);
      
      const verifications = await browserScraper.verifyProducts(productsToVerify);
      
      // Also fill data gaps for products missing information
      const incompleteProducts = governmentProducts.filter(p => 
        !p.brand || p.confidence < 0.7 || !p.pricePerKg
      );
      
      if (incompleteProducts.length > 0) {
        console.log(`   🔧 Filling data gaps for ${incompleteProducts.length} products`);
        const enhanced = await browserScraper.fillDataGaps(incompleteProducts);
      }
      
      await browserScraper.cleanup();
      return verifications;
      
    } catch (error) {
      console.error(`   ❌ Browser verification failed: ${error.message}`);
      await browserScraper.cleanup();
      return [];
    }
  }

  async runBrowserFullScan() {
    const browserScraper = new BrowserAIScraper({
      debug: this.debugMode,
      test: this.testMode,
      mode: 'full_scan'
    });
    
    try {
      await browserScraper.initialize();
      
      // This would implement a full Browser-AI scan
      // For now, return empty array as this is primarily for hybrid mode
      console.log('   ℹ️ Browser-only mode not yet implemented, using hybrid approach');
      
      await browserScraper.cleanup();
      return [];
      
    } catch (error) {
      console.error(`   ❌ Browser full scan failed: ${error.message}`);
      await browserScraper.cleanup();
      return [];
    }
  }

  selectProductsForVerification(products) {
    // Intelligent selection based on multiple criteria
    const scoredProducts = products.map(product => ({
      product,
      verificationScore: this.calculateVerificationPriority(product)
    }));
    
    // Sort by verification priority (higher score = more important to verify)
    scoredProducts.sort((a, b) => b.verificationScore - a.verificationScore);
    
    // Select top products based on verification ratio
    const count = Math.min(
      Math.ceil(products.length * this.verificationRatio),
      this.testMode ? 3 : 10 // Limit for performance
    );
    
    return scoredProducts.slice(0, count).map(item => item.product);
  }

  calculateVerificationPriority(product) {
    let score = 0;
    
    // Low confidence products need verification (high priority)
    if (product.confidence < 0.7) score += 30;
    if (product.confidence < 0.5) score += 20;
    
    // Expensive products need verification (price errors costly)
    if (product.price > 100) score += 20;
    if (product.price > 200) score += 30;
    
    // Suspiciously cheap products
    if (product.price < 10) score += 25;
    
    // Missing data reduces reliability
    if (!product.brand) score += 15;
    if (!product.pricePerKg) score += 10;
    
    // High-volume chains get priority
    if (['MEGA', 'SHUFERSAL', 'RAMI_LEVY'].includes(product.chain)) score += 10;
    
    return score;
  }

  async mergeAndScore(governmentData, browserVerifications) {
    console.log('   🔄 Merging government and browser data...');
    
    let baseProducts = [];
    
    // Start with government products as base
    if (governmentData?.products) {
      baseProducts = [...governmentData.products];
      console.log(`   📊 Base: ${baseProducts.length} government products`);
    }
    
    // Apply browser verifications and enhancements
    if (browserVerifications && browserVerifications.length > 0) {
      console.log(`   🤖 Applying ${browserVerifications.length} browser verifications`);
      
      for (const verification of browserVerifications) {
        const govProduct = verification.governmentProduct;
        const govIndex = baseProducts.findIndex(p => p.id === govProduct.id);
        
        if (govIndex !== -1) {
          // Update the government product with verification results
          baseProducts[govIndex] = this.applyVerification(baseProducts[govIndex], verification);
        }
      }
    }
    
    // Calculate hybrid confidence scores
    baseProducts = baseProducts.map(product => ({
      ...product,
      hybridConfidence: this.calculateHybridConfidence(product),
      source: this.determineSource(product)
    }));
    
    // Deduplicate products
    const deduplicated = this.deduplicateProducts(baseProducts);
    
    console.log(`   🧹 Deduplicated: ${baseProducts.length} → ${deduplicated.length} products`);
    
    // Sort by hybrid confidence (best first)
    deduplicated.sort((a, b) => b.hybridConfidence - a.hybridConfidence);
    
    return deduplicated;
  }

  applyVerification(governmentProduct, verification) {
    const { verification: verif, enhancedConfidence } = verification;
    
    return {
      ...governmentProduct,
      verification: verif,
      originalConfidence: governmentProduct.confidence,
      confidence: enhancedConfidence,
      verified: verif.verified,
      verificationSource: verification.siteProduct?.site || 'browser-ai'
    };
  }

  calculateHybridConfidence(product) {
    let hybridScore = product.confidence || 0;
    
    // Government data base weight: 0.7
    const govWeight = 0.7;
    hybridScore *= govWeight;
    
    // Browser verification bonus: up to 0.3
    if (product.verification) {
      const verificationBonus = product.verification.confidence * 0.3;
      hybridScore += verificationBonus;
    }
    
    // Data completeness bonus
    let completenessBonus = 0;
    if (product.brand) completenessBonus += 0.02;
    if (product.pricePerKg) completenessBonus += 0.02;
    if (product.barcode) completenessBonus += 0.01;
    
    hybridScore += completenessBonus;
    
    // Hebrew processing quality bonus
    if (this.hasGoodHebrewProcessing(product)) {
      hybridScore += 0.05;
    }
    
    return Math.min(1.0, Math.max(0.0, hybridScore));
  }

  hasGoodHebrewProcessing(product) {
    // Check if Hebrew text is properly processed
    const hebrewPattern = /[א-ת]/;
    return hebrewPattern.test(product.name) && 
           product.name.length > 5 && 
           !product.name.includes('?') && // No encoding issues
           !product.name.includes('�'); // No replacement characters
  }

  determineSource(product) {
    if (product.verification && product.verification.verified) {
      return 'hybrid-verified';
    } else if (product.source === 'government') {
      return 'government';
    } else {
      return 'browser-ai';
    }
  }

  deduplicateProducts(products) {
    const uniqueProducts = new Map();
    let duplicatesRemoved = 0;
    
    products.forEach(product => {
      // Create deduplication key based on normalized name and price
      const normalizedName = product.name
        .toLowerCase()
        .replace(/[^א-ת\\w]/g, '') // Remove non-Hebrew/non-alphanumeric
        .substring(0, 20);
      
      const priceKey = product.price ? Math.round(product.price * 10) : 'no-price';
      const key = `${product.chain}-${normalizedName}-${priceKey}`;
      
      if (!uniqueProducts.has(key)) {
        uniqueProducts.set(key, product);
      } else {
        duplicatesRemoved++;
        const existing = uniqueProducts.get(key);
        
        // Keep the product with higher hybrid confidence
        if (product.hybridConfidence > existing.hybridConfidence) {
          uniqueProducts.set(key, product);
        }
      }
    });
    
    if (this.debugMode && duplicatesRemoved > 0) {
      console.log(`   🧹 Removed ${duplicatesRemoved} duplicates`);
    }
    
    return Array.from(uniqueProducts.values());
  }

  assessQuality(products) {
    if (products.length === 0) {
      return { avgConfidence: 0, coverage: 0, qualityGrades: {} };
    }
    
    const avgConfidence = products.reduce((sum, p) => sum + p.hybridConfidence, 0) / products.length;
    
    // Calculate coverage metrics
    const uniqueChains = new Set(products.map(p => p.chain)).size;
    const verifiedProducts = products.filter(p => p.verified).length;
    const completeProducts = products.filter(p => p.brand && p.pricePerKg).length;
    
    const coverage = Math.min(100, (uniqueChains / 10) * 100); // Assume 10 major chains
    
    const qualityGrades = {
      excellent: products.filter(p => p.hybridConfidence >= 0.9).length,
      good: products.filter(p => p.hybridConfidence >= 0.7 && p.hybridConfidence < 0.9).length,
      fair: products.filter(p => p.hybridConfidence >= 0.5 && p.hybridConfidence < 0.7).length,
      poor: products.filter(p => p.hybridConfidence < 0.5).length
    };
    
    return {
      avgConfidence,
      coverage,
      uniqueChains,
      verifiedProducts,
      completeProducts,
      qualityGrades,
      totalProducts: products.length
    };
  }

  exportResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + 'T' + 
                      new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    
    const outputDir = path.join(__dirname, '..', 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const exportData = {
      scanInfo: {
        source: 'hybrid',
        method: 'government-data + browser-ai-verification',
        mode: this.mode,
        timestamp: new Date().toISOString(),
        testMode: this.testMode,
        verificationRatio: this.verificationRatio
      },
      stats: this.stats,
      products: this.results,
      errors: this.errors
    };

    const jsonFile = path.join(outputDir, `hybrid-scan-${timestamp}.json`);
    fs.writeFileSync(jsonFile, JSON.stringify(exportData, null, 2));
    
    console.log(`💾 Hybrid scan results exported: ${path.basename(jsonFile)}`);
    return { jsonFile, productCount: this.results.length };
  }
}

export default HybridScannerOrchestrator;