import { describe, it, expect } from 'vitest';
import { complex, add, multiply, magnitudeSquared, scale, conjugate } from '@/lib/quantum/complex';
import { H_GATE, X_GATE, Z_GATE, applyGateToQubit, stateToBlochVector } from '@/lib/quantum/gates';
import { initializeState, applySingleQubitGate, applyCNOT, simulateCircuit, calculateProbabilities, detectEntanglement } from '@/lib/quantum/simulator';

describe('Complex number operations', () => {
  it('should add complex numbers correctly', () => {
    const a = complex(1, 2);
    const b = complex(3, 4);
    const result = add(a, b);
    expect(result.re).toBe(4);
    expect(result.im).toBe(6);
  });

  it('should multiply complex numbers correctly', () => {
    const a = complex(1, 2); // 1 + 2i
    const b = complex(3, 4); // 3 + 4i
    // (1+2i)(3+4i) = 3 + 4i + 6i + 8i² = 3 + 10i - 8 = -5 + 10i
    const result = multiply(a, b);
    expect(result.re).toBe(-5);
    expect(result.im).toBe(10);
  });

  it('should calculate magnitude squared correctly', () => {
    const c = complex(3, 4); // |3+4i|² = 9 + 16 = 25
    expect(magnitudeSquared(c)).toBe(25);
  });
});

describe('Quantum gates', () => {
  it('should apply X gate (bit flip) correctly', () => {
    // |0⟩ -> |1⟩
    const zero: [typeof complex extends (re: number, im?: number) => infer R ? R : never, typeof complex extends (re: number, im?: number) => infer R ? R : never] = [complex(1), complex(0)];
    const result = applyGateToQubit(X_GATE, zero);
    expect(magnitudeSquared(result[0])).toBeCloseTo(0);
    expect(magnitudeSquared(result[1])).toBeCloseTo(1);
  });

  it('should apply Hadamard gate correctly', () => {
    // H|0⟩ = (|0⟩ + |1⟩)/√2
    const zero: [typeof complex extends (re: number, im?: number) => infer R ? R : never, typeof complex extends (re: number, im?: number) => infer R ? R : never] = [complex(1), complex(0)];
    const result = applyGateToQubit(H_GATE, zero);
    // Both amplitudes should have probability 0.5
    expect(magnitudeSquared(result[0])).toBeCloseTo(0.5);
    expect(magnitudeSquared(result[1])).toBeCloseTo(0.5);
  });
});

describe('Quantum circuit simulation', () => {
  it('should initialize to |00000⟩ state', () => {
    const state = initializeState(5);
    expect(state.amplitudes.length).toBe(32); // 2^5 = 32 states
    expect(magnitudeSquared(state.amplitudes[0])).toBe(1); // |00000⟩ has amplitude 1
    expect(magnitudeSquared(state.amplitudes[1])).toBe(0);
  });

  it('should apply X gate to flip qubit', () => {
    const state = initializeState(2); // |00⟩
    const afterX = applySingleQubitGate(state, 'X', 0); // X on q0 -> |10⟩
    
    const probs = calculateProbabilities(afterX);
    expect(probs.length).toBe(1);
    expect(probs[0].state).toBe('|10⟩');
    expect(probs[0].probability).toBeCloseTo(1);
  });

  it('should create superposition with Hadamard', () => {
    const state = initializeState(1); // |0⟩
    const afterH = applySingleQubitGate(state, 'H', 0); // H|0⟩ = (|0⟩+|1⟩)/√2
    
    const probs = calculateProbabilities(afterH);
    expect(probs.length).toBe(2);
    expect(probs[0].probability).toBeCloseTo(0.5);
    expect(probs[1].probability).toBeCloseTo(0.5);
  });

  it('should simulate a complete circuit', () => {
    const gates = [
      { id: '1', type: 'H' as const, qubit: 0, position: 0 },
      { id: '2', type: 'X' as const, qubit: 1, position: 0 },
    ];
    
    const result = simulateCircuit(gates, 2);
    
    // After H on q0 and X on q1:
    // |00⟩ -> (|00⟩ + |10⟩)/√2 -> (|01⟩ + |11⟩)/√2
    expect(result.probabilities.length).toBe(2);
    const states = result.probabilities.map(p => p.state);
    expect(states).toContain('|01⟩');
    expect(states).toContain('|11⟩');
  });
});

describe('CNOT and Entanglement', () => {
  it('should apply CNOT gate correctly', () => {
    let state = initializeState(2);
    // Set to |10⟩ first
    state = applySingleQubitGate(state, 'X', 0);
    // Apply CNOT with q0 as control, q1 as target
    state = applyCNOT(state, 0, 1);
    
    // |10⟩ with CNOT(0,1) should give |11⟩
    const probs = calculateProbabilities(state);
    expect(probs.length).toBe(1);
    expect(probs[0].state).toBe('|11⟩');
    expect(probs[0].probability).toBeCloseTo(1);
  });

  it('should not flip target when control is |0⟩', () => {
    let state = initializeState(2); // |00⟩
    state = applyCNOT(state, 0, 1); // CNOT with control=0
    
    // Should still be |00⟩ since control is |0⟩
    const probs = calculateProbabilities(state);
    expect(probs.length).toBe(1);
    expect(probs[0].state).toBe('|00⟩');
  });

  it('should create Bell state |00⟩ + |11⟩', () => {
    // H on q0, then CNOT(q0, q1)
    const gates = [
      { id: '1', type: 'H' as const, qubit: 0, position: 0 },
      { id: '2', type: 'CNOT' as const, qubit: 0, position: 1, targetQubit: 1 },
    ];
    
    const result = simulateCircuit(gates, 2);
    
    // Should be 50% |00⟩ and 50% |11⟩
    expect(result.probabilities.length).toBe(2);
    
    const prob00 = result.probabilities.find(p => p.state === '|00⟩');
    const prob11 = result.probabilities.find(p => p.state === '|11⟩');
    
    expect(prob00).toBeDefined();
    expect(prob11).toBeDefined();
    expect(prob00!.probability).toBeCloseTo(0.5);
    expect(prob11!.probability).toBeCloseTo(0.5);
    
    // Should detect entanglement
    expect(result.isEntangled).toBe(true);
    expect(result.entangledPairs).toContainEqual([0, 1]);
  });

  it('should not detect entanglement in separable states', () => {
    // Just H on q0 - no entanglement
    const gates = [
      { id: '1', type: 'H' as const, qubit: 0, position: 0 },
    ];
    
    const result = simulateCircuit(gates, 2);
    
    // Superposition but no entanglement
    expect(result.isEntangled).toBe(false);
    expect(result.entangledPairs).toHaveLength(0);
  });
});
