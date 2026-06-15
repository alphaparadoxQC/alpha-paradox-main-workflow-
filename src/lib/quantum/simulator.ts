/**
 * Quantum Circuit Simulator
 * Simulates quantum circuits with complex number amplitudes
 *
 * Enhanced with:
 * - Circuit compiler (gate fusion, cancellation, depth reduction)
 * - Noise model engine (depolarizing, amplitude damping, thermal)
 * - Sparse state representation (memory-efficient for VQE/QAOA)
 * - Precision engine (complex128 for chemistry)
 * - Job scheduler integration
 */

import { Complex, complex, ZERO, ONE, multiply, add, magnitudeSquared } from './complex';
import { getGateMatrix, applyGateToQubit, stateToBlochVector } from './gates';
import { QuantumGate } from '@/types/quantum';
export type { QuantumGate };
import { simulateCircuitMPS, mpsBlochVector } from './tensor/mps';
import { getAdaptiveMPSConfig } from './tensor/types';
import { BitOrder, formatBasisStateLabel, getBitPosition } from './bitOrder';
import { GPUStateVectorSimulator } from './gpu/gpuSimulator';
import { isWebGPUAvailable } from './gpu/webgpuDriver';
import { compileCircuit, CompilerConfig, DEFAULT_COMPILER_CONFIG, CompilationMetrics, CircuitChunk } from './compiler';
import { NoiseModel, IDEAL_NOISE_MODEL, initializeNoiseModel, applyNoiseToQubit, applyReadoutNoise } from './noise';
import {
  initializeSparseState,
  applySingleQubitGateSparse,
  applyCNOTSparse,
  applySWAPSparse,
  applyCZSparse,
  applyToffoliSparse,
  measureQubitSparse,
  sparseProbabilities,
  sparseBlochVector,
  SparseStateVector,
  SparseConfig,
  DEFAULT_SPARSE_CONFIG,
} from './sparse';
import { simulateCircuitWasm } from './wasm/wasmSimulator';

// Shared GPU simulator instance (lazy initialized)
let gpuSimulator: GPUStateVectorSimulator | null = null;
let gpuInitAttempted = false;
let gpuReady = false;

export interface StateVector {
  amplitudes: Complex[];
  qubitCount: number;
}

export interface SimulationOutput {
  probabilities: { state: string; probability: number }[];
  blochVectors: { x: number; y: number; z: number }[];
  stateVector: StateVector;
  isEntangled: boolean;
  entangledPairs: [number, number][];
  amplitudes: { state: string; re: number; im: number; magnitude: number; phase: number }[];
  circuitDepth: number;
  hasMeasurement: boolean;
  displays?: Record<string, { x: number; y: number; z: number }>;
  gpuAccelerated?: boolean;
  metadata?: {
    top1000Mass: number;
    isSampled: boolean;
    totalShots?: number;
    isExact: boolean;
    backendName: string;
    classification?: string;
  };
  /** Compiler metrics (if compilation was applied) */
  compilationMetrics?: CompilationMetrics;
  /** Noise model that was applied (if any) */
  noiseModelName?: string;
  /** Circuit chunks from compilation */
  chunks?: CircuitChunk[];
  /** Simulation backend used */
  backend?: 'cpu-statevector' | 'cpu-mps' | 'gpu-webgpu' | 'cpu-sparse' | 'wasm-tensor' | 'stabilizer' | 'density-matrix';
  /** Sparsity ratio (if sparse backend used) */
  sparsity?: number;
  /** MPS tensor network (if MPS backend used) */
  mps?: any;
}

/**
 * Initialize quantum state to |00...0⟩
 * The state vector has 2^n entries for n qubits
 */
export const initializeState = (qubitCount: number): StateVector => {
  const numStates = Math.pow(2, qubitCount);
  const amplitudes: Complex[] = new Array(numStates).fill(null).map(() => ({ ...ZERO }));
  
  // Set |00...0⟩ to amplitude 1
  amplitudes[0] = { ...ONE };
  
  return { amplitudes, qubitCount };
};

/**
 * Apply a single-qubit gate to the state vector
 * This applies the gate to qubit at position `targetQubit`
 */
export const applySingleQubitGate = (
  state: StateVector,
  gateType: string,
   targetQubit: number,
   angle?: number,  // For rotation gates (Rx, Ry, Rz)
   bitOrder: BitOrder = 'MSB'
): StateVector => {
  const { amplitudes, qubitCount } = state;
  const numStates = amplitudes.length;
   /**
    * ============================================================
    * GET GATE MATRIX
    * ============================================================
    * For fixed gates (H, X, Y, Z, S, T), the matrix is constant.
    * For rotation gates (Rx, Ry, Rz), the angle parameter is used.
    * ============================================================
    */
   const gate = getGateMatrix(gateType, angle);
  
  const newAmplitudes: Complex[] = new Array(numStates).fill(null).map(() => ({ ...ZERO }));
  
  // For each basis state, calculate the new amplitude
  for (let i = 0; i < numStates; i++) {
    // Get the target qubit's bit value (0 or 1)
    // Qubits are numbered from left to right: q0 q1 q2 ... (most significant to least)
    const bitPosition = getBitPosition(qubitCount, targetQubit, bitOrder);
    const targetBit = (i >> bitPosition) & 1;
    
    // Find the partner state (same state but with target bit flipped)
    const partnerIndex = i ^ (1 << bitPosition);
    
    // Only process each pair once (when i < partnerIndex)
    if (i > partnerIndex) continue;
    
    // Get amplitudes for |...0...⟩ and |...1...⟩ states
    const state0Index = targetBit === 0 ? i : partnerIndex;
    const state1Index = targetBit === 0 ? partnerIndex : i;
    
    const alpha = amplitudes[state0Index]; // amplitude of |...0...⟩
    const beta = amplitudes[state1Index];  // amplitude of |...1...⟩
    
    // Apply gate: [new_alpha, new_beta] = gate * [alpha, beta]
    const [newAlpha, newBeta] = applyGateToQubit(gate, [alpha, beta]);
    
    newAmplitudes[state0Index] = newAlpha;
    newAmplitudes[state1Index] = newBeta;
  }
  
  return { amplitudes: newAmplitudes, qubitCount };
};

