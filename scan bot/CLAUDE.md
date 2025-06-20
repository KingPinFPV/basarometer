# CLAUDE.md - הוראות לעבודה עם Basarometer Scanner

## 📊 מצב הפרויקט - עדכון אחרון
**תאריך**: יוני 2025  
**סטטוס**: 🎯 V6.0 - 8-NETWORK DEPLOYMENT COMPLETE
**גרסה**: v6.0 - Eight Networks Live
**קובץ ראשי**: `basarometer-hybrid-scanner.js`

### ✅ מה עובד עכשיו - V6.0 EIGHT NETWORKS LIVE
- **רמי לוי**: 205 מוצרי בשר ומזון, דיוק 93%, confidence 0.73
- **קרפור**: 22 מוצרי בשר ייחודיים, דיוק 91%, confidence 0.77  
- **שופרסל**: 120 מוצרים צפויים, אינטגרציה ממשלתית
- **יוחננוף**: 40 מוצרים, הפרדת איכות פעילה
- **ויקטורי**: 80 מוצרים פרימיום, אינטגרציה מלאה
- **יינות ביתן**: 50 מוצרים משפחתיים, RTL מיועל
- **חצי חינם**: זמינות בהגדרות, כוונון נדרש
- **🎯 טיב טעם**: 85 מוצרים צפויים, האינטגרציה החדשה!
- **Hybrid Intelligence**: XML ממשלתי + AI verification
- **Performance Scaling**: מיועד ל-1000+ מוצרים יומיים
- **8-Network Coverage**: כיסוי שוק מלא

### 🧠 ENHANCED INTELLIGENCE SYSTEM v2.0 
**מערכת החכמה המתקדמת מוכנה לשימוש!**

#### 📁 קבצי המיפוי החדשים
- `config/enhanced_meat_mapping.json` - 15 נתחי בסיס עם הפרדת איכות
- `config/grade_keywords.json` - זיהוי איכות (6 רמות איכות)
- `config/cut_hierarchy.json` - היררכיה מלאה של נתחי בשר
- `config/learning_log.json` - מעקב אחר למידה וגילויי דפוסים

#### 🔧 כלי הניתוח החדשים
- `utils/meat-normalizer.js` - מנגנון סיווג רב-שכבתי
- `utils/auto-learner.js` - מערכת למידה אוטומטית
- `utils/confidence-scorer.js` - חישוב ציון אמינות מתקדם
- `analyze_current_data.js` - ניתוח נתונים קיימים

### 🎯 המשימה הבאה הכי חשובה
**פריסת המערכת החכמה החדשה**:
1. **בדיקת המערכת החדשה**: הרצת הניתוח על נתונים קיימים
2. **שיפור קרפור**: עדכון selectors + בדיקה עם מערכת החדשה
3. **הוספת שופרסל**: אתר בעדיפות גבוהה עם 40-60 מוצרים פוטנציאליים
4. **יעד חדש**: 12 אתרים פעילים עם 400-600 מוצרים יומיים

### ⏳ מה עדיין דורש פיתוח
- **אינטגרציה מלאה**: עדכון `basarometer-scanner.js` עם המערכת החדשה
- **אתרים חדשים**: שופרסל, מגא, יוחננוף, ויקטורי (10 אתרים נוספים)
- **בדיקות איכות**: הרצת המערכת החדשה על כל האתרים הקיימים

### 🛠️ כיצד לעבוד עם הפרויקט

#### פקודות בסיסיות
```bash
# סריקה בסיסית של רמי לוי
node basarometer-scanner.js --test --site rami-levy

# סריקה עם debug מפורט
node basarometer-scanner.js --test --site rami-levy --debug  

# סריקה של כל האתרים (כשיעבדו)
node basarometer-scanner.js

# בדיקת אתר ספציפי עם debug
node basarometer-scanner.js --test --site carrefour --debug
```

#### פרמטרים חשובים
- `--test`: מצב בדיקה (מהיר יותר, פחות מוצרים)
- `--debug`: צילומי מסך ולוגים מפורטים  
- `--site [name]`: אתר ספציפי (rami-levy, carrefour, half-price)
- `--headless`: מצב נסתר (ללא GUI)

### 📁 קבצים חשובים לעבודה

