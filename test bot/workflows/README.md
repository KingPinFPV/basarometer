# 🚀 Workflows לאתרים חדשים - מדריך שימוש - V6.0 Eight Network System

## 📁 מבנה התיקיות
```
workflows/
├── templates/           # תבניות לניתוח
│   ├── quick-analysis-template.md
│   └── detailed-analysis-template.md
├── scripts/            # סקריפטים אוטומטיים
│   └── create-site-prompt.sh
├── prompts/           # prompts שנוצרו
│   └── [קבצים שנוצרו אוטומטית]
└── README.md         # המדריך הזה
```

## 🔧 איך להשתמש

### דרך 1: סקריפט אוטומטי (מומלץ!)

```bash
# נווט לפרויקט
cd "/Users/yogi/Desktop/basarometer/scan bot"

# הרץ סקריפט יצירת prompt
./workflows/scripts/create-site-prompt.sh quick יוחננוף https://www.yohananof.co.il

# או לניתוח מפורט:
./workflows/scripts/create-site-prompt.sh detailed מגה https://www.mega.co.il
```

### דרך 2: מנואלי

```bash
# העתק תבנית ועדכן ידנית
cp workflows/templates/quick-analysis-template.md workflows/prompts/my-prompt.md

# ערוך את הקובץ:
# החלף [שם_האתר] ← שם האתר שלך
# החלף [URL_האתר] ← URL האתר שלך

# העתק תוכן לClaude Desktop
```

## 🔄 תהליך העבודה המלא

1. **צור prompt**: `./workflows/scripts/create-site-prompt.sh quick אתר URL`
2. **העתק לClaude Desktop**: הדבק את התוכן שנוצר
3. **קבל ניתוח**: Claude Desktop מנתח ויוצר prompt לClaude Code  
4. **הרץ ב-Claude Code**: הדבק את הprompt שקיבלת
5. **בדוק תוצאות**: `node basarometer-scanner.js --test --site אתר --debug`

## 📊 אתרים מומלצים להתחלה

### עדיפות גבוהה:
- יוחננוף: https://www.yohananof.co.il
- מגה: https://www.mega.co.il  
- ויקטוריה: https://www.victory.co.il

### פקודות מוכנות:
```bash
./workflows/scripts/create-site-prompt.sh quick יוחננוף https://www.yohananof.co.il
./workflows/scripts/create-site-prompt.sh quick מגה https://www.mega.co.il
./workflows/scripts/create-site-prompt.sh quick ויקטוריה https://www.victory.co.il
```

## 🎯 המטרה
5 אתרים עובדים בסוף השבוע! 🚀

## 🔧 דוגמאות שימוש

### דוגמה מלאה - הוספת יוחננוף:

```bash
# 1. נווט לפרויקט
cd "/Users/yogi/Desktop/basarometer/scan bot"

# 2. צור prompt ליוחננוף
./workflows/scripts/create-site-prompt.sh quick יוחננוף https://www.yohananof.co.il

# 3. הסקריפט יציג לך את התוכן - העתק אותו
# 4. פתח Claude Desktop ← הדבק ← שלח
# 5. קבל prompt לClaude Code ← העתק ← הדבק ב-Claude Code  
# 6. בדוק: node basarometer-scanner.js --test --site יוחננוף --debug
```

## ✅ מדדי הצלחה

לאחר הוספת אתר חדש, צפה לקבל:
- **25+ מוצרי בשר** ייחודיים
- **דיוק 85%+** בזיהוי בשר
- **Confidence 0.7+** ממוצע
- **זמן סריקה** < 45 שניות
- **0 שגיאות** במערכת

## 🚨 פתרון בעיות

### אם הסקריפט לא עובד:
```bash
# ודא שהקובץ ניתן להרצה
chmod +x workflows/scripts/create-site-prompt.sh

# בדוק נתיב
ls -la workflows/scripts/create-site-prompt.sh
```

### אם התבנית לא נמצאת:
```bash
# ודא שהתבניות קיימות
ls -la workflows/templates/
```

## 📋 אתרים לעבודה עתידית

### עדיפות גבוהה:
1. ✅ שופרסל - **עובד מצוין!** (48 מוצרים, confidence 0.79)
2. ✅ רמי לוי - עובד (40 מוצרים, confidence 0.73)
3. 🎯 יוחננוף - מטרה הבאה
4. 🎯 מגא - עדיפות גבוהה
5. 🎯 ויקטוריה - פוטנציאל טוב

### עדיפות בינונית:
- סופר פארם
- טיב טעם
- מאקולת

### אתגרים מיוחדים:
- ❌ חצי חינם - מושבת (בעיות Cloudflare)
- ❌ קרפור - דורש תיקון selectors

---

**מוכן להוסיף אתרים חדשים תוך דקות! 🚀🥩**