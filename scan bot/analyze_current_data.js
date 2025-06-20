#!/usr/bin/env node

/**
 * BASAROMETER SCANNER - Current Data Analysis
 * Analyzes existing product data and identifies grade variations for enhanced normalization
 */

const fs = require('fs');
const path = require('path');

console.log("=== BASAROMETER CURRENT DATA ANALYSIS ===\n");

// Load existing mapping files
function loadCurrentMappings() {
    console.log("📁 Loading existing mapping files...");
    
    const meatMapping = JSON.parse(fs.readFileSync('meat_names_mapping.json', 'utf8'));
    const normalizedCuts = JSON.parse(fs.readFileSync('normalized_cuts.json', 'utf8'));
    
    console.log(`✅ Loaded ${Object.keys(meatMapping).length} meat categories`);
    console.log(`✅ Loaded ${normalizedCuts.length} normalized cuts\n`);
    
    return { meatMapping, normalizedCuts };
}

// Load all scraped product data
function loadScrapedData() {
    console.log("📊 Loading scraped product data...");
    
    const outputDir = 'output';
    const jsonFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.json'));
    
    let allProducts = [];
    let siteStats = {};
    
    for (const file of jsonFiles) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(outputDir, file), 'utf8'));
            if (data.products && data.products.length > 0) {
                allProducts = allProducts.concat(data.products);
                
                // Track site statistics
                const site = data.scanInfo?.targetSite || 'unknown';
                if (!siteStats[site]) {
                    siteStats[site] = { files: 0, products: 0, validProducts: 0 };
                }
                siteStats[site].files++;
                siteStats[site].products += data.products.length;
                siteStats[site].validProducts += data.products.filter(p => p.isValid).length;
            }
        } catch (error) {
            console.log(`⚠️  Error reading ${file}: ${error.message}`);
        }
    }
    
    console.log(`✅ Loaded ${allProducts.length} total products from ${jsonFiles.length} files`);
    console.log("📊 Site Statistics:");
    for (const [site, stats] of Object.entries(siteStats)) {
        console.log(`   ${site}: ${stats.validProducts}/${stats.products} valid products (${stats.files} files)`);
    }
    console.log("");
    
    return { allProducts, siteStats };
}

// Analyze grade keywords in product names
function analyzeGradeVariations(products) {
    console.log("🔍 Analyzing grade variations in product names...");
    
    const gradeKeywords = [
        // Hebrew grades
        'אנגוס', 'אנגס', 'angus', 'בלאק אנגוס', 'black angus',
        'וואגיו', 'ואגיו', 'wagyu', 'ווגיו',
        'עגלה', 'עגל', 'מבכירה', 'עגל חלב', 'עגלה טרי',
        'פרימיום', 'premium', 'מיושן', 'aged', 'מיושנת',
        'אורגני', 'organic', 'טבעי', 'natural',
        'נברסקה', 'nebraska', 'ישראלי', 'israeli',
        'דרום אמריקה', 'ארגנטינה', 'argentina', 'אורוגוואי', 'uruguay',
        'פידלוט', 'feedlot', 'מובחר', 'מעולה'
    ];
    
    const gradeFindings = {};
    const gradeExamples = {};
    
    for (const product of products) {
        if (!product.isValid) continue;
        
        const name = product.name.toLowerCase();
        const originalName = (product.originalName || product.name).toLowerCase();
        
        for (const keyword of gradeKeywords) {
            const keywordLower = keyword.toLowerCase();
            if (name.includes(keywordLower) || originalName.includes(keywordLower)) {
                if (!gradeFindings[keyword]) {
                    gradeFindings[keyword] = 0;
                    gradeExamples[keyword] = [];
                }
                gradeFindings[keyword]++;
                
                // Store examples (max 3 per keyword)
                if (gradeExamples[keyword].length < 3) {
                    gradeExamples[keyword].push({
                        name: product.name,
                        site: product.site,
                        price: product.pricePerKg
                    });
                }
            }
        }
    }
    
    console.log("🏷️  Grade Keywords Found:");
    const sortedGrades = Object.entries(gradeFindings)
        .sort((a, b) => b[1] - a[1])
        .filter(([keyword, count]) => count > 0);
    
    for (const [keyword, count] of sortedGrades) {
        console.log(`   ${keyword}: ${count} products`);
        gradeExamples[keyword].forEach(example => {
            console.log(`     • ${example.name} (${example.site}) - ₪${example.price}/kg`);
        });
    }
    console.log("");
    
    return { gradeFindings, gradeExamples };
}

// Analyze base cuts distribution
function analyzeBaseCuts(products, normalizedCuts) {
    console.log("🥩 Analyzing base cuts distribution...");
    
    const cutDistribution = {};
    const cutExamples = {};
    
    for (const product of products) {
        if (!product.isValid) continue;
        
        // Try to match against normalized cuts
        let baseCut = 'unknown';
        const name = product.name.toLowerCase();
        
        for (const cut of normalizedCuts) {
            const cutWords = cut.toLowerCase().split(' ');
            const matches = cutWords.filter(word => name.includes(word));
            
            if (matches.length >= cutWords.length - 1) { // Allow one missing word
                baseCut = cut;
                break;
            }
        }
        
        if (!cutDistribution[baseCut]) {
            cutDistribution[baseCut] = 0;
            cutExamples[baseCut] = [];
        }
        cutDistribution[baseCut]++;
        
        // Store examples (max 2 per cut)
        if (cutExamples[baseCut].length < 2) {
            cutExamples[baseCut].push({
                name: product.name,
                site: product.site,
                price: product.pricePerKg
            });
        }
    }
    
    console.log("📊 Base Cuts Distribution:");
    const sortedCuts = Object.entries(cutDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15); // Top 15 cuts
    
    for (const [cut, count] of sortedCuts) {
        console.log(`   ${cut}: ${count} products`);
        cutExamples[cut].slice(0, 1).forEach(example => {
            console.log(`     • ${example.name} (${example.site})`);
        });
    }
    console.log("");
    
    return { cutDistribution, cutExamples };
}

