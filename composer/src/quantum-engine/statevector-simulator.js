/**
 * Statevector Simulator — Backend #1
 * Ideal simulation using full state vector (2^n complex amplitudes).
 * Max qubits: ~16 in browser.
 */
import { Complex, createZeroState, statevectorToProbs, sampleFromProbs, intToBitstring } from './complex.js';
import { getGate, GATES } from './gates.js';
import { SimulationResult } from './result.js';

export class StatevectorSimulator {
  constructor() {
    this.name = 'aer_statevector';
    this.displayName = 'Statevector Simulator';
    this.maxQubits = 16;
    this.supportsNoise = false;
    this.processor = 'CPU';
    this.description = 'Ideal state vector simulation. Fast, exact, no noise.';
  }

  /**
   * Run a circuit and return results
   * @param {QuantumCircuit} circuit
   * @param {Object} config - { shots: 1024 }
   */
  run(circuit, config = {}) {
    const startTime = performance.now();
    const { shots = 1024 } = config;
    const numQubits = circuit.numQubits;

    if (numQubits > this.maxQubits) {
      throw new Error(`Statevector simulator supports max ${this.maxQubits} qubits, got ${numQubits}`);
    }

    // Initialize state to |0...0⟩
    let state = createZeroState(numQubits);

    // Get operations sorted by time slice
    const ops = circuit.sortedOperations;

    // Track which qubits have been measured and their classical bit mapping
    const measurements = []; // { qubit, clbit }

    // Apply each operation
    for (const op of ops) {
      if (op.gate === 'MEASURE') {
        measurements.push({ qubit: op.qubits[0], clbit: op.clbits[0] ?? op.qubits[0] });
        continue;
      }
      if (op.gate === 'BARRIER') continue;
      
      state = this._executeOperation(state, {
        gate: op.gate,
        qubits: op.qubits,
        params: op.params
      }, numQubits);
    }

    // Compute probabilities
    const probs = statevectorToProbs(state);

    // Sample measurements
    const counts = {};
    const numMeasuredBits = measurements.length > 0 ? circuit.numClbits : numQubits;

    for (let shot = 0; shot < shots; shot++) {
      const outcome = sampleFromProbs(probs);
      let bitstring;

      if (measurements.length > 0) {
        // Map measured qubits to classical bits
        const bits = new Array(numMeasuredBits).fill(0);
        for (const { qubit, clbit } of measurements) {
          bits[clbit] = (outcome >> (numQubits - 1 - qubit)) & 1;
        }
        bitstring = bits.join('');
      } else {
        bitstring = intToBitstring(outcome, numQubits);
      }

      counts[bitstring] = (counts[bitstring] || 0) + 1;
    }

    // Compute Bloch coordinates for each qubit
    const blochCoords = this._computeBlochCoordinates(state, numQubits);

    const executionTime = performance.now() - startTime;

    return new SimulationResult({
      counts,
      statevector: state.map(c => ({ re: c.re, im: c.im })),
      probabilities: this._formatProbabilities(probs, numQubits),
      blochCoordinates: blochCoords,
      metadata: {
        backend: this.name,
        shots,
        executionTime: Math.round(executionTime),
        numQubits,
        noiseModel: null,
        method: 'statevector'
      }
    });
  }

  _executeOperation(state, op, numQubits) {
    if (op.gate === 'RESET') {
      return this._applyReset(state, op.qubits[0], numQubits);
    }
    if (op.gate === 'MCX') {
      return this._applyMultiControlledX(state, op.qubits, numQubits);
    }
    if (op.gate === 'QFT') {
      return this._applyQFT(state, op.qubits, numQubits, false);
    }
    if (op.gate === 'IQFT') {
      return this._applyQFT(state, op.qubits, numQubits, true);
    }

    const gate = getGate(op.gate, op.params);
    if (!gate) return state;

    if (gate.matrix) {
      if (gate.qubits === 1) {
        return this._applySingleQubitGate(state, gate.matrix, op.qubits[0], numQubits);
      } else if (gate.qubits === 2) {
        return this._applyTwoQubitGate(state, gate.matrix, op.qubits[0], op.qubits[1], numQubits);
      } else if (gate.qubits === 3) {
        return this._applyThreeQubitGate(state, gate.matrix, op.qubits, numQubits);
      }
      return state;
    }

    if (gate.decomposition) {
      let currentState = state;
      for (const subOp of gate.decomposition) {
        const mappedQubits = [];
        
        // Handle different ways decomposition targets can be specified
        if (subOp.control !== undefined) {
          mappedQubits.push(subOp.control === 'ancilla' ? 'ancilla' : op.qubits[subOp.control]);
        }
        if (subOp.controls) {
          mappedQubits.push(...subOp.controls.map(c => c === 'ancilla' ? 'ancilla' : op.qubits[c]));
        }
        if (subOp.target !== undefined) {
          mappedQubits.push(subOp.target === 'ancilla' ? 'ancilla' : op.qubits[subOp.target]);
        }
        if (subOp.targets) {
          mappedQubits.push(...subOp.targets.map(t => t === 'ancilla' ? 'ancilla' : op.qubits[t]));
        }

        currentState = this._executeOperation(currentState, {
          gate: subOp.gate,
          qubits: mappedQubits,
          params: subOp.params
        }, numQubits);
      }
      return currentState;
    }

    return state;
  }

