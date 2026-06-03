/**
 * ============================================================
 * SPARSE STATE VECTOR ENGINE
 * ============================================================
 * Implements a hash-map based sparse state vector for quantum
 * simulation. Instead of allocating 2^n complex amplitudes,
 * only non-zero amplitudes are stored.
 *
 * Critical for:
 * - VQE ansatz states (typically sparse in computational basis)
 * - QAOA (combinatorial optimization states)
 * - Chemistry simulations with conserved particle number
 *
 * Memory: O(k) where k = number of non-zero amplitudes
 * Gate application: O(k) per gate instead of O(2^n)
 * ============================================================
 */

import { Complex, ZERO, ONE, multiply, add, magnitudeSquared } from '../complex';
import { getGateMatrix, GateMatrix } from '../gates';
import { BitOrder, getBitPosition, formatBasisStateLabel } from '../bitOrder';

// ─── Sparse State Type ──────────────────────────────────────

/**
 * A sparse quantum state vector.
 * Uses a Map<bigint, Complex> where key = basis state index.
 * Only entries with |amplitude|² > threshold are retained.
 */
export interface SparseStateVector {
  amplitudes: Map<bigint, Complex>;
  qubitCount: number;
  /** Sparsity threshold — amplitudes below this are pruned */
  pruneThreshold: number;
}

export interface SparseSimulationResult {
  probabilities: { state: string; probability: number }[];
  blochVectors: { x: number; y: number; z: number }[];
  stateVector: SparseStateVector;
  amplitudes: { state: string; re: number; im: number; magnitude: number; phase: number }[];
  circuitDepth: number;
  hasMeasurement: boolean;
  sparsity: number; // fraction of non-zero amplitudes
  memoryUsedBytes: number;
}

// ─── Configuration ──────────────────────────────────────────

export interface SparseConfig {
  /** Amplitudes with |a|² < this are pruned after each gate */
  pruneThreshold: number;
  /** Maximum number of non-zero amplitudes before forced pruning */
  maxNonZero: number;
  /** Whether to use adaptive pruning (increases threshold under pressure) */
  adaptivePruning: boolean;
}

export const DEFAULT_SPARSE_CONFIG: SparseConfig = {
  pruneThreshold: 1e-14,
  maxNonZero: 1_000_000,
  adaptivePruning: true,
};

export const CHEMISTRY_SPARSE_CONFIG: SparseConfig = {
  pruneThreshold: 1e-16, // higher precision for chemistry
  maxNonZero: 2_000_000,
  adaptivePruning: true,
};

// ─── Initialization ─────────────────────────────────────────

/**
 * Initialize sparse state to |00...0⟩
 * Only one non-zero entry: index 0 → amplitude 1
 */
export const initializeSparseState = (
  qubitCount: number,
  config: SparseConfig = DEFAULT_SPARSE_CONFIG
): SparseStateVector => {
  const amplitudes = new Map<bigint, Complex>();
  amplitudes.set(0n, { re: 1, im: 0 });

  return {
    amplitudes,
    qubitCount,
    pruneThreshold: config.pruneThreshold,
  };
};

/**
 * Initialize sparse state from a specific computational basis state
 * e.g., |1010⟩ for Hartree-Fock initial states
 */
export const initializeSparseFromBasis = (
  qubitCount: number,
  basisIndex: bigint,
  config: SparseConfig = DEFAULT_SPARSE_CONFIG
): SparseStateVector => {
  const amplitudes = new Map<bigint, Complex>();
  amplitudes.set(basisIndex, { re: 1, im: 0 });

  return {
    amplitudes,
    qubitCount,
    pruneThreshold: config.pruneThreshold,
  };
};

// ─── Pruning ────────────────────────────────────────────────

/**
 * Remove amplitudes below the threshold and renormalize.
 * This is the key operation that keeps memory bounded.
 */
