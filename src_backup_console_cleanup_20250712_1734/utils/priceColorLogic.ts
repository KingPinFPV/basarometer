interface PriceReport {
  meat_cut_id: string;
  retailer_id: string;
  price_per_kg: number;
  is_on_sale: boolean;
  sale_price_per_kg?: number;
}

export function calculatePriceColors(allPrices: PriceReport[]): Map<string, string> {
  const colorMap = new Map<string, string>();
  
  // Group by meat_cut_id
  const pricesByMeatCut = new Map<string, PriceReport[]>();
  
  allPrices.forEach(price => {
    const key = price.meat_cut_id;
    if (!pricesByMeatCut.has(key)) {
      pricesByMeatCut.set(key, []);
    }
    pricesByMeatCut.get(key)!.push(price);
  });
  
  // Calculate colors for each meat category
  pricesByMeatCut.forEach((prices) => {
    if (prices.length === 0) return;
    
    // Calculate effective price for each report
    const effectivePrices = prices.map(p => ({
      ...p,
      effective_price: p.is_on_sale && p.sale_price_per_kg ? p.sale_price_per_kg : p.price_per_kg
    }));
    
    const minPrice = Math.min(...effectivePrices.map(p => p.effective_price));
    const maxPrice = Math.max(...effectivePrices.map(p => p.effective_price));
    
    effectivePrices.forEach(price => {
      const key = `${price.meat_cut_id}-${price.retailer_id}`;
      
      if (price.effective_price === minPrice) {
        colorMap.set(key, 'bg-green-500'); // Cheapest - green
      } else if (price.effective_price === maxPrice) {
        colorMap.set(key, 'bg-red-500'); // Most expensive - red
      } else {
        colorMap.set(key, 'bg-yellow-500'); // Average - yellow
      }
    });
  });
  
  return colorMap;
}

export function getSaleIndicator(isOnSale: boolean): string {
  return isOnSale ? '🔵' : '';
}

// Helper function to get cell background color
export function getCellBackgroundColor(colorMap: Map<string, string>, key: string): string {
  return colorMap.get(key) || 'bg-gray-200'; // Default to gray if no price data
}

// Helper function to format price display
export function formatPriceDisplay(price: number | null, isOnSale: boolean, salePrice: number | null): string {
  if (price === null) return '-';
  
  if (isOnSale && salePrice !== null) {
    return `₪${salePrice.toFixed(2)} (${price.toFixed(2)})`;
  }
  
  return `₪${price.toFixed(2)}`;
} 