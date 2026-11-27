import { chromium } from 'playwright';
import path from 'path';

async function captureQmlScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  console.log('Navigating to http://127.0.0.1:5173/labs/qml ...');
  await page.goto('http://127.0.0.1:5173/labs/qml', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click start training
  const trainBtn = await page.$('button:has-text("Start Training"), button:has-text("Train VQC Model")');
  if (trainBtn) {
    console.log('Clicking training button...');
    await trainBtn.click();
    await page.waitForTimeout(1500);
  }

  const outPath = '/Users/sourojitmondal/.gemini/antigravity/brain/a9407a54-8e45-48e5-993c-416272df8af6/qml_verified.png';
  await page.screenshot({ path: outPath, fullPage: false });
  console.log('Screenshot saved to', outPath);
  console.log('Logged errors count:', errors.length);
  if (errors.length > 0) {
    console.log('Errors:', errors);
  }

  await browser.close();
}

captureQmlScreenshot().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});

