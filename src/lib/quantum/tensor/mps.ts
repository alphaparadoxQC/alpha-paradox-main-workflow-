/**
 * ============================================================
 * MATRIX PRODUCT STATE (MPS) IMPLEMENTATION
 * ============================================================
 * Efficient tensor network representation for quantum states.
 * Enables simulation of 100-210 qubits by exploiting
 * limited entanglement structure.
 * 
 * Optimizations for 100+ qubits:
 * - Efficient sampling without full state vector
 * - Adaptive bond dimension truncation
 * - In-place tensor operations where possible
 * - Periodic canonicalization sweeps
 * ============================================================
 */

import { Complex, ZERO, ONE, add, multiply, scale, magnitudeSquared } from '../complex';
import { MPS, MPSTensor, MPSConfig, DEFAULT_MPS_CONFIG, getAdaptiveMPSConfig } from './types';
import { truncatedSVD, matMul, reshape2D, conjugateTranspose } from './svd';
import { getGateMatrix } from '../gates';
import { QuantumGate } from '@/types/quantum';
import { BitOrder, formatBasisStateLabel, getTensorIndex } from '../bitOrder';

// ─── Initialization ─────────────────────────────────────────

/**
 * Initialize MPS to |00...0⟩ state
 * Each tensor is [1, 2, 1] with |0⟩ amplitude = 1
 */
export const initializeMPS = (qubitCount: number): MPS => {
  const tensors: MPSTensor[] = new Array(qubitCount);
  
  for (let i = 0; i < qubitCount; i++) {
    tensors[i] = {
      data: [[[{ re: 1, im: 0 }], [{ re: 0, im: 0 }]]],
      leftBond: 1,
      rightBond: 1,
    };
  }
  
  return { tensors, qubitCount, maxBondDimension: 1 };
};

// ─── Single-Qubit Gate ──────────────────────────────────────

/**
 * Apply a single-qubit gate to MPS — O(χ²) per gate
 */
export const applySingleQubitGateMPS = (
  mps: MPS,
  gateType: string,
  qubit: number,
  angle?: number,
  _config: MPSConfig = DEFAULT_MPS_CONFIG,
  bitOrder: BitOrder = 'MSB'
): MPS => {
  const gate = getGateMatrix(gateType, angle);
  const tensorIndex = getTensorIndex(mps.qubitCount, qubit, bitOrder);
  const tensor = mps.tensors[tensorIndex];
  const { leftBond, rightBond, data } = tensor;
  
  const newData: Complex[][][] = new Array(leftBond);
  
  for (let l = 0; l < leftBond; l++) {
    newData[l] = new Array(2);
    for (let p = 0; p < 2; p++) {
      newData[l][p] = new Array(rightBond);
      for (let r = 0; r < rightBond; r++) {
        // Inline: sum over old physical index
        const g0 = gate[p][0], g1 = gate[p][1];
        const d0 = data[l][0][r], d1 = data[l][1][r];
        newData[l][p][r] = {
          re: g0.re * d0.re - g0.im * d0.im + g1.re * d1.re - g1.im * d1.im,
          im: g0.re * d0.im + g0.im * d0.re + g1.re * d1.im + g1.im * d1.re,
        };
      }
    }
  }
  
  const newTensors = [...mps.tensors];
  newTensors[tensorIndex] = { data: newData, leftBond, rightBond };
  
  return { ...mps, tensors: newTensors };
};

// ─── Two-Qubit Gate ─────────────────────────────────────────

/**
 * Apply a two-qubit gate to MPS
 * Handles non-adjacent qubits via SWAP chains
 */
