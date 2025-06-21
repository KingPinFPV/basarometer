/**
 * Intelligent Vendor Classification and Prioritization System
 * Advanced ranking algorithm for Israeli meat vendors
 */

import { promises as fs } from 'fs';
import path from 'path';

class VendorRankingSystem {
    constructor(options = {}) {
        this.outputDir = options.outputDir || './vendor-rankings';
        this.configDir = options.configDir || './config';
        
        // Ranking criteria weights
        this.rankingWeights = {
            productVolume: 0.25,      // Number of products available
            priceCompetitiveness: 0.20, // Price comparison vs market average
            marketReach: 0.15,        // Geographic coverage and delivery options
            productQuality: 0.15,     // Premium offerings and quality indicators
            reliability: 0.10,        // Consistency of data and availability
            marketSegment: 0.10,      // Target market alignment
            innovation: 0.05          // Online features and technology adoption
        };
        
        // Vendor classification matrix
        this.vendorCategories = {
            'supermarket_chain': {
                characteristics: ['multiple_locations', 'high_volume', 'diverse_products'],
                expectedProducts: { min: 50, max: 200 },
                priceExpectation: 'competitive',
                marketPosition: 'mainstream',
                baseScore: 0.8
            },
            'online_delivery': {
                characteristics: ['delivery_service', 'online_ordering', 'convenience'],
                expectedProducts: { min: 30, max: 150 },
                priceExpectation: 'premium',
                marketPosition: 'convenience',
                baseScore: 0.85
            },
            'premium_butcher': {
                characteristics: ['quality_focus', 'specialty_cuts', 'expert_service'],
                expectedProducts: { min: 20, max: 80 },
                priceExpectation: 'premium',
                marketPosition: 'premium',
                baseScore: 0.75
            },
            'local_butcher': {
                characteristics: ['community_focused', 'traditional', 'personal_service'],
                expectedProducts: { min: 15, max: 60 },
                priceExpectation: 'moderate',
                marketPosition: 'local',
                baseScore: 0.7
            },
            'specialty_store': {
                characteristics: ['niche_products', 'unique_offerings', 'specific_market'],
                expectedProducts: { min: 10, max: 40 },
                priceExpectation: 'premium',
                marketPosition: 'niche',
                baseScore: 0.65
            },
            'discount_chain': {
                characteristics: ['low_prices', 'bulk_options', 'value_focused'],
                expectedProducts: { min: 30, max: 100 },
                priceExpectation: 'discount',
                marketPosition: 'value',
                baseScore: 0.75
            }
        };
        
        // Market segment priorities for Israeli meat market
        this.marketSegmentPriorities = {
            'religious_kosher': { priority: 0.9, marketSize: 'large', growth: 'stable' },
            'premium_quality': { priority: 0.85, marketSize: 'medium', growth: 'growing' },
            'convenience_delivery': { priority: 0.9, marketSize: 'growing', growth: 'rapid' },
            'value_conscious': { priority: 0.8, marketSize: 'large', growth: 'stable' },
            'organic_healthy': { priority: 0.7, marketSize: 'small', growth: 'growing' },
            'bulk_wholesale': { priority: 0.6, marketSize: 'medium', growth: 'stable' }
        };
        
        // Geographic importance in Israeli market
        this.geographicPriorities = {
            'tel_aviv_metro': { priority: 1.0, population: 'very_high', purchasing_power: 'high' },
            'jerusalem_area': { priority: 0.95, population: 'high', purchasing_power: 'medium_high' },
            'haifa_north': { priority: 0.8, population: 'medium', purchasing_power: 'medium' },
            'beer_sheva_south': { priority: 0.7, population: 'medium', purchasing_power: 'medium' },
            'religious_centers': { priority: 0.85, population: 'medium', purchasing_power: 'medium' },
            'settlements_periphery': { priority: 0.6, population: 'low', purchasing_power: 'medium' }
        };
    }