export const pruneAndNormalize = (
  state: SparseStateVector,
  config: SparseConfig = DEFAULT_SPARSE_CONFIG
): SparseStateVector => {
  let threshold = state.pruneThreshold;

  // Adaptive: if too many non-zero entries, increase threshold
  if (config.adaptivePruning && state.amplitudes.size > config.maxNonZero) {
    // Collect all magnitudes and find the cutoff
    const mags: number[] = [];
    for (const amp of state.amplitudes.values()) {
      mags.push(magnitudeSquared(amp));
    }
    mags.sort((a, b) => b - a);
    // Keep only the top maxNonZero entries
    if (mags.length > config.maxNonZero) {
      threshold = Math.max(threshold, mags[config.maxNonZero - 1]);
    }
  }

  const pruned = new Map<bigint, Complex>();
  let normSq = 0;

  for (const [idx, amp] of state.amplitudes) {
    const magSq = magnitudeSquared(amp);
    if (magSq > threshold) {
      pruned.set(idx, amp);
      normSq += magSq;
    }
  }

  // Renormalize
  if (normSq > 0 && Math.abs(normSq - 1.0) > 1e-12) {
    const invNorm = 1 / Math.sqrt(normSq);
    for (const [idx, amp] of pruned) {
      pruned.set(idx, { re: amp.re * invNorm, im: amp.im * invNorm });
    }
  }

  return {
    amplitudes: pruned,
    qubitCount: state.qubitCount,
    pruneThreshold: threshold,
  };
};

// ─── Single-Qubit Gate ──────────────────────────────────────

/**
 * Apply a single-qubit gate to the sparse state.
 * For each non-zero amplitude at index i, we compute the
 * partner index (bit-flipped) and apply the 2x2 gate matrix.
 *
 * Complexity: O(k) where k = number of non-zero amplitudes
 */
export const applySingleQubitGateSparse = (
  state: SparseStateVector,
  gateType: string,
  targetQubit: number,
  angle?: number,
  bitOrder: BitOrder = 'MSB',
  config: SparseConfig = DEFAULT_SPARSE_CONFIG
): SparseStateVector => {
  const gate = getGateMatrix(gateType, angle);
  const bitPos = getBitPosition(state.qubitCount, targetQubit, bitOrder);
  const mask = 1n << BigInt(bitPos);

  const newAmplitudes = new Map<bigint, Complex>();
  const processed = new Set<bigint>();

  for (const idx of state.amplitudes.keys()) {
    if (processed.has(idx)) continue;

    const partner = idx ^ mask;
    processed.add(idx);
    processed.add(partner);

    // Determine which is |0⟩ and which is |1⟩
    const bit = Number((idx >> BigInt(bitPos)) & 1n);
    const idx0 = bit === 0 ? idx : partner;
    const idx1 = bit === 0 ? partner : idx;

    const alpha = state.amplitudes.get(idx0) || ZERO;
    const beta = state.amplitudes.get(idx1) || ZERO;

    // Apply gate: [new_α, new_β] = G · [α, β]
    const newAlpha: Complex = {
      re: gate[0][0].re * alpha.re - gate[0][0].im * alpha.im
        + gate[0][1].re * beta.re - gate[0][1].im * beta.im,
      im: gate[0][0].re * alpha.im + gate[0][0].im * alpha.re
        + gate[0][1].re * beta.im + gate[0][1].im * beta.re,
    };

    const newBeta: Complex = {
      re: gate[1][0].re * alpha.re - gate[1][0].im * alpha.im
        + gate[1][1].re * beta.re - gate[1][1].im * beta.im,
      im: gate[1][0].re * alpha.im + gate[1][0].im * alpha.re
        + gate[1][1].re * beta.im + gate[1][1].im * beta.re,
    };

    if (magnitudeSquared(newAlpha) > config.pruneThreshold) {
      newAmplitudes.set(idx0, newAlpha);
    }
    if (magnitudeSquared(newBeta) > config.pruneThreshold) {
      newAmplitudes.set(idx1, newBeta);
    }
  }

  return {
    amplitudes: newAmplitudes,
    qubitCount: state.qubitCount,
    pruneThreshold: state.pruneThreshold,
  };
};

// ─── Two-Qubit Gates ────────────────────────────────────────

/**
 * Apply CNOT gate to sparse state.
 * Only swaps amplitudes where control bit = 1.
 * Complexity: O(k)
 */
export const applyCNOTSparse = (
  state: SparseStateVector,
  controlQubit: number,
  targetQubit: number,
  bitOrder: BitOrder = 'MSB'
): SparseStateVector => {
  const controlPos = getBitPosition(state.qubitCount, controlQubit, bitOrder);
  const targetPos = getBitPosition(state.qubitCount, targetQubit, bitOrder);

  const newAmplitudes = new Map<bigint, Complex>();

  for (const [idx, amp] of state.amplitudes) {
    const controlBit = Number((idx >> BigInt(controlPos)) & 1n);

    if (controlBit === 1) {
      // Flip the target bit
      const flipped = idx ^ (1n << BigInt(targetPos));
      newAmplitudes.set(flipped, amp);
    } else {
      newAmplitudes.set(idx, amp);
    }
  }

  return {
    amplitudes: newAmplitudes,
    qubitCount: state.qubitCount,
    pruneThreshold: state.pruneThreshold,
  };
};