// Identify pricing patterns by grade
function analyzePricingPatterns(products) {
    console.log("💰 Analyzing pricing patterns by grade...");
    
    const priceAnalysis = {
        regular: [],
        angus: [],
        wagyu: [],
        veal: [],
        premium: []
    };
    
    for (const product of products) {
        if (!product.isValid || !product.pricePerKg) continue;
        
        const name = product.name.toLowerCase();
        
        if (name.includes('אנגוס') || name.includes('angus')) {
            priceAnalysis.angus.push(product.pricePerKg);
        } else if (name.includes('וואגיו') || name.includes('wagyu') || name.includes('ואגיו')) {
            priceAnalysis.wagyu.push(product.pricePerKg);
        } else if (name.includes('עגלה') || name.includes('עגל') || name.includes('מבכירה')) {
            priceAnalysis.veal.push(product.pricePerKg);
        } else if (name.includes('פרימיום') || name.includes('premium') || name.includes('מיושן')) {
            priceAnalysis.premium.push(product.pricePerKg);
        } else {
            priceAnalysis.regular.push(product.pricePerKg);
        }
    }
    
    console.log("📈 Price Ranges by Grade:");
    for (const [grade, prices] of Object.entries(priceAnalysis)) {
        if (prices.length > 0) {
            prices.sort((a, b) => a - b);
            const min = prices[0];
            const max = prices[prices.length - 1];
            const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
            
            console.log(`   ${grade}: ${prices.length} products, ₪${min.toFixed(0)}-${max.toFixed(0)}/kg (avg: ₪${avg.toFixed(0)})`);
        }
    }
    console.log("");
    
    return priceAnalysis;
}

// Generate classification suggestions
function generateClassificationSuggestions(products, gradeFindings) {
    console.log("💡 Generating enhanced classification suggestions...");
    
    const suggestions = {
        newMappings: {},
        gradePatterns: {},
        confidenceIssues: []
    };
    
    // Find products with low confidence that need manual review
    const lowConfidenceProducts = products.filter(p => p.isValid && p.confidence < 0.7);
    
    console.log(`🔍 Found ${lowConfidenceProducts.length} products with low confidence (<0.7):`);
    for (const product of lowConfidenceProducts.slice(0, 5)) {
        console.log(`   • ${product.name} (confidence: ${product.confidence})`);
        suggestions.confidenceIssues.push(product.name);
    }
    if (lowConfidenceProducts.length > 5) {
        console.log(`   ... and ${lowConfidenceProducts.length - 5} more`);
    }
    console.log("");
    
    // Generate grade patterns from findings
    const topGrades = Object.entries(gradeFindings)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
    
    console.log("🎯 Recommended grade classification system:");
    for (const [grade, count] of topGrades) {
        console.log(`   ${grade}: ${count} products found`);
        suggestions.gradePatterns[grade] = count;
    }
    console.log("");
    
    return suggestions;
}

// Main analysis function
async function analyzeCurrentState() {
    try {
        console.log("🚀 Starting comprehensive data analysis...\n");
        
        // Load data
        const { meatMapping, normalizedCuts } = loadCurrentMappings();
        const { allProducts, siteStats } = loadScrapedData();
        
        // Analyze patterns
        const { gradeFindings, gradeExamples } = analyzeGradeVariations(allProducts);
        const { cutDistribution, cutExamples } = analyzeBaseCuts(allProducts, normalizedCuts);
        const priceAnalysis = analyzePricingPatterns(allProducts);
        const suggestions = generateClassificationSuggestions(allProducts, gradeFindings);
        
        // Generate summary report
        console.log("📋 ANALYSIS SUMMARY:");
        console.log(`   Total products analyzed: ${allProducts.filter(p => p.isValid).length}`);
        console.log(`   Sites active: ${Object.keys(siteStats).length}`);
        console.log(`   Grade variations found: ${Object.keys(gradeFindings).length}`);
        console.log(`   Base cuts identified: ${Object.keys(cutDistribution).filter(cut => cut !== 'unknown').length}`);
        console.log(`   Products needing manual review: ${suggestions.confidenceIssues.length}`);
        
        console.log("\n🎯 NEXT STEPS:");
        console.log("1. Create enhanced mapping files with multi-tier classification");
        console.log("2. Implement grade separation (Regular/Angus/Wagyu/Veal)");
        console.log("3. Add auto-learning mechanism for new patterns");
        console.log("4. Update meat-normalizer.js with enhanced capabilities");
        console.log("5. Deploy system to existing sites for testing");
        
        // Save analysis results
        const analysisResults = {
            timestamp: new Date().toISOString(),
            totalProducts: allProducts.filter(p => p.isValid).length,
            siteStats,
            gradeFindings,
            gradeExamples,
            cutDistribution: Object.fromEntries(
                Object.entries(cutDistribution)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 20)
            ),
            priceAnalysis,
            suggestions
        };
        
        fs.writeFileSync('analysis_results.json', JSON.stringify(analysisResults, null, 2));
        console.log("\n💾 Analysis results saved to analysis_results.json");
        
        return analysisResults;
        
    } catch (error) {
        console.error("❌ Analysis failed:", error.message);
        process.exit(1);
    }
}

// Run analysis if called directly
if (require.main === module) {
    analyzeCurrentState();
}

module.exports = { analyzeCurrentState };