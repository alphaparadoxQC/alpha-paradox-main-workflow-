import { simulateCircuit } from './src/lib/quantum/simulator';
import { QuantumGate } from './src/types/quantum';

const gates: QuantumGate[] = [
  { id: '1', type: 'X', qubit: 0, position: 0 }
];

const resultMSB = simulateCircuit(gates, 3, 'MSB');
const resultLSB = simulateCircuit(gates, 3, 'LSB');

console.log('MSB Probabilities:', resultMSB.probabilities);
console.log('LSB Probabilities:', resultLSB.probabilities);
