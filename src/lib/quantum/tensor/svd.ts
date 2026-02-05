 /**
  * ============================================================
  * SINGULAR VALUE DECOMPOSITION (SVD)
  * ============================================================
  * Implements SVD for complex matrices, used for MPS truncation.
  * Uses power iteration method for efficiency.
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
  */
 export const matVecMul = (matrix: Complex[][], vec: Complex[]): Complex[] => {
   return matrix.map(row => 
     row.reduce((sum, val, i) => add(sum, multiply(val, vec[i])), { ...ZERO })
   );
 };
 
 /**
  * Matrix multiplication for complex matrices
  */
 export const matMul = (A: Complex[][], B: Complex[][]): Complex[][] => {
   const rowsA = A.length;
   const colsA = A[0]?.length || 0;
   const colsB = B[0]?.length || 0;
   
   const result: Complex[][] = [];
   for (let i = 0; i < rowsA; i++) {
     result[i] = [];
     for (let j = 0; j < colsB; j++) {
       let sum: Complex = { ...ZERO };
       for (let k = 0; k < colsA; k++) {
         sum = add(sum, multiply(A[i][k], B[k][j]));
       }
       result[i][j] = sum;
     }
   }
   return result;
 };
 
 /**
  * Compute vector norm
  */
 const vecNorm = (vec: Complex[]): number => {
   return Math.sqrt(vec.reduce((sum, v) => sum + v.re * v.re + v.im * v.im, 0));
 };
 
 /**
  * Normalize a vector
  */
 const normalizeVec = (vec: Complex[]): Complex[] => {
   const norm = vecNorm(vec);
   if (norm < 1e-15) return vec.map(() => ({ ...ZERO }));
   return vec.map(v => scale(v, 1 / norm));
 };
 
 /**
  * Power iteration to find dominant singular value/vector
  */
 const powerIteration = (
   AtA: Complex[][],
   maxIter: number = 100,
   tol: number = 1e-10
 ): { vector: Complex[]; value: number } => {
   const n = AtA.length;
   let v: Complex[] = Array(n).fill(null).map(() => ({ 
     re: Math.random() - 0.5, 
     im: Math.random() - 0.5 
   }));
   v = normalizeVec(v);
   
   let prevNorm = 0;
   for (let iter = 0; iter < maxIter; iter++) {
     const Av = matVecMul(AtA, v);
     const norm = vecNorm(Av);
     
     if (Math.abs(norm - prevNorm) < tol) break;
     prevNorm = norm;
     
     v = normalizeVec(Av);
   }
   
   const Av = matVecMul(AtA, v);
   const eigenvalue = vecNorm(Av);
   
   return { vector: v, value: Math.sqrt(eigenvalue) };
 };
 
 /**
  * Truncated SVD using power iteration
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
   
   const At = conjugateTranspose(matrix);
   const AtA = matMul(At, matrix);
   const AAt = matMul(matrix, At);
   
   const U: Complex[][] = [];
   const S: number[] = [];
   const V: Complex[][] = [];
   
   // Deflation method: find singular values one by one
   let currentAtA = AtA.map(row => [...row]);
   let currentAAt = AAt.map(row => [...row]);
   
   const numSingular = Math.min(k, Math.min(m, n));
   
   for (let i = 0; i < numSingular; i++) {
     // Find dominant right singular vector
     const { vector: v, value: sigma } = powerIteration(currentAtA);
     
     if (sigma < threshold) break;
     
     S.push(sigma);
     V.push(v);
     
     // Compute corresponding left singular vector: u = Av / sigma
     const Av = matVecMul(matrix, v);
     const u = normalizeVec(Av);
     U.push(u);
     
     // Deflate: subtract contribution of this singular value
     for (let j = 0; j < n; j++) {
       for (let l = 0; l < n; l++) {
         const outerProd = multiply(v[j], conjugate(v[l]));
         currentAtA[j][l] = add(currentAtA[j][l], scale(outerProd, -sigma * sigma));
       }
     }
   }
   
   // Transpose V to get Vh
   const Vh = conjugateTranspose(V.map((v, i) => v));
   const UT = U.length > 0 ? U[0].map((_, i) => U.map(row => row[i])) : [];
   
   return { U: UT, S, Vh: V };
 };
 
 /**
  * Reshape a 1D array into a 2D matrix
  */
 export const reshape2D = (arr: Complex[], rows: number, cols: number): Complex[][] => {
   const result: Complex[][] = [];
   for (let i = 0; i < rows; i++) {
     result[i] = [];
     for (let j = 0; j < cols; j++) {
       result[i][j] = arr[i * cols + j] || { ...ZERO };
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