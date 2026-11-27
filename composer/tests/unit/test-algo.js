import { QuantumCircuit } from './src/quantum-engine/circuit.js';

const nq = 3;
const qc = new QuantumCircuit(nq * 2 + 1, nq * 2 + 1);
// Create Bell pairs
for (let i = 0; i < nq; i++) {
  qc.h(nq + i);
  qc.cx(nq + i, nq + nq + i);
}
// Bell measurement
qc.cx(0, nq);
qc.h(0);
qc.measure(0, 0);
for (let i = 0; i < nq; i++) {
  qc.cx(i, nq + i);
  qc.measure(i, i);
}
console.log(qc.toGrid());
