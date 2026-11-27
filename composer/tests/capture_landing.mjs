import { chromium } from 'playwright';

async function captureLandingScreenshot() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
  });

  console.log('Navigating to http://127.0.0.1:5173/ ...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });

  // Wait for canvas or scrollytelling container to render
  await page.waitForTimeout(2000);

  const outputPath = '/Users/sourojitmondal/.gemini/antigravity/brain/a9407a54-8e45-48e5-993c-416272df8af6/landing_verified.png';
  await page.screenshot({ path: outputPath, fullPage: false });
  console.log(`Landing screenshot saved to ${outputPath}`);
  console.log('Logged errors count:', errors.length);
  if (errors.length > 0) {
    console.log('Errors:', errors);
  }

  // Check navbar links
  const navText = await page.textContent('header');
  console.log('Header text:', navText);

  await browser.close();
}

captureLandingScreenshot().catch(console.error);
