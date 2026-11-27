import { QuantumCircuit } from './src/quantum-engine/circuit.js';
import { provider } from './src/quantum-engine/backend-provider.js';

const qc = new QuantumCircuit(3, 3);
qc.h(1);
qc.cx(1, 2);
qc.cx(0, 1);
qc.h(0);
qc.measure(0, 0);
qc.measure(1, 1);
qc.cx(1, 2);
qc.cz(0, 2);

try {
  const backend = provider.getBackend('aer_statevector');
  const result = backend.run(qc, { shots: 1024 });
  console.log("Simulated successfully", !!result.statevector);
} catch (err) {
  console.error("Simulation error:", err);
}
