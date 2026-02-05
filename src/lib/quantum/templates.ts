 /**
  * Quantum Circuit Templates
  * Pre-built circuits for common quantum algorithms
  */
 
 import { QuantumGate, GateType } from '@/types/quantum';
 
 export interface CircuitTemplate {
   id: string;
   name: string;
   description: string;
   gates: Omit<QuantumGate, 'id'>[];
   qubitCount: number;
 }
 
 const generateId = () => `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
 
 export const CIRCUIT_TEMPLATES: CircuitTemplate[] = [
   {
     id: 'bell-state',
     name: 'Bell State',
     description: 'Creates maximally entangled state (|00⟩ + |11⟩)/√2. Foundation of quantum entanglement.',
     qubitCount: 5,
     gates: [
       { type: 'H', qubit: 0, position: 0 },
       { type: 'CNOT', qubit: 0, position: 1, targetQubit: 1 },
     ],
   },
   {
     id: 'ghz-state',
     name: 'GHZ State',
     description: 'Creates 3-qubit entangled state (|000⟩ + |111⟩)/√2. Named after Greenberger-Horne-Zeilinger.',
     qubitCount: 5,
     gates: [
       { type: 'H', qubit: 0, position: 0 },
       { type: 'CNOT', qubit: 0, position: 1, targetQubit: 1 },
       { type: 'CNOT', qubit: 0, position: 2, targetQubit: 2 },
     ],
   },
   {
     id: 'quantum-teleportation',
     name: 'Quantum Teleportation',
     description: 'Teleports quantum state from q0 to q2 using entanglement and classical communication.',
     qubitCount: 5,
     gates: [
       // Prepare state to teleport (example: |+⟩)
       { type: 'H', qubit: 0, position: 0 },
       // Create Bell pair between q1 and q2
       { type: 'H', qubit: 1, position: 0 },
       { type: 'CNOT', qubit: 1, position: 1, targetQubit: 2 },
       // Bell measurement on q0 and q1
       { type: 'CNOT', qubit: 0, position: 2, targetQubit: 1 },
       { type: 'H', qubit: 0, position: 3 },
       // Conditional operations (simplified - in real protocol these are classically controlled)
       { type: 'CNOT', qubit: 1, position: 4, targetQubit: 2 },
       { type: 'CZ', qubit: 0, position: 5, targetQubit: 2 },
       // Measurements
       { type: 'M', qubit: 0, position: 6 },
       { type: 'M', qubit: 1, position: 6 },
     ],
   },
   {
     id: 'grover-2qubit',
     name: "Grover's Search (2-qubit)",
     description: 'Quantum search algorithm finding marked state |11⟩ with high probability in O(√N) steps.',
     qubitCount: 5,
     gates: [
       // Initialize superposition
       { type: 'H', qubit: 0, position: 0 },
       { type: 'H', qubit: 1, position: 0 },
       // Oracle for |11⟩ (CZ marks the state)
       { type: 'CZ', qubit: 0, position: 1, targetQubit: 1 },
       // Diffusion operator
       { type: 'H', qubit: 0, position: 2 },
       { type: 'H', qubit: 1, position: 2 },
       { type: 'X', qubit: 0, position: 3 },
       { type: 'X', qubit: 1, position: 3 },
       { type: 'CZ', qubit: 0, position: 4, targetQubit: 1 },
       { type: 'X', qubit: 0, position: 5 },
       { type: 'X', qubit: 1, position: 5 },
       { type: 'H', qubit: 0, position: 6 },
       { type: 'H', qubit: 1, position: 6 },
     ],
   },
   {
     id: 'qft-2qubit',
     name: 'Quantum Fourier Transform (2-qubit)',
     description: 'Transforms computational basis to Fourier basis. Core component of Shor\'s algorithm.',
     qubitCount: 5,
     gates: [
       // QFT on 2 qubits
       { type: 'H', qubit: 0, position: 0 },
       { type: 'S', qubit: 0, position: 1 }, // Controlled-S simplified as S (controlled by q1)
       { type: 'CNOT', qubit: 1, position: 1, targetQubit: 0 }, // For demonstration
       { type: 'H', qubit: 1, position: 2 },
       // SWAP to get correct output order
       { type: 'SWAP', qubit: 0, position: 3, targetQubit: 1 },
     ],
   },
 ];
 
 export const getTemplateById = (id: string): CircuitTemplate | undefined => {
   return CIRCUIT_TEMPLATES.find(t => t.id === id);
 };
 
 export const createGatesFromTemplate = (template: CircuitTemplate): QuantumGate[] => {
   return template.gates.map((gate, index) => ({
     ...gate,
     id: `${generateId()}-${index}`,
   }));
 };