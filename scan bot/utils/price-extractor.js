const pricePatterns = [
  /₪\s*(\d+(?:\.\d{1,2})?)/g,
  /(\d+(?:\.\d{1,2})?)\s*₪/g,
  /(\d+(?:\.\d{1,2})?)\s*שקל/g,
  /(\d+(?:\.\d{1,2})?)\s*ש"ח/g,
  /מחיר:\s*(\d+(?:\.\d{1,2})?)/g,
  /(\d+(?:\.\d{1,2})?)\s*ש״ח/g
];

const improvedUnitPatterns = [
  // משקלים
  { pattern: /(\d+(?:\.\d+)?)\s*ק[״"']?ג/gi, unit: 'kg', multiplier: 1 },
  { pattern: /(\d+(?:\.\d+)?)\s*קילו/gi, unit: 'kg', multiplier: 1 },
  { pattern: /(\d+(?:\.\d+)?)\s*גר[״"']?/gi, unit: 'gr', multiplier: 0.001 },
  { pattern: /(\d+(?:\.\d+)?)\s*ג[״"']?ר/gi, unit: 'gr', multiplier: 0.001 },
  { pattern: /(\d+(?:\.\d+)?)\s*גרם/gi, unit: 'gr', multiplier: 0.001 },
  
  // יחידות
  { pattern: /ליח[״"']?|ליחידה|יח[״"']?|יח׳|יחידה/gi, unit: 'unit', multiplier: null },
  { pattern: /חבילה|אריזה|מארז/gi, unit: 'package', multiplier: null },
  
  // נפח
  { pattern: /(\d+(?:\.\d+)?)\s*מ[״"']?ל/gi, unit: 'ml', multiplier: 0.001 },
  { pattern: /(\d+(?:\.\d+)?)\s*ליטר/gi, unit: 'liter', multiplier: 1 },
  
  // מחיר לקילו
  { pattern: /לק[״"']?ג|לקילו/gi, unit: 'per_kg', multiplier: 1 }
];

function extractPrice(text) {
  if (!text || typeof text !== 'string') return null;
  
  const cleanText = text.replace(/[,]/g, '').trim();
  
  for (const pattern of pricePatterns) {
    const matches = [...cleanText.matchAll(pattern)];
    if (matches.length > 0) {
      const priceMatch = matches[0][1];
      const price = parseFloat(priceMatch);
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
  }
  
  const numberPattern = /(\d+(?:\.\d{1,2})?)/;
  const match = cleanText.match(numberPattern);
  if (match) {
    const price = parseFloat(match[1]);
    if (!isNaN(price) && price > 5 && price < 1000) {
      return price;
    }
  }
  
  return null;
}

function extractUnit(text) {
  if (!text || typeof text !== 'string') return { unit: 'unit', display: 'יחידה' };
  
  const normalizedText = text.toLowerCase();
  
  // בדוק אם זה מחיר לקילו
  if (normalizedText.includes('לק"ג') || normalizedText.includes('לקילו')) {
    return { unit: 'per_kg', display: 'לק"ג' };
  }
  
  // חפש משקל בטקסט
  for (const unitInfo of improvedUnitPatterns) {
    const matches = text.match(unitInfo.pattern);
    if (matches && matches.length > 0) {
      // אם יש מספר לפני היחידה, החזר אותו
      if (matches[1]) {
        return { 
          unit: unitInfo.unit, 
          display: matches[0],
          value: parseFloat(matches[1]),
          multiplier: unitInfo.multiplier
        };
      }
      return { unit: unitInfo.unit, display: matches[0] };
    }
  }
  
  return { unit: 'unit', display: 'יחידה' };
}

function calculatePricePerKg(price, unitInfo, weight = null) {
  if (!price || price <= 0) return null;
  
  // אם זה אובייקט יחידה חדש
  if (unitInfo && typeof unitInfo === 'object') {
    // אם זה כבר מחיר לק"ג
    if (unitInfo.unit === 'per_kg') {
      return price;
    }
    
    // אם יש משקל ביחידה עצמה
    if (unitInfo.value && unitInfo.multiplier) {
      const weightInKg = unitInfo.value * unitInfo.multiplier;
      return Math.round((price / weightInKg) * 100) / 100;
    }
  }
  
  // תמיכה לאחור בטקסט רגיל
  const unitText = typeof unitInfo === 'string' ? unitInfo.toLowerCase() : '';
  
  if (unitText.includes('ק"ג') || unitText.includes('קילו') || unitText.includes('לק"ג')) {
    return price;
  }
  
  // אם יש משקל נפרד
  if (weight && weight > 0) {
    const weightInKg = weight > 10 ? weight / 1000 : weight;
    return Math.round((price / weightInKg) * 100) / 100;
  }
  
  // אם אין מידע על משקל, החזר את המחיר כמו שהוא
  return price;
}

function validatePrice(price) {
  if (!price || typeof price !== 'number') return false;
  return price > 0 && price < 2000 && !isNaN(price);
}

function extractPriceFromElements(elements) {
  const results = [];
  
  elements.forEach(element => {
    const text = element.textContent || element.innerText || '';
    const price = extractPrice(text);
    const unit = extractUnit(text);
    
    if (validatePrice(price)) {
      results.push({
        price,
        unit,
        pricePerKg: calculatePricePerKg(price, unit),
        originalText: text.trim()
      });
    }
  });
  
  return results.length > 0 ? results[0] : null;
}

export {
  extractPrice,
  extractUnit,
  calculatePricePerKg,
  validatePrice,
  extractPriceFromElements,
  pricePatterns,
  improvedUnitPatterns
};