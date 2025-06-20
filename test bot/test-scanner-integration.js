// Test scanner integration with website API
import fetch from 'node-fetch';

async function testScannerIntegration() {
  console.log('🧪 Testing Scanner → Website Integration');
  
  // Sample scanner data (simulating basarometer-scanner.js output)
  const testScannerData = {
    scanInfo: {
      timestamp: new Date().toISOString(),
      testMode: true,
      targetSite: 'rami-levy',
      totalProducts: 3,
      originalProducts: 3,
      duplicatesRemoved: 0,
      validProducts: 3,
      sites: ['rami-levy'],
      categories: ['בקר', 'עוף']
    },
    products: [
      {
        id: 'test-1',
        name: 'בשר טחון בקר',
        originalName: 'בשר טחון בקר 500 גרם',
        normalizedName: 'בשר טחון בקר',
        brand: 'מטרף',
        weight: 500,
        price: 42.90,
        unit: 'גרם',
        pricePerKg: 85.80,
        site: 'rami-levy',
        siteName: 'רמי לוי',
        category: 'בקר',
        confidence: 0.95,
        timestamp: new Date().toISOString(),
        isValid: true
      },
      {
        id: 'test-2',
        name: 'חזה עוף',
        originalName: 'חזה עוף טרי 1 קילו',
        normalizedName: 'חזה עוף',
        brand: null,
        weight: 1000,
        price: 34.90,
        unit: 'ק"ג',
        pricePerKg: 34.90,
        site: 'rami-levy',
        siteName: 'רמי לוי',
        category: 'עוף',
        confidence: 0.88,
        timestamp: new Date().toISOString(),
        isValid: true
      },
      {
        id: 'test-3',
        name: 'אנטריקוט',
        originalName: 'סטייק אנטריקוט מיושן',
        normalizedName: 'אנטריקוט',
        brand: 'פרימיום',
        weight: null,
        price: 139.90,
        unit: 'ק"ג',
        pricePerKg: 139.90,
        site: 'rami-levy',
        siteName: 'רמי לוי',
        category: 'בקר',
        confidence: 0.92,
        timestamp: new Date().toISOString(),
        isValid: true
      }
    ]
  };

  // Test endpoints
  const endpoints = [
    'http://localhost:3000/api/scanner/ingest',
    'https://v3.basarometer.org/api/scanner/ingest'
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing endpoint: ${endpoint}`);
    
    try {
      // Test GET first (health check)
      console.log('  ➡️  GET request (health check)...');
      const getResponse = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'x-scanner-api-key': 'basarometer-scanner-v5-2025'
        }
      });
      
      console.log(`  📊 GET Status: ${getResponse.status}`);
      if (getResponse.ok) {
        const getResult = await getResponse.json();
        console.log('  ✅ GET Response:', JSON.stringify(getResult, null, 2));
      } else {
        console.log('  ❌ GET Failed:', await getResponse.text());
      }
      
      // Test POST with scanner data
      console.log('  ➡️  POST request (scanner data)...');
      const postResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-scanner-api-key': 'basarometer-scanner-v5-2025'
        },
        body: JSON.stringify(testScannerData)
      });
      
      console.log(`  📊 POST Status: ${postResponse.status}`);
      if (postResponse.ok) {
        const postResult = await postResponse.json();
        console.log('  ✅ POST Success:', JSON.stringify(postResult, null, 2));
      } else {
        const errorText = await postResponse.text();
        console.log('  ❌ POST Failed:', errorText);
      }
      
    } catch (error) {
      console.log(`  ❌ Connection Error: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Integration Test Complete');
}

// Run the test
testScannerIntegration().catch(console.error);