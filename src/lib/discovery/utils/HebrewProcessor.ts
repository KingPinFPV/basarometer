// Hebrew Processor - Hebrew text processing utilities
export class HebrewProcessor {
    
    normalize(text: string): string {
        if (!text) return ''
        
        return text
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\u0590-\u05FF\u0020-\u007E]/g, '') // Keep Hebrew and basic ASCII
    }

    hasHebrewText(text: string): boolean {
        return /[\u0590-\u05FF]/.test(text)
    }

    removeNikkud(text: string): string {
        // Remove Hebrew diacritics/vowel points
        return text.replace(/[\u05B0-\u05C7]/g, '')
    }

    extractHebrewWords(text: string): string[] {
        const hebrewWordPattern = /[\u0590-\u05FF]+/g
        return text.match(hebrewWordPattern) || []
    }

    isHebrewDominant(text: string): boolean {
        const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length
        const totalChars = text.replace(/\s/g, '').length
        
        return totalChars > 0 && (hebrewChars / totalChars) > 0.6
    }

    transliterate(hebrewText: string): string {
        const transliterationMap: Record<string, string> = {
            'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h',
            'ו': 'v', 'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'y',
            'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm', 'ם': 'm',
            'ן': 'n', 'נ': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p',
            'ף': 'f', 'צ': 'tz', 'ץ': 'tz', 'ק': 'k', 'ר': 'r',
            'ש': 'sh', 'ת': 't'
        }

        return hebrewText
            .split('')
            .map(char => transliterationMap[char] || char)
            .join('')
    }

    normalizeBusinessName(name: string): string {
        return this.normalize(name)
            .replace(/קצביית|קצביה/g, 'קצב')
            .replace(/בשרי/g, 'בשר')
            .replace(/חנות\s+בשר/g, 'בשר')
    }

    extractMeatTerms(text: string): string[] {
        const meatTerms = [
            'בשר', 'קצב', 'בקר', 'עוף', 'כבש', 'טלה', 'הודו',
            'אנטריקוט', 'פילה', 'שניצל', 'קבב', 'נקניק',
            'כשר', 'חלק', 'טרי', 'איכות', 'פרמיום'
        ]

        const normalizedText = this.normalize(text)
        return meatTerms.filter(term => normalizedText.includes(term))
    }

    calculateHebrewQuality(text: string): number {
        if (!text) return 0

        let score = 0
        
        // Hebrew text presence
        if (this.hasHebrewText(text)) score += 30
        
        // Hebrew dominance
        if (this.isHebrewDominant(text)) score += 20
        
        // Proper Hebrew formatting (RTL considerations)
        if (this.hasProperHebrewFormatting(text)) score += 20
        
        // Meat-specific Hebrew terms
        const meatTerms = this.extractMeatTerms(text)
        score += Math.min(30, meatTerms.length * 10)
        
        return Math.min(100, score)
    }

    private hasProperHebrewFormatting(text: string): boolean {
        // Check for common Hebrew business formatting patterns
        const hebrewBusinessPatterns = [
            /קצביית\s+[\u0590-\u05FF]+/, // "קצביית [name]"
            /בשר\s+[\u0590-\u05FF]+/,   // "בשר [qualifier]"
            /[\u0590-\u05FF]+\s+בשר/,   // "[name] בשר"
        ]

        return hebrewBusinessPatterns.some(pattern => pattern.test(text))
    }

    getMeatBusinessKeywords(): string[] {
        return [
            // Primary meat terms
            'קצב', 'קצביה', 'קצביית', 'בשר', 'בשרי',
            
            // Meat types
            'בקר', 'עוף', 'כבש', 'טלה', 'הודו',
            
            // Products
            'אנטריקוט', 'פילה', 'שניצל', 'קבב', 'המבורגר',
            'נקניק', 'נקניקיות', 'סלמי', 'פסטרמה',
            'צלעות', 'כנפיים', 'שוקיים', 'חזה',
            
            // Quality terms
            'כשר', 'חלק', 'טרי', 'איכות', 'פרמיום',
            'מובחר', 'אורגני', 'טבעי',
            
            // Business terms
            'דליקטסן', 'בית בשר', 'חנות בשר',
            'משלוחים', 'הזמנות'
        ]
    }

    getIsraeliLocationKeywords(): string[] {
        return [
            // Major cities
            'תל אביב', 'ירושלים', 'חיפה', 'באר שבע',
            'ראשון לציון', 'פתח תקווה', 'נתניה', 'אשדוד',
            'בני ברק', 'רמת גן', 'הרצליה', 'כפר סבא',
            
            // Regions
            'מרכז', 'צפון', 'דרום', 'ירושלים והסביבה',
            'שפלה', 'שרון', 'גליל', 'נגב',
            
            // Common location terms
            'עיר', 'שכונה', 'אזור', 'מחוז', 'נפה'
        ]
    }
}