/**
 * Density Matrix Quantum Simulation Engine
 * 
 * Mathematical foundation:
 * - Pure state:  ρ = |ψ⟩⟨ψ|
 * - Mixed state: ρ = Σₖ pₖ |ψₖ⟩⟨ψₖ|
 * - Properties:  ρ = ρ†  (Hermitian),  Tr(ρ) = 1,  ⟨x|ρ|x⟩ ≥ 0
 * - Evolution:   ρ' = UρU†
 * - Noise:       ρ → Σᵢ Kᵢ ρ Kᵢ†  with  Σᵢ Kᵢ†Kᵢ = I
 * - Measurement:  P(i) = Tr(Mᵢρ),  ρ → MᵢρMᵢ† / P(i)
 */

import { Complex, complex, ZERO, ONE, multiply, add, conjugate, magnitudeSquared, scale } from './complex';
import type { StateVector } from './simulator';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Dense density matrix ρ as a 2D complex array (2ⁿ × 2ⁿ) */
export type DensityMatrix = Complex[][];

/** A Kraus channel is a set of operators Kᵢ, each a 2D complex matrix */
export type KrausOperator = Complex[][];
export type KrausChannel = KrausOperator[];

/** Shot-based measurement result: basis state string → count */
export type ShotCounts = Record<string, number>;

/** Noise configuration for simulation */
export interface NoiseConfig {
  /** Bit-flip probability per gate */
  bitFlipProb?: number;
  /** Phase-flip probability per gate */
  phaseFlipProb?: number;
  /** Depolarizing probability per gate */
  depolarizingProb?: number;
  /** Amplitude damping rate (γ) */
  amplitudeDampingGamma?: number;
}

// ─── Matrix Utilities ────────────────────────────────────────────────────────

/** Create an n×n zero matrix */
function zeroMatrix(n: number): DensityMatrix {
  return Array.from({ length: n }, () =>
    Array.from({ length: n }, () => ({ ...ZERO }))
  );
}

/** Create an n×n identity matrix */
function identityMatrix(n: number): DensityMatrix {
  const m = zeroMatrix(n);
  for (let i = 0; i < n; i++) m[i][i] = { ...ONE };
  return m;
}

/** Matrix multiplication: C = A × B */
function matMul(A: Complex[][], B: Complex[][]): Complex[][] {
  const n = A.length;
  const m = B[0].length;
  const p = B.length;
  const C = zeroMatrix(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      let sum: Complex = { re: 0, im: 0 };
      for (let k = 0; k < p; k++) {
        sum = add(sum, multiply(A[i][k], B[k][j]));
      }
      C[i][j] = sum;
    }
  }
  return C;
}

/** Conjugate transpose (dagger): M† */
function dagger(M: Complex[][]): Complex[][] {
  const n = M.length;
  const m = M[0].length;
  const result: Complex[][] = Array.from({ length: m }, () =>
    Array.from({ length: n }, () => ({ ...ZERO }))
  );
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      result[j][i] = conjugate(M[i][j]);
    }
  }
  return result;
}

/** Add two matrices: C = A + B */
function matAdd(A: Complex[][], B: Complex[][]): Complex[][] {
  const n = A.length;
  return A.map((row, i) => row.map((val, j) => add(val, B[i][j])));
}

/** Scale a matrix by a real scalar */
function matScale(M: Complex[][], s: number): Complex[][] {
  return M.map(row => row.map(val => scale(val, s)));
}

/** Trace of a matrix: Tr(M) */
function trace(M: Complex[][]): Complex {
  let sum: Complex = { re: 0, im: 0 };
  for (let i = 0; i < M.length; i++) {
    sum = add(sum, M[i][i]);
  }
  return sum;
}

// ─── Core Density Matrix Operations ──────────────────────────────────────────

/**
 * Convert a pure state |ψ⟩ to its density matrix ρ = |ψ⟩⟨ψ|
 * 
 * ρᵢⱼ = αᵢ · αⱼ*
 */
export function pureStateToDensityMatrix(sv: StateVector): DensityMatrix {
  const n = sv.amplitudes.length;
  const rho = zeroMatrix(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      rho[i][j] = multiply(sv.amplitudes[i], conjugate(sv.amplitudes[j]));
    }
  }
  return rho;
}

