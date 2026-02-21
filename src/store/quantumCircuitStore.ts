import { create } from 'zustand';
import { QuantumGate, SimulationResult, GateType } from '@/types/quantum';
import { simulateCircuit } from '@/lib/quantum/simulator';
import { CircuitTemplate, createGatesFromTemplate } from '@/lib/quantum/templates';

/**
 * ============================================================
 * QUBIT LIMITS
 * ============================================================
 * Define constraints for qubit count based on simulation method:
 * - State vector: up to 15 qubits (2^15 = 32K states)
 * - MPS tensor network: up to 25 qubits (with truncation)
 * ============================================================
 */
export const QUBIT_LIMITS = {
  MIN: 2,
  DEFAULT: 5,
  STATE_VECTOR_MAX: 15,
  MPS_MAX: 25,
  TENSOR_NETWORK_MAX: 120, // Extended limit with tensor network
};

 /**
  * ============================================================
  * UNDO/REDO HISTORY SYSTEM
  * ============================================================
  * 
  * We maintain a history stack of circuit states for undo/redo.
  * - `past`: Array of previous gate configurations (for undo)
  * - `future`: Array of undone states (for redo)
  * 
  * When user modifies the circuit:
  * 1. Current state is pushed to `past`
  * 2. `future` is cleared (can't redo after new action)
  * 
  * Undo: Pop from `past`, push current to `future`
  * Redo: Pop from `future`, push current to `past`
  * ============================================================
  */
 interface HistoryState {
   gates: QuantumGate[];
 }
 
 const MAX_HISTORY_LENGTH = 50; // Limit memory usage
 
 /**
  * ============================================================
  * HELPER: Save current state to history before modification
  * ============================================================
  * This is called before every state-changing operation to enable undo.
  * We capture the current gates array and push it to the past stack.
  * ============================================================
  */
 const saveToHistory = (gates: QuantumGate[], past: HistoryState[]): HistoryState[] => {
   const newPast = [...past, { gates: [...gates] }];
   // Limit history size to prevent memory issues
   if (newPast.length > MAX_HISTORY_LENGTH) {
     return newPast.slice(-MAX_HISTORY_LENGTH);
   }
   return newPast;
 };
 
/**
 * Multi-qubit gate placement mode
 * Step 1: 'selectControl' - waiting for user to click a control qubit
 * Step 2: 'selectTarget' - waiting for user to click a target qubit
 */
export interface PlacementMode {
  gateType: string;
  step: 'selectControl' | 'selectTarget';
  controlQubit?: number;
}

interface QuantumCircuitStore {
  // Circuit state
  gates: QuantumGate[];
  qubitCount: number;
  simulationMethod: 'stateVector' | 'mps' | 'auto';
  executionTimeMs: number | null;
  
  // Simulation
  isSimulating: boolean;
  simulationResult: SimulationResult | null;
  
  // Drag state
  draggedGate: string | null;
  
  // Template state
  activeTemplate: CircuitTemplate | null;
  
  // Selection state
  selectedGateId: string | null;
  
  // Multi-qubit placement mode
  placementMode: PlacementMode | null;
  
  // Undo/Redo history
  past: HistoryState[];
  future: HistoryState[];
 
  // Actions
  addGate: (gate: QuantumGate) => void;
  removeGate: (gateId: string) => void;
  updateGate: (gateId: string, updates: Partial<QuantumGate>) => void;
  clearCircuit: () => void;
  setDraggedGate: (gateType: string | null) => void;
  simulate: () => void;
  loadTemplate: (template: CircuitTemplate) => void;
   
  // Selection actions
  selectGate: (gateId: string | null) => void;
   
  // Placement mode actions
  startPlacementMode: (gateType: string) => void;
  cancelPlacementMode: () => void;
  selectQubitForPlacement: (qubitIndex: number) => void;
   
  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
   
