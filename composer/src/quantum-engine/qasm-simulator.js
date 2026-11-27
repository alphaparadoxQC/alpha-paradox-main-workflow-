/**
 * QASM Simulator — Backend #2
 * Shot-based sampling with configurable noise models.
 */
import { Complex, createZeroState, statevectorToProbs, sampleFromProbs, intToBitstring } from './complex.js';
import { getGate } from './gates.js';
import { NoiseModel } from './noise-model.js';
import { SimulationResult } from './result.js';

export class QASMSimulator {
  constructor() {
    this.name = 'aer_qasm';
    this.displayName = 'QASM Simulator (Noisy)';
    this.maxQubits = 16;
    this.supportsNoise = true;
    this.processor = 'CPU';
    this.description = 'Shot-based sampling with depolarization, readout, rotation, and T₁/T₂ noise.';
  }

  run(circuit, config = {}) {
    const startTime = performance.now();
    const { shots = 1024, noiseConfig = null } = config;
    const numQubits = circuit.numQubits;
    const noiseModel = NoiseModel.fromConfig(noiseConfig);

    if (numQubits > this.maxQubits) {
      throw new Error(`QASM simulator supports max ${this.maxQubits} qubits, got ${numQubits}`);
    }

    const ops = circuit.sortedOperations;
    const measurements = [];
    const gateOps = [];

    for (const op of ops) {
      if (op.gate === 'MEASURE') {
        measurements.push({ qubit: op.qubits[0], clbit: op.clbits[0] ?? op.qubits[0] });
      } else if (op.gate !== 'BARRIER') {
        gateOps.push(op);
      }
    }

    // Run each shot independently (for proper noise sampling)
    const counts = {};

    for (let shot = 0; shot < shots; shot++) {
      let state = createZeroState(numQubits);

      // Apply initialization errors
      if (noiseModel.hasNoise) {
        for (let q = 0; q < numQubits; q++) {
          if (noiseModel.shouldFlipInitialization()) {
            // Flip qubit to |1⟩
            state = this._applySingleQubitGate(state, [
              [Complex.zero(), Complex.one()],
              [Complex.one(), Complex.zero()]
            ], q, numQubits);
          }
        }
      }

      // Apply gate operations with noise
      for (const op of gateOps) {
        if (op.gate === 'RESET') {
          state = this._applyReset(state, op.qubits[0], numQubits);
          continue;
        }

        const gate = getGate(op.gate, op.params);
        if (!gate || !gate.matrix) continue;

        // Apply the ideal gate
        if (gate.qubits === 1) {
          state = this._applySingleQubitGate(state, gate.matrix, op.qubits[0], numQubits);
        } else if (gate.qubits === 2) {
          state = this._applyTwoQubitGate(state, gate.matrix, op.qubits[0], op.qubits[1], numQubits);
        } else if (gate.qubits === 3) {
          state = this._applyThreeQubitGate(state, gate.matrix, op.qubits, numQubits);
        }

        // Apply noise after each gate
        if (noiseModel.hasNoise) {
          for (const q of op.qubits) {
            state = noiseModel.applyGateRotation(state, q, numQubits);
            state = noiseModel.applyDepolarizing(state, q, numQubits);
            state = noiseModel.applyThermalRelaxation(state, q, numQubits);
          }
        }
      }

      // Measure
      const probs = statevectorToProbs(state);
      const outcome = sampleFromProbs(probs);

      let bitstring;
      if (measurements.length > 0) {
        const bits = new Array(circuit.numClbits).fill(0);
        for (const { qubit, clbit } of measurements) {
          let bit = (outcome >> (numQubits - 1 - qubit)) & 1;
          bit = noiseModel.applyReadoutError(bit);
          bits[clbit] = bit;
        }
        bitstring = bits.join('');
      } else {
        bitstring = intToBitstring(outcome, numQubits);
      }

      counts[bitstring] = (counts[bitstring] || 0) + 1;
    }

    const executionTime = performance.now() - startTime;

    return new SimulationResult({
      counts,
      metadata: {
        backend: this.name,
        shots,
        executionTime: Math.round(executionTime),
        numQubits,
        noiseModel: noiseModel.hasNoise ? noiseModel.toJSON() : null,
        method: 'qasm'
      }
    });
  }

  // Same gate application methods as StatevectorSimulator
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
        target = bit0 === newBit0 ? target : (newBit0 ? target | (1 << (numQubits - 1 - q0)) : target & ~(1 << (numQubits - 1 - q0)));
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

  _applyReset(state, qubit, numQubits) {
    const n = state.length;
    const newState = new Array(n);
    const shift = numQubits - 1 - qubit;

    for (let i = 0; i < n; i++) {
      const bit = (i >> shift) & 1;
      if (bit === 0) {
        newState[i] = state[i].clone();
      } else {
        const partner = i & ~(1 << shift);
        newState[partner] = (newState[partner] || Complex.zero()).add(state[i]);
        newState[i] = Complex.zero();
      }
    }

    let norm = 0;
    for (let i = 0; i < n; i++) {
      if (!newState[i]) newState[i] = Complex.zero();
      norm += newState[i].magnitudeSquared();
    }
    const factor = 1 / Math.sqrt(norm || 1);
    for (let i = 0; i < n; i++) newState[i] = newState[i].mul(factor);

    return newState;
  }
}
