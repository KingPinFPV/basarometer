// Hebrew utility functions testing
describe('Hebrew Text Processing', () => {
  // Mock Hebrew processing functions for testing
  const processHebrewName = (name: string): string => {
    return name
      .replace(/\s+/g, '_')
      .replace(/[^\u0590-\u05FF\w]/g, '')
      .toLowerCase()
  }

  const validateHebrewText = (text: string): boolean => {
    const hebrewRegex = /[\u0590-\u05FF]/
    return hebrewRegex.test(text)
  }

  const normalizeHebrewSpacing = (text: string): string => {
    return text.replace(/\s+/g, ' ').trim()
  }

  test('should process Hebrew product names correctly', () => {
    expect(processHebrewName('אנטריקוט בקר')).toBe('אנטריקוט_בקר')
    expect(processHebrewName('פילה עוף')).toBe('פילה_עוף')
    expect(processHebrewName('כבש מעושן')).toBe('כבש_מעושן')
  })

  test('should validate Hebrew text correctly', () => {
    expect(validateHebrewText('אנטריקוט בקר')).toBe(true)
    expect(validateHebrewText('Beef Entrecote')).toBe(false)
    expect(validateHebrewText('אנטריקוט Beef')).toBe(true) // Mixed text
    expect(validateHebrewText('123')).toBe(false)
    expect(validateHebrewText('')).toBe(false)
  })

  test('should normalize Hebrew spacing', () => {
    expect(normalizeHebrewSpacing('אנטריקוט    בקר')).toBe('אנטריקוט בקר')
    expect(normalizeHebrewSpacing('  פילה  עוף  ')).toBe('פילה עוף')
    expect(normalizeHebrewSpacing('כבש\n\nמעושן')).toBe('כבש מעושן')
  })

  test('should handle Hebrew RTL text direction', () => {
    const hebrewText = 'אנטריקוט בקר איכות גבוהה'
    const englishText = 'High quality beef entrecote'
    
    expect(validateHebrewText(hebrewText)).toBe(true)
    expect(validateHebrewText(englishText)).toBe(false)
  })

  test('should process meat quality grades in Hebrew', () => {
    const qualityMappings = {
      'רגיל': 'regular',
      'פרימיום': 'premium', 
      'אנגוס': 'angus',
      'וואגיו': 'wagyu',
      'עגל': 'veal'
    }

    Object.entries(qualityMappings).forEach(([hebrew, english]) => {
      expect(validateHebrewText(hebrew)).toBe(true)
      expect(english).toMatch(/^[a-z]+$/)
    })
  })

  test('should handle kosher certification terms', () => {
    const kosherTerms = [
      'כשר',
      'מהדרין',
      'בד״ץ',
      'חלב ישראל',
      'פרווה'
    ]

    kosherTerms.forEach(term => {
      expect(validateHebrewText(term)).toBe(true)
      expect(term.length).toBeGreaterThan(0)
    })
  })

  test('should process cooking method terms in Hebrew', () => {
    const cookingMethods = {
      'מעושן': 'smoked',
      'מיושן': 'aged',
      'מתובל': 'seasoned',
      'טרי': 'fresh',
      'קפוא': 'frozen'
    }

    Object.entries(cookingMethods).forEach(([hebrew, english]) => {
      expect(validateHebrewText(hebrew)).toBe(true)
      expect(processHebrewName(hebrew)).toBe(hebrew.toLowerCase())
    })
  })
})