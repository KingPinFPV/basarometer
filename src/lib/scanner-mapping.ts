// /src/lib/scanner-mapping.ts
import { supabase } from '@/lib/supabase';

// Site to Retailer Mapping based on actual scanner configuration
export const SITE_RETAILER_MAP: Record<string, string> = {
  'rami-levy': 'rami-levy',
  'carrefour': 'carrefour',
  'shufersal': 'shufersal', 
  'yohananof': 'yohananof',
  'hazi-hinam': 'hazi-hinam',
  'mega': 'mega',
  'victory': 'victory'
};

// Hebrew Meat Cut Detection with Enhanced Intelligence
export const HEBREW_MEAT_CUTS: Record<string, { 
  english: string; 
  category: string; 
  keywords: string[];
  priority: number;
}> = {
  'בשר טחון': {
    english: 'ground-beef',
    category: 'beef',
    keywords: ['טחון', 'קצוץ', 'טחינה'],
    priority: 1
  },
  'אנטריקוט': {
    english: 'entrecote',
    category: 'beef', 
    keywords: ['אנטריקוט', 'אנטרקוט'],
    priority: 1
  },
  'פילה': {
    english: 'fillet',
    category: 'beef',
    keywords: ['פילה', 'פיליה'],
    priority: 1
  },
  'כתף': {
    english: 'shoulder',
    category: 'beef',
    keywords: ['כתף', 'כתפיים'],
    priority: 2
  },
  'צלעות': {
    english: 'ribs',
    category: 'beef',
    keywords: ['צלעות', 'צלע'],
    priority: 2
  },
  'שניצל': {
    english: 'schnitzel',
    category: 'chicken',
    keywords: ['שניצל', 'שיניצל'],
    priority: 1
  },
  'עוף שלם': {
    english: 'whole-chicken',
    category: 'chicken',
    keywords: ['עוף שלם', 'עוף ללא חלקים'],
    priority: 1
  },
  'חזה עוף': {
    english: 'chicken-breast',
    category: 'chicken', 
    keywords: ['חזה עוף', 'חזה', 'חזות'],
    priority: 1
  },
  'שוק עוף': {
    english: 'chicken-thigh',
    category: 'chicken',
    keywords: ['שוק עוף', 'שוק', 'שוקיים'],
    priority: 1
  },
  'כנפיים': {
    english: 'chicken-wings',
    category: 'chicken',
    keywords: ['כנפיים', 'כנף'],
    priority: 2
  },
  'כבד עוף': {
    english: 'chicken-liver',
    category: 'chicken',
    keywords: ['כבד עוף', 'כבד'],
    priority: 3
  }
};

// Enhanced Brand Recognition for Israeli Market
export const ISRAELI_MEAT_BRANDS = [
  'מיט מאסטר', 'טיב טעם', 'יד מרדכי', 'שמש', 'ציפורי',
  'נטע', 'עוף טוב', 'עוף נמיר', 'עוף זהב', 'מטעמי שמש',
  'אמיר', 'בני ברק', 'רמת שלמה', 'מעולה', 'שלומית',
  'טרי', 'טבעי', 'מהדרין', 'מקור', 'איכותי'
];

// Grade Detection Keywords for Quality Classification
export const GRADE_KEYWORDS = {
  premium: ['פרימיום', 'מובחר', 'איכות מעולה', 'וואגיו', 'wagyu'],
  angus: ['אנגוס', 'angus', 'אנגס'],
  organic: ['אורגני', 'טבעי', 'אקולוגי', 'ביו'],
  kosher: ['מהדרין', 'כשר', 'רבנות', 'בד"צ'],
  fresh: ['טרי', 'יום', 'חדש'],
  frozen: ['קפוא', 'מוקפא', 'קפיאה']
};

/**
 * Maps scanner site name to retailer in database
 */
export async function mapSiteToRetailer(siteName: string): Promise<string> {
  const normalizedSite = siteName.toLowerCase().replace(/[^a-z-]/g, '');
  
  // Try direct mapping first
  const mappedName = SITE_RETAILER_MAP[normalizedSite];
  if (mappedName) {
    const { data: retailer } = await supabase
      .from('retailers')
      .select('id')
      .eq('name', mappedName)
      .single();
      
    if (retailer) return retailer.id;
  }
  
  // Try fuzzy matching by name
  const { data: retailers } = await supabase
    .from('retailers')
    .select('id, name')
    .ilike('name', `%${siteName}%`);
    
  if (retailers && retailers.length > 0) {
    return retailers[0].id;
  }
  
  // Fallback: return first available retailer
  const { data: fallback } = await supabase
    .from('retailers')
    .select('id')
    .limit(1)
    .single();
    
  return fallback?.id || '1';
}

/**
 * Enhanced meat cut detection with confidence scoring
 */
