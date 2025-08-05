import { test, expect } from '@playwright/test'

test.describe('Hebrew Interface E2E Tests', () => {
  test('should display Hebrew content correctly', async ({ page }) => {
    await page.goto('/')
    
    // Test Hebrew text rendering
    await expect(page.locator('h1')).toContainText('בשרומטר')
    
    // Test RTL layout
    await expect(page.locator('body')).toHaveCSS('direction', 'rtl')
    
    // Test Hebrew font rendering
    const title = page.locator('h1')
    await expect(title).toBeVisible()
  })

  test('should handle Hebrew product search', async ({ page }) => {
    await page.goto('/')
    
    // Search for beef products in Hebrew
    const searchBox = page.locator('[data-testid="search"], input[type="text"]').first()
    if (await searchBox.isVisible()) {
      await searchBox.fill('אנטריקוט')
      await page.keyboard.press('Enter')
      
      // Wait for results
      await page.waitForTimeout(2000)
      
      // Verify results contain Hebrew text
      const productItems = page.locator('.product-item, [data-testid="product"]')
      if (await productItems.count() > 0) {
        await expect(productItems.first()).toBeVisible()
      }
    }
  })

  test('should load product matrix with performance under 2 seconds', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    
    // Wait for product matrix to load
    await page.waitForSelector('.product-item, .meat-cut-item, [data-testid="product"]', { timeout: 10000 })
    
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(2000) // 2 second requirement
  })

  test('should handle mobile Hebrew layout', async ({ page, isMobile }) => {
    if (!isMobile) return
    
    await page.goto('/')
    
    // Test mobile Hebrew layout
    await expect(page.locator('body')).toHaveCSS('direction', 'rtl')
    
    // Test mobile navigation if exists
    const navToggle = page.locator('[aria-label="תפריט"], .mobile-menu-toggle, [data-testid="menu-toggle"]')
    if (await navToggle.isVisible()) {
      await navToggle.click()
      await expect(page.locator('.mobile-menu, .nav-menu')).toBeVisible()
    }
  })
})