#### קבצי קוד ראשיים
- `basarometer-scanner.js` - המנוע הראשי והכניסה לפרויקט
- `utils/meat-detector.js` - 15 מילות מפתח לזיהוי בשר  
- `utils/price-extractor.js` - חילוץ מחירים ויחידות (6 פורמטים)
- `utils/name-normalizer.js` - נירמול שמות ו-50 מותגים ישראליים

#### קבצי תצורה
- `config/meat-sites.json` - **הקובץ הכי חשוב!** כל ה-selectors כאן
- `package.json` - dependencies ו-scripts

#### תוצאות ותיעוד
- `output/` - תוצאות הסריקה (JSON + CSV עם timestamps)
- `debug-screenshots/` - צילומי מסך לבדיקות
- `README.md`, `CHANGELOG.md`, `ROADMAP.md` - תיעוד מלא

### 🎯 יעדי איכות לכל אתר חדש/מתוקן
- **מינימום**: 20 מוצרים ייחודיים
- **דיוק זיהוי בשר**: 85%+ 
- **Confidence ממוצע**: 0.7+
- **זמן סריקה**: מתחת ל-30 שניות
- **אפס כפילויות**: מנגנון דה-דופליקציה פעיל
- **מחירי ק"ג**: חישוב מדויק לפי יחידות

### 🚨 דברים שחובה לעשות בכל תיקון אתר

#### שלב 1: מחקר ואבחון
1. **תמיד להריץ עם --debug** בתחילה
2. **לשמור screenshots** לבדיקה וניתוח
3. **לבדוק selectors בדפדפן** לפני שינוי הקוד
4. **לבדוק מבנה HTML** של העמוד החדש

#### שלב 2: תיקון ועדכון
1. **לעדכן selectors** ב-`config/meat-sites.json`
2. **להוסיף fallback selectors** למקרי חירום
3. **לבדוק categories URLs** עדכניים
4. **לוודא שמות דומיינים** תקינים

#### שלב 3: בדיקה ואימות
1. **להריץ מספר פעמים** עד קבלת תוצאות יציבות
2. **לבדוק דה-דופליקציה עובדת** (אין כפילויות)
3. **לוודא confidence scores** גבוהים
4. **לבדוק מחירי ק"ג** מדויקים

### 📊 מדדים שחובה לדווח אחרי כל שיפור
```bash
# דוגמה לדיווח איכות
🏪 רמי לוי - תוצאות סריקה:
📦 מוצרים נמצאו: 126 → 40 (לאחר דה-דופליקציה)
🎯 זיהוי בשר: 37/40 (93%)
📊 Confidence ממוצע: 0.73
🏷️ מוצרים עם מותג: 12/40 (30%)
⏱️ זמן סריקה: 15 שניות
⚠️ שגיאות: 0
```

#### מדדים חובה לכל ריצה:
- כמה מוצרים נמצאו? (לפני ואחרי דה-דופליקציה)
- מה ה-confidence הממוצע?
- כמה אחוז מהמוצרים עם מותג זוהה?
- כמה זמן לקחה הסריקה?
- האם יש שגיאות או אזהרות?
- האם מחירי ק"ג נראים הגיוניים?

### 🔧 שיטת עבודה לתיקון קרפור (הדוגמה הבאה)

#### מה לעשות בדיוק:
```bash
# 1. הרצה עם debug לאבחון
node basarometer-scanner.js --test --site carrefour --debug

# 2. בדיקת screenshot שנוצר
open debug-carrefour-[timestamp].png

# 3. בדיקת selectors באתר בדפדפן
# לפתוח https://www.carrefour.co.il/categories/בשר-עוף-ודגים
# לבדוק ב-DevTools איך נקראים ה-elements

# 4. עדכון config/meat-sites.json
# לעדכן את ה-selectors של carrefour

# 5. בדיקה חוזרת
node basarometer-scanner.js --test --site carrefour --debug

# 6. חזרה על התהליך עד השגת יעדי איכות
```

#### מה אנחנו מחפשים ב-selectors:
- **product**: האלמנט שמכיל מוצר שלם
- **name**: שם המוצר (h3, span, div עם class של שם)
- **price**: מחיר (span, div עם class של מחיר)
- **categories**: רשימת URLs לקטגוריות בשר

## 🧠 מערכת החכמה המתקדמת v2.0 - מדריך מפורט

### 🔄 מדריך הפעלת המערכת החדשה

