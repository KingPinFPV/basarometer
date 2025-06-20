console.log('🔍 Website Analyzer Starting...');
console.log('📋 Command Line Args:', process.argv);
console.log('🔧 Working Directory:', process.cwd());
console.log('📁 Node Version:', process.version);

// Add error handlers for silent failures:
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Promise Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  console.error('📍 Stack:', error.stack);
  process.exit(1);
});

console.log('✅ Error handlers set up');

console.log('📦 Importing dependencies...');
import puppeteer from 'puppeteer-extra';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// ES Module equivalents for __dirname and __filename
console.log('📁 Setting up __dirname and __filename...');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log('📍 __dirname:', __dirname);

console.log('🕷️ Setting up Puppeteer plugins...');
puppeteer.use(StealthPlugin());

class WebsiteAnalyzer {
  constructor(options = {}) {
    console.log('🏗️ WebsiteAnalyzer constructor called with options:', options);
    this.testMode = options.test || false;
    this.debugMode = options.debug || true; // Default to debug for error analysis
    this.targetUrl = options.target || 'https://v3.basarometer.org';
    this.results = [];
    this.errors = [];
    this.stats = { 
      pagesAnalyzed: 0, 
      errorsFound: 0, 
      componentsFailedToLoad: 0,
      performanceIssues: 0
    };
    
    // Define routes to analyze - Enhanced Intelligence Migration Focus
    this.routes = [
      '/',           // CRITICAL - Homepage (suspected legacy matrix issues)
      '/enhanced',   // Enhanced Intelligence Matrix (primary component)
      '/admin',      // Enhanced Intelligence Admin (requires auth testing)
      '/index',      // Alternative homepage route
      '/ocr',        // Scanner functionality
      '/trends',     // Price trends
      '/rankings',   // Store rankings
      '/shopping-lists', // Shopping lists  
      '/community'   // Community features
    ];
    
    // Admin credentials for Enhanced Intelligence testing
    this.adminCredentials = {
      email: process.env.ADMIN_EMAIL || 'admintest1@basarometer.org',
      password: process.env.ADMIN_PASSWORD || '123123'
    };
    
    console.log('✅ WebsiteAnalyzer instance created');
  }