export const applyTwoQubitGateMPS = (
  mps: MPS,
  gateType: string,
  control: number,
  target: number,
  config: MPSConfig = DEFAULT_MPS_CONFIG,
  bitOrder: BitOrder = 'MSB'
): MPS => {
  const internalControl = getTensorIndex(mps.qubitCount, control, bitOrder);
  const internalTarget = getTensorIndex(mps.qubitCount, target, bitOrder);

  const isReversed = internalControl > internalTarget;
  const effectiveGateType = (isReversed && gateType === 'CNOT') ? 'CNOT_REVERSE' : gateType;

  if (Math.abs(internalControl - internalTarget) > 1) {
    // SWAP chain to make qubits adjacent
    let currentMPS = mps;
    const swaps: number[] = [];
    
    if (internalControl < internalTarget) {
      for (let i = internalControl; i < internalTarget - 1; i++) {
        currentMPS = applyAdjacentTwoQubitGate(currentMPS, 'SWAP', i, i + 1, config);
        swaps.push(i);
      }
      currentMPS = applyAdjacentTwoQubitGate(currentMPS, effectiveGateType, internalTarget - 1, internalTarget, config);
    } else {
      for (let i = internalControl; i > internalTarget + 1; i--) {
        currentMPS = applyAdjacentTwoQubitGate(currentMPS, 'SWAP', i - 1, i, config);
        swaps.push(i - 1);
      }
      currentMPS = applyAdjacentTwoQubitGate(currentMPS, effectiveGateType, internalTarget, internalTarget + 1, config);
    }
    
    // Swap back
    for (const swapPos of swaps.reverse()) {
      currentMPS = applyAdjacentTwoQubitGate(currentMPS, 'SWAP', swapPos, swapPos + 1, config);
    }
    
    return currentMPS;
  }
  
  return applyAdjacentTwoQubitGate(
    mps,
    effectiveGateType,
    Math.min(internalControl, internalTarget),
    Math.max(internalControl, internalTarget),
    config
  );
};

/**
 * Apply two-qubit gate on adjacent qubits using tensor contraction + SVD
 * Optimized: inline complex arithmetic, pre-compute gate lookup
 */
const applyAdjacentTwoQubitGate = (
  mps: MPS,
  gateType: string,
  left: number,
  right: number,
  config: MPSConfig
): MPS => {
  const T1 = mps.tensors[left];
  const T2 = mps.tensors[right];
  const gate4x4 = getTwoQubitGateMatrix(gateType);
  
  const lBond = T1.leftBond;
  const mBond = T1.rightBond; // = T2.leftBond
  const rBond = T2.rightBond;
  
  // Contract T1 and T2, apply gate → result [lBond, 4, rBond]
  const contracted: Complex[][][] = new Array(lBond);
  
  for (let l = 0; l < lBond; l++) {
    contracted[l] = new Array(4);
    for (let p = 0; p < 4; p++) {
      contracted[l][p] = new Array(rBond);
      const gateRow = gate4x4[p];
      
      for (let r = 0; r < rBond; r++) {
        let re = 0, im = 0;
        
        for (let b = 0; b < mBond; b++) {
          for (let pOld = 0; pOld < 4; pOld++) {
            const p1Old = pOld >> 1;
            const p2Old = pOld & 1;
            const gre = gateRow[pOld].re, gim = gateRow[pOld].im;
            if (gre === 0 && gim === 0) continue; // Skip zero gate elements
            
            const t1 = T1.data[l][p1Old][b];
            const t2 = T2.data[b][p2Old][r];
            // gate * t1 * t2
            const tre = t1.re * t2.re - t1.im * t2.im;
            const tim = t1.re * t2.im + t1.im * t2.re;
            re += gre * tre - gim * tim;
            im += gre * tim + gim * tre;
          }
        }
        
        contracted[l][p][r] = { re, im };
      }
    }
  }
  
  // Split via SVD
  const { newT1, newT2, newBond } = splitTensorSVD(contracted, lBond, rBond, config);
  
  const newTensors = [...mps.tensors];
  newTensors[left] = newT1;
  newTensors[right] = newT2;
  
  return {
    ...mps,
    tensors: newTensors,
    maxBondDimension: Math.max(mps.maxBondDimension, newBond),
  };
};

// ─── Gate Matrices ──────────────────────────────────────────

// Cache gate matrices to avoid recomputation
const gateCache = new Map<string, Complex[][]>();

