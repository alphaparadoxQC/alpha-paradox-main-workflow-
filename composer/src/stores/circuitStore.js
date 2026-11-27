import { create } from 'zustand';
import { QuantumCircuit } from '../quantum-engine/circuit.js';

export const useCircuitStore = create((set, get) => ({
  // Core state
  circuit: new QuantumCircuit(5, 3), // Default: 5 qubits, 3 clbits
  history: [],
  historyIndex: -1,

  // UI state
  selectedGateId: null,
  isDragging: false,
  clipboard: null, // { gate, params }

  // Actions
  addGate: (gateName, qubits, timeSlice = null, params = {}, clbits = []) => {
    const state = get();
    const newCircuit = state.circuit.clone();
    newCircuit.addGate(gateName, qubits, params, clbits, timeSlice);
    
    // Save to history before updating
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(state.circuit.clone());
    
    set({
      circuit: newCircuit,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      customEditMode: false
    });
  },

  removeGate: (gateId) => {
    const state = get();
    const newCircuit = state.circuit.clone();
    newCircuit.removeGate(gateId);
    
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(state.circuit.clone());
    
    set({
      circuit: newCircuit,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedGateId: state.selectedGateId === gateId ? null : state.selectedGateId,
      customEditMode: false
    });
  },

  moveGate: (gateId, newQubits, newTimeSlice) => {
    const state = get();
    const newCircuit = state.circuit.clone();
    newCircuit.moveGate(gateId, newQubits, newTimeSlice);
    
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(state.circuit.clone());
    
    set({
      circuit: newCircuit,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      customEditMode: false
    });
  },

  setRegisters: (numQubits, numClbits) => {
    const state = get();
    const newCircuit = state.circuit.clone();
    newCircuit.setRegisters(numQubits, numClbits);
    
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(state.circuit.clone());
    
    set({
      circuit: newCircuit,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      customEditMode: false
    });
  },

  loadCircuit: (circuitObj) => {
    set({
      circuit: circuitObj,
      history: [],
      historyIndex: -1,
      selectedGateId: null
    });
  },

  clearCircuit: () => {
    const state = get();
    const newCircuit = state.circuit.clone();
    newCircuit.clear();
    
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(state.circuit.clone());
    
    set({
      circuit: newCircuit,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedGateId: null,
      customEditMode: false
    });
  },

  measureAll: () => {
    const state = get();
    const newCircuit = state.circuit.clone();
    if (newCircuit.numClbits < newCircuit.numQubits) {
      newCircuit.setRegisters(newCircuit.numQubits, newCircuit.numQubits);
    }
    newCircuit.measureAll();
    
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(state.circuit.clone());
    
    set({
      circuit: newCircuit,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      customEditMode: false
    });
  },

  // Undo/Redo
  undo: () => {
    const state = get();
    if (state.historyIndex >= 0) {
      set({
        circuit: state.history[state.historyIndex],
        historyIndex: state.historyIndex - 1
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      set({
        historyIndex: state.historyIndex + 1,
        circuit: state.history[state.historyIndex + 1]
      });
    }
  },

  // UI Actions
  selectGate: (gateId) => set({ selectedGateId: gateId }),
  setDragging: (isDragging) => set({ isDragging }),
  customEditMode: false,
  setCustomEditMode: (mode) => set({ customEditMode: mode }),

  copyGate: (gateId) => {
    const state = get();
    const op = state.circuit.operations.find(o => o.id === gateId);
    if (!op) return;
    set({ clipboard: { gate: op.gate, params: { ...op.params } } });
  },

  pasteGate: (qubit, timeSlice = null) => {
    const state = get();
    if (!state.clipboard) return;
    const newCircuit = state.circuit.clone();
    newCircuit.addGate(state.clipboard.gate, qubit, state.clipboard.params, [], timeSlice);
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(state.circuit.clone());
    set({
      circuit: newCircuit,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      customEditMode: false
    });
  },

  editGateQubit: (gateId, newQubits) => {
    const state = get();
    const newCircuit = state.circuit.clone();
    const op = newCircuit.operations.find(o => o.id === gateId);
    if (!op) return;
    op.qubits = Array.isArray(newQubits) ? newQubits : [newQubits];
    newCircuit._recalculateTimeSlices();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newCircuit.clone());
    set({
      circuit: newCircuit,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      customEditMode: false
    });
  },

  editGateParams: (gateId, newParams) => {
    const state = get();
    const newCircuit = state.circuit.clone();
    const op = newCircuit.operations.find(o => o.id === gateId);
    if (!op) return;
    op.params = { ...newParams };
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newCircuit.clone());
    set({
      circuit: newCircuit,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      customEditMode: false
    });
  },
}));
