/**
 * VQE (Variational Quantum Eigensolver) Optimizer
 * Implements classical optimization loop for molecular ground state finding
 */

import { QuantumGate } from '@/types/quantum';
import { simulateCircuit } from '@/lib/quantum/simulator';
import { BitOrder } from '@/lib/quantum/bitOrder';
import { MoleculeData } from './moleculeData';
import { getHamiltonian, calculatePauliExpectation, calculatePauliExpectationMPS } from './pauliHamiltonian';
import { generateUCCSDAnsatz, getUCCSDParameterCount } from './ansatz/uccsd';

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
 * 
 * Uses UCCSD (Unitary Coupled-Cluster Singles and Doubles) ansatz
 * which generates molecule-specific circuits based on orbital excitations.
 * Each molecule gets a structurally unique circuit:
 * - H₂ (2e, 4q): compact circuit with 2 singles + 1 double
 * - LiH (4e, 6q): deeper circuit with 8 singles + 6 doubles  
 * - H₂O (10e, 14q): very deep circuit with long-range CNOTs
 */
export const generateParameterizedAnsatz = (
  molecule: MoleculeData,
  parameters: number[]
): QuantumGate[] => {
  const qubits = molecule.qubitsRequired;
  const electrons = Math.min(molecule.activeSpace?.activeElectrons ?? molecule.electrons, qubits);
  
  // Use UCCSD ansatz — generates proper Trotterized Pauli rotation
  // circuits with H, Rx, Rz, CNOT staircases specific to each molecule's
  // orbital structure (occupied→virtual excitations).
  return generateUCCSDAnsatz(qubits, electrons, parameters);
};

/**
 * Calculate the number of parameters needed for a molecule's ansatz
 * Uses UCCSD parameter count: singles + doubles excitations
 */
export const getParameterCount = (molecule: MoleculeData): number => {
  const qubits = molecule.qubitsRequired;
  const electrons = Math.min(molecule.activeSpace?.activeElectrons ?? molecule.electrons, qubits);
  return getUCCSDParameterCount(qubits, electrons);
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
    // We use a for loop and yield to the event loop between gradients
    // to prevent the browser UI from freezing during heavy quantum simulations.
    const gradients = [];
    for (const i of parameterIndices) {
      gradients.push(calculateGradient(molecule, parameters, i, cfg.gradientStep, bitOrder));
      await new Promise(resolve => setTimeout(resolve, 0));
    }

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
 * Labels now reflect UCCSD excitation structure instead of generic layers
 */
export const getParameterLabels = (molecule: MoleculeData): string[] => {
  const labels: string[] = [];
  const qubits = molecule.qubitsRequired;
  const electrons = Math.min(molecule.activeSpace?.activeElectrons ?? molecule.electrons, qubits);
  // Single excitation labels
  for (let occ = 0; occ < electrons; occ++) {
    for (let virt = electrons; virt < qubits; virt++) {
      labels.push(`θ_S(${occ}→${virt})`);
    }
  }
  
  // Double excitation labels
  if (electrons >= 2 && qubits - electrons >= 2) {
    for (let occ1 = 0; occ1 < electrons - 1; occ1++) {
      for (let occ2 = occ1 + 1; occ2 < electrons; occ2++) {
        for (let virt1 = electrons; virt1 < qubits - 1; virt1++) {
          for (let virt2 = virt1 + 1; virt2 < qubits; virt2++) {
            labels.push(`θ_D(${occ1},${occ2}→${virt1},${virt2})`);
          }
        }
      }
    }
  }
  
  return labels;
};