/**
 * Build a mixed-state density matrix from an ensemble
 * ρ = Σₖ pₖ |ψₖ⟩⟨ψₖ|
 */
export function mixedState(
  ensemble: { state: StateVector; probability: number }[]
): DensityMatrix {
  if (ensemble.length === 0) throw new Error('Empty ensemble');
  const dim = ensemble[0].state.amplitudes.length;
  let rho = zeroMatrix(dim);

  for (const { state, probability } of ensemble) {
    const rhoK = pureStateToDensityMatrix(state);
    rho = matAdd(rho, matScale(rhoK, probability));
  }
  return rho;
}

/**
 * Apply unitary evolution: ρ' = UρU†
 */
export function applyUnitary(rho: DensityMatrix, U: Complex[][]): DensityMatrix {
  const Udagger = dagger(U);
  return matMul(matMul(U, rho), Udagger);
}

/**
 * Apply a Kraus channel: ρ → Σᵢ Kᵢ ρ Kᵢ†
 * 
 * Constraint: Σᵢ Kᵢ†Kᵢ = I (trace-preserving)
 */
export function applyKrausChannel(rho: DensityMatrix, channel: KrausChannel): DensityMatrix {
  const dim = rho.length;
  let result = zeroMatrix(dim);

  for (const K of channel) {
    const Kdagger = dagger(K);
    const term = matMul(matMul(K, rho), Kdagger);
    result = matAdd(result, term);
  }
  return result;
}

// ─── Physical Property Checks ────────────────────────────────────────────────

/**
 * Verify Tr(ρ) = 1 (within tolerance)
 */
export function verifyTrace(rho: DensityMatrix, tol = 1e-8): { valid: boolean; trace: number } {
  const t = trace(rho);
  return { valid: Math.abs(t.re - 1) < tol && Math.abs(t.im) < tol, trace: t.re };
}

/**
 * Check if ρ is Hermitian: ρ = ρ†
 */
export function isHermitian(rho: DensityMatrix, tol = 1e-8): boolean {
  const n = rho.length;
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const diff_re = Math.abs(rho[i][j].re - rho[j][i].re);
      const diff_im = Math.abs(rho[i][j].im + rho[j][i].im);
      if (diff_re > tol || diff_im > tol) return false;
    }
  }
  return true;
}

/**
 * Check positive semi-definiteness by verifying all diagonal elements ≥ 0
 * (necessary condition; full eigenvalue check is O(n³) and expensive)
 */
export function isPositiveSemiDefinite(rho: DensityMatrix, tol = 1e-10): boolean {
  for (let i = 0; i < rho.length; i++) {
    if (rho[i][i].re < -tol) return false;
    if (Math.abs(rho[i][i].im) > tol) return false;
  }
  return true;
}

/**
 * Compute the purity: Tr(ρ²)
 * Pure state: Tr(ρ²) = 1
 * Maximally mixed: Tr(ρ²) = 1/d
 */
export function purity(rho: DensityMatrix): number {
  const rhoSq = matMul(rho, rho);
  return trace(rhoSq).re;
}

/**
 * Von Neumann entropy: S(ρ) = -Tr(ρ log₂ ρ)
 * Approximated using S ≈ -Σᵢ ρᵢᵢ log₂(ρᵢᵢ) for diagonal-dominant matrices
 */
export function vonNeumannEntropy(rho: DensityMatrix): number {
  let S = 0;
  for (let i = 0; i < rho.length; i++) {
    const p = rho[i][i].re;
    if (p > 1e-15) {
      S -= p * Math.log2(p);
    }
  }
  return S;
}

// ─── Measurement ─────────────────────────────────────────────────────────────

/**
 * Measurement probability for computational basis state |i⟩
 * P(i) = ⟨i|ρ|i⟩ = ρᵢᵢ
 */
export function measureProbability(rho: DensityMatrix, i: number): number {
  return rho[i][i].re;
}

/**
 * Get all measurement probabilities
 * P(i) = ρᵢᵢ for all i
 */
export function allProbabilities(rho: DensityMatrix): number[] {
  return rho.map((_, i) => rho[i][i].re);
}

/**
 * Post-measurement state after measuring outcome |i⟩
 * ρ → Mᵢ ρ Mᵢ† / P(i)
 * where Mᵢ = |i⟩⟨i| is the projector
 */
