#!/bin/bash

# 🚀 יצירת Prompt לניתוח אתר חדש

# בדיקת פרמטרים
if [ $# -ne 3 ]; then
    echo "שימוש: $0 <סוג_תבנית> <שם_אתר> <URL_אתר>"
    echo ""
    echo "סוגי תבניות:"
    echo "  quick    - ניתוח מהיר (2 דקות)"
    echo "  detailed - ניתוח מפורט (5 דקות)"
    echo ""
    echo "דוגמאות:"
    echo "  $0 quick יוחננוף https://www.yohananof.co.il"
    echo "  $0 detailed מגה https://www.mega.co.il"
    exit 1
fi

TEMPLATE_TYPE=$1
SITE_NAME=$2
SITE_URL=$3

# בדיקת תקינות
if [[ "$TEMPLATE_TYPE" != "quick" && "$TEMPLATE_TYPE" != "detailed" ]]; then
    echo "❌ שגיאה: סוג תבנית לא תקין. השתמש ב-quick או detailed"
    exit 1
fi

echo "🚀 יוצר prompt עבור $SITE_NAME..."

# בחירת קובץ תבנית
if [ "$TEMPLATE_TYPE" == "quick" ]; then
    TEMPLATE_FILE="workflows/templates/quick-analysis-template.md"
    TEMPLATE_NAME="מהיר"
else
    TEMPLATE_FILE="workflows/templates/detailed-analysis-template.md"
    TEMPLATE_NAME="מפורט"
fi

# בדיקת קיום התבנית
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "❌ שגיאה: קובץ תבנית לא נמצא: $TEMPLATE_FILE"
    exit 1
fi

# יצירת שם קובץ יעד
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="workflows/prompts/${SITE_NAME}_${TEMPLATE_TYPE}_${TIMESTAMP}.md"

# יצירת הprompt
sed "s/\[שם_האתר\]/$SITE_NAME/g; s|\[URL_האתר\]|$SITE_URL|g" "$TEMPLATE_FILE" > "$OUTPUT_FILE"

echo "✅ Prompt נוצר בהצלחה!"
echo "📁 מיקום: $OUTPUT_FILE"
echo "📋 סוג: ניתוח $TEMPLATE_NAME"
echo ""
echo "🎯 הצעדים הבאים:"
echo "1. העתק את התוכן מהקובץ: $OUTPUT_FILE"
echo "2. פתח Claude Desktop"
echo "3. הדבק ושלח"
echo "4. קבל prompt לClaude Code"
echo "5. הרץ ב-Claude Code"
echo ""

# הצגת התוכן
echo "📋 התוכן להעתקה:"
echo "=================="
cat "$OUTPUT_FILE"
echo "=================="
echo ""

# פתיחת הקובץ (macOS)
if command -v open >/dev/null 2>&1; then
    echo "🖥️ פותח את הקובץ..."
    open "$OUTPUT_FILE"
fi

echo "🎉 מוכן! העתק את התוכן לClaude Desktop!"