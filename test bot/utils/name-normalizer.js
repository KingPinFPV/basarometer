const removeWords = [
  'מבצע', 'במחיר', 'מיוחד', 'איכותי', 'טרי', 'קפוא',
  'מומלץ', 'חדש', 'משובח', 'מעולה', 'ללא עצם',
  'עם עצם', 'ללא עור', 'עם עור', 'מיובש', 'מתובל'
];

const israeliBrands = [
  // מותגי בשר ישראליים
  'שגב', 'עוף טוב', 'ח.כ חיפה', 'יודפת', 'צפוני', 
  'רמת הגולן', 'ערד', 'כמו פעם', 'הר הכרמל',
  'מחפוד', 'סולתם', 'שיאון', 'פרי העמק', 'מעדני מיקי',
  'מן הטבע', 'בקר משובח', 'טופ שף', 'מיטב הבקר',
  
  // מותגי רשתות
  'רמי לוי', 'קרפור', 'שופרסל', 'מגה', 'יוחננוף',
  'חצי חינם', 'ויקטורי', 'טיב טעם', 'AM:PM', 'כשר לנד',
  
  // מותגים כלליים
  'אסם', 'תנובה', 'שטראוס', 'עלית', 'יוניליבר',
  'נסטלה', 'קוקה קולה', 'פריגת', 'ברקן', 'זוגלובק',
  
  // מותגי פרטי של רשתות
  'מחיר למשתלם', 'שף הבית', 'טוב במיוחד', 'מעולה'
];

function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  
  let normalized = name.trim();
  
  normalized = normalized.replace(/\d+%\s*שומן/gi, '');
  normalized = normalized.replace(/\d+\s*גר'/gi, '');
  normalized = normalized.replace(/\d+\s*ק"ג/gi, '');
  normalized = normalized.replace(/\d+\s*קילו/gi, '');
  
  const removePattern = new RegExp(`\\b(${removeWords.join('|')})\\b`, 'gi');
  normalized = normalized.replace(removePattern, '');
  
  normalized = normalized.replace(/\s+/g, ' ').trim();
  normalized = normalized.replace(/[^\u0590-\u05FF\u0020A-Za-z0-9]/g, ' ');
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

function extractBrand(name) {
  if (!name || typeof name !== 'string') return null;
  
  const normalizedName = name.toLowerCase();
  
  // חפש מותגים ברשימה המורחבת
  for (const brand of israeliBrands) {
    if (normalizedName.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  
  // נסה לזהות מותג לפי תבניות נפוצות
  const brandPatterns = [
    /^([א-ת\s]+)\s*-\s*/, // מותג - מוצר
    /^מותג\s+([א-ת\s]+)/, // מותג X
    /^של\s+([א-ת\s]+)/, // של X
    /\(([א-ת\s]+)\)/, // (מותג)
  ];
  
  for (const pattern of brandPatterns) {
    const match = name.match(pattern);
    if (match && match[1]) {
      const potentialBrand = match[1].trim();
      // בדוק אם זה לא מילת תיאור
      if (!removeWords.includes(potentialBrand.toLowerCase())) {
        return potentialBrand;
      }
    }
  }
  
  return null;
}

function extractWeight(name) {
  if (!name || typeof name !== 'string') return null;
  
  const weightPatterns = [
    /(\d+(?:\.\d+)?)\s*ק"ג/,
    /(\d+(?:\.\d+)?)\s*קילו/,
    /(\d+)\s*גר'/,
    /(\d+)\s*גרם/
  ];
  
  for (const pattern of weightPatterns) {
    const match = name.match(pattern);
    if (match) {
      const weight = parseFloat(match[1]);
      if (pattern.source.includes('גר')) {
        return weight / 1000;
      }
      return weight;
    }
  }
  
  return null;
}

function cleanProductName(originalName) {
  const normalized = normalizeName(originalName);
  const brand = extractBrand(originalName);
  const weight = extractWeight(originalName);
  
  return {
    originalName: originalName.trim(),
    normalizedName: normalized,
    brand,
    weight,
    cleanName: normalized.replace(brand || '', '').trim()
  };
}

import crypto from 'crypto';

function generateProductId(name, site) {
  const clean = normalizeName(name).replace(/\s+/g, '-').toLowerCase();
  const hash = crypto.createHash('md5').update(`${clean}-${site}`).digest('hex').substring(0, 8);
  return `${site}-${hash}`;
}

export {
  normalizeName,
  extractBrand,
  extractWeight,
  cleanProductName,
  generateProductId,
  removeWords,
  israeliBrands
};