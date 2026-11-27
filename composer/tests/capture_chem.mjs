import { chromium } from 'playwright';

async function captureChem() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  await page.goto('http://127.0.0.1:5173/labs/chemistry', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const outPath = '/Users/sourojitmondal/.gemini/antigravity/brain/a9407a54-8e45-48e5-993c-416272df8af6/chem_current.png';
  await page.screenshot({ path: outPath, fullPage: false });
  console.log('Saved to', outPath);

  await browser.close();
}

captureChem().catch(console.error);

