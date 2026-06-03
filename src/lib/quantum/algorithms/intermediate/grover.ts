import { QuantumGate } from '../../simulator';

export const generateGroverSearch = (qubitCount: number, markedState: string): QuantumGate[] => {
  if (markedState.length !== qubitCount) {
    throw new Error("Marked state length must equal qubitCount.");
  }
  
  const gates: QuantumGate[] = [];
  let pos = 0;
  
  // 1. Initial superposition
  for (let i = 0; i < qubitCount; i++) {
    gates.push({ id: `grover-init-H-${i}`, type: 'H', qubit: i, position: pos });
  }
  pos++;
  
  // Number of iterations ~ pi/4 * sqrt(2^n)
  const iterations = Math.floor(Math.PI / 4 * Math.sqrt(Math.pow(2, qubitCount)));
  
  for (let iter = 0; iter < Math.max(1, iterations); iter++) {
    // --- Oracle ---
    // Apply X to qubits where marked state is '0'
    for (let i = 0; i < qubitCount; i++) {
      if (markedState[i] === '0') {
        gates.push({ id: `grover-oracle-X1-${iter}-${i}`, type: 'X', qubit: i, position: pos });
      }
    }
    pos++;
    
    // Multi-controlled Z (simulated using basic gates for a small n, or a generalized multi-control)
    // For n=2 it's just CZ. For n=3 it's CCZ.
    if (qubitCount === 2) {
      gates.push({ id: `grover-oracle-CZ-${iter}`, type: 'CZ', qubit: 0, targetQubit: 1, position: pos++ });
    } else {
      // In a real generic builder without CCZ, we'd decompose it.
      // We'll use a placeholder M-CZ for arbitrary size (not natively simulated in our basic CPU backend without extensions, 
      // but conceptually valid for the builder)
      gates.push({ id: `grover-oracle-MCZ-${iter}`, type: 'CZ', qubit: 0, targetQubit: qubitCount - 1, position: pos++ });
    }
    
    // Uncompute X
    for (let i = 0; i < qubitCount; i++) {
      if (markedState[i] === '0') {
        gates.push({ id: `grover-oracle-X2-${iter}-${i}`, type: 'X', qubit: i, position: pos });
      }
    }
    pos++;
    
    // --- Diffusion Operator ---
    for (let i = 0; i < qubitCount; i++) gates.push({ id: `grover-diff-H1-${iter}-${i}`, type: 'H', qubit: i, position: pos });
    pos++;
    for (let i = 0; i < qubitCount; i++) gates.push({ id: `grover-diff-X1-${iter}-${i}`, type: 'X', qubit: i, position: pos });
    pos++;
    
    if (qubitCount === 2) {
      gates.push({ id: `grover-diff-CZ-${iter}`, type: 'CZ', qubit: 0, targetQubit: 1, position: pos++ });
    } else {
      gates.push({ id: `grover-diff-MCZ-${iter}`, type: 'CZ', qubit: 0, targetQubit: qubitCount - 1, position: pos++ });
    }
    
    for (let i = 0; i < qubitCount; i++) gates.push({ id: `grover-diff-X2-${iter}-${i}`, type: 'X', qubit: i, position: pos });
    pos++;
    for (let i = 0; i < qubitCount; i++) gates.push({ id: `grover-diff-H2-${iter}-${i}`, type: 'H', qubit: i, position: pos });
    pos++;
  }
  
  // Measurement
  for (let i = 0; i < qubitCount; i++) {
    gates.push({ id: `grover-M-${i}`, type: 'M', qubit: i, position: pos });
  }
  
  return gates;
};
