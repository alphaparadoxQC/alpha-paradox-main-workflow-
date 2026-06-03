/**
 * ============================================================
 * HIGH-PRECISION COMPLEX NUMBER ENGINE (complex128)
 * ============================================================
 * Provides float64 / complex128 precision arithmetic for
 * chemistry simulations where float32 is insufficient.
 *
 * Standard JS numbers are already IEEE-754 float64, but this
 * module enforces explicit Float64Array-backed storage and
 * numerically stable algorithms (Kahan summation, etc.) for:
 * - VQE energy evaluation
 * - Hamiltonian expectation values
 * - Chemistry gradient computation
 * - SVD truncation in MPS
 *
 * WebGPU uses float32 — this module provides the CPU fallback
 * path for chemistry-grade accuracy.
 * ============================================================
 */

// ─── Types ──────────────────────────────────────────────────

/**
 * A complex number backed by explicit float64 storage.
 * Interleaved format: [re, im] in a Float64Array.
 */
export interface Complex128 {
  re: number;
  im: number;
}

/**
 * A dense state vector using Float64Array for complex128 precision.
 * Layout: [re_0, im_0, re_1, im_1, ...]
 * Total size: 2^n * 2 * 8 bytes = 2^(n+4) bytes.
 */
export class PrecisionStateVector {
  readonly data: Float64Array;
  readonly qubitCount: number;
  readonly numStates: number;

  constructor(qubitCount: number) {
    this.qubitCount = qubitCount;
    this.numStates = 1 << qubitCount;
    this.data = new Float64Array(this.numStates * 2);
  }

  /** Initialize to |00...0⟩ */
  initZeroState(): void {
    this.data.fill(0);
    this.data[0] = 1.0; // Re(|0⟩) = 1
  }

  /** Get amplitude at basis state index */
  getAmplitude(index: number): Complex128 {
    return {
      re: this.data[index * 2],
      im: this.data[index * 2 + 1],
    };
  }

  /** Set amplitude at basis state index */
  setAmplitude(index: number, re: number, im: number): void {
    this.data[index * 2] = re;
    this.data[index * 2 + 1] = im;
  }

  /** Get magnitude squared of amplitude at index */
  probabilityAt(index: number): number {
    const re = this.data[index * 2];
    const im = this.data[index * 2 + 1];
    return re * re + im * im;
  }

  /** Compute total norm squared (should be ≈ 1 for valid states) */
  normSquared(): number {
    return kahanSumMagnitudesSq(this.data);
  }

  /** Renormalize the state vector */
  normalize(): void {
    const normSq = this.normSquared();
    if (normSq < 1e-30) return;
    const invNorm = 1 / Math.sqrt(normSq);
    for (let i = 0; i < this.data.length; i++) {
      this.data[i] *= invNorm;
    }
  }

  /** Clone this state vector */
  clone(): PrecisionStateVector {
    const copy = new PrecisionStateVector(this.qubitCount);
    copy.data.set(this.data);
    return copy;
  }

  /** Memory usage in bytes */
  memoryBytes(): number {
    return this.data.byteLength;
  }
}

// ─── Kahan Summation ────────────────────────────────────────

/**
 * Kahan compensated summation for computing Σ|a_i|².
 * Reduces floating-point error from O(n·ε) to O(ε) for n terms.
 *
 * Critical for:
 * - Normalization checks
 * - Energy expectation values
 * - Probability distributions
 */
export const kahanSumMagnitudesSq = (data: Float64Array): number => {
  let sum = 0;
  let compensation = 0; // Running compensation for lost low-order bits

  for (let i = 0; i < data.length; i += 2) {
    const re = data[i];
    const im = data[i + 1];
    const magSq = re * re + im * im;

    const y = magSq - compensation;
    const t = sum + y;
    compensation = (t - sum) - y;
    sum = t;
  }

  return sum;
};

/**
 * Kahan compensated summation for a regular number array.
 */
export const kahanSum = (values: number[]): number => {
  let sum = 0;
  let compensation = 0;

  for (const v of values) {
    const y = v - compensation;
    const t = sum + y;
    compensation = (t - sum) - y;
    sum = t;
  }

  return sum;
};

// ─── High-Precision Gate Application ────────────────────────

/**
 * Apply a 2x2 gate matrix to a precision state vector.
 * Uses Float64Array directly to avoid object allocation overhead.
 *
 * Gate matrix stored as: [g00_re, g00_im, g01_re, g01_im,
 *                         g10_re, g10_im, g11_re, g11_im]
 */
export const applyGatePrecision = (
  state: PrecisionStateVector,
  gateFlat: Float64Array, // 8 elements: [g00_re, g00_im, g01_re, g01_im, g10_re, g10_im, g11_re, g11_im]
  targetQubit: number,
  bitPosition: number
): void => {
  const numStates = state.numStates;
  const mask = 1 << bitPosition;
  const data = state.data;

  const g00_re = gateFlat[0], g00_im = gateFlat[1];
  const g01_re = gateFlat[2], g01_im = gateFlat[3];
  const g10_re = gateFlat[4], g10_im = gateFlat[5];
  const g11_re = gateFlat[6], g11_im = gateFlat[7];

  for (let i = 0; i < numStates; i++) {
    const partner = i ^ mask;
    if (i > partner) continue;

    const bit = (i >> bitPosition) & 1;
    const idx0 = bit === 0 ? i : partner;
    const idx1 = bit === 0 ? partner : i;

    const a_re = data[idx0 * 2];
    const a_im = data[idx0 * 2 + 1];
    const b_re = data[idx1 * 2];
    const b_im = data[idx1 * 2 + 1];

    // new_a = g00 * a + g01 * b
    data[idx0 * 2]     = g00_re * a_re - g00_im * a_im + g01_re * b_re - g01_im * b_im;
    data[idx0 * 2 + 1] = g00_re * a_im + g00_im * a_re + g01_re * b_im + g01_im * b_re;

    // new_b = g10 * a + g11 * b
    data[idx1 * 2]     = g10_re * a_re - g10_im * a_im + g11_re * b_re - g11_im * b_im;
    data[idx1 * 2 + 1] = g10_re * a_im + g10_im * a_re + g11_re * b_im + g11_im * b_re;
  }
};