  _applyQFT(state, qubits, numQubits, inverse = false) {
    let currentState = state;
    const n = qubits.length;
    
    if (inverse) {
      for (let i = 0; i < n / 2; i++) {
        currentState = this._executeOperation(currentState, { gate: 'SWAP', qubits: [qubits[i], qubits[n - 1 - i]] }, numQubits);
      }
      for (let i = n - 1; i >= 0; i--) {
        for (let j = n - 1; j > i; j--) {
          const theta = -Math.PI / Math.pow(2, j - i);
          currentState = this._executeOperation(currentState, { gate: 'CP', qubits: [qubits[j], qubits[i]], params: { theta } }, numQubits);
        }
        currentState = this._executeOperation(currentState, { gate: 'H', qubits: [qubits[i]] }, numQubits);
      }
    } else {
      for (let i = 0; i < n; i++) {
        currentState = this._executeOperation(currentState, { gate: 'H', qubits: [qubits[i]] }, numQubits);
        for (let j = i + 1; j < n; j++) {
          const theta = Math.PI / Math.pow(2, j - i);
          currentState = this._executeOperation(currentState, { gate: 'CP', qubits: [qubits[j], qubits[i]], params: { theta } }, numQubits);
        }
      }
      for (let i = 0; i < n / 2; i++) {
        currentState = this._executeOperation(currentState, { gate: 'SWAP', qubits: [qubits[i], qubits[n - 1 - i]] }, numQubits);
      }
    }
    return currentState;
  }

  // ─── Gate Application Logic ────────────────────────────────────────

  _applySingleQubitGate(state, matrix, qubit, numQubits) {
    const n = state.length;
    const newState = new Array(n);
    const shift = numQubits - 1 - qubit;
    const step = 1 << shift;

    for (let i = 0; i < n; i += step * 2) {
      for (let j = 0; j < step; j++) {
        const idx0 = i + j;
        const idx1 = idx0 + step;

        newState[idx0] = matrix[0][0].mul(state[idx0]).add(matrix[0][1].mul(state[idx1]));
        newState[idx1] = matrix[1][0].mul(state[idx0]).add(matrix[1][1].mul(state[idx1]));
      }
    }

    return newState;
  }

  _applyTwoQubitGate(state, matrix, q0, q1, numQubits) {
    const n = state.length;
    const newState = new Array(n);
    for (let i = 0; i < n; i++) newState[i] = Complex.zero();

    for (let i = 0; i < n; i++) {
      const bit0 = (i >> (numQubits - 1 - q0)) & 1;
      const bit1 = (i >> (numQubits - 1 - q1)) & 1;
      const row = (bit0 << 1) | bit1;

      for (let col = 0; col < 4; col++) {
        if (matrix[row][col].isZero()) continue;

        const newBit0 = (col >> 1) & 1;
        const newBit1 = col & 1;
        let target = i;
        // Set bit0
        target = bit0 === newBit0 ? target : (newBit0 ? target | (1 << (numQubits - 1 - q0)) : target & ~(1 << (numQubits - 1 - q0)));
        // Set bit1
        target = bit1 === newBit1 ? target : (newBit1 ? target | (1 << (numQubits - 1 - q1)) : target & ~(1 << (numQubits - 1 - q1)));

        newState[target] = newState[target].add(matrix[row][col].mul(state[i]));
      }
    }

    return newState;
  }

