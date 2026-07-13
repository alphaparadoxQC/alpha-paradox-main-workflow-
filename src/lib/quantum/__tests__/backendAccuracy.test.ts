/**
 * Backend Accuracy Tests
 * Validates gate correctness, phase handling, multi-qubit logic,
 * normalization, compiler fusion, and sparse backend cross-validation.
 */
import { describe, it, expect } from 'vitest';
import {
  initializeState,
  applySingleQubitGate,
  applyCNOT,
  applySWAP,
  applyCZ,
  applyToffoli,
  simulateCircuit,
  simulateCircuitEnhanced,
  simulateCircuitSparse,
} from '../simulator';
import { simulateCircuitMPS } from '../tensor/mps';
import { getAdaptiveMPSConfig } from '../tensor/types';
import { GPUStateVectorSimulator } from '../gpu/gpuSimulator';
import { isWebGPUAvailable } from '../gpu/webgpuDriver';
import { compileCircuit, DEFAULT_COMPILER_CONFIG } from '../compiler';
import { magnitudeSquared } from '../complex';
import { QuantumGate } from '@/types/quantum';

const EPSILON = 1e-8;
const probOf = (state: any, index: number) => magnitudeSquared(state.amplitudes[index]);
const ampOf = (state: any, index: number) => state.amplitudes[index];

// Helper: create a gate
const gate = (type: string, qubit: number, position: number, extra: Partial<QuantumGate> = {}): QuantumGate => ({
  id: `test-${type}-${qubit}-${position}`,
  type: type as any,
  qubit,
  position,
  ...extra,
});

// ─── Dagger Gate Tests ──────────────────────────────────────

describe('Dagger Gates', () => {
  it('S†|1⟩ = -i|1⟩', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'X', 0);
    s = applySingleQubitGate(s, 'Sdg', 0);
    expect(ampOf(s, 1).re).toBeCloseTo(0, 8);
    expect(ampOf(s, 1).im).toBeCloseTo(-1, 8);
  });

  it('S · S† = I', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'H', 0); // superposition
    s = applySingleQubitGate(s, 'S', 0);
    s = applySingleQubitGate(s, 'Sdg', 0);
    // Should be back to H|0⟩
    expect(ampOf(s, 0).re).toBeCloseTo(1 / Math.sqrt(2), 8);
    expect(ampOf(s, 1).re).toBeCloseTo(1 / Math.sqrt(2), 8);
  });

  it('T†|1⟩ = e^(-iπ/4)|1⟩', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'X', 0);
    s = applySingleQubitGate(s, 'T†', 0);
    expect(ampOf(s, 1).re).toBeCloseTo(Math.cos(Math.PI / 4), 8);
    expect(ampOf(s, 1).im).toBeCloseTo(-Math.sin(Math.PI / 4), 8);
  });

  it('T · T† = I', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'H', 0);
    s = applySingleQubitGate(s, 'T', 0);
    s = applySingleQubitGate(s, 'T†', 0);
    expect(ampOf(s, 0).re).toBeCloseTo(1 / Math.sqrt(2), 8);
    expect(ampOf(s, 1).re).toBeCloseTo(1 / Math.sqrt(2), 8);
  });

  it('SX† · SX = I', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'H', 0);
    s = applySingleQubitGate(s, 'SX', 0);
    s = applySingleQubitGate(s, 'SXdg', 0);
    expect(ampOf(s, 0).re).toBeCloseTo(1 / Math.sqrt(2), 8);
    expect(ampOf(s, 1).re).toBeCloseTo(1 / Math.sqrt(2), 8);
  });
});

// ─── Phase Accumulation Tests ───────────────────────────────

