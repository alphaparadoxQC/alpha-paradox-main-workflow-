import { generateQuantumKernel } from './kernel';
import { QuantumGate } from '../../simulator';

/**
 * QSVM Demo Configuration
 */
export interface QSVMConfig {
  trainingDataX: number[][]; // N_train x numFeatures
  trainingDataY: number[];   // N_train labels (+1 or -1)
  testDataX: number[][];     // N_test x numFeatures
  qubitCount: number;
}

/**
 * Educational QSVM wrapper.
 * For an actual SVM, we'd need a classical convex optimizer (like SMO)
 * to solve the dual formulation using the quantum kernel matrix K_ij = |<phi(x_i)|phi(x_j)>|^2.
 * 
 * Here we return the set of circuits needed to compute the Kernel matrix.
 */
export const generateQSVMKernelCircuits = (config: QSVMConfig): QuantumGate[][] => {
  const circuits: QuantumGate[][] = [];
  const N = config.trainingDataX.length;
  
  // Generate a circuit for each upper triangular entry of the kernel matrix K
  for (let i = 0; i < N; i++) {
    for (let j = i; j < N; j++) {
      const circuit = generateQuantumKernel(
        config.trainingDataX[i],
        config.trainingDataX[j],
        config.qubitCount
      );
      circuits.push(circuit);
    }
  }
  
  return circuits;
};
