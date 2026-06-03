/**
 * VQE (Variational Quantum Eigensolver) Optimizer
 * Implements classical optimization loop for molecular ground state finding
 */

import { QuantumGate } from '@/types/quantum';
import { simulateCircuit } from '@/lib/quantum/simulator';
import { BitOrder } from '@/lib/quantum/bitOrder';
import { MoleculeData } from './moleculeData';
import { getHamiltonian, calculatePauliExpectation, calculatePauliExpectationMPS } from './pauliHamiltonian';

// ─── Result Classification ──────────────────────────────────────────────────

/**
 * Classifies the source of a VQE energy value.
 *
 * - 'precomputed-hamiltonian': Energy computed via ⟨ψ|H|ψ⟩ using a literature-sourced,
 *   Jordan-Wigner mapped Pauli Hamiltonian (e.g. H₂, LiH, HeH⁺, BeH₂, H₂O, NH₃).
 * - 'heuristic-fallback': No Hamiltonian available for this molecule. Energy is an
 *   educational heuristic based on Hamming-weight scaling — NOT an ab initio result.
 * - 'generated-hamiltonian': (Future) Hamiltonian generated at runtime from integrals.
 */
export type EnergySource =
  | 'precomputed-hamiltonian'
  | 'heuristic-fallback'
  | 'generated-hamiltonian';

export interface HamiltonianInfo {
  mapping: string;
  basis: string;
  numTerms: number;
  nuclearRepulsion: number;
  fciEnergy: number;
  hfEnergy: number;
  activeSpace?: string;
}

export interface VQEParameters {
  theta: number[];
}

export interface VQEIteration {
  iteration: number;
  energy: number;
  parameters: number[];
}

export interface VQEResult {
  finalEnergy: number;
  finalParameters: number[];
  iterations: VQEIteration[];
  converged: boolean;
  totalIterations: number;
  energyError: number; // Difference from known ground state

  // ── Classification metadata (Priority 1) ──
  /** How was the energy value computed? */
  energySource: EnergySource;
  /** Present only when energySource is 'precomputed-hamiltonian' */
  hamiltonianInfo?: HamiltonianInfo;

  // ── Convergence diagnostics (Priority 6) ──
  /** Best energy found across ALL iterations (may differ from finalEnergy) */
  bestEnergy: number;
  /** Parameters at the best energy */
  bestParameters: number[];
  /** Approximate L2 norm of the gradient at the last iteration */
  gradientNorm?: number;
  /** Name of the classical optimizer used */
  optimizerType: 'gradient-descent-cfd';
}

export interface VQEConfig {
  maxIterations: number;
  convergenceThreshold: number;
  learningRate: number;
  gradientStep: number;
  maxGradientUpdatesPerIteration: number;
}

const DEFAULT_CONFIG: VQEConfig = {
  maxIterations: 50,
  convergenceThreshold: 1e-4,
  learningRate: 0.3,
  gradientStep: 0.01,
  maxGradientUpdatesPerIteration: 24,
};

/**
 * Generate parameterized ansatz gates for VQE
 * Returns gates with angles that can be updated during optimization
 */
