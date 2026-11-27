/**
 * Pre-built notebook templates for educational purposes.
 */

export const NOTEBOOK_TEMPLATES = [
  {
    id: 'hello-quantum',
    name: '01: Hello Quantum',
    description: 'Basic introduction to superposition and measurement.',
    cells: [
      {
        type: 'text',
        content: '# Hello, Quantum World!\n\nThis notebook demonstrates how to create a simple quantum superposition using a Hadamard (H) gate and measure the result.'
      },
      {
        type: 'code',
        content: `// 1. Create a circuit with 1 qubit and 1 classical bit
const qc = new QuantumCircuit(1, 1);

// 2. Apply a Hadamard gate to put the qubit in superposition
qc.h(0);

// 3. Measure the qubit into the classical bit
qc.measure(0, 0);

// 4. Draw the circuit
drawCircuit(qc);`
      },
      {
        type: 'text',
        content: 'Now let\'s run the circuit on the ideal statevector simulator and plot the results.'
      },
      {
        type: 'code',
        content: `// 1. Get the ideal simulator backend
const backend = provider.getBackend('aer_statevector');

// 2. Run the circuit for 1024 shots
const result = backend.run(qc, { shots: 1024 });

console.log("Execution Time:", result.metadata.executionTime, "ms");
console.log("Counts:", result.counts);

// 3. Plot the histogram
plotHistogram(result, 'Superposition Results');`
      }
    ]
  },
  {
    id: 'bell-state',
    name: '02: Entanglement (Bell State)',
    description: 'Create maximally entangled qubits.',
    cells: [
      {
        type: 'text',
        content: '# Entanglement: The Bell State\n\nQuantum entanglement is a phenomenon where the quantum states of two or more objects have to be described with reference to each other, even though the individual objects may be spatially separated.'
      },
      {
        type: 'code',
        content: `const qc = new QuantumCircuit(2, 2);

// Create a Bell state |Φ+⟩ = (|00⟩ + |11⟩) / √2
qc.h(0);           // Put qubit 0 in superposition
qc.cx(0, 1);       // CNOT with control=0, target=1

// Measure both qubits
qc.measure(0, 0);
qc.measure(1, 1);

drawCircuit(qc);`
      },
      {
        type: 'code',
        content: `const backend = provider.getBackend('aer_statevector');
const result = backend.run(qc, { shots: 1024 });

plotHistogram(result, 'Bell State Measurement');`
      }
    ]
  },
  {
    id: 'noisy-simulation',
    name: '06: Noise Exploration',
    description: 'Simulate the effects of quantum noise (decoherence, gate errors).',
    cells: [
      {
        type: 'text',
        content: '# Exploring Quantum Noise\n\nReal quantum hardware is noisy. In this notebook, we simulate a simple GHZ state (3-qubit entanglement) first on an ideal simulator, and then on a noisy simulator.'
      },
      {
        type: 'code',
        content: `// Create a 3-qubit GHZ state
const qc = new QuantumCircuit(3, 3);
qc.h(0);
qc.cx(0, 1);
qc.cx(1, 2);
qc.measureAll();

drawCircuit(qc);`
      },
      {
        type: 'code',
        content: `// Run on IDEAL simulator
const idealBackend = provider.getBackend('aer_statevector');
const idealResult = idealBackend.run(qc, { shots: 1024 });

plotHistogram(idealResult, 'Ideal GHZ State');`
      },
      {
        type: 'code',
        content: `// Define a noise model (depolarizing and readout errors)
const noiseConfig = {
  depolarizingError: { enabled: true, probability: 0.05 }, // 5% chance of random Pauli
  readoutError: { enabled: true, probability: 0.03 }       // 3% chance of flipping measurement
};

// Run on NOISY simulator
const noisyBackend = provider.getBackend('aer_qasm');
const noisyResult = noisyBackend.run(qc, { shots: 1024, noiseConfig });

plotHistogram(noisyResult, 'Noisy GHZ State');

// Calculate fidelity (how close the noisy result is to the ideal one)
const fidelity = noisyResult.fidelityWith(idealResult);
console.log("Fidelity relative to ideal:", fidelity.toFixed(4));`
      }
    ]
  }
];
