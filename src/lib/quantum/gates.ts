/**
 * Quantum gate matrices using complex numbers
 */

import { Complex, complex, ZERO, ONE, scale, multiply, add } from './complex';

// Type for 2x2 gate matrix
export type GateMatrix = [[Complex, Complex], [Complex, Complex]];

// Common constants
const SQRT2_INV = 1 / Math.sqrt(2);
const PI = Math.PI;

/**
 * Identity gate - does nothing
 * |0⟩ → |0⟩, |1⟩ → |1⟩
 */
export const I_GATE: GateMatrix = [
  [ONE, ZERO],
  [ZERO, ONE]
];

/**
 * Hadamard gate - creates superposition
 * |0⟩ → (|0⟩ + |1⟩)/√2
 * |1⟩ → (|0⟩ - |1⟩)/√2
 */
export const H_GATE: GateMatrix = [
  [complex(SQRT2_INV), complex(SQRT2_INV)],
  [complex(SQRT2_INV), complex(-SQRT2_INV)]
];

/**
 * Pauli-X gate (NOT gate) - bit flip
 * |0⟩ → |1⟩, |1⟩ → |0⟩
 */
export const X_GATE: GateMatrix = [
  [ZERO, ONE],
  [ONE, ZERO]
];

/**
 * Pauli-Y gate - combined bit and phase flip
 * |0⟩ → i|1⟩, |1⟩ → -i|0⟩
 */
export const Y_GATE: GateMatrix = [
  [ZERO, complex(0, -1)],
  [complex(0, 1), ZERO]
];

/**
 * Pauli-Z gate - phase flip
 * |0⟩ → |0⟩, |1⟩ → -|1⟩
 */
export const Z_GATE: GateMatrix = [
  [ONE, ZERO],
  [ZERO, complex(-1)]
];

/**
 * S gate (Phase gate) - π/2 phase shift
 * |0⟩ → |0⟩, |1⟩ → i|1⟩
 */
export const S_GATE: GateMatrix = [
  [ONE, ZERO],
  [ZERO, complex(0, 1)]
];

/**
 * T gate - π/4 phase shift
 * |0⟩ → |0⟩, |1⟩ → e^(iπ/4)|1⟩
 */
export const T_GATE: GateMatrix = [
  [ONE, ZERO],
  [ZERO, complex(Math.cos(PI/4), Math.sin(PI/4))]
];

/**
 * Get gate matrix by type
 */
export const getGateMatrix = (gateType: string): GateMatrix => {
  switch (gateType) {
    case 'H': return H_GATE;
    case 'X': return X_GATE;
    case 'Y': return Y_GATE;
    case 'Z': return Z_GATE;
    case 'S': return S_GATE;
    default: return I_GATE;
  }
};

/**
 * Apply a 2x2 gate matrix to a single qubit state [α, β]
 * Returns new amplitudes [α', β']
 */
export const applyGateToQubit = (
  gate: GateMatrix,
  state: [Complex, Complex]
): [Complex, Complex] => {
  const [alpha, beta] = state;
  
  // Matrix multiplication: M * |ψ⟩
  const newAlpha = add(
    multiply(gate[0][0], alpha),
    multiply(gate[0][1], beta)
  );
  const newBeta = add(
    multiply(gate[1][0], alpha),
    multiply(gate[1][1], beta)
  );
  
  return [newAlpha, newBeta];
};

/**
 * Calculate Bloch sphere coordinates from qubit state
 * For state α|0⟩ + β|1⟩:
 * x = 2*Re(α*conj(β))
 * y = 2*Im(α*conj(β))
 * z = |α|² - |β|²
 */
export const stateToBlochVector = (
  alpha: Complex, 
  beta: Complex
): { x: number; y: number; z: number } => {
  // α*conj(β)
  const product = multiply(alpha, { re: beta.re, im: -beta.im });
  
  const x = 2 * product.re;
  const y = 2 * product.im;
  const z = (alpha.re * alpha.re + alpha.im * alpha.im) - 
            (beta.re * beta.re + beta.im * beta.im);
  
  return { x, y, z };
};