  _applyThreeQubitGate(state, matrix, qubits, numQubits) {
    const n = state.length;
    const newState = new Array(n);
    for (let i = 0; i < n; i++) newState[i] = Complex.zero();

    const [q0, q1, q2] = qubits;

    for (let i = 0; i < n; i++) {
      const bit0 = (i >> (numQubits - 1 - q0)) & 1;
      const bit1 = (i >> (numQubits - 1 - q1)) & 1;
      const bit2 = (i >> (numQubits - 1 - q2)) & 1;
      const row = (bit0 << 2) | (bit1 << 1) | bit2;

      for (let col = 0; col < 8; col++) {
        if (matrix[row][col].isZero()) continue;

        const newBit0 = (col >> 2) & 1;
        const newBit1 = (col >> 1) & 1;
        const newBit2 = col & 1;
        let target = i;
        target = bit0 === newBit0 ? target : (newBit0 ? target | (1 << (numQubits - 1 - q0)) : target & ~(1 << (numQubits - 1 - q0)));
        target = bit1 === newBit1 ? target : (newBit1 ? target | (1 << (numQubits - 1 - q1)) : target & ~(1 << (numQubits - 1 - q1)));
        target = bit2 === newBit2 ? target : (newBit2 ? target | (1 << (numQubits - 1 - q2)) : target & ~(1 << (numQubits - 1 - q2)));

        newState[target] = newState[target].add(matrix[row][col].mul(state[i]));
      }
    }

    return newState;
  }

  _applyMultiControlledX(state, qubits, numQubits) {
    const n = state.length;
    const newState = new Array(n);
    for (let i = 0; i < n; i++) newState[i] = state[i];

    const targetQubit = qubits[qubits.length - 1];
    const controlQubits = qubits.slice(0, -1);
    
    const targetShift = numQubits - 1 - targetQubit;
    const targetBitMask = 1 << targetShift;

    let controlMask = 0;
    for (const q of controlQubits) {
      controlMask |= (1 << (numQubits - 1 - q));
    }

    for (let i = 0; i < n; i++) {
      if ((i & controlMask) === controlMask) {
        const partner = i ^ targetBitMask;
        if (i < partner) {
          const temp = newState[i];
          newState[i] = newState[partner];
          newState[partner] = temp;
        }
      }
    }

    return newState;
  }

  _applyReset(state, qubit, numQubits) {
    const n = state.length;
    const newState = new Array(n);
    const shift = numQubits - 1 - qubit;
    let norm = 0;

    for (let i = 0; i < n; i++) {
      const bit = (i >> shift) & 1;
      if (bit === 0) {
        newState[i] = state[i].clone();
        norm += state[i].magnitudeSquared();
      } else {
        const partner = i & ~(1 << shift);
        newState[partner] = (newState[partner] || Complex.zero()).add(state[i]);
        norm += state[i].magnitudeSquared();
        newState[i] = Complex.zero();
      }
    }

    const factor = 1 / Math.sqrt(norm || 1);
    for (let i = 0; i < n; i++) {
      if (!newState[i]) newState[i] = Complex.zero();
      else newState[i] = newState[i].mul(factor);
    }
    return newState;
  }

  _computeBlochCoordinates(state, numQubits) {
    const coords = [];
    for (let q = 0; q < numQubits; q++) {
      // Partial trace to get single-qubit reduced density matrix
      const rho = this._partialTrace(state, q, numQubits);
      // Bloch vector: (x, y, z) = (2·Re(ρ₀₁), -2·Im(ρ₀₁), ρ₀₀ - ρ₁₁)
      coords.push({
        x: 2 * rho[0][1].re,
        y: -2 * rho[0][1].im,
        z: rho[0][0].re - rho[1][1].re
      });
    }
    return coords;
  }

  _partialTrace(state, qubit, numQubits) {
    const rho = [
      [Complex.zero(), Complex.zero()],
      [Complex.zero(), Complex.zero()]
    ];
    const shift = numQubits - 1 - qubit;

    for (let i = 0; i < state.length; i++) {
      const bit_i = (i >> shift) & 1;
      for (let j = 0; j < state.length; j++) {
        const bit_j = (j >> shift) & 1;
        // Check if all other qubits match
        const mask = ~(1 << shift);
        if ((i & mask) === (j & mask)) {
          rho[bit_i][bit_j] = rho[bit_i][bit_j].add(
            state[i].mul(state[j].conjugate())
          );
        }
      }
    }
    return rho;
  }

  _formatProbabilities(probs, numQubits) {
    const formatted = {};
    for (let i = 0; i < probs.length; i++) {
      if (probs[i] > 1e-10) {
        formatted[intToBitstring(i, numQubits)] = probs[i];
      }
    }
    return formatted;
  }
}