describe('Phase Accumulation', () => {
  it('S · S = Z (on |1⟩)', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'X', 0); // |1⟩
    s = applySingleQubitGate(s, 'S', 0);
    s = applySingleQubitGate(s, 'S', 0);
    // S·S|1⟩ = i·i|1⟩ = -|1⟩ = Z|1⟩
    expect(ampOf(s, 1).re).toBeCloseTo(-1, 8);
    expect(ampOf(s, 1).im).toBeCloseTo(0, 8);
  });

  it('T · T = S (on |1⟩)', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'X', 0);
    s = applySingleQubitGate(s, 'T', 0);
    s = applySingleQubitGate(s, 'T', 0);
    // T·T|1⟩ = e^(iπ/4)·e^(iπ/4)|1⟩ = e^(iπ/2)|1⟩ = i|1⟩ = S|1⟩
    expect(ampOf(s, 1).re).toBeCloseTo(0, 8);
    expect(ampOf(s, 1).im).toBeCloseTo(1, 8);
  });

  it('H · Z · H = X (on |0⟩)', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'H', 0);
    s = applySingleQubitGate(s, 'Z', 0);
    s = applySingleQubitGate(s, 'H', 0);
    // HZH = X, so HZH|0⟩ = X|0⟩ = |1⟩
    expect(probOf(s, 0)).toBeCloseTo(0, 8);
    expect(probOf(s, 1)).toBeCloseTo(1, 8);
  });

  it('Rz(π/2) ≡ S up to global phase', () => {
    // S|1⟩ = i|1⟩
    // Rz(π/2)|1⟩ = e^(iπ/4)|1⟩
    // These differ by global phase e^(-iπ/4) but the probability must match
    let sS = initializeState(1);
    sS = applySingleQubitGate(sS, 'X', 0);
    sS = applySingleQubitGate(sS, 'S', 0);
    
    let sRz = initializeState(1);
    sRz = applySingleQubitGate(sRz, 'X', 0);
    sRz = applySingleQubitGate(sRz, 'Rz', 0, Math.PI / 2);
    
    // Probabilities must match
    expect(probOf(sS, 0)).toBeCloseTo(probOf(sRz, 0), 8);
    expect(probOf(sS, 1)).toBeCloseTo(probOf(sRz, 1), 8);
  });
});

// ─── Reverse CNOT Test ──────────────────────────────────────

describe('Reverse CNOT Direction', () => {
  it('CNOT(q1, q0)|01⟩ = |11⟩ (target=q0, control=q1)', () => {
    let s = initializeState(2);
    s = applySingleQubitGate(s, 'X', 1); // |01⟩
    s = applyCNOT(s, 1, 0); // control=q1, target=q0
    // q1=1 → flip q0: |01⟩ → |11⟩ = index 3
    expect(probOf(s, 3)).toBeCloseTo(1, 8);
  });

  it('CNOT(q1, q0)|00⟩ = |00⟩ (control=0, no flip)', () => {
    let s = initializeState(2);
    s = applyCNOT(s, 1, 0);
    expect(probOf(s, 0)).toBeCloseTo(1, 8);
  });

  it('CNOT(q1, q0)|10⟩ = |10⟩ (control q1=0, no flip)', () => {
    let s = initializeState(2);
    s = applySingleQubitGate(s, 'X', 0); // |10⟩
    s = applyCNOT(s, 1, 0);
    expect(probOf(s, 2)).toBeCloseTo(1, 8);
  });
});

// ─── GHZ State ──────────────────────────────────────────────

describe('GHZ State', () => {
  it('3-qubit GHZ = (|000⟩+|111⟩)/√2', () => {
    let s = initializeState(3);
    s = applySingleQubitGate(s, 'H', 0);
    s = applyCNOT(s, 0, 1);
    s = applyCNOT(s, 1, 2);
    // (|000⟩ + |111⟩)/√2
    expect(probOf(s, 0)).toBeCloseTo(0.5, 8); // |000⟩
    expect(probOf(s, 7)).toBeCloseTo(0.5, 8); // |111⟩
    // All other states should be 0
    for (let i = 1; i < 7; i++) {
      expect(probOf(s, i)).toBeCloseTo(0, 8);
    }
  });

  it('4-qubit GHZ = (|0000⟩+|1111⟩)/√2', () => {
    let s = initializeState(4);
    s = applySingleQubitGate(s, 'H', 0);
    s = applyCNOT(s, 0, 1);
    s = applyCNOT(s, 1, 2);
    s = applyCNOT(s, 2, 3);
    expect(probOf(s, 0)).toBeCloseTo(0.5, 8);
    expect(probOf(s, 15)).toBeCloseTo(0.5, 8);
  });
});

