/**
 * Gate Verification Tests
 * Validates all quantum gate implementations against known mathematical results.
 */
import { describe, it, expect } from 'vitest';
import { initializeState, applySingleQubitGate, applyCNOT, applySWAP, applyCZ, applyToffoli, measureQubit } from '../simulator';
import { magnitudeSquared } from '../complex';

const EPSILON = 1e-10;
const probOf = (state: any, index: number) => magnitudeSquared(state.amplitudes[index]);
const ampOf = (state: any, index: number) => state.amplitudes[index];

describe('State Initialization', () => {
  it('|0⟩ for 1 qubit', () => {
    const s = initializeState(1);
    expect(s.amplitudes.length).toBe(2);
    expect(probOf(s, 0)).toBeCloseTo(1); // |0⟩
    expect(probOf(s, 1)).toBeCloseTo(0); // |1⟩
  });

  it('|00⟩ for 2 qubits', () => {
    const s = initializeState(2);
    expect(s.amplitudes.length).toBe(4);
    expect(probOf(s, 0)).toBeCloseTo(1); // |00⟩
  });
});

describe('Single-Qubit Gates', () => {
  it('X|0⟩ = |1⟩', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'X', 0);
    expect(probOf(s, 0)).toBeCloseTo(0);
    expect(probOf(s, 1)).toBeCloseTo(1);
  });

  it('X|1⟩ = |0⟩', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'X', 0);
    s = applySingleQubitGate(s, 'X', 0);
    expect(probOf(s, 0)).toBeCloseTo(1);
  });

  it('H|0⟩ = (|0⟩+|1⟩)/√2', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'H', 0);
    expect(probOf(s, 0)).toBeCloseTo(0.5);
    expect(probOf(s, 1)).toBeCloseTo(0.5);
    expect(ampOf(s, 0).re).toBeCloseTo(1 / Math.sqrt(2));
    expect(ampOf(s, 1).re).toBeCloseTo(1 / Math.sqrt(2));
  });

  it('H|1⟩ = (|0⟩-|1⟩)/√2', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'X', 0);
    s = applySingleQubitGate(s, 'H', 0);
    expect(ampOf(s, 0).re).toBeCloseTo(1 / Math.sqrt(2));
    expect(ampOf(s, 1).re).toBeCloseTo(-1 / Math.sqrt(2));
  });

  it('HH = I (Hadamard is self-inverse)', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'H', 0);
    s = applySingleQubitGate(s, 'H', 0);
    expect(probOf(s, 0)).toBeCloseTo(1);
    expect(probOf(s, 1)).toBeCloseTo(0);
  });

  it('Y|0⟩ = i|1⟩', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'Y', 0);
    expect(probOf(s, 0)).toBeCloseTo(0);
    expect(probOf(s, 1)).toBeCloseTo(1);
    expect(ampOf(s, 1).re).toBeCloseTo(0);
    expect(ampOf(s, 1).im).toBeCloseTo(1);
  });

  it('Z|0⟩ = |0⟩', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'Z', 0);
    expect(ampOf(s, 0).re).toBeCloseTo(1);
  });

  it('Z|1⟩ = -|1⟩', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'X', 0);
    s = applySingleQubitGate(s, 'Z', 0);
    expect(ampOf(s, 1).re).toBeCloseTo(-1);
  });

  it('S|1⟩ = i|1⟩', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'X', 0);
    s = applySingleQubitGate(s, 'S', 0);
    expect(ampOf(s, 1).re).toBeCloseTo(0);
    expect(ampOf(s, 1).im).toBeCloseTo(1);
  });

  it('T|1⟩ = e^(iπ/4)|1⟩', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'X', 0);
    s = applySingleQubitGate(s, 'T', 0);
    expect(ampOf(s, 1).re).toBeCloseTo(Math.cos(Math.PI / 4));
    expect(ampOf(s, 1).im).toBeCloseTo(Math.sin(Math.PI / 4));
  });

  it('Rx(π)|0⟩ = -i|1⟩', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'Rx', 0, Math.PI);
    expect(probOf(s, 0)).toBeCloseTo(0);
    expect(probOf(s, 1)).toBeCloseTo(1);
    expect(ampOf(s, 1).re).toBeCloseTo(0);
    expect(ampOf(s, 1).im).toBeCloseTo(-1);
  });

  it('Ry(π)|0⟩ = |1⟩', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'Ry', 0, Math.PI);
    expect(probOf(s, 0)).toBeCloseTo(0);
    expect(probOf(s, 1)).toBeCloseTo(1);
  });

  it('Rz(π)|0⟩ = e^(-iπ/2)|0⟩ = -i|0⟩', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'Rz', 0, Math.PI);
    expect(probOf(s, 0)).toBeCloseTo(1);
    expect(ampOf(s, 0).re).toBeCloseTo(0);
    expect(ampOf(s, 0).im).toBeCloseTo(-1);
  });
});