const getTwoQubitGateMatrix = (gateType: string): Complex[][] => {
  const cached = gateCache.get(gateType);
  if (cached) return cached;
  
  const I: Complex = { re: 1, im: 0 };
  const O: Complex = { re: 0, im: 0 };
  const negI: Complex = { re: -1, im: 0 };
  
  let result: Complex[][];
  switch (gateType) {
    case 'CNOT':
      result = [
        [I, O, O, O],
        [O, I, O, O],
        [O, O, O, I],
        [O, O, I, O],
      ];
      break;
    case 'CNOT_REVERSE':
      result = [
        [I, O, O, O],
        [O, O, O, I],
        [O, O, I, O],
        [O, I, O, O],
      ];
      break;
    case 'SWAP':
      result = [
        [I, O, O, O],
        [O, O, I, O],
        [O, I, O, O],
        [O, O, O, I],
      ];
      break;
    case 'CZ':
      result = [
        [I, O, O, O],
        [O, I, O, O],
        [O, O, I, O],
        [O, O, O, negI],
      ];
      break;
    default:
      result = [
        [I, O, O, O],
        [O, I, O, O],
        [O, O, I, O],
        [O, O, O, I],
      ];
  }
  
  gateCache.set(gateType, result);
  return result;
};

// ─── SVD Split ──────────────────────────────────────────────

const splitTensorSVD = (
  contracted: Complex[][][],
  leftBond: number,
  rightBond: number,
  config: MPSConfig
): { newT1: MPSTensor; newT2: MPSTensor; newBond: number } => {
  const rows = leftBond * 2;
  const cols = 2 * rightBond;
  const matrix: Complex[][] = new Array(rows);
  
  for (let l = 0; l < leftBond; l++) {
    for (let p1 = 0; p1 < 2; p1++) {
      const rowIdx = l * 2 + p1;
      matrix[rowIdx] = new Array(cols);
      for (let p2 = 0; p2 < 2; p2++) {
        for (let r = 0; r < rightBond; r++) {
          const colIdx = p2 * rightBond + r;
          matrix[rowIdx][colIdx] = contracted[l][p1 * 2 + p2][r];
        }
      }
    }
  }
  
  const maxRank = Math.min(rows, cols, config.maxBondDimension);
  const { U, S, Vh } = truncatedSVD(matrix, maxRank, config.truncationThreshold);
  
  const newBond = S.length || 1;
  
  // Reconstruct T1: [leftBond, 2, newBond] — absorb sqrt(S) into both sides
  const newT1Data: Complex[][][] = new Array(leftBond);
  for (let l = 0; l < leftBond; l++) {
    newT1Data[l] = new Array(2);
    for (let p = 0; p < 2; p++) {
      newT1Data[l][p] = new Array(newBond);
      const rowIdx = l * 2 + p;
      for (let b = 0; b < newBond; b++) {
        const sqrtS = Math.sqrt(S[b] || 0);
        const uVal = U[rowIdx]?.[b] || { re: 0, im: 0 };
        newT1Data[l][p][b] = { re: uVal.re * sqrtS, im: uVal.im * sqrtS };
      }
    }
  }
  
  // Reconstruct T2: [newBond, 2, rightBond]
  const newT2Data: Complex[][][] = new Array(newBond);
  for (let b = 0; b < newBond; b++) {
    newT2Data[b] = new Array(2);
    for (let p = 0; p < 2; p++) {
      newT2Data[b][p] = new Array(rightBond);
      for (let r = 0; r < rightBond; r++) {
        const colIdx = p * rightBond + r;
        const sqrtS = Math.sqrt(S[b] || 0);
        const vhVal = Vh[b]?.[colIdx] || { re: 0, im: 0 };
        newT2Data[b][p][r] = { re: vhVal.re * sqrtS, im: vhVal.im * sqrtS };
      }
    }
  }
  
  return {
    newT1: { data: newT1Data, leftBond, rightBond: newBond },
    newT2: { data: newT2Data, leftBond: newBond, rightBond },
    newBond,
  };
};

