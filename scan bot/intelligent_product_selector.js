import fs from 'fs/promises';
import path from 'path';

class IntelligentProductSelector {
    constructor() {
        this.qualityWeights = {
            price_validity: 0.25,      // Has realistic price
            name_quality: 0.20,        // Good name quality
            vendor_known: 0.15,        // Known vendor
            extraction_method: 0.15,   // Reliable extraction method
            completeness: 0.15,        // Complete data fields
            uniqueness: 0.10          // Unique product
        };
        
        this.knownVendors = [
            'rami levy', 'רמי לוי', 'victory', 'ויקטורי', 
            'shufersal', 'שופרסל', 'mega', 'מגה',
            'carrefour', 'קרפור', 'tiv taam', 'טיב טעם'
        ];
        
        this.premiumKeywords = [
            'אנטרקוט', 'פילה', 'מעדן', 'פרמיום', 'אורגני',
            'entrecote', 'fillet', 'premium', 'organic', 'wagyu',
            'אנגוס', 'angus', 'טלה', 'lamb', 'עגל', 'veal'
        ];
    }
    
    async loadGovernmentProducts() {
        console.log('📦 Loading Enhanced Government Products');
        
        try {
            // Find the latest file
            const files = await fs.readdir('.');
            const govFiles = files.filter(f => f.startsWith('enhanced_government_products_') && f.endsWith('.json'));
            
            if (govFiles.length === 0) {
                throw new Error('No enhanced government products file found');
            }
            
            const latestFile = govFiles.sort().pop();
            console.log(`📁 Loading: ${latestFile}`);
            
            const data = await fs.readFile(latestFile, 'utf8');
            const products = JSON.parse(data);
            
            console.log(`✅ Loaded ${products.length} government products`);
            
            return products;
            
        } catch (error) {
            console.error('❌ Error loading government products:', error.message);
            return [];
        }
    }
    
    calculateProductScore(product) {
        let score = 0;
        const scores = {};
        
        // Price validity (0-100)
        const price = parseFloat(product.price);
        if (price && price > 0 && price < 1000) {
            if (price >= 15 && price <= 300) {
                scores.price_validity = 100; // Realistic meat price range
            } else if (price > 0 && price < 15) {
                scores.price_validity = 60;  // Cheap but possible
            } else {
                scores.price_validity = 30;  // Expensive but possible
            }
        } else {
            scores.price_validity = 0; // Invalid price
        }
        
        // Name quality (0-100)
        const name = product.name || '';
        if (name.length >= 5 && name.length <= 80) {
            scores.name_quality = 80;
            
            // Bonus for premium keywords
            if (this.premiumKeywords.some(keyword => name.toLowerCase().includes(keyword.toLowerCase()))) {
                scores.name_quality += 20;
            }
        } else if (name.length > 0) {
            scores.name_quality = 40;
        } else {
            scores.name_quality = 0;
        }
        
        // Known vendor (0-100)
        const vendor = (product.vendor || '').toLowerCase();
        if (this.knownVendors.some(known => vendor.includes(known))) {
            scores.vendor_known = 100;
        } else if (vendor.length > 0) {
            scores.vendor_known = 50;
        } else {
            scores.vendor_known = 0;
        }
        
        // Extraction method reliability (0-100)
        const method = product.extraction_method || '';
        const methodScores = {
            'structured_parsing': 100,
            'term_search': 80,
            'price_detection': 70,
            'text_mining': 60,
            'attr_search': 50
        };
        scores.extraction_method = methodScores[method] || 30;
        
        // Data completeness (0-100)
        const fields = ['name', 'price', 'vendor', 'category', 'source'];
        const completedFields = fields.filter(field => product[field] && String(product[field]).trim().length > 0);
        scores.completeness = (completedFields.length / fields.length) * 100;
        
        // Uniqueness (basic implementation - 0-100)
        scores.uniqueness = name.length > 10 ? 80 : 60; // Longer names tend to be more specific
        
        // Calculate weighted score
        for (const [metric, weight] of Object.entries(this.qualityWeights)) {
            score += (scores[metric] || 0) * weight;
        }
        
        return {
            total_score: Math.round(score),
            breakdown: scores,
            product: product
        };
    }
    