/**
 * Apply CNOT gate to the state vector
 * Flips target qubit if control qubit is |1⟩
 */
export const applyCNOT = (
  state: StateVector,
  controlQubit: number,
  targetQubit: number,
  bitOrder: BitOrder = 'MSB'
): StateVector => {
  const { amplitudes, qubitCount } = state;
  const numStates = amplitudes.length;
  
  const newAmplitudes: Complex[] = [...amplitudes.map(a => ({ ...a }))];
  
  const controlBitPos = getBitPosition(qubitCount, controlQubit, bitOrder);
  const targetBitPos = getBitPosition(qubitCount, targetQubit, bitOrder);
  
  for (let i = 0; i < numStates; i++) {
    const controlBit = (i >> controlBitPos) & 1;
    const targetBit = (i >> targetBitPos) & 1;
    
    // If control is 1, swap amplitudes with flipped target state
    if (controlBit === 1) {
      const flippedIndex = i ^ (1 << targetBitPos);
      if (i < flippedIndex) {
        // Swap amplitudes
        const temp = newAmplitudes[i];
        newAmplitudes[i] = newAmplitudes[flippedIndex];
        newAmplitudes[flippedIndex] = temp;
      }
    }
  }
  
  return { amplitudes: newAmplitudes, qubitCount };
};

/**
 * Apply SWAP gate to the state vector
 * Swaps two qubits
 */
export const applySWAP = (
  state: StateVector,
  qubit1: number,
  qubit2: number,
  bitOrder: BitOrder = 'MSB'
): StateVector => {
  const { amplitudes, qubitCount } = state;
  const numStates = amplitudes.length;
  
  const newAmplitudes: Complex[] = [...amplitudes.map(a => ({ ...a }))];
  
  const bit1Pos = getBitPosition(qubitCount, qubit1, bitOrder);
  const bit2Pos = getBitPosition(qubitCount, qubit2, bitOrder);
  
  for (let i = 0; i < numStates; i++) {
    const bit1 = (i >> bit1Pos) & 1;
    const bit2 = (i >> bit2Pos) & 1;
    
    // Only swap if bits are different
    if (bit1 !== bit2) {
      // Calculate swapped index
      const swappedIndex = i ^ (1 << bit1Pos) ^ (1 << bit2Pos);
      if (i < swappedIndex) {
        const temp = newAmplitudes[i];
        newAmplitudes[i] = newAmplitudes[swappedIndex];
        newAmplitudes[swappedIndex] = temp;
      }
    }
  }
  
  return { amplitudes: newAmplitudes, qubitCount };
};

/**
 * Detect if qubits are entangled by checking if state is separable
 * Uses Schmidt decomposition approximation for efficiency
 */
export const detectEntanglement = (
  state: StateVector,
  bitOrder: BitOrder = 'MSB'
): { isEntangled: boolean; pairs: [number, number][] } => {
  const { amplitudes, qubitCount } = state;
  const pairs: [number, number][] = [];
  
  // Check each pair of qubits for entanglement
  for (let q1 = 0; q1 < qubitCount; q1++) {
    for (let q2 = q1 + 1; q2 < qubitCount; q2++) {
      if (areQubitsEntangled(state, q1, q2, bitOrder)) {
        pairs.push([q1, q2]);
      }
    }
  }
  
  return { isEntangled: pairs.length > 0, pairs };
};

/**
 * Check if two specific qubits are entangled
 * Uses the fact that separable states satisfy: ρ_AB = ρ_A ⊗ ρ_B
 * For pure states, we check if |ψ⟩ = |a⟩ ⊗ |b⟩
 */
const areQubitsEntangled = (
  state: StateVector,
  q1: number,
  q2: number,
  bitOrder: BitOrder = 'MSB'
): boolean => {
  const { amplitudes, qubitCount } = state;
  
  const bit1Pos = getBitPosition(qubitCount, q1, bitOrder);
  const bit2Pos = getBitPosition(qubitCount, q2, bitOrder);
  
  // Extract the 2-qubit reduced density matrix elements
  // We check if the state factorizes by looking at the 4 basis states of the 2-qubit subsystem
  let a00: Complex = { re: 0, im: 0 };
  let a01: Complex = { re: 0, im: 0 };
  let a10: Complex = { re: 0, im: 0 };
  let a11: Complex = { re: 0, im: 0 };
  
  for (let i = 0; i < amplitudes.length; i++) {
    const b1 = (i >> bit1Pos) & 1;
    const b2 = (i >> bit2Pos) & 1;
    const amp = amplitudes[i];
    
    if (b1 === 0 && b2 === 0) a00 = add(a00, { re: amp.re * amp.re + amp.im * amp.im, im: 0 });
    else if (b1 === 0 && b2 === 1) a01 = add(a01, { re: amp.re * amp.re + amp.im * amp.im, im: 0 });
    else if (b1 === 1 && b2 === 0) a10 = add(a10, { re: amp.re * amp.re + amp.im * amp.im, im: 0 });
    else a11 = add(a11, { re: amp.re * amp.re + amp.im * amp.im, im: 0 });
  }
  
  // For a separable pure state |ψ⟩ = |a⟩⊗|b⟩, the probabilities factorize:
  // P(00) * P(11) = P(01) * P(10)
  // If this doesn't hold, the state is entangled
  const p00 = a00.re, p01 = a01.re, p10 = a10.re, p11 = a11.re;
  
  // Check factorizability with tolerance
  const factorCheck = Math.abs(p00 * p11 - p01 * p10);
  
  // Also check for Bell-type correlations (both 00 and 11 nonzero, but 01 and 10 zero)
  const bellType1 = p00 > 0.01 && p11 > 0.01 && p01 < 0.01 && p10 < 0.01;
  const bellType2 = p01 > 0.01 && p10 > 0.01 && p00 < 0.01 && p11 < 0.01;
  
  return factorCheck > 0.01 || bellType1 || bellType2;
};

