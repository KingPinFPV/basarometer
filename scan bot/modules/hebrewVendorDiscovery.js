/**
 * Hebrew Vendor Discovery System for Israeli Meat Market
 * Automated discovery of meat vendors across the Israeli ecosystem
 */

import puppeteer from 'puppeteer';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class HebrewVendorDiscovery {
    constructor(options = {}) {
        // Google Custom Search API configuration
        this.googleApiKey = options.googleApiKey || process.env.GOOGLE_API_KEY;
        this.customSearchEngineId = options.customSearchEngineId || process.env.GOOGLE_CSE_ID;
        this.use2captcha = options.use2captcha || false;
        this.captchaApiKey = options.captchaApiKey || process.env.TWOCAPTCHA_API_KEY;
        
        this.searchTerms = [
            // Online meat delivery platforms
            "מיט אונליין", "Meat.co.il", "בשר ישיר", "BasarYashir", 
            "אונליין מיט", "OnlineMeat", "פרש מיט", "FreshMeat",
            "קצב אונליין", "KatzavOnline", "בשר משלוח", "משלוח בשר",
            
            // Local butcher shops
            "קצביות תל אביב", "קצביות ירושלים", "קצביות חיפה",
            "קצביה", "בית מטבחיים", "חנות בשר",
            "בשר כשר", "בשר מהדרין", "בשר חלק",
            
            // Specialty meat stores
            "בשר אנגוס", "בשר וואגיו", "בשר ארגנטינאי",
            "בשר אורגני", "בשר ביו", "בשר טבעי",
            
            // Geographic searches
            "בשר תל אביב", "בשר ירושלים", "בשר חיפה",
            "בשר פתח תקווה", "בשר רמת גן", "בשר נתניה",
            "בשר באר שבע", "בשר אשדוד", "בשר ראשון לציון"
        ];
        
        this.vendorClassification = {
            ONLINE_DELIVERY: 'online_delivery',
            LOCAL_BUTCHER: 'local_butcher', 
            SPECIALTY_STORE: 'specialty_store',
            SUPERMARKET_CHAIN: 'supermarket_chain',
            WHOLESALE_SUPPLIER: 'wholesale_supplier',
            RESTAURANT_SUPPLY: 'restaurant_supply'
        };
        
        this.discoveredVendors = new Map();
        this.outputDir = options.outputDir || path.join(__dirname, '..', 'discovered-vendors');
        this.maxResultsPerSearch = options.maxResults || 20;
        this.searchDelay = options.searchDelay || 3000;
        
        // Alternative search engines
        this.alternativeSearchEngines = {
            bing: {
                enabled: true,
                apiKey: options.bingApiKey || process.env.BING_API_KEY,
                endpoint: 'https://api.bing.microsoft.com/v7.0/search'
            },
            duckduckgo: {
                enabled: true,
                endpoint: 'https://api.duckduckgo.com'
            }
        };
        
        // Known Israeli business directories
        this.businessDirectories = [
            {
                name: 'דפי זהב',
                url: 'https://www.d.co.il',
                searchPattern: 'https://www.d.co.il/search?q={term}'
            },
            {
                name: 'Yad2',
                url: 'https://www.yad2.co.il',
                searchPattern: 'https://www.yad2.co.il/s/forsale?q={term}'
            },
            {
                name: 'Zap',
                url: 'https://www.zap.co.il',
                searchPattern: 'https://www.zap.co.il/search.aspx?keyword={term}'
            }
        ];
    }

    async initialize() {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
            
            // Load manual vendor database as fallback
            await this.loadManualVendorDatabase();
            
            console.log('🔍 Hebrew Vendor Discovery System initialized');
            console.log(`📋 Manual vendor database loaded: ${this.manualVendors?.high_priority_vendors?.length || 0} high-priority vendors`);
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize discovery system:', error);
            return false;
        }
    }

    async loadManualVendorDatabase() {
        try {
            const vendorDbPath = path.join(__dirname, '..', 'config', 'known-israeli-meat-vendors.json');
            const vendorDbContent = await fs.readFile(vendorDbPath, 'utf-8');
            this.manualVendors = JSON.parse(vendorDbContent).manual_vendor_database;
            this.searchOptimizations = JSON.parse(vendorDbContent).search_optimizations;
            this.integrationGuidelines = JSON.parse(vendorDbContent).integration_guidelines;
        } catch (error) {
            console.log('⚠️ Could not load manual vendor database:', error.message);
            this.manualVendors = null;
        }
    }

    async discoverVendors() {
        console.log('🚀 Starting comprehensive Hebrew meat vendor discovery...');
        
        // First, load manual vendors as baseline
        if (this.manualVendors) {
            console.log('📋 Loading known vendors from manual database...');
            await this.loadKnownVendors();
        }
        
        // Then try to discover new vendors
        if (this.googleApiKey && this.customSearchEngineId) {
            console.log('✅ Using Google Custom Search API for new discoveries');
            await this.discoverVendorsViaAPI();
        } else {
            console.log('⚠️ No Google API credentials - using fallback methods');
            await this.discoverVendorsViaFallback();
        }

        await this.analyzeDiscoveredVendors();
        await this.generateDiscoveryReport();
    }

    async loadKnownVendors() {
        if (!this.manualVendors) return;
        
        const allKnownVendors = [
            ...this.manualVendors.high_priority_vendors,
            ...this.manualVendors.medium_priority_vendors,
            ...(this.manualVendors.verified_vendors || [])
        ];
        
        // First validate URLs before loading
        const validatedVendors = await this.validateVendorUrls(allKnownVendors);
        
        for (const vendor of validatedVendors) {
            const domain = this.extractDomain(vendor.url);
            if (domain && !this.discoveredVendors.has(domain)) {
                // Enhanced analysis for real vendors
                const analysis = await this.analyzeVendorWebsite(vendor);
                
                this.discoveredVendors.set(domain, {
                    domain,
                    title: vendor.name,
                    url: vendor.url,
                    snippet: vendor.description,
                    vendorType: vendor.type,
                    relevanceScore: vendor.confidence,
                    searchTerm: 'real_vendor_database',
                    discoveredAt: new Date().toISOString(),
                    source: 'verified_israeli_vendors',
                    isVerified: vendor.verified || false,
                    analysis: {
                        ...analysis,
                        hasOnlineOrdering: vendor.hasOnlineOrdering,
                        hasDelivery: vendor.hasDelivery,
                        isKosher: vendor.isKosher,
                        location: vendor.location,
                        specialties: vendor.specialties || [],
                        urlValid: vendor.urlValid,
                        websiteStatus: vendor.websiteStatus
                    }
                });
                
                const statusIcon = vendor.urlValid ? '✅' : '❌';
                console.log(`${statusIcon} Loaded: ${vendor.name} (${vendor.type}) - ${vendor.websiteStatus}`);
            }
        }
        
        console.log(`✅ Loaded ${validatedVendors.length}/${allKnownVendors.length} vendors (${validatedVendors.filter(v => v.urlValid).length} with valid URLs)`);
    }

    async validateVendorUrls(vendors) {
        console.log('🔍 Validating vendor URLs...');
        const validatedVendors = [];
        
        for (const vendor of vendors) {
            try {
                console.log(`🌐 Testing: ${vendor.name} - ${vendor.url}`);
                
                // Test URL accessibility
                const response = await axios.get(vendor.url, {
                    timeout: 10000,
                    validateStatus: function (status) {
                        return status < 500; // Accept any status < 500
                    },
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; BasarometerBot/2.0; +https://basarometer.com)'
                    }
                });
                
                vendor.urlValid = response.status === 200;
                vendor.websiteStatus = `HTTP ${response.status}`;
                
                if (response.status === 200) {
                    // Basic Hebrew content detection
                    const hasHebrew = /[\u0590-\u05FF]/.test(response.data);
                    vendor.hasHebrewContent = hasHebrew;
                    
                    // Detect e-commerce platform
                    vendor.ecommercePlatform = this.detectEcommercePlatform(response.data, vendor.url);
                    
                    console.log(`   ✅ Valid - ${vendor.ecommercePlatform} ${hasHebrew ? '(Hebrew)' : '(No Hebrew)'}`);                
                } else {
                    console.log(`   ⚠️ Status ${response.status} - May need manual verification`);
                }
                
                validatedVendors.push(vendor);
                
            } catch (error) {
                vendor.urlValid = false;
                vendor.websiteStatus = `Error: ${error.code || error.message}`;
                
                console.log(`   ❌ Failed: ${error.message}`);
                
                // Still add to list but mark as invalid
                validatedVendors.push(vendor);
            }
            
            // Rate limiting
            await this.delay(2000);
        }
        
        return validatedVendors;
    }

    detectEcommercePlatform(html, url) {
        const htmlLower = html.toLowerCase();
        const urlLower = url.toLowerCase();
        
        // Israeli-specific e-commerce platforms (high priority)
        if (htmlLower.includes('wix.com') || htmlLower.includes('wixstatic.com') || 
            htmlLower.includes('wix-code') || htmlLower.includes('_wixapps')) {
            return 'Wix Store (Popular in Israel)';
        }
        
        // Check for Israeli-built platforms
        if (htmlLower.includes('ecwid') || htmlLower.includes('ec-prod.com')) {
            return 'Ecwid (Israeli-friendly)';
        }
        
        if (htmlLower.includes('shopify') || htmlLower.includes('myshopify.com') || 
            htmlLower.includes('shopifycdn.com')) {
            return 'Shopify';
        }
        
        if (htmlLower.includes('woocommerce') || htmlLower.includes('wp-content') || 
            htmlLower.includes('wc-ajax')) {
            return 'WooCommerce';
        }
        
        if (htmlLower.includes('magento') || htmlLower.includes('mage/js')) {
            return 'Magento';
        }
        
        // Hebrew e-commerce indicators (comprehensive)
        const hebrewEcommercePatterns = [
            'הוסף לעגלה', 'קנה עכשיו', 'הזמן עכשיו', 'רכישה מאובטחת',
            'תשלום מאובטח', 'משלוח חינם', 'עגלת קניות', 'המשך לתשלום',
            'פרטי משלוח', 'אמצעי תשלום', 'סכום לתשלום', 'אישור הזמנה'
        ];
        
        const englishEcommercePatterns = [
            'add to cart', 'buy now', 'order now', 'secure checkout',
            'shopping cart', 'proceed to checkout', 'payment method',
            'add to bag', 'quick order', 'secure payment'
        ];
        
        if (hebrewEcommercePatterns.some(pattern => htmlLower.includes(pattern))) {
            return 'Hebrew E-commerce Platform';
        }
        
        if (englishEcommercePatterns.some(pattern => htmlLower.includes(pattern))) {
            return 'English E-commerce Platform';
        }
        
        // Israeli payment providers (strong e-commerce indicator)
        if (htmlLower.includes('tranzila') || htmlLower.includes('cardcom') || 
            htmlLower.includes('paypal') || htmlLower.includes('bit.ly')) {
            return 'Israeli Payment-Enabled Site';
        }
        
        // Social commerce (very common in Israel)
        if (htmlLower.includes('facebook.com') || urlLower.includes('facebook.com') || 
            htmlLower.includes('instagram.com') || urlLower.includes('instagram.com')) {
            return 'Social Commerce (Facebook/Instagram)';
        }
        
        if (htmlLower.includes('whatsapp') || htmlLower.includes('wa.me')) {
            return 'WhatsApp Business (Common in Israel)';
        }
        
        // Israeli business directory platforms
        if (urlLower.includes('d.co.il') || htmlLower.includes('dapey zahav')) {
            return 'Dapey Zahav Business Directory';
        }
        
        if (urlLower.includes('yad2.co.il') || htmlLower.includes('yad2')) {
            return 'Yad2 Marketplace';
        }
        
        if (urlLower.includes('zap.co.il') || htmlLower.includes('zap')) {
            return 'Zap Price Comparison';
        }
        
        // Basic CMS platforms
        if (htmlLower.includes('wordpress') || htmlLower.includes('wp-includes')) {
            return 'WordPress (Potential WooCommerce)';
        }
        
        if (htmlLower.includes('drupal') || htmlLower.includes('joomla')) {
            return 'Open Source CMS';
        }
        
        // Israeli hosting/website builders
        if (htmlLower.includes('013.net') || htmlLower.includes('netvision.net.il') ||
            htmlLower.includes('012.net.il')) {
            return 'Israeli Website Builder';
        }
        
        // Domain-based detection for Israeli sites
        if (urlLower.endsWith('.co.il') || urlLower.endsWith('.org.il') || 
            urlLower.endsWith('.net.il')) {
            return 'Israeli Website (.co.il domain)';
        }
        
        // Product catalog indicators
        if (htmlLower.includes('מוצרים') || htmlLower.includes('קטלוג') || 
            htmlLower.includes('products') || htmlLower.includes('catalog')) {
            return 'Product Catalog Site';
        }
        
        return 'Custom/Unknown Platform';
    }

    async analyzeVendorWebsite(vendor) {
        // Enhanced website analysis for better vendor intelligence
        return {
            platformDetected: vendor.ecommercePlatform || 'Unknown',
            hasHebrewContent: vendor.hasHebrewContent || false,
            priceIndicators: [],
            productCatalogDetected: vendor.ecommercePlatform !== 'Facebook Page',
            lastAnalyzed: new Date().toISOString()
        };
    }

    async discoverVendorsViaAPI() {
        for (const searchTerm of this.searchTerms) {
            console.log(`🔍 API Search for: "${searchTerm}"`);
            
            try {
                // Try Google Custom Search API first
                await this.searchGoogleAPI(searchTerm);
            } catch (error) {
                console.error(`❌ Google API search failed for "${searchTerm}":`, error.message);
                
                // Fallback to alternative search engines
                await this.searchAlternativeEngines(searchTerm);
            }
            
            await this.delay(this.searchDelay);
        }
    }

    async discoverVendorsViaFallback() {
        console.log('🔄 Using browser automation with CAPTCHA handling...');
        
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=he-IL']
        });

        try {
            for (const searchTerm of this.searchTerms) {
                console.log(`🔍 Browser search for: "${searchTerm}"`);
                
                try {
                    await this.searchGoogleBrowser(browser, searchTerm);
                } catch (error) {
                    console.error(`❌ Browser search failed for "${searchTerm}":`, error.message);
                    // Try alternative search engines or business directories
                    await this.searchBusinessDirectories(searchTerm);
                }
                
                await this.delay(this.searchDelay);
            }
        } finally {
            await browser.close();
        }
    }

    async searchGoogleAPI(searchTerm) {
        try {
            const url = 'https://www.googleapis.com/customsearch/v1';
            const params = {
                key: this.googleApiKey,
                cx: this.customSearchEngineId,
                q: searchTerm,
                lr: 'lang_he',
                gl: 'il',
                num: this.maxResultsPerSearch
            };

            const response = await axios.get(url, { params });
            const results = response.data.items || [];

            console.log(`✅ Google API found ${results.length} results for "${searchTerm}"`);

            for (const item of results) {
                await this.processVendorResult({
                    title: item.title,
                    url: item.link,
                    snippet: item.snippet || ''
                }, searchTerm);
            }

            return results;
        } catch (error) {
            if (error.response?.status === 429) {
                console.log('⚠️ Google API rate limit reached');
                await this.delay(60000); // Wait 1 minute
                return this.searchGoogleAPI(searchTerm); // Retry
            }
            throw error;
        }
    }

    async searchAlternativeEngines(searchTerm) {
        // Try Bing Search API
        if (this.alternativeSearchEngines.bing.enabled && this.alternativeSearchEngines.bing.apiKey) {
            try {
                await this.searchBingAPI(searchTerm);
            } catch (error) {
                console.error('❌ Bing search failed:', error.message);
            }
        }

        // Try DuckDuckGo (no API key required)
        if (this.alternativeSearchEngines.duckduckgo.enabled) {
            try {
                await this.searchDuckDuckGo(searchTerm);
            } catch (error) {
                console.error('❌ DuckDuckGo search failed:', error.message);
            }
        }
    }

    async searchBingAPI(searchTerm) {
        try {
            const response = await axios.get(this.alternativeSearchEngines.bing.endpoint, {
                headers: {
                    'Ocp-Apim-Subscription-Key': this.alternativeSearchEngines.bing.apiKey
                },
                params: {
                    q: searchTerm,
                    count: this.maxResultsPerSearch,
                    mkt: 'he-IL'
                }
            });

            const results = response.data.webPages?.value || [];
            console.log(`✅ Bing API found ${results.length} results for "${searchTerm}"`);

            for (const item of results) {
                await this.processVendorResult({
                    title: item.name,
                    url: item.url,
                    snippet: item.snippet || ''
                }, searchTerm);
            }
        } catch (error) {
            throw new Error(`Bing API error: ${error.message}`);
        }
    }

    async searchDuckDuckGo(searchTerm) {
        try {
            // DuckDuckGo instant answer API (limited but free)
            const response = await axios.get('https://api.duckduckgo.com/', {
                params: {
                    q: searchTerm,
                    format: 'json',
                    no_redirect: '1',
                    no_html: '1',
                    skip_disambig: '1'
                }
            });

            if (response.data.RelatedTopics) {
                const results = response.data.RelatedTopics.slice(0, 5);
                console.log(`✅ DuckDuckGo found ${results.length} results for "${searchTerm}"`);

                for (const item of results) {
                    if (item.FirstURL) {
                        await this.processVendorResult({
                            title: item.Text || '',
                            url: item.FirstURL,
                            snippet: item.Text || ''
                        }, searchTerm);
                    }
                }
            }
        } catch (error) {
            throw new Error(`DuckDuckGo API error: ${error.message}`);
        }
    }

    async searchBusinessDirectories(searchTerm) {
        console.log(`🏢 Searching Israeli business directories for: "${searchTerm}"`);
        
        for (const directory of this.businessDirectories) {
            try {
                const searchUrl = directory.searchPattern.replace('{term}', encodeURIComponent(searchTerm));
                console.log(`📋 Checking ${directory.name}...`);
                
                // Simple GET request to check if directory has results
                const response = await axios.get(searchUrl, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; BasarometerBot/1.0)'
                    }
                });

                if (response.status === 200) {
                    // Add the directory itself as a potential source
                    await this.processVendorResult({
                        title: `${directory.name} - ${searchTerm}`,
                        url: searchUrl,
                        snippet: `Business directory listing for ${searchTerm}`
                    }, searchTerm);
                }
            } catch (error) {
                console.log(`⚠️ ${directory.name} search failed: ${error.message}`);
            }
        }
    }

    async searchGoogleBrowser(browser, searchTerm) {
        const page = await browser.newPage();
        
        try {
            // Set Hebrew locale and language preferences
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            });

            // Navigate to Google search
            const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}&hl=he&gl=IL`;
            await page.goto(googleUrl, { waitUntil: 'networkidle2' });

            // Check for CAPTCHA
            const hasCaptcha = await page.$('div[id*="captcha"]') || await page.$('iframe[src*="recaptcha"]');
            
            if (hasCaptcha) {
                console.log('🤖 CAPTCHA detected! Attempting to solve...');
                
                if (this.use2captcha && this.captchaApiKey) {
                    await this.solveCaptchaWith2Captcha(page);
                } else {
                    console.log('⏳ Manual CAPTCHA solving required - pausing for 30 seconds...');
                    await this.delay(30000);
                }
            }

            // Extract search results with multiple fallback selectors
            const results = await page.evaluate(() => {
                // Try multiple selector patterns for search results
                const selectorPatterns = [
                    'div[data-ved] h3',
                    '.g h3',
                    '.rc h3',
                    'h3.r',
                    '.yuRUbf h3'
                ];
                
                let resultElements = [];
                for (const pattern of selectorPatterns) {
                    resultElements = document.querySelectorAll(pattern);
                    if (resultElements.length > 0) break;
                }

                const linkElements = document.querySelectorAll('div[data-ved] a[href], .g a[href], .rc a[href]');
                const snippetElements = document.querySelectorAll('div[data-ved] .VwiC3b, .g .VwiC3b, .rc .s');
                
                const results = [];
                for (let i = 0; i < Math.min(resultElements.length, 20); i++) {
                    const title = resultElements[i]?.textContent || '';
                    const url = linkElements[i]?.href || '';
                    const snippet = snippetElements[i]?.textContent || '';
                    
                    if (title && url && url.startsWith('http') && !url.includes('google.com')) {
                        results.push({ title, url, snippet });
                    }
                }
                return results;
            });

            if (results.length === 0) {
                console.log('⚠️ No results found - might be blocked or CAPTCHA not solved');
                throw new Error('No search results found');
            }

            // Process and classify results
            for (const result of results) {
                await this.processVendorResult(result, searchTerm);
            }

            console.log(`✅ Found ${results.length} results for "${searchTerm}"`);
            
        } catch (error) {
            console.error(`❌ Failed to search for "${searchTerm}":`, error.message);
            throw error;
        } finally {
            await page.close();
        }
    }

    async solveCaptchaWith2Captcha(page) {
        try {
            console.log('🔐 Attempting 2captcha CAPTCHA solving...');
            
            // Get the reCAPTCHA site key
            const siteKey = await page.evaluate(() => {
                const recaptchaFrame = document.querySelector('iframe[src*="recaptcha"]');
                if (recaptchaFrame) {
                    const src = recaptchaFrame.src;
                    const match = src.match(/k=([^&]+)/);
                    return match ? match[1] : null;
                }
                return null;
            });

            if (!siteKey) {
                throw new Error('Could not find reCAPTCHA site key');
            }

            // Submit CAPTCHA to 2captcha
            const submitResponse = await axios.post('http://2captcha.com/in.php', {
                key: this.captchaApiKey,
                method: 'userrecaptcha',
                googlekey: siteKey,
                pageurl: page.url()
            });

            if (submitResponse.data.indexOf('OK|') !== 0) {
                throw new Error('Failed to submit CAPTCHA to 2captcha');
            }

            const captchaId = submitResponse.data.split('|')[1];
            console.log(`⏳ CAPTCHA submitted to 2captcha with ID: ${captchaId}`);

            // Poll for solution
            let attempts = 0;
            while (attempts < 30) { // Wait up to 5 minutes
                await this.delay(10000); // Wait 10 seconds between polls
                
                const resultResponse = await axios.get(`http://2captcha.com/res.php?key=${this.captchaApiKey}&action=get&id=${captchaId}`);
                
                if (resultResponse.data === 'CAPCHA_NOT_READY') {
                    attempts++;
                    continue;
                }
                
                if (resultResponse.data.indexOf('OK|') === 0) {
                    const solution = resultResponse.data.split('|')[1];
                    console.log('✅ CAPTCHA solved by 2captcha!');
                    
                    // Submit the solution
                    await page.evaluate((solution) => {
                        document.getElementById('g-recaptcha-response').innerHTML = solution;
                        document.querySelector('form').submit();
                    }, solution);
                    
                    await page.waitForNavigation({ waitUntil: 'networkidle2' });
                    return;
                }
                
                throw new Error('2captcha failed to solve CAPTCHA');
            }
            
            throw new Error('CAPTCHA solving timeout');
            
        } catch (error) {
            console.error('❌ 2captcha CAPTCHA solving failed:', error.message);
            console.log('⏳ Falling back to manual solving - waiting 60 seconds...');
            await this.delay(60000);
        }
    }

    async processVendorResult(result, searchTerm) {
        const { title, url, snippet } = result;
        
        // Extract domain for deduplication
        const domain = this.extractDomain(url);
        if (!domain || this.discoveredVendors.has(domain)) {
            return;
        }

        // Enhanced URL validation for new discoveries
        const isValidUrl = await this.quickUrlValidation(url);
        if (!isValidUrl) {
            console.log(`⚠️ Skipping invalid URL: ${url}`);
            return;
        }

        // Classify vendor type
        const vendorType = this.classifyVendor(title, url, snippet);
        
        // Calculate relevance score with enhanced algorithm
        const relevanceScore = this.calculateEnhancedRelevanceScore(title, snippet, searchTerm, url);
        
        if (relevanceScore > 0.4) { // Raised threshold for better quality
            this.discoveredVendors.set(domain, {
                domain,
                title,
                url,
                snippet,
                vendorType,
                relevanceScore,
                searchTerm,
                discoveredAt: new Date().toISOString(),
                source: 'search_discovery',
                analysis: {
                    hasOnlineOrdering: this.detectOnlineOrdering(title, snippet, url),
                    hasDelivery: this.detectDeliveryService(title, snippet),
                    isKosher: this.detectKosherCertification(title, snippet),
                    location: this.extractLocation(title, snippet),
                    priceIndicators: this.detectPriceIndicators(snippet),
                    urlValidated: true,
                    businessType: this.detectBusinessType(title, snippet, url)
                }
            });
            
            console.log(`📍 Discovered: ${title} (${vendorType}) - Score: ${relevanceScore.toFixed(2)}`);
        }
    }

    async quickUrlValidation(url) {
        try {
            // Quick HEAD request to check if URL is accessible
            const response = await axios.head(url, {
                timeout: 5000,
                validateStatus: function (status) {
                    return status < 500;
                }
            });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    calculateEnhancedRelevanceScore(title, snippet, searchTerm, url) {
        const text = (title + ' ' + snippet).toLowerCase();
        const searchWords = searchTerm.toLowerCase().split(' ');
        const urlLower = url.toLowerCase();
        
        let score = 0;
        
        // Hebrew meat keywords (increased weight)
        const meatKeywords = [
            'בשר', 'עוף', 'בקר', 'כבש', 'עגל', 'טלה', 'הודו',
            'קצביה', 'קצבייה', 'מטבחיים', 'חנות בשר', 'אנטריקוט',
            'סטייק', 'רוסטביף', 'שווארמה', 'קבב'
        ];
        
        // Boost for meat-specific terms
        for (const keyword of meatKeywords) {
            if (text.includes(keyword)) {
                score += 0.4; // Increased from 0.3
            }
        }
        
        // Search term matches
        for (const word of searchWords) {
            if (text.includes(word.toLowerCase())) {
                score += 0.25; // Increased from 0.2
            }
        }
        
        // E-commerce indicators (higher priority)
        const ecommerceKeywords = [
            'הזמנה אונליין', 'קניות אונליין', 'משלוח', 'דליברי',
            'online order', 'delivery', 'shop', 'store'
        ];
        
        for (const keyword of ecommerceKeywords) {
            if (text.includes(keyword) || urlLower.includes(keyword)) {
                score += 0.2;
            }
        }
        
        // Quality indicators
        const qualityKeywords = [
            'אנגוס', 'וואגיו', 'פרימיום', 'אורגני', 'כשר', 'מהדרין',
            'angus', 'wagyu', 'premium', 'organic', 'kosher'
        ];
        
        for (const keyword of qualityKeywords) {
            if (text.includes(keyword)) {
                score += 0.15;
            }
        }
        
        // URL quality indicators
        if (urlLower.includes('meat') || urlLower.includes('basar') || 
            urlLower.includes('katzav') || urlLower.includes('butcher')) {
            score += 0.1;
        }
        
        return Math.min(score, 1.0);
    }

    detectBusinessType(title, snippet, url) {
        const text = (title + ' ' + snippet + ' ' + url).toLowerCase();
        
        if (text.includes('רשת') || text.includes('סניפים') || text.includes('chain')) {
            return 'chain';
        }
        if (text.includes('בוטיק') || text.includes('מיוחד') || text.includes('boutique')) {
            return 'boutique';
        }
        if (text.includes('מפעל') || text.includes('סיטוני') || text.includes('wholesale')) {
            return 'wholesale';
        }
        if (text.includes('משלוח') || text.includes('דליברי') || text.includes('delivery')) {
            return 'delivery';
        }
        
        return 'standard';
    }

    extractDomain(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch (error) {
            return null;
        }
    }

    classifyVendor(title, url, snippet) {
        const text = (title + ' ' + snippet + ' ' + url).toLowerCase();
        
        // Online delivery platforms
        if (text.includes('משלוח') || text.includes('אונליין') || text.includes('הזמנה') || 
            text.includes('delivery') || text.includes('online')) {
            return this.vendorClassification.ONLINE_DELIVERY;
        }
        
        // Local butcher shops
        if (text.includes('קצביה') || text.includes('קצבייה') || text.includes('בית מטבחיים') ||
            text.includes('butcher') || text.includes('מטבחיים')) {
            return this.vendorClassification.LOCAL_BUTCHER;
        }
        
        // Specialty stores
        if (text.includes('אנגוס') || text.includes('וואגיו') || text.includes('פרימיום') ||
            text.includes('אורגני') || text.includes('ביו') || text.includes('angus') || 
            text.includes('wagyu') || text.includes('premium')) {
            return this.vendorClassification.SPECIALTY_STORE;
        }
        
        // Supermarket chains
        if (text.includes('סופרמרקט') || text.includes('רשת') || text.includes('סניפים') ||
            text.includes('supermarket') || text.includes('chain')) {
            return this.vendorClassification.SUPERMARKET_CHAIN;
        }
        
        // Wholesale suppliers
        if (text.includes('סיטוני') || text.includes('אספקה') || text.includes('wholesale') ||
            text.includes('supplier') || text.includes('מפעל')) {
            return this.vendorClassification.WHOLESALE_SUPPLIER;
        }
        
        return this.vendorClassification.LOCAL_BUTCHER; // Default classification
    }

    calculateRelevanceScore(title, snippet, searchTerm) {
        const text = (title + ' ' + snippet).toLowerCase();
        const searchWords = searchTerm.toLowerCase().split(' ');
        
        let score = 0;
        
        // Hebrew meat keywords
        const meatKeywords = [
            'בשר', 'עוף', 'בקר', 'כבש', 'עגל', 'טלה', 'הודו',
            'קצביה', 'קצבייה', 'מטבחיים', 'חנות בשר'
        ];
        
        // Boost for meat-specific terms
        for (const keyword of meatKeywords) {
            if (text.includes(keyword)) {
                score += 0.3;
            }
        }
        
        // Boost for search term matches
        for (const word of searchWords) {
            if (text.includes(word.toLowerCase())) {
                score += 0.2;
            }
        }
        
        // Boost for business indicators
        const businessKeywords = [
            'אונליין', 'משלוח', 'הזמנה', 'חנות', 'קניות',
            'online', 'delivery', 'shop', 'store', 'order'
        ];
        
        for (const keyword of businessKeywords) {
            if (text.includes(keyword)) {
                score += 0.15;
            }
        }
        
        return Math.min(score, 1.0);
    }

    detectOnlineOrdering(title, snippet, url) {
        const text = (title + ' ' + snippet + ' ' + url).toLowerCase();
        const indicators = [
            'הזמנה אונליין', 'הזמן עכשיו', 'קניות אונליין', 'הוסף לעגלה',
            'online order', 'order now', 'add to cart', 'shop online',
            'cart', 'checkout', 'payment'
        ];
        
        return indicators.some(indicator => text.includes(indicator));
    }

    detectDeliveryService(title, snippet) {
        const text = (title + ' ' + snippet).toLowerCase();
        const indicators = [
            'משלוח', 'משלוחים', 'דליברי', 'הגעה עד הבית',
            'delivery', 'shipping', 'משלוח חינם', 'free delivery'
        ];
        
        return indicators.some(indicator => text.includes(indicator));
    }

    detectKosherCertification(title, snippet) {
        const text = (title + ' ' + snippet).toLowerCase();
        const indicators = [
            'כשר', 'מהדרין', 'חלק', 'בשרי', 'כשרות',
            'kosher', 'badatz', 'משגיח', 'הכשר'
        ];
        
        return indicators.some(indicator => text.includes(indicator));
    }

    extractLocation(title, snippet) {
        const text = (title + ' ' + snippet);
        const cities = [
            'תל אביב', 'ירושלים', 'חיפה', 'ראשון לציון', 'פתח תקווה',
            'נתניה', 'באר שבע', 'בני ברק', 'רמת גן', 'אשדוד',
            'חולון', 'בת ים', 'רחובות', 'כפר סבא', 'מודיעין'
        ];
        
        for (const city of cities) {
            if (text.includes(city)) {
                return city;
            }
        }
        
        return null;
    }

    detectPriceIndicators(snippet) {
        const pricePattern = /(\d+(?:\.\d+)?)\s*(?:₪|שקל|שקלים)/g;
        const matches = snippet.match(pricePattern);
        return matches ? matches.slice(0, 3) : []; // Return up to 3 price examples
    }

    async analyzeDiscoveredVendors() {
        console.log('📊 Analyzing discovered vendors with enhanced metrics...');
        
        const analysis = {
            totalVendors: this.discoveredVendors.size,
            byType: {},
            byLocation: {},
            byPlatform: {},
            bySource: {},
            validationResults: {
                validUrls: 0,
                invalidUrls: 0,
                untested: 0
            },
            capabilities: {
                onlineCapable: 0,
                withDelivery: 0,
                kosherCertified: 0,
                hebrewContent: 0,
                ecommerceReady: 0
            },
            qualityMetrics: {
                highRelevance: 0,
                verified: 0,
                integrationReady: 0
            }
        };
        
        for (const [domain, vendor] of this.discoveredVendors) {
            // Count by type
            analysis.byType[vendor.vendorType] = (analysis.byType[vendor.vendorType] || 0) + 1;
            
            // Count by location
            if (vendor.analysis.location) {
                analysis.byLocation[vendor.analysis.location] = 
                    (analysis.byLocation[vendor.analysis.location] || 0) + 1;
            }
            
            // Count by platform
            const platform = vendor.analysis?.platformDetected || 'Unknown';
            analysis.byPlatform[platform] = (analysis.byPlatform[platform] || 0) + 1;
            
            // Count by source
            const source = vendor.source || 'unknown';
            analysis.bySource[source] = (analysis.bySource[source] || 0) + 1;
            
            // URL validation results
            if (vendor.analysis?.urlValid === true) {
                analysis.validationResults.validUrls++;
            } else if (vendor.analysis?.urlValid === false) {
                analysis.validationResults.invalidUrls++;
            } else {
                analysis.validationResults.untested++;
            }
            
            // Enhanced capabilities
            if (vendor.analysis.hasOnlineOrdering) analysis.capabilities.onlineCapable++;
            if (vendor.analysis.hasDelivery) analysis.capabilities.withDelivery++;
            if (vendor.analysis.isKosher) analysis.capabilities.kosherCertified++;
            if (vendor.analysis?.hasHebrewContent) analysis.capabilities.hebrewContent++;
            if (vendor.analysis?.platformDetected && 
                !['Unknown', 'Facebook Page'].includes(vendor.analysis.platformDetected)) {
                analysis.capabilities.ecommerceReady++;
            }
            
            // Quality metrics
            if (vendor.relevanceScore > 0.7) analysis.qualityMetrics.highRelevance++;
            if (vendor.isVerified) analysis.qualityMetrics.verified++;
            if (vendor.relevanceScore > 0.6 && vendor.analysis?.urlValid) {
                analysis.qualityMetrics.integrationReady++;
            }
        }
        
        this.analysis = analysis;
        
        // Enhanced logging
        console.log(`✅ Analysis complete: ${analysis.totalVendors} vendors discovered`);
        console.log(`📊 URL Validation: ${analysis.validationResults.validUrls} valid, ${analysis.validationResults.invalidUrls} invalid`);
        console.log(`🎯 Integration Ready: ${analysis.qualityMetrics.integrationReady} vendors`);
        console.log(`✅ Verified Vendors: ${analysis.qualityMetrics.verified}`);
        console.log(`🌐 E-commerce Ready: ${analysis.capabilities.ecommerceReady}`);
    }

    async generateDiscoveryReport() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(this.outputDir, `vendor-discovery-report-${timestamp}.json`);
        
        const prioritizedVendors = this.prioritizeVendorsForIntegration();
        
        const report = {
            generatedAt: new Date().toISOString(),
            summary: this.analysis,
            vendors: Array.from(this.discoveredVendors.values()).sort((a, b) => b.relevanceScore - a.relevanceScore),
            prioritizedIntegration: prioritizedVendors,
            searchTermsUsed: this.searchTerms,
            recommendations: this.generateRecommendations(),
            validationSummary: {
                totalTested: this.analysis.validationResults.validUrls + this.analysis.validationResults.invalidUrls,
                successRate: this.analysis.validationResults.validUrls / 
                           (this.analysis.validationResults.validUrls + this.analysis.validationResults.invalidUrls),
                platformDistribution: this.analysis.byPlatform,
                readyForIntegration: this.analysis.qualityMetrics.integrationReady
            }
        };
        
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        // Also generate a prioritized vendors list for immediate integration
        const prioritizedPath = path.join(this.outputDir, `priority-vendors-${timestamp}.json`);
        await fs.writeFile(prioritizedPath, JSON.stringify(prioritizedVendors, null, 2));
        
        console.log(`📋 Discovery report saved to: ${reportPath}`);
        console.log(`🎯 Priority vendors list saved to: ${prioritizedPath}`);
        
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        const vendors = Array.from(this.discoveredVendors.values());
        
        // Verified vendors ready for immediate integration
        const verifiedVendors = vendors.filter(v => v.isVerified && v.analysis?.urlValid);
        if (verifiedVendors.length > 0) {
            recommendations.push({
                type: 'immediate_integration',
                priority: 'critical',
                message: `${verifiedVendors.length} verified Israeli meat vendors ready for immediate integration`,
                vendors: verifiedVendors.map(v => ({ 
                    title: v.title, 
                    domain: v.domain, 
                    score: v.relevanceScore,
                    platform: v.analysis?.platformDetected,
                    status: v.analysis?.websiteStatus
                }))
            });
        }
        
        // High-scoring online vendors
        const highScoreVendors = vendors
            .filter(v => v.relevanceScore > 0.7 && v.analysis?.urlValid && 
                      (v.vendorType === this.vendorClassification.ONLINE_DELIVERY || 
                       v.vendorType === this.vendorClassification.SUPERMARKET_CHAIN))
            .slice(0, 5);
        
        if (highScoreVendors.length > 0) {
            recommendations.push({
                type: 'high_priority_integration',
                priority: 'high',
                message: `${highScoreVendors.length} high-scoring online vendors with validated URLs`,
                vendors: highScoreVendors.map(v => ({ 
                    title: v.title, 
                    domain: v.domain, 
                    score: v.relevanceScore,
                    type: v.vendorType,
                    platform: v.analysis?.platformDetected
                }))
            });
        }
        
        // Platform distribution analysis
        const platformCounts = {};
        vendors.forEach(v => {
            const platform = v.analysis?.platformDetected || 'Unknown';
            platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        });
        
        const topPlatforms = Object.entries(platformCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
        
        if (topPlatforms.length > 0) {
            recommendations.push({
                type: 'platform_strategy',
                priority: 'medium',
                message: `Top e-commerce platforms found: ${topPlatforms.map(([platform, count]) => `${platform} (${count})`).join(', ')}`,
                platforms: topPlatforms
            });
        }
        
        // URL validation results
        const validUrls = vendors.filter(v => v.analysis?.urlValid).length;
        const totalUrls = vendors.length;
        
        recommendations.push({
            type: 'validation_summary',
            priority: 'info',
            message: `URL Validation: ${validUrls}/${totalUrls} vendors have accessible websites (${Math.round(validUrls/totalUrls*100)}%)`,
            validationRate: validUrls / totalUrls
        });
        
        // Geographic insights with enhanced data
        const locationCounts = this.analysis.byLocation;
        const validLocationVendors = vendors.filter(v => v.analysis?.location && v.analysis?.urlValid);
        
        if (validLocationVendors.length > 0) {
            recommendations.push({
                type: 'geographic_opportunities',
                priority: 'medium',
                message: `Geographic coverage: ${validLocationVendors.length} vendors across Israeli cities with validated websites`,
                coverage: locationCounts
            });
        }
        
        return recommendations;
    }

    prioritizeVendorsForIntegration() {
        const vendors = Array.from(this.discoveredVendors.values());
        
        // Enhanced scoring algorithm for integration priority
        const scoredVendors = vendors.map(vendor => {
            let integrationScore = vendor.relevanceScore * 0.35; // Reduced base weight
            
            // Major boost for verified vendors
            if (vendor.isVerified) integrationScore += 0.3;
            
            // URL validation boost
            if (vendor.analysis?.urlValid) integrationScore += 0.15;
            
            // Platform detection boost
            if (vendor.analysis?.platformDetected && 
                !['Unknown', 'Facebook Page'].includes(vendor.analysis.platformDetected)) {
                integrationScore += 0.1;
            }
            
            // Hebrew content boost (critical for Israeli market)
            if (vendor.analysis?.hasHebrewContent) integrationScore += 0.1;
            
            // E-commerce capability boosts
            if (vendor.analysis.hasOnlineOrdering) integrationScore += 0.2;
            if (vendor.analysis.hasDelivery) integrationScore += 0.1;
            if (vendor.analysis.isKosher) integrationScore += 0.08;
            
            // Business type considerations
            if (vendor.analysis?.businessType === 'chain') integrationScore += 0.05;
            if (vendor.analysis?.businessType === 'delivery') integrationScore += 0.05;
            
            // Source reliability
            if (vendor.source === 'verified_israeli_vendors') integrationScore += 0.2;
            
            return {
                ...vendor,
                integrationScore: Math.min(integrationScore, 1.0)
            };
        });
        
        // Sort by integration score and return top candidates
        return {
            phase1_ready: scoredVendors
                .filter(v => v.integrationScore > 0.8)
                .sort((a, b) => b.integrationScore - a.integrationScore)
                .slice(0, 5),
            phase2_candidates: scoredVendors
                .filter(v => v.integrationScore > 0.6 && v.integrationScore <= 0.8)
                .sort((a, b) => b.integrationScore - a.integrationScore)
                .slice(0, 8),
            phase3_potential: scoredVendors
                .filter(v => v.integrationScore > 0.4 && v.integrationScore <= 0.6)
                .sort((a, b) => b.integrationScore - a.integrationScore)
                .slice(0, 10),
            needsReview: scoredVendors
                .filter(v => v.integrationScore <= 0.4 || !v.analysis?.urlValid)
                .sort((a, b) => b.integrationScore - a.integrationScore)
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default HebrewVendorDiscovery;