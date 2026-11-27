import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/eda');
  
  // Wait for canvas to load
  await page.waitForTimeout(2000);
  
  // We can evaluate code in the browser to grab the edaStore state
  const state = await page.evaluate(() => {
    return window.useEdaStore ? window.useEdaStore.getState().qgeometry : null;
  });
  
  if (state) {
    const spiral = state.path.find(p => p.component.includes('SquareSpiral'));
    if (spiral) {
      console.log("Geometry string:", spiral.geometry);
    } else {
      console.log("Spiral not found in qgeometry.path");
    }
  } else {
    console.log("Store not found, let's try reading the DOM if there's SVG");
  }
  
  await browser.close();
})();
