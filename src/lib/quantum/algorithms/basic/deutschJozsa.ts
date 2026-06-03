import { QuantumGate } from '../../simulator';

export type OracleType = 'constant-0' | 'constant-1' | 'balanced';

export const generateDeutschJozsa = (qubitCount: number, oracleType: OracleType): QuantumGate[] => {
  if (qubitCount < 2) throw new Error("Deutsch-Jozsa requires at least 2 qubits.");
  
  const gates: QuantumGate[] = [];
  const n = qubitCount - 1; // number of input qubits
  const ancilla = n;
  
  // 1. Initialize ancilla to |1>
  gates.push({ id: `dj-X-ancilla`, type: 'X', qubit: ancilla, position: 0 });
  
  // 2. Apply H to all qubits
  for (let i = 0; i <= n; i++) {
    gates.push({ id: `dj-H1-${i}`, type: 'H', qubit: i, position: 1 });
  }
  
  // 3. Apply Oracle
  let currentPos = 2;
  if (oracleType === 'constant-1') {
    gates.push({ id: `dj-oracle-X`, type: 'X', qubit: ancilla, position: currentPos++ });
  } else if (oracleType === 'balanced') {
    // A simple balanced oracle: CNOT from q0 to ancilla
    gates.push({ id: `dj-oracle-CX`, type: 'CNOT', qubit: 0, targetQubit: ancilla, position: currentPos++ });
  }
  // constant-0 does nothing
  
  // 4. Apply H to all input qubits
  for (let i = 0; i < n; i++) {
    gates.push({ id: `dj-H2-${i}`, type: 'H', qubit: i, position: currentPos });
  }
  currentPos++;
  
  // 5. Measure input qubits
  for (let i = 0; i < n; i++) {
    gates.push({ id: `dj-M-${i}`, type: 'M', qubit: i, position: currentPos });
  }
  
  return gates;
};
