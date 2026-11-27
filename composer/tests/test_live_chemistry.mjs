import { chromium } from 'playwright';

async function testChemistrySimulation() {
  console.log('🧪 Starting Interactive Test for Quantum Chemistry Lab...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('http://127.0.0.1:5173/labs/chemistry', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('Checking initial Chemistry KPIs...');
  const kpis = await page.$$eval('.lab-kpi-value', els => els.map(e => e.textContent));
  console.log('KPIs:', kpis);

  // Click Run Chemistry Simulation
  const runBtn = await page.$('button:has-text("Run Chemistry Simulation")');
  if (runBtn) {
    console.log('Clicking "Run Chemistry Simulation"...');
    await runBtn.click();
    
    // Wait 500ms to observe live simulation phase
    await page.waitForTimeout(500);
    const btnTextDuring = await page.innerText('aside.lab-sidebar button.lab-btn-primary');
    console.log('Button text during simulation:', btnTextDuring);

    // Capture screenshot during active VQE simulation
    await page.screenshot({ path: '/Users/sourojitmondal/.gemini/antigravity/brain/a9407a54-8e45-48e5-993c-416272df8af6/chem_sim_active.png' });
    console.log('Saved chem_sim_active.png');

    // Wait for full VQE convergence loop to complete (~1.8s)
    await page.waitForTimeout(2000);
    const btnTextAfter = await page.innerText('aside.lab-sidebar button.lab-btn-primary');
    console.log('Button text after convergence:', btnTextAfter);
    
    // Check post-simulation KPI
    const postKpis = await page.$$eval('.lab-kpi-value', els => els.map(e => e.textContent));
    console.log('Post-convergence KPIs:', postKpis);

    await page.screenshot({ path: '/Users/sourojitmondal/.gemini/antigravity/brain/a9407a54-8e45-48e5-993c-416272df8af6/chem_sim_converged.png' });
    console.log('Saved chem_sim_converged.png');
  }

  // Test Workflow 2: Potential Energy Surface
  console.log('Switching to Potential Energy Surface (PES) workflow...');
  await page.click('button:has-text("Potential Energy Surface")');
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/Users/sourojitmondal/.gemini/antigravity/brain/a9407a54-8e45-48e5-993c-416272df8af6/chem_workflow_pes.png' });
  console.log('Saved chem_workflow_pes.png');

  // Test Workflow 4: Cytochrome P450 Soft Spots & Highlight
  console.log('Switching to Cytochrome P450 workflow...');
  await page.click('button:has-text("Cytochrome P450")');
  await page.waitForTimeout(600);
  const siteRow = await page.$('text=C4 (Aromatic 4-OH)');
  if (siteRow) {
    console.log('Clicking site C4 to trigger 3D atom highlight...');
    await siteRow.click();
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: '/Users/sourojitmondal/.gemini/antigravity/brain/a9407a54-8e45-48e5-993c-416272df8af6/chem_workflow_p450.png' });
  console.log('Saved chem_workflow_p450.png');

  // Test Pro Active-Space Mode & Geometry Optimization
  console.log('Switching to Pro Active-Space Mode...');
  await page.click('button:has-text("Pro Active-Space Mode")');
  await page.waitForTimeout(600);
  const geomBtn = await page.$('button:has-text("Run Geometry Optimization")');
  if (geomBtn) {
    console.log('Clicking "Run Geometry Optimization"...');
    await geomBtn.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: '/Users/sourojitmondal/.gemini/antigravity/brain/a9407a54-8e45-48e5-993c-416272df8af6/chem_pro_mode.png' });
  console.log('Saved chem_pro_mode.png');

  console.log('All logged browser errors:', errors);
  await browser.close();
}

testChemistrySimulation().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});

