import { QuantumGate } from '../../quantum/simulator';
import { PauliTerm } from '../pauliHamiltonian';

/**
 * Generates a quantum circuit for Hamiltonian time evolution e^{-iHt}
 * using First-Order Trotter-Suzuki decomposition.
 * 
 * U(t) = ( \prod e^{-i H_k t/r} )^r
 */
export const generateTrotterEvolution = (
  hamiltonian: PauliTerm[],
  time: number,
  trotterSteps: number,
  qubitCount: number
): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  const dt = time / trotterSteps;
  let pos = 0;
  
  for (let step = 0; step < trotterSteps; step++) {
    for (const term of hamiltonian) {
      const theta = 2 * term.coefficient * dt;
      // Convert Pauli string into circuit gates
      // E.g., e^{-i * theta/2 * Z_0 Z_1}
      
      const qubitsWithPauli: { q: number, p: string }[] = [];
      for (let i = 0; i < term.pauliString.length; i++) {
        if (term.pauliString[i] !== 'I') {
          qubitsWithPauli.push({ q: i, p: term.pauliString[i] });
        }
      }
      
      if (qubitsWithPauli.length === 0) continue; // Global phase, ignore for simple evolution
      
      // 1. Basis change to Z
      for (const { q, p } of qubitsWithPauli) {
        if (p === 'X') gates.push({ id: `trot-H1-${q}`, type: 'H', qubit: q, position: pos });
        if (p === 'Y') {
          gates.push({ id: `trot-RX1-${q}`, type: 'Rx', qubit: q, angle: Math.PI / 2, position: pos });
        }
      }
      pos++;
      
      // 2. Compute parity into the last qubit
      for (let i = 0; i < qubitsWithPauli.length - 1; i++) {
        gates.push({
          id: `trot-CX1-${qubitsWithPauli[i].q}-${qubitsWithPauli[i+1].q}`,
          type: 'CNOT',
          qubit: qubitsWithPauli[i].q,
          targetQubit: qubitsWithPauli[i+1].q,
          position: pos++
        });
      }
      
      // 3. Apply Rz rotation
      const targetQ = qubitsWithPauli[qubitsWithPauli.length - 1].q;
      gates.push({ id: `trot-RZ-${targetQ}`, type: 'Rz', qubit: targetQ, angle: theta, position: pos++ });
      
      // 4. Uncompute parity
      for (let i = qubitsWithPauli.length - 2; i >= 0; i--) {
        gates.push({
          id: `trot-CX2-${qubitsWithPauli[i].q}-${qubitsWithPauli[i+1].q}`,
          type: 'CNOT',
          qubit: qubitsWithPauli[i].q,
          targetQubit: qubitsWithPauli[i+1].q,
          position: pos++
        });
      }
      
      // 5. Uncompute basis change
      for (const { q, p } of qubitsWithPauli) {
        if (p === 'X') gates.push({ id: `trot-H2-${q}`, type: 'H', qubit: q, position: pos });
        if (p === 'Y') {
          gates.push({ id: `trot-RX2-${q}`, type: 'Rx', qubit: q, angle: -Math.PI / 2, position: pos });
        }
      }
      pos++;
    }
  }
  
  return gates;
};
