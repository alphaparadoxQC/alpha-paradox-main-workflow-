const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('Navigating to app...');
  await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });

  console.log('Clicking Start Composer button...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.home-hero-btn'));
    if (btns.length > 0) btns[0].click();
  });
  
  await page.waitForTimeout(1000);

  console.log('Adding a gate...');
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.gate-palette-item'));
    if (items.length > 0) items[0].click(); 
  });

  await page.waitForTimeout(1000);

  const bodyHtml = await page.evaluate(() => document.body.innerHTML);
  console.log('BODY HTML LENGTH AFTER GATE:', bodyHtml.length);
  if (bodyHtml.length < 500) {
    console.log('App appears to have crashed silently. Body:', bodyHtml);
  }

  await browser.close();
})();