    selectTop50Products(products) {
        console.log('\n🎯 Selecting Top 50 Products');
        
        // Calculate scores for all products
        const scoredProducts = products.map(product => this.calculateProductScore(product));
        
        // Sort by score (highest first)
        scoredProducts.sort((a, b) => b.total_score - a.total_score);
        
        // Remove duplicates by name similarity
        const uniqueProducts = this.removeSimilarProducts(scoredProducts);
        
        // Select top 50
        const top50 = uniqueProducts.slice(0, 50);
        
        console.log(`📊 Selection Results:`);
        console.log(`   Scored products: ${scoredProducts.length}`);
        console.log(`   After deduplication: ${uniqueProducts.length}`);
        console.log(`   Top 50 selected: ${top50.length}`);
        
        // Show score distribution
        const scoreRanges = {
            'Excellent (80-100)': top50.filter(p => p.total_score >= 80).length,
            'Good (60-79)': top50.filter(p => p.total_score >= 60 && p.total_score < 80).length,
            'Fair (40-59)': top50.filter(p => p.total_score >= 40 && p.total_score < 60).length,
            'Poor (0-39)': top50.filter(p => p.total_score < 40).length
        };
        
        console.log(`\n📈 Quality Distribution:`);
        Object.entries(scoreRanges).forEach(([range, count]) => {
            console.log(`   ${range}: ${count} products`);
        });
        
        return top50;
    }
    
    removeSimilarProducts(scoredProducts) {
        const unique = [];
        const seen = new Set();
        
        for (const scoredProduct of scoredProducts) {
            const name = scoredProduct.product.name || '';
            const normalizedName = name.toLowerCase()
                .replace(/\s+/g, ' ')
                .replace(/[^\u0590-\u05FF\u0041-\u005A\u0061-\u007A\s]/g, '')
                .trim();
            
            // Create similarity key (first 20 chars)
            const similarityKey = normalizedName.substring(0, 20);
            
            if (!seen.has(similarityKey) && normalizedName.length > 3) {
                seen.add(similarityKey);
                unique.push(scoredProduct);
            }
        }
        
        return unique;
    }
    
    async saveTop50Products(top50) {
        console.log('\n💾 Saving Top 50 Products');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Extract just the products
        const products = top50.map(scored => ({
            ...scored.product,
            quality_score: scored.total_score,
            score_breakdown: scored.breakdown,
            selected_at: new Date().toISOString()
        }));
        
        // Save top 50 products
        const top50File = `top_50_government_products_${timestamp}.json`;
        await fs.writeFile(top50File, JSON.stringify(products, null, 2));
        
        // Save detailed analysis
        const analysisFile = `top_50_analysis_${timestamp}.json`;
        await fs.writeFile(analysisFile, JSON.stringify(top50, null, 2));
        
        // Create website-ready format
        const websiteFormat = products.map((product, index) => ({
            id: `gov_${Date.now()}_${index}`,
            name: product.name,
            price: parseFloat(product.price) || 0,
            vendor: product.vendor || 'ממשלתי',
            category: product.category || 'בשר',
            unit: product.unit || 'ק"ג',
            image_url: '/images/default-meat.jpg',
            source: 'government_top50',
            quality_score: product.quality_score,
            last_updated: new Date().toISOString(),
            created_at: new Date().toISOString()
        }));
        
        const websiteFile = `top_50_website_ready_${timestamp}.json`;
        await fs.writeFile(websiteFile, JSON.stringify(websiteFormat, null, 2));
        
        console.log(`✅ Files saved:`);
        console.log(`   Products: ${top50File}`);
        console.log(`   Analysis: ${analysisFile}`);
        console.log(`   Website-ready: ${websiteFile}`);
        
        // Show top 10 products
        console.log(`\n🥇 Top 10 Selected Products:`);
        products.slice(0, 10).forEach((product, i) => {
            console.log(`   ${i+1}. ${product.name} - ${product.price}₪ (${product.vendor}) [Score: ${product.quality_score}]`);
        });
        
        return websiteFormat;
    }
    
    async runSelection() {
        console.log('🥇 Intelligent Product Selection System');
        console.log('='.repeat(50));
        
        // Load products
        const products = await this.loadGovernmentProducts();
        if (products.length === 0) {
            console.log('❌ No products to process');
            return null;
        }
        
        // Select top 50
        const top50 = this.selectTop50Products(products);
        
        // Save results
        const websiteProducts = await this.saveTop50Products(top50);
        
        console.log(`\n🎯 Selection Complete!`);
        console.log(`📊 Selected: ${websiteProducts.length}/50 products`);
        console.log(`🚀 Ready for integration with 39 existing web products`);
        console.log(`📈 Total platform capacity: ${39 + websiteProducts.length} products`);
        
        return websiteProducts;
    }
}

async function selectTop50() {
    const selector = new IntelligentProductSelector();
    return await selector.runSelection();
}

// Run selection
selectTop50().then(result => {
    if (result && result.length > 0) {
        console.log('\n✅ Top 50 selection successful!');
        console.log('📋 Next: Integration with website system');
    }
});

export { IntelligentProductSelector };