// ─── State Vector Extraction (small circuits only) ──────────

/**
 * Convert MPS to full state vector
 * WARNING: exponential in qubit count — only for ≤ 20 qubits
 */
export const mpsToStateVector = (mps: MPS): Complex[] => {
  const { tensors, qubitCount } = mps;
  
  const numStates = 1 << qubitCount;
  const amplitudes: Complex[] = new Array(numStates);
  
  for (let state = 0; state < numStates; state++) {
    let result: Complex[][] = [[{ re: 1, im: 0 }]];
    
    for (let q = 0; q < qubitCount; q++) {
      const p = (state >> (qubitCount - 1 - q)) & 1;
      const slice: Complex[][] = tensors[q].data.map(leftSlice => leftSlice[p]);
      result = matMul(result, slice);
    }
    
    amplitudes[state] = result[0]?.[0] || { re: 0, im: 0 };
  }
  
  return amplitudes;
};

// ─── Efficient Sampling from MPS ────────────────────────────

/**
 * Sample a single bitstring from MPS using sequential contraction
 * O(n · χ²) per sample — efficient for any qubit count
 */
const sampleBitstring = (mps: MPS): { bits: number[]; probability: number } => {
  const { tensors, qubitCount } = mps;
  const bits: number[] = new Array(qubitCount);
  let leftVector: Complex[][] = [[{ re: 1, im: 0 }]]; // [1 × bond]
  let prob = 1;
  
  for (let q = 0; q < qubitCount; q++) {
    const tensor = tensors[q];
    
    // Compute probability of measuring |0⟩ at this site
    // P(0) = ||leftVector · T[:, 0, :]||²
    const slice0: Complex[][] = tensor.data.map(leftSlice => leftSlice[0]);
    const slice1: Complex[][] = tensor.data.map(leftSlice => leftSlice[1]);
    
    const contracted0 = matMul(leftVector, slice0);
    const contracted1 = matMul(leftVector, slice1);
    
    let norm0sq = 0, norm1sq = 0;
    for (let j = 0; j < contracted0[0].length; j++) {
      const c0 = contracted0[0][j];
      norm0sq += c0.re * c0.re + c0.im * c0.im;
      const c1 = contracted1[0][j];
      norm1sq += c1.re * c1.re + c1.im * c1.im;
    }
    
    const total = norm0sq + norm1sq;
    if (total < 1e-30) {
      bits[q] = 0;
      leftVector = contracted0;
      continue;
    }
    
    const p0 = norm0sq / total;
    
    if (Math.random() < p0) {
      bits[q] = 0;
      prob *= p0;
      // Normalize contracted0
      const invNorm = 1 / Math.sqrt(norm0sq);
      for (let j = 0; j < contracted0[0].length; j++) {
        contracted0[0][j].re *= invNorm;
        contracted0[0][j].im *= invNorm;
      }
      leftVector = contracted0;
    } else {
      bits[q] = 1;
      prob *= (1 - p0);
      const invNorm = 1 / Math.sqrt(norm1sq);
      for (let j = 0; j < contracted1[0].length; j++) {
        contracted1[0][j].re *= invNorm;
        contracted1[0][j].im *= invNorm;
      }
      leftVector = contracted1;
    }
  }
  
  return { bits, probability: prob };
};



// ─── Probability Computation ────────────────────────────────

export const extractSingleAmplitudeMPS = (mps: MPS, tensorBits: number[]): Complex => {
  let currentMatrix: Complex[][] = [[{ re: 1, im: 0 }]];
  for (let i = 0; i < mps.qubitCount; i++) {
    const bit = tensorBits[i];
    const tensorSlice = mps.tensors[i].data.map(l => l[bit]);
    currentMatrix = matMul(currentMatrix, tensorSlice);
  }
  return currentMatrix[0][0];
};

/**
 * Calculate probabilities from MPS efficiently
 * For small circuits: exact computation
 * For large circuits (>25 qubits): sampling-based
 */
