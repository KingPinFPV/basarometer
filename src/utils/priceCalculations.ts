// Price Per Kilogram Calculation System
// Professional meat price comparison with weight normalization
// Supports Hebrew units and multi-network value ranking

const WEIGHT_UNITS = {
  'ק"ג': 1000,      // kilogram
  'ק״ג': 1000,      // kilogram (alternative notation)
  'קילוגרם': 1000,   // kilogram (full word)
  'גרם': 1,         // gram
  'ג': 1,           // gram (short)
  'ג׳': 1,          // gram (alternative)
  'לב': 500,        // pound (approximate)
  'אונקיה': 28.35,  // ounce
  'יחידה': 1000,    // unit (assume 1kg for meat products)
  'חבילה': 1000,    // package (assume 1kg)
  'מארז': 1000      // pack (assume 1kg)
};

const PRICE_BADGES = {
  first: { emoji: '🏆', label: 'הטוב ביותר', class: 'bg-yellow-100 text-yellow-800' },
  second: { emoji: '🥈', label: 'שני במקום', class: 'bg-gray-100 text-gray-800' },
  third: { emoji: '🥉', label: 'שלישי במקום', class: 'bg-amber-100 text-amber-800' }
};

/**
 * Parse weight from Hebrew text
 * @param {string} weightText - Weight text (e.g., "1 ק״ג", "500 גרם")
 * @returns {number} Weight in grams
 */