  async initialize() {
    console.log('🚀 Initializing Website Analyzer...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Keep visible to see what's happening
      defaultViewport: null,
      args: [
        '--no-sandbox', 
        '--start-maximized',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();
    
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8'
    });

    // Set up console error monitoring
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🔴 Console Error: ${msg.text()}`);
        this.errors.push({
          type: 'console_error',
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
        this.stats.errorsFound++;
      } else if (msg.type() === 'warning') {
        console.log(`🟡 Console Warning: ${msg.text()}`);
        this.errors.push({
          type: 'console_warning', 
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Set up page error monitoring
    this.page.on('pageerror', error => {
      console.log(`🔴 Page Error: ${error.message}`);
      this.errors.push({
        type: 'page_error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      this.stats.errorsFound++;
    });

    // Set up request failed monitoring
    this.page.on('requestfailed', request => {
      console.log(`🔴 Request Failed: ${request.url()} - ${request.failure().errorText}`);
      this.errors.push({
        type: 'request_failed',
        url: request.url(),
        error: request.failure().errorText,
        timestamp: new Date().toISOString()
      });
    });

    console.log('✅ Browser initialized with error monitoring');
  }

  async attemptAdminLogin() {
    try {
      console.log('🔐 Attempting admin login...');
      
      // Look for login form or navigate to login
      const loginButton = await this.page.$('button[type="submit"], input[type="submit"], .login-button');
      const emailInput = await this.page.$('input[type="email"], input[name="email"], #email');
      const passwordInput = await this.page.$('input[type="password"], input[name="password"], #password');
      
      if (emailInput && passwordInput) {
        await emailInput.type(this.adminCredentials.email);
        await passwordInput.type(this.adminCredentials.password);
        
        if (loginButton) {
          await loginButton.click();
          await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
          console.log('✅ Admin login attempted');
        }
      } else {
        console.log('⚠️ No login form found on admin page');
      }
    } catch (error) {
      console.log(`⚠️ Admin login failed: ${error.message}`);
    }
  }

  async analyzeRoute(route) {
    const url = this.targetUrl + route;
    console.log(`\n📊 Analyzing route: ${route}`);
    console.log(`🌐 URL: ${url}`);
    
    // Special handling for admin route - attempt login first
    if (route === '/admin') {
      await this.attemptAdminLogin();
    }

    const routeAnalysis = {
      route: route,
      url: url,
      timestamp: new Date().toISOString(),
      loadTime: 0,
      errors: [],
      warnings: [],
      componentsStatus: {},
      networkRequests: [],
      performanceMetrics: {}
    };

    try {
      const startTime = Date.now();
      
      // Clear previous errors for this route
      const initialErrorCount = this.errors.length;
      
      await this.page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });
      
      routeAnalysis.loadTime = Date.now() - startTime;
      console.log(`  ⏱️ Load time: ${routeAnalysis.loadTime}ms`);

      if (this.debugMode) {
        const debugFile = `debug/screenshots/debug-${route.replace(/\//g, '_') || 'home'}-${Date.now()}.png`;
        await this.page.screenshot({ path: debugFile, fullPage: true });
        console.log(`  📸 Screenshot saved: ${debugFile}`);
      }

      // Wait for React to hydrate
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check for specific JavaScript errors
      const jsErrors = await this.page.evaluate(() => {
        const errors = [];
        
        // Check for React errors
        if (window.React && window.React.version) {
          console.log('React version:', window.React.version);
        }
        
        // Check for common error patterns
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        scripts.forEach(script => {
          if (script.onerror) {
            errors.push(`Script load error: ${script.src}`);
          }
        });
        
        return errors;
      });

      routeAnalysis.errors.push(...jsErrors);

      // Enhanced Intelligence Migration Analysis
      const componentStatus = await this.page.evaluate(() => {
        const components = {};
        
        // Check for MeatIntelligenceMatrix (Enhanced Intelligence)
        components.MeatIntelligenceMatrix = {
          exists: !!document.querySelector('[data-testid="meat-intelligence-matrix"], .meat-intelligence-matrix, [class*="MeatIntelligence"]'),
          rendered: !!document.querySelector('[data-testid="meat-intelligence-matrix"] [class*="grid"], .meat-intelligence-matrix [class*="grid"]'),
          hasData: !!document.querySelector('[data-testid="meat-intelligence-matrix"] .meat-card, .meat-intelligence-matrix .meat-card')
        };
        
        // Check for Legacy Matrix (should be replaced)
        components.LegacyMatrix = {
          exists: !!document.querySelector('.price-matrix, [class*="PriceMatrix"], [data-testid*="price-matrix"]'),
          stillActive: !!document.querySelector('.price-matrix:not([style*="display: none"]), [class*="PriceMatrix"]:not([style*="display: none"])')
        };
        
        // Check for Enhanced Intelligence Admin
        components.MeatIntelligenceAdmin = {
          exists: !!document.querySelector('[data-testid="meat-intelligence-admin"], .meat-intelligence-admin, [class*="MeatIntelligenceAdmin"]'),
          discoveryQueue: !!document.querySelector('[data-testid="discovery-queue"], .discovery-queue'),
          approvalSystem: !!document.querySelector('[data-testid="approval-system"], .approval-system')
        };
        
        // Check for Enhanced API integration
        components.EnhancedAPI = {
          useEnhancedMeatData: !!window.useEnhancedMeatData,
          enhancedEndpoints: !!document.querySelector('[data-enhanced-api="true"]')
        };
        
        // Check for Hebrew Excellence
        components.HebrewExcellence = {
          rtlLayout: !!document.querySelector('[dir="rtl"], .rtl'),
          hebrewContent: !!document.querySelector('[lang="he"], [class*="hebrew"]'),
          hebrewSearch: !!document.querySelector('input[placeholder*="חיפוש"], input[placeholder*="בחר"]')
        };
        
        // Check for loading and error states
        components.LoadingStates = {
          hasLoadingSpinners: !!document.querySelector('.loading, [class*="loading"], .spinner'),
          hasErrorBoundaries: !!document.querySelector('.error-boundary, [class*="error"]'),
          hasEmptyStates: !!document.querySelector('.empty, [class*="empty"]')
        };
        
        // Migration conflict detection
        components.MigrationConflicts = {
          bothMatricesPresent: components.MeatIntelligenceMatrix.exists && components.LegacyMatrix.exists,
          legacyImportErrors: !!document.querySelector('.import-error, [class*="ImportError"]'),
          brokenComponents: !!document.querySelector('[class*="Error"], .component-error')
        };
        
        return components;
      });

      routeAnalysis.componentsStatus = componentStatus;

      // Check for Supabase connection issues
      const supabaseStatus = await this.page.evaluate(() => {
        const status = {
          clientExists: !!window.supabase,
          multipleInstances: false,
          connectionErrors: []
        };
        
        // Check console for GoTrueClient warnings
        const consoleMessages = [];
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        
        return status;
      });

      // Check network requests for API calls
      const apiRequests = await this.page.evaluate(() => {
        return window.performance.getEntriesByType('resource')
          .filter(entry => entry.name.includes('/api/'))
          .map(entry => ({
            url: entry.name,
            duration: entry.duration,
            status: entry.responseStatus || 'unknown'
          }));
      });

      routeAnalysis.networkRequests = apiRequests;

      // Get performance metrics
      const performanceMetrics = await this.page.evaluate(() => {
        const timing = performance.timing;
        return {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          loadComplete: timing.loadEventEnd - timing.navigationStart,
          firstPaint: performance.getEntriesByType('paint')
            .find(entry => entry.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByType('paint')
            .find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
        };
      });

      routeAnalysis.performanceMetrics = performanceMetrics;

      // Count new errors since we started this route
      const newErrors = this.errors.slice(initialErrorCount);
      routeAnalysis.errors.push(...newErrors.map(e => e.message || e.error));

      this.stats.pagesAnalyzed++;
      
      console.log(`  ✅ Route analysis complete`);
      console.log(`  🔍 Errors found: ${newErrors.length}`);
      console.log(`  🧩 Components detected: ${Object.keys(componentStatus).length}`);
      
    } catch (error) {
      console.log(`  ❌ Error analyzing route ${route}: ${error.message}`);
      routeAnalysis.errors.push(error.message);
      this.stats.errorsFound++;
      
      if (this.debugMode) {
        const errorFile = `debug/screenshots/error-${route.replace(/\//g, '_') || 'home'}-${Date.now()}.png`;
        await this.page.screenshot({ path: errorFile });
        console.log(`  📸 Error screenshot saved: ${errorFile}`);
      }
    }

    this.results.push(routeAnalysis);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Brief pause between routes
  }

  async delay(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  generateErrorReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + 'T' + 
                      new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    
    const reportFile = path.join(__dirname, 'debug/reports', `enhanced-intelligence-analysis-${timestamp}.json`);

    const report = {
      analysisInfo: {
        timestamp: new Date().toISOString(),
        targetUrl: this.targetUrl,
        routesAnalyzed: this.routes.length,
        totalErrors: this.stats.errorsFound,
        pagesAnalyzed: this.stats.pagesAnalyzed
      },
      summary: {
        criticalIssues: this.errors.filter(e => e.type === 'page_error').length,
        consoleErrors: this.errors.filter(e => e.type === 'console_error').length,
        consoleWarnings: this.errors.filter(e => e.type === 'console_warning').length,
        requestFailures: this.errors.filter(e => e.type === 'request_failed').length,
        avgLoadTime: this.results.reduce((sum, r) => sum + r.loadTime, 0) / this.results.length
      },
      routeAnalysis: this.results,
      allErrors: this.errors,
      recommendations: this.generateRecommendations()
    };

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`📊 Analysis report saved: ${reportFile}`);

    return { reportFile, report };
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Enhanced Intelligence Migration Analysis
    const homepageResult = this.results.find(r => r.route === '/');
    const enhancedResult = this.results.find(r => r.route === '/enhanced');
    
    // Check for homepage migration issues
    if (homepageResult) {
      const components = homepageResult.componentsStatus;
      
      if (components?.MigrationConflicts?.bothMatricesPresent) {
        recommendations.push({
          priority: 'CRITICAL',
          category: 'Homepage Migration',
          issue: 'Both legacy PriceMatrix and MeatIntelligenceMatrix detected on homepage',
          solution: 'Remove legacy matrix component imports and replace with Enhanced Intelligence',
          affectedAreas: ['Homepage', 'Component architecture']
        });
      }
      
      if (components?.LegacyMatrix?.stillActive && !components?.MeatIntelligenceMatrix?.exists) {
        recommendations.push({
          priority: 'CRITICAL',
          category: 'Homepage Migration',
          issue: 'Homepage still using legacy matrix - Enhanced Intelligence not integrated',
          solution: 'Replace legacy matrix with MeatIntelligenceMatrix component',
          affectedAreas: ['Homepage', 'User experience']
        });
      }
      
      if (!components?.MeatIntelligenceMatrix?.hasData && components?.MeatIntelligenceMatrix?.exists) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Data Integration',
          issue: 'MeatIntelligenceMatrix exists but no data loading',
          solution: 'Check useEnhancedMeatData hook and Enhanced Intelligence API endpoints',
          affectedAreas: ['Data fetching', 'API integration']
        });
      }
    }
    
    // Check Enhanced Intelligence route specifically
    if (enhancedResult && !enhancedResult.componentsStatus?.MeatIntelligenceMatrix?.exists) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Enhanced Intelligence',
        issue: '/enhanced route not showing MeatIntelligenceMatrix component',
        solution: 'Verify Enhanced Intelligence routing and component imports',
        affectedAreas: ['Enhanced Intelligence', 'Routing']
      });
    }
    
    // Check for null length errors (common in data processing)
    const nullErrors = this.errors.filter(e => 
      e.message && e.message.includes('Cannot read properties of null (reading \'length\')')
    );
    if (nullErrors.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'JavaScript Errors',
        issue: 'Null reference errors on array length operations',
        solution: 'Add null checks before calling .length on arrays/objects in Enhanced Intelligence components',
        affectedAreas: ['Enhanced Intelligence components', 'Data loading operations']
      });
    }

    // Check for React errors
    const reactErrors = this.errors.filter(e => 
      e.message && (e.message.includes('React') || e.message.includes('Minified React error'))
    );
    if (reactErrors.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'React Errors',
        issue: 'React hydration or rendering errors',
        solution: 'Check component lifecycle and server-side rendering compatibility',
        affectedAreas: ['Component rendering', 'Page hydration']
      });
    }

    // Check for Supabase issues
    const supabaseErrors = this.errors.filter(e => 
      e.message && (e.message.includes('GoTrueClient') || e.message.includes('supabase'))
    );
    if (supabaseErrors.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Database Connectivity',
        issue: 'Multiple Supabase client instances or connection issues',
        solution: 'Implement proper Supabase client singleton pattern',
        affectedAreas: ['Database operations', 'Authentication']
      });
    }

    // Check for slow loading
    const slowRoutes = this.results.filter(r => r.loadTime > 3000);
    if (slowRoutes.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Performance',
        issue: `${slowRoutes.length} routes loading slowly (>3s)`,
        solution: 'Optimize component loading and data fetching',
        affectedAreas: slowRoutes.map(r => r.route)
      });
    }

    return recommendations;
  }

  async run() {
    console.log('🎬 WebsiteAnalyzer.run() method called');
    try {
      console.log('🔧 Calling initialize()...');
      await this.initialize();

      console.log(`🎯 Analyzing ${this.routes.length} routes on ${this.targetUrl}...`);
      
      for (const route of this.routes) {
        await this.analyzeRoute(route);
      }

      console.log('📊 Generating error report...');
      const { reportFile, report } = this.generateErrorReport();
      
      console.log(`\n🎯 Website Analysis Summary:`);
      console.log(`🌐 Target: ${this.targetUrl}`);
      console.log(`📄 Routes analyzed: ${report.analysisInfo.routesAnalyzed}`);
      console.log(`❌ Total errors: ${report.summary.criticalIssues + report.summary.consoleErrors}`);
      console.log(`⚠️ Warnings: ${report.summary.consoleWarnings}`);
      console.log(`🔗 Failed requests: ${report.summary.requestFailures}`);
      console.log(`⏱️ Average load time: ${Math.round(report.summary.avgLoadTime)}ms`);
      console.log(`📊 Report saved: ${path.basename(reportFile)}`);
      
      if (report.recommendations.length > 0) {
        console.log(`\n🔧 Priority Recommendations:`);
        report.recommendations.forEach((rec, i) => {
          console.log(`  ${i+1}. [${rec.priority}] ${rec.category}: ${rec.issue}`);
          console.log(`     💡 ${rec.solution}`);
        });
      }

    } catch (error) {
      console.log(`❌ Analysis error: ${error.message}`);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

async function main() {
  console.log('📋 Parsing command line arguments...');
  const args = process.argv.slice(2);
  console.log('📋 Raw args:', args);
  
  const options = {};
  
  if (args.includes('--test')) options.test = true;
  if (args.includes('--debug')) options.debug = true;
  if (args.includes('--target')) {
    const targetIndex = args.indexOf('--target') + 1;
    options.target = args[targetIndex];
  }

  console.log('📋 Parsed options:', options);

  console.log('🔍 Website Analyzer - Production Error Detection for v3.basarometer.org');
  if (options.test) console.log('🧪 Test mode: Limited analysis');
  if (options.debug) console.log('🔍 Debug mode: Full screenshots and logging');
  if (options.target) console.log(`🎯 Target URL: ${options.target}`);

  console.log('🏗️ Creating WebsiteAnalyzer instance...');
  const analyzer = new WebsiteAnalyzer(options);
  
  console.log('🚀 Starting website analysis...');
  await analyzer.run();
  
  console.log('✅ Website analysis completed');
}

// ES Module equivalent for require.main === module
console.log('🔍 Checking if this is main module...');
console.log('📍 import.meta.url:', import.meta.url);
console.log('📍 process.argv[1]:', process.argv[1]);

// Fix URL encoding issue with spaces
const normalizedArgv = `file://${process.argv[1]}`;
const encodedArgv = normalizedArgv.replace(/ /g, '%20');
console.log('📍 Encoded argv:', encodedArgv);
console.log('📍 Comparison:', import.meta.url === encodedArgv);

if (import.meta.url === encodedArgv) {
  console.log('✅ Running as main module');
  main().catch(error => {
    console.error('💥 Main function error:', error);
    console.error('📍 Stack trace:', error.stack);
    process.exit(1);
  });
} else {
  console.log('ℹ️ Module imported, not running main');
}

console.log('📤 Exporting WebsiteAnalyzer class...');
export default WebsiteAnalyzer;