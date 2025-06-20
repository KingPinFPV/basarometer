#!/usr/bin/env node

/**
 * BASAROMETER SCANNER - Confidence Scoring System
 * Advanced confidence calculation for classification accuracy
 */

class ConfidenceScorer {
    constructor() {
        this.weights = {
            exact_match: 0.4,
            partial_match: 0.2,
            keyword_match: 0.15,
            grade_match: 0.15,
            context_match: 0.1,
            length_bonus: 0.05,
            negative_penalty: -0.3
        };
        
        this.thresholds = {
            high_confidence: 0.8,
            medium_confidence: 0.6,
            low_confidence: 0.4,
            reject_threshold: 0.2
        };
    }

    /**
     * Calculate comprehensive confidence score
     */
    calculateConfidence(productName, classification, matchDetails) {
        if (!productName || !classification) {
            return 0.0;
        }

        let confidence = 0.0;
        const name = productName.toLowerCase().trim();
        
        // Base confidence from classification strength
        confidence += this.calculateBaseConfidence(classification);
        
        // Match quality scoring
        confidence += this.scoreMatchQuality(name, matchDetails);
        
        // Grade detection confidence
        confidence += this.scoreGradeConfidence(name, classification.grade, matchDetails);
        
        // Context and structure scoring
        confidence += this.scoreContextualFactors(name, classification);
        
        // Apply penalties for negative indicators
        confidence += this.applyNegativePenalties(name);
        
        // Length and complexity bonus
        confidence += this.calculateLengthBonus(name);
        
        // Normalize to 0-1 range
        confidence = Math.max(0.0, Math.min(1.0, confidence));
        
        return Math.round(confidence * 100) / 100;
    }

    /**
     * Calculate base confidence from classification strength
     */
    calculateBaseConfidence(classification) {
        let baseConfidence = 0.5; // Start with neutral confidence
        
        // Check for government XML data confidence boost
        if (classification.source === 'government_xml' || classification.confidence_base) {
            baseConfidence = Math.max(baseConfidence, classification.confidence_base || 0.8);
        }
        
        // Strong base cut identification
        if (classification.base_cut && classification.base_cut !== 'unknown') {
            baseConfidence += 0.2;
        }
        
        // Category identification
        if (classification.category && classification.category !== 'אחר') {
            baseConfidence += 0.1;
        }
        
        // Grade identification (beyond regular)
        if (classification.grade && classification.grade !== 'regular') {
            baseConfidence += 0.15;
        }
        
        // Additional data quality indicators
        if (classification.weight_info) {
            baseConfidence += 0.05;
        }
        
        if (classification.freshness) {
            baseConfidence += 0.03;
        }
        
        if (classification.preparation) {
            baseConfidence += 0.02;
        }
        
        return Math.min(baseConfidence, 1.0); // Cap at 1.0
    }

    /**
     * Score match quality based on keyword matches
     */
    scoreMatchQuality(name, matchDetails) {
        let score = 0.0;
        
        if (!matchDetails) return score;
        
        // Exact matches are most valuable
        if (matchDetails.exactMatches && matchDetails.exactMatches > 0) {
            score += this.weights.exact_match * Math.min(matchDetails.exactMatches / 3, 1.0);
        }
        
        // Partial matches are somewhat valuable
        if (matchDetails.partialMatches && matchDetails.partialMatches > 0) {
            score += this.weights.partial_match * Math.min(matchDetails.partialMatches / 5, 1.0);
        }
        
        // Keyword matches
        if (matchDetails.keywordMatches && matchDetails.keywordMatches > 0) {
            score += this.weights.keyword_match * Math.min(matchDetails.keywordMatches / 4, 1.0);
        }
        
        return score;
    }

    /**
     * Score grade detection confidence
     */
    scoreGradeConfidence(name, grade, matchDetails) {
        let score = 0.0;
        
        if (!grade || grade === 'regular') {
            return 0.05; // Small bonus for successful regular classification
        }
        
        // Premium grade indicators
        const gradePatterns = {
            'angus': ['אנגוס', 'angus', 'בלאק', 'black'],
            'wagyu': ['וואגיו', 'wagyu', 'ואגיו', 'ווגיו'],
            'veal': ['עגלה', 'עגל', 'מבכירה', 'calf'],
            'premium': ['פרימיום', 'premium', 'מיושן', 'aged', 'מובחר'],
            'organic': ['אורגני', 'organic', 'טבעי', 'natural']
        };
        
        const patterns = gradePatterns[grade] || [];
        const matchCount = patterns.filter(pattern => name.includes(pattern.toLowerCase())).length;
        
        if (matchCount > 0) {
            score += this.weights.grade_match * Math.min(matchCount / 2, 1.0);
        }
        
        // Grade-specific confidence adjustments
        switch (grade) {
            case 'wagyu':
                score += 0.1; // Wagyu is very distinctive
                break;
            case 'angus':
                score += 0.08; // Angus is quite distinctive
                break;
            case 'premium':
                score += 0.05; // Premium is somewhat distinctive
                break;
            case 'veal':
                score += 0.06; // Veal is fairly distinctive
                break;
        }
        
        return score;
    }

