class HebrewProductProcessor {
    constructor() {
        this.meatKeywords = [
            'בשר', 'עוף', 'בקר', 'כבש', 'עגל', 'טלה', 'הודו',
            'אנטריקוט', 'רוסטביף', 'סטייק', 'פילה', 'שניצל',
            'קבב', 'שווארמה', 'כבד', 'לב', 'קורקבן', 'צלעות',
            'כתף', 'ירך', 'חזה', 'שוק', 'צוואר', 'מוח'
        ];

        this.qualityGrades = {
            'premium': ['פרימיום', 'אנגוס', 'וואגו', 'וואגיו', 'AA', 'A+'],
            'high': ['מובחר', 'איכות גבוהה', 'A', 'מיוחד'],
            'standard': ['רגיל', 'סטנדרט', 'בסיסי', 'B'],
            'organic': ['אורגני', 'ביו', 'טבעי', 'אקו'],
            'kosher_levels': ['מהדרין', 'כשר', 'חלק', "בד\"ץ", 'עדה חרדית']
        };

        this.brandNames = [
            'תנובה', 'שטראוס', 'עוף טוב', 'זוגלובק', 'גלובוס',
            'טבע הדברים', 'הטחנה', 'עוף חי', 'בשר טוב',
            'איכילוב', 'כרמל מזון', 'נטול', 'אהרוני'
        ];

        this.unitPatterns = {
            'kg': /(\d+\.?\d*)\s*ק"?ג/g,
            'gram': /(\d+)\s*גר'?ם?/g,
            'piece': /(\d+)\s*(יח'?|יחיד[הות]?|חתיכ[הות]?)/g,
            'package': /(\d+)\s*(אריז[הות]?|חבילת?)/g
        };

        this.pricePatterns = {
            'shekel': /(\d+\.?\d*)\s*₪/g,
            'shekel_text': /(\d+\.?\d*)\s*שקל/g,
            'per_kg': /(\d+\.?\d*)\s*₪\s*\/?\s*ק"?ג/g,
            'per_gram': /(\d+\.?\d*)\s*₪\s*\/?\s*(\d+)\s*גר'?ם/g
        };

        this.cutHierarchy = {
            'premium_cuts': ['פילה', 'אנטריקוט', 'רוסטביף', 'שנילצל'],
            'standard_cuts': ['כתף', 'ירך', 'חזה', 'שוק'],
            'economy_cuts': ['צוואר', 'צלעות', 'קרביים'],
            'processed': ['קבב', 'שווארמה', 'נקניק', 'המבורגר']
        };
    }

    /**
     * Process and classify Hebrew meat product
     */
    processProduct(rawProduct) {
        try {
            const product = {
                ...rawProduct,
                processed: {
                    normalizedName: this.normalizeName(rawProduct.name),
                    detectedMeat: this.detectMeatType(rawProduct.name),
                    qualityGrade: this.detectQualityGrade(rawProduct.name),
                    brand: this.detectBrand(rawProduct.name),
                    cut: this.detectCut(rawProduct.name),
                    unit: this.extractUnit(rawProduct.name),
                    pricePerKg: this.calculatePricePerKg(rawProduct.price, rawProduct.name),
                    confidence: 0
                }
            };

            // Calculate confidence score
            product.processed.confidence = this.calculateConfidence(product);

            // Add Hebrew metadata
            product.processed.isHebrew = this.isHebrewText(rawProduct.name);
            product.processed.category = this.categorizeProduct(product);
            
            return product;
        } catch (error) {
            console.error('Product processing error:', error.message);
            return {
                ...rawProduct,
                processed: {
                    error: error.message,
                    confidence: 0
                }
            };
        }
    }

    /**
     * Normalize Hebrew product name
     */
    normalizeName(name) {
        if (!name) return '';

        let normalized = name.trim();
        
        // Remove extra whitespace
        normalized = normalized.replace(/\s+/g, ' ');
        
        // Remove special characters but keep Hebrew and numbers
        normalized = normalized.replace(/[^\u0590-\u05FF\u0020-\u007E\d]/g, '');
        
        // Common Hebrew meat name standardizations
        const replacements = {
            'אנטרקוט': 'אנטריקוט',
            'שניצל': 'שניצל',
            'רוסט ביף': 'רוסטביף',
            'קבאב': 'קבב',
            'שוארמה': 'שווארמה'
        };

        for (const [from, to] of Object.entries(replacements)) {
            normalized = normalized.replace(new RegExp(from, 'g'), to);
        }

        return normalized;
    }

    /**
     * Detect meat type from Hebrew text
     */
    detectMeatType(name) {
        if (!name) return null;

        const lowerName = name.toLowerCase();
        
        const meatTypes = {
            'בקר': ['בקר', 'פרה', 'שור'],
            'עוף': ['עוף', 'תרנגול', 'דג״ח'],
            'כבש': ['כבש', 'טלה', 'איל'],
            'עגל': ['עגל', 'עגלה'],
            'הודו': ['הודו', 'תרנגול הודו'],
            'חזיר': ['חזיר'] // Usually not kosher
        };

        for (const [type, keywords] of Object.entries(meatTypes)) {
            if (keywords.some(keyword => lowerName.includes(keyword))) {
                return type;
            }
        }

        // Default detection based on common patterns
        if (this.meatKeywords.some(keyword => lowerName.includes(keyword))) {
            return 'בשר'; // Generic meat
        }

        return null;
    }

    /**
     * Detect quality grade
     */
    detectQualityGrade(name) {
        if (!name) return 'standard';

        const lowerName = name.toLowerCase();

        for (const [grade, keywords] of Object.entries(this.qualityGrades)) {
            if (grade === 'kosher_levels') continue; // Handle separately
            
            if (keywords.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
                return grade;
            }
        }

        return 'standard';
    }

    /**
     * Detect brand name
     */
    detectBrand(name) {
        if (!name) return null;

        for (const brand of this.brandNames) {
            if (name.includes(brand)) {
                return brand;
            }
        }

        return null;
    }

    /**
     * Detect meat cut
     */
    detectCut(name) {
        if (!name) return null;

        const lowerName = name.toLowerCase();

        for (const [category, cuts] of Object.entries(this.cutHierarchy)) {
            for (const cut of cuts) {
                if (lowerName.includes(cut)) {
                    return {
                        name: cut,
                        category: category
                    };
                }
            }
        }

        return null;
    }

    /**
     * Extract unit information
     */
    extractUnit(name) {
        if (!name) return null;

        for (const [unit, pattern] of Object.entries(this.unitPatterns)) {
            const match = pattern.exec(name);
            if (match) {
                return {
                    type: unit,
                    amount: parseFloat(match[1]),
                    text: match[0]
                };
            }
        }

        return null;
    }

    /**
     * Calculate price per kg from Hebrew price text
     */
    calculatePricePerKg(priceText, productName = '') {
        if (!priceText) return null;

        try {
            // Extract numeric price
            const priceMatch = priceText.match(/(\d+\.?\d*)/);
            if (!priceMatch) return null;

            const price = parseFloat(priceMatch[1]);
            
            // Check if already per kg
            if (priceText.includes('ק"ג') || priceText.includes('קג')) {
                return price;
            }

            // Extract unit from product name or price text
            const unit = this.extractUnit(productName) || this.extractUnit(priceText);
            
            if (unit) {
                switch (unit.type) {
                    case 'kg':
                        return price / unit.amount;
                    case 'gram':
                        return (price / unit.amount) * 1000;
                    case 'piece':
                        // Estimate average piece weight for common cuts
                        const estimatedWeight = this.estimatePieceWeight(productName);
                        return estimatedWeight ? (price / estimatedWeight) : null;
                    default:
                        return null;
                }
            }

            // If no unit found, assume price is per unit item
            return null;
        } catch (error) {
            console.error('Price calculation error:', error.message);
            return null;
        }
    }

    /**
     * Estimate piece weight for price calculation
     */
    estimatePieceWeight(productName) {
        if (!productName) return null;

        const lowerName = productName.toLowerCase();
        
        // Average weights in kg for common cuts
        const weightEstimates = {
            'שניצל': 0.15,   // 150g per schnitzel
            'סטייק': 0.25,   // 250g per steak
            'חזה': 0.4,      // 400g per breast
            'ירך': 1.5,      // 1.5kg per thigh
            'כנף': 0.1       // 100g per wing
        };

        for (const [cut, weight] of Object.entries(weightEstimates)) {
            if (lowerName.includes(cut)) {
                return weight;
            }
        }

        return null;
    }

    /**
     * Calculate confidence score
     */
    calculateConfidence(product) {
        let confidence = 0;
        const processed = product.processed;

        // Hebrew text detection
        if (processed.isHebrew) confidence += 0.2;

        // Meat type detection
        if (processed.detectedMeat) confidence += 0.25;

        // Brand detection
        if (processed.brand) confidence += 0.15;

        // Cut detection
        if (processed.cut) confidence += 0.2;

        // Price per kg calculation
        if (processed.pricePerKg) confidence += 0.15;

        // Quality grade detection
        if (processed.qualityGrade !== 'standard') confidence += 0.05;

        return Math.min(confidence, 1.0);
    }

    /**
     * Check if text contains Hebrew characters
     */
    isHebrewText(text) {
        if (!text) return false;
        return /[\u0590-\u05FF]/.test(text);
    }

    /**
     * Categorize product
     */
    categorizeProduct(product) {
        const processed = product.processed;

        if (!processed.detectedMeat) {
            return 'unknown';
        }

        if (processed.cut && processed.cut.category) {
            return `${processed.detectedMeat}_${processed.cut.category}`;
        }

        return processed.detectedMeat;
    }

    /**
     * Filter products by confidence threshold
     */
    filterByConfidence(products, minConfidence = 0.6) {
        return products.filter(product => 
            product.processed && product.processed.confidence >= minConfidence
        );
    }

    /**
     * Sort products by relevance
     */
    sortByRelevance(products) {
        return products.sort((a, b) => {
            const aScore = (a.processed?.confidence || 0) * 
                          (a.processed?.pricePerKg ? 1.2 : 1) *
                          (a.processed?.brand ? 1.1 : 1);
            
            const bScore = (b.processed?.confidence || 0) * 
                          (b.processed?.pricePerKg ? 1.2 : 1) *
                          (b.processed?.brand ? 1.1 : 1);
            
            return bScore - aScore;
        });
    }

    /**
     * Generate processing report
     */
    generateReport(products) {
        const processed = products.map(p => this.processProduct(p));
        const highConfidence = this.filterByConfidence(processed, 0.7);
        
        return {
            total: processed.length,
            highConfidence: highConfidence.length,
            averageConfidence: processed.reduce((sum, p) => 
                sum + (p.processed?.confidence || 0), 0) / processed.length,
            meatTypes: [...new Set(processed.map(p => 
                p.processed?.detectedMeat).filter(Boolean))],
            brands: [...new Set(processed.map(p => 
                p.processed?.brand).filter(Boolean))],
            priceRange: this.calculatePriceRange(highConfidence)
        };
    }

    /**
     * Calculate price range
     */
    calculatePriceRange(products) {
        const prices = products
            .map(p => p.processed?.pricePerKg)
            .filter(price => price && price > 0);

        if (prices.length === 0) return null;

        return {
            min: Math.min(...prices),
            max: Math.max(...prices),
            average: prices.reduce((sum, price) => sum + price, 0) / prices.length
        };
    }
}

export default HebrewProductProcessor;