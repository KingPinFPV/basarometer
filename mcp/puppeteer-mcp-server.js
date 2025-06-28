#!/usr/bin/env node

/**
 * Basarometer Puppeteer MCP Server
 * Specialized for Hebrew text extraction and Israeli retail websites
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

class BasarometerPuppeteerServer {
  constructor() {
    this.server = new Server(
      {
        name: "basarometer-puppeteer",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.browser = null;
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "extract_hebrew_products",
            description: "Extract Hebrew meat products from Israeli retail websites",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "URL of the Israeli retail website"
                },
                retailer: {
                  type: "string",
                  enum: ["shufersal", "rami-levy", "mega", "yohananof", "victory", "yeinot-bitan", "hazi-hinam", "tiv-taam"],
                  description: "Retailer identifier for specialized extraction"
                },
                category_selector: {
                  type: "string",
                  description: "CSS selector for meat category (optional)"
                }
              },
              required: ["url", "retailer"]
            }
          },
          {
            name: "hebrew_text_processor",
            description: "Process Hebrew text for meat product identification",
            inputSchema: {
              type: "object",
              properties: {
                text: {
                  type: "string",
                  description: "Hebrew text to process"
                },
                processing_type: {
                  type: "string",
                  enum: ["normalize", "classify", "extract_price", "detect_meat"],
                  description: "Type of Hebrew processing to perform"
                }
              },
              required: ["text", "processing_type"]
            }
          },
          {
            name: "stealth_browser_session",
            description: "Create stealth browser session for Israeli websites",
            inputSchema: {
              type: "object",
              properties: {
                target_url: {
                  type: "string",
                  description: "Target Israeli website URL"
                },
                action: {
                  type: "string",
                  enum: ["screenshot", "extract_html", "wait_for_selector", "scroll_and_extract"],
                  description: "Browser action to perform"
                },
                selector: {
                  type: "string",
                  description: "CSS selector (if needed for action)"
                }
              },
              required: ["target_url", "action"]
            }
          },
          {
            name: "validate_meat_extraction",
            description: "Validate extracted data against meat_names_mapping.json patterns",
            inputSchema: {
              type: "object",
              properties: {
                extracted_products: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      price: { type: "string" },
                      retailer: { type: "string" }
                    }
                  },
                  description: "Array of extracted product objects"
                }
              },
              required: ["extracted_products"]
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case "extract_hebrew_products":
            return await this.extractHebrewProducts(request.params.arguments);
          case "hebrew_text_processor":
            return await this.processHebrewText(request.params.arguments);
          case "stealth_browser_session":
            return await this.stealthBrowserSession(request.params.arguments);
          case "validate_meat_extraction":
            return await this.validateMeatExtraction(request.params.arguments);
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`
            }
          ]
        };
      }
    });
  }

  async ensureBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--lang=he-IL'
        ]
      });
    }
    return this.browser;
  }

  async extractHebrewProducts(args) {
    const browser = await this.ensureBrowser();
    const page = await browser.newPage();
    
    try {
      // Set Hebrew locale and timezone
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8'
      });
      
      await page.goto(args.url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Retailer-specific extraction logic
      let products = [];
      
      switch (args.retailer) {
        case "shufersal":
          products = await this.extractShufersal(page, args.category_selector);
          break;
        case "rami-levy":
          products = await this.extractRamiLevy(page, args.category_selector);
          break;
        case "mega":
          products = await this.extractMega(page, args.category_selector);
          break;
        default:
          products = await this.extractGeneric(page, args.category_selector);
      }
      
      return {
        content: [
          {
            type: "text",
            text: `🥩 Extracted ${products.length} Hebrew meat products from ${args.retailer}:\n\n${JSON.stringify(products, null, 2)}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Hebrew extraction failed: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async extractShufersal(page, selector) {
    // Shufersal-specific extraction logic
    const products = await page.evaluate((sel) => {
      const items = document.querySelectorAll(sel || '.product-item, .item-product');
      return Array.from(items).map(item => {
        const name = item.querySelector('.product-name, .item-name')?.textContent?.trim();
        const price = item.querySelector('.price, .item-price')?.textContent?.trim();
        return { name, price, retailer: 'shufersal' };
      }).filter(p => p.name);
    }, selector);
    
    return products;
  }

  async extractRamiLevy(page, selector) {
    // Rami Levy-specific extraction logic
    const products = await page.evaluate((sel) => {
      const items = document.querySelectorAll(sel || '.product, .product-tile');
      return Array.from(items).map(item => {
        const name = item.querySelector('.product-title, .title')?.textContent?.trim();
        const price = item.querySelector('.price-current, .price')?.textContent?.trim();
        return { name, price, retailer: 'rami-levy' };
      }).filter(p => p.name);
    }, selector);
    
    return products;
  }

  async extractMega(page, selector) {
    // Mega-specific extraction logic
    const products = await page.evaluate((sel) => {
      const items = document.querySelectorAll(sel || '.product-card, .product-item');
      return Array.from(items).map(item => {
        const name = item.querySelector('.product-name, .card-title')?.textContent?.trim();
        const price = item.querySelector('.price, .product-price')?.textContent?.trim();
        return { name, price, retailer: 'mega' };
      }).filter(p => p.name);
    }, selector);
    
    return products;
  }

  async extractGeneric(page, selector) {
    // Generic extraction for unknown retailers
    const products = await page.evaluate((sel) => {
      const selectors = [
        '.product', '.product-item', '.item', '.card',
        '[data-product]', '[class*="product"]'
      ];
      const usedSelector = sel || selectors.find(s => document.querySelector(s));
      
      if (!usedSelector) return [];
      
      const items = document.querySelectorAll(usedSelector);
      return Array.from(items).map(item => {
        const nameSelectors = [
          '.name', '.title', '.product-name', '.item-name',
          'h1', 'h2', 'h3', '[class*="name"]', '[class*="title"]'
        ];
        const priceSelectors = [
          '.price', '.cost', '.amount', '[class*="price"]',
          '[class*="cost"]', '[data-price]'
        ];
        
        const name = nameSelectors.map(s => item.querySelector(s)?.textContent?.trim())
          .find(text => text);
        const price = priceSelectors.map(s => item.querySelector(s)?.textContent?.trim())
          .find(text => text);
          
        return { name, price, retailer: 'generic' };
      }).filter(p => p.name);
    }, selector);
    
    return products;
  }

  async processHebrewText(args) {
    const { text, processing_type } = args;
    
    let result;
    
    switch (processing_type) {
      case "normalize":
        // Hebrew text normalization
        result = this.normalizeHebrew(text);
        break;
      case "classify":
        // Classify if text contains meat terms
        result = this.classifyMeatText(text);
        break;
      case "extract_price":
        // Extract price from Hebrew text
        result = this.extractHebrewPrice(text);
        break;
      case "detect_meat":
        // Detect meat products in Hebrew text
        result = this.detectHebrewMeat(text);
        break;
    }
    
    return {
      content: [
        {
          type: "text",
          text: `🔤 Hebrew text processing (${processing_type}):\n\nInput: "${text}"\nResult: ${JSON.stringify(result, null, 2)}`
        }
      ]
    };
  }

  normalizeHebrew(text) {
    // Remove Hebrew diacritics and normalize
    return text
      .replace(/[\u0591-\u05AF\u05BD-\u05C7]/g, '') // Remove Hebrew diacritics
      .replace(/\s+/g, ' ')
      .trim();
  }

  classifyMeatText(text) {
    const meatKeywords = [
      'בשר', 'עוף', 'כבש', 'חזיר', 'דג', 'טלה', 'פרה',
      'שווארמה', 'קבב', 'נקניק', 'המבורגר', 'קציצה'
    ];
    
    const normalized = this.normalizeHebrew(text.toLowerCase());
    const foundKeywords = meatKeywords.filter(keyword => 
      normalized.includes(keyword)
    );
    
    return {
      isMeat: foundKeywords.length > 0,
      confidence: foundKeywords.length / meatKeywords.length,
      foundKeywords
    };
  }

  extractHebrewPrice(text) {
    // Hebrew price extraction patterns
    const pricePatterns = [
      /(\d+\.?\d*)\s*₪/g,
      /(\d+\.?\d*)\s*שקל/g,
      /מחיר[:\s]*(\d+\.?\d*)/g,
      /(\d+\.?\d*)\s*שח/g
    ];
    
    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          price: match[1] || match[0],
          currency: '₪',
          original: match[0]
        };
      }
    }
    
    return null;
  }

  detectHebrewMeat(text) {
    const meatCategories = {
      'בקר': ['בקר', 'פרה', 'שור', 'אנטריקוט', 'פילה'],
      'עוף': ['עוף', 'תרנגול', 'ברווז', 'הודו'],
      'כבש': ['כבש', 'טלה', 'כתף כבש'],
      'דגים': ['דג', 'סלמון', 'טונה', 'בקלה', 'דניס']
    };
    
    const normalized = this.normalizeHebrew(text.toLowerCase());
    const detected = {};
    
    for (const [category, keywords] of Object.entries(meatCategories)) {
      const found = keywords.filter(keyword => normalized.includes(keyword));
      if (found.length > 0) {
        detected[category] = found;
      }
    }
    
    return detected;
  }

  async stealthBrowserSession(args) {
    const browser = await this.ensureBrowser();
    const page = await browser.newPage();
    
    try {
      // Stealth configuration
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });
      
      await page.goto(args.target_url, { waitUntil: 'networkidle2' });
      
      let result;
      
      switch (args.action) {
        case "screenshot":
          const screenshot = await page.screenshot({ encoding: 'base64' });
          result = { type: 'screenshot', data: screenshot };
          break;
        case "extract_html":
          const html = await page.content();
          result = { type: 'html', data: html.substring(0, 10000) };
          break;
        case "wait_for_selector":
          await page.waitForSelector(args.selector, { timeout: 10000 });
          result = { type: 'selector_found', selector: args.selector };
          break;
        case "scroll_and_extract":
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await new Promise(resolve => setTimeout(resolve, 2000));
          const content = await page.content();
          result = { type: 'content_after_scroll', data: content.substring(0, 10000) };
          break;
      }
      
      return {
        content: [
          {
            type: "text",
            text: `🤖 Stealth browser action completed: ${args.action}\n\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } finally {
      await page.close();
    }
  }

  async validateMeatExtraction(args) {
    const { extracted_products } = args;
    
    let validProducts = 0;
    let meatProducts = 0;
    const validation = [];
    
    for (const product of extracted_products) {
      const classification = this.classifyMeatText(product.name || '');
      const priceValidation = this.extractHebrewPrice(product.price || '');
      
      const isValid = classification.isMeat && priceValidation;
      if (isValid) {
        validProducts++;
        if (classification.isMeat) meatProducts++;
      }
      
      validation.push({
        product: product.name,
        isMeat: classification.isMeat,
        hasPrice: !!priceValidation,
        isValid,
        confidence: classification.confidence
      });
    }
    
    const report = {
      total_products: extracted_products.length,
      valid_products: validProducts,
      meat_products: meatProducts,
      success_rate: (validProducts / extracted_products.length * 100).toFixed(1) + '%',
      validation_details: validation
    };
    
    return {
      content: [
        {
          type: "text",
          text: `🧪 Meat extraction validation:\n\n${JSON.stringify(report, null, 2)}`
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Cleanup on exit
    process.on('SIGINT', async () => {
      if (this.browser) {
        await this.browser.close();
      }
      process.exit(0);
    });
  }
}

const server = new BasarometerPuppeteerServer();
server.run().catch(console.error);