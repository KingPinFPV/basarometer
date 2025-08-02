// Smart Product Categorization System
// Automated meat product classification with Hebrew and English support
// Built for 59-product professional comparison interface

const PRODUCT_CATEGORIES = {
  beef: {
    name: "🥩 בקר",
    icon: "🥩",
    hebrewKeywords: [
      "אנטריקוט", "פילה", "אסאדו", "בשר טחון", "ריב איי", "בקר",
      "סטייק", "רוסטביף", "בשר בקר", "צלע בקר", "כתף בקר",
      "בישול בקר", "צלי בקר", "בקר טחון", "המבורגר", "קוביות בקר",
      "בקר לבישול", "בקר לצלייה", "מתן בקר", "עצם בקר"
    ],
    englishKeywords: [
      "beef", "steak", "ribeye", "sirloin", "tenderloin", "chuck",
      "round", "brisket", "flank", "skirt", "beef mince", "ground beef",
      "hamburger", "roast beef", "beef cubes", "beef bones"
    ],
    expectedCount: 23
  },
  chicken: {
    name: "🐔 עוף",
    icon: "🐔",
    hebrewKeywords: [
      "עוף", "חזה עוף", "פרגיות", "כנפיים", "עוף שלם", "שוקיים",
      "ירך עוף", "כבד עוף", "עוף טחון", "שניצל עוף", "פילה עוף",
      "עוף טרי", "עוף קפוא", "עוף אורגני", "תרנגולת", "לב עוף",
      "צוואר עוף", "גב עוף", "עצמות עוף", "עור עוף"
    ],
    englishKeywords: [
      "chicken", "poultry", "breast", "thigh", "wing", "drumstick",
      "whole chicken", "chicken fillet", "ground chicken", "chicken mince",
      "chicken liver", "chicken heart", "organic chicken", "free range",
      "chicken schnitzel", "chicken cutlet"
    ],
    expectedCount: 28
  },
  lamb: {
    name: "🐑 כבש",
    icon: "🐑",
    hebrewKeywords: [
      "כבש", "כתף כבש", "קוטלט", "שוק כבש", "כבש טחון", "צלע כבש",
      "בשר כבש", "כבש לבישול", "כבש לצלייה", "איל", "גדי",
      "בשר גדי", "צלי כבש", "כבש טרי", "כבש קפוא"
    ],
    englishKeywords: [
      "lamb", "mutton", "sheep", "lamb chops", "leg of lamb", "lamb shoulder",
      "ground lamb", "lamb mince", "lamb rack", "lamb shank", "lamb stew"
    ],
    expectedCount: 5
  },
  fish: {
    name: "🐟 דגים",
    icon: "🐟", 
    hebrewKeywords: [
      "דג", "דגים", "דניס", "לברק", "סלמון", "פילה דג", "דג טרי",
      "דג קפוא", "טונה", "בקלה", "מושט", "ברמונדי", "אמנון",
      "בורי", "דג ים", "דג מתוק", "פורל", "הרינג"
    ],
    englishKeywords: [
      "fish", "salmon", "tuna", "sea bass", "sea bream", "cod", "halibut",
      "trout", "mackerel", "herring", "fillet", "whole fish", "fresh fish",
      "frozen fish", "white fish"
    ],
    expectedCount: 3
  },
  turkey: {
    name: "🦃 הודו",
    icon: "🦃",
    hebrewKeywords: [
      "הודו", "חזה הודו", "שוק הודו", "כנף הודו", "הודו טחון",
      "הודו שלם", "פרוס הודו", "הודו מעושן", "הודו טרי", "הודו קפוא"
    ],
    englishKeywords: [
      "turkey", "turkey breast", "turkey thigh", "turkey wing", "ground turkey",
      "whole turkey", "turkey slices", "smoked turkey", "turkey mince"
    ],
    expectedCount: 2
  },
  other: {
    name: "🍖 אחר",
    icon: "🍖",
    hebrewKeywords: [
      "בשר", "נקניק", "קבנוס", "נקניקיות", "מעדנים", "בשר מעובד",
      "פסטרמה", "סלמי", "חזיר", "בייקון", "נתחי בשר"
    ],
    englishKeywords: [
      "meat", "sausage", "salami", "pastrami", "deli", "processed meat",
      "bacon", "ham", "pork", "cold cuts", "meat products"
    ],
    expectedCount: 3
  }
};

