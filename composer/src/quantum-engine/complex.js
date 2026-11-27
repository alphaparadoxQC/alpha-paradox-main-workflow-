/**
 * Complex number math for quantum simulation.
 * All quantum states are vectors of complex amplitudes.
 */

export class Complex {
  constructor(re = 0, im = 0) {
    this.re = re;
    this.im = im;
  }

  static zero() { return new Complex(0, 0); }
  static one() { return new Complex(1, 0); }
  static i() { return new Complex(0, 1); }

  static fromPolar(r, theta) {
    return new Complex(r * Math.cos(theta), r * Math.sin(theta));
  }

  add(other) {
    return new Complex(this.re + other.re, this.im + other.im);
  }

  sub(other) {
    return new Complex(this.re - other.re, this.im - other.im);
  }

  mul(other) {
    if (typeof other === 'number') {
      return new Complex(this.re * other, this.im * other);
    }
    return new Complex(
      this.re * other.re - this.im * other.im,
      this.re * other.im + this.im * other.re
    );
  }

  div(other) {
    if (typeof other === 'number') {
      return new Complex(this.re / other, this.im / other);
    }
    const denom = other.re * other.re + other.im * other.im;
    return new Complex(
      (this.re * other.re + this.im * other.im) / denom,
      (this.im * other.re - this.re * other.im) / denom
    );
  }

  conjugate() {
    return new Complex(this.re, -this.im);
  }

  magnitude() {
    return Math.sqrt(this.re * this.re + this.im * this.im);
  }

  magnitudeSquared() {
    return this.re * this.re + this.im * this.im;
  }

  phase() {
    return Math.atan2(this.im, this.re);
  }

  isZero(epsilon = 1e-10) {
    return Math.abs(this.re) < epsilon && Math.abs(this.im) < epsilon;
  }

  equals(other, epsilon = 1e-10) {
    return Math.abs(this.re - other.re) < epsilon && Math.abs(this.im - other.im) < epsilon;
  }

  toString() {
    if (Math.abs(this.im) < 1e-10) return `${this.re.toFixed(4)}`;
    if (Math.abs(this.re) < 1e-10) return `${this.im.toFixed(4)}i`;
    const sign = this.im >= 0 ? '+' : '-';
    return `${this.re.toFixed(4)}${sign}${Math.abs(this.im).toFixed(4)}i`;
  }

  clone() {
    return new Complex(this.re, this.im);
  }
}

// ─── Matrix & Vector Operations ─────────────────────────────────────

/**
 * Create a state vector of size 2^n initialized to |0...0⟩
 */
export function createZeroState(numQubits) {
  const size = 1 << numQubits;
  const state = new Array(size);
  for (let i = 0; i < size; i++) {
    state[i] = Complex.zero();
  }
  state[0] = Complex.one();
  return state;
}

/**
 * Multiply a 2D complex matrix by a complex vector
 */
export function matVecMul(matrix, vec) {
  const n = vec.length;
  const result = new Array(n);
  for (let i = 0; i < n; i++) {
    result[i] = Complex.zero();
    for (let j = 0; j < n; j++) {
      result[i] = result[i].add(matrix[i][j].mul(vec[j]));
    }
  }
  return result;
}

/**
 * Multiply two complex matrices
 */
export function matMatMul(a, b) {
  const n = a.length;
  const m = b[0].length;
  const p = b.length;
  const result = Array.from({ length: n }, () =>
    Array.from({ length: m }, () => Complex.zero())
  );
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      for (let k = 0; k < p; k++) {
        result[i][j] = result[i][j].add(a[i][k].mul(b[k][j]));
      }
    }
  }
  return result;
}

/**
 * Tensor (Kronecker) product of two matrices
 */
export function tensorProduct(a, b) {
  const aRows = a.length, aCols = a[0].length;
  const bRows = b.length, bCols = b[0].length;
  const result = Array.from({ length: aRows * bRows }, () =>
    new Array(aCols * bCols)
  );
  for (let i = 0; i < aRows; i++) {
    for (let j = 0; j < aCols; j++) {
      for (let k = 0; k < bRows; k++) {
        for (let l = 0; l < bCols; l++) {
          result[i * bRows + k][j * bCols + l] = a[i][j].mul(b[k][l]);
        }
      }
    }
  }
  return result;
}

/**
 * Create identity matrix of size n×n
 */
export function identityMatrix(n) {
  const mat = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => Complex.zero())
  );
  for (let i = 0; i < n; i++) {
    mat[i][i] = Complex.one();
  }
  return mat;
}

/**
 * Conjugate transpose (dagger) of a matrix
 */
export function dagger(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = matrix[i][j].conjugate();
    }
  }
  return result;
}

/**
 * Inner product of two state vectors: ⟨a|b⟩
 */
export function innerProduct(a, b) {
  let result = Complex.zero();
  for (let i = 0; i < a.length; i++) {
    result = result.add(a[i].conjugate().mul(b[i]));
  }
  return result;
}

/**
 * Compute probabilities from state vector: p_i = |α_i|²
 */
export function statevectorToProbs(state) {
  return state.map(amp => amp.magnitudeSquared());
}

/**
 * Sample a measurement outcome from a probability distribution
 */
export function sampleFromProbs(probs) {
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (r < cumulative) return i;
  }
  return probs.length - 1;
}

/**
 * Convert an integer index to a binary bitstring of given width
 */
export function intToBitstring(num, width) {
  return num.toString(2).padStart(width, '0');
}

/**
 * Convert a bitstring to an integer
 */
export function bitstringToInt(bitstring) {
  return parseInt(bitstring, 2);
}