/**
 * Apply SWAP gate to sparse state.
 * Swaps the bits at positions q1 and q2 for each basis state.
 * Complexity: O(k)
 */
export const applySWAPSparse = (
  state: SparseStateVector,
  qubit1: number,
  qubit2: number,
  bitOrder: BitOrder = 'MSB'
): SparseStateVector => {
  const pos1 = getBitPosition(state.qubitCount, qubit1, bitOrder);
  const pos2 = getBitPosition(state.qubitCount, qubit2, bitOrder);

  const newAmplitudes = new Map<bigint, Complex>();

  for (const [idx, amp] of state.amplitudes) {
    const bit1 = Number((idx >> BigInt(pos1)) & 1n);
    const bit2 = Number((idx >> BigInt(pos2)) & 1n);

    if (bit1 !== bit2) {
      const swapped = idx ^ (1n << BigInt(pos1)) ^ (1n << BigInt(pos2));
      newAmplitudes.set(swapped, amp);
    } else {
      newAmplitudes.set(idx, amp);
    }
  }

  return {
    amplitudes: newAmplitudes,
    qubitCount: state.qubitCount,
    pruneThreshold: state.pruneThreshold,
  };
};

/**
 * Apply CZ gate to sparse state.
 * Negates amplitude when both control and target bits are 1.
 * Complexity: O(k)
 */
export const applyCZSparse = (
  state: SparseStateVector,
  controlQubit: number,
  targetQubit: number,
  bitOrder: BitOrder = 'MSB'
): SparseStateVector => {
  const controlPos = getBitPosition(state.qubitCount, controlQubit, bitOrder);
  const targetPos = getBitPosition(state.qubitCount, targetQubit, bitOrder);

  const newAmplitudes = new Map<bigint, Complex>();

  for (const [idx, amp] of state.amplitudes) {
    const controlBit = Number((idx >> BigInt(controlPos)) & 1n);
    const targetBit = Number((idx >> BigInt(targetPos)) & 1n);

    if (controlBit === 1 && targetBit === 1) {
      newAmplitudes.set(idx, { re: -amp.re, im: -amp.im });
    } else {
      newAmplitudes.set(idx, amp);
    }
  }

  return {
    amplitudes: newAmplitudes,
    qubitCount: state.qubitCount,
    pruneThreshold: state.pruneThreshold,
  };
};

/**
 * Apply Toffoli (CCX) gate to sparse state.
 * Flips target bit when both controls are 1.
 * Complexity: O(k)
 */
export const applyToffoliSparse = (
  state: SparseStateVector,
  control1: number,
  control2: number,
  target: number,
  bitOrder: BitOrder = 'MSB'
): SparseStateVector => {
  const c1Pos = getBitPosition(state.qubitCount, control1, bitOrder);
  const c2Pos = getBitPosition(state.qubitCount, control2, bitOrder);
  const tPos = getBitPosition(state.qubitCount, target, bitOrder);

  const newAmplitudes = new Map<bigint, Complex>();

  for (const [idx, amp] of state.amplitudes) {
    const c1 = Number((idx >> BigInt(c1Pos)) & 1n);
    const c2 = Number((idx >> BigInt(c2Pos)) & 1n);

    if (c1 === 1 && c2 === 1) {
      const flipped = idx ^ (1n << BigInt(tPos));
      newAmplitudes.set(flipped, amp);
    } else {
      newAmplitudes.set(idx, amp);
    }
  }

  return {
    amplitudes: newAmplitudes,
    qubitCount: state.qubitCount,
    pruneThreshold: state.pruneThreshold,
  };
};

// ─── Measurement ────────────────────────────────────────────

/**
 * Measure a qubit in the sparse state.
 * Collapses to a definite outcome and renormalizes.
 */
export const measureQubitSparse = (
  state: SparseStateVector,
  qubit: number,
  bitOrder: BitOrder = 'MSB'
): SparseStateVector => {
  const bitPos = getBitPosition(state.qubitCount, qubit, bitOrder);

  // Calculate P(0) and P(1)
  let prob0 = 0;
  for (const [idx, amp] of state.amplitudes) {
    if (Number((idx >> BigInt(bitPos)) & 1n) === 0) {
      prob0 += magnitudeSquared(amp);
    }
  }

  const outcome = Math.random() < prob0 ? 0 : 1;
  const normFactor = Math.sqrt(outcome === 0 ? prob0 : 1 - prob0);

  if (normFactor < 1e-15) return state;

  const invNorm = 1 / normFactor;
  const newAmplitudes = new Map<bigint, Complex>();

  for (const [idx, amp] of state.amplitudes) {
    const bit = Number((idx >> BigInt(bitPos)) & 1n);
    if (bit === outcome) {
      newAmplitudes.set(idx, { re: amp.re * invNorm, im: amp.im * invNorm });
    }
  }

  return {
    amplitudes: newAmplitudes,
    qubitCount: state.qubitCount,
    pruneThreshold: state.pruneThreshold,
  };
};

