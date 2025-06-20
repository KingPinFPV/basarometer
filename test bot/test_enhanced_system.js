#!/usr/bin/env node

/**
 * BASAROMETER SCANNER - Enhanced System Integration Test
 * Complete validation of the v2.0 Advanced Normalization System
 */

const fs = require('fs');
const path = require('path');

console.log("🧠 BASAROMETER ENHANCED SYSTEM VALIDATION v2.0");
console.log("=" .repeat(60));

// Test data for validation
const testProducts = [
    // High-confidence grade classifications
    "אנטריקוט אנגוס טרי 250 גרם",
    "פילה וואגיו מיושן",
    "סינטה עגלה פרמיום טרי",
    "צלי כתף בקר נברסקה",
    "אסאדו עגל חלב טרי",
    
    // Medium-confidence products
    "שריר בקר איכותי",
    "נתח קצבים מובחר",
    "דנוור סטייק פרימיום",
    
    // Complex product names from real data
    "אנטריקוט פרוס טרי 250 גרם ליח",
    "חזה בקר טרי לה מרשה",
    "צלי כתף אנגוס טרי חלק- לה מרשה",
    "מוצר בשר הודו אדום מתובל טחון טיבון וויל 500 גרם",
    
    // Edge cases
    "בשר לא ברור",
    "מוצר משהו",
    ""
];

