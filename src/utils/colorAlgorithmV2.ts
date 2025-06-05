import type { MeatCut, PriceReport } from '@/lib/database.types'

export interface ColorResultV2 {
  background: string
  text: string
  border: string
  priority: number
  label: string
}

/**
 * ColorAlgorithmV2 - Priority-based color system for Basarometer V5.1
 * 
 * Priority Order (highest to lowest):
 * 1. Gray: No price data (price === null || price === 0)
 * 2. Blue: On sale (is_on_sale === true) - PRIORITY OVER EVERYTHING
 * 3. Green: Cheapest in category (lowest price_per_kg when not on sale)
 * 4. Red: Most expensive in category (highest price_per_kg when not on sale)
 * 5. Yellow: Middle range (everything else)
 */

export function getColorAlgorithmV2(
  priceReport: PriceReport | null,
  meatCut: MeatCut,
  allReportsInCategory: PriceReport[]
): ColorResultV2 {
  // Priority 1: Gray - No price data
  if (!priceReport || !priceReport.price_per_kg || priceReport.price_per_kg === 0) {
    return {
      background: 'bg-gray-50',
      text: 'text-gray-500',
      border: 'border-gray-200',
      priority: 1,
      label: 'אין מידע'
    }
  }

  // Priority 2: Blue - On sale (HIGHEST PRIORITY when data exists)
  if (priceReport.is_on_sale) {
    return {
      background: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-300',
      priority: 2,
      label: 'מבצע'
    }
  }

  // For Green/Red/Yellow calculation, we need non-sale prices in the same category
  // Include current report if it's not on sale, exclude if it is (to avoid self-comparison in sale category)
  const categoryReports = allReportsInCategory.filter(report => 
    // Only non-sale prices for fair comparison
    !report.is_on_sale && report.price_per_kg && report.price_per_kg > 0
  )

  // Edge case: No other items in category or only one item total = Yellow
  if (categoryReports.length <= 1) {
    return {
      background: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-300',
      priority: 5,
      label: categoryReports.length === 0 ? 'מחיר יחיד' : 'מחיר בסיסי'
    }
  }

  const currentPrice = priceReport.price_per_kg
  const categoryPrices = categoryReports.map(r => r.price_per_kg)
  const minPrice = Math.min(...categoryPrices)
  const maxPrice = Math.max(...categoryPrices)

  // Priority 3: Green - Cheapest in category
  if (currentPrice <= minPrice) {
    return {
      background: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
      priority: 3,
      label: 'הזול ביותר'
    }
  }

  // Priority 4: Red - Most expensive in category
  if (currentPrice >= maxPrice) {
    return {
      background: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
      priority: 4,
      label: 'היקר ביותר'
    }
  }

  // Priority 5: Yellow - Middle range
  return {
    background: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    priority: 5,
    label: 'מחיר בינוני'
  }
}

/**
 * Calculate category statistics for debugging and analytics
 */
export function getCategoryColorStats(allReportsInCategory: PriceReport[]): {
  totalReports: number
  onSaleCount: number
  regularPrices: number[]
  minPrice: number
  maxPrice: number
  avgPrice: number
} {
  const regularReports = allReportsInCategory.filter(r => 
    !r.is_on_sale && r.price_per_kg && r.price_per_kg > 0
  )
  
  const regularPrices = regularReports.map(r => r.price_per_kg)
  const onSaleCount = allReportsInCategory.filter(r => r.is_on_sale).length

  return {
    totalReports: allReportsInCategory.length,
    onSaleCount,
    regularPrices,
    minPrice: regularPrices.length > 0 ? Math.min(...regularPrices) : 0,
    maxPrice: regularPrices.length > 0 ? Math.max(...regularPrices) : 0,
    avgPrice: regularPrices.length > 0 ? 
      regularPrices.reduce((sum, price) => sum + price, 0) / regularPrices.length : 0
  }
}

/**
 * Enhanced price formatting with V2 color context
 */
export function formatPriceWithContext(
  priceReport: PriceReport,
  colorResult: ColorResultV2
): {
  mainPrice: string
  originalPrice?: string
  saleIndicator?: string
  contextLabel: string
} {
  const price = priceReport.price_per_kg / 100 // Convert from agorot to shekels
  
  let result: {
    mainPrice: string
    originalPrice?: string
    saleIndicator?: string
    contextLabel: string
  } = {
    mainPrice: `₪${price.toFixed(2)}`,
    contextLabel: colorResult.label
  }

  if (priceReport.is_on_sale && priceReport.sale_price_per_kg) {
    const salePrice = priceReport.sale_price_per_kg / 100
    result = {
      mainPrice: `₪${salePrice.toFixed(2)}`,
      originalPrice: `₪${price.toFixed(2)}`,
      saleIndicator: '🔥',
      contextLabel: colorResult.label
    }
  }
  
  return result
}

/**
 * Color legend data for UI components
 */
export const COLOR_LEGEND_V2 = [
  {
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    label: 'אין מידע',
    description: 'לא דווח מחיר עדיין',
    priority: 1
  },
  {
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    label: 'מבצע',
    description: 'מחיר מוזל - עדיפות גבוהה',
    priority: 2
  },
  {
    color: 'bg-green-100 text-green-700 border-green-300',
    label: 'הזול ביותר',
    description: 'המחיר הנמוך בקטגוריה',
    priority: 3
  },
  {
    color: 'bg-red-100 text-red-700 border-red-300',
    label: 'היקר ביותר',
    description: 'המחיר הגבוה בקטגוריה',
    priority: 4
  },
  {
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    label: 'מחיר בינוני',
    description: 'מחיר ממוצע בקטגוריה',
    priority: 5
  }
]