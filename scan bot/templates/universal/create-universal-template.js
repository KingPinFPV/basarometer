#!/usr/bin/env node

/**
 * 📋 Universal Israeli Retail Template
 * Based on Shufersal analysis, create template for ANY Israeli retail site
 */

import fs from 'fs/promises';
import path from 'path';
import { ShufersalMasterAnalyzer } from '../shufersal/shufersal-master-analyzer.js';

class UniversalTemplateGenerator {
  constructor() {
    this.templatePath = path.join(process.cwd(), 'templates', 'universal');
    this.shufersalResults = null;
  }

  async generateFromShufersal() {
    console.log('📋 Generating Universal Template from Shufersal analysis...');
    
    // Load Shufersal analysis results
    const shufersalPath = path.join(process.cwd(), 'analysis-results', 'shufersal', 'complete-analysis.json');
    try {
      this.shufersalResults = JSON.parse(await fs.readFile(shufersalPath, 'utf8'));
    } catch (error) {
      console.log('⚠️ No Shufersal results found, using defaults');
      this.shufersalResults = { hebrewKeywords: [], phases: {} };
    }
    
    const template = {
      metadata: {
        name: 'Israeli Retail Universal Template',
        version: '1.0',
        source: 'Shufersal Master Analysis',
        created: new Date().toISOString(),
        description: 'Universal template for analyzing any Israeli retail website'
      },
      
      hebrewProcessing: {
        keywords: this.shufersalResults.hebrewKeywords || [
          'בשר', 'עוף', 'דגים', 'קצבייה', 'בקר', 'עגל', 'כבש'
        ],
        rtlSupport: true,
        encoding: 'utf-8',
        textDirection: 'rtl'
      },
      
      commonSelectors: this.extractCommonSelectors(),
      analysisSteps: this.defineAnalysisSteps(),
      confidenceScoring: this.defineConfidenceScoring(),
      fallbackStrategies: this.defineFallbackStrategies(),
      
      sitePatterns: {
        israeli_retail: {
          typical_selectors: {
            product: ['.product', '.product-item', '.product-tile', '.product-card'],
            name: ['.name', '.title', '.product-name', 'h3', 'h4'],
            price: ['.price', '.cost', '.product-price', '[class*="price"]'],
            image: ['img']
          },
          navigation_patterns: [
            'nav', '.navigation', '.menu', 'header a'
          ],
          category_patterns: [
            'a[href*="category"]', 'a[href*="קטגור"]', '.category'
          ]
        }
      }
    };
    
    // Save template
    const templateFile = path.join(this.templatePath, 'israeli-retail-template.json');
    await fs.writeFile(templateFile, JSON.stringify(template, null, 2));
    
    // Create JavaScript implementation
    await this.createJavaScriptTemplate(template);
    
    console.log(`✅ Universal template saved to: ${templateFile}`);
    return template;
  }

  extractCommonSelectors() {
    // Extract the most reliable selectors from Shufersal analysis
    return {
      product: {
        primary: '.product-item',
        alternatives: ['.product', '.product-tile', '.product-card', '[data-product]'],
        confidence_threshold: 0.7
      },
      name: {
        primary: '.product-name',
        alternatives: ['.name', '.title', 'h3', 'h4'],
        confidence_threshold: 0.6
      },
      price: {
        primary: '.price',
        alternatives: ['.cost', '.product-price', '[class*="price"]'],
        confidence_threshold: 0.8
      }
    };
  }

  defineAnalysisSteps() {
    return [
      {
        step: 1,
        name: 'Site Architecture Discovery',
        description: 'Map complete site structure and navigation',
        required: true
      },
      {
        step: 2,
        name: 'Hebrew Content Analysis',
        description: 'Analyze Hebrew text support and meat keywords',
        required: true
      },
      {
        step: 3,
        name: 'Category Discovery',
        description: 'Find and analyze meat product categories',
        required: true
      },
      {
        step: 4,
        name: 'Product Pattern Recognition',
        description: 'Identify product structure patterns',
        required: true
      },
      {
        step: 5,
        name: 'Selector Generation',
        description: 'Generate intelligent selectors with fallbacks',
        required: true
      },
      {
        step: 6,
        name: 'Performance Testing',
        description: 'Test speed, accuracy, and reliability',
        required: false
      }
    ];
  }

  defineConfidenceScoring() {
    return {
      factors: {
        selector_reliability: { weight: 0.3, description: 'How consistently selectors work' },
        product_count: { weight: 0.25, description: 'Number of products found' },
        hebrew_support: { weight: 0.2, description: 'Quality of Hebrew text processing' },
        category_discovery: { weight: 0.15, description: 'Success in finding meat categories' },
        performance: { weight: 0.1, description: 'Speed and efficiency' }
      },
      thresholds: {
        excellent: 0.9,
        good: 0.75,
        acceptable: 0.6,
        poor: 0.4
      }
    };
  }

  defineFallbackStrategies() {
    return {
      selector_fallback: {
        strategy: 'Try primary selector, then alternatives in order',
        implementation: 'for (const selector of [primary, ...alternatives]) { try { elements = page.$(selector); if (elements.length > 0) break; } catch(e) { continue; } }'
      },
      content_fallback: {
        strategy: 'Use multiple content detection methods',
        implementation: 'Try text content, then attribute values, then DOM structure'
      },
      hebrew_fallback: {
        strategy: 'Multiple Hebrew detection approaches',
        implementation: 'Unicode range detection + keyword matching + RTL detection'
      }
    };
  }

  async createJavaScriptTemplate(template) {
    const jsTemplate = `
/**
 * 📋 Universal Israeli Retail Site Analyzer
 * Auto-generated from Shufersal template analysis
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';

export class UniversalIsraeliRetailAnalyzer {
  constructor(siteName, siteUrl) {
    this.siteName = siteName;
    this.siteUrl = siteUrl;
    this.template = ${JSON.stringify(template, null, 4)};
  }

  async analyzeNewSite() {
    console.log(\`🔍 Analyzing \${this.siteName} using universal template...\`);
    
    const browser = await puppeteer.launch({ headless: false, slowMo: 100 });
    const page = await browser.newPage();
    
    try {
      await page.goto(this.siteUrl, { waitUntil: 'networkidle2' });
      
      const analysis = {
        siteName: this.siteName,
        siteUrl: this.siteUrl,
        timestamp: new Date().toISOString(),
        phases: {}
      };
      
      // Apply each analysis step
      for (const step of this.template.analysisSteps) {
        if (step.required) {
          console.log(\`📋 Step \${step.step}: \${step.name}\`);
          analysis.phases[step.name.toLowerCase().replace(/\\s+/g, '_')] = 
            await this.executeStep(page, step);
        }
      }
      
      // Generate config
      analysis.config = await this.generateConfig(analysis);
      
      await browser.close();
      return analysis;
      
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  async executeStep(page, step) {
    // Implementation would go here based on step type
    // This is a template - specific implementation depends on the step
    return { status: 'completed', data: {} };
  }

  async generateConfig(analysis) {
    // Generate config based on analysis using template patterns
    return {
      baseUrl: this.siteUrl,
      selectors: this.template.sitePatterns.israeli_retail.typical_selectors,
      // ... rest of config
    };
  }
}
`;

    await fs.writeFile(
      path.join(this.templatePath, 'universal-analyzer.js'),
      jsTemplate
    );
  }
}

// Export and run if called directly
export { UniversalTemplateGenerator };

if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new UniversalTemplateGenerator();
  generator.generateFromShufersal()
    .then(() => console.log('🎉 Universal template generated!'))
    .catch(error => console.error('❌ Template generation failed:', error));
}