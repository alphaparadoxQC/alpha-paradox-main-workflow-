const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('Navigating to app...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  console.log('Opening Algorithms modal...');
  // Find the Algorithms button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const algoBtn = btns.find(b => b.textContent.includes('Algorithms'));
    if (algoBtn) algoBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));

  console.log('Generating Teleportation circuit...');
  await page.evaluate(() => {
    // Find select
    const select = document.querySelector('select');
    if (select) {
      select.value = 'teleportation-n';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const generateBtn = btns.find(b => b.textContent.includes('Generate Circuit'));
    if (generateBtn) generateBtn.click();
  });

  await new Promise(r => setTimeout(r, 1000));

  console.log('Clicking a gate on canvas...');
  await page.evaluate(() => {
    const gates = document.querySelectorAll('.placed-gate');
    if (gates.length > 0) {
      gates[1].click(); // click the second gate (likely H or CX)
    } else {
      console.log('No gates found!');
    }
  });

  await new Promise(r => setTimeout(r, 2000));

  console.log('Done.');
  await browser.close();
})();
