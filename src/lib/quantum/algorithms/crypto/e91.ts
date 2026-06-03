import { QuantumGate } from '../../simulator';

export interface E91Config {
  pairs: number;
  aliceBases: (0 | 1 | 2)[]; // 0: Z, 1: X, 2: W (some intermediate angle)
  bobBases: (0 | 1 | 2)[];   // 0: Z, 1: W, 2: V
  eavesdropper?: boolean;
}

export const generateE91Protocol = (config: E91Config): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  const n = config.pairs;
  let pos = 0;
  
  for (let i = 0; i < n; i++) {
    const qA = 2 * i;
    const qB = 2 * i + 1;
    
    // 1. Create singlet state (|01> - |10>)/sqrt(2)
    gates.push({ id: `e91-X-${qA}`, type: 'X', qubit: qA, position: pos });
    gates.push({ id: `e91-X-${qB}`, type: 'X', qubit: qB, position: pos });
    pos++;
    
    gates.push({ id: `e91-H-${qA}`, type: 'H', qubit: qA, position: pos++ });
    gates.push({ id: `e91-CX-${qA}-${qB}`, type: 'CNOT', qubit: qA, targetQubit: qB, position: pos++ });
    gates.push({ id: `e91-Z-${qB}`, type: 'Z', qubit: qB, position: pos++ }); // Singlet phase
    
    // 2. Eve intercepts (optional)
    if (config.eavesdropper) {
      gates.push({ id: `e91-E-M-${qA}`, type: 'M', qubit: qA, position: pos });
      gates.push({ id: `e91-E-M-${qB}`, type: 'M', qubit: qB, position: pos++ });
    }
    
    // 3. Alice and Bob measure in chosen bases
    // Alice bases: 0: Z (0), 1: X (pi/2), 2: W (pi/4)
    // Bob bases: 0: Z (0), 1: W (pi/4), 2: V (-pi/4)
    // We simulate basis choice by rotating before measurement
    
    const applyBasisRotation = (qubit: number, basisCode: number, isAlice: boolean) => {
      let angle = 0;
      if (isAlice) {
        if (basisCode === 1) angle = Math.PI / 2;
        else if (basisCode === 2) angle = Math.PI / 4;
      } else {
        if (basisCode === 1) angle = Math.PI / 4;
        else if (basisCode === 2) angle = -Math.PI / 4;
      }
      
      if (angle !== 0) {
        // Ry rotation to change measurement basis
        gates.push({ id: `e91-Ry-${qubit}`, type: 'Ry', qubit: qubit, angle: -angle, position: pos });
      }
    };
    
    applyBasisRotation(qA, config.aliceBases[i], true);
    applyBasisRotation(qB, config.bobBases[i], false);
    pos++;
    
    gates.push({ id: `e91-M-${qA}`, type: 'M', qubit: qA, position: pos });
    gates.push({ id: `e91-M-${qB}`, type: 'M', qubit: qB, position: pos++ });
  }
  
  return gates;
};