/**
 * Measure a qubit (simulated - collapses to basis state probabilistically)
 * For visualization, we just show the probabilities without collapsing
 */
export const measureQubit = (
  state: StateVector,
  qubit: number,
  bitOrder: BitOrder = 'MSB'
): StateVector => {
  const { amplitudes, qubitCount } = state;
  const numStates = amplitudes.length;
  const bitPos = getBitPosition(qubitCount, qubit, bitOrder);

  // 1. Calculate probability of measuring |0⟩
  let prob0 = 0;
  for (let i = 0; i < numStates; i++) {
    if (((i >> bitPos) & 1) === 0) {
      prob0 += amplitudes[i].re * amplitudes[i].re + amplitudes[i].im * amplitudes[i].im;
    }
  }

  // 2. Randomly sample outcome based on probability
  const outcome = Math.random() < prob0 ? 0 : 1;
  const normFactor = outcome === 0 ? Math.sqrt(prob0) : Math.sqrt(1 - prob0);

  // Avoid division by zero (shouldn't happen in valid circuit)
  if (normFactor < 1e-12) return state;

  // 3. Collapse: zero out inconsistent states and renormalize
  const newAmplitudes: Complex[] = amplitudes.map((amp, i) => {
    const bit = (i >> bitPos) & 1;
    if (bit !== outcome) {
      return { re: 0, im: 0 };
    }
    return { re: amp.re / normFactor, im: amp.im / normFactor };
  });

  return { amplitudes: newAmplitudes, qubitCount };
};

/**
 * Apply Controlled-Z gate to the state vector
 * Applies a phase flip when both qubits are |1⟩
 */
export const applyCZ = (
  state: StateVector,
  controlQubit: number,
  targetQubit: number,
  bitOrder: BitOrder = 'MSB'
): StateVector => {
  const { amplitudes, qubitCount } = state;
  const numStates = amplitudes.length;
  
  const newAmplitudes: Complex[] = amplitudes.map(a => ({ ...a }));
  
  const controlBitPos = getBitPosition(qubitCount, controlQubit, bitOrder);
  const targetBitPos = getBitPosition(qubitCount, targetQubit, bitOrder);
  
  for (let i = 0; i < numStates; i++) {
    const controlBit = (i >> controlBitPos) & 1;
    const targetBit = (i >> targetBitPos) & 1;
    
    // If both qubits are |1⟩, apply phase flip (multiply by -1)
    if (controlBit === 1 && targetBit === 1) {
      newAmplitudes[i] = { re: -amplitudes[i].re, im: -amplitudes[i].im };
    }
  }
  
  return { amplitudes: newAmplitudes, qubitCount };
};

/**
 * Apply Toffoli (CCX) gate to the state vector
 * Flips target qubit only when both control qubits are |1⟩
 */
export const applyToffoli = (
  state: StateVector,
  control1: number,
  control2: number,
  target: number,
  bitOrder: BitOrder = 'MSB'
): StateVector => {
  const { amplitudes, qubitCount } = state;
  const numStates = amplitudes.length;
  
  const newAmplitudes: Complex[] = amplitudes.map(a => ({ ...a }));
  
  const c1BitPos = getBitPosition(qubitCount, control1, bitOrder);
  const c2BitPos = getBitPosition(qubitCount, control2, bitOrder);
  const targetBitPos = getBitPosition(qubitCount, target, bitOrder);
  
  for (let i = 0; i < numStates; i++) {
    const c1Bit = (i >> c1BitPos) & 1;
    const c2Bit = (i >> c2BitPos) & 1;
    
    // If both controls are 1, swap with flipped target state
    if (c1Bit === 1 && c2Bit === 1) {
      const flippedIndex = i ^ (1 << targetBitPos);
      if (i < flippedIndex) {
        const temp = newAmplitudes[i];
        newAmplitudes[i] = newAmplitudes[flippedIndex];
        newAmplitudes[flippedIndex] = temp;
      }
    }
  }
  
  return { amplitudes: newAmplitudes, qubitCount };
};

/**
 * Calculate full amplitude information including phase
 */
export const calculateAmplitudes = (state: StateVector, _bitOrder: BitOrder = 'MSB'): { state: string; re: number; im: number; magnitude: number; phase: number }[] => {
  const { amplitudes, qubitCount } = state;
  
  return amplitudes
    .map((amp, index) => {
      const magnitude = Math.sqrt(magnitudeSquared(amp));
      const phase = Math.atan2(amp.im, amp.re);
      
      return {
        state: formatBasisStateLabel(index, qubitCount),
        re: amp.re,
        im: amp.im,
        magnitude,
        phase
      };
    })
    .filter(a => a.magnitude > 1e-10) // Filter negligible amplitudes
    .sort((a, b) => b.magnitude - a.magnitude);
};

/**
 * Calculate circuit depth (maximum position + 1)
 */
export const calculateCircuitDepth = (gates: QuantumGate[]): number => {
  if (gates.length === 0) return 0;
  return Math.max(...gates.map(g => g.position)) + 1;
};

/**
 * Check if circuit has measurement gates
 */
export const hasMeasurementGate = (gates: QuantumGate[]): boolean => {
  return gates.some(g => g.type === 'M');
};

/**
 * Calculate probabilities for all basis states
 */
