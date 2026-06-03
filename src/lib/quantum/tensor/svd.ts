/**
 * ============================================================
 * SINGULAR VALUE DECOMPOSITION (SVD)
 * ============================================================
 * Optimized SVD for complex matrices, used for MPS truncation.
 * Uses power iteration with Gram-Schmidt deflation.
 * ============================================================
 */

import { Complex, ZERO, ONE, add, multiply, conjugate, magnitude, scale } from '../complex';
import { SVDResult } from './types';

/**
 * Compute the conjugate transpose of a complex matrix
 */
export const conjugateTranspose = (matrix: Complex[][]): Complex[][] => {
  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;
  const result: Complex[][] = [];
  
  for (let j = 0; j < cols; j++) {
    result[j] = [];
    for (let i = 0; i < rows; i++) {
      result[j][i] = conjugate(matrix[i][j]);
    }
  }
  return result;
};

/**
 * Matrix-vector multiplication for complex matrices
 * Optimized: skips near-zero elements
 */
export const matVecMul = (matrix: Complex[][], vec: Complex[]): Complex[] => {
  const rows = matrix.length;
  const result: Complex[] = new Array(rows);
  for (let i = 0; i < rows; i++) {
    let re = 0, im = 0;
    const row = matrix[i];
    for (let j = 0; j < vec.length; j++) {
      const a = row[j], b = vec[j];
      re += a.re * b.re - a.im * b.im;
      im += a.re * b.im + a.im * b.re;
    }
    result[i] = { re, im };
  }
  return result;
};

/**
 * Matrix multiplication for complex matrices
 * Optimized inner loop with inlined arithmetic
 */
export const matMul = (A: Complex[][], B: Complex[][]): Complex[][] => {
  const rowsA = A.length;
  const colsA = A[0]?.length || 0;
  const colsB = B[0]?.length || 0;
  
  const result: Complex[][] = new Array(rowsA);
  for (let i = 0; i < rowsA; i++) {
    result[i] = new Array(colsB);
    for (let j = 0; j < colsB; j++) {
      let re = 0, im = 0;
      for (let k = 0; k < colsA; k++) {
        const a = A[i][k], b = B[k][j];
        re += a.re * b.re - a.im * b.im;
        im += a.re * b.im + a.im * b.re;
      }
      result[i][j] = { re, im };
    }
  }
  return result;
};

/**
 * Compute vector norm squared (avoids sqrt when possible)
 */
const vecNormSq = (vec: Complex[]): number => {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i].re * vec[i].re + vec[i].im * vec[i].im;
  }
  return sum;
};

/**
 * Compute vector norm
 */
const vecNorm = (vec: Complex[]): number => Math.sqrt(vecNormSq(vec));

/**
 * Normalize a vector in-place for efficiency
 */
const normalizeVecInPlace = (vec: Complex[]): number => {
  const norm = vecNorm(vec);
  if (norm < 1e-15) return 0;
  const invNorm = 1 / norm;
  for (let i = 0; i < vec.length; i++) {
    vec[i].re *= invNorm;
    vec[i].im *= invNorm;
  }
  return norm;
};

/**
 * Normalize a vector (returns new array)
 */
const normalizeVec = (vec: Complex[]): Complex[] => {
  const norm = vecNorm(vec);
  if (norm < 1e-15) return vec.map(() => ({ re: 0, im: 0 }));
  const invNorm = 1 / norm;
  return vec.map(v => ({ re: v.re * invNorm, im: v.im * invNorm }));
};

/**
 * Complex inner product <u|v>
 */
const innerProduct = (u: Complex[], v: Complex[]): Complex => {
  let re = 0, im = 0;
  for (let i = 0; i < u.length; i++) {
    // conjugate(u) * v
    re += u[i].re * v[i].re + u[i].im * v[i].im;
    im += u[i].re * v[i].im - u[i].im * v[i].re;
  }
  return { re, im };
};

/**
 * Orthogonalize vec against a set of orthonormal vectors (Gram-Schmidt)
 */
const orthogonalizeAgainst = (vec: Complex[], basis: Complex[][]): void => {
  for (const b of basis) {
    const proj = innerProduct(b, vec);
    for (let i = 0; i < vec.length; i++) {
      vec[i].re -= proj.re * b[i].re - proj.im * b[i].im;
      vec[i].im -= proj.re * b[i].im + proj.im * b[i].re;
    }
  }
};

/**
 * Power iteration to find dominant singular value/vector
 * Adaptive iteration count based on matrix size
 */