// ─── Observables ────────────────────────────────────────────

/**
 * Calculate probabilities from sparse state.
 * Returns sorted list of (state_label, probability) pairs.
 */
export const sparseProbabilities = (
  state: SparseStateVector
): { state: string; probability: number }[] => {
  const results: { state: string; probability: number }[] = [];

  for (const [idx, amp] of state.amplitudes) {
    const prob = magnitudeSquared(amp);
    if (prob > 1e-12) {
      results.push({
        state: formatBasisStateLabel(idx, state.qubitCount),
        probability: prob,
      });
    }
  }

  return results.sort((a, b) => b.probability - a.probability);
};

/**
 * Compute Bloch vector for a single qubit from sparse state.
 * Traces out all other qubits to get the reduced density matrix.
 */
export const sparseBlochVector = (
  state: SparseStateVector,
  qubit: number,
  bitOrder: BitOrder = 'MSB'
): { x: number; y: number; z: number } => {
  const bitPos = getBitPosition(state.qubitCount, qubit, bitOrder);

  let rho00 = 0;
  let rho11 = 0;
  let rho01_re = 0;
  let rho01_im = 0;

  for (const [idx, amp] of state.amplitudes) {
    const bit = Number((idx >> BigInt(bitPos)) & 1n);
    const prob = magnitudeSquared(amp);

    if (bit === 0) {
      rho00 += prob;
      // Find partner amplitude (same state but with this qubit = 1)
      const partner = idx | (1n << BigInt(bitPos));
      const partnerAmp = state.amplitudes.get(partner);
      if (partnerAmp) {
        // ρ01 += α · conj(β)
        rho01_re += amp.re * partnerAmp.re + amp.im * partnerAmp.im;
        rho01_im += amp.im * partnerAmp.re - amp.re * partnerAmp.im;
      }
    } else {
      rho11 += prob;
    }
  }

  return {
    x: 2 * rho01_re,
    y: -2 * rho01_im,
    z: rho00 - rho11,
  };
};

/**
 * Convert sparse state to dense array (for compatibility).
 * WARNING: Only use for small qubit counts (≤ 20).
 */
export const sparseToDense = (state: SparseStateVector): Complex[] => {
  if (state.qubitCount > 20) {
    console.warn(`sparseToDense called with ${state.qubitCount} qubits — this will use ${
      Math.pow(2, state.qubitCount) * 16
    } bytes`);
  }

  const numStates = 1 << state.qubitCount;
  const dense: Complex[] = new Array(numStates);
  for (let i = 0; i < numStates; i++) {
    dense[i] = state.amplitudes.get(BigInt(i)) || { re: 0, im: 0 };
  }
  return dense;
};

/**
 * Convert dense state to sparse (dropping near-zero amplitudes).
 */
export const denseToSparse = (
  amplitudes: Complex[],
  qubitCount: number,
  threshold: number = 1e-14
): SparseStateVector => {
  const map = new Map<bigint, Complex>();
  for (let i = 0; i < amplitudes.length; i++) {
    if (magnitudeSquared(amplitudes[i]) > threshold) {
      map.set(BigInt(i), amplitudes[i]);
    }
  }
  return { amplitudes: map, qubitCount, pruneThreshold: threshold };
};

// ─── Memory Estimation ──────────────────────────────────────

/**
 * Estimate memory usage of the sparse state in bytes.
 * Each Map entry ≈ 64 bytes (key + Complex + overhead).
 */
export const estimateMemoryBytes = (state: SparseStateVector): number => {
  // Map entry: ~32 bytes key/overhead + 16 bytes for Complex (2 × f64)
  return state.amplitudes.size * 48 + 64; // +64 for Map object overhead
};

/**
 * Get sparsity ratio: fraction of non-zero amplitudes.
 */
export const getSparsity = (state: SparseStateVector): number => {
  const totalStates = Math.pow(2, state.qubitCount);
  return state.amplitudes.size / totalStates;
};
