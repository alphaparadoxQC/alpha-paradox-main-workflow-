/**
 * QuantumCircuit — core circuit data structure.
 * Stores gates as a sequence of operations on qubit/clbit registers.
 */
import { getGate } from './gates.js';

export class QuantumCircuit {
  constructor(numQubits = 5, numClbits = 3) {
    this.numQubits = numQubits;
    this.numClbits = numClbits;
    this.operations = []; // {gate, qubits, clbits, params, timeSlice}
    this.qubitLabels = Array.from({ length: numQubits }, (_, i) => `q${i}`);
    this.clbitLabels = Array.from({ length: numClbits }, (_, i) => `c${i}`);
    this.name = 'unnamed-Circuit';
    this.metadata = {};
    // Initial states for each qubit (default |0⟩)
    this.initialStates = Array.from({ length: numQubits }, () => ({
      alpha: { reSqrt: 1, imSqrt: 0 },
      beta: { reSqrt: 0, imSqrt: 0 }
    }));
  }

  /**
   * Add a gate operation to the circuit
   */
  addGate(gateName, qubits, params = {}, clbits = [], timeSlice = null) {
    const gate = getGate(gateName, params);
    if (!gate) throw new Error(`Unknown gate: ${gateName}`);

    const op = {
      id: crypto.randomUUID(),
      gate: gateName,
      qubits: Array.isArray(qubits) ? qubits : [qubits],
      clbits: Array.isArray(clbits) ? clbits : (clbits !== undefined && clbits !== null ? [clbits] : []),
      params: { ...params },
      timeSlice: timeSlice !== null ? timeSlice : this._nextTimeSlice(
        Array.isArray(qubits) ? qubits : [qubits],
        gateName
      )
    };

    this.operations.push(op);
    if (timeSlice !== null) {
      this._recalculateTimeSlices();
    }
    return op.id;
  }

  /**
   * Find the next available time slice for given qubits.
   * For MEASURE gates, also ensures no two measures share the same time slot
   * (avoids visual overlap of measurement dashed lines).
   */
  _nextTimeSlice(qubits, gateName) {
    let maxSlice = -1;
    if (qubits.length === 0) return 0;
    
    const minQ = Math.min(...qubits);
    // MEASURE visually extends to the bottom of the qubit wires
    const maxQ = gateName === 'MEASURE' ? this.numQubits - 1 : Math.max(...qubits);

    for (const op of this.operations) {
      if (op.qubits.length === 0) continue;
      const opMin = Math.min(...op.qubits);
      const opMax = op.gate === 'MEASURE' ? this.numQubits - 1 : Math.max(...op.qubits);
      
      // Check if intervals [minQ, maxQ] and [opMin, opMax] overlap
      if (minQ <= opMax && maxQ >= opMin) {
        maxSlice = Math.max(maxSlice, op.timeSlice);
      }
    }
    
    let candidate = maxSlice + 1;

    // For MEASURE: ensure no other MEASURE already occupies this time slot anywhere
    if (gateName === 'MEASURE') {
      for (const op of this.operations) {
        if (op.gate === 'MEASURE' && op.timeSlice >= candidate) {
          candidate = op.timeSlice + 1;
        }
      }
    }
    return candidate;
  }

  // ─── Convenience gate methods ────────────────────────────────────

  h(qubit) { return this.addGate('H', qubit); }
  x(qubit) { return this.addGate('X', qubit); }
  y(qubit) { return this.addGate('Y', qubit); }
  z(qubit) { return this.addGate('Z', qubit); }
  s(qubit) { return this.addGate('S', qubit); }
  sdg(qubit) { return this.addGate('SDG', qubit); }
  t(qubit) { return this.addGate('T', qubit); }
  tdg(qubit) { return this.addGate('TDG', qubit); }
  sx(qubit) { return this.addGate('SX', qubit); }

  rx(qubit, theta) { return this.addGate('RX', qubit, { theta }); }
  ry(qubit, theta) { return this.addGate('RY', qubit, { theta }); }
  rz(qubit, theta) { return this.addGate('RZ', qubit, { theta }); }
  p(qubit, lambda) { return this.addGate('P', qubit, { lambda }); }
  u(qubit, theta, phi, lambda) { return this.addGate('U', qubit, { theta, phi, lambda }); }

  cx(control, target) { return this.addGate('CX', [control, target]); }
  cy(control, target) { return this.addGate('CY', [control, target]); }
  cz(control, target) { return this.addGate('CZ', [control, target]); }
  ch(control, target) { return this.addGate('CH', [control, target]); }
  swap(q1, q2) { return this.addGate('SWAP', [q1, q2]); }
  cp(control, target, theta) { return this.addGate('CP', [control, target], { theta }); }
  crx(control, target, theta) { return this.addGate('CRX', [control, target], { theta }); }
  cry(control, target, theta) { return this.addGate('CRY', [control, target], { theta }); }
  crz(control, target, theta) { return this.addGate('CRZ', [control, target], { theta }); }
  rxx(q1, q2, theta) { return this.addGate('RXX', [q1, q2], { theta }); }
  ryy(q1, q2, theta) { return this.addGate('RYY', [q1, q2], { theta }); }
  rzz(q1, q2, theta) { return this.addGate('RZZ', [q1, q2], { theta }); }

