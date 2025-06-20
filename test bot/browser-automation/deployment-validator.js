#!/usr/bin/env node

/**
 * 🛠️ Basarometer 4.0 Deployment Validator
 * 
 * Comprehensive validation of the deployed system to ensure all components
 * are working correctly and ready for the Yohananof proof-of-concept.
 */

import fs from 'fs/promises';
import http from 'http';
import { spawn } from 'child_process';
import path from 'path';

export class DeploymentValidator {
  constructor() {
    this.checks = {
      environment: false,
      dependencies: false,
      browserUse: false,
      hebrewSupport: false,
      integration: false,
      overall: false
    };
    
    this.results = [];
  }

  /**
   * Run all validation checks
   */
  async validateDeployment() {
    console.log('🚀 Basarometer 4.0 Deployment Validation');
    console.log('=' .repeat(60));
    
    try {
      await this.checkEnvironment();
      await this.checkDependencies();
      await this.checkBrowserUse();
      await this.checkHebrewSupport();
      await this.checkIntegration();
      
      this.calculateOverallSuccess();
      this.printSummary();
      
      return {
        success: this.checks.overall,
        checks: this.checks,
        results: this.results
      };
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check 1: Environment Setup
   */
  async checkEnvironment() {
    console.log('🔍 Check 1: Environment Setup');
    
    try {
      // Check Python version
      const pythonVersion = await this.runCommand('python3.11 --version');
      const validPython = pythonVersion.includes('3.11');
      
      this.logResult('Python 3.11+', validPython, pythonVersion.trim());
      
      // Check virtual environment
      const venvPath = '../browser-automation/web-ui/venv';
      const venvExists = await this.fileExists(venvPath);
      
      this.logResult('Virtual Environment', venvExists, venvExists ? 'Found' : 'Missing');
      
      // Check project structure
      const keyFiles = [
        'browser-automation/hebrew-bridge.js',
        'browser-automation/template-converter.js',
        'browser-automation/yohananof-processor.js',
        'utils/meat-detector.js',
        'utils/price-extractor.js',
        'config/meat-sites.json'
      ];
      
      let allFilesExist = true;
      for (const file of keyFiles) {
        const exists = await this.fileExists(`../${file}`);
        if (!exists) {
          allFilesExist = false;
          this.logResult(`File: ${file}`, false, 'Missing');
        }
      }
      
      if (allFilesExist) {
        this.logResult('Project Structure', true, 'All key files present');
      }
      
      this.checks.environment = validPython && venvExists && allFilesExist;
      
    } catch (error) {
      this.logResult('Environment Check', false, error.message);
    }
  }

  /**
   * Check 2: Dependencies
   */
  async checkDependencies() {
    console.log('\\n🔍 Check 2: Dependencies');
    
    try {
      // Check pip packages in virtual environment
      const pipList = await this.runCommand(
        'cd ../browser-automation/web-ui && source venv/bin/activate && pip list'
      );
      
      const requiredPackages = [
        'browser-use',
        'gradio',
        'playwright',
        'python-bidi',
        'arabic-reshaper'
      ];
      
      let allPackagesInstalled = true;
      for (const pkg of requiredPackages) {
        const installed = pipList.includes(pkg);
        this.logResult(`Package: ${pkg}`, installed, installed ? 'Installed' : 'Missing');
        if (!installed) allPackagesInstalled = false;
      }
      
      // Check Playwright browsers
      try {
        const playwrightBrowsers = await this.runCommand(
          'cd ../browser-automation/web-ui && source venv/bin/activate && playwright install --dry-run'
        );
        const browsersReady = !playwrightBrowsers.includes('Missing');
        this.logResult('Playwright Browsers', browsersReady, browsersReady ? 'Installed' : 'Need Installation');
      } catch (error) {
        this.logResult('Playwright Browsers', false, 'Check failed');
      }
      
      this.checks.dependencies = allPackagesInstalled;
      
    } catch (error) {
      this.logResult('Dependencies Check', false, error.message);
    }
  }

  /**
   * Check 3: Browser-Use System
   */
  async checkBrowserUse() {
    console.log('\\n🔍 Check 3: Browser-Use System');
    
    try {
      // Check if browser-use is running on port 7790
      const isRunning = await this.checkPort(7790);
      this.logResult('Browser-Use Running', isRunning, isRunning ? 'Port 7790 active' : 'Not running');
      
      if (isRunning) {
        // Test HTTP response
        try {
          const response = await this.httpGet('http://127.0.0.1:7790');
          const validResponse = response.includes('html');
          this.logResult('Web Interface', validResponse, validResponse ? 'Responding' : 'Invalid response');
        } catch (error) {
          this.logResult('Web Interface', false, 'HTTP test failed');
        }
      }
      
      // Check configuration files
      const envExists = await this.fileExists('../browser-automation/web-ui/.env');
      this.logResult('Configuration', envExists, envExists ? 'Found .env' : 'Missing .env');
      
      this.checks.browserUse = isRunning && envExists;
      
    } catch (error) {
      this.logResult('Browser-Use Check', false, error.message);
    }
  }

  /**
   * Check 4: Hebrew Support
   */
  async checkHebrewSupport() {
    console.log('\\n🔍 Check 4: Hebrew Support');
    
    try {
      // Test Hebrew bridge functionality
      const { HebrewBridge } = await import('./hebrew-bridge.js');
      const bridge = new HebrewBridge();
      
      // Test Hebrew text processing
      const testProduct = {
        name: 'בשר בקר אנטריקוט אנגוס 500 גרם',
        price: '₪89.90',
        description: 'בשר איכות פרימיום כשר למהדרין'
      };
      
      const processed = bridge.processProduct(testProduct);
      
      const hebrewDetected = /[\u0590-\u05FF]/.test(processed.name);
      const meatDetected = processed.isMeat;
      const priceExtracted = processed.price > 0;
      const confidenceCalculated = processed.confidence > 0;
      
      this.logResult('Hebrew Text Processing', hebrewDetected, hebrewDetected ? 'Hebrew detected' : 'No Hebrew');
      this.logResult('Meat Detection', meatDetected, meatDetected ? 'Meat detected' : 'Not detected');
      this.logResult('Price Extraction', priceExtracted, priceExtracted ? `₪${processed.price}` : 'Failed');
      this.logResult('Confidence Scoring', confidenceCalculated, `Score: ${processed.confidence.toFixed(2)}`);
      
      // Test template converter
      const { TemplateConverter } = await import('./template-converter.js');
      const converter = new TemplateConverter();
      
      const prompts = converter.generateSitePrompts({
        siteName: 'Test Site',
        siteUrl: 'https://test.co.il',
        meatCategories: ['/meat/beef']
      });
      
      const promptsGenerated = prompts && prompts.siteNavigation;
      this.logResult('Template Converter', promptsGenerated, promptsGenerated ? 'Prompts generated' : 'Failed');
      
      this.checks.hebrewSupport = hebrewDetected && meatDetected && priceExtracted && promptsGenerated;
      
    } catch (error) {
      this.logResult('Hebrew Support Check', false, error.message);
    }
  }

  /**
   * Check 5: Integration Readiness
   */
  async checkIntegration() {
    console.log('\\n🔍 Check 5: Integration Readiness');
    
    try {
      // Check Yohananof processor
      const { default: YohananofProcessor } = await import('./yohananof-processor.js');
      const processor = new YohananofProcessor();
      
      // Test with mock data
      const mockResults = [
        {
          name: 'אנטריקוט אנגוס טרי',
          price: '₪89.90',
          description: 'בשר בקר פרימיום'
        }
      ];
      
      const processed = await processor.processResults(mockResults);
      const processingSuccessful = processed.products.length > 0;
      
      this.logResult('Results Processor', processingSuccessful, processingSuccessful ? 'Working' : 'Failed');
      
      // Check prompt file
      const promptExists = await this.fileExists('../YOHANANOF_BROWSER_USE_PROMPT.md');
      this.logResult('Integration Prompt', promptExists, promptExists ? 'Ready' : 'Missing');
      
      // Check output directory
      const outputExists = await this.fileExists('../output');
      this.logResult('Output Directory', outputExists, outputExists ? 'Exists' : 'Will be created');
      
      this.checks.integration = processingSuccessful && promptExists;
      
    } catch (error) {
      this.logResult('Integration Check', false, error.message);
    }
  }

  /**
   * Calculate overall success
   */
  calculateOverallSuccess() {
    const passedChecks = Object.values(this.checks).filter(check => check === true).length;
    const totalChecks = Object.keys(this.checks).length - 1; // Exclude 'overall'
    
    this.checks.overall = passedChecks >= totalChecks * 0.8; // 80% pass rate
  }

  /**
   * Print validation summary
   */
  printSummary() {
    console.log('\\n' + '=' .repeat(60));
    console.log('📊 VALIDATION SUMMARY');
    console.log('=' .repeat(60));
    
    const checkNames = {
      environment: 'Environment Setup',
      dependencies: 'Dependencies',
      browserUse: 'Browser-Use System',
      hebrewSupport: 'Hebrew Support',
      integration: 'Integration Readiness'
    };
    
    for (const [key, name] of Object.entries(checkNames)) {
      const status = this.checks[key] ? '✅ PASS' : '❌ FAIL';
      console.log(`${name.padEnd(25)} ${status}`);
    }
    
    console.log('=' .repeat(60));
    console.log(`🎯 OVERALL STATUS: ${this.checks.overall ? '✅ READY FOR DEPLOYMENT' : '❌ NEEDS ATTENTION'}`);
    
    if (this.checks.overall) {
      console.log('\\n🚀 SYSTEM READY FOR YOHANANOF INTEGRATION!');
      console.log('\\n📋 Next Steps:');
      console.log('1. Open browser: http://127.0.0.1:7790');
      console.log('2. Configure Anthropic Claude model');
      console.log('3. Use YOHANANOF_BROWSER_USE_PROMPT.md');
      console.log('4. Execute automation and validate results');
      console.log('\\n🎉 Revolutionary transformation complete!');
    } else {
      console.log('\\n⚠️ ISSUES DETECTED:');
      for (const [key, name] of Object.entries(checkNames)) {
        if (!this.checks[key]) {
          console.log(`   - ${name} needs attention`);
        }
      }
    }
  }

  /**
   * Helper methods
   */
  async runCommand(command) {
    return new Promise((resolve, reject) => {
      const child = spawn('bash', ['-c', command]);
      let output = '';
      let error = '';
      
      child.stdout.on('data', (data) => output += data.toString());
      child.stderr.on('data', (data) => error += data.toString());
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(error || `Command failed with code ${code}`));
        }
      });
      
      setTimeout(() => {
        child.kill();
        reject(new Error('Command timeout'));
      }, 10000);
    });
  }

  async fileExists(filepath) {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  async checkPort(port) {
    return new Promise((resolve) => {
      const server = http.createServer();
      server.listen(port, () => {
        server.close(() => resolve(false)); // Port is free
      });
      server.on('error', () => resolve(true)); // Port is in use
    });
  }

  async httpGet(url) {
    return new Promise((resolve, reject) => {
      http.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
      
      setTimeout(() => reject(new Error('HTTP timeout')), 5000);
    });
  }

  logResult(check, success, details) {
    const status = success ? '✅' : '❌';
    const line = `${status} ${check.padEnd(25)} ${details}`;
    console.log(line);
    
    this.results.push({
      check,
      success,
      details
    });
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new DeploymentValidator();
  validator.validateDeployment()
    .then((results) => {
      process.exit(results.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Validation error:', error);
      process.exit(1);
    });
}

export default DeploymentValidator;