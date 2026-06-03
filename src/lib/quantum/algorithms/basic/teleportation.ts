import { QuantumGate } from '../../simulator';

export const generateTeleportation = (initialStateGates: QuantumGate[] = [{ id: 'init-H', type: 'H', qubit: 0, position: 0 }]): QuantumGate[] => {
  // Uses 3 qubits: 0 (Alice's payload), 1 (Alice's half of Bell pair), 2 (Bob's half of Bell pair)
  const gates: QuantumGate[] = [...initialStateGates];
  
  let currentPos = Math.max(...initialStateGates.map(g => g.position), 0) + 1;
  
  // 1. Create Bell pair between q1 and q2
  gates.push({ id: `tel-H-1`, type: 'H', qubit: 1, position: currentPos });
  gates.push({ id: `tel-CX-1-2`, type: 'CNOT', qubit: 1, targetQubit: 2, position: currentPos + 1 });
  
  currentPos += 2;
  
  // 2. Alice performs Bell measurement on q0 and q1
  gates.push({ id: `tel-CX-0-1`, type: 'CNOT', qubit: 0, targetQubit: 1, position: currentPos });
  gates.push({ id: `tel-H-0`, type: 'H', qubit: 0, position: currentPos + 1 });
  
  currentPos += 2;
  
  // 3. Alice measures
  gates.push({ id: `tel-M-0`, type: 'M', qubit: 0, position: currentPos });
  gates.push({ id: `tel-M-1`, type: 'M', qubit: 1, position: currentPos });
  
  currentPos++;
  
  // 4. Bob applies correction based on Alice's measurement
  // Since our simulator doesn't natively support classical feed-forward in a dynamic way,
  // we simulate the effect using quantum controlled gates
  gates.push({ id: `tel-CX-1-2-corr`, type: 'CNOT', qubit: 1, targetQubit: 2, position: currentPos });
  gates.push({ id: `tel-CZ-0-2-corr`, type: 'CZ', qubit: 0, targetQubit: 2, position: currentPos + 1 });
  
  return gates;
};
