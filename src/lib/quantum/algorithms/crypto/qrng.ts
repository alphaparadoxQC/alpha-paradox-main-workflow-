import { QuantumGate } from '../../simulator';

export const generateQRNG = (qubitCount: number): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  
  // 1. Apply Hadamard to all qubits to create equal superposition
  for (let i = 0; i < qubitCount; i++) {
    gates.push({ id: `qrng-H-${i}`, type: 'H', qubit: i, position: 0 });
  }
  
  // 2. Measure all qubits
  for (let i = 0; i < qubitCount; i++) {
    gates.push({ id: `qrng-M-${i}`, type: 'M', qubit: i, position: 1 });
  }
  
  return gates;
};