  // Gate manipulation
  duplicateGate: (gateId: string) => void;
  moveGate: (gateId: string, newQubit: number, newPosition: number) => void;
   
  // Direct setters
  setGates: (gates: QuantumGate[]) => void;
  setQubitCount: (count: number) => void;
  setSimulationMethod: (method: 'stateVector' | 'mps' | 'auto') => void;
  incrementQubits: () => void;
  decrementQubits: () => void;
  
  // Computed
  getCircuitDepth: () => number;
  getGateCount: () => number;
}

// Gates that require multi-qubit selection workflow
export const MULTI_QUBIT_GATES = new Set([
  'CNOT', 'SWAP', 'CZ', 'CY', 'CH', 'iSWAP', 'CP', 'CRx', 'CRy', 'CRz',
]);

export const THREE_QUBIT_GATES = new Set([
  'CCX', 'CCZ', 'CSWAP',
]);

export const useQuantumCircuitStore = create<QuantumCircuitStore>((set, get) => ({
  gates: [],
  qubitCount: QUBIT_LIMITS.DEFAULT,
  simulationMethod: 'auto',
  executionTimeMs: null,
  isSimulating: false,
  simulationResult: null,
  draggedGate: null,
  activeTemplate: null,
  selectedGateId: null,
  placementMode: null,
  past: [],
  future: [],

   addGate: (gate) => set((state) => ({
     past: saveToHistory(state.gates, state.past),
     future: [],
    gates: [...state.gates, gate],
     activeTemplate: null,
  })),

  removeGate: (gateId) => set((state) => ({
     past: saveToHistory(state.gates, state.past),
     future: [],
    gates: state.gates.filter((g) => g.id !== gateId),
     selectedGateId: state.selectedGateId === gateId ? null : state.selectedGateId,
     activeTemplate: null,
  })),

  updateGate: (gateId, updates) => set((state) => ({
     past: saveToHistory(state.gates, state.past),
     future: [],
     gates: state.gates.map((g) =>
      g.id === gateId ? { ...g, ...updates } : g
    ),
     activeTemplate: null,
  })),

   clearCircuit: () => set((state) => ({
     past: saveToHistory(state.gates, state.past),
     future: [],
     gates: [],
    simulationResult: null,
     activeTemplate: null,
     selectedGateId: null,
   })),

  setDraggedGate: (gateType) => set({ draggedGate: gateType }),

  loadTemplate: (template) => {
     const state = get();
    const gates = createGatesFromTemplate(template);
    set({
       past: saveToHistory(state.gates, state.past),
       future: [],
      gates,
      activeTemplate: template,
       simulationResult: null,
       selectedGateId: null,
    });
  },
   
   selectGate: (gateId) => set({ selectedGateId: gateId }),
   
   startPlacementMode: (gateType) => set({ 
     placementMode: { gateType, step: 'selectControl' },
     selectedGateId: null,
   }),
   
   cancelPlacementMode: () => set({ placementMode: null }),
   
   selectQubitForPlacement: (qubitIndex) => {
     const state = get();
     const { placementMode, gates, qubitCount } = state;
     if (!placementMode) return;
     
     if (placementMode.step === 'selectControl') {
       set({ 
         placementMode: { 
           ...placementMode, 
           step: 'selectTarget', 
           controlQubit: qubitIndex 
         } 
       });
     } else if (placementMode.step === 'selectTarget') {
       const controlQubit = placementMode.controlQubit!;
       if (qubitIndex === controlQubit) return; // Must be different
       
       const maxPosition = gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 1 : 0;
       
       const newGate: QuantumGate = {
         id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
         type: placementMode.gateType as GateType,
         qubit: controlQubit,
         position: maxPosition,
         targetQubit: qubitIndex,
         ...((['Rx', 'Ry', 'Rz', 'CRx', 'CRy', 'CRz', 'CP'].includes(placementMode.gateType)) 
           && { angle: Math.PI / 2 }),
       };
       
       set({
         past: saveToHistory(gates, state.past),
         future: [],
         gates: [...gates, newGate],
         placementMode: null,
         activeTemplate: null,
       });
     }
   },
   
   undo: () => set((state) => {
     if (state.past.length === 0) return state;
     const previous = state.past[state.past.length - 1];
     const newPast = state.past.slice(0, -1);
     return {
       past: newPast,
       future: [{ gates: [...state.gates] }, ...state.future],
       gates: previous.gates,
       selectedGateId: null,
       activeTemplate: null,
     };
   }),
   
   redo: () => set((state) => {
     if (state.future.length === 0) return state;
     const next = state.future[0];
     const newFuture = state.future.slice(1);
     return {
       past: [...state.past, { gates: [...state.gates] }],
       future: newFuture,
       gates: next.gates,
       selectedGateId: null,
       activeTemplate: null,
     };
   }),
   
   canUndo: () => get().past.length > 0,
   canRedo: () => get().future.length > 0,
   
   duplicateGate: (gateId) => {
     const state = get();
     const gate = state.gates.find(g => g.id === gateId);
     if (!gate) return;
     
     const occupiedPositions = state.gates
       .filter(g => g.qubit === gate.qubit)
       .map(g => g.position);
     
     let newPosition = gate.position + 1;
     while (occupiedPositions.includes(newPosition)) {
       newPosition++;
     }
     
     const newGate: QuantumGate = {
       ...gate,
       id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
       position: newPosition,
     };
     
     set({
       past: saveToHistory(state.gates, state.past),
       future: [],
       gates: [...state.gates, newGate],
       selectedGateId: newGate.id,
       activeTemplate: null,
     });
   },
   
   moveGate: (gateId, newQubit, newPosition) => {
     const state = get();
     const isOccupied = state.gates.some(
       g => g.id !== gateId && g.qubit === newQubit && g.position === newPosition
     );
     if (isOccupied) return;
     
     set({
       past: saveToHistory(state.gates, state.past),
       future: [],
       gates: state.gates.map(g =>
         g.id === gateId ? { ...g, qubit: newQubit, position: newPosition } : g
       ),
       activeTemplate: null,
     });
   },
 
   setGates: (gates) => set((state) => ({
     past: saveToHistory(state.gates, state.past),
     future: [],
     gates,
     activeTemplate: null,
     selectedGateId: null,
   })),
 
   setQubitCount: (qubitCount) => set({ qubitCount }),

   setSimulationMethod: (simulationMethod) => set({ simulationMethod }),
   
   incrementQubits: () => set((state) => {
      const maxQubits = state.simulationMethod === 'mps' 
        ? QUBIT_LIMITS.TENSOR_NETWORK_MAX 
        : state.simulationMethod === 'auto'
        ? QUBIT_LIMITS.MPS_MAX
        : QUBIT_LIMITS.STATE_VECTOR_MAX;
      return {
        qubitCount: Math.min(state.qubitCount + 1, maxQubits),
      };
    }),
   
   decrementQubits: () => set((state) => ({
     qubitCount: Math.max(state.qubitCount - 1, QUBIT_LIMITS.MIN),
   })),

  simulate: () => {
    set({ isSimulating: true });
    
    // Use setTimeout to allow UI to update before running simulation
    setTimeout(() => {
      const { gates, qubitCount } = get();
      const startTime = performance.now();
      
      // Run the real quantum simulation
      const result = simulateCircuit(gates, qubitCount);
      
      const endTime = performance.now();
      
      set({
        isSimulating: false,
        executionTimeMs: endTime - startTime,
        simulationResult: {
          probabilities: result.probabilities,
          blochVectors: result.blochVectors,
          isEntangled: result.isEntangled,
          entangledPairs: result.entangledPairs,
          amplitudes: result.amplitudes,
          circuitDepth: result.circuitDepth,
          hasMeasurement: result.hasMeasurement
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
