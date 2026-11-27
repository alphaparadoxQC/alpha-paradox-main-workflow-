import { chromium } from 'playwright';

async function captureTopQmlScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  await page.goto('http://127.0.0.1:5173/labs/qml', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Evaluate page to scroll to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  const outPath = '/Users/sourojitmondal/.gemini/antigravity/brain/a9407a54-8e45-48e5-993c-416272df8af6/qml_top_verified.png';
  await page.screenshot({ path: outPath, fullPage: false });
  console.log('Top screenshot saved to', outPath);

  await browser.close();
}

captureTopQmlScreenshot().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});