export async function findOrCreateMeatCut(
  productName: string, 
  category: string
): Promise<{ id: string; confidence: number }> {
  
  let bestMatch = { cut: '', confidence: 0, cutId: '' };
  
  // Score each possible meat cut
  for (const [hebrewName, cutInfo] of Object.entries(HEBREW_MEAT_CUTS)) {
    let score = 0;
    
    // Exact match gets highest score
    if (productName.includes(hebrewName)) {
      score = 1.0;
    } else {
      // Check keywords for partial matches
      for (const keyword of cutInfo.keywords) {
        if (productName.includes(keyword)) {
          score = Math.max(score, 0.8);
        }
      }
    }
    
    // Boost score based on priority
    score *= (cutInfo.priority === 1 ? 1.0 : cutInfo.priority === 2 ? 0.9 : 0.8);
    
    if (score > bestMatch.confidence) {
      bestMatch = { cut: hebrewName, confidence: score, cutId: cutInfo.english };
    }
  }
  
  // Try to find existing meat cut in database
  if (bestMatch.confidence > 0.5) {
    const { data: existingCut } = await supabase
      .from('meat_cuts')
      .select('id')
      .or(`name_hebrew.eq.${bestMatch.cut},name_english.eq.${bestMatch.cutId}`)
      .single();
      
    if (existingCut) {
      return { id: existingCut.id, confidence: bestMatch.confidence };
    }
  }
  
  // Category-based fallback
  const categoryMapping: Record<string, string> = {
    'דגים': 'fish',
    'עוף': 'chicken-breast', 
    'בקר': 'ground-beef',
    'כבש': 'lamb',
    'אחר': 'ground-beef'
  };
  
  const fallbackCut = categoryMapping[category] || 'ground-beef';
  const { data: fallbackData } = await supabase
    .from('meat_cuts')
    .select('id')
    .eq('name_english', fallbackCut)
    .single();
    
  if (fallbackData) {
    return { id: fallbackData.id, confidence: 0.3 };
  }
  
  // Ultimate fallback
  const { data: ultimate } = await supabase
    .from('meat_cuts') 
    .select('id')
    .limit(1)
    .single();
    
  return { id: ultimate?.id || '1', confidence: 0.1 };
}

/**
 * Enhanced brand detection from product name
 */
export function extractBrand(productName: string): string | null {
  const nameLower = productName.toLowerCase();
  
  for (const brand of ISRAELI_MEAT_BRANDS) {
    if (nameLower.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  
  // Extract potential brand from product name structure
  const words = productName.split(' ');
  if (words.length >= 2) {
    // First word might be brand
    const firstWord = words[0];
    if (firstWord.length > 2 && /^[\u0590-\u05FF]+$/.test(firstWord)) {
      return firstWord;
    }
  }
  
  return null;
}

/**
 * Detect quality grade from product name
 */
export function detectGrade(productName: string): {
  grade: string;
  confidence: number;
} {
  const nameLower = productName.toLowerCase();
  
  for (const [grade, keywords] of Object.entries(GRADE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword.toLowerCase())) {
        return { 
          grade, 
          confidence: grade === 'premium' || grade === 'angus' ? 0.9 : 0.7 
        };
      }
    }
  }
  
  return { grade: 'regular', confidence: 0.5 };
}

/**
 * Unit normalization with Hebrew support
 */
export function normalizeUnit(unit: string): string {
  if (!unit) return 'ק"ג';
  
  const unitLower = unit.toLowerCase().replace(/\s+/g, '');
  
  // Kilogram variations
  if (unitLower.match(/ק[״"]?ג|kg|קילו/)) {
    return 'ק"ג';
  }
  
  // Gram variations
  if (unitLower.match(/גר|gr|gram/)) {
    return 'גרם';
  }
  
  // Unit/piece variations
  if (unitLower.match(/יחידה|יח|unit|piece|ea/)) {
    return 'יחידה';
  }
  
  // Pound variations (convert to kg notation)
  if (unitLower.match(/לב|lb|pound/)) {
    return 'ק"ג'; // Will be converted in price calculation
  }
  
  return 'ק"ג'; // Default
}

/**
 * Calculate confidence score for the entire product mapping
 */
export function calculateMappingConfidence(
  cutConfidence: number,
  brandFound: boolean,
  gradeConfidence: number,
  priceValid: boolean
): number {
  let totalConfidence = cutConfidence * 0.4; // 40% weight for cut detection
  totalConfidence += (brandFound ? 0.9 : 0.3) * 0.2; // 20% weight for brand
  totalConfidence += gradeConfidence * 0.2; // 20% weight for grade
  totalConfidence += (priceValid ? 1.0 : 0.5) * 0.2; // 20% weight for valid price
  
  return Math.round(totalConfidence * 100) / 100;
}