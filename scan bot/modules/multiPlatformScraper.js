/**
 * Multi-Platform Scraper for Israeli Meat Vendors
 * Supports WooCommerce, Shopify, custom Hebrew sites, and social media
 */

import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';

class MultiPlatformScraper {
    constructor(options = {}) {
        this.outputDir = options.outputDir || './multi-platform-data';
        this.debug = options.debug || false;
        this.maxRetries = options.maxRetries || 3;
        this.requestDelay = options.requestDelay || 2000;
        
        // Platform detection patterns
        this.platformPatterns = {
            woocommerce: [
                'wc-', 'woocommerce', 'wp-content', 'add-to-cart',
                'product_cat', 'single-product', 'shop'
            ],
            shopify: [
                'shopify', 'myshopify.com', 'product-form',
                'cart/add', 'collections/', 'products/'
            ],
            wordpress: [
                'wp-content', 'wp-includes', 'wp-admin',
                'wordpress', 'wp-json'
            ],
            custom_hebrew: [
                'קניות', 'הזמנה', 'מוצרים', 'קטגוריות',
                'עגלה', 'קופה', 'חנות'
            ],
            social_media: [
                'facebook.com', 'instagram.com', 'whatsapp',
                'telegram', 'tiktok.com'
            ]
        };
        
        // Hebrew product detection
        this.hebrewMeatKeywords = [
            'בשר', 'עוף', 'בקר', 'כבש', 'עגל', 'טלה', 'הודו',
            'קצביה', 'קצבייה', 'אנטריקוט', 'פילה', 'סטייק',
            'שניצל', 'קציצות', 'נקניק', 'המבורגר', 'קבב',
            'חזה', 'שוק', 'כנפיים', 'כבד', 'צלעות'
        ];
        
        this.pricePatterns = [
            /(\d+(?:\.\d+)?)\s*₪/g,
            /(\d+(?:\.\d+)?)\s*שקל/g,
            /(\d+(?:\.\d+)?)\s*שח/g,
            /₪\s*(\d+(?:\.\d+)?)/g,
            /מחיר[:\s]*(\d+(?:\.\d+)?)/g,
            /ל[קק]"ג[:\s]*(\d+(?:\.\d+)?)/g
        ];
    }