export function postMeasurementState(rho: DensityMatrix, outcome: number): DensityMatrix {
  const dim = rho.length;
  const prob = measureProbability(rho, outcome);
  if (prob < 1e-15) throw new Error(`Cannot measure outcome ${outcome}: probability ≈ 0`);

  // Build projector Mᵢ = |i⟩⟨i|
  const M = zeroMatrix(dim);
  M[outcome][outcome] = { ...ONE };

  // ρ' = M ρ M† / P(i)  — since M is a projector, M† = M
  const projected = matMul(matMul(M, rho), M);
  return matScale(projected, 1 / prob);
}

// ─── Noise Channels (Kraus Operators) ────────────────────────────────────────

/**
 * Bit-flip channel on a single qubit
 * K₀ = √(1−p) I,  K₁ = √p X
 * 
 * Flips |0⟩↔|1⟩ with probability p
 */
export function bitFlipChannel(p: number): KrausChannel {
  const s0 = Math.sqrt(1 - p);
  const s1 = Math.sqrt(p);
  return [
    // K₀ = √(1-p) · I
    [[complex(s0), { ...ZERO }], [{ ...ZERO }, complex(s0)]],
    // K₁ = √p · X
    [[{ ...ZERO }, complex(s1)], [complex(s1), { ...ZERO }]],
  ];
}

/**
 * Phase-flip channel on a single qubit
 * K₀ = √(1−p) I,  K₁ = √p Z
 * 
 * Applies Z (phase flip) with probability p
 */
export function phaseFlipChannel(p: number): KrausChannel {
  const s0 = Math.sqrt(1 - p);
  const s1 = Math.sqrt(p);
  return [
    // K₀ = √(1-p) · I
    [[complex(s0), { ...ZERO }], [{ ...ZERO }, complex(s0)]],
    // K₁ = √p · Z
    [[complex(s1), { ...ZERO }], [{ ...ZERO }, complex(-s1)]],
  ];
}

/**
 * Depolarizing channel on a single qubit
 * ρ → (1−p)ρ + (p/3)(XρX + YρY + ZρZ)
 * 
 * Equivalent Kraus: K₀ = √(1−p)I, K₁ = √(p/3)X, K₂ = √(p/3)Y, K₃ = √(p/3)Z
 */
export function depolarizingChannel(p: number): KrausChannel {
  const s0 = Math.sqrt(1 - p);
  const s1 = Math.sqrt(p / 3);
  return [
    // K₀ = √(1-p) · I
    [[complex(s0), { ...ZERO }], [{ ...ZERO }, complex(s0)]],
    // K₁ = √(p/3) · X
    [[{ ...ZERO }, complex(s1)], [complex(s1), { ...ZERO }]],
    // K₂ = √(p/3) · Y
    [[{ ...ZERO }, complex(0, -s1)], [complex(0, s1), { ...ZERO }]],
    // K₃ = √(p/3) · Z
    [[complex(s1), { ...ZERO }], [{ ...ZERO }, complex(-s1)]],
  ];
}

/**
 * Amplitude damping channel
 * Models energy dissipation (T₁ relaxation)
 * 
 * K₀ = [[1, 0], [0, √(1−γ)]]
 * K₁ = [[0, √γ], [0, 0]]
 * 
 * γ = probability of |1⟩ → |0⟩ decay
 */
export function amplitudeDampingChannel(gamma: number): KrausChannel {
  const sg = Math.sqrt(gamma);
  const s1g = Math.sqrt(1 - gamma);
  return [
    // K₀
    [[{ ...ONE }, { ...ZERO }], [{ ...ZERO }, complex(s1g)]],
    // K₁
    [[{ ...ZERO }, complex(sg)], [{ ...ZERO }, { ...ZERO }]],
  ];
}

/**
 * Apply a single-qubit Kraus channel to a specific qubit in an n-qubit density matrix.
 * Lifts the 2×2 Kraus operators to 2ⁿ×2ⁿ via tensor product with identity on other qubits.
 */
