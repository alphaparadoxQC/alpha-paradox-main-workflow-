import { QuantumGate } from '../../simulator';
import { generateInverseQFT } from './qft';

export const generateShorDemo = (nBits: number = 3): QuantumGate[] => {
  // A small educational demo of Shor's period finding
  // E.g., factoring 15 requires finding order of a mod 15.
  // We use nBits for counting register, and nBits for target.
  const totalQubits = nBits * 2;
  const gates: QuantumGate[] = [];
  let pos = 0;
  
  // 1. Initialize target to |1>
  gates.push({ id: `shor-X-target`, type: 'X', qubit: totalQubits - 1, position: pos++ });
  
  // 2. Apply H to counting register
  for (let i = 0; i < nBits; i++) {
    gates.push({ id: `shor-H-${i}`, type: 'H', qubit: i, position: pos });
  }
  pos++;
  
  // 3. Apply Controlled Modular Multipliers
  // For a pure demo builder without decomposing modular exponentiation,
  // we just simulate a generic entanglement block.
  for (let i = 0; i < nBits; i++) {
    for (let j = nBits; j < totalQubits; j++) {
      gates.push({
        id: `shor-CMOD-${i}-${j}`,
        type: 'CNOT', // placeholder for modular multiplier bit ops
        qubit: i,
        targetQubit: j,
        position: pos++
      });
    }
  }
  
  // 4. Inverse QFT on counting register
  const iqftGates = generateInverseQFT(nBits);
  for (const gate of iqftGates) {
    gates.push({
      ...gate,
      id: `shor-${gate.id}`,
      position: pos + gate.position
    });
  }
  
  const iqftDepth = Math.max(...iqftGates.map(g => g.position), 0);
  pos += iqftDepth + 1;
  
  // 5. Measure counting register
  for (let i = 0; i < nBits; i++) {
    gates.push({ id: `shor-M-${i}`, type: 'M', qubit: i, position: pos });
  }
  
  return gates;
};
