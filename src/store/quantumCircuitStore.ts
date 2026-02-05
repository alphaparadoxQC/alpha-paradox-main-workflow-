import { create } from 'zustand';
import { QuantumGate, SimulationResult } from '@/types/quantum';
import { simulateCircuit } from '@/lib/quantum/simulator';

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
    
    // Use setTimeout to allow UI to update before running simulation
    setTimeout(() => {
      const { gates, qubitCount } = get();
      
      // Run the real quantum simulation
      const result = simulateCircuit(gates, qubitCount);
      
      set({
        isSimulating: false,
        simulationResult: {
          probabilities: result.probabilities,
          blochVectors: result.blochVectors,
          isEntangled: result.isEntangled,
          entangledPairs: result.entangledPairs
        }
      });
    }, 500); // Small delay for visual feedback
  },

  getCircuitDepth: () => {
    const { gates } = get();
    if (gates.length === 0) return 0;
    return Math.max(...gates.map(g => g.position)) + 1;
  },

  getGateCount: () => get().gates.length,
}));