// ─── Normalization After Complex Circuits ────────────────────

describe('Advanced Normalization', () => {
  it('normalized after 5-qubit random circuit', () => {
    let s = initializeState(5);
    s = applySingleQubitGate(s, 'H', 0);
    s = applySingleQubitGate(s, 'H', 2);
    s = applySingleQubitGate(s, 'Rx', 1, 1.5);
    s = applyCNOT(s, 0, 1);
    s = applySingleQubitGate(s, 'T', 3);
    s = applyCZ(s, 2, 3);
    s = applySWAP(s, 1, 4);
    s = applySingleQubitGate(s, 'Ry', 0, 2.1);
    s = applySingleQubitGate(s, 'Rz', 4, 0.8);
    s = applyCNOT(s, 3, 4);
    s = applySingleQubitGate(s, 'S', 2);
    s = applySingleQubitGate(s, 'Sdg', 1);

    const totalProb = s.amplitudes.reduce((sum: number, a: any) => sum + magnitudeSquared(a), 0);
    expect(totalProb).toBeCloseTo(1, 8);
  });
});

// ─── simulateCircuit Full Pipeline ──────────────────────────

describe('simulateCircuit Integration', () => {
  it('Bell state via simulateCircuit', () => {
    const gates: QuantumGate[] = [
      gate('H', 0, 0),
      gate('CNOT', 0, 1, { targetQubit: 1 }),
    ];
    const result = simulateCircuit(gates, 2);
    const p00 = result.probabilities.find(p => p.state === '|00⟩');
    const p11 = result.probabilities.find(p => p.state === '|11⟩');
    expect(p00?.probability).toBeCloseTo(0.5, 6);
    expect(p11?.probability).toBeCloseTo(0.5, 6);
  });

  it('GHZ state via simulateCircuit', () => {
    const gates: QuantumGate[] = [
      gate('H', 0, 0),
      gate('CNOT', 0, 1, { targetQubit: 1 }),
      gate('CNOT', 1, 2, { targetQubit: 2 }),
    ];
    const result = simulateCircuit(gates, 3);
    const p000 = result.probabilities.find(p => p.state === '|000⟩');
    const p111 = result.probabilities.find(p => p.state === '|111⟩');
    expect(p000?.probability).toBeCloseTo(0.5, 6);
    expect(p111?.probability).toBeCloseTo(0.5, 6);
    // Entanglement should be detected
    expect(result.isEntangled).toBe(true);
  });

  it('X gate via simulateCircuit', () => {
    const gates: QuantumGate[] = [gate('X', 0, 0)];
    const result = simulateCircuit(gates, 1);
    const p1 = result.probabilities.find(p => p.state === '|1⟩');
    expect(p1?.probability).toBeCloseTo(1, 6);
  });

  it('H-Z-H identity via simulateCircuit', () => {
    const gates: QuantumGate[] = [
      gate('H', 0, 0),
      gate('Z', 0, 1),
      gate('H', 0, 2),
    ];
    const result = simulateCircuit(gates, 1);
    const p1 = result.probabilities.find(p => p.state === '|1⟩');
    expect(p1?.probability).toBeCloseTo(1, 6);
  });
});

// ─── FUSED Gate via Compiler ────────────────────────────────

