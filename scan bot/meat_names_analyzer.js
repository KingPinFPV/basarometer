import { promises as fs } from 'fs';

class MeatNamesAnalyzer {
    async analyzeMeatMapping() {
        console.log('🥩 Analyzing Meat Names Mapping Database');
        console.log('='.repeat(50));
        
        try {
            // Load the meat names mapping
            const mappingData = await fs.readFile('meat_names_mapping.json', 'utf8');
            const meatMapping = JSON.parse(mappingData);
            
            console.log('📊 Meat Names Database Analysis:');
            console.log(`   File size: ${mappingData.length} characters`);
            console.log(`   Structure type: ${typeof meatMapping}`);
            
            if (Array.isArray(meatMapping)) {
                console.log(`   Total entries: ${meatMapping.length}`);
                
                // Analyze structure of entries
                if (meatMapping.length > 0) {
                    console.log('   Sample entry structure:');
                    console.log('  ', JSON.stringify(meatMapping[0], null, 4));
                    
                    // Analyze entry types
                    const keys = Object.keys(meatMapping[0] || {});
                    console.log(`   Entry keys: ${keys.join(', ')}`);
                }
                
            } else if (typeof meatMapping === 'object') {
                const categories = Object.keys(meatMapping);
                console.log(`   Categories: ${categories.length}`);
                console.log(`   Categories list: ${categories.slice(0, 10).join(', ')}`);
                
                // Analyze each category
                categories.forEach(category => {
                    const items = meatMapping[category];
                    if (Array.isArray(items)) {
                        console.log(`   ${category}: ${items.length} items`);
                        if (items.length > 0) {
                            console.log(`     Sample: ${items.slice(0, 3).join(', ')}`);
                        }
                    }
                });
            }
            
            // Extract all meat terms for pattern matching
            const allMeatTerms = this.extractAllMeatTerms(meatMapping);
            console.log(`\n🔍 Extracted ${allMeatTerms.length} total meat terms for matching`);
            
            // Show sample terms
            console.log('   Sample Hebrew terms:', allMeatTerms.filter(term => /[\u0590-\u05FF]/.test(term)).slice(0, 10));
            console.log('   Sample English terms:', allMeatTerms.filter(term => /^[a-zA-Z]/.test(term)).slice(0, 10));
            
            // Save processed terms for extraction
            const extractionTerms = {
                all_terms: allMeatTerms,
                hebrew_terms: allMeatTerms.filter(term => /[\u0590-\u05FF]/.test(term)),
                english_terms: allMeatTerms.filter(term => /^[a-zA-Z]/.test(term)),
                mixed_terms: allMeatTerms.filter(term => /[\u0590-\u05FF]/.test(term) && /[a-zA-Z]/.test(term))
            };
            
            await fs.writeFile('extraction_terms.json', JSON.stringify(extractionTerms, null, 2));
            console.log('📁 Extraction terms saved to: extraction_terms.json');
            
            return extractionTerms;
            
        } catch (error) {
            console.error('❌ Error analyzing meat mapping:', error.message);
            return null;
        }
    }
    
    extractAllMeatTerms(meatMapping) {
        const allTerms = new Set();
        
        const addTerm = (term) => {
            if (term && typeof term === 'string' && term.trim().length > 1) {
                allTerms.add(term.trim().toLowerCase());
            }
        };
        
        const processValue = (value) => {
            if (typeof value === 'string') {
                addTerm(value);
                // Also add individual words from multi-word terms
                const words = value.split(/[\s\-\/]+/);
                words.forEach(word => {
                    if (word.length > 2) {
                        addTerm(word);
                    }
                });
            } else if (Array.isArray(value)) {
                value.forEach(item => processValue(item));
            } else if (typeof value === 'object' && value !== null) {
                Object.values(value).forEach(item => processValue(item));
            }
        };
        
        if (Array.isArray(meatMapping)) {
            meatMapping.forEach(entry => processValue(entry));
        } else if (typeof meatMapping === 'object') {
            Object.values(meatMapping).forEach(category => processValue(category));
        }
        
        return Array.from(allTerms);
    }
}

async function analyzeMeatNames() {
    const analyzer = new MeatNamesAnalyzer();
    return await analyzer.analyzeMeatMapping();
}

// Run analysis
analyzeMeatNames().then(result => {
    if (result) {
        console.log('\n✅ Meat names analysis complete');
        console.log(`🎯 Ready for enhanced extraction with ${result.all_terms.length} terms`);
    }
});

export { MeatNamesAnalyzer };