  ccx(c1, c2, target) { return this.addGate('CCX', [c1, c2, target]); }
  cswap(control, q1, q2) { return this.addGate('CSWAP', [control, q1, q2]); }

  measure(qubit, clbit) { return this.addGate('MEASURE', qubit, {}, clbit); }

  measureAll() {
    const n = Math.min(this.numQubits, this.numClbits);
    // Collect qubits that already have a MEASURE operation
    const alreadyMeasured = new Set();
    for (const op of this.operations) {
      if (op.gate === 'MEASURE') {
        for (const q of op.qubits) {
          alreadyMeasured.add(q);
        }
      }
    }
    for (let i = 0; i < n; i++) {
      if (!alreadyMeasured.has(i)) {
        this.measure(i, i);
      }
    }
  }

  barrier(qubits) {
    const qs = qubits ?? Array.from({ length: this.numQubits }, (_, i) => i);
    return this.addGate('BARRIER', qs);
  }

  reset(qubit) { return this.addGate('RESET', qubit); }

  // ─── Circuit manipulation ─────────────────────────────────────────

  removeGate(operationId) {
    this.operations = this.operations.filter(op => op.id !== operationId);
    this._recalculateTimeSlices();
  }

  moveGate(gateId, newQubits, newTimeSlice) {
    const opIndex = this.operations.findIndex(o => o.id === gateId);
    if (opIndex === -1) return;
    const op = this.operations[opIndex];
    
    // Remove from array and push back to end (sorting will fix order)
    this.operations.splice(opIndex, 1);
    op.qubits = newQubits;
    op.timeSlice = newTimeSlice;
    this.operations.push(op);
    
    this._recalculateTimeSlices();
  }

  clear() {
    this.operations = [];
  }

  _recalculateTimeSlices() {
    // Sort by timeSlice to preserve user intent and process left-to-right
    this.operations.sort((a, b) => a.timeSlice - b.timeSlice);
    
    // Array to track the max time slice currently occupied on each qubit wire
    const used = Array(this.numQubits).fill(-1);
    let maxMeasure = -1;
    
    for (const op of this.operations) {
      if (op.qubits.length === 0) continue;
      
      const opMin = Math.min(...op.qubits);
      const opMax = op.gate === 'MEASURE' ? this.numQubits - 1 : Math.max(...op.qubits);
      
      let maxSlice = -1;
      // Find the maximum time slice used in the span [opMin, opMax]
      for (let q = opMin; q <= opMax; q++) {
        maxSlice = Math.max(maxSlice, used[q]);
      }
      
      let candidate = maxSlice + 1;
      
      // Global measure rule: no two measures in the same time slice
      if (op.gate === 'MEASURE') {
        candidate = Math.max(candidate, maxMeasure + 1);
        maxMeasure = candidate;
      }
      
      // Math.max preserves user-defined gaps
      op.timeSlice = Math.max(candidate, op.timeSlice);
      
      // Update the used array for the entire span
      for (let q = opMin; q <= opMax; q++) {
        used[q] = op.timeSlice;
      }
    }
  }

  setRegisters(numQubits, numClbits) {
    this.numQubits = numQubits;
    this.numClbits = numClbits;
    this.qubitLabels = Array.from({ length: numQubits }, (_, i) => `q${i}`);
    this.clbitLabels = Array.from({ length: numClbits }, (_, i) => `c${i}`);
    // Extend or trim initial states
    while (this.initialStates.length < numQubits) {
      this.initialStates.push({ alpha: { reSqrt: 1, imSqrt: 0 }, beta: { reSqrt: 0, imSqrt: 0 } });
    }
    this.initialStates.length = numQubits;
    // Remove invalid operations
    this.operations = this.operations.filter(op =>
      op.qubits.every(q => q < numQubits) &&
      op.clbits.every(c => c < numClbits)
    );
  }

  /**
   * Get the depth (max time slice + 1)
   */
  get depth() {
    if (this.operations.length === 0) return 0;
    return Math.max(...this.operations.map(op => op.timeSlice)) + 1;
  }

  /**
   * Get operations sorted by time slice
   */
  get sortedOperations() {
    return [...this.operations].sort((a, b) => a.timeSlice - b.timeSlice);
  }

  /**
   * Build a 2D grid representation: grid[qubit][timeSlice] = operation
   */
  toGrid() {
    const d = Math.max(this.depth, 1);
    const grid = Array.from({ length: this.numQubits }, () =>
      new Array(d).fill(null)
    );
    for (const op of this.operations) {
      for (const q of op.qubits) {
        // Prevent out-of-bounds operations from crashing the UI
        if (typeof q === 'number' && q >= 0 && q < this.numQubits) {
          grid[q][op.timeSlice] = op;
        }
      }
    }
    return grid;
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      name: this.name,
      numQubits: this.numQubits,
      numClbits: this.numClbits,
      operations: this.operations,
      initialStates: this.initialStates,
      metadata: this.metadata
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(json) {
    const qc = new QuantumCircuit(json.numQubits, json.numClbits);
    qc.name = json.name || 'unnamed-Circuit';
    qc.operations = json.operations || [];
    qc.initialStates = json.initialStates || qc.initialStates;
    qc.metadata = json.metadata || {};
    return qc;
  }

  /**
   * Clone this circuit
   */
  clone() {
    return QuantumCircuit.fromJSON(JSON.parse(JSON.stringify(this.toJSON())));
  }
}