export function applySingleQubitChannel(
  rho: DensityMatrix,
  qubit: number,
  qubitCount: number,
  channel: KrausChannel
): DensityMatrix {
  const dim = rho.length;
  let result = zeroMatrix(dim);
  const bitPos = qubitCount - 1 - qubit;

  for (const K of channel) {
    const newRho = zeroMatrix(dim);
    // Apply K ⊗ I to ρ, then (K ⊗ I)†
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        // Extract the target qubit bits
        const qi = (i >> bitPos) & 1;
        const qj = (j >> bitPos) & 1;

        // Sum over the 2×2 Kraus action on the target qubit
        for (let ki = 0; ki < 2; ki++) {
          for (let kj = 0; kj < 2; kj++) {
            // Construct the full indices
            const iNew = (i & ~(1 << bitPos)) | (ki << bitPos);
            const jNew = (j & ~(1 << bitPos)) | (kj << bitPos);

            // K[ki][qi] * rho[iNew][jNew] * conj(K[kj][qj])
            const elem = multiply(
              multiply(K[ki][qi], rho[iNew][jNew]),
              conjugate(K[kj][qj])
            );
            newRho[i][j] = add(newRho[i][j], elem);
          }
        }
      }
    }
    result = matAdd(result, newRho);
  }
  return result;
}

/**
 * Apply a two-qubit Kraus channel to a specific pair of qubits in an n-qubit density matrix.
 * Channel operators should be 4x4.
 */
export function applyTwoQubitChannel(
  rho: DensityMatrix,
  q1: number,
  q2: number,
  qubitCount: number,
  channel: KrausChannel // operators are 4x4
): DensityMatrix {
  const dim = rho.length;
  let result = zeroMatrix(dim);
  const bitPos1 = qubitCount - 1 - q1;
  const bitPos2 = qubitCount - 1 - q2;

  for (const K of channel) {
    const newRho = zeroMatrix(dim);
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        const qi1 = (i >> bitPos1) & 1;
        const qi2 = (i >> bitPos2) & 1;
        const qj1 = (j >> bitPos1) & 1;
        const qj2 = (j >> bitPos2) & 1;
        
        const q_i = (qi1 << 1) | qi2;
        const q_j = (qj1 << 1) | qj2;

        for (let ki = 0; ki < 4; ki++) {
          for (let kj = 0; kj < 4; kj++) {
            const ki1 = (ki >> 1) & 1;
            const ki2 = ki & 1;
            const kj1 = (kj >> 1) & 1;
            const kj2 = kj & 1;

            const iNew = (i & ~(1 << bitPos1) & ~(1 << bitPos2)) | (ki1 << bitPos1) | (ki2 << bitPos2);
            const jNew = (j & ~(1 << bitPos1) & ~(1 << bitPos2)) | (kj1 << bitPos1) | (kj2 << bitPos2);

            const elem = multiply(
              multiply(K[ki][q_i], rho[iNew][jNew]),
              conjugate(K[kj][q_j])
            );
            newRho[i][j] = add(newRho[i][j], elem);
          }
        }
      }
    }
    result = matAdd(result, newRho);
  }
  return result;
}

// ─── Shot-Based Sampling ─────────────────────────────────────────────────────

/**
 * Sample measurement outcomes from a statevector
 * P(i) = |αᵢ|²
 * 
 * Uses the inverse CDF method for efficient sampling
 */
export function sampleFromStatevector(
  sv: StateVector,
  shots: number
): ShotCounts {
  const probs = sv.amplitudes.map(a => magnitudeSquared(a));
  return sampleFromDistribution(probs, sv.qubitCount, shots);
}

/**
 * Sample measurement outcomes from a density matrix
 * P(i) = ρᵢᵢ (diagonal elements)
 */
export function sampleFromDensityMatrix(
  rho: DensityMatrix,
  qubitCount: number,
  shots: number
): ShotCounts {
  const probs = rho.map((_, i) => rho[i][i].re);
  return sampleFromDistribution(probs, qubitCount, shots);
}

/**
 * Core sampling: draw `shots` outcomes from a probability distribution
 * Uses cumulative distribution function for O(n log n) sampling
 */
