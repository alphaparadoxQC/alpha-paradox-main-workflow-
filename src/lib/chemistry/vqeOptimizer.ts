/**
 * VQE (Variational Quantum Eigensolver) Optimizer
 * Implements classical optimization loop for molecular ground state finding
 */

import { QuantumGate } from '@/types/quantum';
import { simulateCircuit } from '@/lib/quantum/simulator';
import { MoleculeData } from './moleculeData';
import { getHamiltonian, calculatePauliExpectation } from './pauliHamiltonian';

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
}

export interface VQEConfig {
  maxIterations: number;
  convergenceThreshold: number;
  learningRate: number;
  gradientStep: number;
}

const DEFAULT_CONFIG: VQEConfig = {
  maxIterations: 50,
  convergenceThreshold: 1e-4,
  learningRate: 0.3,
  gradientStep: 0.01,
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
  
  // Hartree-Fock state preparation
  const occupiedOrbitals = Math.floor(molecule.electrons / 2);
  for (let i = 0; i < occupiedOrbitals && i < qubits; i++) {
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

/**
 * Calculate energy (expectation value of Hamiltonian)
 * Uses Jordan-Wigner mapped Pauli Hamiltonian when available (pyChemiQ-inspired),
 * falls back to heuristic model for molecules without pre-computed Hamiltonians.
 */
export const calculateEnergy = (
  gates: QuantumGate[],
  qubitCount: number,
  molecule: MoleculeData
): number => {
  const result = simulateCircuit(gates, qubitCount);
  const hamiltonian = getHamiltonian(molecule.id);

  if (hamiltonian && result.amplitudes && result.amplitudes.length > 0) {
    // === Accurate Pauli Hamiltonian evaluation ===
    // Build full state vector from simulation amplitudes
    const dim = 1 << qubitCount;
    const stateVector: { re: number; im: number }[] = new Array(dim).fill(null).map(() => ({ re: 0, im: 0 }));

    for (const amp of result.amplitudes) {
      // Parse state string like "|01010⟩" → integer index
      const stateStr = amp.state.replace(/[|⟩]/g, '');
      const stateIndex = parseInt(stateStr, 2);
      if (stateIndex < dim) {
        stateVector[stateIndex] = { re: amp.re, im: amp.im };
      }
    }

    return calculatePauliExpectation(stateVector, hamiltonian);
  }

  // === Fallback: heuristic energy model ===
  let energy = 0;
  const groundStateEnergy = molecule.expectedGroundStateEnergy;

  for (const prob of result.probabilities) {
    const stateIndex = parseInt(prob.state.slice(1, -1), 2);
    const hammingWeight = stateIndex.toString(2).split('1').length - 1;
    const excitationEnergy = hammingWeight * 0.3;
    const stateEnergy = groundStateEnergy + excitationEnergy;
    energy += prob.probability * stateEnergy;
  }

  return energy;
};

/**
 * Calculate numerical gradient for a single parameter
 */
const calculateGradient = (
  molecule: MoleculeData,
  parameters: number[],
  paramIndex: number,
  step: number
): number => {
  const paramsPlus = [...parameters];
  const paramsMinus = [...parameters];
  
  paramsPlus[paramIndex] += step;
  paramsMinus[paramIndex] -= step;
  
  const gatesPlus = generateParameterizedAnsatz(molecule, paramsPlus);
  const gatesMinus = generateParameterizedAnsatz(molecule, paramsMinus);
  
  const energyPlus = calculateEnergy(gatesPlus, molecule.qubitsRequired, molecule);
  const energyMinus = calculateEnergy(gatesMinus, molecule.qubitsRequired, molecule);
  
  return (energyPlus - energyMinus) / (2 * step);
};

/**
 * Run VQE optimization
 * Uses gradient descent to minimize energy
 */
export const runVQEOptimization = async (
  molecule: MoleculeData,
  initialParameters: number[],
  config: Partial<VQEConfig> = {},
  onIteration?: (iteration: VQEIteration) => void
): Promise<VQEResult> => {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const parameters = [...initialParameters];
  const iterations: VQEIteration[] = [];
  
  let prevEnergy = Infinity;
  let converged = false;
  let iteration = 0;
  
  for (iteration = 0; iteration < cfg.maxIterations; iteration++) {
    // Generate circuit with current parameters
    const gates = generateParameterizedAnsatz(molecule, parameters);
    const energy = calculateEnergy(gates, molecule.qubitsRequired, molecule);
    
    // Record iteration
    const iterationData: VQEIteration = {
      iteration,
      energy,
      parameters: [...parameters],
    };
    iterations.push(iterationData);
    onIteration?.(iterationData);
    
    // Check convergence
    if (Math.abs(energy - prevEnergy) < cfg.convergenceThreshold) {
      converged = true;
      break;
    }
    prevEnergy = energy;
    
    // Calculate gradients and update parameters
    for (let i = 0; i < parameters.length; i++) {
      const gradient = calculateGradient(molecule, parameters, i, cfg.gradientStep);
      parameters[i] -= cfg.learningRate * gradient;
      
      // Keep parameters in reasonable range
      parameters[i] = Math.max(-2 * Math.PI, Math.min(2 * Math.PI, parameters[i]));
    }
    
    // Small delay for UI updates
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  const finalGates = generateParameterizedAnsatz(molecule, parameters);
  const finalEnergy = calculateEnergy(finalGates, molecule.qubitsRequired, molecule);
  
  return {
    finalEnergy,
    finalParameters: parameters,
    iterations,
    converged,
    totalIterations: iteration + 1,
    energyError: Math.abs(finalEnergy - molecule.expectedGroundStateEnergy),
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
