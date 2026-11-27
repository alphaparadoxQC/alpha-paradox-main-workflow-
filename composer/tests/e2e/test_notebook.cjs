const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => console.log(`[BROWSER ERROR] ${error.message}\n${error.stack}`));

  console.log('Navigating to lab...');
  await page.goto('http://localhost:5173/lab', { waitUntil: 'networkidle' });
  
  console.log('Taking screenshot...');
  await page.screenshot({ path: 'screenshot.png' });
  
  await browser.close();
})();
