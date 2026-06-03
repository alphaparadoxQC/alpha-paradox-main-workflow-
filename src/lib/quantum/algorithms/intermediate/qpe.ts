import { QuantumGate } from '../../simulator';
import { generateInverseQFT } from './qft';

export const generateQPE = (countingQubits: number, targetQubits: number, unitaryAngle: number): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  const totalQubits = countingQubits + targetQubits;
  let pos = 0;
  
  // 1. Initialize target state to |1> (eigenstate of the unitary, e.g., P gate or RZ)
  for (let i = countingQubits; i < totalQubits; i++) {
    gates.push({ id: `qpe-X-target-${i}`, type: 'X', qubit: i, position: pos });
  }
  pos++;
  
  // 2. Apply H to counting qubits
  for (let i = 0; i < countingQubits; i++) {
    gates.push({ id: `qpe-H-${i}`, type: 'H', qubit: i, position: pos });
  }
  pos++;
  
  // 3. Apply Controlled Unitaries (U^{2^j})
  // Here U is represented as a controlled-phase gate for simplicity
  for (let j = 0; j < countingQubits; j++) {
    const power = Math.pow(2, j);
    const angle = unitaryAngle * power;
    
    // Controlled-U from counting qubit to target
    gates.push({
      id: `qpe-CU-${j}`,
      type: 'CZ', // using CZ as generic CP representation in this basic model
      qubit: j,
      targetQubit: countingQubits, // first target qubit
      angle: angle,
      position: pos++
    });
  }
  
  // 4. Inverse QFT on counting qubits
  const iqftGates = generateInverseQFT(countingQubits);
  for (const gate of iqftGates) {
    gates.push({
      ...gate,
      id: `qpe-${gate.id}`,
      position: pos + gate.position
    });
  }
  
  const iqftDepth = Math.max(...iqftGates.map(g => g.position), 0);
  pos += iqftDepth + 1;
  
  // 5. Measure counting qubits
  for (let i = 0; i < countingQubits; i++) {
    gates.push({ id: `qpe-M-${i}`, type: 'M', qubit: i, position: pos });
  }
  
  return gates;
};
