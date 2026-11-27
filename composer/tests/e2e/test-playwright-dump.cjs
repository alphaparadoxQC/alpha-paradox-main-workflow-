const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('Navigating to app...');
  await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
  
  await page.waitForTimeout(2000);

  const bodyHtml = await page.evaluate(() => document.body.innerHTML);
  console.log('BODY HTML LENGTH:', bodyHtml.length);
  console.log('BODY HTML EXTRACT:', bodyHtml.substring(0, 500));

  await browser.close();
})();