    /**
     * Score contextual factors
     */
    scoreContextualFactors(name, classification) {
        let score = 0.0;
        
        // Brand recognition adds confidence
        if (this.hasBrandIndicators(name)) {
            score += 0.05;
        }
        
        // Weight/unit information adds confidence
        if (this.hasWeightIndicators(name)) {
            score += 0.04;
        }
        
        // Price/currency information
        if (this.hasPriceIndicators(name)) {
            score += 0.03;
        }
        
        // Cooking method indicators
        if (this.hasCookingMethodIndicators(name)) {
            score += 0.03;
        }
        
        // Freshness indicators
        if (this.hasFreshnessIndicators(name)) {
            score += 0.02;
        }
        
        return score;
    }

    /**
     * Apply penalties for negative indicators
     */
    applyNegativePenalties(name) {
        let penalty = 0.0;
        
        // Non-meat indicators
        const nonMeatWords = [
            'לבן', 'חלב', 'גבינה', 'יוגורט', 'קרם',
            'לחם', 'עוגה', 'ביסקוויט', 'שוקולד',
            'ירקות', 'פירות', 'סלט', 'מרק'
        ];
        
        for (const word of nonMeatWords) {
            if (name.includes(word)) {
                penalty += this.weights.negative_penalty;
                break; // Only apply penalty once
            }
        }
        
        // Unclear/ambiguous terms
        const ambiguousWords = ['מוצר', 'דבר', 'משהו', 'פריט'];
        for (const word of ambiguousWords) {
            if (name.includes(word)) {
                penalty -= 0.1;
                break;
            }
        }
        
        // Very short names (likely incomplete data)
        if (name.length < 8) {
            penalty -= 0.15;
        }
        
        // Very long names (likely confused/merged data)
        if (name.length > 100) {
            penalty -= 0.1;
        }
        
        return penalty;
    }

    /**
     * Calculate length bonus
     */
    calculateLengthBonus(name) {
        const words = name.split(/\s+/).filter(word => word.length > 2);
        const wordCount = words.length;
        
        // Optimal length is 3-6 meaningful words
        if (wordCount >= 3 && wordCount <= 6) {
            return this.weights.length_bonus;
        } else if (wordCount >= 2 && wordCount <= 8) {
            return this.weights.length_bonus * 0.5;
        }
        
        return 0.0;
    }

    /**
     * Check for brand indicators
     */
    hasBrandIndicators(name) {
        const brandIndicators = [
            'מחפוד', 'לה מרשה', 'טיבון', 'שגב', 'עוף טוב',
            'רמי לוי', 'קרפור', 'שופרסל', 'ויקטורי',
            'מהדרין', 'בד"צ', 'כשר', 'חלק'
        ];
        
        return brandIndicators.some(brand => name.includes(brand));
    }