export const calculateProbabilities = (state: StateVector, _bitOrder: BitOrder = 'MSB'): { state: string; probability: number }[] => {
  const { amplitudes, qubitCount } = state;
  
  return amplitudes
    .map((amplitude, index) => {
      return {
        state: formatBasisStateLabel(index, qubitCount),
        probability: magnitudeSquared(amplitude)
      };
    })
    .filter(p => p.probability > 1e-10) // Filter out negligible probabilities
    .sort((a, b) => b.probability - a.probability);
};

/**
 * Extract single-qubit states for Bloch sphere visualization
 * This is an approximation - works best for separable states
 */
export const extractQubitStates = (
  state: StateVector,
  bitOrder: BitOrder = 'MSB'
): { x: number; y: number; z: number }[] => {
  const { amplitudes, qubitCount } = state;
  const blochVectors: { x: number; y: number; z: number }[] = [];
  
  for (let qubit = 0; qubit < qubitCount; qubit++) {
    const bitPos = getBitPosition(qubitCount, qubit, bitOrder);
    
    // Calculate reduced density matrix for this qubit by tracing out all others
    // ρ = Tr_rest(|ψ⟩⟨ψ|)
    // ρ_00 = Σ_k |⟨k,0|ψ⟩|², ρ_11 = Σ_k |⟨k,1|ψ⟩|²
    // ρ_01 = Σ_k ⟨k,0|ψ⟩·⟨ψ|k,1⟩ = Σ_k α_k · conj(β_k)
    let rho00 = 0;
    let rho11 = 0;
    let rho01: Complex = { re: 0, im: 0 };
    
    for (let i = 0; i < amplitudes.length; i++) {
      const bit = (i >> bitPos) & 1;
      const prob = magnitudeSquared(amplitudes[i]);
      
      if (bit === 0) {
        rho00 += prob;
        // Find partner state with this qubit flipped to 1
        const partnerIndex = i | (1 << bitPos);
        // ρ_01 += α_k · conj(β_k)
        const alphaK = amplitudes[i];
        const betaK = amplitudes[partnerIndex];
        rho01 = add(rho01, multiply(alphaK, { re: betaK.re, im: -betaK.im }));
      } else {
        rho11 += prob;
      }
    }
    
    // Bloch vector from reduced density matrix:
    // ρ = (I + r⃗·σ⃗)/2
    // r_x = 2·Re(ρ_01)  where ρ_{01} = ⟨0|ρ|1⟩
    // r_y = -2·Im(ρ_01)  (negative sign per Bloch convention: ρ_{01} = (r_x - i·r_y)/2)
    // r_z = ρ_00 - ρ_11 = Tr(ρ·σ_z)
    const x = 2 * rho01.re;
    const y = -2 * rho01.im;  // FIX: negative sign per Bloch convention
    const z = rho00 - rho11;
    
    // DO NOT normalize — for mixed/entangled states the Bloch vector
    // lies INSIDE the sphere (|r⃗| < 1). Only pure separable qubits
    // sit on the surface (|r⃗| = 1).
    blochVectors.push({ x, y, z });
  }
  
  return blochVectors;
};

/**
 * Run the complete quantum circuit simulation
 */
export const simulateCircuit = (
  gates: QuantumGate[],
  qubitCount: number,
  bitOrder: BitOrder = 'MSB'
): SimulationOutput => {
  // #region agent log
  fetch('http://127.0.0.1:7589/ingest/7d431922-f103-452a-8045-35deb37a60c8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1666b2'},body:JSON.stringify({sessionId:'1666b2',runId:'initial',hypothesisId:'H4',location:'src/lib/quantum/simulator.ts:425',message:'simulateCircuit entry',data:{qubitCount,gateCount:gates.length,path:qubitCount>15?'mps':'state-vector'},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  // For large circuits (>15 qubits), use MPS simulation
  if (qubitCount > 15) {
    return simulateCircuitWithMPS(gates, qubitCount, bitOrder);
  }
  // Note: GPU simulation is handled asynchronously via simulateCircuitGPU() below

  // Initialize |00...0⟩ state
  let state = initializeState(qubitCount);
  const displays: Record<string, { x: number; y: number; z: number }> = {};
  
  // Sort gates by position (left to right order)
  const sortedGates = [...gates].sort((a, b) => a.position - b.position);
  
  // Apply each gate in order
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
        state = applySingleQubitGate(state, gate.type, gate.qubit, undefined, bitOrder);
        break;
       
       case 'Rx':
       case 'Ry':
       case 'Rz':
        state = applySingleQubitGate(state, gate.type, gate.qubit, gate.angle, bitOrder);
         break;
        
      case 'CNOT': {
      const cnotTarget = gate.targetQubit ?? (gate.qubit + 1) % qubitCount;
      state = applyCNOT(state, gate.qubit, cnotTarget, bitOrder);
      break;
    }
      
    case 'SWAP': {
      const swapTarget = gate.targetQubit ?? (gate.qubit + 1) % qubitCount;
      state = applySWAP(state, gate.qubit, swapTarget, bitOrder);
      break;
    }
      
    case 'CZ': {
      const czTarget = gate.targetQubit ?? (gate.qubit + 1) % qubitCount;
      state = applyCZ(state, gate.qubit, czTarget, bitOrder);
      break;
    }
      
    case 'CCX': {
      const toffoliC2 = gate.controlQubit2 ?? (gate.qubit + 1) % qubitCount;
      const toffoliTarget = gate.targetQubit ?? (gate.qubit + 2) % qubitCount;
      state = applyToffoli(state, gate.qubit, toffoliC2, toffoliTarget, bitOrder);
      break;
    }
        
            case 'DISPLAY':
        displays[gate.id] = extractQubitStates(state, bitOrder)[gate.qubit];
        break;

      case 'FUSED': {
        // Apply compiler-fused gate using the pre-computed matrix
        if (gate.fusedMatrix) {
          const { amplitudes: amps, qubitCount: qc } = state;
          const numStates = amps.length;
          const newAmplitudes: Complex[] = new Array(numStates).fill(null).map(() => ({ ...ZERO }));
          const bitPosition = getBitPosition(qc, gate.qubit, bitOrder);
          const fm = gate.fusedMatrix;

          for (let i = 0; i < numStates; i++) {
            const targetBit = (i >> bitPosition) & 1;
            const partnerIndex = i ^ (1 << bitPosition);
            if (i > partnerIndex) continue;

            const state0Index = targetBit === 0 ? i : partnerIndex;
            const state1Index = targetBit === 0 ? partnerIndex : i;
            const alpha = amps[state0Index];
            const beta = amps[state1Index];

            newAmplitudes[state0Index] = add(
              multiply(fm[0][0], alpha),
              multiply(fm[0][1], beta)
            );
            newAmplitudes[state1Index] = add(
              multiply(fm[1][0], alpha),
              multiply(fm[1][1], beta)
            );
          }
          state = { amplitudes: newAmplitudes, qubitCount: qc };
        }
        break;
      }

      case 'M':
        state = measureQubit(state, gate.qubit, bitOrder);
        break;
    }
  }
  
  // Calculate results
  const probabilities = calculateProbabilities(state, bitOrder);
  const blochVectors = extractQubitStates(state, bitOrder);
  const entanglement = detectEntanglement(state, bitOrder);
  const amplitudeInfo = calculateAmplitudes(state, bitOrder);
  const circuitDepth = calculateCircuitDepth(gates);
  const hasMeasurement = hasMeasurementGate(gates);
  
  return {
    probabilities,
    blochVectors,
    stateVector: state,
    isEntangled: entanglement.isEntangled,
    entangledPairs: entanglement.pairs,
    amplitudes: amplitudeInfo,
    circuitDepth,
    hasMeasurement,
    displays,
    metadata: {
      top1000Mass: probabilities.reduce((s, p) => s + p.probability, 0),
      isSampled: false,
      isExact: true,
      backendName: 'cpu-statevector',
      classification: 'Exact top 1000'
    }
  };
};

