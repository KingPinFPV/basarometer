/**
 * Israeli Market Intelligence System
 * Advanced Hebrew processing and business intelligence for meat market analysis
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class IsraeliMarketIntelligence {
    constructor(options = {}) {
        this.configDir = options.configDir || path.join(__dirname, '..', 'config');
        this.outputDir = options.outputDir || path.join(__dirname, '..', 'market-intelligence');
        
        // Hebrew business name patterns
        this.businessNamePatterns = {
            chains: [
                { pattern: /רמי[\s\-]?לוי/, normalized: 'רמי לוי', type: 'supermarket_chain' },
                { pattern: /שופרסל/, normalized: 'שופרסל', type: 'supermarket_chain' },
                { pattern: /מגה[\s\-]?באר/, normalized: 'מגה באר', type: 'supermarket_chain' },
                { pattern: /טיב[\s\-]?טעם/, normalized: 'טיב טעם', type: 'supermarket_chain' },
                { pattern: /ויקטורי/, normalized: 'ויקטורי', type: 'discount_chain' },
                { pattern: /יינות[\s\-]?ביתן/, normalized: 'יינות ביתן', type: 'family_chain' },
                { pattern: /חצי[\s\-]?חינם/, normalized: 'חצי חינם', type: 'discount_chain' },
                { pattern: /קרפור/, normalized: 'קרפור', type: 'international_chain' }
            ],
            butchers: [
                { pattern: /קצב[ית]ה?/, normalized: 'קצביה', type: 'local_butcher' },
                { pattern: /בית[\s\-]?מטבחיים/, normalized: 'בית מטבחיים', type: 'slaughterhouse' },
                { pattern: /חנות[\s\-]?בשר/, normalized: 'חנות בשר', type: 'meat_shop' },
                { pattern: /מטבחיים/, normalized: 'מטבחיים', type: 'slaughterhouse' }
            ],
            online: [
                { pattern: /מיט[\s\-]?אונליין/, normalized: 'מיט אונליין', type: 'online_butcher' },
                { pattern: /בשר[\s\-]?ישיר/, normalized: 'בשר ישיר', type: 'direct_delivery' },
                { pattern: /אונליין[\s\-]?מיט/, normalized: 'אונליין מיט', type: 'online_delivery' },
                { pattern: /פרש[\s\-]?מיט/, normalized: 'פרש מיט', type: 'fresh_delivery' },
                { pattern: /קצב[\s\-]?אונליין/, normalized: 'קצב אונליין', type: 'online_butcher' }
            ]
        };
        
        // Expanded Hebrew product catalog
        this.productCatalog = {
            // Basic meat cuts - בסיסי
            basicCuts: {
                'אנטריקוט': { type: 'beef', cut: 'entrecote', grade: 'premium', hebrewAliases: ['אנטרקוט', 'אנטריקוט בקר'] },
                'פילה': { type: 'beef', cut: 'fillet', grade: 'premium', hebrewAliases: ['פילה בקר', 'טנדרלוין'] },
                'סטייק': { type: 'beef', cut: 'steak', grade: 'standard', hebrewAliases: ['סטייק בקר', 'מטקה'] },
                'צלעות': { type: 'beef', cut: 'ribs', grade: 'standard', hebrewAliases: ['צלעות בקר', 'ריב'] },
                'שקדי עגל': { type: 'veal', cut: 'sweetbreads', grade: 'delicacy', hebrewAliases: ['שקדים'] },
                'אוסובוקו': { type: 'beef', cut: 'osso_buco', grade: 'specialty', hebrewAliases: ['אוסו בוקו'] },
                'צווארון': { type: 'beef', cut: 'neck', grade: 'standard', hebrewAliases: ['צוואר בקר'] }
            },
            
            // Chicken cuts - עוף
            chickenCuts: {
                'חזה עוף': { type: 'chicken', cut: 'breast', grade: 'standard', hebrewAliases: ['חזה', 'חזה ללא עצם'] },
                'שוק עוף': { type: 'chicken', cut: 'thigh', grade: 'standard', hebrewAliases: ['שוקיים', 'ירך עוף'] },
                'כנפיים': { type: 'chicken', cut: 'wings', grade: 'standard', hebrewAliases: ['כנפי עוף', 'כנפיים עוף'] },
                'עוף שלם': { type: 'chicken', cut: 'whole', grade: 'standard', hebrewAliases: ['עוף שלם קפוא', 'עוף טרי'] },
                'פרגית': { type: 'chicken', cut: 'young_chicken', grade: 'premium', hebrewAliases: ['פרגיות', 'עוף צעיר'] }
            },
            
            // Lamb and veal - כבש וטלה
            lambVeal: {
                'כבש': { type: 'lamb', cut: 'general', grade: 'standard', hebrewAliases: ['בשר כבש', 'כבש טרי'] },
                'טלה': { type: 'lamb', cut: 'young_lamb', grade: 'premium', hebrewAliases: ['בשר טלה', 'טלה ירושלמי'] },
                'כתף כבש': { type: 'lamb', cut: 'shoulder', grade: 'standard', hebrewAliases: ['כתף טלה'] },
                'רגל כבש': { type: 'lamb', cut: 'leg', grade: 'premium', hebrewAliases: ['רגל טלה'] },
                'צלעות כבש': { type: 'lamb', cut: 'ribs', grade: 'premium', hebrewAliases: ['צלעות טלה'] }
            },
            
            // Processed meats - מעובד
            processedMeats: {
                'קציצות': { type: 'processed', cut: 'meatballs', grade: 'standard', hebrewAliases: ['קציצות בקר', 'כדורי בשר'] },
                'המבורגר': { type: 'processed', cut: 'burger', grade: 'standard', hebrewAliases: ['המבורגרים', 'פטיס'] },
                'קבב': { type: 'processed', cut: 'kebab', grade: 'standard', hebrewAliases: ['קבבים', 'שיפודים'] },
                'נקניק': { type: 'processed', cut: 'sausage', grade: 'standard', hebrewAliases: ['נקניקים', 'נקניקיות'] },
                'שניצל': { type: 'processed', cut: 'schnitzel', grade: 'standard', hebrewAliases: ['שניצלים', 'שניצל עוף'] }
            }
        };
        
        // Hebrew quality grades
        this.qualityGrades = {
            'אנגוס': { grade: 'angus', premium: true, priceMultiplier: 1.3 },
            'וואגיו': { grade: 'wagyu', premium: true, priceMultiplier: 2.5 },
            'פרימיום': { grade: 'premium', premium: true, priceMultiplier: 1.2 },
            'ביו': { grade: 'organic', premium: true, priceMultiplier: 1.4 },
            'אורגני': { grade: 'organic', premium: true, priceMultiplier: 1.4 },
            'מיובש': { grade: 'aged', premium: true, priceMultiplier: 1.3 },
            'מהדרין': { grade: 'mehadrin_kosher', premium: false, priceMultiplier: 1.1 },
            'חלק': { grade: 'kosher_smooth', premium: false, priceMultiplier: 1.05 },
            'רגיל': { grade: 'standard', premium: false, priceMultiplier: 1.0 }
        };
        
        // Israeli cities and regions
        this.israeliGeography = {
            majorCities: [
                'תל אביב', 'ירושלים', 'חיפה', 'ראשון לציון', 'פתח תקווה',
                'נתניה', 'באר שבע', 'בני ברק', 'רמת גן', 'אשדוד',
                'חולון', 'בת ים', 'רחובות', 'כפר סבא', 'מודיעין'
            ],
            regions: {
                'north': ['חיפה', 'נהריה', 'עכו', 'טבריה', 'צפת', 'קריית שמונה'],
                'center': ['תל אביב', 'רמת גן', 'פתח תקווה', 'חולון', 'נתניה', 'כפר סבא'],
                'jerusalem': ['ירושלים', 'בית שמש', 'מעלה אדומים'],
                'south': ['באר שבע', 'אשקלון', 'אשדוד', 'אילת', 'דימונה'],
                'religious': ['בני ברק', 'מודיעין עילית', 'ביתר עילית', 'עמנואל']
            }
        };
        
        // Market segment analysis
        this.marketSegments = {
            premium: {
                keywords: ['אנגוס', 'וואגיו', 'פרימיום', 'מיובש', 'ביו', 'אורגני'],
                expectedPriceRange: { min: 80, max: 300 },
                targetAudience: 'high_income'
            },
            mainstream: {
                keywords: ['רגיל', 'סטנדרט', 'משפחתי', 'חסכוני'],
                expectedPriceRange: { min: 30, max: 80 },
                targetAudience: 'general_public'
            },
            religious: {
                keywords: ['מהדרין', 'כשר', 'חלק', 'בשרי', 'הכשר'],
                expectedPriceRange: { min: 40, max: 100 },
                targetAudience: 'religious_community'
            },
            value: {
                keywords: ['מבצע', 'חיסכון', 'זול', 'הנחה', 'במחיר מיוחד'],
                expectedPriceRange: { min: 20, max: 60 },
                targetAudience: 'price_sensitive'
            }
        };
    }

    async initialize() {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
            console.log('🧠 Israeli Market Intelligence System initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize intelligence system:', error);
            return false;
        }
    }

    normalizeBusinessName(businessName) {
        if (!businessName || typeof businessName !== 'string') {
            return { normalized: businessName, type: 'unknown', confidence: 0 };
        }
        
        const name = businessName.trim().toLowerCase();
        
        // Check all business pattern categories
        for (const [category, patterns] of Object.entries(this.businessNamePatterns)) {
            for (const { pattern, normalized, type } of patterns) {
                if (pattern.test(name)) {
                    return {
                        normalized,
                        type,
                        category,
                        confidence: 0.9,
                        originalName: businessName
                    };
                }
            }
        }
        
        // Fallback: check for general business indicators
        if (name.includes('סופר') || name.includes('market')) {
            return {
                normalized: businessName,
                type: 'supermarket',
                category: 'general',
                confidence: 0.6,
                originalName: businessName
            };
        }
        
        if (name.includes('קצב') || name.includes('בשר')) {
            return {
                normalized: businessName,
                type: 'butcher',
                category: 'general',
                confidence: 0.7,
                originalName: businessName
            };
        }
        
        return {
            normalized: businessName,
            type: 'unknown',
            category: 'unknown',
            confidence: 0.3,
            originalName: businessName
        };
    }

    analyzeProduct(productName, price = null, vendor = null) {
        if (!productName || typeof productName !== 'string') {
            return null;
        }
        
        const name = productName.trim().toLowerCase();
        
        // Detect basic product information
        const productInfo = {
            originalName: productName,
            normalizedName: '',
            type: 'unknown',
            cut: 'unknown',
            grade: 'standard',
            premium: false,
            kosher: false,
            weight: null,
            pricePerKg: null,
            marketSegment: 'mainstream',
            confidence: 0,
            hebrewFeatures: this.extractHebrewFeatures(productName)
        };
        
        // Match against product catalog
        let bestMatch = null;
        let bestScore = 0;
        
        for (const [category, products] of Object.entries(this.productCatalog)) {
            for (const [productKey, productData] of Object.entries(products)) {
                const score = this.calculateProductMatchScore(name, productKey, productData);
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = { key: productKey, data: productData, category };
                }
            }
        }
        
        // Apply best match if confidence is high enough
        if (bestMatch && bestScore > 0.5) {
            productInfo.normalizedName = bestMatch.key;
            productInfo.type = bestMatch.data.type;
            productInfo.cut = bestMatch.data.cut;
            productInfo.grade = bestMatch.data.grade;
            productInfo.confidence = bestScore;
        }
        
        // Detect quality grades
        const qualityAnalysis = this.analyzeQuality(name);
        if (qualityAnalysis.detected) {
            productInfo.grade = qualityAnalysis.grade;
            productInfo.premium = qualityAnalysis.premium;
        }
        
        // Detect kosher indicators
        productInfo.kosher = this.detectKosher(name);
        
        // Extract weight and calculate price per kg
        productInfo.weight = this.extractWeight(productName);
        if (price && productInfo.weight) {
            productInfo.pricePerKg = this.calculatePricePerKg(price, productInfo.weight);
        }
        
        // Determine market segment
        productInfo.marketSegment = this.determineMarketSegment(productInfo);
        
        return productInfo;
    }

    calculateProductMatchScore(productName, catalogKey, catalogData) {
        let score = 0;
        
        // Direct match with catalog key
        if (productName.includes(catalogKey.toLowerCase())) {
            score += 0.8;
        }
        
        // Match with aliases
        if (catalogData.hebrewAliases) {
            for (const alias of catalogData.hebrewAliases) {
                if (productName.includes(alias.toLowerCase())) {
                    score += 0.6;
                    break;
                }
            }
        }
        
        // Partial word matches
        const catalogWords = catalogKey.split(' ');
        const productWords = productName.split(' ');
        
        for (const catalogWord of catalogWords) {
            for (const productWord of productWords) {
                if (catalogWord.length > 2 && productWord.includes(catalogWord)) {
                    score += 0.2;
                }
            }
        }
        
        return Math.min(score, 1.0);
    }

    analyzeQuality(productName) {
        for (const [gradeKey, gradeData] of Object.entries(this.qualityGrades)) {
            if (productName.includes(gradeKey.toLowerCase())) {
                return {
                    detected: true,
                    grade: gradeData.grade,
                    premium: gradeData.premium,
                    priceMultiplier: gradeData.priceMultiplier,
                    keyword: gradeKey
                };
            }
        }
        
        return { detected: false, grade: 'standard', premium: false };
    }

    detectKosher(productName) {
        const kosherKeywords = ['כשר', 'מהדרין', 'חלק', 'בשרי', 'הכשר', 'בד"ץ'];
        return kosherKeywords.some(keyword => productName.includes(keyword));
    }

    extractWeight(productName) {
        // Hebrew and English weight patterns
        const weightPatterns = [
            /(\d+(?:\.\d+)?)\s*ק"?ג/g,      // קילוגרם
            /(\d+(?:\.\d+)?)\s*קילו/g,      // קילו
            /(\d+(?:\.\d+)?)\s*גר/g,        // גרם
            /(\d+(?:\.\d+)?)\s*גרם/g,       // גרם
            /(\d+(?:\.\d+)?)\s*kg/gi,       // kg
            /(\d+(?:\.\d+)?)\s*g/gi         // g
        ];
        
        for (const pattern of weightPatterns) {
            const match = productName.match(pattern);
            if (match) {
                let weight = parseFloat(match[1]);
                const unit = match[0].toLowerCase();
                
                // Convert to grams
                if (unit.includes('ק') || unit.includes('kg') || unit.includes('קילו')) {
                    weight *= 1000;
                }
                
                return { value: weight, unit: 'grams', displayUnit: unit };
            }
        }
        
        return null;
    }

    calculatePricePerKg(price, weight) {
        if (!price || !weight || weight.value <= 0) return null;
        
        // Extract numeric price
        const priceMatch = price.toString().match(/(\d+(?:\.\d+)?)/);
        if (!priceMatch) return null;
        
        const numericPrice = parseFloat(priceMatch[1]);
        const weightInKg = weight.value / 1000;
        
        return {
            pricePerKg: Math.round((numericPrice / weightInKg) * 100) / 100,
            originalPrice: numericPrice,
            weightKg: weightInKg
        };
    }

    determineMarketSegment(productInfo) {
        // Premium indicators
        if (productInfo.premium || productInfo.grade === 'angus' || productInfo.grade === 'wagyu') {
            return 'premium';
        }
        
        // Religious market
        if (productInfo.kosher || productInfo.grade === 'mehadrin_kosher') {
            return 'religious';
        }
        
        // Value indicators from product name
        const valueName = productInfo.originalName.toLowerCase();
        const valueKeywords = this.marketSegments.value.keywords;
        if (valueKeywords.some(keyword => valueName.includes(keyword))) {
            return 'value';
        }
        
        return 'mainstream';
    }

    extractHebrewFeatures(text) {
        const features = {
            hasHebrew: /[\u0590-\u05FF]/.test(text),
            isRTL: this.isRTLText(text),
            hebrewWordCount: (text.match(/[\u0590-\u05FF]+/g) || []).length,
            mixedLanguage: /[\u0590-\u05FF]/.test(text) && /[a-zA-Z]/.test(text),
            numericalData: /\d/.test(text)
        };
        
        return features;
    }

    isRTLText(text) {
        const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
        const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
        return hebrewChars > latinChars;
    }

    analyzeMarketData(products, vendors = []) {
        const analysis = {
            totalProducts: products.length,
            totalVendors: vendors.length,
            productBreakdown: {
                byType: {},
                byCut: {},
                byGrade: {},
                byMarketSegment: {}
            },
            vendorBreakdown: {
                byType: {},
                byCategory: {}
            },
            priceAnalysis: {
                byType: {},
                byGrade: {},
                overallRange: { min: Infinity, max: -Infinity }
            },
            marketInsights: [],
            recommendations: []
        };
        
        // Analyze products
        for (const product of products) {
            const productAnalysis = this.analyzeProduct(product.name, product.price, product.vendor);
            
            if (productAnalysis) {
                // Count by type
                analysis.productBreakdown.byType[productAnalysis.type] = 
                    (analysis.productBreakdown.byType[productAnalysis.type] || 0) + 1;
                
                // Count by cut
                analysis.productBreakdown.byCut[productAnalysis.cut] = 
                    (analysis.productBreakdown.byCut[productAnalysis.cut] || 0) + 1;
                
                // Count by grade
                analysis.productBreakdown.byGrade[productAnalysis.grade] = 
                    (analysis.productBreakdown.byGrade[productAnalysis.grade] || 0) + 1;
                
                // Count by market segment
                analysis.productBreakdown.byMarketSegment[productAnalysis.marketSegment] = 
                    (analysis.productBreakdown.byMarketSegment[productAnalysis.marketSegment] || 0) + 1;
                
                // Price analysis
                if (productAnalysis.pricePerKg) {
                    const pricePerKg = productAnalysis.pricePerKg.pricePerKg;
                    
                    if (!analysis.priceAnalysis.byType[productAnalysis.type]) {
                        analysis.priceAnalysis.byType[productAnalysis.type] = [];
                    }
                    analysis.priceAnalysis.byType[productAnalysis.type].push(pricePerKg);
                    
                    if (!analysis.priceAnalysis.byGrade[productAnalysis.grade]) {
                        analysis.priceAnalysis.byGrade[productAnalysis.grade] = [];
                    }
                    analysis.priceAnalysis.byGrade[productAnalysis.grade].push(pricePerKg);
                    
                    analysis.priceAnalysis.overallRange.min = Math.min(analysis.priceAnalysis.overallRange.min, pricePerKg);
                    analysis.priceAnalysis.overallRange.max = Math.max(analysis.priceAnalysis.overallRange.max, pricePerKg);
                }
            }
        }
        
        // Analyze vendors
        for (const vendor of vendors) {
            const vendorAnalysis = this.normalizeBusinessName(vendor.name || vendor.title);
            
            analysis.vendorBreakdown.byType[vendorAnalysis.type] = 
                (analysis.vendorBreakdown.byType[vendorAnalysis.type] || 0) + 1;
            
            analysis.vendorBreakdown.byCategory[vendorAnalysis.category] = 
                (analysis.vendorBreakdown.byCategory[vendorAnalysis.category] || 0) + 1;
        }
        
        // Calculate price statistics
        for (const [type, prices] of Object.entries(analysis.priceAnalysis.byType)) {
            if (prices.length > 0) {
                analysis.priceAnalysis.byType[type] = {
                    min: Math.min(...prices),
                    max: Math.max(...prices),
                    avg: prices.reduce((a, b) => a + b, 0) / prices.length,
                    count: prices.length
                };
            }
        }
        
        for (const [grade, prices] of Object.entries(analysis.priceAnalysis.byGrade)) {
            if (prices.length > 0) {
                analysis.priceAnalysis.byGrade[grade] = {
                    min: Math.min(...prices),
                    max: Math.max(...prices),
                    avg: prices.reduce((a, b) => a + b, 0) / prices.length,
                    count: prices.length
                };
            }
        }
        
        // Generate insights and recommendations
        analysis.marketInsights = this.generateMarketInsights(analysis);
        analysis.recommendations = this.generateRecommendations(analysis);
        
        return analysis;
    }

    generateMarketInsights(analysis) {
        const insights = [];
        
        // Market diversity insight
        const uniqueTypes = Object.keys(analysis.productBreakdown.byType).length;
        if (uniqueTypes >= 4) {
            insights.push({
                type: 'market_diversity',
                message: `High market diversity with ${uniqueTypes} different meat types available`,
                significance: 'positive'
            });
        }
        
        // Premium market presence
        const premiumCount = analysis.productBreakdown.byMarketSegment.premium || 0;
        const totalProducts = analysis.totalProducts;
        const premiumPercentage = (premiumCount / totalProducts) * 100;
        
        if (premiumPercentage > 20) {
            insights.push({
                type: 'premium_market',
                message: `Strong premium market presence (${premiumPercentage.toFixed(1)}% of products)`,
                significance: 'positive'
            });
        }
        
        // Price range insight
        if (analysis.priceAnalysis.overallRange.min < Infinity) {
            const priceRange = analysis.priceAnalysis.overallRange.max - analysis.priceAnalysis.overallRange.min;
            insights.push({
                type: 'price_range',
                message: `Wide price range from ₪${analysis.priceAnalysis.overallRange.min}/kg to ₪${analysis.priceAnalysis.overallRange.max}/kg`,
                significance: 'neutral',
                range: priceRange
            });
        }
        
        // Vendor diversity
        const vendorTypes = Object.keys(analysis.vendorBreakdown.byType).length;
        if (vendorTypes >= 3) {
            insights.push({
                type: 'vendor_diversity',
                message: `Good vendor diversity with ${vendorTypes} different vendor types`,
                significance: 'positive'
            });
        }
        
        return insights;
    }

    generateRecommendations(analysis) {
        const recommendations = [];
        
        // Product coverage recommendations
        const beefCount = analysis.productBreakdown.byType.beef || 0;
        const chickenCount = analysis.productBreakdown.byType.chicken || 0;
        
        if (beefCount > chickenCount * 2) {
            recommendations.push({
                type: 'product_balance',
                priority: 'medium',
                message: 'Consider expanding chicken product coverage to balance portfolio',
                action: 'Add more chicken-focused vendors'
            });
        }
        
        // Premium market opportunity
        const premiumCount = analysis.productBreakdown.byMarketSegment.premium || 0;
        if (premiumCount < analysis.totalProducts * 0.15) {
            recommendations.push({
                type: 'premium_opportunity',
                priority: 'high',
                message: 'Premium market segment underrepresented - growth opportunity',
                action: 'Target premium butchers and specialty meat vendors'
            });
        }
        
        // Geographic expansion
        if (analysis.totalVendors < 10) {
            recommendations.push({
                type: 'scale_expansion',
                priority: 'high',
                message: 'Limited vendor coverage - scale to achieve market leadership',
                action: 'Expand to 50+ vendors across all Israeli regions'
            });
        }
        
        return recommendations;
    }

    async generateIntelligenceReport(products, vendors = []) {
        const analysis = this.analyzeMarketData(products, vendors);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(this.outputDir, `israeli-market-intelligence-${timestamp}.json`);
        
        const report = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalProducts: analysis.totalProducts,
                totalVendors: analysis.totalVendors,
                marketCoverage: this.calculateMarketCoverage(analysis),
                intelligenceScore: this.calculateIntelligenceScore(analysis)
            },
            analysis,
            businessIntelligence: {
                competitivePosition: this.assessCompetitivePosition(analysis),
                marketOpportunities: this.identifyMarketOpportunities(analysis),
                riskFactors: this.identifyRiskFactors(analysis)
            },
            actionablePlans: this.generateActionablePlans(analysis)
        };
        
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`📊 Israeli Market Intelligence Report saved to: ${reportPath}`);
        
        return report;
    }

    calculateMarketCoverage(analysis) {
        // Simplified market coverage calculation
        const vendorDiversity = Object.keys(analysis.vendorBreakdown.byType).length;
        const productDiversity = Object.keys(analysis.productBreakdown.byType).length;
        const segmentCoverage = Object.keys(analysis.productBreakdown.byMarketSegment).length;
        
        const coverageScore = Math.min(
            (vendorDiversity / 5) * 0.4 +
            (productDiversity / 4) * 0.3 +
            (segmentCoverage / 4) * 0.3,
            1.0
        );
        
        return {
            score: coverageScore,
            percentage: Math.round(coverageScore * 100),
            level: coverageScore > 0.8 ? 'excellent' : coverageScore > 0.6 ? 'good' : coverageScore > 0.4 ? 'moderate' : 'limited'
        };
    }

    calculateIntelligenceScore(analysis) {
        let score = 0;
        
        // Data quality (40%)
        const dataQuality = Math.min(analysis.totalProducts / 100, 1.0) * 0.4;
        score += dataQuality;
        
        // Market diversity (30%)
        const diversity = Math.min(Object.keys(analysis.productBreakdown.byType).length / 4, 1.0) * 0.3;
        score += diversity;
        
        // Vendor coverage (30%)
        const vendorCoverage = Math.min(analysis.totalVendors / 20, 1.0) * 0.3;
        score += vendorCoverage;
        
        return {
            score: score,
            percentage: Math.round(score * 100),
            level: score > 0.8 ? 'excellent' : score > 0.6 ? 'good' : score > 0.4 ? 'moderate' : 'basic'
        };
    }

    assessCompetitivePosition(analysis) {
        return {
            strengths: this.identifyStrengths(analysis),
            weaknesses: this.identifyWeaknesses(analysis),
            marketPosition: this.determineMarketPosition(analysis)
        };
    }

    identifyStrengths(analysis) {
        const strengths = [];
        
        if (analysis.totalProducts > 50) {
            strengths.push('Large product database for comprehensive price comparison');
        }
        
        if (Object.keys(analysis.vendorBreakdown.byType).length >= 3) {
            strengths.push('Diverse vendor portfolio across market segments');
        }
        
        if (analysis.productBreakdown.byMarketSegment.premium > 0) {
            strengths.push('Premium market coverage for high-value customers');
        }
        
        return strengths;
    }

    identifyWeaknesses(analysis) {
        const weaknesses = [];
        
        if (analysis.totalVendors < 10) {
            weaknesses.push('Limited vendor coverage compared to market potential');
        }
        
        if (!analysis.productBreakdown.byType.chicken || analysis.productBreakdown.byType.chicken < 10) {
            weaknesses.push('Insufficient chicken product coverage');
        }
        
        if (!analysis.productBreakdown.byMarketSegment.premium || analysis.productBreakdown.byMarketSegment.premium < 5) {
            weaknesses.push('Limited premium product representation');
        }
        
        return weaknesses;
    }

    determineMarketPosition(analysis) {
        const score = this.calculateIntelligenceScore(analysis).score;
        
        if (score > 0.8) return 'market_leader';
        if (score > 0.6) return 'strong_competitor';
        if (score > 0.4) return 'growing_player';
        return 'emerging_platform';
    }

    identifyMarketOpportunities(analysis) {
        const opportunities = [];
        
        // Geographic expansion
        opportunities.push({
            type: 'geographic_expansion',
            description: 'Expand to underserved Israeli regions',
            potential: 'high',
            estimatedImpact: '200-500 additional products'
        });
        
        // Premium market
        if ((analysis.productBreakdown.byMarketSegment.premium || 0) < analysis.totalProducts * 0.2) {
            opportunities.push({
                type: 'premium_segment',
                description: 'Capture premium meat market segment',
                potential: 'high',
                estimatedImpact: '30-50% price premium on high-end products'
            });
        }
        
        // Online delivery expansion
        opportunities.push({
            type: 'online_delivery',
            description: 'Expand online meat delivery platform coverage',
            potential: 'very_high',
            estimatedImpact: '300-1000 additional products from digital-first vendors'
        });
        
        return opportunities;
    }

    identifyRiskFactors(analysis) {
        const risks = [];
        
        if (analysis.totalVendors < 5) {
            risks.push({
                type: 'vendor_concentration',
                level: 'high',
                description: 'Over-reliance on limited number of vendors',
                mitigation: 'Diversify vendor portfolio'
            });
        }
        
        if (!analysis.productBreakdown.byType.chicken) {
            risks.push({
                type: 'product_gap',
                level: 'medium',
                description: 'Missing major product category (chicken)',
                mitigation: 'Add chicken-focused vendors'
            });
        }
        
        return risks;
    }

    generateActionablePlans(analysis) {
        return [
            {
                phase: 'immediate',
                duration: '1-2 weeks',
                actions: [
                    'Integrate top 3 online meat delivery platforms',
                    'Add premium butcher shops in Tel Aviv and Jerusalem',
                    'Expand chicken product coverage'
                ]
            },
            {
                phase: 'short_term',
                duration: '1-3 months',
                actions: [
                    'Scale to 25+ vendors across major Israeli cities',
                    'Implement automated daily scanning for all platforms',
                    'Add regional specialty meat vendors'
                ]
            },
            {
                phase: 'long_term',
                duration: '3-12 months',
                actions: [
                    'Achieve 50+ vendor coverage nationwide',
                    'Launch advanced market intelligence dashboard',
                    'Expand to wholesale and restaurant supply chains'
                ]
            }
        ];
    }
}

export default IsraeliMarketIntelligence;