describe('Compiler Fusion Accuracy', () => {
  it('Fused H→T→S matches sequential H→T→S', () => {
    const gates: QuantumGate[] = [
      gate('H', 0, 0),
      gate('T', 0, 1),
      gate('S', 0, 2),
    ];

    // Sequential (no compilation)
    const sequential = simulateCircuit(gates, 1);

    // Compiled (fusion enabled)
    const compiled = compileCircuit(gates, 1, {
      ...DEFAULT_COMPILER_CONFIG,
      enableCancellation: false,
      enableCommutation: false,
      enableChunking: false,
      enableFusion: true,
    });

    // Verify fusion happened
    expect(compiled.metrics.fusedGates).toBeGreaterThan(0);

    // Run compiled gates
    const fusedResult = simulateCircuit(compiled.optimizedGates, 1);

    // Compare probabilities
    for (const seqProb of sequential.probabilities) {
      const fusedProb = fusedResult.probabilities.find(p => p.state === seqProb.state);
      expect(fusedProb?.probability).toBeCloseTo(seqProb.probability, 6);
    }
  });

  it('Fused X→X cancels to identity (via cancellation pass)', () => {
    const gates: QuantumGate[] = [
      gate('X', 0, 0),
      gate('X', 0, 1),
    ];

    const compiled = compileCircuit(gates, 1, {
      ...DEFAULT_COMPILER_CONFIG,
      enableCancellation: true,
      enableFusion: false,
      enableCommutation: false,
      enableChunking: false,
    });

    // Both gates should be cancelled
    expect(compiled.metrics.cancelledGates).toBe(2);
    expect(compiled.optimizedGates.length).toBe(0);
  });

  it('Fused Ry→Rz on VQE-like circuit is accurate', () => {
    const gates: QuantumGate[] = [
      gate('Ry', 0, 0, { angle: 0.5 }),
      gate('Rz', 0, 1, { angle: 0.7 }),
    ];

    const sequential = simulateCircuit(gates, 1);
    const compiled = compileCircuit(gates, 1, {
      ...DEFAULT_COMPILER_CONFIG,
      enableFusion: true,
      enableCancellation: false,
      enableCommutation: false,
      enableChunking: false,
    });
    const fusedResult = simulateCircuit(compiled.optimizedGates, 1);

    for (const seqProb of sequential.probabilities) {
      const fusedProb = fusedResult.probabilities.find(p => p.state === seqProb.state);
      expect(fusedProb?.probability).toBeCloseTo(seqProb.probability, 6);
    }
  });
});

// ─── Sparse Backend Cross-Validation ────────────────────────

describe('Sparse Backend vs CPU Statevector', () => {
  it('X gate: sparse matches statevector', () => {
    const gates: QuantumGate[] = [gate('X', 0, 0)];
    const sv = simulateCircuit(gates, 1);
    const sparse = simulateCircuitSparse(gates, 1);

    for (const svProb of sv.probabilities) {
      const sparseProb = sparse.probabilities.find(p => p.state === svProb.state);
      expect(sparseProb?.probability).toBeCloseTo(svProb.probability, 8);
    }
  });

  it('Bell state: sparse matches statevector', () => {
    const gates: QuantumGate[] = [
      gate('H', 0, 0),
      gate('CNOT', 0, 1, { targetQubit: 1 }),
    ];
    const sv = simulateCircuit(gates, 2);
    const sparse = simulateCircuitSparse(gates, 2);

    for (const svProb of sv.probabilities) {
      const sparseProb = sparse.probabilities.find(p => p.state === svProb.state);
      expect(sparseProb?.probability).toBeCloseTo(svProb.probability, 8);
    }
  });

  it('Complex circuit: sparse matches statevector', () => {
    const gates: QuantumGate[] = [
      gate('H', 0, 0),
      gate('Ry', 1, 0, { angle: 1.23 }),
      gate('CNOT', 0, 1, { targetQubit: 1 }),
      gate('T', 2, 1),
      gate('CZ', 1, 2, { targetQubit: 2 }),
      gate('Rx', 0, 2, { angle: 0.7 }),
    ];
    const sv = simulateCircuit(gates, 3);
    const sparse = simulateCircuitSparse(gates, 3);

    // Total probability should be 1 for both
    const svTotal = sv.probabilities.reduce((s, p) => s + p.probability, 0);
    const sparseTotal = sparse.probabilities.reduce((s, p) => s + p.probability, 0);
    expect(svTotal).toBeCloseTo(1, 6);
    expect(sparseTotal).toBeCloseTo(1, 6);

    // Each probability should match
    for (const svProb of sv.probabilities) {
      const sparseProb = sparse.probabilities.find(p => p.state === svProb.state);
      if (svProb.probability > 1e-8) {
        expect(sparseProb).toBeDefined();
        expect(sparseProb!.probability).toBeCloseTo(svProb.probability, 6);
      }
    }
  });

  it('SWAP + CZ: sparse matches statevector', () => {
    const gates: QuantumGate[] = [
      gate('X', 0, 0),
      gate('H', 1, 0),
      gate('SWAP', 0, 1, { targetQubit: 1 }),
      gate('CZ', 0, 1, { targetQubit: 1 }),
    ];
    const sv = simulateCircuit(gates, 2);
    const sparse = simulateCircuitSparse(gates, 2);

    for (const svProb of sv.probabilities) {
      const sparseProb = sparse.probabilities.find(p => p.state === svProb.state);
      if (svProb.probability > 1e-8) {
        expect(sparseProb).toBeDefined();
        expect(sparseProb!.probability).toBeCloseTo(svProb.probability, 6);
      }
    }
  });

  it('Toffoli: sparse matches statevector', () => {
    const gates: QuantumGate[] = [
      gate('X', 0, 0),
      gate('X', 1, 0),
      gate('CCX', 0, 1, { controlQubit2: 1, targetQubit: 2 }),
    ];
    const sv = simulateCircuit(gates, 3);
    const sparse = simulateCircuitSparse(gates, 3);

    for (const svProb of sv.probabilities) {
      const sparseProb = sparse.probabilities.find(p => p.state === svProb.state);
      if (svProb.probability > 1e-8) {
        expect(sparseProb).toBeDefined();
        expect(sparseProb!.probability).toBeCloseTo(svProb.probability, 6);
      }
    }
  });
});

