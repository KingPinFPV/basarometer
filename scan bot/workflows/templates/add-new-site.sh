#!/bin/bash

# 🚀 Basarometer Scanner - New Site Analysis Workflow
# This script automates the complete process from analysis to implementation

echo "🎯 Basarometer Scanner - New Site Analysis Workflow"
echo "=================================================="

# Function to display usage
show_usage() {
    echo "Usage: $0 <site_name> <site_url>"
    echo ""
    echo "Examples:"
    echo "  $0 yohananof https://www.yohananof.co.il"
    echo "  $0 mega https://www.mega.co.il"
    echo "  $0 victory https://www.victory.co.il"
    echo ""
}

# Check if parameters provided
if [ $# -ne 2 ]; then
    echo "❌ Error: Missing parameters"
    show_usage
    exit 1
fi

SITE_NAME=$1
SITE_URL=$2
PROJECT_DIR="/Users/yogi/Desktop/basarometer/scan bot"

echo "🏪 Site: $SITE_NAME"
echo "🌐 URL: $SITE_URL"
echo "📁 Project: $PROJECT_DIR"
echo ""

# Step 1: Navigate to project directory
echo "📂 Step 1: Navigating to project directory..."
cd "$PROJECT_DIR" || {
    echo "❌ Error: Cannot access project directory: $PROJECT_DIR"
    exit 1
}
echo "✅ In project directory: $(pwd)"
echo ""

# Step 2: Generate Claude Desktop prompt
echo "📋 Step 2: Generating Claude Desktop analysis prompt..."

CLAUDE_DESKTOP_PROMPT="# 🔍 ניתוח אתר חדש - $SITE_NAME

אני צריך שתעזור לי לנתח אתר קמעונאות ישראלי חדש ולהכין אותו להוספה למערכת Basarometer Scanner שלנו.

## 🏪 פרטי האתר
- **שם האתר**: $SITE_NAME
- **כתובת**: $SITE_URL
- **מיקום הפרויקט**: \`$PROJECT_DIR\`

## 🎯 הקשר הפרויקט
**Basarometer Scanner** הוא מנוע סריקה אוטומטי למחירי בשר ברשתות הקמעונאות הישראליות. יש לנו כבר:
- ✅ **רמי לוי**: 40 מוצרים, 93% דיוק, confidence 0.73
- ✅ **שופרסל**: 48 מוצרים, confidence 0.79 - **הGold Standard שלנו**

## 🔍 מה אני צריך ממך:

**שלב 1: ניתוח מקיף של האתר**
אנא נתח את האתר $SITE_URL לעומק וספק לי:

1. **מבנה האתר**:
   - איך הניווט מאורגן?
   - איפה מוקמות קטגוריות המזון?
   - איך נראית הדרך לקטגוריות בשר/עוף/דגים?

2. **זיהוי קטגוריות בשר**:
   - חפש קטגוריות: בשר, עוף, דגים, קצבייה, בקר, עגל, כבש
   - מה הURLs של קטגוריות הבשר?
   - איך נראה מבנה המוצרים בכל קטגוריה?

3. **ניתוח טכני**:
   - איך נראית דף מוצרים (HTML structure)?
   - מה הselectors הסבירים לproducts?
   - איך מוצגים מחירים?
   - איך נראים שמות מוצרים?

4. **השוואה לשופרסל**:
   - איך האתר דומה/שונה משופרסל?
   - אילו דפוסים משותפים יש?
   - איך אפשר ליישם תבנית דומה?

**שלב 2: יצירת Prompt לClaude Code**
לאחר הניתוח, צור לי **prompt מוכן לClaude Code** שכולל:

1. **הגדרת המשימה** בבירור עם כל הפרטים הטכניים
2. **Config JSON מוכן** לפי הממצאים שלך
3. **הוראות יישום** צעד אחר צעד
4. **מדדי הצלחה** ברורים
5. **פקודות בדיקה** לוודא שהכל עובד

## 📊 מדדי הצלחה שנכוון אליהם:
- **מוצרים**: 25+ מוצרי בשר ייחודיים
- **דיוק**: 85%+ זיהוי כבשר
- **מחירים**: 100% עם מחירים תקינים
- **זמן**: מתחת ל-45 שניות
- **Confidence**: ממוצע 0.7+

## 🎯 מטרת הניתוח:
ליצור prompt כל כך מפורט ומדויק לClaude Code, שהוא יוכל להוסיף את האתר החדש לסורק תוך 5-10 דקות, בדיוק כמו שהצלחנו עם שופרסל.

---

**אנא תתחיל בניתוח האתר ואז תכין לי prompt מושלם לClaude Code! 🚀**"

# Step 3: Save prompt to file
PROMPT_FILE="claude-desktop-prompt-$SITE_NAME.md"
echo "$CLAUDE_DESKTOP_PROMPT" > "$PROMPT_FILE"
echo "✅ Claude Desktop prompt saved to: $PROMPT_FILE"
echo ""

# Step 4: Display the prompt
echo "📋 Step 3: Claude Desktop Prompt Ready!"
echo "======================================"
echo ""
echo "📋 COPY THIS PROMPT TO CLAUDE DESKTOP:"
echo "======================================"
echo "$CLAUDE_DESKTOP_PROMPT"
echo "======================================"
echo ""

# Step 5: Instructions for user
echo "🚀 Step 4: Next Actions for You:"
echo "================================"
echo ""
echo "1. 📋 **Copy the prompt above** (or from file: $PROMPT_FILE)"
echo "2. 🖥️  **Open Claude Desktop**"
echo "3. 📝 **Paste the prompt** and send"
echo "4. ⏱️  **Wait for analysis** (2-3 minutes)"
echo "5. 📄 **Copy the Claude Code prompt** that Claude Desktop generates"
echo "6. 💻 **Open Claude Code** and paste the prompt"
echo "7. ⚡ **Watch magic happen** - new site added in 5-10 minutes!"
echo ""

# Step 6: Create reminder file
REMINDER_FILE="next-steps-$SITE_NAME.md"
cat > "$REMINDER_FILE" << EOF
# Next Steps for $SITE_NAME Integration

## Status: 📋 Ready for Claude Desktop Analysis

### What you need to do:

1. **Open Claude Desktop**
2. **Copy and paste this prompt**: \`$PROMPT_FILE\`
3. **Wait for Claude Desktop to analyze** $SITE_URL
4. **Copy the generated Claude Code prompt**
5. **Run the Claude Code prompt**
6. **Test the new site**: \`node basarometer-scanner.js --test --site $SITE_NAME --debug\`

### Expected Results:
- $SITE_NAME added to config/meat-sites.json
- 25+ meat products found
- 85%+ accuracy
- Ready for production

### Files Created:
- Analysis prompt: \`$PROMPT_FILE\`
- This reminder: \`$REMINDER_FILE\`

**Target: $SITE_NAME working within 15 minutes total! 🚀**
EOF

echo "📝 Reminder saved to: $REMINDER_FILE"
echo ""

# Step 7: Final summary
echo "🎯 WORKFLOW READY FOR $SITE_NAME!"
echo "================================"
echo ""
echo "📊 Summary:"
echo "- Site: $SITE_NAME"
echo "- URL: $SITE_URL"
echo "- Prompt: $PROMPT_FILE"
echo "- Reminder: $REMINDER_FILE"
echo ""
echo "🚀 **Ready to add $SITE_NAME to Basarometer Scanner!**"
echo "📋 **Next: Copy prompt to Claude Desktop**"
echo ""

# Step 8: Open files for easy access (macOS)
if command -v open >/dev/null 2>&1; then
    echo "🖥️ Opening files for easy access..."
    open "$PROMPT_FILE"
    echo "✅ Prompt file opened"
fi

echo ""
echo "🎉 Workflow complete! Ready for Claude Desktop analysis! 🚀"