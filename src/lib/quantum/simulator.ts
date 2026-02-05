/**
 * Quantum Circuit Simulator
 * Simulates quantum circuits with complex number amplitudes
 */

import { Complex, complex, ZERO, ONE, multiply, add, magnitudeSquared } from './complex';
import { getGateMatrix, applyGateToQubit, stateToBlochVector } from './gates';
import { QuantumGate } from '@/types/quantum';

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
  targetQubit: number
): StateVector => {
  const { amplitudes, qubitCount } = state;
  const numStates = amplitudes.length;
  const gate = getGateMatrix(gateType);
  
  const newAmplitudes: Complex[] = new Array(numStates).fill(null).map(() => ({ ...ZERO }));
  
  // For each basis state, calculate the new amplitude
  for (let i = 0; i < numStates; i++) {
    // Get the target qubit's bit value (0 or 1)
    // Qubits are numbered from left to right: q0 q1 q2 ... (most significant to least)
    const bitPosition = qubitCount - 1 - targetQubit;
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
  targetQubit: number
): StateVector => {
  const { amplitudes, qubitCount } = state;
  const numStates = amplitudes.length;
  
  const newAmplitudes: Complex[] = [...amplitudes.map(a => ({ ...a }))];
  
  const controlBitPos = qubitCount - 1 - controlQubit;
  const targetBitPos = qubitCount - 1 - targetQubit;
  
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
  qubit2: number
): StateVector => {
  const { amplitudes, qubitCount } = state;
  const numStates = amplitudes.length;
  
  const newAmplitudes: Complex[] = [...amplitudes.map(a => ({ ...a }))];
  
  const bit1Pos = qubitCount - 1 - qubit1;
  const bit2Pos = qubitCount - 1 - qubit2;
  
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
export const detectEntanglement = (state: StateVector): { isEntangled: boolean; pairs: [number, number][] } => {
  const { amplitudes, qubitCount } = state;
  const pairs: [number, number][] = [];
  
  // Check each pair of qubits for entanglement
  for (let q1 = 0; q1 < qubitCount; q1++) {
    for (let q2 = q1 + 1; q2 < qubitCount; q2++) {
      if (areQubitsEntangled(state, q1, q2)) {
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
const areQubitsEntangled = (state: StateVector, q1: number, q2: number): boolean => {
  const { amplitudes, qubitCount } = state;
  
  const bit1Pos = qubitCount - 1 - q1;
  const bit2Pos = qubitCount - 1 - q2;
  
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
export const measureQubit = (state: StateVector, qubit: number): StateVector => {
  // For now, measurement doesn't change the state
  // In a real simulator, this would collapse the state
  return state;
};

/**
 * Apply Controlled-Z gate to the state vector
 * Applies a phase flip when both qubits are |1⟩
 */
export const applyCZ = (
  state: StateVector,
  controlQubit: number,
  targetQubit: number
): StateVector => {
  const { amplitudes, qubitCount } = state;
  const numStates = amplitudes.length;
  
  const newAmplitudes: Complex[] = amplitudes.map(a => ({ ...a }));
  
  const controlBitPos = qubitCount - 1 - controlQubit;
  const targetBitPos = qubitCount - 1 - targetQubit;
  
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
  target: number
): StateVector => {
  const { amplitudes, qubitCount } = state;
  const numStates = amplitudes.length;
  
  const newAmplitudes: Complex[] = amplitudes.map(a => ({ ...a }));
  
  const c1BitPos = qubitCount - 1 - control1;
  const c2BitPos = qubitCount - 1 - control2;
  const targetBitPos = qubitCount - 1 - target;
  
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
export const calculateAmplitudes = (state: StateVector): { state: string; re: number; im: number; magnitude: number; phase: number }[] => {
  const { amplitudes, qubitCount } = state;
  
  return amplitudes
    .map((amp, index) => {
      const binaryStr = index.toString(2).padStart(qubitCount, '0');
      const magnitude = Math.sqrt(magnitudeSquared(amp));
      const phase = Math.atan2(amp.im, amp.re);
      
      return {
        state: `|${binaryStr}⟩`,
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
export const calculateProbabilities = (state: StateVector): { state: string; probability: number }[] => {
  const { amplitudes, qubitCount } = state;
  
  return amplitudes
    .map((amplitude, index) => {
      const binaryStr = index.toString(2).padStart(qubitCount, '0');
      return {
        state: `|${binaryStr}⟩`,
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
export const extractQubitStates = (state: StateVector): { x: number; y: number; z: number }[] => {
  const { amplitudes, qubitCount } = state;
  const blochVectors: { x: number; y: number; z: number }[] = [];
  
  for (let qubit = 0; qubit < qubitCount; qubit++) {
    const bitPos = qubitCount - 1 - qubit;
    
    // Calculate reduced density matrix for this qubit
    // Trace out all other qubits
    let alpha2 = 0; // |α|²
    let beta2 = 0;  // |β|²
    let alphaConjBeta: Complex = { re: 0, im: 0 }; // α*conj(β)
    
    for (let i = 0; i < amplitudes.length; i++) {
      const bit = (i >> bitPos) & 1;
      const prob = magnitudeSquared(amplitudes[i]);
      
      if (bit === 0) {
        alpha2 += prob;
      } else {
        beta2 += prob;
      }
    }
    
    // For mixed states, use simplified Bloch vector
    // z = α² - β² (population difference)
    const z = alpha2 - beta2;
    
    // For coherences (x, y), we need to look at pairs
    let coherence: Complex = { re: 0, im: 0 };
    for (let i = 0; i < amplitudes.length; i++) {
      const bit = (i >> bitPos) & 1;
      if (bit === 0) {
        const partnerIndex = i | (1 << bitPos);
        // α_i * conj(β_i)
        const aConj = { re: amplitudes[i].re, im: -amplitudes[i].im };
        const product = multiply(aConj, amplitudes[partnerIndex]);
        coherence = add(coherence, product);
      }
    }
    
    const x = 2 * coherence.re;
    const y = 2 * coherence.im;
    
    // Normalize to unit sphere (for visualization)
    const mag = Math.sqrt(x*x + y*y + z*z);
    if (mag > 0.01) {
      blochVectors.push({ x: x/mag, y: y/mag, z: z/mag });
    } else {
      blochVectors.push({ x: 0, y: 0, z: 1 }); // Default to |0⟩
    }
  }
  
  return blochVectors;
};

/**
 * Run the complete quantum circuit simulation
 */
export const simulateCircuit = (
  gates: QuantumGate[],
  qubitCount: number
): SimulationOutput => {
  // Initialize |00...0⟩ state
  let state = initializeState(qubitCount);
  
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
        state = applySingleQubitGate(state, gate.type, gate.qubit);
        break;
        
      case 'CNOT':
        // CNOT: gate.qubit is control, gate.targetQubit specifies target
        const cnotTarget = gate.targetQubit ?? (gate.qubit + 1) % qubitCount;
        state = applyCNOT(state, gate.qubit, cnotTarget);
        break;
        
      case 'SWAP':
        // For now, SWAP swaps with the next qubit
        const swapTarget = gate.targetQubit ?? (gate.qubit + 1) % qubitCount;
        state = applySWAP(state, gate.qubit, swapTarget);
        break;
        
      case 'CZ':
        // Controlled-Z: gate.qubit is control, targetQubit is target
        const czTarget = gate.targetQubit ?? (gate.qubit + 1) % qubitCount;
        state = applyCZ(state, gate.qubit, czTarget);
        break;
        
      case 'CCX':
        // Toffoli: gate.qubit is first control, controlQubit2 is second, targetQubit is target
        const toffoliC2 = gate.controlQubit2 ?? (gate.qubit + 1) % qubitCount;
        const toffoliTarget = gate.targetQubit ?? (gate.qubit + 2) % qubitCount;
        state = applyToffoli(state, gate.qubit, toffoliC2, toffoliTarget);
        break;
        
      case 'M':
        state = measureQubit(state, gate.qubit);
        break;
    }
  }
  
  // Calculate results
  const probabilities = calculateProbabilities(state);
  const blochVectors = extractQubitStates(state);
  const entanglement = detectEntanglement(state);
  const amplitudeInfo = calculateAmplitudes(state);
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
    hasMeasurement
  };
};