describe('Multi-Qubit Gates (2 qubits, MSB)', () => {
  // MSB: index 0=|00⟩, 1=|01⟩, 2=|10⟩, 3=|11⟩
  // q0 is MSB (bit position 1), q1 is LSB (bit position 0)

  it('CNOT(q0,q1)|10⟩ = |11⟩', () => {
    let s = initializeState(2);
    s = applySingleQubitGate(s, 'X', 0); // |10⟩
    s = applyCNOT(s, 0, 1);
    expect(probOf(s, 3)).toBeCloseTo(1); // |11⟩
  });

  it('CNOT(q0,q1)|00⟩ = |00⟩', () => {
    let s = initializeState(2);
    s = applyCNOT(s, 0, 1);
    expect(probOf(s, 0)).toBeCloseTo(1); // |00⟩
  });

  it('Bell state: H(q0) then CNOT(q0,q1) on |00⟩', () => {
    let s = initializeState(2);
    s = applySingleQubitGate(s, 'H', 0);
    s = applyCNOT(s, 0, 1);
    // Should be (|00⟩ + |11⟩)/√2
    expect(probOf(s, 0)).toBeCloseTo(0.5); // |00⟩
    expect(probOf(s, 1)).toBeCloseTo(0);   // |01⟩
    expect(probOf(s, 2)).toBeCloseTo(0);   // |10⟩
    expect(probOf(s, 3)).toBeCloseTo(0.5); // |11⟩
  });

  it('SWAP|01⟩ = |10⟩', () => {
    let s = initializeState(2);
    s = applySingleQubitGate(s, 'X', 1); // |01⟩
    s = applySWAP(s, 0, 1);
    expect(probOf(s, 2)).toBeCloseTo(1); // |10⟩
  });

  it('CZ|11⟩ = -|11⟩', () => {
    let s = initializeState(2);
    s = applySingleQubitGate(s, 'X', 0);
    s = applySingleQubitGate(s, 'X', 1); // |11⟩
    s = applyCZ(s, 0, 1);
    expect(ampOf(s, 3).re).toBeCloseTo(-1);
  });

  it('CZ|10⟩ = |10⟩ (no phase when target is 0)', () => {
    let s = initializeState(2);
    s = applySingleQubitGate(s, 'X', 0); // |10⟩
    s = applyCZ(s, 0, 1);
    expect(ampOf(s, 2).re).toBeCloseTo(1);
  });
});

describe('Toffoli (CCX) Gate', () => {
  it('CCX|110⟩ = |111⟩ (3 qubits)', () => {
    let s = initializeState(3);
    s = applySingleQubitGate(s, 'X', 0); // q0=1
    s = applySingleQubitGate(s, 'X', 1); // q1=1, state = |110⟩ = index 6
    s = applyToffoli(s, 0, 1, 2);
    expect(probOf(s, 7)).toBeCloseTo(1); // |111⟩
  });

  it('CCX|100⟩ = |100⟩ (only one control high)', () => {
    let s = initializeState(3);
    s = applySingleQubitGate(s, 'X', 0); // |100⟩ = index 4
    s = applyToffoli(s, 0, 1, 2);
    expect(probOf(s, 4)).toBeCloseTo(1); // unchanged
  });
});

describe('Normalization', () => {
  it('state remains normalized after all gate types', () => {
    let s = initializeState(3);
    s = applySingleQubitGate(s, 'H', 0);
    s = applySingleQubitGate(s, 'Ry', 1, 1.23);
    s = applyCNOT(s, 0, 1);
    s = applySingleQubitGate(s, 'T', 2);
    s = applyCZ(s, 1, 2);
    s = applySingleQubitGate(s, 'Rx', 0, 0.7);

    const totalProb = s.amplitudes.reduce((sum, a) => sum + magnitudeSquared(a), 0);
    expect(totalProb).toBeCloseTo(1, 8);
  });
});

describe('Multi-qubit targeting (qubit ordering)', () => {
  it('X on q1 of 2-qubit system: |00⟩ → |01⟩', () => {
    let s = initializeState(2);
    s = applySingleQubitGate(s, 'X', 1); // flip q1
    expect(probOf(s, 1)).toBeCloseTo(1); // |01⟩ = index 1
  });

  it('X on q0 of 2-qubit system: |00⟩ → |10⟩', () => {
    let s = initializeState(2);
    s = applySingleQubitGate(s, 'X', 0); // flip q0
    expect(probOf(s, 2)).toBeCloseTo(1); // |10⟩ = index 2
  });
});

describe('SX Gate (√X)', () => {
  it('SX|0⟩ = (1+i)/2 |0⟩ + (1-i)/2 |1⟩', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'SX', 0);
    expect(probOf(s, 0)).toBeCloseTo(0.5);
    expect(probOf(s, 1)).toBeCloseTo(0.5);
    expect(ampOf(s, 0).re).toBeCloseTo(0.5);
    expect(ampOf(s, 0).im).toBeCloseTo(0.5);
    expect(ampOf(s, 1).re).toBeCloseTo(0.5);
    expect(ampOf(s, 1).im).toBeCloseTo(-0.5);
  });
  it('SX * SX = X', () => {
    let s = initializeState(1);
    s = applySingleQubitGate(s, 'SX', 0);
    s = applySingleQubitGate(s, 'SX', 0);
    expect(probOf(s, 0)).toBeCloseTo(0);
    expect(probOf(s, 1)).toBeCloseTo(1);
  });
});
