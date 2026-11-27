const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  try {
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
    console.log("Page loaded");
    
    // Click "Algorithms"
    await page.click('text="Algorithms"');
    await page.waitForTimeout(500);
    
    // Click "Quantum Teleportation"
    await page.click('text="Quantum Teleportation"');
    await page.waitForTimeout(500);
    
    // Check gates
    const gates = await page.$$('.gate-tile'); // Could be in palette or circuit
    
    // Click the first placed-gate instead!
    const placedGates = await page.$$('.placed-gate');
    if (placedGates.length > 0) {
      console.log(`Found ${placedGates.length} placed gates. Clicking the first one...`);
      await placedGates[0].click();
      await page.waitForTimeout(500);
      
      // Look for the edit button by title
      const editBtn = await page.$('button[title="Edit Gate"]');
      if (editBtn) {
        console.log("Clicking Edit Gate button...");
        await editBtn.click();
        await page.waitForTimeout(1000);
        
        // Look for modal
        const modal = await page.$('.gate-modal');
        if (modal) {
          console.log("SUCCESS: Modal opened successfully!");
        } else {
          console.log("FAIL: Modal DID NOT open.");
        }
      } else {
        console.log("FAIL: Edit Gate button not found in context menu");
      }
    } else {
      console.log("No placed gates found in circuit.");
    }
  } catch (e) {
    console.error("Test failed:", e);
  } finally {
    await browser.close();
  }
})();
