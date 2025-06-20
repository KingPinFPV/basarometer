// integration-test.js - Test Scanner Integration with V3 Website
const fs = require('fs');
const path = require('path');

class ScannerWebsiteIntegration {
  constructor() {
    this.v3ApiUrl = 'http://localhost:3000/api/scanner'; // Local development
    this.productionApiUrl = 'https://v3.basarometer.org/api/scanner'; // Production
    this.apiKey = process.env.SCANNER_API_KEY || 'test-api-key-123';
    this.webhookSecret = process.env.SCANNER_WEBHOOK_SECRET || 'test-webhook-secret-456';
    
    console.log('🔧 Scanner-Website Integration Tester Initialized');
    console.log(`📡 API URLs: Dev: ${this.v3ApiUrl} | Prod: ${this.productionApiUrl}`);
  }

  // Test 1: Send Scanner Data to Website API
  async testDataIngestion(environment = 'dev') {
    console.log('\n🧪 Test 1: Scanner Data Ingestion');
    
    try {
      // Load recent scanner output
      const outputFiles = fs.readdirSync('./output').filter(f => f.includes('basarometer-scan'));
      if (outputFiles.length === 0) {
        throw new Error('No scanner output files found. Run scanner first.');
      }
      
      const latestFile = outputFiles.sort().reverse()[0];
      const scannerData = JSON.parse(fs.readFileSync(`./output/${latestFile}`, 'utf8'));
      
      console.log(`📄 Loading data from: ${latestFile}`);
      console.log(`📊 Products to send: ${scannerData.products.length}`);
      
      // Choose API URL based on environment
      const apiUrl = environment === 'prod' ? this.productionApiUrl : this.v3ApiUrl;
      
      // Test ingestion endpoint
      const response = await fetch(`${apiUrl}/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-scanner-api-key': this.apiKey
        },
        body: JSON.stringify(scannerData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Data ingestion successful!');
        console.log(`📈 Processed: ${result.processed} products`);
        console.log(`📊 Average confidence: ${result.averageConfidence}`);
        console.log(`🗑️ Duplicates removed: ${result.duplicatesRemoved}`);
      } else {
        console.error('❌ Data ingestion failed:', result);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Integration test failed:', error.message);
      return null;
    }
  }

  // Test 2: Send Webhook Notifications
  async testWebhookSystem(environment = 'dev') {
    console.log('\n🔔 Test 2: Webhook System');
    
    try {
      const apiUrl = environment === 'prod' ? this.productionApiUrl : this.v3ApiUrl;
      
      // Test scan started webhook
      const startedPayload = {
        event: 'scan_started',
        timestamp: new Date().toISOString(),
        site: 'test-site',
        data: {}
      };
      
      console.log('📡 Sending scan_started webhook...');
      const startedResponse = await fetch(`${apiUrl}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': this.webhookSecret
        },
        body: JSON.stringify(startedPayload)
      });
      
      if (startedResponse.ok) {
        console.log('✅ Scan started webhook successful');
      } else {
        console.error('❌ Scan started webhook failed');
      }
      
      // Test scan completed webhook
      const completedPayload = {
        event: 'scan_completed',
        timestamp: new Date().toISOString(),
        site: 'test-site',
        data: {
          products: 42,
          confidence: 0.85,
          duration: 15000
        }
      };
      
