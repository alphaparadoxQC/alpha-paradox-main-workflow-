/**
 * ============================================================
 * WEBASSEMBLY TENSOR ENGINE WRAPPER
 * ============================================================
 * Bridges the TypeScript simulation pipeline with the high-
 * performance Rust/WASM quantum-core tensor engine.
 * ============================================================
 */

import init, { TensorEngine } from 'quantum-core';
import wasmUrl from 'quantum-core/quantum_core_bg.wasm?url';
import { QuantumGate, SimulationResult } from '@/types/quantum';
import { BitOrder, getBitPosition } from '../bitOrder';

let wasmInitialized = false;

/**
 * Ensures the WebAssembly module is loaded and initialized.
 * Safe to call multiple times.
 */
export async function initializeWasmEngine() {
  if (!wasmInitialized) {
    try {
      await init(wasmUrl);
      wasmInitialized = true;
      console.log('[WASM] Quantum Core initialized successfully');
    } catch (error) {
      console.error('[WASM] Failed to initialize Quantum Core:', error);
      throw error;
    }
  }
}

import { getGateMatrix as getGateMatrixComplex } from '../gates';

/**
 * Gate definitions in 2x2 complex matrix format.
 * Flattened as [r00, i00, r01, i01, r10, i10, r11, i11] for WASM bridging.
 */
const getGateMatrix = (type: string, angle?: number): Float64Array => {
  const m = getGateMatrixComplex(type, angle);
  return new Float64Array([
    m[0][0].re, m[0][0].im, m[0][1].re, m[0][1].im,
    m[1][0].re, m[1][0].im, m[1][1].re, m[1][1].im
  ]);
};

