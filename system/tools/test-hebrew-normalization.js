// Test script for Hebrew Product Normalization
// Run with: node test-hebrew-normalization.js

const { 
  normalizeHebrewProductName, 
  calculateHebrewSimilarity,
  groupProductsBySemanticSimilarity 
} = require('./src/utils/hebrewProductNormalization.ts')

// Test data similar to the CSV issue mentioned
const testProducts = [
  { id: '1', name: 'כנפיים עוף טרי רמי לוי קילו', network: 'rami-levy', price: 18.9 },
  { id: '2', name: 'כנפיים עוף יוחננוף קילו', network: 'yohananof', price: 19.9 },
  { id: '3', name: 'כנפי עוף טרי', network: 'shufersal', price: 17.5 },
  { id: '4', name: 'בשר טחון בקר 80/20', network: 'mega', price: 45.0 },
  { id: '5', name: 'בקר טחון פרמיום', network: 'victory', price: 52.0 },
  { id: '6', name: 'אנטריקוט מעולה', network: 'rami-levy', price: 89.0 },
  { id: '7', name: 'אנטריקוט פרימיום', network: 'shufersal', price: 95.0 }
]

console.log('🧪 Testing Hebrew Product Normalization\n')

// Test 1: Individual normalization
console.log('1️⃣ Testing individual product normalization:')
testProducts.forEach(product => {
  const normalized = normalizeHebrewProductName(product.name)
  console.log(`   "${product.name}" →`)
  console.log(`   ↳ "${normalized.normalized_name}" (${normalized.product_type}, ${Math.round(normalized.confidence_score * 100)}% confidence)`)
})

console.log('\n2️⃣ Testing similarity calculation:')
const similarity1 = calculateHebrewSimilarity('כנפיים עוף', 'כנפי עוף')
const similarity2 = calculateHebrewSimilarity('בשר טחון', 'בקר טחון')
const similarity3 = calculateHebrewSimilarity('אנטריקוט', 'אנטריקו')

console.log(`   "כנפיים עוף" vs "כנפי עוף": ${Math.round(similarity1 * 100)}% similarity`)
console.log(`   "בשר טחון" vs "בקר טחון": ${Math.round(similarity2 * 100)}% similarity`)
console.log(`   "אנטריקוט" vs "אנטריקו": ${Math.round(similarity3 * 100)}% similarity`)

console.log('\n3️⃣ Testing product grouping:')
const groups = groupProductsBySemanticSimilarity(testProducts, 0.7)

console.log(`   📊 Grouped ${testProducts.length} products into ${groups.length} unified groups:`)
groups.forEach((group, index) => {
  console.log(`   
   Group ${index + 1}: "${group.master_name}"`)
  console.log(`   ↳ Category: ${group.category}, Confidence: ${Math.round(group.confidence_score * 100)}%`)
  console.log(`   ↳ Networks: ${group.products.map(p => `${p.network} (₪${p.price})`).join(', ')}`)
  
  if (group.products.length > 1) {
    const prices = group.products.map(p => p.price)
    const bestPrice = Math.min(...prices)
    const worstPrice = Math.max(...prices)
    const savings = Math.round(((worstPrice - bestPrice) / worstPrice) * 100)
    console.log(`   ↳ 💰 Best: ₪${bestPrice}, Worst: ₪${worstPrice} → ${savings}% potential savings!`)
  }
})

console.log('\n✅ Hebrew normalization test completed!')
console.log(`📈 Deduplication: ${testProducts.length} → ${groups.length} products (${Math.round(((testProducts.length - groups.length) / testProducts.length) * 100)}% reduction)`)