      console.log('📡 Sending scan_completed webhook...');
      const completedResponse = await fetch(`${apiUrl}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': this.webhookSecret
        },
        body: JSON.stringify(completedPayload)
      });
      
      if (completedResponse.ok) {
        console.log('✅ Scan completed webhook successful');
      } else {
        console.error('❌ Scan completed webhook failed');
      }
      
    } catch (error) {
      console.error('❌ Webhook test failed:', error.message);
    }
  }

  // Test 3: API Health Check
  async testApiHealth(environment = 'dev') {
    console.log('\n🏥 Test 3: API Health Check');
    
    try {
      const apiUrl = environment === 'prod' ? this.productionApiUrl : this.v3ApiUrl;
      
      // Test ingest endpoint health
      const ingestHealth = await fetch(`${apiUrl}/ingest`);
      const ingestResult = await ingestHealth.json();
      
      console.log(`📡 Ingest endpoint: ${ingestHealth.ok ? '✅' : '❌'}`);
      console.log(`📄 Response: ${ingestResult.status}`);
      
      // Test webhook endpoint health
      const webhookHealth = await fetch(`${apiUrl}/webhook`);
      const webhookResult = await webhookHealth.json();
      
      console.log(`🔔 Webhook endpoint: ${webhookHealth.ok ? '✅' : '❌'}`);
      console.log(`📄 Response: ${webhookResult.status}`);
      
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
    }
  }

  // Test 4: Data Transformation Validation
  async testDataTransformation() {
    console.log('\n🔄 Test 4: Data Transformation Validation');
    
    try {
      // Load scanner output
      const outputFiles = fs.readdirSync('./output').filter(f => f.includes('basarometer-scan'));
      if (outputFiles.length === 0) {
        throw new Error('No scanner output files found');
      }
      
      const latestFile = outputFiles.sort().reverse()[0];
      const scannerData = JSON.parse(fs.readFileSync(`./output/${latestFile}`, 'utf8'));
      
      console.log('🔍 Validating data transformation...');
      
      let validationResults = {
        totalProducts: scannerData.products.length,
        validProducts: 0,
        hebrewNameDetected: 0,
        brandDetected: 0,
        validPrices: 0,
        highConfidence: 0
      };
      
      scannerData.products.forEach(product => {
        if (product.isValid) validationResults.validProducts++;
        if (product.normalizedName && /[\u0590-\u05FF]/.test(product.normalizedName)) {
          validationResults.hebrewNameDetected++;
        }
        if (product.brand) validationResults.brandDetected++;
        if (product.pricePerKg > 0) validationResults.validPrices++;
        if (product.confidence >= 0.85) validationResults.highConfidence++;
      });
      
      console.log('📊 Validation Results:');
      console.log(`   📦 Total products: ${validationResults.totalProducts}`);
      console.log(`   ✅ Valid products: ${validationResults.validProducts} (${((validationResults.validProducts/validationResults.totalProducts)*100).toFixed(1)}%)`);
      console.log(`   🇮🇱 Hebrew names: ${validationResults.hebrewNameDetected} (${((validationResults.hebrewNameDetected/validationResults.totalProducts)*100).toFixed(1)}%)`);
      console.log(`   🏷️ Brands detected: ${validationResults.brandDetected} (${((validationResults.brandDetected/validationResults.totalProducts)*100).toFixed(1)}%)`);
      console.log(`   💰 Valid prices: ${validationResults.validPrices} (${((validationResults.validPrices/validationResults.totalProducts)*100).toFixed(1)}%)`);
      console.log(`   🎯 High confidence: ${validationResults.highConfidence} (${((validationResults.highConfidence/validationResults.totalProducts)*100).toFixed(1)}%)`);
      
      // Quality thresholds
      const qualityScore = (
        (validationResults.validProducts/validationResults.totalProducts) * 0.3 +
        (validationResults.hebrewNameDetected/validationResults.totalProducts) * 0.2 +
        (validationResults.validPrices/validationResults.totalProducts) * 0.3 +
        (validationResults.highConfidence/validationResults.totalProducts) * 0.2
      );
      
      console.log(`🏆 Overall Quality Score: ${(qualityScore * 100).toFixed(1)}%`);
      
      if (qualityScore >= 0.8) {
        console.log('✅ Excellent quality - Ready for production integration');
      } else if (qualityScore >= 0.6) {
        console.log('⚠️ Good quality - Minor improvements recommended');
      } else {
        console.log('❌ Quality issues detected - Review scanner configuration');
      }
      
      return validationResults;
      
    } catch (error) {
      console.error('❌ Data validation failed:', error.message);
      return null;
    }
  }

  // Test 5: Full Integration Workflow
  async runFullIntegrationTest(environment = 'dev') {
    console.log('\n🚀 Running Full Integration Test Suite');
    console.log(`🌍 Environment: ${environment.toUpperCase()}`);
    console.log('='.repeat(50));
    
    const results = {
      dataTransformation: await this.testDataTransformation(),
      apiHealth: await this.testApiHealth(environment),
      webhookSystem: await this.testWebhookSystem(environment),
      dataIngestion: await this.testDataIngestion(environment)
    };
    
    console.log('\n📋 Integration Test Summary');
    console.log('='.repeat(50));
    
    if (results.dataTransformation) {
      console.log('✅ Data transformation validated');
    } else {
      console.log('❌ Data transformation issues detected');
    }
    
    if (results.dataIngestion) {
      console.log('✅ Data ingestion successful');
    } else {
      console.log('❌ Data ingestion failed');
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Run scanner with: node basarometer-scanner.js --test');
    console.log('2. Check website dashboard for new data');
    console.log('3. Verify real-time updates are working');
    console.log('4. Test production environment when ready');
    
    return results;
  }
}

// CLI Usage
async function main() {
  const args = process.argv.slice(2);
  const environment = args.includes('--prod') ? 'prod' : 'dev';
  const testType = args.find(arg => ['health', 'webhook', 'data', 'transform', 'full'].includes(arg)) || 'full';
  
  const integration = new ScannerWebsiteIntegration();
  
  switch (testType) {
    case 'health':
      await integration.testApiHealth(environment);
      break;
    case 'webhook':
      await integration.testWebhookSystem(environment);
      break;
    case 'data':
      await integration.testDataIngestion(environment);
      break;
    case 'transform':
      await integration.testDataTransformation();
      break;
    case 'full':
    default:
      await integration.runFullIntegrationTest(environment);
      break;
  }
}

// Export for use in other scripts
module.exports = ScannerWebsiteIntegration;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

console.log('\n💡 Usage Examples:');
console.log('node integration-test.js              # Full test (dev)');
console.log('node integration-test.js --prod       # Full test (production)');
console.log('node integration-test.js health       # API health check');
console.log('node integration-test.js webhook      # Webhook test');
console.log('node integration-test.js data         # Data ingestion test');
console.log('node integration-test.js transform    # Data validation only');