export const mpsProbabilities = (
  mps: MPS, 
  numSamples: number = 4096, 
  _bitOrder: BitOrder = 'MSB'
): { 
  outcomes: { state: string; probability: number; amplitude?: Complex }[]; 
  metadata: { top1000Mass: number; isSampled: boolean; totalShots?: number } 
} => {
  const { qubitCount } = mps;
  
  if (qubitCount <= 15) {
    // Exact: enumerate all states
    const amplitudes = mpsToStateVector(mps);
    const outcomes = amplitudes
      .map((amp, index) => {
        return {
          state: formatBasisStateLabel(index, qubitCount),
          probability: amp.re * amp.re + amp.im * amp.im,
        };
      })
      .filter(p => p.probability > 1e-10)
      .sort((a, b) => b.probability - a.probability);
      
    // Exact enum never exceeds 32K states, but we cap at 1000 as requested
    const top1000 = outcomes.slice(0, 1000);
    const top1000Mass = top1000.reduce((sum, o) => sum + o.probability, 0);
    
    return {
      outcomes: top1000,
      metadata: { top1000Mass, isSampled: false }
    };
  }
  
  // Sampling-based for large circuits
  const counts = new Map<string, number>();
  
  for (let i = 0; i < numSamples; i++) {
    const { bits } = sampleBitstring(mps);
    const key = bits.join('');
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  
  const top1000 = Array.from(counts.entries())
    .map(([bitsStr, count]) => {
      const tensorBits = bitsStr.split('').map(Number);
      const amplitude = extractSingleAmplitudeMPS(mps, tensorBits);
      
      let displayStr = bitsStr;
      if (_bitOrder === 'LSB') {
        displayStr = displayStr.split('').reverse().join('');
      }
      
      return {
        state: `|${displayStr}⟩`,
        probability: count / numSamples,
        amplitude
      };
    })
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 1000); // Top 1000 outcomes
    
  const top1000Mass = top1000.reduce((sum, o) => sum + o.probability, 0);
  
  return {
    outcomes: top1000,
    metadata: { top1000Mass, isSampled: true, totalShots: numSamples }
  };
};

/**
 * Compute Bloch vector for a single qubit from MPS
 * O(n · χ²) — efficient at any scale
 */
