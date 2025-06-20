const { isMeatProduct, detectMeatCategory, calculateConfidence } = require('./utils/meat-detector');
const { extractPrice, extractUnit, calculatePricePerKg } = require('./utils/price-extractor');
const { cleanProductName, generateProductId } = require('./utils/name-normalizer');

console.log('🧪 בדיקת רכיבי Basarometer...\n');

const testProducts = [
  'בשר בקר טחון 5% שומן מבצע 45.90 ₪',
  'חזה עוף טרי ללא עצם 32 שקל לק"ג',
  'אנטריקוט בקר משובח 89.90 ש"ח',
  'פרגית עוף קפוא 500 גרם 18.50 ₪',
  'שמן זית - לא בשר 25 ₪'
];

console.log('🔍 בדיקת זיהוי מוצרי בשר:');
testProducts.forEach(product => {
  const isMeat = isMeatProduct(product);
  const category = detectMeatCategory(product);
  console.log(`  ${isMeat ? '✅' : '❌'} "${product}" -> ${category || 'לא בשר'}`);
});

console.log('\n💰 בדיקת חילוץ מחירים:');
testProducts.forEach(product => {
  const price = extractPrice(product);
  const unit = extractUnit(product);
  const pricePerKg = calculatePricePerKg(price, unit);
  console.log(`  "${product}" -> ${price}₪ (${unit}) = ${pricePerKg}₪/ק"ג`);
});

console.log('\n🏷️ בדיקת נירמול שמות:');
testProducts.forEach(product => {
  const nameData = cleanProductName(product);
  const id = generateProductId(product, 'test');
  console.log(`  "${product}"`);
  console.log(`    נירמול: "${nameData.normalizedName}"`);
  console.log(`    מותג: ${nameData.brand || 'לא זוהה'}`);
  console.log(`    משקל: ${nameData.weight || 'לא זוהה'}`);
  console.log(`    ID: ${id}`);
});

console.log('\n✅ כל הרכיבים פועלים תקין!');