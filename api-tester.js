// api-tester.js
const baseUrl = 'https://v3.basarometer.org';

const endpointsToTest = [
  // Core Enhanced Intelligence endpoints
  '/api/products/enhanced/matrix',
  '/api/products/enhanced/analytics', 
  '/api/products/enhanced/queue',
  '/api/products/enhanced/approve',
  
  // Discovery Engine endpoints
  '/api/discovery/sources',
  '/api/discovery/validate',
  '/api/discovery/reliability',
  '/api/discovery/conflicts',
  '/api/discovery/queue',
  '/api/discovery/patterns',
  '/api/discovery/analytics/performance',
  '/api/discovery/analytics/coverage',
  
  // Learning APIs
  '/api/discovery/learning/patterns',
  '/api/discovery/learning/stats',
  '/api/discovery/learning/predictions',
  '/api/discovery/learning/conflicts',
  '/api/discovery/learning/intelligence',
  '/api/discovery/learning/run-session',
  '/api/discovery/learning/test',
  
  // Scanner System APIs
  '/api/scanner/ingest',
  '/api/scanner/webhook',
  
  // Debug endpoints
  '/api/debug/database',
  '/api/debug/runtime',
  '/api/discovery/test-simple'
];

async function testEndpoints() {
  console.log('🔍 Testing API Endpoints...');
  console.log(`Base URL: ${baseUrl}`);
  console.log('');
  
  for (const endpoint of endpointsToTest) {
    try {
      const response = await fetch(baseUrl + endpoint);
      const status = response.status;
      
      if (status === 200) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          console.log(`✅ ${endpoint}: SUCCESS (JSON response)`);
        } else {
          console.log(`⚠️ ${endpoint}: SUCCESS but not JSON`);
        }
      } else if (status === 404) {
        console.log(`❌ ${endpoint}: NOT FOUND`);
      } else if (status === 500) {
        console.log(`💥 ${endpoint}: SERVER ERROR`);
      } else {
        console.log(`⚠️ ${endpoint}: Status ${status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

testEndpoints();