import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import StealthCaptchaSolver from './stealth-captcha-solver.js';

// Add stealth plugin with enhanced configuration
puppeteer.use(StealthPlugin());

class StealthBrowser {
    constructor(options = {}) {
        this.options = {
            headless: options.headless !== false,
            timeout: options.timeout || 30000,
            userAgent: options.userAgent || this.getHebrewUserAgent(),
            viewport: options.viewport || { width: 1366, height: 768 },
            captchaSolver: options.captchaSolver || new StealthCaptchaSolver(),
            ...options
        };
        this.browser = null;
        this.page = null;
    }

    /**
     * Get Hebrew-aware user agent
     */
    getHebrewUserAgent() {
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15'
        ];
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }

    /**
     * Launch browser with stealth settings
     */
    async launch() {
        try {
            const launchOptions = {
                headless: this.options.headless,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-features=TranslateUI',
                    '--disable-extensions',
                    '--disable-default-apps',
                    '--disable-sync',
                    '--disable-web-security',
                    '--allow-running-insecure-content',
                    '--lang=he-IL,he,en-US,en',
                    '--accept-lang=he-IL,he,en-US,en'
                ],
                defaultViewport: this.options.viewport,
                ignoreHTTPSErrors: true,
                timeout: this.options.timeout
            };

            this.browser = await puppeteer.launch(launchOptions);
            this.page = await this.browser.newPage();

            // Set Hebrew-aware user agent
            await this.page.setUserAgent(this.options.userAgent);

            // Set Hebrew locale
            await this.page.setExtraHTTPHeaders({
                'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            });

            // Set timezone to Israel
            await this.page.emulateTimezone('Asia/Jerusalem');

            // Add Hebrew font support
            await this.page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'language', {
                    get: () => 'he-IL'
                });
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['he-IL', 'he', 'en-US', 'en']
                });
            });

            console.log('✅ Stealth browser launched successfully with Hebrew support');
            return this.page;
        } catch (error) {
            console.error('❌ Failed to launch stealth browser:', error.message);
            throw error;
        }
    }

    /**
     * Navigate to URL with CAPTCHA handling
     */
    async goto(url, options = {}) {
        if (!this.page) {
            throw new Error('Browser not launched. Call launch() first.');
        }

        try {
            console.log(`🔗 Navigating to: ${url}`);
            
            // Navigate with retry logic
            const response = await this.page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: this.options.timeout,
                ...options
            });

            // Wait for page to load
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Check for CAPTCHAs
            await this.handleCaptchas(url);

            return response;
        } catch (error) {
            console.error(`❌ Navigation failed for ${url}:`, error.message);
            throw error;
        }
    }

    /**
     * Handle CAPTCHAs with stealth-first approach
     */
    async handleCaptchas(url) {
        try {
            // Apply enhanced stealth techniques first
            await this.options.captchaSolver.enhancedStealth(this.page);
            
            // Test stealth effectiveness
            const stealthEffective = await this.options.captchaSolver.testStealthEffectiveness(this.page);
            console.log(`🥷 Stealth effectiveness: ${stealthEffective ? 'High' : 'Moderate'}`);
            
            // Handle any remaining CAPTCHA challenges
            const result = await this.options.captchaSolver.handleCaptchaChallenge(this.page, url);
            
            if (result.success) {
                console.log(`✅ CAPTCHA handling successful via ${result.method}`);
            } else {
                console.warn(`⚠️ CAPTCHA handling failed: ${result.reason || result.error}`);
                if (result.suggestion) {
                    console.log(`💡 Suggestion: ${result.suggestion}`);
                }
            }

        } catch (error) {
            console.warn('⚠️ CAPTCHA handling failed:', error.message);
            // Continue anyway - stealth techniques should minimize CAPTCHA encounters
        }
    }

    /**
     * Solve reCAPTCHA v2
     */
    async solveRecaptchaV2(url) {
        const siteKey = await this.page.evaluate(() => {
            const element = document.querySelector('.g-recaptcha');
            return element ? element.getAttribute('data-sitekey') : null;
        });

        if (!siteKey) {
            throw new Error('reCAPTCHA site key not found');
        }

        const token = await this.options.captchaSolver.solveRecaptchaV2(url, siteKey);
        
        // Inject solution
        await this.page.evaluate((token) => {
            document.getElementById('g-recaptcha-response').innerHTML = token;
        }, token);

        console.log('✅ reCAPTCHA v2 solved and injected');
    }

    /**
     * Solve reCAPTCHA v3
     */
    async solveRecaptchaV3(url) {
        const siteKey = await this.page.evaluate(() => {
            const element = document.querySelector('[data-sitekey]');
            return element ? element.getAttribute('data-sitekey') : null;
        });

        if (!siteKey) {
            throw new Error('reCAPTCHA v3 site key not found');
        }

        const token = await this.options.captchaSolver.solveRecaptchaV3(url, siteKey);
        
        // Inject solution
        await this.page.evaluate((token) => {
            if (window.grecaptcha && window.grecaptcha.execute) {
                window.grecaptcha.execute = () => Promise.resolve(token);
            }
        }, token);

        console.log('✅ reCAPTCHA v3 solved and injected');
    }

    /**
     * Solve hCaptcha
     */
    async solveHCaptcha(url) {
        const siteKey = await this.page.evaluate(() => {
            const element = document.querySelector('.h-captcha');
            return element ? element.getAttribute('data-sitekey') : null;
        });

        if (!siteKey) {
            throw new Error('hCaptcha site key not found');
        }

        const token = await this.options.captchaSolver.solveHCaptcha(url, siteKey);
        
        // Inject solution
        await this.page.evaluate((token) => {
            const responseElement = document.querySelector('[name="h-captcha-response"]');
            if (responseElement) {
                responseElement.value = token;
            }
        }, token);

        console.log('✅ hCaptcha solved and injected');
    }

    /**
     * Handle image-based CAPTCHAs
     */
    async handleImageCaptchas() {
        const captchaImages = await this.page.$$('img[src*="captcha"], img[alt*="captcha"], img[class*="captcha"]');
        
        for (const img of captchaImages) {
            try {
                const imageBase64 = await this.page.evaluate((img) => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    ctx.drawImage(img, 0, 0);
                    return canvas.toDataURL().split(',')[1];
                }, img);

                const solution = await this.options.captchaSolver.solveImageCaptcha(imageBase64);
                
                // Find input field near the image
                const inputField = await this.page.$('input[type="text"]');
                if (inputField) {
                    await inputField.type(solution);
                    console.log('✅ Image CAPTCHA solved and entered');
                }
            } catch (error) {
                console.warn('⚠️ Image CAPTCHA solving failed:', error.message);
            }
        }
    }

    /**
     * Extract products with Hebrew support
     */
    async extractProducts(selectors) {
        if (!this.page) {
            throw new Error('Browser not launched. Call launch() first.');
        }

        try {
            const products = await this.page.evaluate((selectors) => {
                const products = [];
                const productElements = document.querySelectorAll(selectors.product);

                productElements.forEach((element, index) => {
                    try {
                        const nameElement = element.querySelector(selectors.name);
                        const priceElement = element.querySelector(selectors.price);
                        
                        if (nameElement && priceElement) {
                            const name = nameElement.textContent?.trim() || '';
                            const price = priceElement.textContent?.trim() || '';
                            
                            // Skip if empty
                            if (name && price) {
                                products.push({
                                    name,
                                    price,
                                    index,
                                    url: window.location.href,
                                    timestamp: new Date().toISOString()
                                });
                            }
                        }
                    } catch (error) {
                        console.warn(`Product extraction error at index ${index}:`, error.message);
                    }
                });

                return products;
            }, selectors);

            console.log(`📦 Extracted ${products.length} products`);
            return products;
        } catch (error) {
            console.error('❌ Product extraction failed:', error.message);
            throw error;
        }
    }

    /**
     * Take screenshot for debugging
     */
    async screenshot(path) {
        if (!this.page) {
            throw new Error('Browser not launched. Call launch() first.');
        }

        try {
            await this.page.screenshot({ 
                path, 
                fullPage: true,
                quality: 90,
                type: 'png'
            });
            console.log(`📸 Screenshot saved: ${path}`);
        } catch (error) {
            console.error('❌ Screenshot failed:', error.message);
        }
    }

    /**
     * Close browser
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Browser closed');
        }
    }

    /**
     * Random delay to mimic human behavior
     */
    async humanDelay(min = 1000, max = 3000) {
        const delay = Math.random() * (max - min) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

export default StealthBrowser;