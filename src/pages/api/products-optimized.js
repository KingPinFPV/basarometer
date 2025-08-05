// Optimized API endpoint for handling 120+ products efficiently

export default async function handler(req, res) {
  try {
    const startTime = Date.now();
    
    // Create mock 120+ products database from multiple sources
    const mockProducts = generateMockProductsDatabase();
    
    // Extract query parameters for filtering and pagination
    const {
      page = 1,
      limit = 50,
      category = 'all',
      source = 'all',
      sortBy = 'price',
      sortOrder = 'asc',
      minPrice = 0,
      maxPrice = 1000
    } = req.query;
    
    let filteredProducts = [...mockProducts];
    
    // Apply filters
    if (category !== 'all') {
      filteredProducts = filteredProducts.filter(product => 
        product.category.toLowerCase().includes(category.toLowerCase()) ||
        product.name.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    if (source !== 'all') {
      filteredProducts = filteredProducts.filter(product => 
        product.source === source
      );
    }
    
    // Price filtering
    filteredProducts = filteredProducts.filter(product => {
      const price = parseFloat(product.price_per_kg) || 0;
      return price >= parseFloat(minPrice) && price <= parseFloat(maxPrice);
    });
    
    // Sorting
    filteredProducts.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'price':
          aVal = parseFloat(a.price_per_kg) || 0;
          bVal = parseFloat(b.price_per_kg) || 0;
          break;
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'vendor':
          aVal = a.vendor.toLowerCase();
          bVal = b.vendor.toLowerCase();
          break;
        default:
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      } else {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
    });
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    // Performance tracking
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Response
    res.status(200).json({
      success: true,
      data: {
        products: paginatedProducts,
        pagination: {
          current_page: pageNum,
          total_pages: Math.ceil(filteredProducts.length / limitNum),
          total_products: filteredProducts.length,
          products_per_page: limitNum,
          has_next: endIndex < filteredProducts.length,
          has_prev: pageNum > 1
        },
        filters: {
          category,
          source,
          price_range: { min: minPrice, max: maxPrice }
        },
        performance: {
          response_time_ms: responseTime,
          database_size: mockProducts.length,
          filtered_size: filteredProducts.length
        },
        sources: {
          government_products: mockProducts.filter(p => p.source === 'government').length,
          retail_products: mockProducts.filter(p => p.source === 'retail').length
        }
      }
    });
    
  } catch (error) {
    // API Error logged
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

function generateMockProductsDatabase() {
  const products = [];
  let idCounter = 1;
  
  // Government Products (89 products)
  const governmentProducts = [
    { name: 'אנטריקוט בקר טרי ממשלתי', category: 'בשר בקר', vendor: 'נתוני ממשלה', price_per_kg: 89.90 },
    { name: 'פרגית עוף ללא עצם ממשלתי', category: 'עוף ופרגיות', vendor: 'נתוני ממשלה', price_per_kg: 32.50 },
    { name: 'כתף כבש טרי ממשלתי', category: 'כבש וטלה', vendor: 'נתוני ממשלה', price_per_kg: 76.80 },
    { name: 'חזה עוף ללא עצם ממשלתי', category: 'עוף ופרגיות', vendor: 'נתוני ממשלה', price_per_kg: 41.20 },
    { name: 'שוקיים עוף טרי ממשלתי', category: 'עוף ופרגיות', vendor: 'נתוני ממשלה', price_per_kg: 18.90 },
    { name: 'צלעות בקר טרי ממשלתי', category: 'בשר בקר', vendor: 'נתוני ממשלה', price_per_kg: 67.50 },
    { name: 'כנפיים עוף טרי ממשלתי', category: 'עוף ופרגיות', vendor: 'נתוני ממשלה', price_per_kg: 16.80 },
    { name: 'קציצות בקר קפואות ממשלתי', category: 'בשר בקר', vendor: 'נתוני ממשלה', price_per_kg: 28.90 }
  ];
  
  const meatCuts = [
    'אנטריקוט', 'פילה', 'אוסובוקו', 'צלעות', 'שניצל', 'חזה', 'שוק', 'כנף', 'כתף', 'צוואר',
    'קציצות', 'נקניקיות', 'המבורגר', 'סטייק', 'רוסטביף', 'אמנטל', 'שחיטה'
  ];
  
  const vendors = [
    'שופרסל', 'רמי לוי', 'מגא', 'יוחננוף', 'ויקטורי', 'יינות ביתן', 'חצי חינם', 'טיב טעם'
  ];
  
  const categories = ['בשר בקר', 'עוף ופרגיות', 'כבש וטלה', 'בשר טחון', 'נקניקיות ונקניק'];
  
  // Generate 89 government products
  for (let i = 0; i < 89; i++) {
    const cut = meatCuts[i % meatCuts.length];
    const category = categories[i % categories.length];
    const basePrice = Math.random() * 80 + 15; // 15-95 NIS
    
    if (i < governmentProducts.length) {
      products.push({
        id: `gov_${idCounter++}`,
        name: governmentProducts[i].name,
        category: governmentProducts[i].category,
        vendor: governmentProducts[i].vendor,
        price_per_kg: governmentProducts[i].price_per_kg,
        source: 'government',
        verification: 'government_verified',
        scan_timestamp: new Date().toISOString(),
        confidence: 0.95 + Math.random() * 0.05
      });
    } else {
      products.push({
        id: `gov_${idCounter++}`,
        name: `${cut} ${category.includes('בקר') ? 'בקר' : category.includes('עוף') ? 'עוף' : 'כבש'} טרי ממשלתי`,
        category: category,
        vendor: 'נתוני ממשלה',
        price_per_kg: Math.round(basePrice * 100) / 100,
        source: 'government',
        verification: 'government_verified',
        scan_timestamp: new Date().toISOString(),
        confidence: 0.90 + Math.random() * 0.10
      });
    }
  }
  
  // Generate 31 retail products
  for (let i = 0; i < 31; i++) {
    const cut = meatCuts[i % meatCuts.length];
    const vendor = vendors[i % vendors.length];
    const category = categories[i % categories.length];
    const basePrice = Math.random() * 100 + 20; // 20-120 NIS
    
    products.push({
      id: `retail_${idCounter++}`,
      name: `${cut} ${category.includes('בקר') ? 'בקר' : category.includes('עוף') ? 'עוף' : 'כבש'} ${vendor}`,
      category: category,
      vendor: vendor,
      price_per_kg: Math.round(basePrice * 100) / 100,
      source: 'retail',
      verification: 'system_verified',
      scan_timestamp: new Date().toISOString(),
      confidence: 0.75 + Math.random() * 0.20
    });
  }
  
  return products;
}