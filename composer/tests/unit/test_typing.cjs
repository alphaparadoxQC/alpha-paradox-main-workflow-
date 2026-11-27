const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5174/preview-composer');
  // Wait for load
  await page.waitForTimeout(2000);
  
  // Click Terminal in bottom bar
  await page.click('text=Terminal');
  await page.waitForTimeout(1000);
  
  // Type in terminal input
  await page.type('.nb-right-drawer__terminal-input', 'ls -la');
  const val = await page.$eval('.nb-right-drawer__terminal-input', el => el.value);
  console.log('Terminal input value:', val);
  
  // Click Variables
  await page.click('text=Variables');
  await page.waitForTimeout(2000);
  console.log('Variables tab opened, page title:', await page.title());
  
  await browser.close();
})();
