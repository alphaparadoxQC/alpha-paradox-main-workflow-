const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1280, height: 720 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('Navigating to /preview-composer...');
  await page.goto('http://localhost:5175/preview-composer', { waitUntil: 'networkidle' });

  // Wait a bit for React to render
  await page.waitForTimeout(2000);

  console.log('Taking screenshot...');
  const screenshotPath = path.join('/Users/sourojitmondal/.gemini/antigravity-ide/brain/86401957-0499-41a0-862e-44b3ec288c81', 'playwright_preview_screenshot.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to', screenshotPath);

  const errorOverlay = await page.evaluate(() => {
    const overlay = document.querySelector('vite-error-overlay');
    return overlay ? overlay.shadowRoot.innerHTML : null;
  });

  if (errorOverlay) {
    console.log('VITE ERROR OVERLAY DETECTED:');
    console.log(errorOverlay);
  }

  await browser.close();
})();
