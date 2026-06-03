import { QuantumGate } from '../../simulator';

export const generateBernsteinVazirani = (secretString: string): QuantumGate[] => {
  const n = secretString.length;
  const qubitCount = n + 1;
  const ancilla = n;
  
  const gates: QuantumGate[] = [];
  
  // 1. Initialize ancilla to |1>
  gates.push({ id: `bv-X-ancilla`, type: 'X', qubit: ancilla, position: 0 });
  
  // 2. Apply H to all qubits
  for (let i = 0; i <= n; i++) {
    gates.push({ id: `bv-H1-${i}`, type: 'H', qubit: i, position: 1 });
  }
  
  // 3. Apply Oracle (CNOT for every '1' in secret string)
  let currentPos = 2;
  for (let i = 0; i < n; i++) {
    // Note: MSB/LSB convention matters here. Assuming secretString[0] corresponds to qubit 0.
    if (secretString[i] === '1') {
      gates.push({ 
        id: `bv-oracle-CX-${i}`, 
        type: 'CNOT', 
        qubit: i, 
        targetQubit: ancilla, 
        position: currentPos++ 
      });
    }
  }
  
  // 4. Apply H to all input qubits
  for (let i = 0; i < n; i++) {
    gates.push({ id: `bv-H2-${i}`, type: 'H', qubit: i, position: currentPos });
  }
  currentPos++;
  
  // 5. Measure input qubits
  for (let i = 0; i < n; i++) {
    gates.push({ id: `bv-M-${i}`, type: 'M', qubit: i, position: currentPos });
  }
  
  return gates;
};
