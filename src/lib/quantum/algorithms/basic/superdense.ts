import { QuantumGate } from '../../simulator';

export const generateSuperdenseCoding = (bit1: '0' | '1', bit2: '0' | '1'): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  let currentPos = 0;
  
  // 1. Create Bell pair between Alice (q0) and Bob (q1)
  gates.push({ id: `sd-H-0`, type: 'H', qubit: 0, position: currentPos });
  gates.push({ id: `sd-CX-0-1`, type: 'CNOT', qubit: 0, targetQubit: 1, position: currentPos + 1 });
  
  currentPos += 2;
  
  // 2. Alice encodes two classical bits into her qubit (q0)
  if (bit2 === '1') {
    gates.push({ id: `sd-X-0`, type: 'X', qubit: 0, position: currentPos++ });
  }
  if (bit1 === '1') {
    gates.push({ id: `sd-Z-0`, type: 'Z', qubit: 0, position: currentPos++ });
  }
  
  // 3. Alice sends her qubit to Bob (implicit)
  
  // 4. Bob decodes the two classical bits
  gates.push({ id: `sd-CX-0-1-dec`, type: 'CNOT', qubit: 0, targetQubit: 1, position: currentPos });
  gates.push({ id: `sd-H-0-dec`, type: 'H', qubit: 0, position: currentPos + 1 });
  
  currentPos += 2;
  
  // 5. Bob measures both qubits
  gates.push({ id: `sd-M-0`, type: 'M', qubit: 0, position: currentPos });
  gates.push({ id: `sd-M-1`, type: 'M', qubit: 1, position: currentPos });
  
  return gates;
};