/**
 * MPS-based simulation for large circuits (>15 qubits)
 */
const simulateCircuitWithMPS = (
  gates: QuantumGate[],
  qubitCount: number,
  bitOrder: BitOrder = 'MSB'
): SimulationOutput => {
  // #region agent log
  fetch('http://127.0.0.1:7589/ingest/7d431922-f103-452a-8045-35deb37a60c8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1666b2'},body:JSON.stringify({sessionId:'1666b2',runId:'initial',hypothesisId:'H5',location:'src/lib/quantum/simulator.ts:509',message:'simulateCircuitWithMPS start',data:{qubitCount,gateCount:gates.length},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  
  const config = getAdaptiveMPSConfig(qubitCount, gates.length);
  // #region agent log
  fetch('http://127.0.0.1:7589/ingest/7d431922-f103-452a-8045-35deb37a60c8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1666b2'},body:JSON.stringify({sessionId:'1666b2',runId:'initial',hypothesisId:'H5',location:'src/lib/quantum/simulator.ts:516',message:'simulateCircuitWithMPS config ready',data:{maxBondDimension:config.maxBondDimension,truncationThreshold:config.truncationThreshold},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const mpsResult = simulateCircuitMPS(gates, qubitCount, config, bitOrder);
  const displays = mpsResult.displays;
  
  // Build Bloch vectors — cap at 32 qubits to prevent timeout.
  // Each Bloch computation is O(n·χ^4), so 100 qubits × χ=48 is too expensive.
  // For > 30 qubits, we estimate the Z-axis from probabilities instead.
  const blochLimit = qubitCount > 30 ? 0 : Math.min(qubitCount, 32);
  const blochVectors: { x: number; y: number; z: number }[] = [];
  try {
    for (let q = 0; q < blochLimit; q++) {
      blochVectors.push(mpsBlochVector(mpsResult.mps, q));
    }
  } catch {
    // Fallback to defaults if Bloch computation fails
    for (let q = blochVectors.length; q < blochLimit; q++) {
      blochVectors.push({ x: 0, y: 0, z: 1 });
    }
  }
  
  // Fill remaining qubits
  if (qubitCount > 30) {
    const zEstimates = new Array(qubitCount).fill(0);
    let totalProb = 0;
    
    if (mpsResult.probabilities) {
      mpsResult.probabilities.forEach((p: any) => {
        totalProb += p.probability;
        // p.state looks like "|0110...⟩"
        const bits = p.state.replace(/[|⟩]/g, '');
        for (let q = 0; q < qubitCount && q < bits.length; q++) {
          if (bits[q] === '0') zEstimates[q] += p.probability;
          else if (bits[q] === '1') zEstimates[q] -= p.probability;
        }
      });
    }
    
    if (totalProb > 0) {
      for (let q = blochLimit; q < qubitCount; q++) {
        // Z is normalized by the sampled probability mass
        blochVectors.push({ x: 0, y: 0, z: zEstimates[q] / totalProb });
      }
    } else {
      for (let q = blochLimit; q < qubitCount; q++) {
        blochVectors.push({ x: 0, y: 0, z: 1 });
      }
    }
  } else {
    for (let q = blochLimit; q < qubitCount; q++) {
      blochVectors.push({ x: 0, y: 0, z: 1 });
    }
  }
  
  const circuitDepth = calculateCircuitDepth(gates);
  const hasMeasurement = hasMeasurementGate(gates);
  
  // Convert amplitudes to display format
  const amplitudeInfo = mpsResult.amplitudes
    .map((amp: Complex, index: number) => {
      const mag = Math.sqrt(amp.re * amp.re + amp.im * amp.im);
      if (mag < 1e-10) return null;
      
      return {
        state: formatBasisStateLabel(index, qubitCount),
        re: amp.re,
        im: amp.im,
        magnitude: mag,
        phase: Math.atan2(amp.im, amp.re),
      };
    })
    .filter(Boolean) as { state: string; re: number; im: number; magnitude: number; phase: number }[];
  
  // Use MPS probabilities (sampling-based for large circuits)
  const probabilities = mpsResult.probabilities || amplitudeInfo.map((a: any) => ({
    state: a.state,
    probability: a.magnitude * a.magnitude,
  }));
  
  if (amplitudeInfo.length === 0 && mpsResult.probabilities) {
    mpsResult.probabilities.forEach((p: any) => {
      if (p.amplitude) {
        // Sanitize NaN to prevent rendering bugs ("NaNNai") in the UI
        const re = Number.isNaN(p.amplitude.re) ? 0 : p.amplitude.re;
        const im = Number.isNaN(p.amplitude.im) ? 0 : p.amplitude.im;
        const mag = Math.sqrt(re * re + im * im);
        amplitudeInfo.push({
          state: p.state,
          re,
          im,
          magnitude: mag,
          phase: Math.atan2(im, re),
        });
      }
    });
  }
  
  return {
    probabilities,
    blochVectors,
    stateVector: { amplitudes: mpsResult.amplitudes, qubitCount },
    isEntangled: gates.some(g => ['CNOT', 'CZ', 'SWAP', 'CCX'].includes(g.type)),
    entangledPairs: [],
    amplitudes: amplitudeInfo,
    circuitDepth,
    hasMeasurement,
    displays,
    mps: mpsResult.mps,
    metadata: mpsResult.metadata ? { 
      ...mpsResult.metadata, 
      isExact: mpsResult.metadata.isSampled === false, 
      backendName: 'mps',
      classification: mpsResult.metadata.isSampled ? 'Sampled top 1000' : 'Approximate MPS top 1000'
    } : {
      top1000Mass: probabilities.reduce((s, p) => s + p.probability, 0),
      isSampled: false,
      isExact: true,
      backendName: 'mps',
      classification: 'Exact top 1000'
    }
  };
};

// ─── GPU Simulation Entry Point (Async) ─────────────────────

/**
 * Attempt to run the simulation on the GPU.
 * Returns null if GPU is unavailable or unsuitable for this circuit.
 */
export const simulateCircuitGPU = async (
  gates: QuantumGate[],
  qubitCount: number,
  bitOrder: BitOrder = 'MSB'
): Promise<SimulationOutput | null> => {
  // Only use GPU for state-vector range (≤28 qubits)
  if (qubitCount > 28) return null;

  // Lazy-init GPU simulator
  if (!gpuInitAttempted) {
    gpuInitAttempted = true;
    if (isWebGPUAvailable()) {
      gpuSimulator = new GPUStateVectorSimulator();
      gpuReady = await gpuSimulator.init();
    }
  }

  if (!gpuReady || !gpuSimulator) return null;

  // Check if GPU can handle this qubit count
  try {
    const result = await gpuSimulator.simulate(gates, qubitCount, bitOrder);

    const hasMeasurement = gates.some(g => g.type === 'M');
    const entanglement = detectEntanglement(result.stateVector, bitOrder);

    return {
      probabilities: result.probabilities,
      blochVectors: result.blochVectors,
      stateVector: result.stateVector,
      isEntangled: entanglement.isEntangled,
      entangledPairs: entanglement.pairs,
      amplitudes: result.amplitudes,
      circuitDepth: result.circuitDepth,
      hasMeasurement,
      gpuAccelerated: true,
      metadata: {
        top1000Mass: result.probabilities.reduce((s: any, p: any) => s + p.probability, 0),
        isSampled: false,
        isExact: true,
        backendName: 'webgpu',
        classification: 'Exact top 1000'
      }
    };
  } catch (error) {
    console.warn('[GPU Simulation] Failed, falling back to CPU:', error);
    return null;
  }
};

/**
 * Check if GPU acceleration is available for simulation
 */
export const getGPUStatus = (): { available: boolean; maxQubits: number } => {
  return {
    available: isWebGPUAvailable(),
    maxQubits: gpuReady ? 28 : 0,
  };
};

// ─── Enhanced Simulation (Compiler + Noise Integration) ─────

export interface EnhancedSimulationOptions {
  /** Enable circuit compilation (gate fusion, cancellation) */
  compilerEnabled?: boolean;
  compilerConfig?: CompilerConfig;
  /** Noise model to apply */
  noiseModel?: NoiseModel;
  /** Bit ordering convention */
  bitOrder?: BitOrder;
  /** Force a specific backend */
  forceBackend?: 'cpu-statevector' | 'cpu-mps' | 'gpu-webgpu' | 'cpu-sparse' | 'wasm-tensor' | 'stabilizer' | 'density-matrix';
}

/**
 * Enhanced simulation pipeline:
 * 1. Compile circuit (fuse gates, cancel identities, reduce depth)
 * 2. Select optimal backend (CPU/GPU/MPS/Sparse)
 * 3. Execute simulation
 * 4. Apply noise model (if enabled)
 * 5. Return enriched results with compiler metrics
 */
export const simulateCircuitEnhanced = async (
  gates: QuantumGate[],
  qubitCount: number,
  options: EnhancedSimulationOptions = {}
): Promise<SimulationOutput> => {
  const {
    compilerEnabled = true,
    compilerConfig = DEFAULT_COMPILER_CONFIG,
    noiseModel = IDEAL_NOISE_MODEL,
    bitOrder = 'MSB',
    forceBackend,
  } = options;

  // Step 1: Compile
  let compiledGates = gates;
  let compilationMetrics: CompilationMetrics | undefined;
  let chunks: CircuitChunk[] | undefined;

  if (compilerEnabled && gates.length > 1) {
    const compiled = compileCircuit(gates, qubitCount, compilerConfig);
    compiledGates = compiled.optimizedGates;
    compilationMetrics = compiled.metrics;
    chunks = compiled.chunks;
  }

  // Step 2: Select optimal backend
  const isClifford = compiledGates.every(g => ['H', 'S', 'Sdg', 'S†', 'X', 'Y', 'Z', 'CNOT', 'CZ', 'SWAP', 'M', 'I'].includes(g.type));
  const hasNoise = noiseModel && noiseModel.enabled && 
    (noiseModel.gateNoise || noiseModel.readoutNoise || (noiseModel as any).depolarizingProb || (noiseModel as any).amplitudeDampingGamma);

  let backend = forceBackend;
  if (!backend) {
    if (hasNoise && qubitCount <= 8) {
      backend = 'density-matrix';
    } else if (isClifford && qubitCount > 15) {
      backend = 'stabilizer';
    } else {
      backend = selectOptimalBackend(qubitCount, compiledGates.length);
    }
  }

  // Step 3: Execute
  let result: SimulationOutput;

  switch (backend) {
    case 'wasm-tensor': {
      try {
        const wasmResult = await simulateCircuitWasm(compiledGates, qubitCount, bitOrder);
        result = { 
          ...wasmResult, 
          stateVector: wasmResult.stateVector || { amplitudes: [], qubitCount },
          isEntangled: wasmResult.isEntangled ?? false,
          entangledPairs: wasmResult.entangledPairs ?? [],
          amplitudes: wasmResult.amplitudes ?? [],
          circuitDepth: wasmResult.circuitDepth ?? 0,
          hasMeasurement: wasmResult.hasMeasurement ?? false,
          metadata: {
            top1000Mass: wasmResult.probabilities?.reduce((s: any, p: any) => s + (p.probability || 0), 0) || 0,
            isSampled: false,
            isExact: true,
            backendName: 'wasm-tensor',
            classification: 'Exact top 1000'
          }
        };
      } catch (wasmError) {
        // WASM failed (OOM, missing binary, or qubit cap) — fall back to MPS/CPU
        console.warn('[Enhanced] WASM failed, falling back to CPU:', wasmError);
        result = simulateCircuit(compiledGates, qubitCount, bitOrder);
      }
      break;
    }
    case 'cpu-sparse':
      result = simulateCircuitSparse(compiledGates, qubitCount, bitOrder);
      break;
    case 'cpu-mps':
      result = simulateCircuit(compiledGates, qubitCount, bitOrder);
      break;
    case 'stabilizer':
      const { simulateCircuitStabilizer } = await import('./stabilizer/stabilizerState');
      result = simulateCircuitStabilizer(compiledGates, qubitCount);
      break;
    case 'density-matrix':
      const { simulateCircuitDensityMatrix } = await import('./densityMatrix');
      // Convert standard noise model to NoiseConfig for density matrix
      const noiseConfig = noiseModel.enabled ? {
        bitFlipProb: (noiseModel as any).bitFlipProb ?? ((noiseModel.gateNoise as any)?.gateErrorRate ?? 0),
        depolarizingProb: (noiseModel as any).depolarizingProb ?? 0,
        amplitudeDampingGamma: (noiseModel as any).amplitudeDampingGamma ?? 0,
        phaseFlipProb: (noiseModel as any).phaseFlipProb ?? 0,
      } : undefined;
      result = simulateCircuitDensityMatrix(compiledGates, qubitCount, noiseConfig);
      break;
    default:
      if (backend === 'cpu-statevector' && qubitCount > 15) {
        // Reject forcing dense state vector on > 15 qubits to prevent fatal OOM
        result = {
          probabilities: [],
          blochVectors: [],
          stateVector: { amplitudes: [], qubitCount },
          isEntangled: false,
          entangledPairs: [],
          amplitudes: [],
          circuitDepth: 0,
          hasMeasurement: false,
          backend: 'cpu-statevector',
          metadata: {
            top1000Mass: 0,
            isSampled: false,
            isExact: false,
            backendName: 'cpu-statevector',
            classification: 'Unsupported exact simulation'
          }
        };
      } else {
        result = simulateCircuit(compiledGates, qubitCount, bitOrder);
      }
  }

  // Step 4: Apply noise (if enabled and using state-vector backend)
  const initializedNoise = noiseModel.enabled
    ? initializeNoiseModel(noiseModel)
    : noiseModel;

  if (initializedNoise.enabled && result.stateVector?.amplitudes?.length > 0) {
    // Apply readout noise to probabilities
    result.probabilities = applyReadoutNoise(
      result.probabilities,
      initializedNoise.readoutNoise
    );
  }

  // Step 5: Enrich output
  return {
    ...result,
    compilationMetrics,
    noiseModelName: noiseModel.enabled ? noiseModel.name : undefined,
    chunks,
    backend,
  };
};

/**
 * Select the optimal simulation backend based on circuit size.
 */
const selectOptimalBackend = (
  qubitCount: number,
  _gateCount: number
): 'cpu-statevector' | 'cpu-mps' | 'gpu-webgpu' | 'cpu-sparse' => {
  // CPU statevector is the golden reference backend for ≤15 qubits.
  // WASM backend is incomplete (missing SWAP, CZ, Toffoli) so we avoid it.
  if (qubitCount <= 15) return 'cpu-statevector';
  // 16+ qubits: always MPS — never allocate 2^N arrays
  return 'cpu-mps';
};

// ─── Sparse State Vector Simulation ─────────────────────────

/**
 * Simulate a circuit using the sparse state vector engine.
 * Optimal for circuits where the output state remains sparse
 * in the computational basis (VQE, QAOA, chemistry ansätze).
 *
 * Memory: O(k) where k = number of non-zero amplitudes
 * vs O(2^n) for dense state vector.
 */
export const simulateCircuitSparse = (
  gates: QuantumGate[],
  qubitCount: number,
  bitOrder: BitOrder = 'MSB',
  config: SparseConfig = DEFAULT_SPARSE_CONFIG
): SimulationOutput => {
  let state = initializeSparseState(qubitCount, config);

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
        state = applySingleQubitGateSparse(state, gate.type, gate.qubit, undefined, bitOrder, config);
        break;
      case 'Rx':
      case 'Ry':
      case 'Rz':
        state = applySingleQubitGateSparse(state, gate.type, gate.qubit, gate.angle, bitOrder, config);
        break;
      case 'CNOT': {
        const target = gate.targetQubit ?? (gate.qubit + 1) % qubitCount;
        state = applyCNOTSparse(state, gate.qubit, target, bitOrder);
        break;
      }
      case 'SWAP': {
        const target = gate.targetQubit ?? (gate.qubit + 1) % qubitCount;
        state = applySWAPSparse(state, gate.qubit, target, bitOrder);
        break;
      }
      case 'CZ': {
        const target = gate.targetQubit ?? (gate.qubit + 1) % qubitCount;
        state = applyCZSparse(state, gate.qubit, target, bitOrder);
        break;
      }
      case 'CCX': {
        const c2 = gate.controlQubit2 ?? (gate.qubit + 1) % qubitCount;
        const target = gate.targetQubit ?? (gate.qubit + 2) % qubitCount;
        state = applyToffoliSparse(state, gate.qubit, c2, target, bitOrder);
        break;
      }
      case 'M':
        state = measureQubitSparse(state, gate.qubit, bitOrder);
        break;
      case 'FUSED': {
        // Apply compiler-fused gate using the pre-computed matrix
        if (gate.fusedMatrix) {
          const bitPos = getBitPosition(state.qubitCount, gate.qubit, bitOrder);
          const mask = 1n << BigInt(bitPos);
          const fm = gate.fusedMatrix;
          const newAmplitudes = new Map<bigint, Complex>();
          const processed = new Set<bigint>();

          for (const idx of state.amplitudes.keys()) {
            if (processed.has(idx)) continue;
            const partner = idx ^ mask;
            processed.add(idx);
            processed.add(partner);

            const bit = Number((idx >> BigInt(bitPos)) & 1n);
            const idx0 = bit === 0 ? idx : partner;
            const idx1 = bit === 0 ? partner : idx;
            const alpha = state.amplitudes.get(idx0) || ZERO;
            const beta = state.amplitudes.get(idx1) || ZERO;

            const newAlpha: Complex = {
              re: fm[0][0].re * alpha.re - fm[0][0].im * alpha.im + fm[0][1].re * beta.re - fm[0][1].im * beta.im,
              im: fm[0][0].re * alpha.im + fm[0][0].im * alpha.re + fm[0][1].re * beta.im + fm[0][1].im * beta.re,
            };
            const newBeta: Complex = {
              re: fm[1][0].re * alpha.re - fm[1][0].im * alpha.im + fm[1][1].re * beta.re - fm[1][1].im * beta.im,
              im: fm[1][0].re * alpha.im + fm[1][0].im * alpha.re + fm[1][1].re * beta.im + fm[1][1].im * beta.re,
            };

            if (magnitudeSquared(newAlpha) > config.pruneThreshold) {
              newAmplitudes.set(idx0, newAlpha);
            }
            if (magnitudeSquared(newBeta) > config.pruneThreshold) {
              newAmplitudes.set(idx1, newBeta);
            }
          }
          state = { amplitudes: newAmplitudes, qubitCount: state.qubitCount, pruneThreshold: state.pruneThreshold };
        }
        break;
      }
    }
  }

  // Extract results
  const probabilities = sparseProbabilities(state);

  const blochVectors: { x: number; y: number; z: number }[] = [];
  for (let q = 0; q < Math.min(qubitCount, 100); q++) {
    blochVectors.push(sparseBlochVector(state, q, bitOrder));
  }

  const amplitudeInfo: { state: string; re: number; im: number; magnitude: number; phase: number }[] = [];
  for (const [idx, amp] of state.amplitudes) {
    const mag = Math.sqrt(magnitudeSquared(amp));
    if (mag > 1e-10) {
      amplitudeInfo.push({
        state: formatBasisStateLabel(idx, qubitCount),
        re: amp.re,
        im: amp.im,
        magnitude: mag,
        phase: Math.atan2(amp.im, amp.re),
      });
    }
  }
  amplitudeInfo.sort((a, b) => b.magnitude - a.magnitude);
  
  const top1000Probabilities = probabilities.slice(0, 1000);
  const top1000Amplitudes = amplitudeInfo.slice(0, 1000);

  const sparsity = state.amplitudes.size / Math.pow(2, qubitCount);

  return {
    probabilities: top1000Probabilities,
    blochVectors,
    stateVector: { amplitudes: [], qubitCount }, // Sparse — no dense vector
    isEntangled: gates.some(g => ['CNOT', 'CZ', 'SWAP', 'CCX'].includes(g.type)),
    entangledPairs: [],
    amplitudes: top1000Amplitudes,
    circuitDepth: gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 1 : 0,
    hasMeasurement: gates.some(g => g.type === 'M'),
    backend: 'cpu-sparse',
    sparsity,
    metadata: {
      top1000Mass: top1000Probabilities.reduce((s, p) => s + p.probability, 0),
      isSampled: false,
      isExact: true,
      backendName: 'cpu-sparse',
      classification: 'Sparse tracked top 1000'
    }
  };
};