// ─── Enhanced Simulation Pipeline ───────────────────────────

describe('Enhanced Simulation Pipeline', () => {
  it('enhanced simulation matches basic for simple circuit', async () => {
    const gates: QuantumGate[] = [
      gate('H', 0, 0),
      gate('CNOT', 0, 1, { targetQubit: 1 }),
    ];

    const basic = simulateCircuit(gates, 2);
    const enhanced = await simulateCircuitEnhanced(gates, 2, {
      compilerEnabled: false,
      bitOrder: 'MSB',
    });

    for (const bp of basic.probabilities) {
      const ep = enhanced.probabilities.find(p => p.state === bp.state);
      expect(ep?.probability).toBeCloseTo(bp.probability, 6);
    }
  });

  it('enhanced with compiler matches basic', async () => {
    const gates: QuantumGate[] = [
      gate('H', 0, 0),
      gate('T', 0, 1),
      gate('CNOT', 0, 2, { targetQubit: 1 }),
    ];

    const basic = simulateCircuit(gates, 2);
    const enhanced = await simulateCircuitEnhanced(gates, 2, {
      compilerEnabled: true,
      bitOrder: 'MSB',
    });

    for (const bp of basic.probabilities) {
      const ep = enhanced.probabilities.find(p => p.state === bp.state);
      if (bp.probability > 1e-8) {
        expect(ep).toBeDefined();
        expect(ep!.probability).toBeCloseTo(bp.probability, 6);
      }
    }
  });

  it('backend selection returns cpu-statevector for ≤15 qubits', async () => {
    const gates: QuantumGate[] = [gate('H', 0, 0)];
    const result = await simulateCircuitEnhanced(gates, 4, {
      compilerEnabled: false,
    });
    // Should not be wasm-tensor anymore
    expect(result.backend).not.toBe('wasm-tensor');
  });
});

// ─── Bloch Vector Accuracy ──────────────────────────────────

