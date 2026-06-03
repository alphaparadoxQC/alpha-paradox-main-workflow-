import { QuantumGate } from '@/types/quantum';
import { PauliTerm } from '../../../chemistry/pauliHamiltonian';

/**
 * QAOA Circuit Builder
 * 
 * Generates the QAOA circuit for a given Ising Hamiltonian (Cost Hamiltonian)
 * with p layers of alternating Cost and Mixer operators.
 */
export const generateQAOA = (
  costHamiltonian: PauliTerm[],
  qubitCount: number,
  p: number,
  gammas: number[],
  betas: number[]
): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  let pos = 0;
  
  // 1. Initial State: Equal superposition
  for (let i = 0; i < qubitCount; i++) {
    gates.push({ id: `qaoa-init-H-${i}`, type: 'H', qubit: i, position: pos });
  }
  pos++;
  
  // 2. Apply p alternating layers
  for (let layer = 0; layer < p; layer++) {
    const gamma = gammas[layer] ?? 0.0;
    const beta = betas[layer] ?? 0.0;
    
    // --- Cost Hamiltonian (e^{-i * gamma * H_C}) ---
    for (const term of costHamiltonian) {
      // Assuming Ising Hamiltonian so terms are Z_i Z_j or Z_i
      const zIndices: number[] = [];
      for (let i = 0; i < term.pauliString.length; i++) {
        if (term.pauliString[i] === 'Z') zIndices.push(i);
      }
      
      if (zIndices.length === 1) {
        // Single Z term
        const q = zIndices[0];
        gates.push({ id: `qaoa-cost-RZ-${layer}-${q}`, type: 'Rz', qubit: q, angle: 2 * gamma * term.coefficient, position: pos++ });
      } else if (zIndices.length === 2) {
        // ZZ interaction term
        const q1 = zIndices[0];
        const q2 = zIndices[1];
        gates.push({ id: `qaoa-cost-CX1-${layer}-${q1}-${q2}`, type: 'CNOT', qubit: q1, targetQubit: q2, position: pos++ });
        gates.push({ id: `qaoa-cost-RZ-${layer}-${q2}`, type: 'Rz', qubit: q2, angle: 2 * gamma * term.coefficient, position: pos++ });
        gates.push({ id: `qaoa-cost-CX2-${layer}-${q1}-${q2}`, type: 'CNOT', qubit: q1, targetQubit: q2, position: pos++ });
      }
    }
    
    // --- Mixer Hamiltonian (e^{-i * beta * H_M}) where H_M = sum(X_i) ---
    for (let i = 0; i < qubitCount; i++) {
      gates.push({ id: `qaoa-mixer-RX-${layer}-${i}`, type: 'Rx', qubit: i, angle: 2 * beta, position: pos });
    }
    pos++;
  }
  
  // 3. Measurement
  for (let i = 0; i < qubitCount; i++) {
    gates.push({ id: `qaoa-M-${i}`, type: 'M', qubit: i, position: pos });
  }
  
  return gates;
};
