const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log('Navigating to http://localhost:8081/ ...');
  await page.goto('http://localhost:8081/');
  
  // Wait for the app to load
  await page.waitForSelector('.bg-sidebar');
  
  // Find the 'Amplitude Display' gate by looking for text 'Phase Disk Amplitude Display' or 'Display'
  console.log('Looking for Amplitude Display...');
  const elementHandles = await page.$$('div');
  let target = null;
  for (let handle of elementHandles) {
    const text = await page.evaluate(el => el.textContent, handle);
    if (text && text.includes('Amplitude Display')) {
      target = handle;
      break;
    }
  }
  
  if (target) {
    console.log('Clicking target...');
    await target.click();
    await new Promise(r => setTimeout(r, 2000));
  } else {
    console.log('Could not find Amplitude Display gate.');
  }

  await browser.close();
})();
