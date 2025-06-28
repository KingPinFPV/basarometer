import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

class ProductAnalyzer {
    constructor() {
        this.meatTerms = new Set();
        this.nonMeatIndicators = [
            // לחם ומאפייה
            'לחם', 'פיתה', 'פיתות', 'לחמנייה', 'לחמניות', 'חלה', 'בגט',
            'bread', 'pita', 'baguette', 'roll', 'חמוצים',
            
            // חטיפים ומעובדים
            'פופקורן', 'חטיף', 'ביסלי', 'במבה', 'אפרופו', 'דוריטוס',
            'קנדר', 'שקדי', 'אגוזי', 'popcorn', 'snack', 'chips',
            
            // חלב וגבינות
            'גבינה', 'חלב', 'יוגורט', 'קוטג', 'קשקבל', 'עמק', 'תנובה',
            'cheese', 'milk', 'yogurt', 'cottage',
            
            // משקאות
            'קוקה', 'פפסי', 'מיץ', 'בירה', 'יין', 'ויסקי', 'וודקה',
            'cola', 'beer', 'wine', 'juice', 'water', 'drink',
            
            // ירקות ופירות
            'עגבנייה', 'מלפפון', 'בצל', 'שום', 'תפוח', 'בננה',
            'tomato', 'cucumber', 'onion', 'apple', 'banana',
            
            // אחר לא-בשר
            'אטלטיקוס', 'פרליין', 'מילקי', 'שוקולד', 'ממתק',
            'chocolate', 'candy', 'sweet', 'dessert', 'כסא', 'רהיט'
        ];
    }
    
    async loadMeatTerms() {
        console.log('🥩 טוען מונחי בשר מ-meat_names_mapping.json');
        
        try {
            const meatMappingPath = '../scan bot/meat_names_mapping.json';
            const mappingData = await fs.readFile(meatMappingPath, 'utf8');
            const meatMapping = JSON.parse(mappingData);
            
            this.extractMeatTermsFromMapping(meatMapping);
            
            console.log(`✅ נטענו ${this.meatTerms.size} מונחי בשר`);
            return true;
            
        } catch (error) {
            console.error('❌ שגיאה בטעינת מונחי בשר:', error.message);
            // מונחי בשר בסיסיים כגיבוי - כולל קטגוריות עיקריות
            const basicMeatTerms = [
                'בשר', 'בקר', 'עוף', 'טלה', 'כבש', 'עגל', 'הודו', 'חזיר',
                'meat', 'beef', 'chicken', 'lamb', 'veal', 'turkey', 'pork',
                'אנטריקוט', 'פילה', 'סינטה', 'פרגית', 'חזה', 'שוק', 'כתף',
                'קבב', 'המבורגר', 'נקניק', 'שניצל', 'קציצות', 'נתחים',
                'כנפיים', 'שוקיים', 'ירכיים', 'לבבות', 'נקניקיות',
                'סטייק', 'סלמון', 'טונה', 'דג', 'fish', 'salmon', 'tuna'
            ];
            basicMeatTerms.forEach(term => this.meatTerms.add(term.toLowerCase()));
            return false;
        }
    }
    
    extractMeatTermsFromMapping(mapping) {
        const extractTerms = (data) => {
            if (Array.isArray(data)) {
                data.forEach(item => {
                    if (typeof item === 'string' && item.trim().length > 0) {
                        this.meatTerms.add(item.toLowerCase().trim());
                    }
                });
            } else if (typeof data === 'object' && data !== null) {
                Object.values(data).forEach(value => extractTerms(value));
            }
        };
        
        extractTerms(mapping);
    }
    
    async getCurrentProducts() {
        console.log('\n📦 מביא מוצרים נוכחיים מ-database');
        
        try {
            const envContent = await fs.readFile('.env.local', 'utf8');
            const envVars = {};
            
            envContent.split('\n').forEach(line => {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    envVars[key.trim()] = valueParts.join('=').trim().replace(/^"|"$/g, '');
                }
            });
            
            const supabase = createClient(
                envVars.NEXT_PUBLIC_SUPABASE_URL,
                envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
            );
            
            // מנסה טבלאות שונות
            let data, error;
            
            // קודם scanner_products
            ({ data, error } = await supabase
                .from('scanner_products')
                .select('*')
                .order('id'));
            
            if (error) {
                // אז products
                ({ data, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('id'));
            }
            
            if (error) {
                // אז unified_products
                ({ data, error } = await supabase
                    .from('unified_products')
                    .select('*')
                    .order('id'));
            }
            
            if (error) {
                throw new Error(`נכשל בהבאת מוצרים: ${error.message}`);
            }
            
            console.log(`✅ הובאו ${data.length} מוצרים מ-database`);
            return data;
            
        } catch (error) {
            console.error('❌ שגיאה בהבאת מוצרים:', error.message);
            return [];
        }
    }
    
