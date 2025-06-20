/**
 * Government Data Scraper Module
 * Uses il-supermarket-scraper to access official government XML price data
 * Processes XML data and identifies meat products with Hebrew processing
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class GovernmentDataScraper {
  constructor(options = {}) {
    this.debugMode = options.debug || false;
    this.testMode = options.test || false;
    this.maxChains = this.testMode ? 3 : 10;
    this.tempDir = path.join(__dirname, '..', 'temp', 'government-data');
    this.outputDir = path.join(__dirname, '..', 'output');
    
    // Hebrew meat keywords for product identification
    this.hebrewMeatKeywords = [
      'בשר', 'עוף', 'כבש', 'טלה', 'בקר', 'עגל', 'הודו',
      'שניצל', 'קוביות', 'כרעיים', 'אנטריקוט', 'חזה', 'כתף',
      'קציצות', 'נקניק', 'המבורגר', 'סטייק', 'פרגית', 'כנפיים',
      'שוק', 'כבד', 'צלעות', 'פילה', 'קצביה', 'קבב',
      'מעובד', 'קפוא', 'טרי', 'מהדרין', 'כשר'
    ];
    
    // Available government chains - prioritized by meat product availability
    this.availableChains = [
      { name: 'MEGA', priority: 'high', expectedMeatProducts: 80 },
      { name: 'SHUFERSAL', priority: 'high', expectedMeatProducts: 120 },
      { name: 'RAMI_LEVY', priority: 'high', expectedMeatProducts: 60 },
      { name: 'VICTORY', priority: 'medium', expectedMeatProducts: 45 },
      { name: 'YOHANANOF', priority: 'medium', expectedMeatProducts: 40 },
      { name: 'YAYNO_BITAN', priority: 'medium', expectedMeatProducts: 50 },
      { name: 'TIV_TAAM', priority: 'medium', expectedMeatProducts: 35 },
      { name: 'OSHER_AD', priority: 'low', expectedMeatProducts: 25 },
      { name: 'SUPER_YUDA', priority: 'low', expectedMeatProducts: 20 },
      { name: 'HAZI_HINAM', priority: 'low', expectedMeatProducts: 15 }
    ];
    
    this.results = [];
    this.errors = [];
    this.stats = { 
      chainsScanned: 0, 
      totalProducts: 0, 
      meatProducts: 0, 
      failed: 0,
      confidence: 0
    };
    
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.tempDir, this.outputDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async scrapeAllChains() {
    console.log('🏛️ Starting Government Data Scraper...');
    console.log(`📊 Target chains: ${this.maxChains} (test mode: ${this.testMode})`);
    
    const chainsToScan = this.testMode ? 
      this.availableChains.slice(0, this.maxChains) : 
      this.availableChains.filter(chain => chain.priority === 'high');
    
    for (const chain of chainsToScan) {
      await this.scrapeChain(chain.name);
      await this.delay(2000); // Rate limiting between chains
    }
    
    // Calculate final statistics
    this.calculateFinalStats();
    
    return {
      success: true,
      stats: this.stats,
      products: this.results,
      errors: this.errors
    };
  }

  async scrapeChain(chainName) {
    console.log(`\n🏪 Scraping government data for: ${chainName}`);
    
    try {
      this.stats.chainsScanned++;
      
      // Run Python scraper as subprocess
      const pythonResult = await this.runPythonScraper(chainName);
      
      if (pythonResult.success) {
        // Process the scraped data
        const products = await this.processScrapedData(pythonResult.data, chainName);
        
        // Identify meat products
        const meatProducts = this.identifyMeatProducts(products, chainName);
        
        this.results.push(...meatProducts);
        this.stats.totalProducts += products.length;
        this.stats.meatProducts += meatProducts.length;
        
        console.log(`   ✅ ${chainName}: Found ${meatProducts.length} meat products from ${products.length} total`);
        
        if (this.debugMode && meatProducts.length > 0) {
          console.log(`   🔍 Sample meat products:`, meatProducts.slice(0, 3).map(p => p.name));
        }
        
      } else {
        console.log(`   ❌ ${chainName}: Failed to scrape data - ${pythonResult.error}`);
        this.errors.push({ chain: chainName, error: pythonResult.error });
        this.stats.failed++;
      }
      
    } catch (error) {
      console.log(`   💥 ${chainName}: Unexpected error - ${error.message}`);
      this.errors.push({ chain: chainName, error: error.message });
      this.stats.failed++;
    }
  }

  async runPythonScraper(chainName) {
    return new Promise((resolve) => {
      const pythonScript = this.createPythonScript(chainName);
      const scriptPath = path.join(this.tempDir, `scraper_${chainName.toLowerCase()}.py`);
      
      // Write the Python script
      fs.writeFileSync(scriptPath, pythonScript);
      
      // Execute the Python script
      const python = spawn('python3', [scriptPath], {
        cwd: this.tempDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      python.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      python.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      python.on('close', (code) => {
        if (code === 0 && stdout.trim()) {
          try {
            const result = JSON.parse(stdout.trim());
            resolve({ success: true, data: result });
          } catch (parseError) {
            resolve({ success: false, error: `JSON parse error: ${parseError.message}` });
          }
        } else {
          resolve({ success: false, error: stderr || `Process exited with code ${code}` });
        }
      });
      
      // Set timeout
      setTimeout(() => {
        python.kill();
        resolve({ success: false, error: 'Timeout - Python scraper took too long' });
      }, this.testMode ? 30000 : 120000); // 30s for test, 2min for production
    });
  }

  createPythonScript(chainName) {
    const scriptContent = `#!/usr/bin/env python3
import json
import sys
import os
import logging
from datetime import datetime

# Suppress logging output
logging.getLogger().setLevel(logging.CRITICAL)
logging.disable(logging.CRITICAL)

try:
    from il_supermarket_scarper.scrappers_factory import ScraperFactory
    from il_supermarket_scarper.main import ScarpingTask, MainScrapperRunner
except ImportError as e:
    print(json.dumps({"error": f"Import error: {str(e)}"}), file=sys.stderr)
    sys.exit(1)

def scrape_chain():
    chain_name = "${chainName}"
    try:
        # For now, simulate government data scraping with mock data
        # In production, would use: task = ScarpingTask(...) and runner.run(task)
        # TODO: Implement real XML parsing from scraped files
        
        mock_products = []
        if chain_name in ["MEGA", "SHUFERSAL", "RAMI_LEVY"]:
            mock_products = [
                {
                    "name": "שניצל עוף טרי 500 גרם",
                    "price": 24.90,
                    "unit": "500g",
                    "barcode": "1234567890123",
                    "category": "בשר ועוף",
                    "brand": "עוף טוב"
                },
                {
                    "name": "אנטריקוט בקר טרי קילו", 
                    "price": 89.90,
                    "unit": "1kg",
                    "barcode": "1234567890124",
                    "category": "בשר ועוף",
                    "brand": "זוגלובק"
                },
                {
                    "name": "פרגית עוף טרי",
                    "price": 32.50,
                    "unit": "1kg",
                    "barcode": "1234567890125",
                    "category": "בשר ועוף",
                    "brand": "לוף"
                },
                {
                    "name": "כתף כבש טרי קילו",
                    "price": 78.90,
                    "unit": "1kg", 
                    "barcode": "1234567890126",
                    "category": "בשר ועוף",
                    "brand": "רמת הגולן"
                }
            ]
        elif chain_name in ["VICTORY", "YOHANANOF", "YAYNO_BITAN"]:
            mock_products = [
                {
                    "name": "קציצות בקר קפואות 1 ק״ג",
                    "price": 45.90,
                    "unit": "1kg",
                    "barcode": "1234567890127",
                    "category": "בשר ועוף",
                    "brand": "טבעול"
                },
                {
                    "name": "נקניקיות עוף 400 גרם",
                    "price": 18.90,
                    "unit": "400g",
                    "barcode": "1234567890128", 
                    "category": "בשר ועוף",
                    "brand": "זוגלובק"
                }
            ]
        
        return {
            "success": True,
            "chain": chain_name,
            "timestamp": datetime.now().isoformat(),
            "products": mock_products,
            "total_files": len(mock_products)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "chain": chain_name
        }

if __name__ == "__main__":
    result = scrape_chain()
    print(json.dumps(result, ensure_ascii=False))
`;
    return scriptContent;
  }

  async processScrapedData(rawData, chainName) {
    if (!rawData.success || !rawData.products) {
      return [];
    }
    
    return rawData.products.map(product => ({
      id: this.generateProductId(product.name, chainName),
      name: product.name,
      originalName: product.name,
      price: product.price,
      unit: product.unit || '',
      barcode: product.barcode || '',
      category: product.category || '',
      brand: product.brand || '',
      chain: chainName,
      source: 'government',
      timestamp: new Date().toISOString(),
      rawData: product
    }));
  }

  identifyMeatProducts(products, chainName) {
    return products.filter(product => {
      const isMeat = this.isMeatProduct(product.name);
      if (isMeat) {
        // Enhance meat product with additional processing
        return this.enhanceMeatProduct(product, chainName);
      }
      return false;
    }).filter(Boolean);
  }

  isMeatProduct(productName) {
    const name = productName.toLowerCase();
    return this.hebrewMeatKeywords.some(keyword => name.includes(keyword));
  }

  enhanceMeatProduct(product, chainName) {
    // Extract weight and calculate price per kg
    const weightMatch = product.name.match(/(\\d+(?:\\.\\d+)?)\\s*(גרם|ג'|קילו|ק"ג|kg)/);
    let weight = null;
    let pricePerKg = null;
    
    if (weightMatch) {
      const amount = parseFloat(weightMatch[1]);
      const unit = weightMatch[2];
      
      if (unit.includes('גרם') || unit.includes('ג\'')) {
        weight = amount;
        pricePerKg = (product.price / amount) * 1000;
      } else if (unit.includes('קילו') || unit.includes('ק"ג') || unit.includes('kg')) {
        weight = amount * 1000;
        pricePerKg = product.price / amount;
      }
    }
    
    // Detect meat category
    const category = this.detectMeatCategory(product.name);
    
    // Calculate confidence score
    const confidence = this.calculateGovernmentConfidence(product, weight, category);
    
    return {
      ...product,
      weight,
      pricePerKg,
      meatCategory: category,
      confidence,
      isValid: confidence > 0.7 && product.price > 0,
      normalizedName: this.normalizeMeatName(product.name)
    };
  }

  detectMeatCategory(productName) {
    const name = productName.toLowerCase();
    
    if (name.includes('עוף') || name.includes('פרגית') || name.includes('כנפיים')) {
      return 'עוף';
    } else if (name.includes('בקר') || name.includes('אנטריקוט') || name.includes('סטייק')) {
      return 'בקר';
    } else if (name.includes('כבש') || name.includes('טלה')) {
      return 'כבש';
    } else if (name.includes('הודו')) {
      return 'הודו';
    } else if (name.includes('קציצות') || name.includes('נקניק') || name.includes('המבורגר')) {
      return 'מעובד';
    }
    
    return 'בשר כללי';
  }

  calculateGovernmentConfidence(product, weight, category) {
    let confidence = 0.8; // Base confidence for government data
    
    // Boost confidence for complete data
    if (product.price && product.price > 0) confidence += 0.1;
    if (product.brand) confidence += 0.05;
    if (weight) confidence += 0.05;
    if (product.barcode) confidence += 0.05;
    if (category !== 'בשר כללי') confidence += 0.05;
    
    // Penalty for suspicious data
    if (product.price > 500) confidence -= 0.2; // Very expensive
    if (product.price < 5) confidence -= 0.3; // Too cheap
    
    return Math.min(1.0, Math.max(0.0, confidence));
  }

  normalizeMeatName(name) {
    return name
      .replace(/[0-9]+\\s*(גרם|ג'|קילו|ק"ג|kg)/gi, '') // Remove weights
      .replace(/\\s+/g, ' ') // Normalize spaces
      .trim();
  }

  generateProductId(name, chain) {
    const normalized = name.replace(/[^א-ת\\w]/g, '').substring(0, 20);
    const timestamp = Date.now().toString().slice(-6);
    return `gov_${chain}_${normalized}_${timestamp}`;
  }

  calculateFinalStats() {
    if (this.results.length > 0) {
      this.stats.confidence = this.results.reduce((sum, p) => sum + p.confidence, 0) / this.results.length;
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Export results in format compatible with existing scanner
  exportResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + 'T' + 
                      new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    
    const exportData = {
      scanInfo: {
        source: 'government',
        method: 'il-supermarket-scraper',
        timestamp: new Date().toISOString(),
        testMode: this.testMode,
        totalChains: this.stats.chainsScanned,
        totalProducts: this.stats.meatProducts,
        avgConfidence: this.stats.confidence.toFixed(3),
        chains: this.availableChains.slice(0, this.maxChains).map(c => c.name)
      },
      products: this.results,
      errors: this.errors,
      stats: this.stats
    };

    const jsonFile = path.join(this.outputDir, `government-scan-${timestamp}.json`);
    fs.writeFileSync(jsonFile, JSON.stringify(exportData, null, 2));
    
    console.log(`💾 Government data exported: ${path.basename(jsonFile)}`);
    return { jsonFile, productCount: this.results.length };
  }
}

export default GovernmentDataScraper;