import { describe, it, expect } from 'vitest';
import { simulateCircuitStabilizer } from '../stabilizer';
import { simulateCircuitDensityMatrix } from '../densityMatrix';
import { simulateCircuit } from '../simulator';
import { QuantumGate } from '../../types/quantum';

describe('New Backends Validation', () => {
  it('Stabilizer simulator handles H and CNOT correctly', () => {
    const gates: QuantumGate[] = [
      { id: '1', type: 'H', qubit: 0, position: 0 },
      { id: '2', type: 'CNOT', qubit: 0, targetQubit: 1, position: 1 },
    ];
    const stabilizerResult = simulateCircuitStabilizer(gates, 2);
    expect(stabilizerResult.isEntangled).toBe(true);
    expect(stabilizerResult.metadata?.backendName).toBe('stabilizer');
  });

  it('Density matrix simulator matches exact state probabilities for pure states', () => {
    const gates: QuantumGate[] = [
      { id: '1', type: 'H', qubit: 0, position: 0 },
      { id: '2', type: 'X', qubit: 1, position: 0 },
    ];
    const exact = simulateCircuit(gates, 2, 'MSB');
    const dm = simulateCircuitDensityMatrix(gates, 2);
    
    expect(dm.metadata?.backendName).toBe('density-matrix');
    expect(dm.probabilities.find(p => p.state === '01')?.probability).toBeCloseTo(0.5);
    expect(dm.probabilities.find(p => p.state === '11')?.probability).toBeCloseTo(0.5);
    expect(dm.probabilities.find(p => p.state === '00')?.probability).toBeCloseTo(0);
    expect(dm.probabilities.find(p => p.state === '10')?.probability).toBeCloseTo(0);
  });
});
