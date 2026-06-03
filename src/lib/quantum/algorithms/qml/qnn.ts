import { QuantumGate } from '../../simulator';

/**
 * Data Re-uploading Quantum Neural Network
 * 
 * Generates a QNN circuit where data is re-encoded repeatedly
 * to increase expressivity, followed by variational layers.
 * 
 * U(x, theta) = L_L(theta_L) S(x) ... L_1(theta_1) S(x)
 */
export const generateDataReuploadingQNN = (
  features: number[],
  parameters: number[][], // L layers of parameters
  qubitCount: number
): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  const layers = parameters.length;
  let pos = 0;
  
  for (let l = 0; l < layers; l++) {
    // S(x): State preparation / Data encoding layer
    // For re-uploading, we apply Rx rotations with the feature values
    for (let i = 0; i < Math.min(features.length, qubitCount); i++) {
      gates.push({ id: `qnn-S-RX-${l}-${i}`, type: 'Rx', qubit: i, angle: features[i], position: pos });
    }
    pos++;
    
    // L(theta): Parameterized variational layer
    // Apply Ry and Rz
    let paramIdx = 0;
    for (let i = 0; i < qubitCount; i++) {
      const thetaY = parameters[l][paramIdx++] ?? 0.0;
      const thetaZ = parameters[l][paramIdx++] ?? 0.0;
      
      gates.push({ id: `qnn-L-RY-${l}-${i}`, type: 'Ry', qubit: i, angle: thetaY, position: pos });
      gates.push({ id: `qnn-L-RZ-${l}-${i}`, type: 'Rz', qubit: i, angle: thetaZ, position: pos });
    }
    pos++;
    
    // Entanglement (linear CNOTs)
    if (qubitCount > 1) {
      for (let i = 0; i < qubitCount - 1; i++) {
        gates.push({ id: `qnn-L-CX-${l}-${i}`, type: 'CNOT', qubit: i, targetQubit: i + 1, position: pos++ });
      }
    }
  }
  
  // Measurement
  for (let i = 0; i < qubitCount; i++) {
    gates.push({ id: `qnn-M-${i}`, type: 'M', qubit: i, position: pos });
  }
  
  return gates;
};
