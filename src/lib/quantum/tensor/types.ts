 /**
  * ============================================================
  * TENSOR NETWORK TYPES
  * ============================================================
  * Type definitions for Matrix Product State (MPS) tensor network
  * representation of quantum states.
  * ============================================================
  */
 
 import { Complex } from '../complex';
 
 /**
  * A tensor in the MPS representation
  * For a single qubit at position i:
  * - Shape: [left_bond, physical_dim, right_bond]
  * - physical_dim = 2 (|0⟩ and |1⟩)
  * - bond dimensions grow with entanglement
  */
 export interface MPSTensor {
   data: Complex[][][]; // [left_bond][physical][right_bond]
   leftBond: number;
   rightBond: number;
 }
 
 /**
  * Matrix Product State representation
  * Represents an n-qubit state as a chain of tensors
  */
 export interface MPS {
   tensors: MPSTensor[];
   qubitCount: number;
   maxBondDimension: number;
 }
 
 /**
  * SVD result for tensor decomposition
  */
 export interface SVDResult {
   U: Complex[][];  // Left singular vectors
   S: number[];     // Singular values
   Vh: Complex[][]; // Right singular vectors (conjugate transpose)
 }
 
 /**
  * Configuration for MPS simulation
  */
 export interface MPSConfig {
   maxBondDimension: number;  // Truncation limit for bonds
   truncationThreshold: number; // SVD truncation threshold
   useApproximation: boolean; // Whether to use approximate methods
 }
 
 export const DEFAULT_MPS_CONFIG: MPSConfig = {
   maxBondDimension: 64,
   truncationThreshold: 1e-10,
   useApproximation: true,
 };