export const mpsBlochVector = (mps: MPS, qubit: number): { x: number; y: number; z: number } => {
  const { tensors, qubitCount } = mps;
  
  // Contract everything left of qubit
  let leftEnv: Complex[][] = [[{ re: 1, im: 0 }]]; // [1×1]
  for (let q = 0; q < qubit; q++) {
    const t = tensors[q];
    const newDim = t.rightBond;
    const oldDim = leftEnv[0].length; // should == t.leftBond
    const newEnv: Complex[][] = new Array(newDim);
    for (let r = 0; r < newDim; r++) {
      newEnv[r] = new Array(newDim).fill(null).map(() => ({ re: 0, im: 0 }));
    }
    
    // ρ_L' [r1, r2] = Σ_{l1,l2,p} ρ_L[l1,l2] * T[l1,p,r1] * conj(T[l2,p,r2])
    for (let l1 = 0; l1 < oldDim; l1++) {
      for (let l2 = 0; l2 < oldDim; l2++) {
        const rho = leftEnv[l1]?.[l2];
        if (!rho || (Math.abs(rho.re) < 1e-15 && Math.abs(rho.im) < 1e-15)) continue;
        for (let p = 0; p < 2; p++) {
          for (let r1 = 0; r1 < newDim; r1++) {
            const tv1 = t.data[l1]?.[p]?.[r1];
            if (!tv1) continue;
            // rho * tv1
            const rv1re = rho.re * tv1.re - rho.im * tv1.im;
            const rv1im = rho.re * tv1.im + rho.im * tv1.re;
            for (let r2 = 0; r2 < newDim; r2++) {
              const tv2 = t.data[l2]?.[p]?.[r2];
              if (!tv2) continue;
              // rv1 * conj(tv2)
              newEnv[r1][r2].re += rv1re * tv2.re + rv1im * tv2.im;
              newEnv[r1][r2].im += rv1im * tv2.re - rv1re * tv2.im;
            }
          }
        }
      }
    }
    leftEnv = newEnv;
  }
  
  // Contract right environment
  let rightEnv: Complex[][] = [[{ re: 1, im: 0 }]];
  for (let q = qubitCount - 1; q > qubit; q--) {
    const t = tensors[q];
    const newDim = t.leftBond;
    const oldDim = rightEnv.length;
    const newEnv: Complex[][] = new Array(newDim);
    for (let l = 0; l < newDim; l++) {
      newEnv[l] = new Array(newDim).fill(null).map(() => ({ re: 0, im: 0 }));
    }
    
    for (let r1 = 0; r1 < oldDim; r1++) {
      for (let r2 = 0; r2 < oldDim; r2++) {
        const rho = rightEnv[r1]?.[r2];
        if (!rho || (Math.abs(rho.re) < 1e-15 && Math.abs(rho.im) < 1e-15)) continue;
        for (let p = 0; p < 2; p++) {
          for (let l1 = 0; l1 < newDim; l1++) {
            const tv1 = t.data[l1]?.[p]?.[r1];
            if (!tv1) continue;
            const rv1re = rho.re * tv1.re - rho.im * tv1.im;
            const rv1im = rho.re * tv1.im + rho.im * tv1.re;
            for (let l2 = 0; l2 < newDim; l2++) {
              const tv2 = t.data[l2]?.[p]?.[r2];
              if (!tv2) continue;
              newEnv[l1][l2].re += rv1re * tv2.re + rv1im * tv2.im;
              newEnv[l1][l2].im += rv1im * tv2.re - rv1re * tv2.im;
            }
          }
        }
      }
    }
    rightEnv = newEnv;
  }
  
  // Compute reduced density matrix ρ[p1, p2] for the target qubit
  const t = tensors[qubit];
  const rho: Complex[][] = [
    [{ re: 0, im: 0 }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: 0, im: 0 }],
  ];
  
  for (let p1 = 0; p1 < 2; p1++) {
    for (let p2 = 0; p2 < 2; p2++) {
      let re = 0, im = 0;
      for (let l1 = 0; l1 < t.leftBond; l1++) {
        for (let l2 = 0; l2 < t.leftBond; l2++) {
          const le = leftEnv[l1]?.[l2];
          if (!le) continue;
          for (let r1 = 0; r1 < t.rightBond; r1++) {
            const tv1 = t.data[l1]?.[p1]?.[r1];
            if (!tv1) continue;
            for (let r2 = 0; r2 < t.rightBond; r2++) {
              const tv2 = t.data[l2]?.[p2]?.[r2];
              if (!tv2) continue;
              const rEnv = rightEnv[r1]?.[r2];
              if (!rEnv) continue;
              
              // le * tv1 * conj(tv2) * rEnv
              const a1re = le.re * tv1.re - le.im * tv1.im;
              const a1im = le.re * tv1.im + le.im * tv1.re;
              // * conj(tv2)
              const a2re = a1re * tv2.re + a1im * tv2.im;
              const a2im = a1im * tv2.re - a1re * tv2.im;
              // * rEnv
              re += a2re * rEnv.re - a2im * rEnv.im;
              im += a2re * rEnv.im + a2im * rEnv.re;
            }
          }
        }
      }
      rho[p1][p2] = { re, im };
    }
  }
  
  // Bloch vector from density matrix: x = 2·Re(ρ01), y = -2·Im(ρ01), z = ρ00 - ρ11
  const x = 2 * rho[0][1].re;
  const y = -2 * rho[0][1].im;
  const z = rho[0][0].re - rho[1][1].re;
  
  // DO NOT normalize — for mixed/entangled states the Bloch vector
  // lies INSIDE the sphere (|r⃗| < 1). Only pure separable qubits
  // sit on the surface (|r⃗| = 1). Clamp to unit sphere for safety.
  const mag = Math.sqrt(x * x + y * y + z * z);
  if (mag > 1.001) {
    // Numerical noise pushed it outside — clamp to unit sphere
    return { x: x / mag, y: y / mag, z: z / mag };
  }
  return { x, y, z };
};

