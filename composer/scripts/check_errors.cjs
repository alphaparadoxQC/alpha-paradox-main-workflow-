const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.toString()}`);
  });

  try {
    await page.goto('http://localhost:5173/eda', { waitUntil: 'networkidle2' });
  } catch (err) {
    console.log(`[NAVIGATION ERROR] ${err}`);
  }
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
