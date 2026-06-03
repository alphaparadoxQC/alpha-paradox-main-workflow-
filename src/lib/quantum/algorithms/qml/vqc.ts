import { QuantumGate } from '../../simulator';

/**
 * Generates a Variational Quantum Classifier (VQC) circuit.
 * Consists of a data encoding layer followed by a parameterized variational layer.
 */
export const generateVQC = (
  features: number[],
  parameters: number[],
  qubitCount: number,
  layers: number
): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  let pos = 0;
  
  // 1. Data Encoding Layer (Angle Encoding)
  for (let i = 0; i < Math.min(features.length, qubitCount); i++) {
    gates.push({ id: `vqc-H-${i}`, type: 'H', qubit: i, position: pos });
  }
  pos++;
  
  for (let i = 0; i < Math.min(features.length, qubitCount); i++) {
    gates.push({ id: `vqc-RX-encode-${i}`, type: 'Rx', qubit: i, angle: features[i], position: pos });
  }
  pos++;
  
  // 2. Variational Layer
  let paramIdx = 0;
  for (let l = 0; l < layers; l++) {
    // Rotations
    for (let i = 0; i < qubitCount; i++) {
      const theta = parameters[paramIdx++] ?? 0.0;
      gates.push({ id: `vqc-RY-var-${l}-${i}`, type: 'Ry', qubit: i, angle: theta, position: pos });
    }
    pos++;
    
    // Entanglement (Circular CNOT)
    for (let i = 0; i < qubitCount; i++) {
      gates.push({
        id: `vqc-CX-var-${l}-${i}`,
        type: 'CNOT',
        qubit: i,
        targetQubit: (i + 1) % qubitCount,
        position: pos++
      });
    }
  }
  
  // Final rotations
  for (let i = 0; i < qubitCount; i++) {
    const theta = parameters[paramIdx++] ?? 0.0;
    gates.push({ id: `vqc-RY-var-final-${i}`, type: 'Ry', qubit: i, angle: theta, position: pos });
  }
  pos++;
  
  // 3. Measurement (measure qubit 0 for binary classification)
  gates.push({ id: `vqc-M-0`, type: 'M', qubit: 0, position: pos });
  
  return gates;
};