function sampleFromDistribution(
  probs: number[],
  qubitCount: number,
  shots: number
): ShotCounts {
  // Build cumulative distribution
  const cdf: number[] = [];
  let cumSum = 0;
  for (let i = 0; i < probs.length; i++) {
    cumSum += Math.max(0, probs[i]);
    cdf.push(cumSum);
  }
  // Normalize (numerical stability)
  if (cumSum > 0) {
    for (let i = 0; i < cdf.length; i++) cdf[i] /= cumSum;
  }

  const counts: ShotCounts = {};

  for (let s = 0; s < shots; s++) {
    const r = Math.random();
    // Binary search for the outcome
    let lo = 0, hi = cdf.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    const basisState = `|${lo.toString(2).padStart(qubitCount, '0')}⟩`;
    counts[basisState] = (counts[basisState] || 0) + 1;
  }

  return counts;
}

// ─── Convenience: Full Density Matrix Simulation ─────────────────────────────

export interface DensityMatrixResult {
  densityMatrix: DensityMatrix;
  probabilities: number[];
  purity: number;
  entropy: number;
  isHermitian: boolean;
  traceValue: number;
  shotCounts?: ShotCounts;
}

/**
 * Run a full density matrix analysis on a statevector
 * Optionally applies noise and samples shots
 */
export function analyzeDensityMatrix(
  sv: StateVector,
  noise?: NoiseConfig,
  shots?: number
): DensityMatrixResult {
  let rho = pureStateToDensityMatrix(sv);

  // Apply noise channels if configured
  if (noise) {
    for (let q = 0; q < sv.qubitCount; q++) {
      if (noise.bitFlipProb && noise.bitFlipProb > 0) {
        rho = applySingleQubitChannel(rho, q, sv.qubitCount, bitFlipChannel(noise.bitFlipProb));
      }
      if (noise.phaseFlipProb && noise.phaseFlipProb > 0) {
        rho = applySingleQubitChannel(rho, q, sv.qubitCount, phaseFlipChannel(noise.phaseFlipProb));
      }
      if (noise.depolarizingProb && noise.depolarizingProb > 0) {
        rho = applySingleQubitChannel(rho, q, sv.qubitCount, depolarizingChannel(noise.depolarizingProb));
      }
      if (noise.amplitudeDampingGamma && noise.amplitudeDampingGamma > 0) {
        rho = applySingleQubitChannel(rho, q, sv.qubitCount, amplitudeDampingChannel(noise.amplitudeDampingGamma));
      }
    }
  }

  const probs = allProbabilities(rho);
  const { trace: traceVal } = verifyTrace(rho);

  const result: DensityMatrixResult = {
    densityMatrix: rho,
    probabilities: probs,
    purity: purity(rho),
    entropy: vonNeumannEntropy(rho),
    isHermitian: isHermitian(rho),
    traceValue: traceVal,
  };

  if (shots && shots > 0) {
    result.shotCounts = sampleFromDensityMatrix(rho, sv.qubitCount, shots);
  }

  return result;
}

// ─── Noisy Simulator Execution ───────────────────────────────────────────────

import type { QuantumGate, SimulationOutput } from './simulator';
import { getGateMatrix } from './gates';
import { initializeState, calculateCircuitDepth, hasMeasurementGate } from './simulator';

/**
 * Executes a circuit gate-by-gate on the density matrix, allowing noise simulation.
 */
