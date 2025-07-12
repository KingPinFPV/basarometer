import type { MeatCut, PriceReport } from '@/lib/database.types'

export interface ColorResult {
  background: string
  text: string
  border: string
}

/**
 * Enhanced price color algorithm based on price ranges
 * Replaces the old height-based logic with proper range-based calculations
 */
export function getEnhancedPriceColor(
  priceReport: PriceReport | null,
  meatCut: MeatCut,
  allReportsForCut: PriceReport[] = []
): ColorResult {
  if (!priceReport) {
    return {
      background: 'bg-gray-50',
      text: 'text-gray-400',
      border: 'border-gray-200'
    }
  }

  const effectivePrice = priceReport.is_on_sale && priceReport.sale_price_per_kg 
    ? priceReport.sale_price_per_kg 
    : priceReport.price_per_kg

  // Use meat cut's typical price range if available
  if (meatCut.typical_price_range_min && meatCut.typical_price_range_max) {
    const minPrice = meatCut.typical_price_range_min
    const maxPrice = meatCut.typical_price_range_max
    const range = maxPrice - minPrice
    
    if (range > 0) {
      const normalized = (effectivePrice - minPrice) / range
      
      if (normalized <= 0.3) {
        return {
          background: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-300'
        }
      } else if (normalized <= 0.7) {
        return {
          background: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-300'
        }
      } else {
        return {
          background: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-300'
        }
      }
    }
  }

  // Fallback: Use dynamic range from all reports for this cut
  if (allReportsForCut.length > 1) {
    const prices = allReportsForCut.map(r => 
      r.is_on_sale && r.sale_price_per_kg ? r.sale_price_per_kg : r.price_per_kg
    )
    
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const range = maxPrice - minPrice
    
    if (range > 0) {
      const normalized = (effectivePrice - minPrice) / range
      
      if (normalized <= 0.33) {
        return {
          background: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-300'
        }
      } else if (normalized <= 0.66) {
        return {
          background: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-300'
        }
      } else {
        return {
          background: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-300'
        }
      }
    }
  }

  // Default neutral color
  return {
    background: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200'
  }
}

/**
 * Format price for display with sale indicators
 */
export function formatPriceDisplay(priceReport: PriceReport): {
  mainPrice: string
  originalPrice?: string
  saleIndicator?: string
} {
  const price = priceReport.price_per_kg / 100 // Convert from agorot to shekels
  
  if (priceReport.is_on_sale && priceReport.sale_price_per_kg) {
    const salePrice = priceReport.sale_price_per_kg / 100
    return {
      mainPrice: `₪${salePrice.toFixed(2)}`,
      originalPrice: `₪${price.toFixed(2)}`,
      saleIndicator: '🔥'
    }
  }
  
  return {
    mainPrice: `₪${price.toFixed(2)}`
  }
}

/**
 * Get confidence level styling
 */
export function getConfidenceStyle(confidenceScore: number): string {
  if (confidenceScore >= 4) return 'border-l-4 border-green-500'
  if (confidenceScore >= 3) return 'border-l-4 border-yellow-500'
  return 'border-l-4 border-red-500'
}

/**
 * Calculate price statistics for a meat cut
 */
export function calculatePriceStats(reports: PriceReport[]): {
  min: number
  max: number
  avg: number
  count: number
} {
  if (reports.length === 0) {
    return { min: 0, max: 0, avg: 0, count: 0 }
  }

  const prices = reports.map(r => 
    r.is_on_sale && r.sale_price_per_kg ? r.sale_price_per_kg : r.price_per_kg
  )

  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const avg = prices && prices.length > 0 ? (prices || []).reduce((sum, price) => sum + price, 0) / prices.length : 0

  return {
    min: min / 100, // Convert to shekels
    max: max / 100,
    avg: avg / 100,
    count: reports.length
  }
}