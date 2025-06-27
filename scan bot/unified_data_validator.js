import fs from 'fs/promises';
import path from 'path';

class UnifiedDataValidator {
    async validateUnifiedData() {
        console.log('🔍 Validating Unified Dataset');
        console.log('========================================');
        
        try {
            // Find the latest unified products file
            const unifiedDir = './unified_output';
            const files = await fs.readdir(unifiedDir);
            const productFiles = files.filter(f => f.includes('unified-products') && f.endsWith('.json'));
            
            if (productFiles.length === 0) {
                console.log('❌ No unified product files found');
                return null;
            }
            
            const latestFile = productFiles.sort().pop();
            const filePath = path.join(unifiedDir, latestFile);
            
            console.log(`📁 Loading: ${latestFile}`);
            
            const data = await fs.readFile(filePath, 'utf8');
            const products = JSON.parse(data);
            
            console.log(`\n📊 Dataset Overview:`);
            console.log(`   Total products: ${products.length}`);
            
            // Analyze by source
            const bySources = products.reduce((acc, product) => {
                const source = product.data_source || product.source || 'unknown';
                acc[source] = (acc[source] || 0) + 1;
                return acc;
            }, {});
            
            console.log(`   Sources breakdown:`);
            Object.entries(bySources).forEach(([source, count]) => {
                console.log(`     ${source}: ${count} products`);
            });
            
            // Analyze by vendor
            const byVendors = products.reduce((acc, product) => {
                const vendor = product.vendor || 'unknown';
                acc[vendor] = (acc[vendor] || 0) + 1;
                return acc;
            }, {});
            
            console.log(`   Vendors breakdown:`);
            Object.entries(byVendors).forEach(([vendor, count]) => {
                console.log(`     ${vendor}: ${count} products`);
            });
            
            // Quality checks
            const withPrices = products.filter(p => p.price && p.price > 0).length;
            const withNames = products.filter(p => p.name && p.name.trim().length > 3).length;
            const meatProducts = products.filter(p => 
                p.name && (p.name.includes('בשר') || p.name.includes('עוף') || p.name.includes('בקר'))
            ).length;
            
            console.log(`\n✅ Quality Metrics:`);
            console.log(`   Products with prices: ${withPrices}/${products.length} (${(withPrices/products.length*100).toFixed(1)}%)`);
            console.log(`   Products with names: ${withNames}/${products.length} (${(withNames/products.length*100).toFixed(1)}%)`);
            console.log(`   Meat products: ${meatProducts}/${products.length} (${(meatProducts/products.length*100).toFixed(1)}%)`);
            
            // Sample products
            console.log(`\n🥩 Sample Products:`);
            products.slice(0, 5).forEach((product, i) => {
                console.log(`   ${i+1}. ${product.name} - ${product.price}₪ (${product.vendor})`);
            });
            
            // Create website-ready format
            const websiteFormat = products.map(product => ({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: product.name,
                price: parseFloat(product.price) || 0,
                vendor: product.vendor,
                category: product.category || 'בשר',
                unit: product.unit || 'ק"ג',
                image_url: product.image_url || '/images/default-meat.jpg',
                source: product.data_source || product.source,
                last_updated: new Date().toISOString(),
                created_at: new Date().toISOString()
            }));
            
            // Save website-ready format
            const websiteFile = path.join(unifiedDir, 'website-ready-products.json');
            await fs.writeFile(websiteFile, JSON.stringify(websiteFormat, null, 2));
            
            console.log(`\n💾 Website-ready format saved: ${websiteFile}`);
            console.log(`🚀 Ready for V6.0 integration with ${websiteFormat.length} products!`);
            
            return {
                products: websiteFormat,
                totalCount: products.length,
                sources: bySources,
                vendors: byVendors,
                qualityMetrics: {
                    withPrices,
                    withNames,
                    meatProducts
                }
            };
            
        } catch (error) {
            console.error('❌ Validation error:', error.message);
            return null;
        }
    }
}

async function runValidation() {
    const validator = new UnifiedDataValidator();
    return await validator.validateUnifiedData();
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    runValidation().then(result => {
        if (result) {
            console.log('\n✅ Validation complete - ready for website integration!');
        } else {
            console.log('\n❌ Validation failed - check data pipeline');
        }
    });
}