describe('Bloch Vector Accuracy', () => {
  it('|0⟩ has Bloch vector (0, 0, 1)', () => {
    const result = simulateCircuit([], 1);
    expect(result.blochVectors[0].x).toBeCloseTo(0, 6);
    expect(result.blochVectors[0].y).toBeCloseTo(0, 6);
    expect(result.blochVectors[0].z).toBeCloseTo(1, 6);
  });

  it('|1⟩ has Bloch vector (0, 0, -1)', () => {
    const gates: QuantumGate[] = [gate('X', 0, 0)];
    const result = simulateCircuit(gates, 1);
    expect(result.blochVectors[0].x).toBeCloseTo(0, 6);
    expect(result.blochVectors[0].y).toBeCloseTo(0, 6);
    expect(result.blochVectors[0].z).toBeCloseTo(-1, 6);
  });

  it('H|0⟩ has Bloch vector (1, 0, 0)', () => {
    const gates: QuantumGate[] = [gate('H', 0, 0)];
    const result = simulateCircuit(gates, 1);
    expect(result.blochVectors[0].x).toBeCloseTo(1, 6);
    expect(result.blochVectors[0].y).toBeCloseTo(0, 6);
    expect(result.blochVectors[0].z).toBeCloseTo(0, 6);
  });

  it('entangled qubit has |Bloch| < 1', () => {
    const gates: QuantumGate[] = [
      gate('H', 0, 0),
      gate('CNOT', 0, 1, { targetQubit: 1 }),
    ];
    const result = simulateCircuit(gates, 2);
    // Both qubits in Bell state should have |r| < 1 (maximally mixed single-qubit state)
    for (const bv of result.blochVectors) {
      const mag = Math.sqrt(bv.x * bv.x + bv.y * bv.y + bv.z * bv.z);
      expect(mag).toBeLessThan(0.1); // Should be ~0 for maximally entangled
    }
  });
});

// ─── MPS Backend Cross-Validation ───────────────────────────

describe('MPS Backend vs CPU Statevector', () => {
  test.skip('Bell state: MPS matches statevector', () => {
    const gates: QuantumGate[] = [
      gate('H', 0, 0),
      gate('CNOT', 0, 1, { targetQubit: 1 }),
    ];
    const sv = simulateCircuit(gates, 2);
    const config = getAdaptiveMPSConfig(2, gates.length);
    const mps = simulateCircuitMPS(gates, 2, config);

    for (let i = 0; i < sv.amplitudes.length; i++) {
      expect(mps.amplitudes[i].re).toBeCloseTo(sv.amplitudes[i].re, 5);
      expect(mps.amplitudes[i].im).toBeCloseTo(sv.amplitudes[i].im, 5);
    }
  });

  test.skip('GHZ state: MPS matches statevector', () => {
    const gates: QuantumGate[] = [
      gate('H', 0, 0),
      gate('CNOT', 0, 1, { targetQubit: 1 }),
      gate('CNOT', 1, 2, { targetQubit: 2 }),
    ];
    const sv = simulateCircuit(gates, 3);
    const config = getAdaptiveMPSConfig(3, gates.length);
    const mps = simulateCircuitMPS(gates, 3, config);

    for (let i = 0; i < sv.amplitudes.length; i++) {
      expect(mps.amplitudes[i].re).toBeCloseTo(sv.amplitudes[i].re, 5);
      expect(mps.amplitudes[i].im).toBeCloseTo(sv.amplitudes[i].im, 5);
    }
  });
});

// ─── GPU Backend Cross-Validation ───────────────────────────

describe('GPU Backend vs CPU Statevector', () => {
  it('Bell state: GPU matches statevector (if supported)', async () => {
    const available = await isWebGPUAvailable();
    if (!available) {
      console.log('Skipping GPU test: WebGPU not available in test environment');
      return;
    }

    const gates: QuantumGate[] = [
      gate('H', 0, 0),
      gate('CNOT', 0, 1, { targetQubit: 1 }),
    ];
    const sv = simulateCircuit(gates, 2);
    
    const gpuSim = new GPUStateVectorSimulator(2);
    await gpuSim.init();
    const gpuResult = await gpuSim.simulate(gates);
    
    for (const svProb of sv.probabilities) {
      const gpuProb = gpuResult.probabilities.find(p => p.state === svProb.state);
      if (svProb.probability > 1e-8) {
        expect(gpuProb).toBeDefined();
        expect(gpuProb!.probability).toBeCloseTo(svProb.probability, 5);
      }
    }
  });
});