// ─── Main Simulation Entry Point ────────────────────────────

/**
 * Simulate circuit using MPS with adaptive configuration
 */
export const simulateCircuitMPS = (
  gates: QuantumGate[],
  qubitCount: number,
  config?: MPSConfig,
  bitOrder: BitOrder = 'MSB'
): { 
  amplitudes: Complex[]; 
  maxBond: number; 
  probabilities: { state: string; probability: number; amplitude?: Complex }[]; 
  displays: Record<string, { x: number; y: number; z: number }>; 
  mps: MPS;
  metadata?: { top1000Mass: number; isSampled: boolean; totalShots?: number };
} => {
  const effectiveConfig = config || getAdaptiveMPSConfig(qubitCount, gates.length);
  let mps = initializeMPS(qubitCount);
  const displays: Record<string, { x: number; y: number; z: number }> = {};
  
  // Sort gates by position
  const sortedGates = [...gates].sort((a, b) => a.position - b.position);
  
  for (const gate of sortedGates) {
    switch (gate.type) {
      case 'H':
      case 'X':
      case 'Y':
      case 'Z':
      case 'S':
      case 'T':
      case 'Sdg':
      case 'S†':
      case 'Tdg':
      case 'T†':
      case 'SX':
      case 'SXdg':
      case 'SX†':
        mps = applySingleQubitGateMPS(mps, gate.type, gate.qubit, undefined, effectiveConfig, bitOrder);
        break;
      case 'Rx':
      case 'Ry':
      case 'Rz':
      case 'P':
        mps = applySingleQubitGateMPS(mps, gate.type, gate.qubit, gate.angle, effectiveConfig, bitOrder);
        break;
      case 'CNOT':
        mps = applyTwoQubitGateMPS(mps, 'CNOT', gate.qubit, gate.targetQubit ?? (gate.qubit + 1) % qubitCount, effectiveConfig, bitOrder);
        break;
      case 'SWAP':
        mps = applyTwoQubitGateMPS(mps, 'SWAP', gate.qubit, gate.targetQubit ?? (gate.qubit + 1) % qubitCount, effectiveConfig, bitOrder);
        break;
      case 'CZ':
        mps = applyTwoQubitGateMPS(mps, 'CZ', gate.qubit, gate.targetQubit ?? (gate.qubit + 1) % qubitCount, effectiveConfig, bitOrder);
        break;
            case 'DISPLAY':
        displays[gate.id] = mpsBlochVector(mps, gate.qubit);
        break;

      case 'FUSED': {
        // Apply compiler-fused gate using the pre-computed matrix directly on MPS tensor
        if (gate.fusedMatrix) {
          const fm = gate.fusedMatrix;
          const tensorIndex = getTensorIndex(mps.qubitCount, gate.qubit, bitOrder);
          const tensor = mps.tensors[tensorIndex];
          const { leftBond, rightBond, data } = tensor;
          
          const newData: Complex[][][] = new Array(leftBond);
          for (let l = 0; l < leftBond; l++) {
            newData[l] = new Array(2);
            for (let p = 0; p < 2; p++) {
              newData[l][p] = new Array(rightBond);
              for (let r = 0; r < rightBond; r++) {
                const g0 = fm[p][0], g1 = fm[p][1];
                const d0 = data[l][0][r], d1 = data[l][1][r];
                newData[l][p][r] = {
                  re: g0.re * d0.re - g0.im * d0.im + g1.re * d1.re - g1.im * d1.im,
                  im: g0.re * d0.im + g0.im * d0.re + g1.re * d1.im + g1.im * d1.re,
                };
              }
            }
          }
          
          const newTensors = [...mps.tensors];
          newTensors[tensorIndex] = { data: newData, leftBond, rightBond };
          mps = { ...mps, tensors: newTensors };
        }
        break;
      }

      case 'M':
        break;
    }
  }
  
  // Scale sample count based on circuit size to prevent worker timeouts
  // More qubits → each sample is more expensive (O(n·χ²)) → use fewer samples
  const sampleCount = qubitCount > 80 ? 512 : qubitCount > 24 ? 1024 : qubitCount > 16 ? 2048 : 4096;
  const probResult = mpsProbabilities(mps, sampleCount, bitOrder);
  
  // Only build full state vector for small circuits
  const amplitudes = qubitCount <= 15 ? mpsToStateVector(mps) : [];
  
  return {
    amplitudes,
    maxBond: mps.maxBondDimension,
    probabilities: probResult.outcomes,
    displays,
    mps,
    metadata: probResult.metadata
  };
};

