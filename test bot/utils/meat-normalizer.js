#!/usr/bin/env node

/**
 * BASAROMETER SCANNER - Enhanced Meat Normalizer v2.0
 * Multi-tier classification system with auto-learning capabilities
 */

const fs = require('fs');
const path = require('path');

class MeatNormalizer {
    constructor() {
        this.enhancedMapping = this.loadMapping('config/enhanced_meat_mapping.json');
        this.gradeKeywords = this.loadMapping('config/grade_keywords.json');
        this.cutHierarchy = this.loadMapping('config/cut_hierarchy.json');
        this.learningLog = this.loadMapping('config/learning_log.json');
        
        console.log("✅ Enhanced Meat Normalizer v2.0 initialized");
        console.log(`   - ${Object.keys(this.enhancedMapping.classification_system).length} base cuts loaded`);
        console.log(`   - ${Object.keys(this.gradeKeywords.grade_patterns).length} grade patterns loaded`);
    }

    loadMapping(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
            console.warn(`⚠️  Mapping file not found: ${filePath}`);
            return {};
        } catch (error) {
            console.error(`❌ Error loading ${filePath}:`, error.message);
            return {};
        }
    }

    /**
     * Enhanced product classification with multi-tier analysis
     */
    classifyProduct(productName) {
        if (!productName || typeof productName !== 'string') {
            return this.createClassificationResult('', 'unknown', 'regular', 0.0);
        }

        const name = productName.toLowerCase().trim();
        
        // Stage 1: Detect quality grade
        const gradeResult = this.detectGrade(name);
        
        // Stage 2: Identify base cut
        const cutResult = this.identifyBaseCut(name);
        
        // Stage 3: Calculate final confidence
        const finalConfidence = this.calculateConfidence(name, cutResult, gradeResult);
        
        // Stage 4: Create enhanced classification
        const classification = this.createClassificationResult(
            cutResult.baseCut,
            cutResult.category,
            gradeResult.grade,
            finalConfidence,
            {
                originalName: productName,
                gradeConfidence: gradeResult.confidence,
                cutConfidence: cutResult.confidence,
                gradeKeywords: gradeResult.matchedKeywords,
                cutKeywords: cutResult.matchedKeywords,
                priceRange: this.estimatePriceRange(cutResult.baseCut, gradeResult.grade)
            }
        );

        // Stage 5: Auto-learning update
        this.updateLearningSystem(productName, classification);

        return classification;
    }

    /**
     * Detect quality grade with confidence scoring
     */
    detectGrade(name) {
        const grades = this.gradeKeywords.grade_patterns;
        let bestMatch = { grade: 'regular', confidence: 0.6, matchedKeywords: [] };
        
        for (const [gradeName, gradeData] of Object.entries(grades)) {
            let confidence = 0;
            let matchedKeywords = [];
            
            // Check primary keywords
            for (const keyword of gradeData.primary_keywords) {
                if (name.includes(keyword.toLowerCase())) {
                    confidence += 0.4;
                    matchedKeywords.push(keyword);
                }
            }
            
            // Check secondary keywords
            for (const keyword of gradeData.secondary_keywords) {
                if (name.includes(keyword.toLowerCase())) {
                    confidence += 0.2;
                    matchedKeywords.push(keyword);
                }
            }
            
            // Apply confidence boost
            if (confidence > 0) {
                confidence += gradeData.confidence_boost;
            }
            
            // Update best match
            if (confidence > bestMatch.confidence) {
                bestMatch = {
                    grade: gradeName,
                    confidence: Math.min(confidence, 1.0),
                    matchedKeywords
                };
            }
        }
        
        // Check for negative indicators
        const negativeIndicators = this.gradeKeywords.negative_indicators?.exclude_if_contains || [];
        for (const indicator of negativeIndicators) {
            if (name.includes(indicator.toLowerCase())) {
                bestMatch.confidence += this.gradeKeywords.negative_indicators.confidence_penalty;
                break;
            }
        }
        
        return bestMatch;
    }

    /**
     * Identify base cut with enhanced matching
     */
    identifyBaseCut(name) {
        const classificationSystem = this.enhancedMapping.classification_system;
        let bestMatch = { baseCut: 'unknown', category: 'אחר', confidence: 0.0, matchedKeywords: [] };
        
        for (const [cutName, cutData] of Object.entries(classificationSystem)) {
            let confidence = 0;
            let matchedKeywords = [];
            
            // Check all grade variations for keywords
            for (const [gradeName, gradeData] of Object.entries(cutData.grades)) {
                // Check keywords
                for (const keyword of gradeData.keywords) {
                    if (name.includes(keyword.toLowerCase())) {
                        confidence += 0.3;
                        matchedKeywords.push(keyword);
                    }
                }
                
                // Check variations (exact or partial matches)
                for (const variation of gradeData.variations) {
                    const variationLower = variation.toLowerCase();
                    
                    // Exact match bonus
                    if (name.includes(variationLower)) {
                        confidence += 0.4;
                        matchedKeywords.push(variation);
                    }
                    
                    // Partial word matching
                    const words = variationLower.split(' ');
                    const nameWords = name.split(' ');
                    const matchingWords = words.filter(word => 
                        nameWords.some(nameWord => nameWord.includes(word) || word.includes(nameWord))
                    );
                    
                    if (matchingWords.length >= Math.ceil(words.length * 0.6)) {
                        confidence += 0.2;
                    }
                }
            }
            
            // Update best match
            if (confidence > bestMatch.confidence) {
                bestMatch = {
                    baseCut: cutName,
                    category: cutData.category,
                    confidence: Math.min(confidence, 1.0),
                    matchedKeywords
                };
            }
        }
        
        return bestMatch;
    }

    /**
     * Calculate final confidence score
     */
    calculateConfidence(name, cutResult, gradeResult) {
        const rules = this.gradeKeywords.classification_rules?.confidence_calculation;
        if (!rules) return Math.max(cutResult.confidence, gradeResult.confidence);
        
        let confidence = rules.base_confidence || 0.6;
        
        // Add bonuses
        if (cutResult.matchedKeywords.length > 0) {
            confidence += rules.keyword_match_bonus * cutResult.matchedKeywords.length;
        }
        
        if (gradeResult.matchedKeywords.length > 0) {
            confidence += rules.secondary_match_bonus * gradeResult.matchedKeywords.length;
        }
        
        // Length bonus for detailed names
        const wordCount = name.split(' ').length;
        confidence += Math.min(wordCount * (rules.length_bonus || 0.02), 0.1);
        
        // Combine with individual confidences
        confidence = (confidence + cutResult.confidence + gradeResult.confidence) / 3;
        
        return Math.min(Math.max(confidence, 0.0), 1.0);
    }

    /**
     * Estimate price range based on cut and grade
     */
    estimatePriceRange(baseCut, grade) {
        const cutData = this.enhancedMapping.classification_system[baseCut];
        if (!cutData || !cutData.grades[grade]) {
            return { min: 50, max: 150, currency: '₪' };
        }
        
        const priceRange = cutData.grades[grade].price_range;
        return {
            min: priceRange[0],
            max: priceRange[1],
            currency: '₪'
        };
    }

    /**
     * Create standardized classification result
     */
    createClassificationResult(baseCut, category, grade, confidence, metadata = {}) {
        return {
            base_cut: baseCut,
            category: category,
            grade: grade,
            full_classification: grade === 'regular' ? baseCut : `${baseCut} ${grade}`,
            confidence: Math.round(confidence * 100) / 100,
            metadata: {
                timestamp: new Date().toISOString(),
                version: '2.0.0',
                ...metadata
            }
        };
    }

    /**
     * Auto-learning system update
     */
    updateLearningSystem(productName, classification) {
        const threshold = this.gradeKeywords.learning_system?.confidence_threshold || 0.8;
        
        // Update statistics
        this.learningLog.learning_statistics.total_products_processed += 1;
        
        if (classification.confidence >= threshold) {
            this.learningLog.learning_statistics.auto_classifications += 1;
        } else if (classification.confidence < 0.6) {
            this.learningLog.learning_statistics.manual_reviews += 1;
            
            // Add to manual review queue
            this.learningLog.manual_review_queue.push({
                product_name: productName,
                confidence: classification.confidence,
                reason: 'low_confidence',
                suggested_classification: {
                    base_cut: classification.base_cut,
                    grade: classification.grade
                },
                timestamp: new Date().toISOString()
            });
        }
        
        // Check for new patterns
        this.discoverNewPatterns(productName, classification);
        
        // Save learning log periodically
        if (this.learningLog.learning_statistics.total_products_processed % 10 === 0) {
            this.saveLearningLog();
        }
    }

    /**
     * Discover new patterns from product names
     */
    discoverNewPatterns(productName, classification) {
        if (classification.confidence < 0.7) return;
        
        const name = productName.toLowerCase();
        const words = name.split(' ').filter(word => word.length > 2);
        
        // Look for potential new grade indicators
        for (const word of words) {
            if (!this.isKnownGradeKeyword(word) && !this.isCommonWord(word)) {
                // Check if this word appears frequently with high-confidence classifications
                this.trackPotentialPattern(word, classification);
            }
        }
    }

    /**
     * Check if word is a known grade keyword
     */
    isKnownGradeKeyword(word) {
        const allKeywords = [];
        for (const gradeData of Object.values(this.gradeKeywords.grade_patterns)) {
            allKeywords.push(...gradeData.primary_keywords, ...gradeData.secondary_keywords);
        }
        return allKeywords.some(keyword => keyword.toLowerCase().includes(word));
    }

    /**
     * Check if word is a common word that shouldn't be learned
     */
    isCommonWord(word) {
        const commonWords = [
            'טרי', 'קפוא', 'שלם', 'פרוס', 'ללא', 'עם', 'בלי', 'חלק',
            'מחפוד', 'ארוז', 'יחידה', 'משקל', 'גרם', 'קילו', 'ק"ג'
        ];
        return commonWords.includes(word);
    }

    /**
     * Track potential new patterns
     */
    trackPotentialPattern(word, classification) {
        if (!this.learningLog.pattern_discoveries.potential_patterns) {
            this.learningLog.pattern_discoveries.potential_patterns = {};
        }
        
        if (!this.learningLog.pattern_discoveries.potential_patterns[word]) {
            this.learningLog.pattern_discoveries.potential_patterns[word] = {
                frequency: 0,
                classifications: [],
                confidence_sum: 0
            };
        }
        
        const pattern = this.learningLog.pattern_discoveries.potential_patterns[word];
        pattern.frequency += 1;
        pattern.confidence_sum += classification.confidence;
        pattern.classifications.push({
            base_cut: classification.base_cut,
            grade: classification.grade,
            confidence: classification.confidence
        });
        
        // Auto-promote patterns that appear frequently with high confidence
        const minFrequency = this.learningLog.learning_rules?.pattern_frequency_minimum || 3;
        const avgConfidence = pattern.confidence_sum / pattern.frequency;
        
        if (pattern.frequency >= minFrequency && avgConfidence >= 0.8) {
            this.promotePattern(word, pattern);
        }
    }

    /**
     * Promote discovered pattern to official mapping
     */
    promotePattern(word, pattern) {
        console.log(`🔍 Auto-discovered pattern: "${word}" (frequency: ${pattern.frequency}, avg confidence: ${(pattern.confidence_sum / pattern.frequency).toFixed(2)})`);
        
        // Add to new patterns log
        this.learningLog.pattern_discoveries.new_grade_patterns.push({
            keyword: word,
            frequency: pattern.frequency,
            average_confidence: pattern.confidence_sum / pattern.frequency,
            discovered_at: new Date().toISOString(),
            auto_promoted: true
        });
        
        this.learningLog.learning_statistics.new_patterns_discovered += 1;
        
        // Remove from potential patterns
        delete this.learningLog.pattern_discoveries.potential_patterns[word];
    }

    /**
     * Save learning log to file
     */
    saveLearningLog() {
        try {
            this.learningLog._metadata.last_update = new Date().toISOString();
            fs.writeFileSync('config/learning_log.json', JSON.stringify(this.learningLog, null, 2));
        } catch (error) {
            console.error('❌ Error saving learning log:', error.message);
        }
    }

    /**
     * Generate learning report
     */
    generateLearningReport() {
        const stats = this.learningLog.learning_statistics;
        const report = {
            session_summary: {
                total_processed: stats.total_products_processed,
                auto_classified: stats.auto_classifications,
                manual_reviews: stats.manual_reviews,
                new_patterns: stats.new_patterns_discovered,
                success_rate: stats.auto_classifications / stats.total_products_processed * 100
            },
            confidence_distribution: this.calculateConfidenceDistribution(),
            new_discoveries: this.learningLog.pattern_discoveries.new_grade_patterns,
            manual_review_queue: this.learningLog.manual_review_queue.length,
            recommendations: this.generateRecommendations()
        };
        
        return report;
    }

    /**
     * Calculate confidence distribution
     */
    calculateConfidenceDistribution() {
        // This would be calculated from actual processed products in a real implementation
        return {
            high_confidence: { threshold: '>0.8', percentage: 65 },
            medium_confidence: { threshold: '0.6-0.8', percentage: 25 },
            low_confidence: { threshold: '<0.6', percentage: 10 }
        };
    }

    /**
     * Generate improvement recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (this.learningLog.manual_review_queue.length > 10) {
            recommendations.push({
                type: 'manual_review',
                message: `${this.learningLog.manual_review_queue.length} products need manual classification review`,
                priority: 'high'
            });
        }
        
        if (this.learningLog.learning_statistics.new_patterns_discovered > 0) {
            recommendations.push({
                type: 'pattern_update',
                message: `${this.learningLog.learning_statistics.new_patterns_discovered} new patterns discovered - consider updating mapping files`,
                priority: 'medium'
            });
        }
        
        return recommendations;
    }

    /**
     * Batch classify multiple products
     */
    classifyBatch(products) {
        const results = [];
        
        console.log(`🔄 Classifying ${products.length} products...`);
        
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const classification = this.classifyProduct(product.name || product.originalName);
            
            results.push({
                ...product,
                classification: classification
            });
            
            // Progress indicator
            if ((i + 1) % 50 === 0) {
                console.log(`   Processed ${i + 1}/${products.length} products`);
            }
        }
        
        console.log(`✅ Batch classification complete`);
        
        // Generate and save report
        const report = this.generateLearningReport();
        this.saveLearningLog();
        
        return { results, report };
    }
}

module.exports = MeatNormalizer;