    async initialize() {
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
            console.log('🏆 Vendor Ranking System initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize ranking system:', error);
            return false;
        }
    }

    classifyVendor(vendorData) {
        const {
            name,
            type,
            baseUrl,
            productCount = 0,
            averagePrice = 0,
            hasDelivery = false,
            hasOnlineOrdering = false,
            location = '',
            specialFeatures = {},
            confidence = 0.5
        } = vendorData;
        
        // Determine vendor category
        const category = this.determineVendorCategory(vendorData);
        const categoryData = this.vendorCategories[category];
        
        // Calculate classification scores
        const classification = {
            vendorId: this.generateVendorId(name, baseUrl),
            name,
            category,
            categoryData,
            scores: {
                productVolume: this.calculateProductVolumeScore(productCount, category),
                priceCompetitiveness: this.calculatePriceScore(averagePrice, category),
                marketReach: this.calculateMarketReachScore(vendorData),
                productQuality: this.calculateQualityScore(vendorData),
                reliability: this.calculateReliabilityScore(vendorData),
                marketSegment: this.calculateMarketSegmentScore(vendorData),
                innovation: this.calculateInnovationScore(vendorData)
            },
            overallScore: 0,
            rank: 0,
            tier: 'unranked',
            recommendations: [],
            classifiedAt: new Date().toISOString()
        };
        
        // Calculate weighted overall score
        classification.overallScore = this.calculateWeightedScore(classification.scores);
        
        // Determine tier
        classification.tier = this.determineTier(classification.overallScore);
        
        // Generate recommendations
        classification.recommendations = this.generateVendorRecommendations(classification);
        
        return classification;
    }

    determineVendorCategory(vendorData) {
        const { name = '', type = '', baseUrl = '', hasDelivery, hasOnlineOrdering, specialFeatures = {} } = vendorData;
        
        const vendorText = (name + ' ' + type + ' ' + baseUrl).toLowerCase();
        
        // Online delivery platforms
        if (hasOnlineOrdering && hasDelivery) {
            return 'online_delivery';
        }
        
        // Supermarket chains
        if (vendorText.includes('רמי לוי') || vendorText.includes('שופרסל') || 
            vendorText.includes('מגא') || vendorText.includes('טיב טעם') ||
            vendorText.includes('סופר') || type === 'supermarket_chain') {
            return 'supermarket_chain';
        }
        
        // Discount chains
        if (vendorText.includes('ויקטורי') || vendorText.includes('חצי חינם') ||
            type === 'discount_chain' || vendorText.includes('מבצע') || vendorText.includes('זול')) {
            return 'discount_chain';
        }
        
        // Premium butchers
        if (vendorText.includes('פרימיום') || vendorText.includes('אנגוס') || 
            vendorText.includes('וואגיו') || specialFeatures.premiumCuts ||
            type === 'premium_butcher') {
            return 'premium_butcher';
        }
        
        // Specialty stores
        if (vendorText.includes('ביו') || vendorText.includes('אורגני') ||
            vendorText.includes('מיוחד') || type === 'specialty_store') {
            return 'specialty_store';
        }
        
        // Local butchers (default for traditional meat vendors)
        if (vendorText.includes('קצב') || vendorText.includes('מטבחיים') ||
            type === 'local_butcher') {
            return 'local_butcher';
        }
        
        // Default classification
        return 'local_butcher';
    }

    calculateProductVolumeScore(productCount, category) {
        const expectedRange = this.vendorCategories[category]?.expectedProducts || { min: 20, max: 100 };
        
        if (productCount >= expectedRange.max) return 1.0;
        if (productCount >= expectedRange.min) {
            return 0.5 + ((productCount - expectedRange.min) / (expectedRange.max - expectedRange.min)) * 0.5;
        }
        if (productCount > 0) {
            return (productCount / expectedRange.min) * 0.5;
        }
        return 0.0;
    }

    calculatePriceScore(averagePrice, category) {
        if (!averagePrice || averagePrice <= 0) return 0.3; // Neutral score for missing data
        
        // Israeli meat market price benchmarks (₪ per kg)
        const marketBenchmarks = {
            'supermarket_chain': { baseline: 60, competitive: 50 },
            'online_delivery': { baseline: 70, competitive: 60 },
            'premium_butcher': { baseline: 90, competitive: 80 },
            'local_butcher': { baseline: 65, competitive: 55 },
            'specialty_store': { baseline: 85, competitive: 75 },
            'discount_chain': { baseline: 50, competitive: 40 }
        };
        
        const benchmark = marketBenchmarks[category] || marketBenchmarks['local_butcher'];
        
        if (averagePrice <= benchmark.competitive) return 1.0;
        if (averagePrice <= benchmark.baseline) return 0.7;
        if (averagePrice <= benchmark.baseline * 1.3) return 0.4;
        return 0.1; // Very expensive
    }

    calculateMarketReachScore(vendorData) {
        let score = 0;
        
        // Delivery service
        if (vendorData.hasDelivery) score += 0.4;
        
        // Online ordering
        if (vendorData.hasOnlineOrdering) score += 0.3;
        
        // Geographic coverage
        const location = (vendorData.location || '').toLowerCase();
        if (location.includes('תל אביב') || location.includes('tel aviv')) score += 0.2;
        else if (location.includes('ירושלים') || location.includes('jerusalem')) score += 0.18;
        else if (location.includes('חיפה') || location.includes('haifa')) score += 0.15;
        else if (location) score += 0.1; // Any specified location
        
        // Multiple locations indicator
        if (vendorData.multipleLocations || vendorData.category === 'supermarket_chain') {
            score += 0.1;
        }
        
        return Math.min(score, 1.0);
    }

    calculateQualityScore(vendorData) {
        let score = 0.5; // Base score
        
        const features = vendorData.specialFeatures || {};
        const name = (vendorData.name || '').toLowerCase();
        
        // Premium indicators
        if (features.premiumCuts || name.includes('פרימיום') || name.includes('אנגוס')) {
            score += 0.3;
        }
        
        // Quality certifications
        if (features.kosherCertified || name.includes('מהדרין') || name.includes('כשר')) {
            score += 0.2;
        }
        
        // Fresh/organic indicators
        if (features.organicOptions || name.includes('ביו') || name.includes('אורגני')) {
            score += 0.2;
        }
        
        // Traditional quality (for butchers)
        if (features.traditionalCuts || features.expertAdvice) {
            score += 0.15;
        }
        
        // Daily fresh
        if (features.dailyFresh || features.freshDaily) {
            score += 0.15;
        }
        
        return Math.min(score, 1.0);
    }

    calculateReliabilityScore(vendorData) {
        let score = 0.6; // Base reliability score
        
        // Data completeness
        if (vendorData.productCount && vendorData.productCount > 0) score += 0.1;
        if (vendorData.averagePrice && vendorData.averagePrice > 0) score += 0.1;
        if (vendorData.baseUrl && vendorData.baseUrl.startsWith('http')) score += 0.1;
        
        // Confidence in data
        const confidence = vendorData.confidence || 0.5;
        score += confidence * 0.2;
        
        return Math.min(score, 1.0);
    }

    calculateMarketSegmentScore(vendorData) {
        let score = 0.5; // Base score
        
        const name = (vendorData.name || '').toLowerCase();
        const features = vendorData.specialFeatures || {};
        
        // Religious market (high priority in Israel)
        if (features.kosherCertified || name.includes('מהדרין') || name.includes('כשר')) {
            score += this.marketSegmentPriorities.religious_kosher.priority * 0.3;
        }
        
        // Convenience/delivery market
        if (vendorData.hasDelivery || vendorData.hasOnlineOrdering) {
            score += this.marketSegmentPriorities.convenience_delivery.priority * 0.25;
        }
        
        // Premium market
        if (features.premiumCuts || name.includes('פרימיום')) {
            score += this.marketSegmentPriorities.premium_quality.priority * 0.2;
        }
        
        // Value market
        if (vendorData.category === 'discount_chain' || name.includes('מבצע')) {
            score += this.marketSegmentPriorities.value_conscious.priority * 0.25;
        }
        
        return Math.min(score, 1.0);
    }

    calculateInnovationScore(vendorData) {
        let score = 0.3; // Base score
        
        // Online presence
        if (vendorData.hasOnlineOrdering) score += 0.4;
        
        // Mobile optimization
        if (vendorData.specialFeatures?.mobileFriendly) score += 0.2;
        
        // Advanced features
        if (vendorData.specialFeatures?.quickDelivery) score += 0.15;
        if (vendorData.specialFeatures?.realTimeInventory) score += 0.15;
        if (vendorData.specialFeatures?.customOrders) score += 0.1;
        
        return Math.min(score, 1.0);
    }

    calculateWeightedScore(scores) {
        let weightedSum = 0;
        let totalWeight = 0;
        
        for (const [criterion, weight] of Object.entries(this.rankingWeights)) {
            if (scores[criterion] !== undefined) {
                weightedSum += scores[criterion] * weight;
                totalWeight += weight;
            }
        }
        
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    determineTier(overallScore) {
        if (overallScore >= 0.8) return 'S'; // Premium tier
        if (overallScore >= 0.7) return 'A'; // High tier
        if (overallScore >= 0.6) return 'B'; // Good tier
        if (overallScore >= 0.5) return 'C'; // Standard tier
        if (overallScore >= 0.4) return 'D'; // Below average
        return 'F'; // Poor tier
    }

    generateVendorRecommendations(classification) {
        const recommendations = [];
        const scores = classification.scores;
        
        // Product volume recommendations
        if (scores.productVolume < 0.5) {
            recommendations.push({
                type: 'product_expansion',
                priority: 'high',
                message: 'Expand product catalog to increase market coverage',
                target: 'Increase to 50+ products'
            });
        }
        
        // Price competitiveness recommendations
        if (scores.priceCompetitiveness < 0.4) {
            recommendations.push({
                type: 'pricing_strategy',
                priority: 'medium',
                message: 'Review pricing strategy for market competitiveness',
                target: 'Achieve market-average pricing'
            });
        }
        
        // Market reach recommendations
        if (scores.marketReach < 0.6) {
            recommendations.push({
                type: 'market_expansion',
                priority: 'high',
                message: 'Expand delivery and online ordering capabilities',
                target: 'Add delivery service and online ordering'
            });
        }
        
        // Innovation recommendations
        if (scores.innovation < 0.5) {
            recommendations.push({
                type: 'digital_transformation',
                priority: 'medium',
                message: 'Invest in digital capabilities and online presence',
                target: 'Implement online ordering system'
            });
        }
        
        return recommendations;
    }

    rankVendors(vendors) {
        console.log(`🏆 Ranking ${vendors.length} vendors...`);
        
        // Classify and score all vendors
        const classifiedVendors = vendors.map(vendor => this.classifyVendor(vendor));
        
        // Sort by overall score (descending)
        classifiedVendors.sort((a, b) => b.overallScore - a.overallScore);
        
        // Assign ranks
        classifiedVendors.forEach((vendor, index) => {
            vendor.rank = index + 1;
        });
        
        // Generate ranking analysis
        const analysis = this.analyzeRankings(classifiedVendors);
        
        return {
            rankings: classifiedVendors,
            analysis,
            rankedAt: new Date().toISOString()
        };
    }

    analyzeRankings(rankedVendors) {
        const analysis = {
            totalVendors: rankedVendors.length,
            tierDistribution: {},
            categoryDistribution: {},
            averageScores: {},
            topPerformers: rankedVendors.slice(0, 5),
            improvementOpportunities: rankedVendors.filter(v => v.tier === 'D' || v.tier === 'F'),
            marketLeaders: rankedVendors.filter(v => v.tier === 'S' || v.tier === 'A')
        };
        
        // Calculate distributions
        for (const vendor of rankedVendors) {
            analysis.tierDistribution[vendor.tier] = (analysis.tierDistribution[vendor.tier] || 0) + 1;
            analysis.categoryDistribution[vendor.category] = (analysis.categoryDistribution[vendor.category] || 0) + 1;
        }
        
        // Calculate average scores by criterion
        const criteriaKeys = Object.keys(this.rankingWeights);
        for (const criterion of criteriaKeys) {
            const scores = rankedVendors.map(v => v.scores[criterion]).filter(s => s !== undefined);
            analysis.averageScores[criterion] = scores.length > 0 
                ? scores.reduce((a, b) => a + b, 0) / scores.length 
                : 0;
        }
        
        return analysis;
    }

    async generateRankingReport(rankingResults) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(this.outputDir, `vendor-rankings-${timestamp}.json`);
        
        const report = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalVendors: rankingResults.analysis.totalVendors,
                topTierVendors: (rankingResults.analysis.tierDistribution.S || 0) + (rankingResults.analysis.tierDistribution.A || 0),
                averageScore: rankingResults.rankings.reduce((sum, v) => sum + v.overallScore, 0) / rankingResults.rankings.length,
                marketReadiness: this.assessMarketReadiness(rankingResults.analysis)
            },
            rankings: rankingResults,
            strategicInsights: this.generateStrategicInsights(rankingResults),
            actionPlan: this.generateActionPlan(rankingResults)
        };
        
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`📊 Vendor ranking report saved to: ${reportPath}`);
        
        return report;
    }

    assessMarketReadiness(analysis) {
        const topTierCount = (analysis.tierDistribution.S || 0) + (analysis.tierDistribution.A || 0);
        const totalVendors = analysis.totalVendors;
        const topTierRatio = topTierCount / totalVendors;
        
        if (topTierRatio >= 0.5) return 'excellent';
        if (topTierRatio >= 0.3) return 'good';
        if (topTierRatio >= 0.2) return 'moderate';
        return 'developing';
    }

    generateStrategicInsights(rankingResults) {
        const insights = [];
        const analysis = rankingResults.analysis;
        
        // Market leadership insight
        if (analysis.marketLeaders.length >= 3) {
            insights.push({
                type: 'market_maturity',
                message: `Strong market foundation with ${analysis.marketLeaders.length} market-leading vendors`,
                impact: 'positive'
            });
        }
        
        // Category diversity insight
        const categoryCount = Object.keys(analysis.categoryDistribution).length;
        if (categoryCount >= 4) {
            insights.push({
                type: 'portfolio_diversity',
                message: `Excellent vendor portfolio diversity across ${categoryCount} categories`,
                impact: 'positive'
            });
        }
        
        // Improvement opportunities
        if (analysis.improvementOpportunities.length > analysis.totalVendors * 0.3) {
            insights.push({
                type: 'optimization_potential',
                message: `${analysis.improvementOpportunities.length} vendors show significant improvement potential`,
                impact: 'opportunity'
            });
        }
        
        return insights;
    }

    generateActionPlan(rankingResults) {
        const plan = {
            immediate: [],
            shortTerm: [],
            longTerm: []
        };
        
        const analysis = rankingResults.analysis;
        
        // Immediate actions (1-2 weeks)
        plan.immediate.push({
            action: 'Prioritize top-tier vendors for integration',
            target: `Focus on ${analysis.marketLeaders.length} S/A tier vendors`,
            expectedImpact: '60-80% of high-quality product coverage'
        });
        
        // Short-term actions (1-3 months)
        plan.shortTerm.push({
            action: 'Optimize underperforming vendors',
            target: `Improve ${analysis.improvementOpportunities.length} D/F tier vendors`,
            expectedImpact: '20-30% increase in overall vendor quality'
        });
        
        plan.shortTerm.push({
            action: 'Expand vendor portfolio',
            target: 'Add 10-15 new vendors in underrepresented categories',
            expectedImpact: 'Comprehensive market coverage'
        });
        
        // Long-term actions (3-12 months)
        plan.longTerm.push({
            action: 'Achieve market leadership',
            target: 'Maintain 50+ top-tier vendors across all categories',
            expectedImpact: 'Dominant position in Israeli meat market intelligence'
        });
        
        return plan;
    }

    generateVendorId(name, baseUrl) {
        const cleanName = (name || '').toLowerCase().replace(/[^a-z0-9א-ת]/g, '');
        const domain = baseUrl ? new URL(baseUrl).hostname.replace('www.', '') : 'unknown';
        return `${cleanName}-${domain}`.substring(0, 50);
    }
}

export default VendorRankingSystem;