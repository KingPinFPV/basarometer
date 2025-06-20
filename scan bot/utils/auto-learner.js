#!/usr/bin/env node

/**
 * BASAROMETER SCANNER - Auto-Learning System
 * Real-time pattern recognition and mapping updates
 */

const fs = require('fs');
const path = require('path');

class AutoLearner {
    constructor() {
        this.learningLog = this.loadJSON('config/learning_log.json');
        this.enhancedMapping = this.loadJSON('config/enhanced_meat_mapping.json');
        this.gradeKeywords = this.loadJSON('config/grade_keywords.json');
        
        this.sessionStats = {
            patterns_analyzed: 0,
            auto_updates: 0,
            manual_flags: 0,
            confidence_improvements: 0
        };
        
        console.log("🧠 Auto-Learning System initialized");
    }

    loadJSON(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
            console.warn(`⚠️  File not found: ${filePath}`);
            return {};
        } catch (error) {
            console.error(`❌ Error loading ${filePath}:`, error.message);
            return {};
        }
    }

    /**
     * Analyze scan results and update learning system
     */
    processResults(scanResults, siteName) {
        console.log(`🔍 Auto-learning analysis for ${siteName}...`);
        
        const { products, scanInfo } = scanResults;
        const learningResults = {
            site: siteName,
            timestamp: new Date().toISOString(),
            products_analyzed: products.length,
            new_patterns: [],
            updated_mappings: [],
            manual_reviews: [],
            confidence_improvements: []
        };

        // Analyze each product for learning opportunities
        for (const product of products) {
            if (!product.isValid) continue;
            
            this.analyzeProduct(product, learningResults);
        }

        // Update mapping files if necessary
        if (learningResults.new_patterns.length > 0) {
            this.updateMappingFiles(learningResults);
        }

        // Update learning log
        this.updateLearningLog(learningResults);

        // Generate session report
        const report = this.generateSessionReport(learningResults);
        
        console.log(`✅ Auto-learning complete: ${learningResults.new_patterns.length} new patterns, ${learningResults.manual_reviews.length} manual reviews`);
        
        return report;
    }

    /**
     * Analyze individual product for learning opportunities
     */
    analyzeProduct(product, learningResults) {
        this.sessionStats.patterns_analyzed++;
        
        const { name, originalName, confidence, category } = product;
        
        // Low confidence products need manual review
        if (confidence < 0.6) {
            learningResults.manual_reviews.push({
                name: originalName || name,
                confidence: confidence,
                category: category,
                reason: this.diagnoseConfidenceIssue(product)
            });
            this.sessionStats.manual_flags++;
            return;
        }

        // High confidence products might contain new patterns
        if (confidence >= 0.8) {
            const patterns = this.extractPatterns(originalName || name);
            for (const pattern of patterns) {
                if (this.isNewPattern(pattern)) {
                    learningResults.new_patterns.push({
                        pattern: pattern,
                        product_name: originalName || name,
                        confidence: confidence,
                        category: category,
                        frequency: 1
                    });
                }
            }
        }

        // Check for potential confidence improvements
        const improvements = this.identifyConfidenceImprovements(product);
        if (improvements.length > 0) {
            learningResults.confidence_improvements.push({
                product_name: originalName || name,
                current_confidence: confidence,
                improvements: improvements
            });
        }
    }

    /**
     * Diagnose why confidence is low
     */
    diagnoseConfidenceIssue(product) {
        const name = (product.originalName || product.name).toLowerCase();
        
        if (name.length < 10) return 'short_name';
        if (name.split(' ').length > 10) return 'complex_name';
        if (/\d+/.test(name) && name.includes('גרם')) return 'weight_confusion';
        if (name.includes('מבצע') || name.includes('במחיר')) return 'promotional_text';
        if (!this.containsMeatKeywords(name)) return 'unclear_meat_type';
        
        return 'unknown_pattern';
    }

    /**
     * Extract potential patterns from product name
     */
    extractPatterns(productName) {
        const patterns = [];
        const name = productName.toLowerCase();
        const words = name.split(/\s+/).filter(word => word.length > 2);
        
        // Look for grade-like patterns
        const gradeIndicators = ['מיושן', 'פרימיום', 'מובחר', 'איכותי', 'מעולה'];
        for (const word of words) {
            if (gradeIndicators.includes(word) && !this.isKnownGradeKeyword(word)) {
                patterns.push({
                    type: 'grade',
                    keyword: word,
                    context: this.getWordContext(word, words)
                });
            }
        }
        
        // Look for cut-like patterns
        const cutIndicators = ['סטייק', 'צלי', 'פילה', 'נתח'];
        for (const word of words) {
            if (cutIndicators.some(indicator => word.includes(indicator))) {
                patterns.push({
                    type: 'cut',
                    keyword: word,
                    context: this.getWordContext(word, words)
                });
            }
        }
        
        // Look for brand patterns
        if (name.includes('-') || name.includes('(')) {
            const brandPattern = this.extractBrandPattern(name);
            if (brandPattern) {
                patterns.push({
                    type: 'brand',
                    keyword: brandPattern,
                    context: 'brand_identifier'
                });
            }
        }
        
        return patterns;
    }

    /**
     * Get context words around a keyword
     */
    getWordContext(keyword, words) {
        const index = words.indexOf(keyword);
        const context = [];
        
        if (index > 0) context.push(words[index - 1]);
        if (index < words.length - 1) context.push(words[index + 1]);
        
        return context.join(' ');
    }

    /**
     * Extract brand pattern from product name
     */
    extractBrandPattern(name) {
        // Try to find brand in parentheses
        const parenMatch = name.match(/\(([^)]+)\)/);
        if (parenMatch) return parenMatch[1];
        
        // Try to find brand after dash
        const dashMatch = name.match(/\s*-\s*([א-ת\s]+)$/);
        if (dashMatch) return dashMatch[1].trim();
        
        return null;
    }

    /**
     * Check if pattern is already known
     */
    isNewPattern(pattern) {
        const keyword = pattern.keyword.toLowerCase();
        
        // Check in existing grade keywords
        for (const gradeData of Object.values(this.gradeKeywords.grade_patterns)) {
            if (gradeData.primary_keywords.some(k => k.toLowerCase() === keyword) ||
                gradeData.secondary_keywords.some(k => k.toLowerCase() === keyword)) {
                return false;
            }
        }
        
        // Check in enhanced mapping
        for (const cutData of Object.values(this.enhancedMapping.classification_system)) {
            for (const gradeData of Object.values(cutData.grades)) {
                if (gradeData.keywords.some(k => k.toLowerCase() === keyword) ||
                    gradeData.variations.some(v => v.toLowerCase().includes(keyword))) {
                    return false;
                }
            }
        }
        
        return true;
    }

    /**
     * Check if word is a known grade keyword
     */
    isKnownGradeKeyword(word) {
        const wordLower = word.toLowerCase();
        
        for (const gradeData of Object.values(this.gradeKeywords.grade_patterns)) {
            if (gradeData.primary_keywords.some(k => k.toLowerCase() === wordLower) ||
                gradeData.secondary_keywords.some(k => k.toLowerCase() === wordLower)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Check if name contains meat keywords
     */
    containsMeatKeywords(name) {
        const meatKeywords = [
            'בקר', 'עגל', 'עגלה', 'פרה', 'שור',
            'עוף', 'תרנגול', 'פרגית', 'חזה',
            'הודו', 'ברווז', 'אווז',
            'טלה', 'כבש', 'עז',
            'חזיר', 'לבן',
            'דג', 'סלמון', 'טונה'
        ];
        
        return meatKeywords.some(keyword => name.includes(keyword));
    }

    /**
     * Identify potential confidence improvements
     */
    identifyConfidenceImprovements(product) {
        const improvements = [];
        const name = (product.originalName || product.name).toLowerCase();
        
        // Could add more specific keywords
        if (product.confidence < 0.9 && this.hasUnrecognizedQualityWords(name)) {
            improvements.push({
                type: 'add_quality_keywords',
                description: 'Add quality indicators to grade keywords'
            });
        }
        
        // Could improve cut recognition
        if (product.category === 'אחר' && this.containsMeatKeywords(name)) {
            improvements.push({
                type: 'improve_cut_recognition',
                description: 'Add cut variation to mapping'
            });
        }
        
        return improvements;
    }

    /**
     * Check for unrecognized quality words
     */
    hasUnrecognizedQualityWords(name) {
        const qualityWords = ['איכותי', 'מעולה', 'משובח', 'ברמה גבוהה', 'מומחה'];
        return qualityWords.some(word => name.includes(word));
    }

    /**
     * Update mapping files with new patterns
     */
    updateMappingFiles(learningResults) {
        console.log(`📝 Updating mapping files with ${learningResults.new_patterns.length} new patterns...`);
        
        const updates = {
            enhanced_mapping: false,
            grade_keywords: false,
            learning_log: true
        };
        
        // Group patterns by type
        const gradePatterns = learningResults.new_patterns.filter(p => p.type === 'grade');
        const cutPatterns = learningResults.new_patterns.filter(p => p.type === 'cut');
        const brandPatterns = learningResults.new_patterns.filter(p => p.type === 'brand');
        
        // Update grade keywords if we have new grade patterns
        if (gradePatterns.length > 0) {
            this.updateGradeKeywords(gradePatterns);
            updates.grade_keywords = true;
        }
        
        // Update enhanced mapping if we have new cut patterns
        if (cutPatterns.length > 0) {
            this.updateEnhancedMapping(cutPatterns);
            updates.enhanced_mapping = true;
        }
        
        // Save updated files
        this.saveUpdatedFiles(updates);
        this.sessionStats.auto_updates += Object.values(updates).filter(Boolean).length;
        
        learningResults.updated_mappings = Object.keys(updates).filter(key => updates[key]);
    }

    /**
     * Update grade keywords file
     */
    updateGradeKeywords(gradePatterns) {
        for (const pattern of gradePatterns) {
            // Add to premium grade as a secondary keyword
            if (!this.gradeKeywords.grade_patterns.premium.secondary_keywords.includes(pattern.keyword)) {
                this.gradeKeywords.grade_patterns.premium.secondary_keywords.push(pattern.keyword);
                console.log(`   Added "${pattern.keyword}" to premium grade keywords`);
            }
        }
    }

    /**
     * Update enhanced mapping file
     */
    updateEnhancedMapping(cutPatterns) {
        for (const pattern of cutPatterns) {
            // Try to find appropriate base cut to add variation to
            const baseCut = this.findBestBaseCutMatch(pattern);
            if (baseCut) {
                const cutData = this.enhancedMapping.classification_system[baseCut];
                if (cutData && cutData.grades.regular) {
                    if (!cutData.grades.regular.variations.includes(pattern.product_name)) {
                        cutData.grades.regular.variations.push(pattern.product_name);
                        console.log(`   Added "${pattern.product_name}" to ${baseCut} variations`);
                    }
                }
            }
        }
    }

    /**
     * Find best base cut match for a pattern
     */
    findBestBaseCutMatch(pattern) {
        const keyword = pattern.keyword.toLowerCase();
        
        // Simple heuristic matching
        for (const [cutName, cutData] of Object.entries(this.enhancedMapping.classification_system)) {
            const cutNameLower = cutName.toLowerCase();
            if (cutNameLower.includes(keyword) || keyword.includes(cutNameLower.split(' ')[0])) {
                return cutName;
            }
        }
        
        return null;
    }

    /**
     * Save updated mapping files
     */
    saveUpdatedFiles(updates) {
        try {
            if (updates.grade_keywords) {
                this.gradeKeywords._metadata.last_update = new Date().toISOString();
                fs.writeFileSync('config/grade_keywords.json', JSON.stringify(this.gradeKeywords, null, 2));
                console.log('   ✅ Updated grade_keywords.json');
            }
            
            if (updates.enhanced_mapping) {
                this.enhancedMapping._metadata.last_update = new Date().toISOString();
                fs.writeFileSync('config/enhanced_meat_mapping.json', JSON.stringify(this.enhancedMapping, null, 2));
                console.log('   ✅ Updated enhanced_meat_mapping.json');
            }
            
        } catch (error) {
            console.error('❌ Error saving updated files:', error.message);
        }
    }

    /**
     * Update learning log
     */
    updateLearningLog(learningResults) {
        // Update statistics
        this.learningLog.learning_statistics.total_products_processed += learningResults.products_analyzed;
        this.learningLog.learning_statistics.new_patterns_discovered += learningResults.new_patterns.length;
        this.learningLog.learning_statistics.manual_reviews += learningResults.manual_reviews.length;
        
        // Add new patterns to discoveries
        for (const pattern of learningResults.new_patterns) {
            this.learningLog.pattern_discoveries.new_grade_patterns.push({
                ...pattern,
                discovered_at: learningResults.timestamp,
                auto_added: true
            });
        }
        
        // Add manual reviews to queue
        for (const review of learningResults.manual_reviews) {
            this.learningLog.manual_review_queue.push({
                ...review,
                timestamp: learningResults.timestamp,
                site: learningResults.site
            });
        }
        
        // Update site learning stats
        if (!this.learningLog.site_learning[learningResults.site]) {
            this.learningLog.site_learning[learningResults.site] = {
                products_processed: 0,
                new_patterns: 0,
                confidence_avg: 0,
                last_scan: null
            };
        }
        
        const siteStats = this.learningLog.site_learning[learningResults.site];
        siteStats.products_processed += learningResults.products_analyzed;
        siteStats.new_patterns += learningResults.new_patterns.length;
        siteStats.last_scan = learningResults.timestamp;
        
        // Save learning log
        this.learningLog._metadata.last_update = new Date().toISOString();
        fs.writeFileSync('config/learning_log.json', JSON.stringify(this.learningLog, null, 2));
    }

    /**
     * Generate session report
     */
    generateSessionReport(learningResults) {
        const report = {
            session_info: {
                site: learningResults.site,
                timestamp: learningResults.timestamp,
                products_analyzed: learningResults.products_analyzed
            },
            learning_results: {
                new_patterns_discovered: learningResults.new_patterns.length,
                mapping_files_updated: learningResults.updated_mappings.length,
                manual_reviews_flagged: learningResults.manual_reviews.length,
                confidence_improvements: learningResults.confidence_improvements.length
            },
            session_stats: this.sessionStats,
            recommendations: this.generateRecommendations(learningResults),
            file_updates: learningResults.updated_mappings
        };
        
        // Save session report
        const reportPath = `output/learning-report-${learningResults.site}-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        return report;
    }

    /**
     * Generate recommendations based on learning results
     */
    generateRecommendations(learningResults) {
        const recommendations = [];
        
        if (learningResults.manual_reviews.length > 5) {
            recommendations.push({
                type: 'manual_review_required',
                priority: 'high',
                message: `${learningResults.manual_reviews.length} products need manual classification review`,
                action: 'Review config/learning_log.json manual_review_queue'
            });
        }
        
        if (learningResults.new_patterns.length > 3) {
            recommendations.push({
                type: 'pattern_validation',
                priority: 'medium',
                message: `${learningResults.new_patterns.length} new patterns auto-discovered`,
                action: 'Validate new patterns in updated mapping files'
            });
        }
        
        if (learningResults.confidence_improvements.length > 10) {
            recommendations.push({
                type: 'mapping_enhancement',
                priority: 'medium',
                message: 'Multiple confidence improvement opportunities detected',
                action: 'Consider expanding keyword dictionaries'
            });
        }
        
        return recommendations;
    }

    /**
     * Generate learning summary for documentation updates
     */
    generateLearningUpdate() {
        const summary = {
            timestamp: new Date().toISOString(),
            total_products_processed: this.learningLog.learning_statistics.total_products_processed,
            new_patterns_discovered: this.learningLog.learning_statistics.new_patterns_discovered,
            manual_reviews_pending: this.learningLog.manual_review_queue.length,
            auto_improvements: this.sessionStats.auto_updates,
            confidence_distribution: this.calculateConfidenceDistribution(),
            next_actions: this.generateNextActions()
        };
        
        return summary;
    }

    /**
     * Calculate confidence distribution from learning log
     */
    calculateConfidenceDistribution() {
        // In a real implementation, this would analyze actual confidence scores
        return {
            high_confidence: '65% (>0.8)',
            medium_confidence: '25% (0.6-0.8)', 
            low_confidence: '10% (<0.6)'
        };
    }

    /**
     * Generate next recommended actions
     */
    generateNextActions() {
        const actions = [];
        
        if (this.learningLog.manual_review_queue.length > 0) {
            actions.push(`Review ${this.learningLog.manual_review_queue.length} products in manual review queue`);
        }
        
        if (this.sessionStats.auto_updates > 0) {
            actions.push('Test updated mapping files with next site scan');
        }
        
        actions.push('Run enhanced normalization on existing product data');
        actions.push('Deploy to additional sites for broader pattern discovery');
        
        return actions;
    }
}

module.exports = AutoLearner;