/**
 * Categorize a product based on its Hebrew and English names
 * @param {string} productName - The product name (Hebrew or English)
 * @param {string} [englishName] - Optional English name
 * @returns {string} Category key (beef, chicken, lamb, fish, turkey, other)
 */
export function categorizeProduct(productName, englishName = '') {
  const fullText = `${productName} ${englishName}`.toLowerCase();
  
  // Check each category for keyword matches
  for (const [categoryKey, category] of Object.entries(PRODUCT_CATEGORIES)) {
    const allKeywords = [...category.hebrewKeywords, ...category.englishKeywords];
    
    if (allKeywords.some(keyword => fullText.includes(keyword.toLowerCase()))) {
      return categoryKey;
    }
  }
  
  return 'other';
}

/**
 * Get category display information
 * @param {string} categoryKey - Category key
 * @returns {object} Category info with name, icon, expected count
 */
export function getCategoryInfo(categoryKey) {
  return PRODUCT_CATEGORIES[categoryKey] || PRODUCT_CATEGORIES.other;
}

/**
 * Get all available categories
 * @returns {Array} Array of category objects with keys and info
 */
export function getAllCategories() {
  return Object.entries(PRODUCT_CATEGORIES).map(([key, info]) => ({
    key,
    ...info
  }));
}

/**
 * Categorize a list of products and return statistics
 * @param {Array} products - Array of product objects with name_hebrew and name_english
 * @returns {object} Categorization results with stats
 */
export function categorizeProductList(products) {
  const categorizedProducts = products.map(product => ({
    ...product,
    category: categorizeProduct(product.name_hebrew, product.name_english)
  }));

  const categoryStats = {};
  
  // Initialize stats for all categories
  Object.keys(PRODUCT_CATEGORIES).forEach(key => {
    categoryStats[key] = {
      count: 0,
      products: [],
      expectedCount: PRODUCT_CATEGORIES[key].expectedCount
    };
  });

  // Count products per category
  categorizedProducts.forEach(product => {
    const category = product.category;
    categoryStats[category].count++;
    categoryStats[category].products.push(product);
  });

  return {
    categorizedProducts,
    categoryStats,
    totalProducts: products.length,
    categoriesFound: Object.keys(categoryStats).filter(key => categoryStats[key].count > 0)
  };
}

/**
 * Validate categorization quality
 * @param {object} categoryStats - Results from categorizeProductList
 * @returns {object} Quality metrics
 */
export function validateCategorization(categoryStats) {
  const qualityMetrics = {
    overallAccuracy: 0,
    categoryAccuracies: {},
    uncategorizedCount: categoryStats.other?.count || 0,
    wellCategorizedCount: 0
  };

  let totalExpected = 0;
  let totalActual = 0;

  Object.entries(categoryStats).forEach(([key, stats]) => {
    if (key === 'other') return;
    
    const expected = stats.expectedCount;
    const actual = stats.count;
    
    totalExpected += expected;
    totalActual += actual;
    
    // Calculate accuracy for this category (how close to expected)
    const accuracy = expected > 0 ? Math.min(actual / expected, 1.0) : 0;
    qualityMetrics.categoryAccuracies[key] = {
      accuracy,
      expected,
      actual,
      status: actual >= expected * 0.8 ? 'good' : actual >= expected * 0.5 ? 'fair' : 'poor'
    };
    
    if (accuracy >= 0.8) {
      qualityMetrics.wellCategorizedCount++;
    }
  });

  qualityMetrics.overallAccuracy = totalExpected > 0 ? totalActual / totalExpected : 0;
  
  return qualityMetrics;
}

export default {
  categorizeProduct,
  getCategoryInfo,
  getAllCategories,
  categorizeProductList,
  validateCategorization,
  PRODUCT_CATEGORIES
};