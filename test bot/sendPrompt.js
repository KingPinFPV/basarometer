// sendPrompt.js — גרסה מתקדמת עם מעקב תגובה יציב

const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const path = require('path');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const promptsFile = 'prompts.txt';
const cookiesFile = 'cookies.json';
const outputJson = 'output.json';
const outputCsv = 'output.csv';
const downloadDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--start-maximized']
  });

  const page = await browser.newPage();

  if (fs.existsSync(cookiesFile)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesFile));
    await page.setCookie(...cookies);
  } else {
    console.warn("⚠️ קובץ cookies.json לא נמצא. ודא שהתחברת ידנית קודם.");
  }

  await page.goto('https://chat.openai.com/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('textarea', { timeout: 30000 });

  const prompts = fs.readFileSync(promptsFile, 'utf-8')
    .split('\n').map(p => p.trim()).filter(p => p.length > 0);

  const results = [];

  for (const prompt of prompts) {
    console.log(`\n📤 שולח: ${prompt}`);

    await page.waitForFunction(() => {
      const last = [...document.querySelectorAll('[data-message-author-role="assistant"]')].pop();
      if (!last) return true;
      return !last.querySelector('svg') && !last.innerText.endsWith('…');
    }, { timeout: 90000 });

    const userBefore = await page.$$eval('[data-message-author-role="user"]', els => els.length);
    await page.type('textarea', prompt);
    await page.keyboard.press('Enter');
    await page.waitForFunction((before, p) => {
      const userMsgs = [...document.querySelectorAll('[data-message-author-role="user"]')];
      return userMsgs.length > before && userMsgs.at(-1).innerText.includes(p.slice(0, 5));
    }, { timeout: 10000 }, userBefore, prompt);

    const assistantBefore = await page.$$eval('[data-message-author-role="assistant"]', els => els.length);

    try {
      await page.waitForFunction(count => {
        return document.querySelectorAll('[data-message-author-role="assistant"]').length > count;
      }, { timeout: 60000 }, assistantBefore);
    } catch (e) {
      console.log(`⚠️ התגובה לא הופיעה בזמן`);
      results.push({ prompt, response: '[שגיאה: לא התקבלה תגובה]', hasDownload: false });
      continue;
    }

    let responseText = '[שגיאה: לא ניתן לקרוא את תגובת העוזר]';
    let hasDownload = false;
    let downloadFile = null;

    try {
      const lastEl = await page.$('[data-message-author-role="assistant"]:last-child');

      await page.evaluate(el => {
        return new Promise(resolve => {
          const observer = new MutationObserver((_, obs) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
              obs.disconnect();
              resolve();
            }, 1200);
          });
          let timeout = setTimeout(() => {
            observer.disconnect();
            resolve();
          }, 1200);
          observer.observe(el, { childList: true, subtree: true, characterData: true });
        });
      }, lastEl);

      responseText = await page.evaluate(el => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let text = '';
        while (walker.nextNode()) text += walker.currentNode.textContent + ' ';
        return text.trim();
      }, lastEl);

      const downloadLink = await page.evaluate(el => {
        const a = el.querySelector('a[href][download]');
        return a ? a.href : null;
      }, lastEl);

      if (downloadLink) {
        hasDownload = true;
        const fileName = path.basename(new URL(downloadLink).pathname);
        const downloadPath = path.join(downloadDir, fileName);
        const viewSource = await page.goto(downloadLink);
        fs.writeFileSync(downloadPath, await viewSource.buffer());
        downloadFile = fileName;
      }

    } catch (err) {
      console.log(`⚠️ שגיאה בעת קריאת התגובה`);
    }

    console.log(`✅ תשובה (${responseText.length} תווים)${hasDownload ? ` + 📎 ${downloadFile}` : ''}`);
    results.push({ prompt, response: responseText, hasDownload, downloadFile });

    await new Promise(r => setTimeout(r, 2000));
  }

  fs.writeFileSync(outputJson, JSON.stringify(results, null, 2));
  const csvHeader = 'Prompt,Response,HasDownload,DownloadFile\n';
  const csvRows = results.map(r => `"${r.prompt.replace(/"/g, '""')}","${r.response.replace(/"/g, '""')}",${r.hasDownload},"${r.downloadFile || ''}"`);
  fs.writeFileSync(outputCsv, csvHeader + csvRows.join('\n'));

  console.log(`\n📁 נשמרו: ${outputJson}, ${outputCsv}`);
  await browser.close();
})();
