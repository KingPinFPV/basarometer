const meatKeywords = [
  'בשר', 'בקר', 'עוף', 'טלה', 'כבש', 'דג', 'דגים',
  'אנטריקוט', 'סטייק', 'צלעות', 'כתף', 'חזה', 'פרגית',
  'שניצל', 'קציצות', 'נקניק', 'המבורגר', 'כבד', 'לב',
  'חזיר', 'בשר טחון', 'פילה', 'אסאדו', 'רוסטביף'
];

const meatCategories = {
  'בקר': ['בקר', 'אנטריקוט', 'סטייק', 'צלעות', 'אסאדו', 'רוסטביף'],
  'עוף': ['עוף', 'חזה', 'פרגית', 'שניצל עוף', 'כנפיים'],
  'כבש': ['כבש', 'טלה', 'כתף כבש', 'צלעות כבש'],
  'דגים': ['דג', 'דגים', 'סלמון', 'טונה', 'בס', 'דניס'],
  'מעובד': ['נקניק', 'המבורגר', 'קציצות', 'שניצל קפוא']
};

function isMeatProduct(productName) {
  if (!productName || typeof productName !== 'string') return false;
  
  const normalizedName = productName.toLowerCase().trim();
  return meatKeywords.some(keyword => normalizedName.includes(keyword));
}

function detectMeatCategory(productName) {
  if (!productName || typeof productName !== 'string') return 'אחר';
  
  const normalizedName = productName.toLowerCase().trim();
  
  for (const [category, keywords] of Object.entries(meatCategories)) {
    if (keywords.some(keyword => normalizedName.includes(keyword))) {
      return category;
    }
  }
  
  return isMeatProduct(productName) ? 'אחר' : null;
}

function calculateConfidence(productName, price, weight = null, brand = null) {
  let confidence = 0;
  
  // ציון בסיסי למילות מפתח (40%)
  if (isMeatProduct(productName)) {
    const category = detectMeatCategory(productName);
    if (category && category !== 'אחר') {
      confidence += 0.4; // זיהוי חזק
    } else {
      confidence += 0.25; // זיהוי חלש
    }
  }
  
  // ציון למחיר סביר (20%)
  if (isReasonablePrice(price, productName)) {
    confidence += 0.2;
  } else if (price && price > 0) {
    confidence += 0.1; // יש מחיר אבל לא בטווח הצפוי
  }
  
  // ציון לזיהוי משקל (20%)
  if (weight && weight > 0) {
    confidence += 0.2;
  } else if (productName && productName.match(/\d+\s*(גר|ק"ג|קילו)/)) {
    confidence += 0.1; // יש אזכור משקל בשם
  }
  
  // ציון למותג ידוע (10%)
  if (brand) {
    confidence += 0.1;
  }
  
  // ציון לשלמות הנתונים (10%)
  if (productName && productName.length > 5 && price) {
    confidence += 0.1;
  }
  
  return Math.min(1, Math.max(0, confidence));
}

function isReasonablePrice(price, productName) {
  if (!price || price <= 0) return false;
  
  const normalizedName = productName ? productName.toLowerCase() : '';
  
  // טווחי מחירים סבירים לק"ג
  const priceRanges = {
    'עוף': { min: 15, max: 80 },
    'בקר': { min: 40, max: 200 },
    'כבש': { min: 50, max: 150 },
    'דג': { min: 20, max: 150 },
    'טחון': { min: 30, max: 80 }
  };
  
  for (const [type, range] of Object.entries(priceRanges)) {
    if (normalizedName.includes(type)) {
      return price >= range.min && price <= range.max;
    }
  }
  
  // טווח כללי למוצרי בשר
  return price >= 10 && price <= 250;
}

export {
  meatKeywords,
  meatCategories,
  isMeatProduct,
  detectMeatCategory,
  calculateConfidence,
  isReasonablePrice
};