export function simulateCircuitDensityMatrix(
  gates: QuantumGate[],
  qubitCount: number,
  noise?: NoiseConfig
): SimulationOutput & { densityMatrix: DensityMatrix } {
  const sv = initializeState(qubitCount);
  let rho = pureStateToDensityMatrix(sv);

  const sortedGates = [...gates].sort((a, b) => a.position - b.position);

  // Helper to build 4x4 unitary for 2-qubit gates (controlled-U or SWAP)
  const get2QubitMatrix = (type: string, angle?: number): Complex[][] => {
    // simplified hardcodes for CNOT, CZ, SWAP
    const I2 = [[{...ONE}, {...ZERO}], [{...ZERO}, {...ONE}]];
    const Z2 = [[{...ONE}, {...ZERO}], [{...ZERO}, complex(-1)]];
    const X2 = [[{...ZERO}, {...ONE}], [{...ONE}, {...ZERO}]];
    
    if (type === 'CNOT') {
      return [
        [{...ONE}, {...ZERO}, {...ZERO}, {...ZERO}],
        [{...ZERO}, {...ONE}, {...ZERO}, {...ZERO}],
        [{...ZERO}, {...ZERO}, {...ZERO}, {...ONE}],
        [{...ZERO}, {...ZERO}, {...ONE}, {...ZERO}],
      ];
    }
    if (type === 'CZ') {
      return [
        [{...ONE}, {...ZERO}, {...ZERO}, {...ZERO}],
        [{...ZERO}, {...ONE}, {...ZERO}, {...ZERO}],
        [{...ZERO}, {...ZERO}, {...ONE}, {...ZERO}],
        [{...ZERO}, {...ZERO}, {...ZERO}, complex(-1)],
      ];
    }
    if (type === 'SWAP') {
      return [
        [{...ONE}, {...ZERO}, {...ZERO}, {...ZERO}],
        [{...ZERO}, {...ZERO}, {...ONE}, {...ZERO}],
        [{...ZERO}, {...ONE}, {...ZERO}, {...ZERO}],
        [{...ZERO}, {...ZERO}, {...ZERO}, {...ONE}],
      ];
    }
    // Fallback identity
    return [
      [{...ONE}, {...ZERO}, {...ZERO}, {...ZERO}],
      [{...ZERO}, {...ONE}, {...ZERO}, {...ZERO}],
      [{...ZERO}, {...ZERO}, {...ONE}, {...ZERO}],
      [{...ZERO}, {...ZERO}, {...ZERO}, {...ONE}],
    ];
  };

  const applyNoise = (q: number) => {
    if (!noise) return;
    if (noise.bitFlipProb) rho = applySingleQubitChannel(rho, q, qubitCount, bitFlipChannel(noise.bitFlipProb));
    if (noise.phaseFlipProb) rho = applySingleQubitChannel(rho, q, qubitCount, phaseFlipChannel(noise.phaseFlipProb));
    if (noise.depolarizingProb) rho = applySingleQubitChannel(rho, q, qubitCount, depolarizingChannel(noise.depolarizingProb));
    if (noise.amplitudeDampingGamma) rho = applySingleQubitChannel(rho, q, qubitCount, amplitudeDampingChannel(noise.amplitudeDampingGamma));
  };

  for (const gate of sortedGates) {
    if (gate.type === 'M') {
      // For measurement, we don't collapse in density matrix simulation by default unless it's a specific noisy measurement
      continue;
    }

    if (['CNOT', 'CZ', 'SWAP'].includes(gate.type)) {
      const q1 = gate.qubit;
      const q2 = gate.targetQubit ?? (q1 + 1) % qubitCount;
      const U = get2QubitMatrix(gate.type, gate.angle);
      
      // The matrix gets applied correctly if q1 is control and q2 is target.
      // If q1 > q2, we need SWAP logic, but here we assume ordered for simplicity.
      // In a full implementation, we'd swap them.
      if (q1 < q2) {
        rho = applyTwoQubitChannel(rho, q1, q2, qubitCount, [U]);
      } else {
        const swap = get2QubitMatrix('SWAP');
        rho = applyTwoQubitChannel(rho, q2, q1, qubitCount, [swap]);
        rho = applyTwoQubitChannel(rho, q2, q1, qubitCount, [U]);
        rho = applyTwoQubitChannel(rho, q2, q1, qubitCount, [swap]);
      }
      applyNoise(q1);
      applyNoise(q2);
    } else {
      const U = getGateMatrix(gate.type, gate.angle);
      rho = applySingleQubitChannel(rho, gate.qubit, qubitCount, [U]);
      applyNoise(gate.qubit);
    }
  }

  const probs = allProbabilities(rho);
  const probabilities = probs.map((p, i) => ({
    state: i.toString(2).padStart(qubitCount, '0'),
    probability: Math.max(0, p), // Floating point safety
  }));

  return {
    probabilities,
    blochVectors: [], // Not extracted for mixed states here by default
    stateVector: { amplitudes: [], qubitCount }, // Can't map mixed to pure
    isEntangled: false, // Could compute negativity, but default false
    entangledPairs: [],
    amplitudes: [], // Only probs make sense for mixed states
    circuitDepth: calculateCircuitDepth(gates),
    hasMeasurement: hasMeasurementGate(gates),
    densityMatrix: rho,
    metadata: {
      top1000Mass: probs.reduce((a, b) => a + b, 0),
      isSampled: false,
      isExact: true,
      backendName: 'density-matrix'
    }
  };
}
