# 🚀 Quick Start - הוספת אתרים חדשים - V6.0 Eight Network System

## ⚡ 2 דקות - הוספת אתר חדש

### שלב 1: צור Prompt (30 שניות)
```bash
cd "/Users/yogi/Desktop/basarometer/scan bot"
./workflows/scripts/create-site-prompt.sh quick יוחננוף https://www.yohananof.co.il
```

### שלב 2: העתק לClaude Desktop (30 שניות)
1. העתק את הטקסט שהוצג
2. פתח Claude Desktop
3. הדבק ושלח

### שלב 3: קבל Prompt לClaude Code (60 שניות)
- Claude Desktop יחזיר prompt מוכן
- העתק את הprompt

### שלב 4: הפעל ב-Claude Code (10 שניות)
- הדבק את הprompt ב-Claude Code
- Claude Code יוסיף את האתר אוטומטית

### שלב 5: בדוק (20 שניות)
```bash
node basarometer-scanner.js --test --site יוחננוף --debug
```

## 🎯 אתרים מוכנים לביצוע

### עדיפות 1: יוחננוף (Prompt מוכן!)
```bash
./workflows/scripts/create-site-prompt.sh quick יוחננוף https://www.yohananof.co.il
```
**צפוי**: 40-60 מוצרי בשר

### עדיפות 2: מגה
```bash
./workflows/scripts/create-site-prompt.sh quick מגא https://www.mega.co.il
```
**צפוי**: 35-50 מוצרי בשר

### עדיפות 3: ויקטוריה
```bash
./workflows/scripts/create-site-prompt.sh quick ויקטוריה https://www.victory.co.il
```
**צפוי**: 30-45 מוצרי בשר

## ✅ מדדי הצלחה

לאחר הוספה מוצלחת תקבל:
- **25+ מוצרי בשר** ייחודיים
- **Confidence 0.7+** ממוצע
- **זמן סריקה** < 45 שניות
- **0 שגיאות**

דוגמה מוצלחת (שופרסל):
```
✅ שופרסל: נמצאו 48 מוצרי בשר מתוך 199 מוצרים
📈 מדדי איכות:
- מוצרים ייחודיים: 6/48 (42 כפילויות הוסרו)
- ציון confidence ממוצע: 0.79
- קטגוריות מזוהות: 5/6 (83%)
```

## 🔧 פתרון בעיות מהיר

### אם הסקריפט לא עובד:
```bash
chmod +x workflows/scripts/create-site-prompt.sh
```

### אם לא מוצא מוצרים:
1. בדוק URL נכון
2. בדוק selectors ב-debug screenshot
3. עדכן config ב-`config/meat-sites.json`

### אם יש שגיאות:
```bash
# בדוק logs
cat debug-[אתר]-*.png
```

---

**🎯 התחל עכשיו עם יוחננוף - הPrompt מוכן!** 🚀