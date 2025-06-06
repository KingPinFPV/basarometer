import { PriceColor, PriceComparison } from '@/types/matrix'

export function calculatePriceColors(
  prices: (number | undefined)[],
  isPromotions: boolean[]
): PriceColor[] {
  const validPrices = prices.filter((p): p is number => p !== undefined && p > 0)
  
  if (validPrices.length === 0) {
    return prices.map(() => 'gray')
  }

  const minPrice = Math.min(...validPrices)
  const maxPrice = Math.max(...validPrices)
  const priceRange = maxPrice - minPrice
  
  // Define thresholds for color coding
  const cheapThreshold = minPrice + (priceRange * 0.25)
  const expensiveThreshold = maxPrice - (priceRange * 0.25)

  return prices.map((price, index) => {
    if (price === undefined || price <= 0) return 'gray'
    if (isPromotions[index]) return 'blue'
    if (price <= cheapThreshold) return 'green'
    if (price >= expensiveThreshold) return 'red'
    return 'yellow'
  })
}

export function getPriceColorClass(color: PriceColor): string {
  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    gray: 'bg-gray-100 text-gray-500 border-gray-200'
  }
  return colorClasses[color]
}

export function getPriceColorIndicator(color: PriceColor): string {
  const indicators = {
    green: '💚', // Cheap/Good price
    red: '❤️',   // Expensive
    blue: '💙',  // On sale/promotion
    yellow: '💛', // Average price
    gray: '⚫'   // No data
  }
  return indicators[color]
}

export function calculateCategoryPriceComparison(
  categoryPrices: (number | undefined)[]
): PriceComparison {
  const validPrices = categoryPrices.filter((p): p is number => p !== undefined && p > 0)
  
  if (validPrices.length === 0) {
    return {
      category: '',
      prices: [],
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0,
      priceRange: 0
    }
  }

  const minPrice = Math.min(...validPrices)
  const maxPrice = Math.max(...validPrices)
  const averagePrice = validPrices && validPrices.length > 0 ? (validPrices || []).reduce((sum, price) => sum + price, 0) / validPrices.length : 0

  return {
    category: '',
    prices: validPrices,
    averagePrice: Math.round(averagePrice * 100) / 100,
    minPrice,
    maxPrice,
    priceRange: maxPrice - minPrice
  }
}