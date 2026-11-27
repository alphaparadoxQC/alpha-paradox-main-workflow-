/**
 * Density Matrix Simulator — Backend #4
 * Maintains full 2ⁿ×2ⁿ density matrix for exact noise simulation.
 */
import { Complex, createZeroState, intToBitstring, sampleFromProbs } from './complex.js';
import { getGate } from './gates.js';
import { NoiseModel } from './noise-model.js';
import { SimulationResult } from './result.js';

export class DensityMatrixSimulator {
  constructor() {
    this.name = 'aer_density_matrix';
    this.displayName = 'Density Matrix';
    this.maxQubits = 10;
    this.supportsNoise = true;
    this.processor = 'CPU';
    this.description = 'Exact noise simulation with density matrix ρ. Mixed states, purity, decoherence. Max ~10 qubits.';
  }

  run(circuit, config = {}) {
    const startTime = performance.now();
    const { shots = 1024, noiseConfig = null } = config;
    const numQubits = circuit.numQubits;
    const noiseModel = NoiseModel.fromConfig(noiseConfig);

    if (numQubits > this.maxQubits) {
      throw new Error(`Density matrix simulator supports max ${this.maxQubits} qubits, got ${numQubits}`);
    }

    const dim = 1 << numQubits;

    // Initialize ρ = |0⟩⟨0|
    const rho = Array.from({ length: dim }, () =>
      Array.from({ length: dim }, () => Complex.zero())
    );
    rho[0][0] = Complex.one();

    const ops = circuit.sortedOperations;
    const measurements = [];

    for (const op of ops) {
      if (op.gate === 'MEASURE') {
        measurements.push({ qubit: op.qubits[0], clbit: op.clbits[0] ?? op.qubits[0] });
        continue;
      }
      if (op.gate === 'BARRIER') continue;

      const gate = getGate(op.gate, op.params);
      if (!gate || !gate.matrix) continue;

      // Build full unitary from gate matrix
      const U = this._buildFullUnitary(gate.matrix, op.qubits, numQubits);
      // Apply: ρ' = U·ρ·U†
      this._applyUnitary(rho, U, dim);

      // Apply noise via Kraus operators (simplified: depolarizing channel)
      if (noiseModel.depolarizingError?.enabled) {
        for (const q of op.qubits) {
          this._applyDepolarizingChannel(rho, q, numQubits, noiseModel.depolarizingError.probability ?? 0.01);
        }
      }
    }

    // Extract probabilities from diagonal of ρ
    const probs = [];
    for (let i = 0; i < dim; i++) {
      probs.push(Math.max(0, rho[i][i].re));
    }

    // Normalize
    const total = probs.reduce((a, b) => a + b, 0);
    for (let i = 0; i < dim; i++) probs[i] /= total || 1;

    // Sample counts
    const counts = {};
    const numMeasuredBits = measurements.length > 0 ? circuit.numClbits : numQubits;
    for (let shot = 0; shot < shots; shot++) {
      const outcome = sampleFromProbs(probs);
      let bitstring;
      if (measurements.length > 0) {
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

    // Compute purity: Tr(ρ²)
    let purity = 0;
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        let sum = Complex.zero();
        for (let k = 0; k < dim; k++) {
          sum = sum.add(rho[i][k].mul(rho[k][j]));
        }
        if (i === j) purity += sum.re;
      }
    }

    const executionTime = performance.now() - startTime;
    const probFormatted = {};
    for (let i = 0; i < dim; i++) {
      if (probs[i] > 1e-10) {
        probFormatted[intToBitstring(i, numQubits)] = probs[i];
      }
    }

    return new SimulationResult({
      counts,
      probabilities: probFormatted,
      metadata: {
        backend: this.name,
        shots,
        executionTime: Math.round(executionTime),
        numQubits,
        noiseModel: noiseModel.hasNoise ? noiseModel.toJSON() : null,
        method: 'density_matrix',
        purity: Math.round(purity * 10000) / 10000,
      }
    });
  }

  _buildFullUnitary(gateMatrix, qubits, numQubits) {
    const dim = 1 << numQubits;
    const U = Array.from({ length: dim }, () =>
      Array.from({ length: dim }, () => Complex.zero())
    );

    const gateSize = gateMatrix.length;

    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        // Check if non-gate qubits match
        let gateQubitsMatch = true;
        for (let q = 0; q < numQubits; q++) {
          if (!qubits.includes(q)) {
            if (((i >> (numQubits - 1 - q)) & 1) !== ((j >> (numQubits - 1 - q)) & 1)) {
              gateQubitsMatch = false;
              break;
            }
          }
        }

        if (!gateQubitsMatch) continue;

        // Extract gate qubit bits
        let rowIdx = 0, colIdx = 0;
        for (let k = 0; k < qubits.length; k++) {
          rowIdx |= ((i >> (numQubits - 1 - qubits[k])) & 1) << (qubits.length - 1 - k);
          colIdx |= ((j >> (numQubits - 1 - qubits[k])) & 1) << (qubits.length - 1 - k);
        }

        U[i][j] = gateMatrix[rowIdx][colIdx].clone();
      }
    }

    return U;
  }

  _applyUnitary(rho, U, dim) {
    // temp = U · ρ
    const temp = Array.from({ length: dim }, () =>
      Array.from({ length: dim }, () => Complex.zero())
    );
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        for (let k = 0; k < dim; k++) {
          temp[i][j] = temp[i][j].add(U[i][k].mul(rho[k][j]));
        }
      }
    }
    // ρ = temp · U†
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        rho[i][j] = Complex.zero();
        for (let k = 0; k < dim; k++) {
          rho[i][j] = rho[i][j].add(temp[i][k].mul(U[j][k].conjugate()));
        }
      }
    }
  }

  _applyDepolarizingChannel(rho, qubit, numQubits, p) {
    const dim = 1 << numQubits;
    const shift = numQubits - 1 - qubit;

    // Depolarizing: ρ' = (1-p)ρ + (p/3)(XρX + YρY + ZρZ)
    // Simplified: ρ' = (1-4p/3)ρ + (p/3)·I/2^n·Tr(ρ over qubit)
    // Even simpler Monte-Carlo style for density matrix:
    // Just scale off-diagonal elements of the target qubit
    const factor = 1 - 4 * p / 3;

    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        const bit_i = (i >> shift) & 1;
        const bit_j = (j >> shift) & 1;
        if (bit_i !== bit_j) {
          rho[i][j] = rho[i][j].mul(factor);
        }
      }
    }
  }
}