/**
 * Convert a GateMatrix to flat Float64Array format for the precision engine.
 */
export const flattenGateMatrix = (gate: [[Complex128, Complex128], [Complex128, Complex128]]): Float64Array => {
  return new Float64Array([
    gate[0][0].re, gate[0][0].im,
    gate[0][1].re, gate[0][1].im,
    gate[1][0].re, gate[1][0].im,
    gate[1][1].re, gate[1][1].im,
  ]);
};

// ─── High-Precision CNOT ────────────────────────────────────

/**
 * Apply CNOT gate with float64 precision.
 */
export const applyCNOTPrecision = (
  state: PrecisionStateVector,
  controlBitPos: number,
  targetBitPos: number
): void => {
  const numStates = state.numStates;
  const data = state.data;

  for (let i = 0; i < numStates; i++) {
    const controlBit = (i >> controlBitPos) & 1;
    if (controlBit !== 1) continue;

    const flipped = i ^ (1 << targetBitPos);
    if (i > flipped) continue;

    // Swap amplitudes
    const tmp_re = data[i * 2];
    const tmp_im = data[i * 2 + 1];
    data[i * 2]     = data[flipped * 2];
    data[i * 2 + 1] = data[flipped * 2 + 1];
    data[flipped * 2]     = tmp_re;
    data[flipped * 2 + 1] = tmp_im;
  }
};

// ─── High-Precision Expectation Values ──────────────────────

/**
 * Compute ⟨ψ|H|ψ⟩ for a diagonal Hamiltonian.
 * Uses Kahan summation for numerical stability.
 *
 * @param state - The quantum state vector
 * @param energies - Energy eigenvalue for each basis state
 * @returns The expectation value with float64 precision
 */
export const expectationValueDiagonal = (
  state: PrecisionStateVector,
  energies: Float64Array
): number => {
  let sum = 0;
  let comp = 0;

  for (let i = 0; i < state.numStates; i++) {
    const prob = state.probabilityAt(i);
    const contribution = prob * energies[i];

    const y = contribution - comp;
    const t = sum + y;
    comp = (t - sum) - y;
    sum = t;
  }

  return sum;
};

/**
 * Compute inner product ⟨ψ|φ⟩ with Kahan-compensated summation.
 */
export const innerProductPrecision = (
  psi: PrecisionStateVector,
  phi: PrecisionStateVector
): Complex128 => {
  let sum_re = 0, sum_im = 0;
  let comp_re = 0, comp_im = 0;

  for (let i = 0; i < psi.numStates; i++) {
    const a_re = psi.data[i * 2];
    const a_im = psi.data[i * 2 + 1];
    const b_re = phi.data[i * 2];
    const b_im = phi.data[i * 2 + 1];

    // conj(a) * b = (a_re + i*a_im)* · (b_re + i*b_im)
    //            = (a_re*b_re + a_im*b_im) + i*(a_re*b_im - a_im*b_re)
    const prod_re = a_re * b_re + a_im * b_im;
    const prod_im = a_re * b_im - a_im * b_re;

    // Kahan for real part
    const y_re = prod_re - comp_re;
    const t_re = sum_re + y_re;
    comp_re = (t_re - sum_re) - y_re;
    sum_re = t_re;

    // Kahan for imaginary part
    const y_im = prod_im - comp_im;
    const t_im = sum_im + y_im;
    comp_im = (t_im - sum_im) - y_im;
    sum_im = t_im;
  }

  return { re: sum_re, im: sum_im };
};

// ─── Numerical Stability Utilities ──────────────────────────

/**
 * Check if a state vector is properly normalized.
 * Returns the deviation from unit norm.
 */
export const checkNormalization = (state: PrecisionStateVector): {
  normSquared: number;
  deviation: number;
  isValid: boolean;
} => {
  const normSq = state.normSquared();
  const deviation = Math.abs(normSq - 1.0);
  return {
    normSquared: normSq,
    deviation,
    isValid: deviation < 1e-10,
  };
};

/**
 * Compute the condition number estimate for a 2x2 matrix.
 * High condition number = numerically unstable.
 */
export const conditionNumber2x2 = (gate: Float64Array): number => {
  // Frobenius norm
  let normSq = 0;
  for (let i = 0; i < 8; i++) {
    normSq += gate[i] * gate[i];
  }
  const norm = Math.sqrt(normSq);

  // For unitary matrices, condition number should be 1
  // Deviation indicates numerical error
  return norm / Math.SQRT2; // Normalized by expected Frobenius norm of 2x2 unitary
};

/**
 * Get maximum qubit count for a given memory budget.
 * complex128 = 16 bytes per amplitude, 2^n amplitudes.
 */
export const maxQubitsForMemory = (memoryBytesAvailable: number): number => {
  // 2^n * 16 bytes ≤ budget
  // n ≤ log2(budget / 16)
  return Math.floor(Math.log2(memoryBytesAvailable / 16));
};