export function parseWeight(weightText) {
  if (!weightText || typeof weightText !== 'string') {
    return 1000; // Default to 1kg for meat products
  }

  const normalizedText = weightText.trim().toLowerCase();
  
  // Extract number and unit
  const match = normalizedText.match(/(\d+(?:\.\d+)?)\s*([א-ת"״׳']+)/);
  
  if (!match) {
    // Try to find just a number (assume kg)
    const numberMatch = normalizedText.match(/(\d+(?:\.\d+)?)/);
    if (numberMatch) {
      return parseFloat(numberMatch[1]) * 1000; // Assume kg
    }
    return 1000; // Default fallback
  }

  const [, numberStr, unit] = match;
  const number = parseFloat(numberStr);
  
  // Find unit multiplier
  const multiplier = WEIGHT_UNITS[unit] || 1000; // Default to kg if unit not found
  
  return number * multiplier;
}

/**
 * Calculate price per kilogram (1000g)
 * @param {number} price - Price in shekels
 * @param {string|number} weight - Weight text or number in grams
 * @returns {number} Price per kilogram (rounded to 2 decimals)
 */
export function calculatePricePerKg(price, weight) {
  if (!price || price <= 0) return 0;
  
  const weightInGrams = typeof weight === 'string' ? parseWeight(weight) : weight;
  
  if (weightInGrams <= 0) return 0;
  
  // Calculate price per 1000g (1kg)
  const pricePerKg = (price / weightInGrams) * 1000;
  
  return Math.round(pricePerKg * 100) / 100; // Round to 2 decimals
}

/**
 * Find the best value (lowest price per kg) across networks
 * @param {Array} networkPrices - Array of {network, price, weight, unit} objects
 * @returns {object} Best value network with calculated price per kg
 */
export function findBestValue(networkPrices) {
  if (!networkPrices || networkPrices.length === 0) return null;

  const validPrices = networkPrices
    .filter(item => item.price && item.price > 0)
    .map(item => ({
      ...item,
      pricePerKg: calculatePricePerKg(item.price, item.weight || item.unit)
    }))
    .filter(item => item.pricePerKg > 0);

  if (validPrices.length === 0) return null;

  return validPrices.reduce((best, current) => 
    current.pricePerKg < best.pricePerKg ? current : best
  );
}

/**
 * Add value ranking badges to network prices
 * @param {Array} networkPrices - Array of network price objects
 * @returns {Array} Network prices with badges and rankings
 */
export function addValueBadges(networkPrices) {
  if (!networkPrices || networkPrices.length === 0) return [];

  // Calculate price per kg for each network
  const pricesWithPerKg = networkPrices
    .filter(item => item.price && item.price > 0)
    .map(item => ({
      ...item,
      pricePerKg: calculatePricePerKg(item.price, item.weight || item.unit)
    }))
    .filter(item => item.pricePerKg > 0);

  // Sort by price per kg (ascending - cheapest first)
  const sortedPrices = [...pricesWithPerKg].sort((a, b) => a.pricePerKg - b.pricePerKg);

  // Add badges and rankings
  const rankedPrices = sortedPrices.map((item, index) => {
    const ranking = index + 1;
    let badge = null;

    if (ranking === 1) {
      badge = PRICE_BADGES.first;
    } else if (ranking === 2) {
      badge = PRICE_BADGES.second;
    } else if (ranking === 3) {
      badge = PRICE_BADGES.third;
    }

    return {
      ...item,
      ranking,
      badge,
      savingsFromBest: ranking === 1 ? 0 : 
        Math.round(((item.pricePerKg - sortedPrices[0].pricePerKg) / sortedPrices[0].pricePerKg) * 100)
    };
  });

  return rankedPrices;
}

/**
 * Calculate comprehensive price analysis for a product
 * @param {Array} networkPrices - Array of network price objects
 * @returns {object} Complete price analysis
 */
export function calculatePriceAnalysis(networkPrices) {
  if (!networkPrices || networkPrices.length === 0) {
    return {
      bestPrice: 0,
      worstPrice: 0,
      avgPrice: 0,
      bestPricePerKg: 0,
      worstPricePerKg: 0,
      avgPricePerKg: 0,
      savingsPotential: 0,
      networksCount: 0,
      pricesWithBadges: []
    };
  }

  const pricesWithBadges = addValueBadges(networkPrices);
  
  if (pricesWithBadges.length === 0) {
    return {
      bestPrice: 0,
      worstPrice: 0,
      avgPrice: 0,
      bestPricePerKg: 0,
      worstPricePerKg: 0,
      avgPricePerKg: 0,
      savingsPotential: 0,
      networksCount: 0,
      pricesWithBadges: []
    };
  }

  const prices = pricesWithBadges.map(p => p.price);
  const pricesPerKg = pricesWithBadges.map(p => p.pricePerKg);

  const bestPrice = Math.min(...prices);
  const worstPrice = Math.max(...prices);
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

  const bestPricePerKg = Math.min(...pricesPerKg);
  const worstPricePerKg = Math.max(...pricesPerKg);
  const avgPricePerKg = pricesPerKg.reduce((sum, price) => sum + price, 0) / pricesPerKg.length;

  const savingsPotential = worstPricePerKg > bestPricePerKg 
    ? ((worstPricePerKg - bestPricePerKg) / worstPricePerKg) * 100 
    : 0;

  return {
    bestPrice: Math.round(bestPrice * 100) / 100,
    worstPrice: Math.round(worstPrice * 100) / 100,
    avgPrice: Math.round(avgPrice * 100) / 100,
    bestPricePerKg: Math.round(bestPricePerKg * 100) / 100,
    worstPricePerKg: Math.round(worstPricePerKg * 100) / 100,
    avgPricePerKg: Math.round(avgPricePerKg * 100) / 100,
    savingsPotential: Math.round(savingsPotential * 100) / 100,
    networksCount: pricesWithBadges.length,
    pricesWithBadges
  };
}

/**
 * Format price per kg for display
 * @param {number} pricePerKg - Price per kilogram
 * @returns {string} Formatted price string
 */
export function formatPricePerKg(pricePerKg) {
  if (!pricePerKg || pricePerKg <= 0) return '₪0.00';
  
  return `₪${pricePerKg.toFixed(2)}`;
}

/**
 * Get price color class based on ranking
 * @param {number} ranking - Price ranking (1 = best, 2 = second, etc.)
 * @returns {string} CSS class for color
 */
export function getPriceColorClass(ranking) {
  switch (ranking) {
    case 1: return 'text-green-600 font-bold';
    case 2: return 'text-blue-600 font-semibold';
    case 3: return 'text-orange-600 font-medium';
    default: return 'text-gray-600';
  }
}

/**
 * Calculate savings display text
 * @param {number} savingsFromBest - Percentage more expensive than best price
 * @returns {string} Savings display text
 */
export function getSavingsText(savingsFromBest) {
  if (!savingsFromBest || savingsFromBest <= 0) return '';
  
  return `+${savingsFromBest}%`;
}

const priceCalculations = {
  parseWeight,
  calculatePricePerKg,
  findBestValue,
  addValueBadges,
  calculatePriceAnalysis,
  formatPricePerKg,
  getPriceColorClass,
  getSavingsText,
  WEIGHT_UNITS,
  PRICE_BADGES
};

export default priceCalculations;