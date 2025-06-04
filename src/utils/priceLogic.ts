import { PriceReport } from '@/types/market'

interface PriceRange {
  min: number
  max: number
  avg: number
}

export function calculatePriceColors(allPrices: PriceReport[]): Map<string, string> {
  const colorMap = new Map<string, string>()
  
  // Group prices by meat cut
  const pricesByMeatCut = new Map<string, PriceReport[]>()
  allPrices.forEach(price => {
    const prices = pricesByMeatCut.get(price.meat_cut_id) || []
    prices.push(price)
    pricesByMeatCut.set(price.meat_cut_id, prices)
  })

  // Calculate colors for each meat cut group
  pricesByMeatCut.forEach((prices) => {
    // Calculate effective prices (use sale price if available)
    const effectivePrices = prices.map(p => ({
      ...p,
      effectivePrice: p.is_on_sale && p.sale_price_per_kg ? p.sale_price_per_kg : p.price_per_kg
    }))

    // Calculate price range for this cut
    const range: PriceRange = {
      min: Math.min(...effectivePrices.map(p => p.effectivePrice)),
      max: Math.max(...effectivePrices.map(p => p.effectivePrice)),
      avg: effectivePrices.reduce((sum, p) => sum + p.effectivePrice, 0) / effectivePrices.length
    }

    // Assign colors based on price and sale status
    effectivePrices.forEach(price => {
      const key = `${price.meat_cut_id}-${price.retailer_id}`
      
      if (!price.price_per_kg) {
        colorMap.set(key, 'bg-gray-400') // No price data
        return
      }

      const effectivePrice = price.is_on_sale && price.sale_price_per_kg 
        ? price.sale_price_per_kg 
        : price.price_per_kg

      // Calculate relative position in price range
      const pricePosition = (effectivePrice - range.min) / (range.max - range.min)

      // Assign color based on price position and sale status
      if (effectivePrice === range.min) {
        colorMap.set(key, 'bg-green-500') // Cheapest
      } else if (effectivePrice === range.max) {
        colorMap.set(key, 'bg-red-500')   // Most expensive
      } else if (Math.abs(effectivePrice - range.avg) < (range.max - range.min) * 0.1) {
        colorMap.set(key, 'bg-yellow-500') // Around average (±10% range)
      } else {
        // Default gradient between min and max
        colorMap.set(key, pricePosition < 0.5 ? 'bg-green-300' : 'bg-red-300')
      }

      // Add sale indicator if applicable
      if (price.is_on_sale) {
        const baseColor = colorMap.get(key)
        colorMap.set(key, `${baseColor} ring-2 ring-blue-500`)
      }
    })
  })

  return colorMap
} 