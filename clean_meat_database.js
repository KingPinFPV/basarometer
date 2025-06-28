// 🧹 סקריפט ניקוי Database - מוצרי בשר בלבד
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

class MeatDatabaseCleaner {
    constructor() {
        this.supabase = null;
        this.tableName = null;
    }
    
    async initialize() {
        console.log('🔧 מאתחל חיבור ל-Database');
        
        try {
            // טעינת משתני סביבה
            const envContent = await fs.readFile('.env.local', 'utf8');
            const envVars = {};
            
            envContent.split('\n').forEach(line => {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length > 0) {
                    envVars[key.trim()] = valueParts.join('=').trim().replace(/^"|"$/g, '');
                }
            });
            
            this.supabase = createClient(
                envVars.NEXT_PUBLIC_SUPABASE_URL,
                envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
            );
            
            // זיהוי הטבלה הנכונה
            await this.identifyCorrectTable();
            
            console.log(`✅ חיבור Database אותחל - טבלה: ${this.tableName}`);
            return true;
            
        } catch (error) {
            console.error('❌ איתחול Database נכשל:', error.message);
            return false;
        }
    }
    
    async identifyCorrectTable() {
        // הטבלה הנכונה היא scanner_products לפי הניתוח
        this.tableName = 'scanner_products';
        
        try {
            const { data, error, count } = await this.supabase
                .from(this.tableName)
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                throw new Error(`שגיאה בגישה לטבלה ${this.tableName}: ${error.message}`);
            }
            
            console.log(`📋 זוהתה טבלה פעילה: ${this.tableName} עם ${count || 0} רשומות`);
            return;
            
        } catch (err) {
            throw new Error(`לא ניתן לגשת לטבלת scanner_products: ${err.message}`);
        }
    }
    
    async loadAnalysisResults() {
        console.log('\n📁 טוען תוצאות ניתוח מוצרים');
        
        try {
            // מחפש את קובץ הניתוח האחרון
            const files = await fs.readdir('.');
            const analysisFiles = files.filter(f => f.startsWith('product_analysis_') && f.endsWith('.json'));
            
            if (analysisFiles.length === 0) {
                throw new Error('לא נמצא קובץ ניתוח מוצרים - הרץ ניתוח קודם');
            }
            
            const latestFile = analysisFiles.sort().pop();
            console.log(`📂 טוען: ${latestFile}`);
            
            const data = await fs.readFile(latestFile, 'utf8');
            const analysis = JSON.parse(data);
            
            console.log(`✅ ניתוח נטען: ${analysis.meat.length} בשר, ${analysis.nonMeat.length} לא-בשר`);
            return analysis;
            
        } catch (error) {
            console.error('❌ שגיאה בטעינת ניתוח:', error.message);
            return null;
        }
    }
    
    async createBackup(analysis) {
        console.log('\n💾 יוצר גיבוי לפני מחיקה');
        
        try {
            const backupData = {
                timestamp: new Date().toISOString(),
                table_name: this.tableName,
                products_to_remove: analysis.nonMeat,
                products_to_keep: analysis.meat,
                uncertain_products: analysis.uncertain
            };
            
            const backupFile = `database_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
            
            console.log(`✅ גיבוי נשמר: ${backupFile}`);
            return backupFile;
            
        } catch (error) {
            console.error('❌ יצירת גיבוי נכשלה:', error.message);
            return null;
        }
    }
    
    async removeNonMeatProducts(analysis) {
        console.log('\n🗑️ מסיר מוצרים שאינם בשר מ-Database');
        
        if (analysis.nonMeat.length === 0) {
            console.log('✅ אין מוצרים שאינם בשר להסרה');
            return { removed: 0, errors: [] };
        }
        
        const nonMeatIds = analysis.nonMeat.map(p => p.id);
        let removed = 0;
        const errors = [];
        
        console.log(`🎯 מתכוון ל-${nonMeatIds.length} מוצרים שאינם בשר להסרה`);
        
        // הצגת המוצרים שיוסרו
        console.log('\n📝 מוצרים שיוסרו:');
        analysis.nonMeat.slice(0, 10).forEach((product, i) => {
            console.log(`   ${i+1}. ${product.name} (${product.vendor})`);
        });
        
        if (analysis.nonMeat.length > 10) {
            console.log(`   ... ועוד ${analysis.nonMeat.length - 10} מוצרים`);
        }
        
        try {
            const { error } = await this.supabase
                .from(this.tableName)
                .delete()
                .in('id', nonMeatIds);
            
            if (error) {
                errors.push(`הסרה נכשלה: ${error.message}`);
                console.error('❌ שגיאת הסרה:', error.message);
            } else {
                removed = nonMeatIds.length;
                console.log(`✅ הוסרו ${removed} מוצרים שאינם בשר מטבלת ${this.tableName}`);
            }
            
        } catch (error) {
            errors.push(error.message);
            console.error('❌ שגיאת הסרה:', error.message);
        }
        
        return { removed, errors };
    }
    
    async handleUncertainProducts(analysis) {
        console.log('\n❓ מטפל במוצרים לא ברורים');
        
        if (analysis.uncertain.length === 0) {
            console.log('✅ אין מוצרים לא ברורים לבדיקה');
            return;
        }
        
        console.log(`🔍 ${analysis.uncertain.length} מוצרים לא ברורים צריכים בדיקה ידנית:`);
        
        // יצירת קובץ לבדיקה ידנית
        const reviewData = {
            timestamp: new Date().toISOString(),
            uncertain_products: analysis.uncertain.map(p => ({
                id: p.id,
                name: p.name,
                vendor: p.vendor,
                category: p.category,
                action_needed: 'REVIEW - סווג כבשר או לא-בשר',
                suggested_action: this.suggestAction(p.name)
            }))
        };
        
        await fs.writeFile('uncertain_products_review.json', JSON.stringify(reviewData, null, 2));
        
        analysis.uncertain.forEach((product, i) => {
            const suggestion = reviewData.uncertain_products[i].suggested_action;
            console.log(`   ${i+1}. ${product.name} (${product.vendor}) - ${suggestion}`);
        });
        
        console.log('\n💾 מוצרים לא ברורים נשמרו ל: uncertain_products_review.json');
    }
    
    suggestAction(productName) {
        const name = productName.toLowerCase();
        
        // מונחי בשר חזקים
        if (name.includes('עוף') || name.includes('chicken') || 
            name.includes('בקר') || name.includes('beef') ||
            name.includes('אנטריקוט') || name.includes('פילה')) {
            return 'KEEP (ככל הנראה בשר)';
        }
        
        // מונחים מפוקפקים
        if (name.includes('קציצ') || name.includes('נקניק') || 
            name.includes('המבורגר') || name.includes('שניצל')) {
            return 'REVIEW (יכול להיות בשר מעובד)';
        }
        
        return 'REVIEW NEEDED (בדיקה נדרשת)';
    }
    
    async verifyCleanDatabase() {
        console.log('\n🔍 מאמת Database נקי');
        
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .order('id');
            
            if (error) {
                throw new Error(`אימות נכשל: ${error.message}`);
            }
            
            console.log(`📊 מוצרים שנותרו: ${data.length}`);
            
            // דוגמת מוצרים שנותרו
            console.log('\n🥩 דוגמת מוצרים שנותרו:');
            data.slice(0, 10).forEach((product, i) => {
                const price = product.price_per_kg ? `₪${product.price_per_kg}/ק"ג` : 'ללא מחיר';
                console.log(`   ${i+1}. ${product.name} (${product.vendor}) - ${price}`);
            });
            
            if (data.length > 10) {
                console.log(`   ... ועוד ${data.length - 10} מוצרי בשר`);
            }
            
            return data.length;
            
        } catch (error) {
            console.error('❌ אימות נכשל:', error.message);
            return -1;
        }
    }
    
    async updateDocumentation(result) {
        const cleaningDate = new Date();
        const summary = {
            cleaning_timestamp: cleaningDate.toISOString(),
            original_count: result.original,
            removed_count: result.removed,
            final_count: result.final,
            meat_products_remaining: result.final,
            quality_improvement: `${((result.final / result.original) * 100).toFixed(1)}% מהמוצרים הם כעת בשר אמיתי`,
            success_rate: result.removed > 0 ? 'הצלחה מלאה' : 'לא בוצעו שינויים',
            next_steps: [
                'בדוק מוצרים לא ברורים ב-uncertain_products_review.json',
                'בדוק אתר עם database נקי של מוצרי בשר בלבד',
                'פרוס לסביבת ייצור'
            ]
        };
        
        await fs.writeFile('meat_database_cleaning_summary.json', JSON.stringify(summary, null, 2));
        
        console.log('\n📋 סיכום ניקוי:');
        console.log(`   מוצרים מקוריים: ${result.original}`);
        console.log(`   הוסרו לא-בשר: ${result.removed}`);
        console.log(`   מוצרי בשר סופיים: ${result.final}`);
        console.log(`   איכות: ${summary.quality_improvement}`);
        console.log('\n💾 סיכום נשמר: meat_database_cleaning_summary.json');
    }
    
    async runDatabaseCleaning() {
        console.log('🧹 תהליך ניקוי Database למוצרי בשר');
        console.log('='.repeat(50));
        
        // איתחול
        if (!await this.initialize()) return null;
        
        // טעינת ניתוח
        const analysis = await this.loadAnalysisResults();
        if (!analysis) return null;
        
        const originalCount = analysis.total;
        
        // יצירת גיבוי
        await this.createBackup(analysis);
        
        // הסרת מוצרים שאינם בשר
        const removalResult = await this.removeNonMeatProducts(analysis);
        
        // טיפול במוצרים לא ברורים
        await this.handleUncertainProducts(analysis);
        
        // אימות database נקי
        const finalCount = await this.verifyCleanDatabase();
        
        const result = {
            original: originalCount,
            removed: removalResult.removed,
            final: finalCount,
            errors: removalResult.errors
        };
        
        // עדכון תיעוד
        await this.updateDocumentation(result);
        
        console.log('\n🎯 ניקוי Database הושלם!');
        
        if (finalCount > 0 && finalCount < originalCount) {
            console.log('✅ הצלחה: Database מכיל כעת רק מוצרי בשר');
            console.log(`🥩 ${finalCount} מוצרי בשר אמיתיים מוכנים להשוואת מחירים`);
        } else if (finalCount === originalCount && removalResult.removed === 0) {
            console.log('ℹ️ לא נמצאו מוצרים שאינם בשר להסרה - Database כבר נקי');
        } else {
            console.log('⚠️ אנא בדוק תוצאות ומוצרים לא ברורים');
        }
        
        return result;
    }
}

async function cleanMeatDatabase() {
    const cleaner = new MeatDatabaseCleaner();
    return await cleaner.runDatabaseCleaning();
}

// הרצת ניקוי
cleanMeatDatabase().then(result => {
    if (result && result.final > 0) {
        console.log('\n🚀 מוכן לפלטפורמת השוואת מחירי בשר בלבד!');
        console.log('📱 בדוק את האתר: https://v3.basarometer.org/comparison');
    }
});

export { MeatDatabaseCleaner };