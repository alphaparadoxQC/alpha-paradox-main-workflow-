import { QuantumGate } from '../../simulator';

export const generateSimonsAlgorithm = (secretString: string): QuantumGate[] => {
  const n = secretString.length;
  const totalQubits = 2 * n;
  const gates: QuantumGate[] = [];
  
  let pos = 0;
  
  // 1. Initial H on first register
  for (let i = 0; i < n; i++) {
    gates.push({ id: `simon-H1-${i}`, type: 'H', qubit: i, position: pos });
  }
  pos++;
  
  // 2. Oracle U_f: |x>|0> -> |x>|f(x)>
  // A simple Simon's Oracle:
  // First, copy x to second register (CNOT from x_i to y_i)
  for (let i = 0; i < n; i++) {
    gates.push({ id: `simon-oracle-copy-${i}`, type: 'CNOT', qubit: i, targetQubit: n + i, position: pos++ });
  }
  
  // Then, for every bit j in secret string s that is '1',
  // if x_k is 1 (where s_k is the first '1' bit of s), XOR the rest into y
  const firstOneIdx = secretString.indexOf('1');
  if (firstOneIdx !== -1) {
    for (let j = 0; j < n; j++) {
      if (j !== firstOneIdx && secretString[j] === '1') {
        gates.push({
          id: `simon-oracle-xor-${j}`,
          type: 'CNOT',
          qubit: firstOneIdx,
          targetQubit: n + j,
          position: pos++
        });
      }
    }
  }
  
  // 3. Second H on first register
  for (let i = 0; i < n; i++) {
    gates.push({ id: `simon-H2-${i}`, type: 'H', qubit: i, position: pos });
  }
  pos++;
  
  // 4. Measure first register
  for (let i = 0; i < n; i++) {
    gates.push({ id: `simon-M-${i}`, type: 'M', qubit: i, position: pos });
  }
  
  return gates;
};