export const generateParameterizedAnsatz = (
  molecule: MoleculeData,
  parameters: number[]
): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  const qubits = molecule.qubitsRequired;
  const depth = molecule.vqeDepth;
  
  let paramIndex = 0;
  const generateId = () => `vqe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Hartree-Fock state preparation (fill lowest energy spin-orbitals)
  const occupiedSpinOrbitals = Math.min(molecule.electrons, qubits);
  for (let i = 0; i < occupiedSpinOrbitals; i++) {
    gates.push({
      id: generateId(),
      type: 'X',
      qubit: i,
      position: 0,
    });
  }
  
  // Variational layers
  for (let layer = 0; layer < depth; layer++) {
    const pos = layer * 3 + 1;
    
    // Ry rotations
    for (let q = 0; q < qubits; q++) {
      gates.push({
        id: generateId(),
        type: 'Ry',
        qubit: q,
        position: pos,
        angle: parameters[paramIndex] ?? Math.PI / 4,
      });
      paramIndex++;
    }
    
    // Entangling CNOT ladder
    for (let q = 0; q < qubits - 1; q++) {
      gates.push({
        id: generateId(),
        type: 'CNOT',
        qubit: q,
        controlQubit: q,
        targetQubit: q + 1,
        position: pos + 1,
      });
    }
    
    // Rz rotations
    for (let q = 0; q < qubits; q++) {
      gates.push({
        id: generateId(),
        type: 'Rz',
        qubit: q,
        position: pos + 2,
        angle: parameters[paramIndex] ?? Math.PI / 3,
      });
      paramIndex++;
    }
  }
  
  return gates;
};

/**
 * Calculate the number of parameters needed for a molecule's ansatz
 */
export const getParameterCount = (molecule: MoleculeData): number => {
  const qubits = molecule.qubitsRequired;
  const depth = molecule.vqeDepth;
  // Each layer has: qubits Ry + qubits Rz = 2*qubits parameters
  return depth * 2 * qubits;
};

/**
 * Initialize parameters randomly around a starting point
 */
export const initializeParameters = (count: number): number[] => {
  return Array(count).fill(0).map(() => 
    (Math.random() - 0.5) * Math.PI
  );
};

/** Internal result from calculateEnergy including the source classification */
interface EnergyEvaluation {
  energy: number;
  source: EnergySource;
}

/**
 * Calculate energy (expectation value of Hamiltonian)
 * Uses Jordan-Wigner mapped Pauli Hamiltonian when available (pyChemiQ-inspired),
 * falls back to heuristic model for molecules without pre-computed Hamiltonians.
 * 
 * IMPORTANT: Uses synchronous simulateCircuit to guarantee a full dense state vector
 * is always available — both on the main thread and inside Web Workers.
 * The async `simulateCircuitEnhanced` was unreliable in Workers (no WASM/GPU).
 */
export const calculateEnergy = (
  gates: QuantumGate[],
  qubitCount: number,
  molecule: MoleculeData,
  bitOrder: BitOrder = 'MSB'
): EnergyEvaluation => {
  const result = simulateCircuit(gates, qubitCount, bitOrder);
  const hamiltonian = getHamiltonian(molecule.id);

  if (hamiltonian && result.mps) {
    // Exact path for 20+ qubits: evaluate ⟨ψ|H|ψ⟩ using tensor network contraction
    return {
      energy: calculatePauliExpectationMPS(result.mps, hamiltonian, bitOrder),
      source: 'precomputed-hamiltonian',
    };
  }

  if (
    hamiltonian &&
    result.stateVector?.amplitudes &&
    result.stateVector.amplitudes.length === (1 << qubitCount)
  ) {
    // Exact path: evaluate ⟨ψ|H|ψ⟩ using full Pauli decomposition
    return {
      energy: calculatePauliExpectation(result.stateVector.amplitudes, hamiltonian, bitOrder),
      source: 'precomputed-hamiltonian',
    };
  }

  if (hamiltonian && result.amplitudes && result.amplitudes.length > 0 && qubitCount < 16) {
    // Reconstruct dense state vector from sparse amplitude list (only for <16 qubits)
    // Allocating 1 << 20 arrays will crash V8 due to OOM
    const dim = 1 << qubitCount;
    const stateVector: { re: number; im: number }[] = new Array(dim).fill(null).map(() => ({ re: 0, im: 0 }));

    for (const amp of result.amplitudes) {
      // Avoid parsing as integer to support >53 qubits without precision loss
      const stateIndex = parseInt(amp.state.replace(/[|⟩]/g, ''), 2);
      if (!Number.isNaN(stateIndex) && stateIndex < dim) {
        stateVector[stateIndex] = { re: amp.re, im: amp.im };
      }
    }

    return {
      energy: calculatePauliExpectation(stateVector, hamiltonian, bitOrder),
      source: 'precomputed-hamiltonian',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EDUCATIONAL HEURISTIC FALLBACK — NOT AB INITIO
  //
  // No pre-computed Hamiltonian exists for this molecule. The energy below is
  // derived from a Hamming-weight formula that roughly scales with the
  // molecule's preset expectedGroundStateEnergy. It is NOT a real quantum
  // chemistry result and should NEVER be presented as one.
  // ═══════════════════════════════════════════════════════════════════════════
  console.warn(
    `[VQE] No Hamiltonian for molecule "${molecule.id}". ` +
    `Using heuristic fallback — result is NOT an ab initio energy.`
  );

  let energy = 0;
  const groundStateEnergy = molecule.expectedGroundStateEnergy;

  for (const prob of result.probabilities) {
    // Calculate Hamming weight directly from string to avoid >53 qubit precision loss
    const hammingWeight = prob.state.split('1').length - 1;
    // Scale excitation by molecular orbital gap estimate
    const excitationScale = Math.min(0.5, Math.abs(groundStateEnergy) * 0.05);
    const excitationEnergy = hammingWeight * excitationScale;
    const stateEnergy = groundStateEnergy + excitationEnergy;
    energy += prob.probability * stateEnergy;
  }

  return { energy, source: 'heuristic-fallback' };
};

/**
 * Calculate numerical gradient for a single parameter
 * Uses central finite difference: df/dx ≈ (f(x+h) - f(x-h)) / 2h
 */
const calculateGradient = (
  molecule: MoleculeData,
  parameters: number[],
  paramIndex: number,
  step: number,
  bitOrder: BitOrder = 'MSB'
): number => {
  const paramsPlus = [...parameters];
  const paramsMinus = [...parameters];
  
  paramsPlus[paramIndex] += step;
  paramsMinus[paramIndex] -= step;
  
  const gatesPlus = generateParameterizedAnsatz(molecule, paramsPlus);
  const gatesMinus = generateParameterizedAnsatz(molecule, paramsMinus);
  
  const energyPlus = calculateEnergy(gatesPlus, molecule.qubitsRequired, molecule, bitOrder).energy;
  const energyMinus = calculateEnergy(gatesMinus, molecule.qubitsRequired, molecule, bitOrder).energy;
  
  return (energyPlus - energyMinus) / (2 * step);
};

/**
 * Run VQE optimization
 * Uses gradient descent to minimize energy.
 * 
 * The optimization is async only to yield to the event loop between iterations,
 * allowing the UI thread to paint progress updates. All quantum simulation
 * within each iteration is synchronous for accuracy.
 */
export const runVQEOptimization = async (
  molecule: MoleculeData,
  initialParameters: number[],
  config: Partial<VQEConfig> = {},
  onIteration?: (iteration: VQEIteration) => void,
  bitOrder: BitOrder = 'MSB'
): Promise<VQEResult> => {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const parameters = [...initialParameters];
  const iterations: VQEIteration[] = [];
  
  let prevEnergy = Infinity;
  let converged = false;
  let iteration = 0;
  let stableSteps = 0;
  // Stricter convergence: require |ΔE| < threshold for 3 consecutive iterations
  const STABILITY_WINDOW = 3;
  const STABILITY_THRESHOLD = Math.max(cfg.convergenceThreshold, 0.005);
  
  let energySource: EnergySource = 'heuristic-fallback';
  let bestEnergy = Infinity;
  let bestParameters = [...parameters];
  let lastGradientNorm = 0;

  for (iteration = 0; iteration < cfg.maxIterations; iteration++) {
    // Generate circuit with current parameters
    const gates = generateParameterizedAnsatz(molecule, parameters);
    const evalResult = calculateEnergy(gates, molecule.qubitsRequired, molecule, bitOrder);
    const energy = evalResult.energy;
    energySource = evalResult.source;
    
    // Track best energy found
    if (energy < bestEnergy) {
      bestEnergy = energy;
      bestParameters = [...parameters];
    }
    
    // Record iteration
    const iterationData: VQEIteration = {
      iteration,
      energy,
      parameters: [...parameters],
    };
    iterations.push(iterationData);
    onIteration?.(iterationData);
    
    // Check convergence — needs sustained stability
    if (Math.abs(energy - prevEnergy) < STABILITY_THRESHOLD) {
      stableSteps++;
      if (stableSteps >= STABILITY_WINDOW) {
        converged = true;
        break;
      }
    } else {
      stableSteps = 0;
    }
    prevEnergy = energy;
    
    // Calculate gradients and update parameters.
    // For larger systems we update only a sampled subset per iteration
    // to keep UI responsive while still descending the energy landscape.
    const updateCount = Math.min(
      parameters.length,
      Math.max(1, cfg.maxGradientUpdatesPerIteration)
    );
    const shouldSample = updateCount < parameters.length;
    const parameterIndices = shouldSample
      ? Array.from({ length: parameters.length }, (_, idx) => idx)
          .sort(() => Math.random() - 0.5)
          .slice(0, updateCount)
      : Array.from({ length: parameters.length }, (_, idx) => idx);

    // Compute all gradients for this batch
    const gradients = parameterIndices.map(i => 
      calculateGradient(molecule, parameters, i, cfg.gradientStep, bitOrder)
    );

    // Track gradient norm for convergence diagnostics
    lastGradientNorm = Math.sqrt(gradients.reduce((s, g) => s + g * g, 0));

    for (let idx = 0; idx < parameterIndices.length; idx++) {
      const i = parameterIndices[idx];
      const gradient = gradients[idx];
      parameters[i] -= cfg.learningRate * gradient;
      
      // Keep parameters in reasonable range
      parameters[i] = Math.max(-2 * Math.PI, Math.min(2 * Math.PI, parameters[i]));
    }
    
    // Yield to event loop so UI can paint progress
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  const finalGates = generateParameterizedAnsatz(molecule, parameters);
  const finalEval = calculateEnergy(finalGates, molecule.qubitsRequired, molecule, bitOrder);
  const finalEnergy = finalEval.energy;
  if (finalEnergy < bestEnergy) {
    bestEnergy = finalEnergy;
    bestParameters = [...parameters];
  }

  // Build Hamiltonian info if we used a real Hamiltonian
  const hamiltonian = getHamiltonian(molecule.id);
  const hamiltonianInfo: HamiltonianInfo | undefined = hamiltonian ? {
    mapping: hamiltonian.mapping,
    basis: hamiltonian.basis,
    numTerms: hamiltonian.terms.length,
    nuclearRepulsion: hamiltonian.nuclearRepulsion,
    fciEnergy: hamiltonian.fciEnergy,
    hfEnergy: hamiltonian.hfEnergy,
    activeSpace: `CAS(${molecule.activeSpace?.activeElectrons ?? molecule.electrons},${molecule.activeSpace?.activeOrbitals ?? Math.floor(molecule.qubitsRequired / 2)})`,
  } : undefined;
  
  return {
    finalEnergy,
    finalParameters: parameters,
    iterations,
    converged,
    totalIterations: iteration + 1,
    energyError: Math.abs(finalEnergy - molecule.expectedGroundStateEnergy),
    energySource,
    hamiltonianInfo,
    bestEnergy,
    bestParameters,
    gradientNorm: lastGradientNorm,
    optimizerType: 'gradient-descent-cfd',
  };
};

/**
 * Get parameter labels for display
 */
export const getParameterLabels = (molecule: MoleculeData): string[] => {
  const labels: string[] = [];
  const qubits = molecule.qubitsRequired;
  const depth = molecule.vqeDepth;
  
  for (let layer = 0; layer < depth; layer++) {
    for (let q = 0; q < qubits; q++) {
      labels.push(`θ_Ry_L${layer + 1}_Q${q}`);
    }
    for (let q = 0; q < qubits; q++) {
      labels.push(`φ_Rz_L${layer + 1}_Q${q}`);
    }
  }
  
  return labels;
};
