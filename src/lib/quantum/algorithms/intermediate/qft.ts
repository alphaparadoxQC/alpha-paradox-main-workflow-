import { QuantumGate } from '../../simulator';

export const generateQFT = (qubitCount: number): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  let pos = 0;
  
  for (let target = 0; target < qubitCount; target++) {
    gates.push({ id: `qft-H-${target}`, type: 'H', qubit: target, position: pos++ });
    
    // Controlled phases
    for (let control = target + 1; control < qubitCount; control++) {
      const angle = Math.PI / Math.pow(2, control - target);
      // We simulate CP (Controlled-Phase) with a parameterized CZ or generic logic.
      // Assuming our backend accepts angle for CZ or RZ. For educational visual, we mark it as 'CZ' with an angle if supported,
      // or standard RZ for simplicity in basic simulators.
      gates.push({
        id: `qft-CP-${control}-${target}`,
        type: 'CZ', // Ideally 'CP', but sticking to existing types
        qubit: control,
        targetQubit: target,
        angle: angle,
        position: pos++
      });
    }
  }
  
  // SWAP to reverse order
  for (let i = 0; i < Math.floor(qubitCount / 2); i++) {
    gates.push({
      id: `qft-SWAP-${i}`,
      type: 'SWAP',
      qubit: i,
      targetQubit: qubitCount - 1 - i,
      position: pos++
    });
  }
  
  return gates;
};

export const generateInverseQFT = (qubitCount: number): QuantumGate[] => {
  const gates = generateQFT(qubitCount);
  
  // Reverse the order and negate angles to get inverse QFT
  const reversed = [...gates].reverse();
  const maxPos = reversed.length > 0 ? reversed[0].position : 0;
  
  return reversed.map((gate, idx) => ({
    ...gate,
    id: `iqft-${gate.id}`,
    position: idx, // Assign sequential positions
    angle: gate.angle !== undefined ? -gate.angle : undefined
  }));
};