    /**
     * Check for weight indicators
     */
    hasWeightIndicators(name) {
        const weightPatterns = [
            /\d+\s*גר/, /\d+\s*גרם/, /\d+\s*ק["']ג/, /\d+\s*קילו/,
            /\d+\s*מ["']ל/, /\d+\s*ליטר/, /\d+\s*יח/
        ];
        
        return weightPatterns.some(pattern => pattern.test(name));
    }

    /**
     * Check for price indicators
     */
    hasPriceIndicators(name) {
        const pricePatterns = [
            /\d+\s*ש["']ח/, /\d+\s*שקל/, /\d+\s*₪/, /במחיר/, /מבצע/
        ];
        
        return pricePatterns.some(pattern => pattern.test(name));
    }

    /**
     * Check for cooking method indicators
     */
    hasCookingMethodIndicators(name) {
        const cookingMethods = [
            'גריל', 'צלוי', 'מטוגן', 'בתנור', 'מבושל',
            'למחבת', 'לגריל', 'לתנור', 'לצלייה'
        ];
        
        return cookingMethods.some(method => name.includes(method));
    }

    /**
     * Check for freshness indicators
     */
    hasFreshnessIndicators(name) {
        const freshnessTerms = [
            'טרי', 'קפוא', 'מיוחד', 'איכותי', 'מעולה',
            'ללא עצם', 'עם עצם', 'נקי', 'מנוקה'
        ];
        
        return freshnessTerms.some(term => name.includes(term));
    }

    /**
     * Classify confidence level
     */
    classifyConfidenceLevel(confidence) {
        if (confidence >= this.thresholds.high_confidence) {
            return {
                level: 'high',
                description: 'High confidence - automatic classification',
                action: 'auto_accept'
            };
        } else if (confidence >= this.thresholds.medium_confidence) {
            return {
                level: 'medium',
                description: 'Medium confidence - likely correct',
                action: 'accept_with_monitoring'
            };
        } else if (confidence >= this.thresholds.low_confidence) {
            return {
                level: 'low',
                description: 'Low confidence - manual review recommended',
                action: 'manual_review'
            };
        } else {
            return {
                level: 'very_low',
                description: 'Very low confidence - likely incorrect',
                action: 'reject'
            };
        }
    }

    /**
     * Generate confidence explanation
     */
    explainConfidence(productName, classification, confidence) {
        const level = this.classifyConfidenceLevel(confidence);
        const factors = this.analyzeConfidenceFactors(productName, classification);
        
        return {
            confidence_score: confidence,
            confidence_level: level,
            contributing_factors: factors.positive,
            detracting_factors: factors.negative,
            recommendations: this.generateConfidenceRecommendations(level, factors)
        };
    }

    /**
     * Analyze confidence factors
     */
    analyzeConfidenceFactors(productName, classification) {
        const name = productName.toLowerCase();
        const positive = [];
        const negative = [];
        
        // Positive factors
        if (classification.base_cut && classification.base_cut !== 'unknown') {
            positive.push('Clear base cut identification');
        }
        
        if (classification.grade && classification.grade !== 'regular') {
            positive.push(`Grade identified: ${classification.grade}`);
        }
        
        if (this.hasBrandIndicators(name)) {
            positive.push('Brand indicators present');
        }
        
        if (this.hasWeightIndicators(name)) {
            positive.push('Weight/unit information');
        }
        
        // Negative factors
        if (name.length < 8) {
            negative.push('Very short product name');
        }
        
        if (name.length > 100) {
            negative.push('Excessively long product name');
        }
        
        if (classification.base_cut === 'unknown') {
            negative.push('Unknown base cut');
        }
        
        if (classification.category === 'אחר') {
            negative.push('Unclear category classification');
        }
        
        return { positive, negative };
    }

    /**
     * Generate confidence improvement recommendations
     */
    generateConfidenceRecommendations(level, factors) {
        const recommendations = [];
        
        if (level.level === 'low' || level.level === 'very_low') {
            recommendations.push('Manual review and classification required');
            
            if (factors.negative.includes('Unknown base cut')) {
                recommendations.push('Add product variation to mapping files');
            }
            
            if (factors.negative.includes('Very short product name')) {
                recommendations.push('Check for incomplete product data');
            }
            
            if (factors.negative.includes('Unclear category classification')) {
                recommendations.push('Improve category detection keywords');
            }
        }
        
        if (level.level === 'medium') {
            recommendations.push('Monitor classification accuracy');
            recommendations.push('Consider adding to training data');
        }
        
        if (level.level === 'high') {
            recommendations.push('Use for auto-learning pattern discovery');
        }
        
        return recommendations;
    }

    /**
     * Batch confidence scoring
     */
    scoreConfidenceBatch(products) {
        const results = [];
        const stats = {
            high_confidence: 0,
            medium_confidence: 0,
            low_confidence: 0,
            very_low_confidence: 0
        };
        
        for (const product of products) {
            const confidence = this.calculateConfidence(
                product.name || product.originalName,
                product.classification,
                product.matchDetails
            );
            
            const level = this.classifyConfidenceLevel(confidence);
            
            results.push({
                ...product,
                confidence_score: confidence,
                confidence_level: level,
                needs_review: level.action === 'manual_review' || level.action === 'reject'
            });
            
            // Update stats
            if (level.level === 'high') stats.high_confidence++;
            else if (level.level === 'medium') stats.medium_confidence++;
            else if (level.level === 'low') stats.low_confidence++;
            else stats.very_low_confidence++;
        }
        
        return {
            results,
            statistics: {
                total_products: products.length,
                confidence_distribution: stats,
                percentage_high: Math.round((stats.high_confidence / products.length) * 100),
                percentage_needs_review: Math.round(((stats.low_confidence + stats.very_low_confidence) / products.length) * 100)
            }
        };
    }
}

export default ConfidenceScorer;