/**
 * EDUCATIONAL Simplified UCCSD Ansatz Generator
 *
 * This is a simplified, educational-grade approximation of the Unitary
 * Coupled-Cluster Singles and Doubles (UCCSD) ansatz. It is NOT a
 * production-grade chemistry ansatz for the following reasons:
 *
 * - Single excitations are represented as bare Ry+CNOT instead of the proper
 *   anti-Hermitian Pauli rotation decomposition e^{-iθ(a†_p a_q - h.c.)}.
 * - No spin conservation or particle-number conservation is enforced.
 * - The circuit structure is a heuristic sketch, not the textbook UCCSD
 *   Trotterized decomposition.
 *
 * For research-grade UCCSD, use a library like Qiskit Nature or PennyLane.
 *
 * @educational
 */

import { QuantumGate } from '@/types/quantum';

export const generateUCCSDAnsatz = (
  qubits: number,
  electrons: number,
  parameters: number[]
): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  let pos = 0;
  let paramIdx = 0;
  
  // 1. Hartree-Fock Initialization
  for (let i = 0; i < electrons; i++) {
    gates.push({ id: `uccsd-hf-X-${i}`, type: 'X', qubit: i, position: pos });
  }
  pos++;
  
  // 2. Single Excitations (educational approximation)
  // Each excitation gets its own independent parameter
  for (let occ = 0; occ < electrons; occ++) {
    for (let virt = electrons; virt < qubits; virt++) {
      const theta = parameters[paramIdx++] ?? 0.01;
      
      gates.push({ id: `uccsd-singles-RY-${occ}-${virt}`, type: 'Ry', qubit: virt, angle: theta, position: pos++ });
      gates.push({ id: `uccsd-singles-CX-${occ}-${virt}`, type: 'CNOT', qubit: occ, targetQubit: virt, position: pos++ });
    }
  }
  
  // 3. Double Excitations (educational approximation)
  // Each double excitation gets its own independent parameter
  if (electrons >= 2 && qubits - electrons >= 2) {
    for (let occ1 = 0; occ1 < electrons - 1; occ1++) {
      for (let occ2 = occ1 + 1; occ2 < electrons; occ2++) {
        for (let virt1 = electrons; virt1 < qubits - 1; virt1++) {
          for (let virt2 = virt1 + 1; virt2 < qubits; virt2++) {
            const theta = parameters[paramIdx++] ?? 0.01;
            gates.push({ id: `uccsd-doubles-RY-${occ1}-${virt1}`, type: 'Ry', qubit: virt1, angle: theta, position: pos++ });
            gates.push({ id: `uccsd-doubles-CX-${occ1}-${virt1}`, type: 'CNOT', qubit: occ1, targetQubit: virt1, position: pos++ });
            gates.push({ id: `uccsd-doubles-CX-${occ2}-${virt2}`, type: 'CNOT', qubit: occ2, targetQubit: virt2, position: pos++ });
          }
        }
      }
    }
  }
  
  return gates;
};

/**
 * Returns the number of variational parameters for a UCCSD ansatz.
 */
export const getUCCSDParameterCount = (qubits: number, electrons: number): number => {
  const singles = electrons * (qubits - electrons);
  let doubles = 0;
  if (electrons >= 2 && qubits - electrons >= 2) {
    const nOccPairs = (electrons * (electrons - 1)) / 2;
    const nVirtPairs = ((qubits - electrons) * (qubits - electrons - 1)) / 2;
    doubles = nOccPairs * nVirtPairs;
  }
  return singles + doubles;
};
