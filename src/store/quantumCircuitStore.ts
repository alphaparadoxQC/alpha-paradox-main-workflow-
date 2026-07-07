import { create } from 'zustand';
import { QuantumGate, SimulationResult, GateType } from '@/types/quantum';
import { CircuitTemplate, createGatesFromTemplate } from '@/lib/quantum/templates';
import QuantumWorker from '@/lib/quantum/workers/quantumWorker?worker';
import { toast } from 'sonner';

// Module-level reference to the active Web Worker to allow cancellation
let activeWorker: Worker | null = null;

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
  STATE_VECTOR_MAX: 25,
  MPS_MAX: 100, // Increased for larger scale simulation
  TENSOR_NETWORK_MAX: 1000, // Extended limit for 100+ qubits
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
   gatesJson: string;
 }
 
 const MAX_HISTORY_LENGTH = 50; // Limit memory usage
 
 /**
  * ============================================================
  * HELPER: Save current state to history before modification
  * ============================================================
  */
 const saveToHistory = (gates: QuantumGate[], past: HistoryState[]): HistoryState[] => {
   const newPast = [...past, { gatesJson: JSON.stringify(gates) }];
   // Limit history size to prevent memory issues
   if (newPast.length > MAX_HISTORY_LENGTH) {
     return newPast.slice(-MAX_HISTORY_LENGTH);
   }
   return newPast;
 };
 
interface QuantumCircuitStore {
  // Circuit state
  gates: QuantumGate[];
  qubitCount: number;
  classicalBitCount: number;
  simulationMethod: 'stateVector' | 'mps' | 'auto';
  executionTimeMs: number | null;
  
  // Simulation
  isSimulating: boolean;
  gpuAccelerated: boolean;
  simulationResult: SimulationResult | null;
  
  // Drag state
  draggedGate: string | null;
  
  // Template state
  activeTemplate: CircuitTemplate | null;
  
  // Bit order convention
  bitOrder: 'MSB' | 'LSB';
  
   // Selection state
   selectedGateId: string | null;
   
   // History undo/redo system
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
  setBitOrder: (order: 'MSB' | 'LSB') => void;
   
   // Selection actions
   selectGate: (gateId: string | null) => void;
   
   // Gate manipulation
   duplicateGate: (gateId: string) => void;
   moveGate: (gateId: string, newQubit: number, newPosition: number) => void;
   moveTargetNode: (gateId: string, newTargetQubit: number) => void;
   
   // History actions
   undo: () => void;
   redo: () => void;
   canUndo: () => boolean;
   canRedo: () => boolean;
   
   // History actions
   // Direct setters (for loading from gallery/storage)
   setGates: (gates: QuantumGate[]) => void;
   setQubitCount: (count: number) => void;
   setClassicalBitCount: (count: number) => void;
   setSimulationMethod: (method: 'stateVector' | 'mps' | 'auto') => void;
   incrementQubits: () => void;
   decrementQubits: () => void;
   incrementClassicalBits: () => void;
   decrementClassicalBits: () => void;
  
  // Computed
  getCircuitDepth: () => number;
  getGateCount: () => number;
  getQASM: () => string;
  setFromQASM: (qasm: string) => void;
}

