import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Go directly to /lab where RightDrawer lives
  await page.goto('http://localhost:5174/lab');
  await page.waitForTimeout(3000);
  
  // Try typing in terminal
  console.log('Typing in terminal...');
  try {
    await page.type('.nb-right-drawer__terminal-input', 'ls -la', { timeout: 2000 });
    await page.keyboard.press('Enter');
    const val = await page.$eval('.nb-right-drawer__terminal-input', el => el.value);
    console.log('Terminal input value after Enter (should be empty):', val);
  } catch(e) {
    console.log('Failed typing. Error: ' + e.message);
  }
  
  console.log('Clicking Variables...');
  try {
    await page.click('button:has-text("Variables")', { timeout: 2000 });
    await page.waitForTimeout(2000);
    const titles = await page.$$eval('.nb-right-drawer__variables th', els => els.map(e => e.textContent));
    console.log('Variables tab headers:', titles);
  } catch(e) {
    console.log('Failed variables. Error: ' + e.message);
  }
  
  await browser.close();
})();