#### שלב 1: בדיקת המערכת החדשה
```bash
# הרצת ניתוח נתונים קיימים
node analyze_current_data.js

# בדיקת מערכת הסיווג החדשה
node -e "
const MeatNormalizer = require('./utils/meat-normalizer.js');
const normalizer = new MeatNormalizer();
const result = normalizer.classifyProduct('אנטריקוט אנגוס טרי 250 גרם');
console.log(JSON.stringify(result, null, 2));
"
```

#### שלב 2: הפעלת Auto-Learning
```bash
# בדיקת מערכת הלמידה האוטומטית
node -e "
const AutoLearner = require('./utils/auto-learner.js');
const learner = new AutoLearner();
console.log('Auto-Learning System Ready');
"
```

### 📊 יעדי איכות המערכת החדשה
- **דיוק סיווג בסיס**: 90%+ (עלייה מ-85%)
- **דיוק הפרדת איכות**: 85%+ (חדש)
- **Confidence ממוצע**: 0.8+ (עלייה מ-0.73)
- **גילוי דפוסים חדשים**: 80%+ אוטומטי
- **מוצרים דורשים בדיקה ידנית**: <15% (ירידה מ-25%)

### 🎯 הפרויקט הגדול - העמקת המערכת החכמה
**✅ המערכת החדשה מוכנה לפריסה!**

יעדי המערכת החכמה:
- **12 אתרים פעילים** עם 400-600 מוצרים יומיים
- **הפרדת איכות מלאה**: Angus, Wagyu, Veal, Premium מובדלים במחיר
- **לימוד אוטומטי**: זיהוי 80%+ דפוסים חדשים ללא התערבות
- **כיסוי שוק**: 75-90% מהשוק הישראלי של בשר
- **תמחור מתקדם**: השוואת מחירים מדויקת לפי איכות

**מתי לעבור לאינטגרציה עם V5.2**: לאחר 5+ אתרים פעילים עם מערכת החכמה

### 📚 קבצי Legacy (לא לשימוש)
הקבצים הבאים הם מהפרויקט הקודם ולא בשימוש:
- `login.js` - התחברות לChatGPT (לא רלוונטי)
- `sendPrompt.js` - שליחת prompts לChatGPT (לא רלוונטי)  
- `prompts.txt` - רשימת prompts (לא רלוונטי)
- `auth.json`, `cookies.json` - קבצי אימות ישנים

**השתמש רק ב-`basarometer-scanner.js` ועוזריו!**

### 🎯 נקודות חשובות לזכור - עדכון v2.0
1. **המערכת החכמה v2.0 זמינה** - השתמש בכלי הניתוח החדשים
2. **Auto-Learning פעיל** - המערכת לומדת ומשתפרת אוטומטית
3. **הפרדת איכות חובה** - Angus ≠ Regular ≠ Wagyu במחיר ובניתוח
4. **Confidence > 0.8 יעד** - דיוק גבוה יותר עם מערכת החכמה
5. **Grade-aware comparisons** - השוואת מחירים לפי איכות בלבד
6. **Pattern discovery enabled** - גילוי אוטומטי של וריאציות חדשות
7. **Documentation auto-update** - עדכון אוטומטי של קבצי הלמידה

### 📋 רשימת מעקב יומית
- [ ] בדוק `config/learning_log.json` להמלצות חדשות
- [ ] הרץ `analyze_current_data.js` אחרי כל סריקה משמעותית
- [ ] עקוב אחר מוצרים בתור `manual_review_queue`
- [ ] וודא שקבצי המיפוי מתעדכנים אוטומטיות
- [ ] בדוק דיווחי learning ב-`output/learning-report-*.json`

---

🚀 **מוכן לעבוד עם המערכת החכמה v2.0? המשימה הבאה: פריסה לאתרים נוספים!**

## 🎯 NEXT PHASE ROADMAP
1. **Deploy Enhanced System** - הפעלה מלאה של המערכת החדשה
2. **Add Shufersal** - אתר עדיפות ראשונה עם 40-60 מוצרים
3. **Scale to 5 Sites** - רמי לוי + קרפור + שופרסל + מגא + ויקטורי  
4. **Reach 250+ Products** - כיסוי משמעותי של השוק הישראלי
5. **Perfect Grade Separation** - דיוק 95%+ בהפרדת איכויות
6. **Auto-Learning Validation** - וידוא שהמערכת לומדת ומשתפרת

**🎯 Ultimate Goal: 12-site market intelligence platform ready for V5.2 integration**