    classifyProduct(product) {
        const name = (product.product_name || product.name || '').toLowerCase().trim();
        const category = (product.category || '').toLowerCase().trim();
        const vendor = (product.store_name || product.vendor || product.retailer || '').toLowerCase().trim();
        
        const fullText = `${name} ${category} ${vendor}`;
        
        // בדיקה ראשונה - מונחים שאינם בשר
        const isNonMeat = this.nonMeatIndicators.some(indicator => 
            fullText.includes(indicator.toLowerCase())
        );
        
        if (isNonMeat) {
            return {
                classification: 'non-meat',
                confidence: 'high',
                reason: 'מכיל מונחים שאינם בשר'
            };
        }
        
        // בדיקה שנייה - מונחי בשר
        const hasMeatTerm = Array.from(this.meatTerms).some(term => 
            fullText.includes(term)
        );
        
        if (hasMeatTerm) {
            return {
                classification: 'meat',
                confidence: 'high',
                reason: 'מכיל מונחי בשר'
            };
        }
        
        // מקרים לא ברורים
        return {
            classification: 'uncertain',
            confidence: 'low',
            reason: 'אין אינדיקטורים ברורים'
        };
    }
    
    async analyzeAllProducts() {
        console.log('\n🔍 מנתח את כל המוצרים');
        
        const products = await this.getCurrentProducts();
        if (products.length === 0) {
            console.log('❌ אין מוצרים לניתוח');
            return null;
        }
        
        const analysis = {
            total: products.length,
            meat: [],
            nonMeat: [],
            uncertain: []
        };
        
        products.forEach(product => {
            const classification = this.classifyProduct(product);
            
            const productInfo = {
                id: product.id,
                name: product.product_name || product.name || 'לא זמין',
                vendor: product.store_name || product.vendor || product.retailer || 'לא זמין',
                category: product.category || 'לא זמין',
                price_per_kg: product.price_per_kg,
                classification: classification
            };
            
            switch (classification.classification) {
                case 'meat':
                    analysis.meat.push(productInfo);
                    break;
                case 'non-meat':
                    analysis.nonMeat.push(productInfo);
                    break;
                case 'uncertain':
                    analysis.uncertain.push(productInfo);
                    break;
            }
        });
        
        return analysis;
    }
    
    async generateAnalysisReport(analysis) {
        console.log('\n📊 דוח ניתוח סיווג מוצרים');
        console.log('='.repeat(50));
        
        console.log(`📦 סך כל המוצרים: ${analysis.total}`);
        console.log(`🥩 מוצרי בשר: ${analysis.meat.length}`);
        console.log(`🚫 מוצרים שאינם בשר: ${analysis.nonMeat.length}`);
        console.log(`❓ מוצרים לא ברורים: ${analysis.uncertain.length}`);
        
        if (analysis.nonMeat.length > 0) {
            console.log('\n🚫 מוצרים שנמצאו כלא-בשר:');
            analysis.nonMeat.forEach((product, i) => {
                console.log(`   ${i+1}. ${product.name} (${product.vendor}) - ${product.classification.reason}`);
            });
        }
        
        if (analysis.uncertain.length > 0) {
            console.log('\n❓ מוצרים לא ברורים (צריכים בדיקה ידנית):');
            analysis.uncertain.forEach((product, i) => {
                console.log(`   ${i+1}. ${product.name} (${product.vendor})`);
            });
        }
        
        console.log('\n🥩 דוגמאות מוצרי בשר:');
        analysis.meat.slice(0, 10).forEach((product, i) => {
            console.log(`   ${i+1}. ${product.name} (${product.vendor}) - ₪${product.price_per_kg || 'N/A'}/ק"ג`);
        });
        
        // שמירת ניתוח מפורט
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportFile = `product_analysis_${timestamp}.json`;
        await fs.writeFile(reportFile, JSON.stringify(analysis, null, 2));
        
        console.log(`\n💾 ניתוח מפורט נשמר: ${reportFile}`);
        
        return analysis;
    }
    
    async runAnalysis() {
        console.log('🔍 ניתוח מוצרים וסינון בשר');
        console.log('='.repeat(50));
        
        // טעינת מונחי בשר
        await this.loadMeatTerms();
        
        // ניתוח כל המוצרים
        const analysis = await this.analyzeAllProducts();
        if (!analysis) return null;
        
        // יצירת דוח
        await this.generateAnalysisReport(analysis);
        
        console.log('\n🎯 ניתוח הושלם!');
        console.log(`💡 המלצה: הסר ${analysis.nonMeat.length} מוצרים שאינם בשר`);
        console.log(`🥩 השאר ${analysis.meat.length} מוצרי בשר אמיתיים`);
        
        return analysis;
    }
}

async function analyzeProducts() {
    const analyzer = new ProductAnalyzer();
    return await analyzer.runAnalysis();
}

// הרצת הניתוח
analyzeProducts().then(result => {
    if (result) {
        console.log('\n✅ ניתוח מוצרים הושלם');
        console.log('📋 מוכן לסינון מוצרים שאינם בשר');
    }
});

export { ProductAnalyzer };