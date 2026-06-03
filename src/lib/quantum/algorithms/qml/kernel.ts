import { QuantumGate } from '../../simulator';

/**
 * Quantum Kernel Estimation
 * 
 * Generates a circuit to compute the kernel overlap |<phi(x)|phi(y)>|^2.
 * U(x) prepares state |phi(x)>, U(y) prepares state |phi(y)>.
 * The circuit applies U(x) followed by U(y)^dagger, and we measure the probability of the |0...0> state.
 */
export const generateQuantumKernel = (
  featureX: number[],
  featureY: number[],
  qubitCount: number
): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  let pos = 0;
  
  // 1. Data Encoding for x (U(x))
  for (let i = 0; i < Math.min(featureX.length, qubitCount); i++) {
    gates.push({ id: `qk-H-x-${i}`, type: 'H', qubit: i, position: pos });
  }
  pos++;
  
  for (let i = 0; i < Math.min(featureX.length, qubitCount); i++) {
    // ZZFeatureMap style encoding
    gates.push({ id: `qk-RZ-x-${i}`, type: 'Rz', qubit: i, angle: 2 * featureX[i], position: pos });
  }
  pos++;
  
  // Simplified entanglement for feature map
  if (qubitCount > 1) {
    for (let i = 0; i < qubitCount - 1; i++) {
      gates.push({ id: `qk-CX-x-${i}`, type: 'CNOT', qubit: i, targetQubit: i + 1, position: pos++ });
      // In a full ZZFeatureMap, we'd add RZ with angle (pi - x_i)(pi - x_j) here
      gates.push({ id: `qk-CX-x-2-${i}`, type: 'CNOT', qubit: i, targetQubit: i + 1, position: pos++ });
    }
  }
  
  // 2. Data Encoding for y adjoint (U(y)^dagger)
  // Reverse the operations and negate angles
  
  if (qubitCount > 1) {
    for (let i = qubitCount - 2; i >= 0; i--) {
      gates.push({ id: `qk-CX-y-2-${i}`, type: 'CNOT', qubit: i, targetQubit: i + 1, position: pos++ });
      gates.push({ id: `qk-CX-y-${i}`, type: 'CNOT', qubit: i, targetQubit: i + 1, position: pos++ });
    }
  }
  
  for (let i = 0; i < Math.min(featureY.length, qubitCount); i++) {
    gates.push({ id: `qk-RZ-y-${i}`, type: 'Rz', qubit: i, angle: -2 * featureY[i], position: pos });
  }
  pos++;
  
  for (let i = 0; i < Math.min(featureY.length, qubitCount); i++) {
    gates.push({ id: `qk-H-y-${i}`, type: 'H', qubit: i, position: pos });
  }
  pos++;
  
  // 3. Measurement (to check prob of |0...0>)
  for (let i = 0; i < qubitCount; i++) {
    gates.push({ id: `qk-M-${i}`, type: 'M', qubit: i, position: pos });
  }
  
  return gates;
};
