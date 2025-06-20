// login.js – התחברות ידנית ושמירת cookies
const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--start-maximized']
  });

  const page = await browser.newPage();
  await page.goto('https://chat.openai.com/', { waitUntil: 'networkidle2' });

  console.log("🔐 התחבר ידנית לצ'אט, ואז לחץ Enter כאן...");
  process.stdin.resume();
  process.stdin.on('data', async () => {
    const cookies = await page.cookies();
    fs.writeFileSync('cookies.json', JSON.stringify(cookies, null, 2));
    console.log("✅ cookies נשמרו ל־cookies.json");
    await browser.close();
    process.exit();
  });
})();
