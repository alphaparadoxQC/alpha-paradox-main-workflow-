const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1280, height: 720 });

  console.log('Navigating to /preview-composer...');
  await page.goto('http://localhost:5173/preview-composer', { waitUntil: 'networkidle' });

  // Add a gate just to populate the circuit and state vector
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.gate-palette-item'));
    if (items.length > 0) items[0].click(); // Click H gate
  });

  // Switch to QSphere mode in Jobs panel
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const dropdowns = Array.from(document.querySelectorAll('select'));
    if (dropdowns.length > 1) {
      dropdowns[1].value = 'qsphere';
      dropdowns[1].dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  await page.waitForTimeout(1000);

  const screenshotPath = path.join('/Users/sourojitmondal/.gemini/antigravity-ide/brain/86401957-0499-41a0-862e-44b3ec288c81', 'final_composer_visual.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to', screenshotPath);

  await browser.close();
})();
