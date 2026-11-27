import { chromium } from 'playwright';

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

  console.log('Testing GateVisualizer with CX...');
  // Since we can't easily click a specific CX gate on canvas, let's just use the dropdown.
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    if (selects.length > 0) {
      // Find the one for gates... it might be the second one. 
      // The inspector is in showGateMatrix panel which is NOT visible by default!
      // But wait, GateVisualizer is in "showGateMatrix" panel.
    }
  });

  const bodyHtml = await page.evaluate(() => document.body.innerHTML);
  console.log('BODY HTML LENGTH:', bodyHtml.length);
  if (bodyHtml.length < 500) {
    console.log('App appears to have crashed silently.');
  }

  await browser.close();
})();
