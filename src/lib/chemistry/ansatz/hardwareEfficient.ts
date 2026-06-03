import { QuantumGate } from '../../quantum/simulator';

export const generateHardwareEfficientAnsatz = (
  qubitCount: number,
  layers: number,
  parameters: number[]
): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  let pos = 0;
  let paramIdx = 0;
  
  for (let l = 0; l < layers; l++) {
    // 1. Rotation layer (Ry and Rz on all qubits)
    for (let i = 0; i < qubitCount; i++) {
      const thetaY = parameters[paramIdx++] ?? 0.0;
      const thetaZ = parameters[paramIdx++] ?? 0.0;
      
      gates.push({ id: `hea-RY-${l}-${i}`, type: 'Ry', qubit: i, angle: thetaY, position: pos });
      gates.push({ id: `hea-RZ-${l}-${i}`, type: 'Rz', qubit: i, angle: thetaZ, position: pos });
    }
    pos++;
    
    // 2. Entanglement layer (linear nearest neighbor CNOTs)
    if (qubitCount > 1) {
      for (let i = 0; i < qubitCount - 1; i++) {
        gates.push({ id: `hea-CX-${l}-${i}`, type: 'CNOT', qubit: i, targetQubit: i + 1, position: pos++ });
      }
    }
  }
  
  // Final rotation layer
  for (let i = 0; i < qubitCount; i++) {
    const thetaY = parameters[paramIdx++] ?? 0.0;
    const thetaZ = parameters[paramIdx++] ?? 0.0;
    
    gates.push({ id: `hea-RY-final-${i}`, type: 'Ry', qubit: i, angle: thetaY, position: pos });
    gates.push({ id: `hea-RZ-final-${i}`, type: 'Rz', qubit: i, angle: thetaZ, position: pos });
  }
  
  return gates;
};
