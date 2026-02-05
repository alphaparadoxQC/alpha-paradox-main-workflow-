import { create } from 'zustand';
import { QuantumGate, SimulationResult } from '@/types/quantum';
import { simulateCircuit } from '@/lib/quantum/simulator';

export interface CircuitTemplate {
  id: string;
  name: string;
  description: string;
  gates: Omit<QuantumGate, 'id'>[];
}

export const CIRCUIT_TEMPLATES: CircuitTemplate[] = [
  {
    id: 'bell-state',
    name: 'Bell State',
    description: 'Creates maximum entanglement between two qubits. The resulting state is (|00⟩ + |11⟩)/√2.',
    gates: [
      { type: 'H', qubit: 0, position: 0 },
      { type: 'CNOT', qubit: 0, position: 1, controlQubit: 0, targetQubit: 1 },
    ],
  },
  {
    id: 'ghz-state',
    name: 'GHZ State',
    description: 'Greenberger–Horne–Zeilinger state - 3-qubit entanglement: (|000⟩ + |111⟩)/√2.',
    gates: [
      { type: 'H', qubit: 0, position: 0 },
      { type: 'CNOT', qubit: 0, position: 1, controlQubit: 0, targetQubit: 1 },
      { type: 'CNOT', qubit: 0, position: 2, controlQubit: 0, targetQubit: 2 },
    ],
  },
  {
    id: 'teleportation',
    name: 'Quantum Teleportation',
    description: 'Transfers quantum state from qubit 0 to qubit 2 using entanglement and classical communication.',
    gates: [
      { type: 'H', qubit: 0, position: 0 },
      { type: 'H', qubit: 1, position: 1 },
      { type: 'CNOT', qubit: 1, position: 2, controlQubit: 1, targetQubit: 2 },
      { type: 'CNOT', qubit: 0, position: 3, controlQubit: 0, targetQubit: 1 },
      { type: 'H', qubit: 0, position: 4 },
      { type: 'M', qubit: 0, position: 5 },
      { type: 'M', qubit: 1, position: 5 },
      { type: 'X', qubit: 2, position: 6 },
      { type: 'Z', qubit: 2, position: 7 },
    ],
  },
  {
    id: 'grover-2qubit',
    name: "Grover's Search (2-qubit)",
    description: 'Searches for marked state |11⟩ with quadratic speedup. Single iteration for 2 qubits.',
    gates: [
      { type: 'H', qubit: 0, position: 0 },
      { type: 'H', qubit: 1, position: 0 },
      { type: 'Z', qubit: 0, position: 1 },
      { type: 'Z', qubit: 1, position: 1 },
      { type: 'CNOT', qubit: 0, position: 2, controlQubit: 0, targetQubit: 1 },
      { type: 'Z', qubit: 1, position: 3 },
      { type: 'CNOT', qubit: 0, position: 4, controlQubit: 0, targetQubit: 1 },
      { type: 'H', qubit: 0, position: 5 },
      { type: 'H', qubit: 1, position: 5 },
      { type: 'X', qubit: 0, position: 6 },
      { type: 'X', qubit: 1, position: 6 },
      { type: 'H', qubit: 1, position: 7 },
      { type: 'CNOT', qubit: 0, position: 8, controlQubit: 0, targetQubit: 1 },
      { type: 'H', qubit: 1, position: 9 },
      { type: 'X', qubit: 0, position: 10 },
      { type: 'X', qubit: 1, position: 10 },
      { type: 'H', qubit: 0, position: 11 },
      { type: 'H', qubit: 1, position: 11 },
    ],
  },
  {
    id: 'qft-2qubit',
    name: 'QFT (2-qubit)',
    description: 'Quantum Fourier Transform on 2 qubits - fundamental building block for quantum algorithms.',
    gates: [
      { type: 'H', qubit: 0, position: 0 },
      { type: 'S', qubit: 0, position: 1 },
      { type: 'H', qubit: 1, position: 2 },
      { type: 'SWAP', qubit: 0, position: 3, targetQubit: 1 },
    ],
  },
];

interface QuantumCircuitStore {
  // Circuit state
  gates: QuantumGate[];
  qubitCount: number;
  
  // Simulation
  isSimulating: boolean;
  simulationResult: SimulationResult | null;
  
  // Drag state
  draggedGate: string | null;
  
  // Actions
  addGate: (gate: QuantumGate) => void;
  removeGate: (gateId: string) => void;
  updateGate: (gateId: string, updates: Partial<QuantumGate>) => void;
  clearCircuit: () => void;
  setDraggedGate: (gateType: string | null) => void;
  simulate: () => void;
  loadTemplate: (templateId: string) => void;
  
  // Computed
  getCircuitDepth: () => number;
  getGateCount: () => number;
}

export const useQuantumCircuitStore = create<QuantumCircuitStore>((set, get) => ({
  gates: [],
  qubitCount: 5,
  isSimulating: false,
  simulationResult: null,
  draggedGate: null,

  addGate: (gate) => set((state) => ({ 
    gates: [...state.gates, gate] 
  })),

  removeGate: (gateId) => set((state) => ({
    gates: state.gates.filter((g) => g.id !== gateId)
  })),

  updateGate: (gateId, updates) => set((state) => ({
    gates: state.gates.map((g) => 
      g.id === gateId ? { ...g, ...updates } : g
    )
  })),

  clearCircuit: () => set({ 
    gates: [], 
    simulationResult: null 
  }),

  setDraggedGate: (gateType) => set({ draggedGate: gateType }),

  simulate: () => {
    set({ isSimulating: true });
    
    // Use setTimeout to allow UI to update before running simulation
    setTimeout(() => {
      const { gates, qubitCount } = get();
      
      // Run the real quantum simulation
      const result = simulateCircuit(gates, qubitCount);
      
      set({
        isSimulating: false,
        simulationResult: {
          probabilities: result.probabilities,
          blochVectors: result.blochVectors
        }
      });
    }, 500); // Small delay for visual feedback
  },

  loadTemplate: (templateId) => {
    const template = CIRCUIT_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    
    set({ gates: [], simulationResult: null });
    
    const newGates: QuantumGate[] = template.gates.map((gate, index) => ({
      ...gate,
      id: `${templateId}-${index}-${Date.now()}`,
    }));
    
    set({ gates: newGates });
  },

  getCircuitDepth: () => {
    const { gates } = get();
    if (gates.length === 0) return 0;
    return Math.max(...gates.map(g => g.position)) + 1;
  },

  getGateCount: () => get().gates.length,
}));