export const simulateCircuitWasm = async (
  gates: QuantumGate[],
  qubitCount: number,
  bitOrder: BitOrder = 'MSB'
): Promise<SimulationResult> => {
  // HARD SAFETY CAP: Dense state vector extraction loops over 2^N states.
  // For >16 qubits that's 65K+ iterations. For 20 qubits it's 1M+ → OOM crash.
  // Reject and let the caller fall back to MPS.
  if (qubitCount > 16) {
    return Promise.reject(new Error(`Simulation limit reached: WASM dense backend supports up to 16 qubits. For ${qubitCount} qubits, please select the MPS or Tensor Network backend in the simulation settings.`));
  }

  await initializeWasmEngine();
  
  const engine = new TensorEngine(qubitCount);
  
  try {
  
  // Sort gates by position
  const sortedGates = [...gates].sort((a, b) => a.position - b.position);

  // Helper: apply a single-qubit gate by type
  const applySingle = (gateType: string, logicalQubit: number, angle?: number) => {
    const matrix = getGateMatrix(gateType, angle);
    const physicalTarget = getBitPosition(qubitCount, logicalQubit, bitOrder);
    engine.applySingleQubitGate(physicalTarget, matrix);
  };

  // Helper: apply CNOT
  const applyCnot = (control: number, target: number) => {
    const physicalControl = getBitPosition(qubitCount, control, bitOrder);
    const physicalTarget = getBitPosition(qubitCount, target, bitOrder);
    engine.applyCnot(physicalControl, physicalTarget);
  };
  
  for (const gate of sortedGates) {
    switch (gate.type) {
      case 'H':
      case 'X':
      case 'Y':
      case 'Z':
      case 'S':
      case 'T':
      case 'Sdg':
      case 'S†':
      case 'Tdg':
      case 'T†':
      case 'SX':
      case 'SXdg':
      case 'SX†':
        applySingle(gate.type, gate.qubit);
        break;
      case 'Rx':
      case 'Ry':
      case 'Rz':
        applySingle(gate.type, gate.qubit, gate.angle);
        break;
      case 'CNOT': {
        const target = gate.targetQubit ?? (gate.qubit + 1) % qubitCount;
        applyCnot(gate.qubit, target);
        break;
      }
      case 'SWAP': {
        // SWAP = CNOT(a,b) → CNOT(b,a) → CNOT(a,b)
        const target = gate.targetQubit ?? (gate.qubit + 1) % qubitCount;
        applyCnot(gate.qubit, target);
        applyCnot(target, gate.qubit);
        applyCnot(gate.qubit, target);
        break;
      }
      case 'CZ': {
        // CZ = H(target) → CNOT(control,target) → H(target)
        const target = gate.targetQubit ?? (gate.qubit + 1) % qubitCount;
        applySingle('H', target);
        applyCnot(gate.qubit, target);
        applySingle('H', target);
        break;
      }
      case 'CCX': {
        // Toffoli decomposition: standard 6-CNOT decomposition
        const c2 = gate.controlQubit2 ?? (gate.qubit + 1) % qubitCount;
        const target = gate.targetQubit ?? (gate.qubit + 2) % qubitCount;
        applySingle('H', target);
        applyCnot(c2, target);
        applySingle('Tdg', target);
        applyCnot(gate.qubit, target);
        applySingle('T', target);
        applyCnot(c2, target);
        applySingle('Tdg', target);
        applyCnot(gate.qubit, target);
        applySingle('T', c2);
        applySingle('T', target);
        applySingle('H', target);
        applyCnot(gate.qubit, c2);
        applySingle('T', gate.qubit);
        applySingle('Tdg', c2);
        applyCnot(gate.qubit, c2);
        break;
      }
      case 'FUSED': {
        // Apply compiler-fused gate using the pre-computed matrix
        if (gate.fusedMatrix) {
          const fm = gate.fusedMatrix;
          const matrix = new Float64Array([
            fm[0][0].re, fm[0][0].im, fm[0][1].re, fm[0][1].im,
            fm[1][0].re, fm[1][0].im, fm[1][1].re, fm[1][1].im
          ]);
          const physicalTarget = getBitPosition(qubitCount, gate.qubit, bitOrder);
          engine.applySingleQubitGate(physicalTarget, matrix);
        }
        break;
      }
      case 'M':
      case 'DISPLAY':
        break;
    }
  }
  
  // Extract probabilities from WASM memory
  const wasmProbs = engine.getProbabilities();
  
  const probabilities = [];
  const numStates = 1 << qubitCount;
  
  for (let i = 0; i < numStates; i++) {
    // Reverse bit string if LSB is requested
    let displayStr = i.toString(2).padStart(qubitCount, '0');
    if (bitOrder === 'LSB') {
      displayStr = displayStr.split('').reverse().join('');
    }
    probabilities.push({ state: displayStr, probability: wasmProbs[i] });
  }
  
  // Extract state vector from WASM memory
  const wasmState = engine.getStateVector();
  const amplitudes = [];
  const amplitudeInfo = [];
  
  for (let i = 0; i < numStates; i++) {
    const re = wasmState[2 * i];
    const im = wasmState[2 * i + 1];
    amplitudes.push({ re, im });
    
    // Only include non-zero amplitudes in UI display for performance
    const mag = Math.sqrt(re * re + im * im);
    if (mag > 1e-10) {
      let displayStr = i.toString(2).padStart(qubitCount, '0');
      if (bitOrder === 'LSB') {
        displayStr = displayStr.split('').reverse().join('');
      }
      amplitudeInfo.push({
        state: `|${displayStr}⟩`,
        re,
        im,
        magnitude: mag,
        phase: Math.atan2(im, re),
      });
    }
  }

  // Compute real Bloch vectors from state vector
  const blochVectors: { x: number; y: number; z: number }[] = [];
  for (let q = 0; q < qubitCount; q++) {
    const bitPos = getBitPosition(qubitCount, q, bitOrder);
    let rho00 = 0, rho11 = 0;
    let rho01_re = 0, rho01_im = 0;

    for (let i = 0; i < numStates; i++) {
      const re_i = wasmState[2 * i];
      const im_i = wasmState[2 * i + 1];
      const prob = re_i * re_i + im_i * im_i;
      const bit = (i >> bitPos) & 1;

      if (bit === 0) {
        rho00 += prob;
        const partner = i | (1 << bitPos);
        const re_p = wasmState[2 * partner];
        const im_p = wasmState[2 * partner + 1];
        rho01_re += re_i * re_p + im_i * im_p;
        rho01_im += im_i * re_p - re_i * im_p;
      } else {
        rho11 += prob;
      }
    }

    blochVectors.push({
      x: 2 * rho01_re,
      y: -2 * rho01_im,
      z: rho00 - rho11,
    });
  }

    // Calculate depth
    const circuitDepth = gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 1 : 0;
    
    return {
      probabilities: probabilities.sort((a, b) => b.probability - a.probability),
      blochVectors,
      isEntangled: gates.some(g => ['CNOT', 'CZ', 'SWAP', 'CCX'].includes(g.type)),
      entangledPairs: [],
      stateVector: { amplitudes, qubitCount },
      amplitudes: amplitudeInfo,
      circuitDepth,
      hasMeasurement: gates.some(g => g.type === 'M'),
    };
  } finally {
    // Cleanup WASM memory
    engine.free();
  }
};
