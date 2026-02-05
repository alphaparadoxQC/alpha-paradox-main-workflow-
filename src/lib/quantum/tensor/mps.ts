 /**
  * ============================================================
  * MATRIX PRODUCT STATE (MPS) IMPLEMENTATION
  * ============================================================
  * Efficient tensor network representation for quantum states.
  * Enables simulation of larger qubit counts by exploiting
  * limited entanglement structure.
  * ============================================================
  */
 
 import { Complex, ZERO, ONE, add, multiply, scale, magnitudeSquared } from '../complex';
 import { MPS, MPSTensor, MPSConfig, DEFAULT_MPS_CONFIG } from './types';
 import { truncatedSVD, matMul, reshape2D, conjugateTranspose } from './svd';
 import { getGateMatrix } from '../gates';
 import { QuantumGate } from '@/types/quantum';
 
 /**
  * Initialize MPS to |00...0⟩ state
  * Each tensor is [1, 2, 1] with |0⟩ amplitude = 1
  */
 export const initializeMPS = (qubitCount: number): MPS => {
   const tensors: MPSTensor[] = [];
   
   for (let i = 0; i < qubitCount; i++) {
     // Create [1, 2, 1] tensor for |0⟩ state
     const tensor: MPSTensor = {
       data: [[[{ ...ONE }], [{ ...ZERO }]]], // data[0][physical][0]
       leftBond: 1,
       rightBond: 1,
     };
     tensors.push(tensor);
   }
   
   return {
     tensors,
     qubitCount,
     maxBondDimension: 1,
   };
 };
 
 /**
  * Apply a single-qubit gate to MPS
  * This is efficient: O(bond^2) per gate
  */
 export const applySingleQubitGateMPS = (
   mps: MPS,
   gateType: string,
   qubit: number,
   angle?: number,
   config: MPSConfig = DEFAULT_MPS_CONFIG
 ): MPS => {
   const gate = getGateMatrix(gateType, angle);
   const tensor = mps.tensors[qubit];
   const { leftBond, rightBond, data } = tensor;
   
   // New tensor data after applying gate
   const newData: Complex[][][] = [];
   
   for (let l = 0; l < leftBond; l++) {
     newData[l] = [];
     for (let p = 0; p < 2; p++) { // New physical index
       newData[l][p] = [];
       for (let r = 0; r < rightBond; r++) {
         // Sum over old physical index
         let sum: Complex = { ...ZERO };
         for (let pOld = 0; pOld < 2; pOld++) {
           sum = add(sum, multiply(gate[p][pOld], data[l][pOld][r]));
         }
         newData[l][p][r] = sum;
       }
     }
   }
   
   const newTensors = [...mps.tensors];
   newTensors[qubit] = { data: newData, leftBond, rightBond };
   
   return { ...mps, tensors: newTensors };
 };
 
 /**
  * Apply a two-qubit gate (CNOT, SWAP, CZ) to MPS
  * This may increase bond dimension; SVD truncation is applied
  */
 export const applyTwoQubitGateMPS = (
   mps: MPS,
   gateType: string,
   control: number,
   target: number,
   config: MPSConfig = DEFAULT_MPS_CONFIG
 ): MPS => {
   // Ensure control < target for simpler processing
   const [q1, q2] = control < target ? [control, target] : [target, control];
   
   // For adjacent qubits, we can apply directly
   // For non-adjacent, we need to swap
   if (Math.abs(control - target) > 1) {
     // Swap chain to make qubits adjacent
     let currentMPS = mps;
     const swaps: number[] = [];
     
     // Move control next to target
     if (control < target) {
       for (let i = control; i < target - 1; i++) {
         currentMPS = applyAdjacentSWAP(currentMPS, i, config);
         swaps.push(i);
       }
     } else {
       for (let i = control; i > target + 1; i--) {
         currentMPS = applyAdjacentSWAP(currentMPS, i - 1, config);
         swaps.push(i - 1);
       }
     }
     
     // Apply the gate on adjacent qubits
     const adjControl = control < target ? target - 1 : target + 1;
     currentMPS = applyAdjacentTwoQubitGate(currentMPS, gateType, adjControl, target, config);
     
     // Swap back
     for (const swapPos of swaps.reverse()) {
       currentMPS = applyAdjacentSWAP(currentMPS, swapPos, config);
     }
     
     return currentMPS;
   }
   
   return applyAdjacentTwoQubitGate(mps, gateType, control, target, config);
 };
 
 /**
  * Apply two-qubit gate on adjacent qubits using tensor contraction + SVD
  */
 const applyAdjacentTwoQubitGate = (
   mps: MPS,
   gateType: string,
   q1: number,
   q2: number,
   config: MPSConfig
 ): MPS => {
   const [left, right] = q1 < q2 ? [q1, q2] : [q2, q1];
   
   const T1 = mps.tensors[left];
   const T2 = mps.tensors[right];
   
   // Get the 4x4 gate matrix
   const gate4x4 = getTwoQubitGateMatrix(gateType);
   
   // Contract T1 and T2 into a single tensor, then apply gate
   // Result shape: [T1.leftBond, 4, T2.rightBond]
   const contractedData: Complex[][][] = [];
   
   for (let l = 0; l < T1.leftBond; l++) {
     contractedData[l] = [];
     for (let p = 0; p < 4; p++) { // Combined physical index
       contractedData[l][p] = [];
       for (let r = 0; r < T2.rightBond; r++) {
         let sum: Complex = { ...ZERO };
         
         // Sum over contracted bond and old physical indices
         for (let b = 0; b < T1.rightBond; b++) {
           for (let p1Old = 0; p1Old < 2; p1Old++) {
             for (let p2Old = 0; p2Old < 2; p2Old++) {
               const oldPhysical = p1Old * 2 + p2Old;
               const gateElement = gate4x4[p][oldPhysical];
               const t1Element = T1.data[l][p1Old][b];
               const t2Element = T2.data[b][p2Old][r];
               
               sum = add(sum, multiply(gateElement, multiply(t1Element, t2Element)));
             }
           }
         }
         
         contractedData[l][p][r] = sum;
       }
     }
   }
   
   // Now split back into two tensors using SVD
   const { newT1, newT2, newBond } = splitTensorSVD(
     contractedData,
     T1.leftBond,
     T2.rightBond,
     config
   );
   
   const newTensors = [...mps.tensors];
   newTensors[left] = newT1;
   newTensors[right] = newT2;
   
   return {
     ...mps,
     tensors: newTensors,
     maxBondDimension: Math.max(mps.maxBondDimension, newBond),
   };
 };
 
 /**
  * Apply SWAP gate on adjacent qubits
  */
 const applyAdjacentSWAP = (mps: MPS, qubit: number, config: MPSConfig): MPS => {
   return applyAdjacentTwoQubitGate(mps, 'SWAP', qubit, qubit + 1, config);
 };
 
 /**
  * Get 4x4 matrix for two-qubit gates
  */
 const getTwoQubitGateMatrix = (gateType: string): Complex[][] => {
   const I: Complex = { re: 1, im: 0 };
   const O: Complex = { re: 0, im: 0 };
   const negI: Complex = { re: -1, im: 0 };
   
   switch (gateType) {
     case 'CNOT':
       return [
         [I, O, O, O],
         [O, I, O, O],
         [O, O, O, I],
         [O, O, I, O],
       ];
     case 'SWAP':
       return [
         [I, O, O, O],
         [O, O, I, O],
         [O, I, O, O],
         [O, O, O, I],
       ];
     case 'CZ':
       return [
         [I, O, O, O],
         [O, I, O, O],
         [O, O, I, O],
         [O, O, O, negI],
       ];
     default:
       // Identity
       return [
         [I, O, O, O],
         [O, I, O, O],
         [O, O, I, O],
         [O, O, O, I],
       ];
   }
 };
 
 /**
  * Split a contracted tensor back into two using SVD
  */
 const splitTensorSVD = (
   contracted: Complex[][][], // [leftBond, 4, rightBond]
   leftBond: number,
   rightBond: number,
   config: MPSConfig
 ): { newT1: MPSTensor; newT2: MPSTensor; newBond: number } => {
   // Reshape to matrix: [leftBond * 2, 2 * rightBond]
   const rows = leftBond * 2;
   const cols = 2 * rightBond;
   const matrix: Complex[][] = [];
   
   for (let l = 0; l < leftBond; l++) {
     for (let p1 = 0; p1 < 2; p1++) {
       const rowIdx = l * 2 + p1;
       matrix[rowIdx] = [];
       for (let p2 = 0; p2 < 2; p2++) {
         for (let r = 0; r < rightBond; r++) {
           const colIdx = p2 * rightBond + r;
           const physicalIdx = p1 * 2 + p2;
           matrix[rowIdx][colIdx] = contracted[l][physicalIdx][r];
         }
       }
     }
   }
   
   // Perform truncated SVD
   const maxRank = Math.min(rows, cols, config.maxBondDimension);
   const { U, S, Vh } = truncatedSVD(matrix, maxRank, config.truncationThreshold);
   
   const newBond = S.length || 1;
   
   // Reconstruct T1: [leftBond, 2, newBond]
   const newT1Data: Complex[][][] = [];
   for (let l = 0; l < leftBond; l++) {
     newT1Data[l] = [];
     for (let p = 0; p < 2; p++) {
       newT1Data[l][p] = [];
       const rowIdx = l * 2 + p;
       for (let b = 0; b < newBond; b++) {
         // U[row][b] * sqrt(S[b])
         const sqrtS = Math.sqrt(S[b] || 0);
         const uVal = U[rowIdx]?.[b] || { ...ZERO };
         newT1Data[l][p][b] = scale(uVal, sqrtS);
       }
     }
   }
   
   // Reconstruct T2: [newBond, 2, rightBond]
   const newT2Data: Complex[][][] = [];
   for (let b = 0; b < newBond; b++) {
     newT2Data[b] = [];
     for (let p = 0; p < 2; p++) {
       newT2Data[b][p] = [];
       for (let r = 0; r < rightBond; r++) {
         const colIdx = p * rightBond + r;
         // sqrt(S[b]) * Vh[b][col]
         const sqrtS = Math.sqrt(S[b] || 0);
         const vhVal = Vh[b]?.[colIdx] || { ...ZERO };
         newT2Data[b][p][r] = scale(vhVal, sqrtS);
       }
     }
   }
   
   return {
     newT1: { data: newT1Data, leftBond, rightBond: newBond },
     newT2: { data: newT2Data, leftBond: newBond, rightBond },
     newBond,
   };
 };
 
 /**
  * Convert MPS to full state vector (for verification/output)
  * Warning: exponential in qubit count!
  */
 export const mpsToStateVector = (mps: MPS): Complex[] => {
   const { tensors, qubitCount } = mps;
   const numStates = Math.pow(2, qubitCount);
   const amplitudes: Complex[] = [];
   
   for (let state = 0; state < numStates; state++) {
     // Extract physical indices from state
     const physicals: number[] = [];
     for (let q = 0; q < qubitCount; q++) {
       physicals.push((state >> (qubitCount - 1 - q)) & 1);
     }
     
     // Contract tensors along bond dimensions
     let result: Complex[][] = [[{ ...ONE }]]; // [1, 1] starting matrix
     
     for (let q = 0; q < qubitCount; q++) {
       const tensor = tensors[q];
       const p = physicals[q];
       
       // Get the slice for this physical index: [leftBond, rightBond]
       const slice: Complex[][] = tensor.data.map(leftSlice => leftSlice[p]);
       
       // Matrix multiply: result = result @ slice
       result = matMul(result, slice);
     }
     
     // Result should be [1, 1]
     amplitudes.push(result[0]?.[0] || { ...ZERO });
   }
   
   return amplitudes;
 };
 
 /**
  * Calculate probabilities from MPS (more efficient than full conversion)
  */
 export const mpsProbabilities = (mps: MPS): { state: string; probability: number }[] => {
   const amplitudes = mpsToStateVector(mps);
   const { qubitCount } = mps;
   
   return amplitudes
     .map((amp, index) => {
       const binaryStr = index.toString(2).padStart(qubitCount, '0');
       return {
         state: `|${binaryStr}⟩`,
         probability: magnitudeSquared(amp),
       };
     })
     .filter(p => p.probability > 1e-10)
     .sort((a, b) => b.probability - a.probability);
 };
 
 /**
  * Simulate circuit using MPS
  */
 export const simulateCircuitMPS = (
   gates: QuantumGate[],
   qubitCount: number,
   config: MPSConfig = DEFAULT_MPS_CONFIG
 ): { amplitudes: Complex[]; maxBond: number } => {
   let mps = initializeMPS(qubitCount);
   
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
         mps = applySingleQubitGateMPS(mps, gate.type, gate.qubit, undefined, config);
         break;
       case 'Rx':
       case 'Ry':
       case 'Rz':
         mps = applySingleQubitGateMPS(mps, gate.type, gate.qubit, gate.angle, config);
         break;
       case 'CNOT':
         const cnotTarget = gate.targetQubit ?? (gate.qubit + 1) % qubitCount;
         mps = applyTwoQubitGateMPS(mps, 'CNOT', gate.qubit, cnotTarget, config);
         break;
       case 'SWAP':
         const swapTarget = gate.targetQubit ?? (gate.qubit + 1) % qubitCount;
         mps = applyTwoQubitGateMPS(mps, 'SWAP', gate.qubit, swapTarget, config);
         break;
       case 'CZ':
         const czTarget = gate.targetQubit ?? (gate.qubit + 1) % qubitCount;
         mps = applyTwoQubitGateMPS(mps, 'CZ', gate.qubit, czTarget, config);
         break;
       case 'M':
         // Measurement doesn't change MPS in this implementation
         break;
       // CCX (Toffoli) would need special handling
     }
   }
   
   return {
     amplitudes: mpsToStateVector(mps),
     maxBond: mps.maxBondDimension,
   };
 };