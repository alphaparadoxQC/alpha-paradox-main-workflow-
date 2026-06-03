import { QuantumGate } from '../../simulator';
import { PauliTerm } from '../../../chemistry/pauliHamiltonian';

/**
 * Educational Quantum Annealing Simulation Model
 * 
 * Demonstrates the concept of quantum annealing by digitizing
 * the adiabatic evolution H(t) = (1 - t/T) H_mixer + (t/T) H_problem.
 */
export const generateAnnealingSchedule = (
  problemHamiltonian: PauliTerm[],
  qubitCount: number,
  steps: number,
  totalTime: number
): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  const dt = totalTime / steps;
  let pos = 0;
  
  // 1. Initial State: Ground state of H_mixer = -sum(X_i) -> |+> state
  for (let i = 0; i < qubitCount; i++) {
    gates.push({ id: `anneal-init-H-${i}`, type: 'H', qubit: i, position: pos });
  }
  pos++;
  
  // 2. Adiabatic Evolution
  for (let step = 1; step <= steps; step++) {
    // Linear schedule: s goes from 0 to 1
    const s = step / steps;
    const a_s = 1 - s; // Mixer schedule
    const b_s = s;     // Problem schedule
    
    // --- Problem Hamiltonian H_P ---
    for (const term of problemHamiltonian) {
      if (term.pauliString === 'I'.repeat(qubitCount)) continue;
      
      const zIndices: number[] = [];
      for (let i = 0; i < term.pauliString.length; i++) {
        if (term.pauliString[i] === 'Z') zIndices.push(i);
      }
      
      const angle = 2 * b_s * term.coefficient * dt;
      
      if (zIndices.length === 1) {
        gates.push({ id: `anneal-P-RZ-${step}-${zIndices[0]}`, type: 'Rz', qubit: zIndices[0], angle: angle, position: pos++ });
      } else if (zIndices.length === 2) {
        const q1 = zIndices[0];
        const q2 = zIndices[1];
        gates.push({ id: `anneal-P-CX1-${step}-${q1}-${q2}`, type: 'CNOT', qubit: q1, targetQubit: q2, position: pos++ });
        gates.push({ id: `anneal-P-RZ-${step}-${q2}`, type: 'Rz', qubit: q2, angle: angle, position: pos++ });
        gates.push({ id: `anneal-P-CX2-${step}-${q1}-${q2}`, type: 'CNOT', qubit: q1, targetQubit: q2, position: pos++ });
      }
    }
    
    // --- Mixer Hamiltonian H_M ---
    for (let i = 0; i < qubitCount; i++) {
      gates.push({ id: `anneal-M-RX-${step}-${i}`, type: 'Rx', qubit: i, angle: 2 * a_s * dt, position: pos });
    }
    pos++;
  }
  
  // 3. Final Measurement
  for (let i = 0; i < qubitCount; i++) {
    gates.push({ id: `anneal-M-${i}`, type: 'M', qubit: i, position: pos });
  }
  
  return gates;
};