    async initialize() {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
            console.log('🔧 Multi-Platform Scraper initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize scraper:', error);
            return false;
        }
    }

    async scrapeVendor(vendorInfo) {
        console.log(`🔍 Analyzing vendor: ${vendorInfo.title}`);
        
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: !this.debug,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--lang=he-IL',
                    '--disable-blink-features=AutomationControlled'
                ]
            });
            
            const page = await browser.newPage();
            await this.setupPage(page);
            
            // Detect platform type
            const platform = await this.detectPlatform(page, vendorInfo.url);
            console.log(`📋 Platform detected: ${platform}`);
            
            // Apply platform-specific scraping strategy
            const scrapingResult = await this.scrapeByPlatform(page, vendorInfo, platform);
            
            // Generate vendor analysis report
            const analysis = await this.analyzeVendor(scrapingResult, vendorInfo, platform);
            
            return analysis;
            
        } catch (error) {
            console.error(`❌ Failed to scrape ${vendorInfo.title}:`, error.message);
            return null;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    async setupPage(page) {
        // Set Hebrew language and Israeli locale
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        });
        
        // Block unnecessary resources for faster scraping
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });
    }

    async detectPlatform(page, url) {
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
            
            const pageContent = await page.evaluate(() => {
                return {
                    html: document.documentElement.outerHTML,
                    scripts: Array.from(document.scripts).map(s => s.src || s.textContent).join(' '),
                    links: Array.from(document.links).map(l => l.href).join(' ')
                };
            });
            
            const fullContent = (pageContent.html + ' ' + pageContent.scripts + ' ' + pageContent.links).toLowerCase();
            
            // Check each platform pattern
            for (const [platform, patterns] of Object.entries(this.platformPatterns)) {
                const matches = patterns.filter(pattern => fullContent.includes(pattern.toLowerCase()));
                if (matches.length >= 2) { // Require at least 2 pattern matches
                    return platform;
                }
            }
            
            return 'custom_site';
            
        } catch (error) {
            console.error('❌ Platform detection failed:', error.message);
            return 'unknown';
        }
    }

    async scrapeByPlatform(page, vendorInfo, platform) {
        switch (platform) {
            case 'woocommerce':
                return await this.scrapeWooCommerce(page, vendorInfo);
            case 'shopify':
                return await this.scrapeShopify(page, vendorInfo);
            case 'custom_hebrew':
                return await this.scrapeCustomHebrew(page, vendorInfo);
            case 'social_media':
                return await this.scrapeSocialMedia(page, vendorInfo);
            default:
                return await this.scrapeGeneric(page, vendorInfo);
        }
    }

    async scrapeWooCommerce(page, vendorInfo) {
        console.log('🛒 Scraping WooCommerce site...');
        
        try {
            // Look for meat product categories
            const meatCategories = await page.evaluate(() => {
                const categoryLinks = Array.from(document.querySelectorAll('a[href*="product-category"], a[href*="product_cat"]'));
                return categoryLinks
                    .map(link => ({ text: link.textContent.trim(), url: link.href }))
                    .filter(cat => /בשר|עוף|קצב|meat|beef|chicken/i.test(cat.text));
            });
            
            let products = [];
            
            // If meat categories found, scrape them
            if (meatCategories.length > 0) {
                for (const category of meatCategories.slice(0, 3)) { // Limit to 3 categories
                    console.log(`📂 Scraping category: ${category.text}`);
                    const categoryProducts = await this.scrapeWooCommerceCategory(page, category.url);
                    products.push(...categoryProducts);
                }
            } else {
                // Fallback: search for products on current page
                products = await this.scrapeWooCommerceProducts(page);
            }
            
            return {
                platform: 'woocommerce',
                products: products,
                categoriesFound: meatCategories.length,
                totalProducts: products.length
            };
            
        } catch (error) {
            console.error('❌ WooCommerce scraping failed:', error.message);
            return { platform: 'woocommerce', products: [], error: error.message };
        }
    }

    async scrapeWooCommerceCategory(page, categoryUrl) {
        try {
            await page.goto(categoryUrl, { waitUntil: 'networkidle2', timeout: 10000 });
            
            return await page.evaluate((hebrewMeatKeywords, pricePatterns) => {
                const products = [];
                const productElements = document.querySelectorAll('.product, .woocommerce-product, .type-product');
                
                productElements.forEach(element => {
                    const titleElement = element.querySelector('h1, h2, h3, .product-title, .woocommerce-loop-product__title');
                    const priceElement = element.querySelector('.price, .woocommerce-Price-amount, .amount');
                    const linkElement = element.querySelector('a');
                    const imageElement = element.querySelector('img');
                    
                    if (titleElement) {
                        const title = titleElement.textContent.trim();
                        const price = priceElement ? priceElement.textContent.trim() : '';
                        
                        // Check if product is meat-related
                        const isMeatProduct = hebrewMeatKeywords.some(keyword => 
                            title.toLowerCase().includes(keyword)
                        );
                        
                        if (isMeatProduct) {
                            products.push({
                                title: title,
                                price: price,
                                url: linkElement ? linkElement.href : '',
                                image: imageElement ? imageElement.src : '',
                                platform: 'woocommerce'
                            });
                        }
                    }
                });
                
                return products;
            }, this.hebrewMeatKeywords, this.pricePatterns);
            
        } catch (error) {
            console.error(`❌ Failed to scrape WooCommerce category: ${categoryUrl}`, error.message);
            return [];
        }
    }

    async scrapeWooCommerceProducts(page) {
        return await page.evaluate((hebrewMeatKeywords) => {
            const products = [];
            const productElements = document.querySelectorAll('.product, .woocommerce-product, .type-product');
            
            productElements.forEach(element => {
                const titleElement = element.querySelector('h1, h2, h3, .product-title, .woocommerce-loop-product__title');
                const priceElement = element.querySelector('.price, .woocommerce-Price-amount, .amount');
                
                if (titleElement) {
                    const title = titleElement.textContent.trim();
                    const isMeatProduct = hebrewMeatKeywords.some(keyword => 
                        title.toLowerCase().includes(keyword)
                    );
                    
                    if (isMeatProduct) {
                        products.push({
                            title: title,
                            price: priceElement ? priceElement.textContent.trim() : '',
                            platform: 'woocommerce'
                        });
                    }
                }
            });
            
            return products;
        }, this.hebrewMeatKeywords);
    }

    async scrapeShopify(page, vendorInfo) {
        console.log('🛍️ Scraping Shopify site...');
        
        try {
            // Try to find meat collections
            const meatCollections = await page.evaluate(() => {
                const collectionLinks = Array.from(document.querySelectorAll('a[href*="/collections/"]'));
                return collectionLinks
                    .map(link => ({ text: link.textContent.trim(), url: link.href }))
                    .filter(col => /בשר|עוף|קצב|meat|beef|chicken/i.test(col.text));
            });
            
            let products = [];
            
            if (meatCollections.length > 0) {
                for (const collection of meatCollections.slice(0, 2)) {
                    console.log(`📂 Scraping Shopify collection: ${collection.text}`);
                    const collectionProducts = await this.scrapeShopifyCollection(page, collection.url);
                    products.push(...collectionProducts);
                }
            }
            
            // Also try to get products from current page
            const currentPageProducts = await this.scrapeShopifyProducts(page);
            products.push(...currentPageProducts);
            
            return {
                platform: 'shopify',
                products: products,
                collectionsFound: meatCollections.length,
                totalProducts: products.length
            };
            
        } catch (error) {
            console.error('❌ Shopify scraping failed:', error.message);
            return { platform: 'shopify', products: [], error: error.message };
        }
    }

    async scrapeShopifyCollection(page, collectionUrl) {
        try {
            await page.goto(collectionUrl, { waitUntil: 'networkidle2', timeout: 10000 });
            
            return await page.evaluate((hebrewMeatKeywords) => {
                const products = [];
                const productElements = document.querySelectorAll('.product-card, .product-item, .grid-product, [data-product-id]');
                
                productElements.forEach(element => {
                    const titleElement = element.querySelector('.product-card__title, .product-title, h3, h4');
                    const priceElement = element.querySelector('.price, .product-price, .money');
                    
                    if (titleElement) {
                        const title = titleElement.textContent.trim();
                        const isMeatProduct = hebrewMeatKeywords.some(keyword => 
                            title.toLowerCase().includes(keyword)
                        );
                        
                        if (isMeatProduct) {
                            products.push({
                                title: title,
                                price: priceElement ? priceElement.textContent.trim() : '',
                                platform: 'shopify'
                            });
                        }
                    }
                });
                
                return products;
            }, this.hebrewMeatKeywords);
            
        } catch (error) {
            console.error(`❌ Failed to scrape Shopify collection: ${collectionUrl}`, error.message);
            return [];
        }
    }

    async scrapeShopifyProducts(page) {
        return await page.evaluate((hebrewMeatKeywords) => {
            const products = [];
            const productElements = document.querySelectorAll('.product-card, .product-item, .grid-product, [data-product-id]');
            
            productElements.forEach(element => {
                const titleElement = element.querySelector('.product-card__title, .product-title, h3, h4');
                const priceElement = element.querySelector('.price, .product-price, .money');
                
                if (titleElement) {
                    const title = titleElement.textContent.trim();
                    const isMeatProduct = hebrewMeatKeywords.some(keyword => 
                        title.toLowerCase().includes(keyword)
                    );
                    
                    if (isMeatProduct) {
                        products.push({
                            title: title,
                            price: priceElement ? priceElement.textContent.trim() : '',
                            platform: 'shopify'
                        });
                    }
                }
            });
            
            return products;
        }, this.hebrewMeatKeywords);
    }

    async scrapeCustomHebrew(page, vendorInfo) {
        console.log('🇮🇱 Scraping custom Hebrew site...');
        
        try {
            // Use generic scraping with Hebrew-specific selectors
            const products = await page.evaluate((hebrewMeatKeywords) => {
                const products = [];
                
                // Try various Hebrew product selectors
                const selectors = [
                    '.מוצר, .פריט, .מוצרים',
                    '.product, .item, .card',
                    '[class*="product"], [class*="item"]',
                    '.grid-item, .list-item',
                    'div[itemtype*="Product"]'
                ];
                
                for (const selector of selectors) {
                    try {
                        const elements = document.querySelectorAll(selector);
                        if (elements.length > 0) {
                            elements.forEach(element => {
                                const textContent = element.textContent || '';
                                const isMeatProduct = hebrewMeatKeywords.some(keyword => 
                                    textContent.toLowerCase().includes(keyword)
                                );
                                
                                if (isMeatProduct) {
                                    const titleElement = element.querySelector('h1, h2, h3, h4, .title, .name, .שם');
                                    const priceElement = element.querySelector('.price, .מחיר, [class*="price"], [class*="מחיר"]');
                                    
                                    if (titleElement) {
                                        products.push({
                                            title: titleElement.textContent.trim(),
                                            price: priceElement ? priceElement.textContent.trim() : '',
                                            platform: 'custom_hebrew'
                                        });
                                    }
                                }
                            });
                            break; // Found working selector, no need to try others
                        }
                    } catch (e) {
                        continue; // Try next selector
                    }
                }
                
                return products;
            }, this.hebrewMeatKeywords);
            
            return {
                platform: 'custom_hebrew',
                products: products,
                totalProducts: products.length
            };
            
        } catch (error) {
            console.error('❌ Custom Hebrew scraping failed:', error.message);
            return { platform: 'custom_hebrew', products: [], error: error.message };
        }
    }

    async scrapeGeneric(page, vendorInfo) {
        console.log('🔧 Using generic scraping approach...');
        
        try {
            const products = await page.evaluate((hebrewMeatKeywords) => {
                const products = [];
                
                // Generic product detection
                const possibleSelectors = [
                    'article', 'section', '.product', '.item', '.card',
                    '[itemtype*="Product"]', '[data-product]', '.listing-item'
                ];
                
                for (const selector of possibleSelectors) {
                    const elements = document.querySelectorAll(selector);
                    
                    elements.forEach(element => {
                        const textContent = element.textContent || '';
                        const isMeatProduct = hebrewMeatKeywords.some(keyword => 
                            textContent.toLowerCase().includes(keyword)
                        );
                        
                        if (isMeatProduct) {
                            // Try to extract title and price
                            const titleElement = element.querySelector('h1, h2, h3, h4, .title, .name');
                            const priceElement = element.querySelector('[class*="price"], [class*="cost"], [class*="מחיר"]');
                            
                            if (titleElement && titleElement.textContent.trim()) {
                                products.push({
                                    title: titleElement.textContent.trim(),
                                    price: priceElement ? priceElement.textContent.trim() : '',
                                    platform: 'generic'
                                });
                            }
                        }
                    });
                    
                    if (products.length > 0) break; // Found products, stop trying selectors
                }
                
                return products;
            }, this.hebrewMeatKeywords);
            
            return {
                platform: 'generic',
                products: products,
                totalProducts: products.length
            };
            
        } catch (error) {
            console.error('❌ Generic scraping failed:', error.message);
            return { platform: 'generic', products: [], error: error.message };
        }
    }

    async analyzeVendor(scrapingResult, vendorInfo, platform) {
        const analysis = {
            vendor: {
                title: vendorInfo.title,
                domain: vendorInfo.domain,
                url: vendorInfo.url,
                originalScore: vendorInfo.relevanceScore
            },
            platform: {
                type: platform,
                detected: scrapingResult.platform || platform
            },
            scraping: {
                successful: scrapingResult.products && scrapingResult.products.length > 0,
                productsFound: scrapingResult.totalProducts || 0,
                products: scrapingResult.products || [],
                error: scrapingResult.error || null
            },
            assessment: {
                integrationViability: this.assessIntegrationViability(scrapingResult),
                estimatedDailyProducts: this.estimateDailyProducts(scrapingResult),
                integrationComplexity: this.assessIntegrationComplexity(platform, scrapingResult),
                marketValue: this.assessMarketValue(scrapingResult, vendorInfo)
            },
            recommendations: this.generateIntegrationRecommendations(scrapingResult, vendorInfo, platform),
            analyzedAt: new Date().toISOString()
        };
        
        return analysis;
    }

    assessIntegrationViability(scrapingResult) {
        if (!scrapingResult.products || scrapingResult.products.length === 0) {
            return 'low';
        }
        
        const productCount = scrapingResult.products.length;
        const hasValidPrices = scrapingResult.products.filter(p => p.price && p.price.trim()).length;
        
        if (productCount >= 10 && hasValidPrices >= 5) {
            return 'high';
        } else if (productCount >= 5 && hasValidPrices >= 2) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    estimateDailyProducts(scrapingResult) {
        const found = scrapingResult.totalProducts || 0;
        
        // Estimate based on what we found in limited scraping
        if (found >= 20) return '50-100';
        if (found >= 10) return '20-50';
        if (found >= 5) return '10-20';
        return '0-10';
    }

    assessIntegrationComplexity(platform, scrapingResult) {
        const complexityMatrix = {
            'woocommerce': 'medium',
            'shopify': 'medium',
            'custom_hebrew': 'high',
            'social_media': 'very_high',
            'generic': 'high',
            'unknown': 'very_high'
        };
        
        return complexityMatrix[platform] || 'high';
    }

    assessMarketValue(scrapingResult, vendorInfo) {
        let score = 0;
        
        // Base score from discovery
        score += (vendorInfo.relevanceScore || 0) * 30;
        
        // Product availability
        const productCount = scrapingResult.totalProducts || 0;
        if (productCount >= 20) score += 30;
        else if (productCount >= 10) score += 20;
        else if (productCount >= 5) score += 10;
        
        // Price availability (indicates commerce activity)
        const productsWithPrices = (scrapingResult.products || []).filter(p => p.price && p.price.trim()).length;
        if (productsWithPrices >= 10) score += 25;
        else if (productsWithPrices >= 5) score += 15;
        else if (productsWithPrices >= 1) score += 5;
        
        // Online capabilities
        if (vendorInfo.analysis?.hasOnlineOrdering) score += 10;
        if (vendorInfo.analysis?.hasDelivery) score += 5;
        
        if (score >= 80) return 'very_high';
        if (score >= 60) return 'high';
        if (score >= 40) return 'medium';
        if (score >= 20) return 'low';
        return 'very_low';
    }

    generateIntegrationRecommendations(scrapingResult, vendorInfo, platform) {
        const recommendations = [];
        
        if (scrapingResult.products && scrapingResult.products.length >= 10) {
            recommendations.push({
                type: 'priority_integration',
                message: `High product count (${scrapingResult.products.length}) - prioritize for integration`,
                priority: 'high'
            });
        }
        
        if (platform === 'woocommerce' || platform === 'shopify') {
            recommendations.push({
                type: 'platform_advantage',
                message: `Standard ${platform} platform - integration patterns available`,
                priority: 'medium'
            });
        }
        
        if (platform === 'custom_hebrew') {
            recommendations.push({
                type: 'custom_development',
                message: 'Custom Hebrew site - requires specific selector development',
                priority: 'high'
            });
        }
        
        const productsWithPrices = (scrapingResult.products || []).filter(p => p.price && p.price.trim()).length;
        if (productsWithPrices < 3) {
            recommendations.push({
                type: 'price_extraction',
                message: 'Limited price data - requires improved price extraction logic',
                priority: 'medium'
            });
        }
        
        return recommendations;
    }

    async saveAnalysis(analysis, outputPath) {
        try {
            await fs.writeFile(outputPath, JSON.stringify(analysis, null, 2));
            return true;
        } catch (error) {
            console.error('❌ Failed to save analysis:', error);
            return false;
        }
    }
}

export default MultiPlatformScraper;