export const useQuantumCircuitStore = create<QuantumCircuitStore>((set, get) => ({
  gates: [],
  qubitCount: QUBIT_LIMITS.DEFAULT,
  classicalBitCount: QUBIT_LIMITS.DEFAULT,
  simulationMethod: 'auto',
  executionTimeMs: null,
  isSimulating: false,
  gpuAccelerated: false,
  simulationResult: null,
  draggedGate: null,
  activeTemplate: null,
  bitOrder: 'MSB',
  
   selectedGateId: null,
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
   
   undo: () => set((state) => {
     if (state.past.length === 0) return state;
     const previous = state.past[state.past.length - 1];
     const newPast = state.past.slice(0, -1);
     return {
       past: newPast,
       future: [{ gatesJson: JSON.stringify(state.gates) }, ...state.future],
       gates: JSON.parse(previous.gatesJson),
       selectedGateId: null,
       activeTemplate: null,
     };
   }),
   
   redo: () => set((state) => {
     if (state.future.length === 0) return state;
     const next = state.future[0];
     const newFuture = state.future.slice(1);
     return {
       past: [...state.past, { gatesJson: JSON.stringify(state.gates) }],
       future: newFuture,
       gates: JSON.parse(next.gatesJson),
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
     
     // If it's a controlled gate, update controlQubit if it's the main qubit
     // This maintains the target offset if possible, but actually we only move the control.
     // Wait, if it moves to a new qubit, and target remains the same...
     // We will just let targetQubit be whatever it was, unless it collides.
     set({
       past: saveToHistory(state.gates, state.past),
       future: [],
       gates: state.gates.map(g => {
         if (g.id === gateId) {
           const updates: Partial<QuantumGate> = { qubit: newQubit, position: newPosition };
           if (g.controlQubit !== undefined) updates.controlQubit = newQubit;
           return { ...g, ...updates };
         }
         return g;
       }),
       activeTemplate: null,
     });
   },

   moveTargetNode: (gateId, newTargetQubit) => {
     const state = get();
     set({
       past: saveToHistory(state.gates, state.past),
       future: [],
       gates: state.gates.map(g =>
         g.id === gateId ? { ...g, targetQubit: newTargetQubit } : g
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
   
   setClassicalBitCount: (classicalBitCount) => set({ classicalBitCount }),

   setSimulationMethod: (simulationMethod) => set({ simulationMethod }),
   
   incrementQubits: () => set((state) => {
      const maxQubits = state.simulationMethod === 'mps' 
        ? QUBIT_LIMITS.TENSOR_NETWORK_MAX 
        : state.simulationMethod === 'auto'
        ? QUBIT_LIMITS.MPS_MAX
        : QUBIT_LIMITS.STATE_VECTOR_MAX;
      const newCount = Math.min(state.qubitCount + 1, maxQubits);
      if (newCount === state.qubitCount) return state;
      return {
        past: saveToHistory(state.gates, state.past),
        future: [],
        qubitCount: newCount,
        simulationResult: null, // Invalidate — qubit space changed
      };
    }),
   
   decrementQubits: () => set((state) => {
     const newCount = Math.max(state.qubitCount - 1, QUBIT_LIMITS.MIN);
     if (newCount === state.qubitCount) return state; // no change
     
     // Remove gates that reference the removed qubit
     const filteredGates = state.gates.filter(g => 
       g.qubit < newCount &&
       (g.controlQubit === undefined || g.controlQubit < newCount) &&
       (g.targetQubit === undefined || g.targetQubit < newCount)
     );
     
     return {
       past: saveToHistory(state.gates, state.past),
       future: [],
       qubitCount: newCount,
       gates: filteredGates,
       activeTemplate: null,
       simulationResult: null, // Invalidate — qubit space changed
     };
   }),

   incrementClassicalBits: () => set((state) => ({
     classicalBitCount: Math.min(state.classicalBitCount + 1, 32)
   })),

   decrementClassicalBits: () => set((state) => ({
     classicalBitCount: Math.max(state.classicalBitCount - 1, 0)
   })),

  setBitOrder: (order) => {
    set({ bitOrder: order });
    get().simulate(); // Re-simulate to update bit strings
  },

  simulate: () => {
    set({ isSimulating: true });
    
    // Terminate any currently running simulation
    if (activeWorker) {
      activeWorker.terminate();
      activeWorker = null;
    }

    const { gates, qubitCount, bitOrder } = get();
    const startTime = performance.now();
    
    // #region agent log
    fetch('http://127.0.0.1:7589/ingest/7d431922-f103-452a-8045-35deb37a60c8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1666b2'},body:JSON.stringify({sessionId:'1666b2',runId:'initial',hypothesisId:'H2',location:'src/store/quantumCircuitStore.ts:360',message:'simulate invoked',data:{gateCount:gates.length,qubitCount},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    // Start a new Web Worker
    activeWorker = new QuantumWorker();
    
    activeWorker.onmessage = (event) => {
      const { success, result, executionTimeMs, error } = event.data;
      
      if (success) {
        // #region agent log
        fetch('http://127.0.0.1:7589/ingest/7d431922-f103-452a-8045-35deb37a60c8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1666b2'},body:JSON.stringify({sessionId:'1666b2',runId:'initial',hypothesisId:'H2',location:'src/store/quantumCircuitStore.ts:370',message:'simulate success',data:{executionMs:executionTimeMs,probabilities:result.probabilities.length,amplitudes:result.amplitudes?.length},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        set({
          isSimulating: false,
          executionTimeMs,
          simulationResult: result,
          gpuAccelerated: result.gpuAccelerated || false,
        });
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7589/ingest/7d431922-f103-452a-8045-35deb37a60c8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1666b2'},body:JSON.stringify({sessionId:'1666b2',runId:'initial',hypothesisId:'H2',location:'src/store/quantumCircuitStore.ts:386',message:'simulate failed',data:{error,qubitCount,gateCount:gates.length},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        console.error("Simulation Worker Error:", error);
        toast.error("Simulation Failed", {
          description: typeof error === 'string' ? error : "An error occurred during quantum simulation."
        });
        set({ isSimulating: false });
      }
      
      // Clean up worker after it finishes
      if (activeWorker) {
        activeWorker.terminate();
        activeWorker = null;
      }
    };

    activeWorker.onerror = (error) => {
      console.error("Simulation Worker Fatal Error:", error);
      set({ isSimulating: false });
      if (activeWorker) {
        activeWorker.terminate();
        activeWorker = null;
      }
    };

    // Post data to the worker to begin simulation
    activeWorker.postMessage({ gates, qubitCount, bitOrder });
  },

  getCircuitDepth: () => {
    const { gates } = get();
    if (gates.length === 0) return 0;
    return Math.max(...gates.map(g => g.position)) + 1;
  },

  getGateCount: () => get().gates.length,

  getQASM: () => {
    const { gates, qubitCount, classicalBitCount } = get();
    let qasm = `OPENQASM 2.0;\ninclude "qelib1.inc";\n\nqreg q[${qubitCount}];\ncreg c[${classicalBitCount}];\n\n`;
    
    const sortedGates = [...gates].sort((a, b) => a.position - b.position);
    
    sortedGates.forEach(gate => {
      // Convert internal gate representation to QASM
      const type = gate.type.toLowerCase();
      if (gate.controlQubit !== undefined && gate.targetQubit !== undefined) {
        if (type === 'cnot') {
          qasm += `cx q[${gate.controlQubit}], q[${gate.targetQubit}];\n`;
        } else if (type === 'cz') {
          qasm += `cz q[${gate.controlQubit}], q[${gate.targetQubit}];\n`;
        } else if (type === 'cp' && gate.angle !== undefined) {
          qasm += `cp(${gate.angle}) q[${gate.controlQubit}], q[${gate.targetQubit}];\n`;
        }
      } else if (type === 'm') {
        qasm += `measure q[${gate.qubit}] -> c[${gate.qubit % classicalBitCount}];\n`;
      } else if (gate.angle !== undefined && ['rx', 'ry', 'rz', 'p'].includes(type)) {
        qasm += `${type}(${gate.angle}) q[${gate.qubit}];\n`;
      } else {
        qasm += `${type} q[${gate.qubit}];\n`;
      }
    });
    
    return qasm;
  },

  setFromQASM: (qasm: string) => {
    const lines = qasm.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('OPENQASM') && !l.startsWith('include'));
    const newGates: QuantumGate[] = [];
    let currentPosition = 0;
    let unmatchedLines = 0;
    
    // Quick regex patterns
    const qregRegex = /qreg\s+[a-zA-Z]+\[(\d+)\];/;
    const cregRegex = /creg\s+[a-zA-Z]+\[(\d+)\];/;
    const measureRegex = /measure\s+q\[(\d+)\]\s*->\s*c\[(\d+)\];/;
    const twoQubitRegex = /(cx|cz|swap)\s+q\[(\d+)\],\s*q\[(\d+)\];/;
    const oneQubitRegex = /([a-z]+)\s+q\[(\d+)\];/;
    const rotationRegex = /([a-z]+)\(([^)]+)\)\s+q\[(\d+)\];/;

    lines.forEach(line => {
      let match = line.match(qregRegex);
      if (match) {
        get().setQubitCount(Math.min(parseInt(match[1]), QUBIT_LIMITS.TENSOR_NETWORK_MAX));
        return;
      }
      
      match = line.match(cregRegex);
      if (match) {
        get().setClassicalBitCount(parseInt(match[1]));
        return;
      }

      match = line.match(measureRegex);
      if (match) {
        newGates.push({
          id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'M',
          qubit: parseInt(match[1]),
          position: currentPosition++
        });
        return;
      }

      match = line.match(twoQubitRegex);
      if (match) {
        const typeStr = match[1].toUpperCase() === 'CX' ? 'CNOT' : match[1].toUpperCase();
        newGates.push({
          id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: typeStr as GateType,
          qubit: parseInt(match[2]),
          controlQubit: parseInt(match[2]),
          targetQubit: parseInt(match[3]),
          position: currentPosition++
        });
        return;
      }

      match = line.match(rotationRegex);
      if (match) {
        let typeStr = match[1];
        typeStr = typeStr.charAt(0).toUpperCase() + typeStr.slice(1); // Rx, Ry, Rz
        let angle = 0;
        try { angle = parseFloat(match[2].replace('pi', Math.PI.toString())); } catch(e){ /* ignore */ }
        
        newGates.push({
          id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: typeStr as GateType,
          qubit: parseInt(match[3]),
          position: currentPosition++,
          angle
        });
        return;
      }

      match = line.match(oneQubitRegex);
      if (match) {
        newGates.push({
          id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: match[1].toUpperCase() as GateType,
          qubit: parseInt(match[2]),
          position: currentPosition++
        });
        return;
      }
      unmatchedLines++;
    });

    // #region agent log
    fetch('http://127.0.0.1:7589/ingest/7d431922-f103-452a-8045-35deb37a60c8',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1666b2'},body:JSON.stringify({sessionId:'1666b2',runId:'initial',hypothesisId:'H3',location:'src/store/quantumCircuitStore.ts:507',message:'setFromQASM parsed',data:{inputLines:lines.length,parsedGates:newGates.length,unmatchedLines},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    set((state) => ({
      past: saveToHistory(state.gates, state.past),
      future: [],
      gates: newGates,
      activeTemplate: null,
      selectedGateId: null,
    }));
  }
}));
