#!/usr/bin/env node

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function testAdminLogin() {
    console.log('🔐 Starting Admin Login Test...');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--start-maximized']
    });

    const page = await browser.newPage();
    
    try {
        console.log('🌐 Navigating to https://v3.basarometer.org...');
        await page.goto('https://v3.basarometer.org', { waitUntil: 'networkidle2' });
        
        // Look for login button
        console.log('🔍 Looking for login button...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for page to fully load
        
        // Try to find login button by text
        const loginButtons = await page.$$eval('button, a', elements => 
            elements.filter(el => 
                el.textContent.includes('התחבר') || 
                el.textContent.includes('V5.1') ||
                el.textContent.includes('התחברו')
            ).map(el => ({
                text: el.textContent.trim(),
                tagName: el.tagName,
                className: el.className,
                id: el.id
            }))
        );
        
        console.log('🔍 Found login buttons:', loginButtons);
        
        if (loginButtons.length > 0) {
            console.log('✅ Found login button(s)');
            
            // Click the first login button
            const loginButtonFound = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button, a'));
                const loginButton = buttons.find(btn => 
                    btn.textContent.includes('התחברו') || 
                    btn.textContent.includes('V5.1') ||
                    btn.textContent.includes('התחבר')
                );
                if (loginButton) {
                    loginButton.click();
                    return true;
                }
                return false;
            });
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Look for login form
            const forms = await page.$$eval('form, [role="dialog"], .modal', elements => 
                elements.map(el => ({
                    tagName: el.tagName,
                    className: el.className,
                    id: el.id,
                    visible: el.offsetHeight > 0
                }))
            );
            
            console.log('📋 Found forms/modals:', forms);
            
            // Look for email/password inputs
            const inputs = await page.$$eval('input', elements => 
                elements.map(el => ({
                    type: el.type,
                    name: el.name,
                    id: el.id,
                    placeholder: el.placeholder,
                    visible: el.offsetHeight > 0
                }))
            );
            
            console.log('📝 Found inputs:', inputs);
            
            // Try to fill admin credentials
            const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="מייל"], input[placeholder*="email"]');
            const passwordInput = await page.$('input[type="password"], input[name="password"], input[placeholder*="סיסמ"], input[placeholder*="password"]');
            
            if (emailInput && passwordInput) {
                console.log('✅ Found login form fields');
                
                console.log('📝 Filling credentials...');
                await emailInput.type('admintest1@basarometer.org');
                await passwordInput.type('123123');
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Look for submit button and click it
                const submitClicked = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const submitBtn = buttons.find(btn => 
                        btn.type === 'submit' ||
                        btn.textContent.includes('התחבר') ||
                        btn.textContent.includes('כניסה') ||
                        btn.textContent.includes('Login')
                    );
                    if (submitBtn) {
                        submitBtn.click();
                        return true;
                    }
                    return false;
                });
                
                if (submitClicked) {
                    console.log('🚀 Submit button clicked...');
                    
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    // Check if login was successful
                    const currentUrl = page.url();
                    console.log('🌐 Current URL after login attempt:', currentUrl);
                    
                    // Look for admin-specific content
                    const adminElements = await page.$$eval('*', elements => 
                        elements.filter(el => 
                            el.textContent.includes('אדמין') || 
                            el.textContent.includes('Admin') ||
                            el.textContent.includes('ניהול') ||
                            el.textContent.includes('Management')
                        ).map(el => ({
                            text: el.textContent.trim().substring(0, 100),
                            tagName: el.tagName
                        }))
                    );
                    
                    console.log('🔐 Admin elements found:', adminElements);
                    
                    if (adminElements.length > 0 || currentUrl.includes('/admin')) {
                        console.log('✅ Login appears successful!');
                        return { success: true, message: 'Admin login successful' };
                    } else {
                        console.log('❌ Login may have failed - no admin content found');
                        return { success: false, message: 'Login failed - no admin content' };
                    }
                } else {
                    console.log('❌ No submit button found');
                    return { success: false, message: 'No submit button found' };
                }
            } else {
                console.log('❌ Login form fields not found');
                return { success: false, message: 'Login form fields not found' };
            }
            
        } else {
            console.log('❌ No login button found');
            return { success: false, message: 'No login button found' };
        }
        
    } catch (error) {
        console.error('🚨 Error during admin login test:', error);
        return { success: false, message: error.message };
    } finally {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Keep browser open to see result
        await browser.close();
    }
}

// Run the test
testAdminLogin().then(result => {
    console.log('🎯 Test Result:', result);
    process.exit(result.success ? 0 : 1);
}).catch(error => {
    console.error('🚨 Test failed:', error);
    process.exit(1);
});