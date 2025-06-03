'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

export interface PriceReportData {
  meat_cut_id: string
  retailer_id: string
  price_shekel: number
  store_location?: string
  notes?: string
  purchase_date?: string
  is_on_sale?: boolean
  sale_price_shekel?: number
}

export interface PriceReportResponse {
  success: boolean
  message?: string
  error?: string
  report_id?: string
  price_shekel?: number
  price_agorot?: number
}

export function usePriceReport() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastResponse, setLastResponse] = useState<PriceReportResponse | null>(null)

  const supabase = createClient()

  const submitPriceReport = useCallback(async (reportData: PriceReportData): Promise<PriceReportResponse> => {
    try {
      setIsSubmitting(true)
      setLastResponse(null)

      // Validate required fields
      if (!reportData.meat_cut_id || !reportData.retailer_id || !reportData.price_shekel) {
        throw new Error('חסרים פרטים נדרשים: חתך בשר, רשת ומחיר')
      }

      // Validate price range
      if (reportData.price_shekel < 1 || reportData.price_shekel > 1000) {
        throw new Error('מחיר חייב להיות בין 1-1000 ש"ח לק"ג')
      }

      // Validate sale price if provided
      if (reportData.is_on_sale && reportData.sale_price_shekel) {
        if (reportData.sale_price_shekel >= reportData.price_shekel) {
          throw new Error('מחיר המבצע חייב להיות נמוך ממחיר הרגיל')
        }
        if (reportData.sale_price_shekel < 1) {
          throw new Error('מחיר המבצע חייב להיות חיובי')
        }
      }

      // Prepare the data for submission
      const submissionData = {
        p_meat_cut_id: reportData.meat_cut_id,
        p_retailer_id: reportData.retailer_id,
        p_price_shekel: reportData.price_shekel,
        p_store_location: reportData.store_location || '',
        p_notes: reportData.notes || '',
        p_purchase_date: reportData.purchase_date || new Date().toISOString().split('T')[0],
        p_is_on_sale: reportData.is_on_sale || false,
        p_sale_price_shekel: reportData.sale_price_shekel || null
      }

      const { data, error } = await supabase.rpc('submit_price_report_final', submissionData)

      if (error) {
        throw new Error(`שגיאה בשליחת הדיווח: ${error.message}`)
      }

      const response: PriceReportResponse = data as PriceReportResponse

      if (!response.success) {
        throw new Error(response.error || 'שגיאה לא ידועה בשליחת הדיווח')
      }

      setLastResponse(response)
      return response

    } catch (err) {
      const errorResponse: PriceReportResponse = {
        success: false,
        error: err instanceof Error ? err.message : 'שגיאה לא ידועה'
      }
      
      setLastResponse(errorResponse)
      return errorResponse
    } finally {
      setIsSubmitting(false)
    }
  }, [supabase])

  const validatePriceReport = useCallback((reportData: Partial<PriceReportData>): string[] => {
    const errors: string[] = []

    if (!reportData.meat_cut_id) {
      errors.push('יש לבחור חתך בשר')
    }

    if (!reportData.retailer_id) {
      errors.push('יש לבחור רשת')
    }

    if (!reportData.price_shekel) {
      errors.push('יש להזין מחיר')
    } else if (reportData.price_shekel < 1 || reportData.price_shekel > 1000) {
      errors.push('מחיר חייב להיות בין 1-1000 ש"ח לק"ג')
    }

    if (reportData.is_on_sale && reportData.sale_price_shekel) {
      if (reportData.sale_price_shekel >= reportData.price_shekel!) {
        errors.push('מחיר המבצע חייב להיות נמוך ממחיר הרגיל')
      }
      if (reportData.sale_price_shekel < 1) {
        errors.push('מחיר המבצע חייב להיות חיובי')
      }
    }

    if (reportData.store_location && reportData.store_location.length > 100) {
      errors.push('מיקום החנות חייב להיות עד 100 תווים')
    }

    if (reportData.notes && reportData.notes.length > 500) {
      errors.push('הערות חייבות להיות עד 500 תווים')
    }

    return errors
  }, [])

  const clearLastResponse = useCallback(() => {
    setLastResponse(null)
  }, [])

  return {
    submitPriceReport,
    validatePriceReport,
    isSubmitting,
    lastResponse,
    clearLastResponse
  }
}