async function runSystemValidation() {
    console.log("\n📋 PHASE 1: SYSTEM INITIALIZATION");
    console.log("-" .repeat(40));
    
    // Test 1: Check all required files exist
    const requiredFiles = [
        'config/enhanced_meat_mapping.json',
        'config/grade_keywords.json', 
        'config/cut_hierarchy.json',
        'config/learning_log.json',
        'utils/meat-normalizer.js',
        'utils/auto-learner.js',
        'utils/confidence-scorer.js',
        'analyze_current_data.js'
    ];
    
    let filesOK = true;
    for (const file of requiredFiles) {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file}`);
        } else {
            console.log(`❌ ${file} - MISSING!`);
            filesOK = false;
        }
    }
    
    if (!filesOK) {
        console.log("\n❌ SYSTEM VALIDATION FAILED - Missing required files");
        process.exit(1);
    }
    
    console.log("\n🎯 All required files present!");
    
    // Test 2: Load and initialize systems
    console.log("\n📋 PHASE 2: SYSTEM LOADING");
    console.log("-" .repeat(40));
    
    try {
        const MeatNormalizer = require('./utils/meat-normalizer.js');
        const AutoLearner = require('./utils/auto-learner.js');
        const ConfidenceScorer = require('./utils/confidence-scorer.js');
        
        console.log("✅ MeatNormalizer module loaded");
        console.log("✅ AutoLearner module loaded");
        console.log("✅ ConfidenceScorer module loaded");
        
        const normalizer = new MeatNormalizer();
        const learner = new AutoLearner();
        const scorer = new ConfidenceScorer();
        
        console.log("✅ All systems initialized successfully");
        
        // Test 3: Enhanced classification validation
        console.log("\n📋 PHASE 3: ENHANCED CLASSIFICATION TESTING");
        console.log("-" .repeat(40));
        
        const classificationResults = [];
        const confidenceStats = { high: 0, medium: 0, low: 0, veryLow: 0 };
        
        for (let i = 0; i < testProducts.length; i++) {
            const product = testProducts[i];
            
            if (!product) {
                console.log(`${i + 1}. [EMPTY] -> Skipped`);
                continue;
            }
            
            try {
                const result = normalizer.classifyProduct(product);
                const confidenceLevel = scorer.classifyConfidenceLevel(result.confidence);
                
                classificationResults.push({
                    product,
                    result,
                    confidenceLevel
                });
                
                // Update stats
                switch (confidenceLevel.level) {
                    case 'high': confidenceStats.high++; break;
                    case 'medium': confidenceStats.medium++; break;
                    case 'low': confidenceStats.low++; break;
                    case 'very_low': confidenceStats.veryLow++; break;
                }
                
                console.log(`${i + 1}. "${product}"`);
                console.log(`   → ${result.base_cut} (${result.grade}) - ${result.confidence} (${confidenceLevel.level})`);
                
            } catch (error) {
                console.log(`${i + 1}. "${product}" -> ERROR: ${error.message}`);
            }
        }
        
        // Test 4: Grade separation validation
        console.log("\n📋 PHASE 4: GRADE SEPARATION VALIDATION");
        console.log("-" .repeat(40));
        
        const gradeTests = [
            { input: "אנטריקוט אנגוס", expectedGrade: "angus" },
            { input: "פילה וואגיו", expectedGrade: "wagyu" }, 
            { input: "סינטה עגלה", expectedGrade: "veal" },
            { input: "צלי כתף פרימיום", expectedGrade: "premium" },
            { input: "אנטריקוט טרי", expectedGrade: "regular" }
        ];
        
        let gradeAccuracy = 0;
        for (const test of gradeTests) {
            const result = normalizer.classifyProduct(test.input);
            const correct = result.grade === test.expectedGrade;
            
            if (correct) gradeAccuracy++;
            
            console.log(`"${test.input}" -> ${result.grade} ${correct ? '✅' : '❌'} (expected: ${test.expectedGrade})`);
        }
        
        const gradeAccuracyPercent = Math.round((gradeAccuracy / gradeTests.length) * 100);
        console.log(`\n🎯 Grade Separation Accuracy: ${gradeAccuracyPercent}% (${gradeAccuracy}/${gradeTests.length})`);
        
        // Test 5: Auto-learning system validation
        console.log("\n📋 PHASE 5: AUTO-LEARNING SYSTEM VALIDATION");
        console.log("-" .repeat(40));
        
        const mockScanResults = {
            products: classificationResults.map(cr => ({
                name: cr.product,
                originalName: cr.product,
                isValid: true,
                confidence: cr.result.confidence,
                category: cr.result.category
            })),
            scanInfo: {
                targetSite: "test_site",
                timestamp: new Date().toISOString()
            }
        };
        
        const learningReport = learner.processResults(mockScanResults, "test_site");
        
        console.log("✅ Auto-learning system processed test data");
        console.log(`📊 Learning Report Generated: ${learningReport.learning_results.new_patterns_discovered} new patterns`);
        console.log(`📋 Manual Reviews: ${learningReport.learning_results.manual_reviews_flagged} flagged`);
        
        // Test 6: Confidence scoring validation
        console.log("\n📋 PHASE 6: CONFIDENCE SCORING VALIDATION");
        console.log("-" .repeat(40));
        
        const batchResults = scorer.scoreConfidenceBatch(
            classificationResults.map(cr => ({
                name: cr.product,
                classification: cr.result
            }))
        );
        
        console.log("✅ Batch confidence scoring completed");
        console.log(`📊 High Confidence: ${batchResults.statistics.percentage_high}%`);
        console.log(`⚠️  Needs Review: ${batchResults.statistics.percentage_needs_review}%`);
        
        // Final validation report
        console.log("\n📋 FINAL VALIDATION REPORT");
        console.log("=" .repeat(60));
        
        const totalValidProducts = testProducts.filter(p => p).length;
        const highConfidenceRate = Math.round((confidenceStats.high / totalValidProducts) * 100);
        const systemHealth = {
            files_present: filesOK,
            modules_loaded: true,
            classification_working: classificationResults.length > 0,
            grade_separation_accuracy: gradeAccuracyPercent,
            high_confidence_rate: highConfidenceRate,
            auto_learning_active: learningReport.learning_results !== undefined,
            confidence_scoring_active: batchResults.statistics !== undefined
        };
        
        console.log("\n🎯 SYSTEM HEALTH CHECK:");
        for (const [check, status] of Object.entries(systemHealth)) {
            console.log(`   ${status ? '✅' : '❌'} ${check}: ${status}`);
        }
        
        // Quality thresholds validation
        console.log("\n📊 QUALITY THRESHOLDS:");
        console.log(`   Grade Accuracy: ${gradeAccuracyPercent}% ${gradeAccuracyPercent >= 85 ? '✅' : '⚠️'} (target: 85%+)`);
        console.log(`   High Confidence: ${highConfidenceRate}% ${highConfidenceRate >= 60 ? '✅' : '⚠️'} (target: 60%+)`);
        console.log(`   System Integration: ${Object.values(systemHealth).every(Boolean) ? '✅' : '❌'}`);
        
        // Recommendations
        console.log("\n💡 RECOMMENDATIONS:");
        if (gradeAccuracyPercent < 85) {
            console.log("   🔧 Improve grade keyword patterns in config/grade_keywords.json");
        }
        if (highConfidenceRate < 60) {
            console.log("   🔧 Expand mapping variations in config/enhanced_meat_mapping.json");
        }
        if (confidenceStats.low + confidenceStats.veryLow > totalValidProducts * 0.2) {
            console.log("   📋 Review manual_review_queue in config/learning_log.json");
        }
        
        console.log("\n🎯 NEXT STEPS:");
        console.log("   1. Deploy enhanced system to main basarometer-scanner.js");
        console.log("   2. Test with live site data (Rami Levy, Carrefour)");
        console.log("   3. Add Shufersal Online with enhanced classification");
        console.log("   4. Validate grade-aware price comparisons");
        console.log("   5. Scale to 5+ sites with auto-learning");
        
        const overallSuccess = Object.values(systemHealth).every(Boolean) && 
                              gradeAccuracyPercent >= 80 && 
                              highConfidenceRate >= 50;
        
        if (overallSuccess) {
            console.log("\n🚀 VALIDATION SUCCESSFUL - Enhanced System v2.0 Ready for Production!");
        } else {
            console.log("\n⚠️  VALIDATION COMPLETED - Some improvements needed before production");
        }
        
        // Save validation report
        const validationReport = {
            timestamp: new Date().toISOString(),
            version: "2.0.0",
            system_health: systemHealth,
            quality_metrics: {
                grade_accuracy: gradeAccuracyPercent,
                high_confidence_rate: highConfidenceRate,
                confidence_distribution: confidenceStats
            },
            test_results: classificationResults,
            learning_report: learningReport,
            recommendations: [],
            overall_success: overallSuccess
        };
        
        fs.writeFileSync('enhanced_system_validation_report.json', JSON.stringify(validationReport, null, 2));
        console.log("\n💾 Validation report saved to: enhanced_system_validation_report.json");
        
    } catch (error) {
        console.log(`\n❌ SYSTEM VALIDATION FAILED: ${error.message}`);
        console.log("Stack trace:", error.stack);
        process.exit(1);
    }
}

// Run validation if called directly
if (require.main === module) {
    runSystemValidation().catch(error => {
        console.error("❌ Validation failed:", error);
        process.exit(1);
    });
}

module.exports = { runSystemValidation };