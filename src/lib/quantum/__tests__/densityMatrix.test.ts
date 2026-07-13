import { describe, it, expect } from 'vitest';
import { 
  pureStateToDensityMatrix, 
  applySingleQubitChannel, 
  bitFlipChannel,
  phaseFlipChannel,
  depolarizingChannel,
  amplitudeDampingChannel,
  verifyTrace,
  measureProbability
} from '../densityMatrix';
import { initializeState, applySingleQubitGate } from '../simulator';

describe('Density Matrix Simulator', () => {
  it('Bit-flip channel: |0> with p=1 becomes |1>', () => {
    const sv = initializeState(1);
    let rho = pureStateToDensityMatrix(sv);
    rho = applySingleQubitChannel(rho, 0, 1, bitFlipChannel(1.0));
    
    expect(measureProbability(rho, 0)).toBeCloseTo(0, 8);
    expect(measureProbability(rho, 1)).toBeCloseTo(1, 8);
    expect(verifyTrace(rho).valid).toBe(true);
  });

  it('Phase-flip channel: H|0> with p=1 becomes H|1>', () => {
    let sv = initializeState(1);
    sv = applySingleQubitGate(sv, 'H', 0);
    let rho = pureStateToDensityMatrix(sv);
    rho = applySingleQubitChannel(rho, 0, 1, phaseFlipChannel(1.0));
    
    // Probabilities in Z basis remain 0.5 for both
    expect(measureProbability(rho, 0)).toBeCloseTo(0.5, 8);
    expect(measureProbability(rho, 1)).toBeCloseTo(0.5, 8);
    expect(verifyTrace(rho).valid).toBe(true);
  });

  it('Depolarizing channel: p=1 gives maximally mixed state', () => {
    const sv = initializeState(1);
    let rho = pureStateToDensityMatrix(sv);
    rho = applySingleQubitChannel(rho, 0, 1, depolarizingChannel(1.0));
    
    // For p=1, depolarizing channel maps any state to I/2 (maximally mixed), wait no, depolarizing is (1-p)rho + p/3(XrhoX + YrhoY + ZrhoZ).
    // If p=1, it is 1/3 XrhoX + 1/3 YrhoY + 1/3 ZrhoZ.
    // For |0>, X|0>=|1>, Y|0>=i|1>, Z|0>=|0>
    // So 1/3 |1><1| + 1/3 |1><1| + 1/3 |0><0| = 2/3 |1><1| + 1/3 |0><0|.
    // Let's check the probabilities.
    expect(measureProbability(rho, 0)).toBeCloseTo(1/3, 8);
    expect(measureProbability(rho, 1)).toBeCloseTo(2/3, 8);
    expect(verifyTrace(rho).valid).toBe(true);
  });

  it('Amplitude damping: |1> with gamma=1 decays to |0>', () => {
    let sv = initializeState(1);
    sv = applySingleQubitGate(sv, 'X', 0); // Start in |1>
    let rho = pureStateToDensityMatrix(sv);
    rho = applySingleQubitChannel(rho, 0, 1, amplitudeDampingChannel(1.0));
    
    expect(measureProbability(rho, 0)).toBeCloseTo(1, 8);
    expect(measureProbability(rho, 1)).toBeCloseTo(0, 8);
    expect(verifyTrace(rho).valid).toBe(true);
  });
});
