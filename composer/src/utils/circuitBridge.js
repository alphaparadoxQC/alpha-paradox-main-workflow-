/**
 * Circuit Bridge Utility
 * ======================
 * Enables seamless cross-launch between Notebook and Composer.
 * Parses Python / Qiskit / Alpha circuit code and instantiates
 * the visual QuantumCircuit model in Composer.
 */

import { QuantumCircuit } from '../quantum-engine/circuit';
import { useCircuitStore } from '../stores/circuitStore';
import { loadVqeComposerPreset, loadBellParityResetPreset } from './presetTemplates';

export function openNotebookCodeInComposer(code, navigate) {
  if (!code || typeof code !== 'string') {
    if (navigate) navigate('/composer');
    return;
  }

  const clean = code.toLowerCase();

  // 1. Detect VQE Chemistry Workflows
  if (clean.includes('vqe') || clean.includes('hartree') || clean.includes('uccsd') || clean.includes('pyscf')) {
    const mol = clean.includes('lih') ? 'LiH' : 'H2';
    loadVqeComposerPreset(mol, navigate);
    return;
  }

  // 2. Detect QEC / Bell / Mid-Circuit Measurement / Reset Workflows
  if (clean.includes('parity') || (clean.includes('reset') && clean.includes('measure')) || clean.includes('stabilizer')) {
    loadBellParityResetPreset(navigate);
    return;
  }

  // 3. Dynamic Parser for QuantumCircuit commands
  try {
    let numQubits = 5;
    let numClbits = 3;

    // Check for QuantumCircuit(numQubits, numClbits)
    const qcMatch = code.match(/QuantumCircuit\s*\(\s*(\d+)(?:\s*,\s*(\d+))?\s*\)/);
    if (qcMatch) {
      numQubits = parseInt(qcMatch[1], 10);
      if (qcMatch[2]) numClbits = parseInt(qcMatch[2], 10);
      else numClbits = numQubits;
    }

    const qc = new QuantumCircuit(numQubits, numClbits);
    qc.name = 'Imported-from-Notebook';

    const lines = code.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      // Single-qubit gates: qc.h(0), qc.x(1), qc.y(0), qc.z(2), qc.s(0), qc.t(1), qc.reset(0)
      const singleMatch = line.match(/qc\.(h|x|y|z|s|t|sdg|tdg|reset)\s*\(\s*(\d+)\s*\)/i);
      if (singleMatch) {
        const gate = singleMatch[1].toLowerCase();
        const q = parseInt(singleMatch[2], 10);
        if (gate === 'h') qc.h(q);
        else if (gate === 'x') qc.x(q);
        else if (gate === 'y') qc.y(q);
        else if (gate === 'z') qc.z(q);
        else if (gate === 's') qc.s(q);
        else if (gate === 't') qc.t(q);
        else if (gate === 'reset') qc.reset(q);
        continue;
      }

      // Two-qubit gates: qc.cx(0, 1), qc.cz(0, 1), qc.swap(0, 1)
      const twoMatch = line.match(/qc\.(cx|cz|swap)\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/i);
      if (twoMatch) {
        const gate = twoMatch[1].toLowerCase();
        const c = parseInt(twoMatch[2], 10);
        const t = parseInt(twoMatch[3], 10);
        if (gate === 'cx') qc.cx(c, t);
        else if (gate === 'cz') qc.cz(c, t);
        else if (gate === 'swap') qc.swap(c, t);
        continue;
      }

      // Parameterized rotation gates: qc.rx(0, theta), qc.ry(0, 0.785), qc.rz(0, 1.57)
      const rotMatch = line.match(/qc\.(rx|ry|rz)\s*\(\s*(\d+)\s*,\s*([^\)]+)\s*\)/i);
      if (rotMatch) {
        const gate = rotMatch[1].toLowerCase();
        const q = parseInt(rotMatch[2], 10);
        let val = parseFloat(rotMatch[3]);
        if (isNaN(val)) val = Math.PI / 4;
        if (gate === 'rx') qc.rx(q, val);
        else if (gate === 'ry') qc.ry(q, val);
        else if (gate === 'rz') qc.rz(q, val);
        continue;
      }

      // Barrier: qc.barrier()
      if (line.match(/qc\.barrier\s*\(/i)) {
        qc.barrier();
        continue;
      }

      // Measurement: qc.measure(q, c)
      const measMatch = line.match(/qc\.measure\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/i);
      if (measMatch) {
        const q = parseInt(measMatch[1], 10);
        const c = parseInt(measMatch[2], 10);
        qc.measure(q, c);
        continue;
      }

      // measureAll: qc.measure_all() or qc.measureAll()
      if (line.match(/qc\.measure_all\s*\(/i) || line.match(/qc\.measureAll\s*\(/i)) {
        qc.measureAll();
        continue;
      }
    }

    // If operations were parsed, load them; else fallback to default Bell state
    if (qc.operations.length > 0) {
      useCircuitStore.getState().loadCircuit(qc);
    } else {
      loadBellParityResetPreset(navigate);
      return;
    }
  } catch (err) {
    console.warn('Circuit extraction error:', err);
    loadBellParityResetPreset(navigate);
    return;
  }

  if (navigate) navigate('/composer');
}