/**
 * Computes the expectation value ⟨ψ|P|ψ⟩ of a Pauli string P for an MPS.
 * Contraction is done sequentially from left to right in O(n · χ²) time.
 */
export const mpsPauliExpectation = (mps: MPS, pauliString: string, bitOrder: BitOrder = 'MSB'): number => {
  const { tensors, qubitCount } = mps;
  
  // Left environment: 1x1 matrix initialized to 1
  let leftEnv: Complex[][] = [[{ re: 1, im: 0 }]];

  for (let i = 0; i < qubitCount; i++) {
    const t = tensors[i];
    // Find the logical qubit this tensor corresponds to
    const q = bitOrder === 'MSB' ? i : qubitCount - 1 - i;
    const op = pauliString[q] || 'I';
    const gate = getGateMatrix(op);

    const newDim = t.rightBond;
    const oldDim = leftEnv.length;
    
    // Initialize new left environment
    const newEnv: Complex[][] = new Array(newDim);
    for (let r = 0; r < newDim; r++) {
      newEnv[r] = new Array(newDim).fill(null).map(() => ({ re: 0, im: 0 }));
    }

    // Contract: L'[r1, r2] = Σ_{l1,l2,p1,p2} L[l1, l2] * conj(T[l1, p1, r1]) * gate[p1, p2] * T[l2, p2, r2]
    for (let l1 = 0; l1 < oldDim; l1++) {
      for (let l2 = 0; l2 < oldDim; l2++) {
        const rho = leftEnv[l1][l2];
        if (Math.abs(rho.re) < 1e-15 && Math.abs(rho.im) < 1e-15) continue;

        for (let p1 = 0; p1 < 2; p1++) {
          for (let p2 = 0; p2 < 2; p2++) {
            const g = gate[p1][p2];
            if (g.re === 0 && g.im === 0) continue;

            for (let r1 = 0; r1 < newDim; r1++) {
              const tv1 = t.data[l1][p1]?.[r1];
              if (!tv1) continue;
              
              // rho * g * conj(tv1)
              // (rhoRe + i*rhoIm) * (gRe + i*gIm)
              const tmpRe = rho.re * g.re - rho.im * g.im;
              const tmpIm = rho.re * g.im + rho.im * g.re;
              
              // conj(tv1) = tv1Re - i*tv1Im
              // (tmpRe + i*tmpIm) * (tv1Re - i*tv1Im)
              const rv1Re = tmpRe * tv1.re + tmpIm * tv1.im;
              const rv1Im = tmpIm * tv1.re - tmpRe * tv1.im;

              for (let r2 = 0; r2 < newDim; r2++) {
                const tv2 = t.data[l2][p2]?.[r2];
                if (!tv2) continue;

                // rv1 * tv2
                newEnv[r1][r2].re += rv1Re * tv2.re - rv1Im * tv2.im;
                newEnv[r1][r2].im += rv1Re * tv2.im + rv1Im * tv2.re;
              }
            }
          }
        }
      }
    }
    leftEnv = newEnv;
  }
  
  // The final scalar is the expectation value (should be strictly real)
  return leftEnv[0][0].re;
};
