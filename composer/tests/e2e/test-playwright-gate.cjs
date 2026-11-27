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
    if (items.length > 0) items[0].click(); // Click first gate (usually H or X)
  });

  await page.waitForTimeout(1000);

  const errorOverlay = await page.evaluate(() => {
    const overlay = document.querySelector('vite-error-overlay');
    return overlay ? overlay.shadowRoot.innerHTML : null;
  });

  if (errorOverlay) {
    console.log('VITE ERROR OVERLAY DETECTED:');
    console.log(errorOverlay);
  } else {
    console.log('No Vite error overlay detected.');
  }

  await browser.close();
})();
