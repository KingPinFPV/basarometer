/**
 * Browser-AI Scraper Module  
 * Refactored from existing basarometer-scanner.js for reusable verification
 * Handles quality verification and gap filling for government data
 */

import puppeteer from 'puppeteer-extra';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Import existing utilities
import { isMeatProduct, detectMeatCategory, calculateConfidence } from '../utils/meat-detector.js';
import { extractPrice, extractUnit, calculatePricePerKg, validatePrice } from '../utils/price-extractor.js';
import { cleanProductName, generateProductId } from '../utils/name-normalizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup Puppeteer
puppeteer.use(StealthPlugin());

export class BrowserAIScraper {
  constructor(options = {}) {
    this.debugMode = options.debug || false;
    this.testMode = options.test || false;
    this.maxPages = this.testMode ? 2 : 5;
    this.mode = options.mode || 'verification'; // 'verification', 'gap_filling', 'full_scan'
    
    this.results = [];
    this.errors = [];
    this.stats = { 
      sitesScanned: 0, 
      productsScanned: 0, 
      verified: 0, 
      failed: 0,
      confidence: 0
    };
    
    // Load site configurations
    this.siteConfigs = this.loadSiteConfigs();
  }

  loadSiteConfigs() {
    try {
      const configPath = path.join(__dirname, '..', 'config', 'meat-sites.json');
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (error) {
      console.error('❌ Failed to load site configs:', error.message);
      return {};
    }
  }

  async initialize() {
    console.log('🤖 Initializing Browser-AI Scraper...');
    
    this.browser = await puppeteer.launch({
      headless: !this.debugMode,
      defaultViewport: null,
      args: [
        '--no-sandbox', 
        '--start-maximized',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();
    
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8'
    });

    console.log('✅ Browser-AI initialized');
  }

  async verifyProducts(governmentProducts) {
    console.log('🔍 Starting product verification...');
    console.log(`📊 Verifying ${governmentProducts.length} government products`);
    
    const verificationsNeeded = this.selectProductsForVerification(governmentProducts);
    console.log(`🎯 Selected ${verificationsNeeded.length} products for verification`);
    
    const verificationResults = [];
    
    for (const product of verificationsNeeded) {
      const verification = await this.verifyProduct(product);
      if (verification) {
        verificationResults.push(verification);
      }
    }
    
    console.log(`✅ Completed ${verificationResults.length} verifications`);
    return verificationResults;
  }

  selectProductsForVerification(products) {
    // Smart selection: prioritize products that need verification
    const needVerification = products.filter(product => {
      // Verify products with low confidence or suspicious data
      return product.confidence < 0.8 || 
             product.price > 200 || 
             product.price < 10 ||
             !product.brand ||
             !product.pricePerKg;
    });
    
    // In test mode, limit to a few products
    const limit = this.testMode ? 3 : Math.min(needVerification.length, 10);
    return needVerification.slice(0, limit);
  }

  async verifyProduct(governmentProduct) {
    console.log(`  🔍 Verifying: ${governmentProduct.name}`);
    
    try {
      // Find appropriate site for verification
      const targetSite = this.findBestSiteForProduct(governmentProduct);
      if (!targetSite) {
        console.log(`    ⚠️ No suitable site found for verification`);
        return null;
      }
      
      // Search for product on the target site
      const foundProducts = await this.searchProductOnSite(governmentProduct, targetSite);
      
      if (foundProducts.length > 0) {
        // Find best match
        const bestMatch = this.findBestMatch(governmentProduct, foundProducts);
        
        if (bestMatch) {
          const verification = this.compareProducts(governmentProduct, bestMatch);
          console.log(`    ✅ Verified with ${verification.confidence.toFixed(2)} confidence`);
          return verification;
        }
      }
      
      console.log(`    ❌ Product not found for verification`);
      return null;
      
    } catch (error) {
      console.log(`    💥 Verification failed: ${error.message}`);
      return null;
    }
  }

  findBestSiteForProduct(product) {
    // Logic to determine which site is most likely to have this product
    // Based on chain similarity, product categories, etc.
    
    const chain = product.chain;
    const availableSites = Object.keys(this.siteConfigs);
    
    // First preference: same chain if available in our configs
    if (availableSites.includes(chain.toLowerCase().replace('_', '-'))) {
      return chain.toLowerCase().replace('_', '-');
    }
    
    // Second preference: similar chains
    if (chain === 'MEGA' && availableSites.includes('carrefour')) {
      return 'carrefour';
    }
    
    if (chain === 'RAMI_LEVY' && availableSites.includes('rami-levy')) {
      return 'rami-levy';
    }
    
    // Default fallback
    return availableSites.includes('rami-levy') ? 'rami-levy' : availableSites[0];
  }

  async searchProductOnSite(targetProduct, siteKey) {
    const config = this.siteConfigs[siteKey];
    if (!config) {
      throw new Error(`Site config not found: ${siteKey}`);
    }
    
    console.log(`    🌐 Searching on ${config.name}...`);
    
    // Use first meat category for the search
    const categoryUrl = config.baseUrl + config.meatCategories[0];
    
    try {
      await this.page.goto(categoryUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Handle Cloudflare if needed
      if (config.cloudflareWait) {
        await this.delay(config.cloudflareWait);
      }
      
      await this.waitForContent(config.waitSelectors);
      
      // Extract products from the page
      const products = await this.extractProducts(siteKey, config);
      
      // Filter for meat products
      const meatProducts = products.filter(p => isMeatProduct(p.name));
      
      console.log(`    📦 Found ${meatProducts.length} meat products on site`);
      return meatProducts.map(p => this.processProduct(p, siteKey));
      
    } catch (error) {
      console.log(`    ⚠️ Search failed on ${config.name}: ${error.message}`);
      return [];
    }
  }

  findBestMatch(governmentProduct, siteProducts) {
    let bestMatch = null;
    let bestScore = 0;
    
    for (const product of siteProducts) {
      const score = this.calculateMatchScore(governmentProduct, product);
      if (score > bestScore && score > 0.5) { // Minimum threshold
        bestScore = score;
        bestMatch = product;
      }
    }
    
    return bestMatch;
  }

  calculateMatchScore(gov, site) {
    let score = 0;
    const maxScore = 100;
    
    // Name similarity (40 points)
    const nameSimilarity = this.calculateStringSimilarity(
      gov.name.toLowerCase(),
      site.name.toLowerCase()
    );
    score += nameSimilarity * 40;
    
    // Price similarity (30 points)
    if (gov.price && site.price) {
      const priceDiff = Math.abs(gov.price - site.price) / Math.max(gov.price, site.price);
      score += Math.max(0, (1 - priceDiff * 2)) * 30; // Max 50% price difference
    }
    
    // Brand match (20 points)
    if (gov.brand && site.brand) {
      if (gov.brand.toLowerCase() === site.brand.toLowerCase()) {
        score += 20;
      }
    }
    
    // Category match (10 points)
    if (gov.meatCategory && site.category) {
      if (gov.meatCategory === site.category) {
        score += 10;
      }
    }
    
    return score / maxScore;
  }

  calculateStringSimilarity(str1, str2) {
    // Simple string similarity using common words
    const words1 = str1.split(/\\s+/).filter(w => w.length > 2);
    const words2 = str2.split(/\\s+/).filter(w => w.length > 2);
    
    let commonWords = 0;
    for (const word1 of words1) {
      if (words2.some(word2 => word1.includes(word2) || word2.includes(word1))) {
        commonWords++;
      }
    }
    
    return commonWords / Math.max(words1.length, words2.length);
  }

  compareProducts(governmentProduct, siteProduct) {
    const priceDiff = Math.abs(governmentProduct.price - siteProduct.price);
    const priceDiffPercent = priceDiff / governmentProduct.price;
    
    let verificationConfidence = 0.7; // Base confidence for finding a match
    
    // Boost confidence for close price match
    if (priceDiffPercent < 0.1) verificationConfidence += 0.2; // Within 10%
    else if (priceDiffPercent < 0.2) verificationConfidence += 0.1; // Within 20%
    else if (priceDiffPercent > 0.5) verificationConfidence -= 0.3; // Over 50% difference
    
    // Boost for brand match
    if (governmentProduct.brand && siteProduct.brand && 
        governmentProduct.brand.toLowerCase() === siteProduct.brand.toLowerCase()) {
      verificationConfidence += 0.1;
    }
    
    return {
      governmentProduct,
      siteProduct,
      verification: {
        priceMatch: priceDiffPercent < 0.3,
        priceDifference: priceDiff,
        priceDifferencePercent: priceDiffPercent,
        brandMatch: governmentProduct.brand === siteProduct.brand,
        confidence: Math.min(1.0, Math.max(0.0, verificationConfidence)),
        verified: verificationConfidence > 0.6
      },
      enhancedConfidence: Math.min(1.0, governmentProduct.confidence + (verificationConfidence * 0.3))
    };
  }

  async fillDataGaps(incompleteProducts) {
    console.log('🔧 Starting data gap filling...');
    console.log(`📊 Processing ${incompleteProducts.length} incomplete products`);
    
    const enhancedProducts = [];
    
    for (const product of incompleteProducts.slice(0, this.testMode ? 3 : 10)) {
      const enhanced = await this.enhanceProduct(product);
      if (enhanced) {
        enhancedProducts.push(enhanced);
      }
    }
    
    console.log(`✅ Enhanced ${enhancedProducts.length} products`);
    return enhancedProducts;
  }

  async enhanceProduct(product) {
    // Logic to fill missing data (brand, category, etc.) using Browser-AI
    console.log(`  🔧 Enhancing: ${product.name}`);
    
    try {
      // Similar to verification but focused on data enhancement
      const targetSite = this.findBestSiteForProduct(product);
      if (!targetSite) return product;
      
      const foundProducts = await this.searchProductOnSite(product, targetSite);
      const bestMatch = this.findBestMatch(product, foundProducts);
      
      if (bestMatch) {
        // Enhance the original product with missing data
        const enhanced = { ...product };
        
        if (!enhanced.brand && bestMatch.brand) {
          enhanced.brand = bestMatch.brand;
          enhanced.confidence += 0.1;
        }
        
        if (!enhanced.meatCategory && bestMatch.category) {
          enhanced.meatCategory = bestMatch.category;
          enhanced.confidence += 0.05;
        }
        
        if (!enhanced.pricePerKg && bestMatch.pricePerKg) {
          enhanced.pricePerKg = bestMatch.pricePerKg;
          enhanced.confidence += 0.05;
        }
        
        console.log(`    ✅ Enhanced with data from ${targetSite}`);
        return enhanced;
      }
      
      console.log(`    ⚠️ No enhancement data found`);
      return product;
      
    } catch (error) {
      console.log(`    💥 Enhancement failed: ${error.message}`);
      return product;
    }
  }

  // Reuse existing methods from basarometer-scanner.js
  async extractProducts(siteKey, config) {
    let retries = 3;
    
    while (retries > 0) {
      try {
        const products = await this.page.evaluate((selectors) => {
          const products = [];
          const containers = document.querySelectorAll(selectors.productContainer);

          containers.forEach(container => {
            try {
              let nameEl = null;
              const nameSelectors = selectors.productName.split(', ');
              for (const selector of nameSelectors) {
                nameEl = container.querySelector(selector);
                if (nameEl && nameEl.textContent?.trim()) break;
              }

              let priceEl = null;
              const priceSelectors = selectors.productPrice.split(', ');
              for (const selector of priceSelectors) {
                priceEl = container.querySelector(selector);
                if (priceEl && priceEl.textContent?.trim()) break;
              }

              let imageEl = null;
              const imageSelectors = selectors.productImage.split(', ');
              for (const selector of imageSelectors) {
                imageEl = container.querySelector(selector);
                if (imageEl && imageEl.src) break;
              }

              if (nameEl) {
                const name = nameEl.textContent?.trim() || '';
                const priceText = priceEl?.textContent?.trim() || '';
                const imageUrl = imageEl?.src || '';

                const containerText = container.textContent || '';
                const priceMatch = containerText.match(/₪\\s*(\\d+(?:\\.\\d{1,2})?)/);
                const actualPriceText = priceText || (priceMatch ? priceMatch[0] : '');

                if (name.length > 2) {
                  products.push({
                    name,
                    priceText: actualPriceText,
                    imageUrl,
                    elementHtml: container.outerHTML.substring(0, 500)
                  });
                }
              }
            } catch (err) {
              console.log('Error extracting product:', err.message);
            }
          });

          return products;
        }, config.selectors);
        
        if (products.length > 0) {
          return products;
        }
        
        retries--;
        if (retries > 0) {
          await this.delay(2000);
        }

      } catch (error) {
        retries--;
        if (retries > 0) {
          await this.delay(2000);
        }
      }
    }
    
    return [];
  }

  processProduct(rawProduct, siteKey) {
    const nameData = cleanProductName(rawProduct.name);
    const price = extractPrice(rawProduct.priceText);
    const unitInfo = extractUnit(rawProduct.priceText + ' ' + rawProduct.name);
    const category = detectMeatCategory(rawProduct.name);
    const confidence = calculateConfidence(rawProduct.name, price, nameData.weight, nameData.brand);

    return {
      id: generateProductId(rawProduct.name, siteKey),
      name: nameData.cleanName,
      originalName: nameData.originalName,
      normalizedName: nameData.normalizedName,
      brand: nameData.brand,
      weight: nameData.weight,
      price: price,
      unit: unitInfo.display || unitInfo,
      pricePerKg: calculatePricePerKg(price, unitInfo, nameData.weight),
      site: siteKey,
      siteName: this.siteConfigs[siteKey]?.name || siteKey,
      category: category,
      confidence: confidence,
      imageUrl: rawProduct.imageUrl,
      timestamp: new Date().toISOString(),
      isValid: validatePrice(price) && confidence > 0.5,
      source: 'browser-ai'
    };
  }

  async waitForContent(waitSelectors) {
    for (const selector of waitSelectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: 10000 });
        return;
      } catch (e) {
        continue;
      }
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Export results compatible with existing format
  exportResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + 'T' + 
                      new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    
    return {
      scanInfo: {
        source: 'browser-ai',
        method: 'verification-enhancement',
        mode: this.mode,
        timestamp: new Date().toISOString(),
        testMode: this.testMode
      },
      products: this.results,
      errors: this.errors,
      stats: this.stats
    };
  }
}

export default BrowserAIScraper;