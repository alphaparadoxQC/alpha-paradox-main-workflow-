/**
 * Notebook Runtime — Sandboxed execution environment for quantum notebook cells.
 * Provides `QuantumCircuit`, `provider`, and plotting helpers.
 */
import { QuantumCircuit } from './circuit.js';
import { provider } from './backend-provider.js';
import { getGate } from './gates.js';
import * as math from 'mathjs';

/**
 * Execute a code string in a sandboxed environment
 */
export async function executeCode(code) {
  // Capture console.log
  const logs = [];
  const customConsole = {
    log: (...args) => logs.push(args.map(a => 
      typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
    ).join(' ')),
    error: (...args) => logs.push('ERROR: ' + args.join(' ')),
    warn: (...args) => logs.push('WARN: ' + args.join(' '))
  };

  // Helper for plotting histograms
  let plotData = null;
  const plotHistogram = (data, title = 'Histogram') => {
    // If it's a SimulationResult object, extract counts
    let counts = data;
    if (data && data.counts) counts = data.counts;
    
    plotData = { type: 'histogram', data: counts, title };
  };

  // Helper for drawing circuit
  let circuitToDraw = null;
  const drawCircuit = (circuit) => {
    if (circuit instanceof QuantumCircuit) {
      circuitToDraw = circuit.toJSON();
    }
  };

  try {
    // Create function with injected globals
    const fn = new Function(
      'QuantumCircuit', 'provider', 'console', 'plotHistogram', 'drawCircuit', 'math',
      `
      return (async () => {
        ${code}
      })();
      `
    );

    // Execute
    await fn(QuantumCircuit, provider, customConsole, plotHistogram, drawCircuit, math);

    return {
      success: true,
      logs,
      plotData,
      circuitToDraw
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      logs
    };
  }
}