const powerIteration = (
  AtA: Complex[][],
  previousVectors: Complex[][] = [],
  maxIter: number = 80,
  tol: number = 1e-10
): { vector: Complex[]; value: number } => {
  const n = AtA.length;
  
  // Use deterministic seed based on index for reproducibility
  const v: Complex[] = new Array(n);
  for (let i = 0; i < n; i++) {
    v[i] = { re: (i % 3 === 0 ? 0.7 : -0.3), im: (i % 2 === 0 ? 0.2 : -0.5) };
  }
  
  // Orthogonalize against previously found vectors
  if (previousVectors.length > 0) {
    orthogonalizeAgainst(v, previousVectors);
  }
  normalizeVecInPlace(v);
  
  let prevEigenvalue = 0;
  
  for (let iter = 0; iter < maxIter; iter++) {
    // v = AtA * v
    const Av = matVecMul(AtA, v);
    
    // Re-orthogonalize every few iterations for numerical stability
    if (previousVectors.length > 0 && iter % 5 === 0) {
      orthogonalizeAgainst(Av, previousVectors);
    }
    
    const eigenvalue = vecNorm(Av);
    
    // Early termination on convergence
    if (Math.abs(eigenvalue - prevEigenvalue) < tol * Math.max(1, eigenvalue)) break;
    prevEigenvalue = eigenvalue;
    
    // Normalize in-place
    if (eigenvalue > 1e-15) {
      const inv = 1 / eigenvalue;
      for (let i = 0; i < n; i++) {
        v[i] = { re: Av[i].re * inv, im: Av[i].im * inv };
      }
    } else {
      break;
    }
  }
  
  const Av = matVecMul(AtA, v);
  const eigenvalue = vecNorm(Av);
  
  return { vector: v, value: Math.sqrt(Math.max(0, eigenvalue)) };
};

/**
 * Truncated SVD using power iteration with Gram-Schmidt orthogonalization
 * Returns only the top k singular values/vectors
 */
export const truncatedSVD = (
  matrix: Complex[][],
  k: number,
  threshold: number = 1e-10
): SVDResult => {
  const m = matrix.length;
  const n = matrix[0]?.length || 0;
  
  if (m === 0 || n === 0) {
    return { U: [], S: [], Vh: [] };
  }
  
  // Compute A^H A (n×n) - prefer smaller dimension
  const useTranspose = m < n;
  let gram: Complex[][];
  
  if (useTranspose) {
    // Compute A A^H (m×m) - smaller when m < n
    const At = conjugateTranspose(matrix);
    gram = matMul(matrix, At);
  } else {
    // Compute A^H A (n×n)
    const At = conjugateTranspose(matrix);
    gram = matMul(At, matrix);
  }
  
  const U: Complex[][] = [];
  const S: number[] = [];
  const rightVectors: Complex[][] = [];
  const foundVectors: Complex[][] = [];
  
  const numSingular = Math.min(k, Math.min(m, n));
  
  for (let i = 0; i < numSingular; i++) {
    const { vector, value: sigma } = powerIteration(gram, foundVectors, 80, threshold * 0.1);
    
    if (sigma < threshold) break;
    
    S.push(sigma);
    foundVectors.push(vector);
    
    if (useTranspose) {
      // vector is left singular vector u; compute v = A^H u / sigma
      const u = vector;
      U.push(u);
      const At = conjugateTranspose(matrix);
      const Atu = matVecMul(At, u);
      rightVectors.push(normalizeVec(Atu));
    } else {
      // vector is right singular vector v; compute u = A v / sigma
      const v = vector;
      rightVectors.push(v);
      const Av = matVecMul(matrix, v);
      U.push(normalizeVec(Av));
    }
  }
  
  // Build output matrices
  const UT = U.length > 0 ? U[0].map((_, i) => U.map(row => row[i])) : [];
  
  return { U: UT, S, Vh: rightVectors };
};

/**
 * Reshape a 1D array into a 2D matrix
 */
export const reshape2D = (arr: Complex[], rows: number, cols: number): Complex[][] => {
  const result: Complex[][] = new Array(rows);
  for (let i = 0; i < rows; i++) {
    result[i] = new Array(cols);
    for (let j = 0; j < cols; j++) {
      result[i][j] = arr[i * cols + j] || { re: 0, im: 0 };
    }
  }
  return result;
};

/**
 * Flatten a 2D matrix into 1D array
 */
export const flatten2D = (matrix: Complex[][]): Complex[] => {
  return matrix.flat();
};
