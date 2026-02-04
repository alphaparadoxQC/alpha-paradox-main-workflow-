import { create } from 'zustand';
import { QuantumGate, CircuitState, SimulationResult } from '@/types/quantum';

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
    
    // Simulate quantum circuit (simplified mock simulation)
    setTimeout(() => {
      const { gates, qubitCount } = get();
      const numStates = Math.pow(2, qubitCount);
      
      // Generate mock probabilities based on gates
      const probabilities: { state: string; probability: number }[] = [];
      let totalProb = 0;
      
      for (let i = 0; i < numStates; i++) {
        const state = i.toString(2).padStart(qubitCount, '0');
        // Create interesting distribution based on gates
        let prob = Math.random();
        
        // Hadamard gates create more uniform distribution
        const hGates = gates.filter(g => g.type === 'H').length;
        if (hGates > 0) {
          prob = (prob + 1 / numStates * hGates) / (1 + hGates);
        }
        
        probabilities.push({ state: `|${state}⟩`, probability: prob });
        totalProb += prob;
      }
      
      // Normalize
      probabilities.forEach(p => {
        p.probability = p.probability / totalProb;
      });
      
      // Sort by probability descending
      probabilities.sort((a, b) => b.probability - a.probability);
      
      // Generate mock Bloch vectors
      const blochVectors = Array.from({ length: qubitCount }, (_, i) => {
        const qubitGates = gates.filter(g => g.qubit === i);
        let x = 0, y = 0, z = 1;
        
        qubitGates.forEach(gate => {
          switch (gate.type) {
            case 'H':
              x = 1 / Math.sqrt(2);
              z = 1 / Math.sqrt(2);
              break;
            case 'X':
              z = -z;
              break;
            case 'Y':
              const tempY = z;
              z = -x;
              x = tempY;
              break;
            case 'Z':
              x = -x;
              y = -y;
              break;
          }
        });
        
        return { x, y, z };
      });
      
      set({
        isSimulating: false,
        simulationResult: { probabilities, blochVectors }
      });
    }, 1500);
  },

  getCircuitDepth: () => {
    const { gates } = get();
    if (gates.length === 0) return 0;
    return Math.max(...gates.map(g => g.position)) + 1;
  },

  getGateCount: () => get().gates.length,
}));
