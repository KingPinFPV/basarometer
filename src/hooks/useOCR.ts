'use client'

import { useState, useCallback } from 'react'
import { ocrProcessor } from '@/utils/ocrProcessor'
import { useAuth } from '@/hooks/useAuth'
import { usePriceData } from '@/hooks/usePriceData'
import { supabase } from '@/lib/supabase'

export interface ExtractedItem {
  text: string
  price: number
  confidence: number
  meatCutId?: string
  retailerId?: string
  suggestedCategory?: string
  isValidated: boolean
  quantity?: number
  unit?: string
}

export interface OCRResult {
  extractedText: string
  storeInfo: {
    name: string
    confidence: number
    retailerId?: string
  } | null
  extractedItems: ExtractedItem[]
  totalItems: number
  confidence: number
  processingTime: number
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  validItems: ExtractedItem[]
  invalidItems: ExtractedItem[]
}

export function useOCR() {
  const { user } = useAuth()
  const { meatCuts, retailers } = usePriceData()
  
  const [processing, setProcessing] = useState(false)
  const [currentResult, setCurrentResult] = useState<OCRResult | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Process receipt image with OCR
  const processReceiptImage = useCallback(async (imageFile: File): Promise<OCRResult | null> => {
    if (!imageFile) {
      setError('לא נבחר קובץ תמונה')
      return null
    }

    setProcessing(true)
    setError(null)
    
    try {
      const startTime = Date.now()
      
      // Use OCR processor to extract text
      const ocrText = await ocrProcessor.processImage(imageFile)
      
      if (!ocrText || ocrText.trim().length === 0) {
        throw new Error('לא ניתן לזהות טקסט בתמונה')
      }

      // Extract store information
      const storeInfo = extractStoreInfo(ocrText)
      
      // Extract meat items and prices
      const extractedItems = extractMeatItems(ocrText)
      
      // Calculate overall confidence
      const confidence = calculateOverallConfidence(extractedItems)
      
      const processingTime = Date.now() - startTime

      const result: OCRResult = {
        extractedText: ocrText,
        storeInfo,
        extractedItems,
        totalItems: extractedItems.length,
        confidence,
        processingTime
      }

      setCurrentResult(result)
      return result

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בעיבוד התמונה'
      setError(errorMessage)
      return null
    } finally {
      setProcessing(false)
    }
  }, [])

  // Extract store information from OCR text
  const extractStoreInfo = (text: string): OCRResult['storeInfo'] => {
    const storePatterns = [
      { pattern: /(שופרסל|supersol)/i, name: 'שופרסל', retailerId: 'shufersal' },
      { pattern: /(רמי לוי|rami levy)/i, name: 'רמי לוי', retailerId: 'rami-levy' },
      { pattern: /(קופיקס|co.?fix)/i, name: 'קופיקס', retailerId: 'cofix' },
      { pattern: /(מחסני השוק|machsani hashuk)/i, name: 'מחסני השוק', retailerId: 'machsani-hashuk' },
      { pattern: /(ויקטורי|victory)/i, name: 'ויקטורי', retailerId: 'victory' },
      { pattern: /(תל נוף|tel nof)/i, name: 'תל נוף', retailerId: 'tel-nof' },
      { pattern: /(יוחננוף|yohananof)/i, name: 'יוחננוף', retailerId: 'yohananof' },
      { pattern: /(מגה ספורט|mega sport)/i, name: 'מגה ספורט', retailerId: 'mega-sport' }
    ]

    for (const store of storePatterns) {
      const match = text.match(store.pattern)
      if (match) {
        // Find the actual retailer ID from the database
        const retailer = retailers.find(r => 
          r.name.includes(store.name) || 
          r.name.toLowerCase().includes(store.name.toLowerCase())
        )
        
        return {
          name: store.name,
          confidence: 0.9,
          retailerId: retailer?.id || store.retailerId
        }
      }
    }

    return null
  }

  // Extract meat items and prices from text
  const extractMeatItems = (text: string): ExtractedItem[] => {
    const items: ExtractedItem[] = []
    const lines = text.split('\n').filter(line => line.trim().length > 0)

    // Hebrew meat terms for pattern matching
    const meatTerms = [
      'בקר', 'עוף', 'כבש', 'הודו', 'חזיר', 'בשר', 'שניצל', 'נקניק', 'המבורגר',
      'פרגית', 'כנפיים', 'שוק', 'ירך', 'חזה', 'עצם', 'טחון', 'קבב', 'מרקחת',
      'אנטריקוט', 'פילה', 'סטייק', 'רוסט', 'צלעות', 'כתף', 'צוואר'
    ]

    // Price patterns: ₪XX.XX, XX.XX ש"ח, XX.XX שח
    const pricePatterns = [
      /₪\s*(\d+\.?\d*)/g,
      /(\d+\.?\d*)\s*ש["\']?ח/g,
      /(\d+\.?\d*)\s*שח/g,
      /(\d+\.?\d*)\s*nis/gi
    ]

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Check if line contains meat terms
      const containsMeat = meatTerms.some(term => 
        line.includes(term) || line.toLowerCase().includes(term.toLowerCase())
      )

      if (!containsMeat) continue

      // Extract prices from this line and nearby lines
      const prices: number[] = []
      
      // Check current line and next 2 lines for prices
      for (let j = i; j < Math.min(i + 3, lines.length); j++) {
        const checkLine = lines[j]
        
        for (const pattern of pricePatterns) {
          const matches = Array.from(checkLine.matchAll(pattern))
          for (const match of matches) {
            const price = parseFloat(match[1])
            if (price > 0 && price < 1000) { // Reasonable price range
              prices.push(price)
            }
          }
        }
      }

      // If we found prices, create items
      if (prices.length > 0) {
        const mainPrice = prices[0] // Take the first/main price
        
        // Try to match with existing meat cuts
        const matchedCut = findBestMeatCutMatch(line)
        
        const item: ExtractedItem = {
          text: line.trim(),
          price: mainPrice,
          confidence: calculateItemConfidence(line, mainPrice, matchedCut),
          meatCutId: matchedCut?.id,
          suggestedCategory: matchedCut ? getCategoryName(matchedCut.category_id) : undefined,
          isValidated: false,
          quantity: extractQuantity(line),
          unit: extractUnit(line)
        }

        items.push(item)
      }
    }

    return items.slice(0, 20) // Limit to 20 items to prevent spam
  }

  // Find best matching meat cut from database
  const findBestMeatCutMatch = (text: string) => {
    if (!meatCuts.length) return null

    const textLower = text.toLowerCase()
    
    // Try exact matches first
    for (const cut of meatCuts) {
      if (textLower.includes(cut.name_hebrew.toLowerCase()) ||
          textLower.includes(cut.name_english.toLowerCase())) {
        return cut
      }
    }

    // Try partial matches
    for (const cut of meatCuts) {
      const hebrewWords = cut.name_hebrew.split(' ')
      const englishWords = cut.name_english.split(' ')
      
      for (const word of [...hebrewWords, ...englishWords]) {
        if (word.length > 2 && textLower.includes(word.toLowerCase())) {
          return cut
        }
      }
    }

    return null
  }

  // Extract quantity from text
  const extractQuantity = (text: string): number | undefined => {
    const quantityPatterns = [
      /(\d+\.?\d*)\s*ק["\']?ג/g,
      /(\d+\.?\d*)\s*kg/gi,
      /(\d+\.?\d*)\s*גרם/g,
      /(\d+\.?\d*)\s*gr/gi
    ]

    for (const pattern of quantityPatterns) {
      const match = text.match(pattern)
      if (match) {
        return parseFloat(match[1])
      }
    }

    return undefined
  }

  // Extract unit from text
  const extractUnit = (text: string): string | undefined => {
    if (text.includes('ק"ג') || text.includes('kg')) return 'ק"ג'
    if (text.includes('גרם') || text.includes('gr')) return 'גרם'
    if (text.includes('יחידה') || text.includes('יח')) return 'יחידה'
    return undefined
  }

  // Calculate item confidence score
  const calculateItemConfidence = (text: string, price: number, matchedCut: { id: string; name_hebrew: string } | null): number => {
    let confidence = 0.5 // Base confidence

    // Price reasonableness
    if (price > 5 && price < 200) confidence += 0.2
    if (price > 15 && price < 100) confidence += 0.1

    // Text quality
    if (text.length > 5 && text.length < 50) confidence += 0.1
    if (/[א-ת]/.test(text)) confidence += 0.1 // Contains Hebrew

    // Meat cut match
    if (matchedCut) confidence += 0.2

    return Math.min(1, confidence)
  }

  // Calculate overall confidence
  const calculateOverallConfidence = (items: ExtractedItem[]): number => {
    if (items.length === 0) return 0
    
    const avgConfidence = items && items.length > 0 ? (items || []).reduce((sum, item) => sum + (item?.confidence || 0), 0) / items.length : 0
    
    // Bonus for having multiple items
    const itemCountBonus = Math.min(0.2, items.length * 0.05)
    
    return Math.min(1, avgConfidence + itemCountBonus)
  }

  // Get category name by ID
  const getCategoryName = (categoryId: string): string => {
    // This is a simplified mapping - in real app would query categories table
    const categoryMap: Record<string, string> = {
      'beef': 'בקר',
      'chicken': 'עוף',
      'lamb': 'כבש',
      'turkey': 'הודו',
      'pork': 'חזיר'
    }
    return categoryMap[categoryId] || 'כללי'
  }

  // Validate extracted items
  const validateExtractedItems = useCallback((items: ExtractedItem[]): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []
    const validItems: ExtractedItem[] = []
    const invalidItems: ExtractedItem[] = []

    if (items.length === 0) {
      errors.push('לא נמצאו פריטי בשר בקבלה')
    }

    for (const item of items) {
      const itemErrors: string[] = []
      const itemWarnings: string[] = []

      // Price validation
      if (item.price <= 0) {
        itemErrors.push('מחיר לא חוקי')
      } else if (item.price > 500) {
        itemWarnings.push('מחיר גבוה במיוחד')
      }

      // Text validation
      if (item.text.length < 3) {
        itemErrors.push('תיאור קצר מדי')
      }

      // Confidence validation
      if (item.confidence < 0.3) {
        itemWarnings.push('רמת ביטחון נמוכה')
      }

      if (itemErrors.length === 0) {
        validItems.push({ ...item, isValidated: true })
      } else {
        invalidItems.push(item)
        errors.push(`פריט "${item.text}": ${itemErrors.join(', ')}`)
      }

      warnings.push(...itemWarnings.map(w => `פריט "${item.text}": ${w}`))
    }

    const result: ValidationResult = {
      isValid: validItems.length > 0 && errors.length === 0,
      errors,
      warnings,
      validItems,
      invalidItems
    }

    setValidationResult(result)
    return result
  }, [])

  // Submit validated items as price reports
  const bulkSubmitPrices = useCallback(async (
    validatedItems: ExtractedItem[],
    retailerId: string,
    location?: string
  ): Promise<boolean> => {
    if (!user) {
      setError('התחבר כדי לשלוח דיווחי מחיר')
      return false
    }

    if (validatedItems.length === 0) {
      setError('אין פריטים תקינים לשליחה')
      return false
    }

    setProcessing(true)
    setError(null)

    try {
      const reports = validatedItems.map(item => ({
        meat_cut_id: item.meatCutId,
        retailer_id: retailerId,
        price_per_kg: Math.round(item.price * 100), // Convert to agorot
        user_id: user.id,
        location: location || 'OCR',
        notes: `מסרק קבלה - ${item.text}`,
        purchase_date: new Date().toISOString().split('T')[0],
        is_on_sale: false,
        confidence_score: Math.round(item.confidence * 100)
      })).filter(report => report.meat_cut_id) // Only submit if we have a meat cut match

      if (reports.length === 0) {
        setError('לא נמצאו התאמות למוצרי בשר במאגר')
        return false
      }

      const { error: submitError } = await supabase
        .from('price_reports')
        .insert(reports)

      if (submitError) throw submitError

      return true

    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשליחת הדיווחים')
      return false
    } finally {
      setProcessing(false)
    }
  }, [user])

  // Clear current session
  const clearSession = useCallback(() => {
    setCurrentResult(null)
    setValidationResult(null)
    setError(null)
  }, [])

  return {
    // State
    processing,
    currentResult,
    validationResult,
    error,

    // Actions
    processReceiptImage,
    validateExtractedItems,
    bulkSubmitPrices,
    clearSession,

    // Computed
    hasResult: !!currentResult,
    hasValidation: !!validationResult,
    canSubmit: !!validationResult && validationResult.validItems.length > 0 && !!user,
    itemCount: currentResult?.totalItems || 0,
    validItemCount: validationResult?.validItems.length || 0
  }
}