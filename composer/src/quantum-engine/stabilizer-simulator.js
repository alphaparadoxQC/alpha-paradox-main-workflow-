/**
 * Stabilizer Simulator — Backend #5
 * Gottesman-Knill theorem: Clifford circuits in O(n²) space.
 * Supports 500+ qubits for Clifford-only circuits.
 */
import { SimulationResult } from './result.js';
import { intToBitstring } from './complex.js';

/**
 * Stabilizer tableau using the Aaronson-Gottesman representation.
 * Stores 2n stabilizer generators as Pauli strings + phases.
 */
class StabilizerTableau {
  constructor(n) {
    this.n = n;
    // Tableau: (2n+1) rows × (2n+1) columns
    // First n rows: destabilizers, last n rows: stabilizers
    // Columns: x₁...xₙ z₁...zₙ r (phase)
    this.tableau = Array.from({ length: 2 * n }, () =>
      new Uint8Array(2 * n + 1)
    );

    // Initialize: destabilizers = X_i, stabilizers = Z_i
    for (let i = 0; i < n; i++) {
      this.tableau[i][i] = 1; // destabilizer X_i
      this.tableau[n + i][n + i] = 1; // stabilizer Z_i
    }
  }

  /**
   * Apply Hadamard gate on qubit q
   * H: X↔Z, phase update
   */
  hadamard(q) {
    const n = this.n;
    for (let i = 0; i < 2 * n; i++) {
      // Phase: r ⊕= x_q · z_q
      this.tableau[i][2 * n] ^= this.tableau[i][q] & this.tableau[i][n + q];
      // Swap x_q ↔ z_q
      const tmp = this.tableau[i][q];
      this.tableau[i][q] = this.tableau[i][n + q];
      this.tableau[i][n + q] = tmp;
    }
  }

  /**
   * Apply S (Phase) gate on qubit q
   * S: X→Y, Z→Z
   */
  phase(q) {
    const n = this.n;
    for (let i = 0; i < 2 * n; i++) {
      // r ⊕= x_q · z_q
      this.tableau[i][2 * n] ^= this.tableau[i][q] & this.tableau[i][n + q];
      // z_q ⊕= x_q
      this.tableau[i][n + q] ^= this.tableau[i][q];
    }
  }

  /**
   * Apply CNOT gate: control=a, target=b
   */
  cnot(a, b) {
    const n = this.n;
    for (let i = 0; i < 2 * n; i++) {
      // Phase update
      this.tableau[i][2 * n] ^= this.tableau[i][q_x(a)] & this.tableau[i][q_z(b)] &
        (this.tableau[i][q_x(b)] ^ this.tableau[i][q_z(a)] ^ 1);
      // x_b ⊕= x_a
      this.tableau[i][b] ^= this.tableau[i][a];
      // z_a ⊕= z_b
      this.tableau[i][n + a] ^= this.tableau[i][n + b];
    }

    function q_x(q) { return q; }
    function q_z(q) { return n + q; }
  }

  /**
   * Apply X gate on qubit q
   * X = HZH, but simpler: flip phase of all stabilizers where z_q=1
   */
  pauliX(q) {
    const n = this.n;
    for (let i = 0; i < 2 * n; i++) {
      this.tableau[i][2 * n] ^= this.tableau[i][n + q];
    }
  }

  /**
   * Apply Y gate = iXZ
   */
  pauliY(q) {
    const n = this.n;
    for (let i = 0; i < 2 * n; i++) {
      this.tableau[i][2 * n] ^= this.tableau[i][q] ^ this.tableau[i][n + q];
    }
  }

  /**
   * Apply Z gate
   */
  pauliZ(q) {
    const n = this.n;
    for (let i = 0; i < 2 * n; i++) {
      this.tableau[i][2 * n] ^= this.tableau[i][q];
    }
  }

  /**
   * Measure qubit q in the computational basis.
   * Returns 0 or 1.
   */
  measure(q) {
    const n = this.n;

    // Find a stabilizer generator with x_q = 1
    let p = -1;
    for (let i = n; i < 2 * n; i++) {
      if (this.tableau[i][q] === 1) {
        p = i;
        break;
      }
    }

    if (p !== -1) {
      // Random outcome
      // Row-reduce all other generators that anti-commute with Z_q
      for (let i = 0; i < 2 * n; i++) {
        if (i !== p && this.tableau[i][q] === 1) {
          this._rowMul(i, p);
        }
      }
      // Move destabilizer p-n to position p
      for (let j = 0; j <= 2 * n; j++) {
        this.tableau[p - n][j] = this.tableau[p][j];
      }
      // Set stabilizer p to ±Z_q
      this.tableau[p].fill(0);
      this.tableau[p][n + q] = 1;
      const outcome = Math.random() < 0.5 ? 0 : 1;
      this.tableau[p][2 * n] = outcome;
      return outcome;
    } else {
      // Deterministic outcome
      // Find destabilizer with x_q = 1
      let dp = -1;
      for (let i = 0; i < n; i++) {
        if (this.tableau[i][q] === 1) {
          dp = i;
          break;
        }
      }

      if (dp === -1) return 0;

      // Compute outcome from destabilizer
      const scratch = new Uint8Array(2 * n + 1);
      scratch[2 * n] = 0;
      for (let i = n; i < 2 * n; i++) {
        if (this.tableau[i][q] === 1) {
          // XOR scratch with row i
          for (let j = 0; j <= 2 * n; j++) {
            scratch[j] ^= this.tableau[i][j];
          }
        }
      }
      return scratch[2 * n];
    }
  }

  _rowMul(target, source) {
    const len = 2 * this.n + 1;
    // Phase computation (simplified)
    let phase = 0;
    for (let j = 0; j < this.n; j++) {
      // Count how Pauli products affect phase
      const x1 = this.tableau[target][j], z1 = this.tableau[target][this.n + j];
      const x2 = this.tableau[source][j], z2 = this.tableau[source][this.n + j];
      if (x2 === 1 && z2 === 1) { // Y
        phase += (x1 === 1 && z1 === 0) ? 1 : (x1 === 0 && z1 === 1) ? -1 : 0;
      } else if (x2 === 1 && z2 === 0) { // X
        phase += (z1 === 1) ? (x1 === 1 ? -1 : 1) : 0;
      } else if (x2 === 0 && z2 === 1) { // Z
        phase += (x1 === 1) ? (z1 === 1 ? 1 : -1) : 0;
      }
    }

    for (let j = 0; j < len; j++) {
      this.tableau[target][j] ^= this.tableau[source][j];
    }

    // Adjust phase
    const totalPhase = (this.tableau[target][2 * this.n] + ((phase % 4 + 4) % 4 >= 2 ? 1 : 0)) % 2;
    this.tableau[target][2 * this.n] = totalPhase;
  }
}

export class StabilizerSimulator {
  constructor() {
    this.name = 'aer_stabilizer';
    this.displayName = 'Stabilizer (Clifford)';
    this.maxQubits = 500;
    this.supportsNoise = false;
    this.processor = 'CPU';
    this.description = 'Clifford-only circuits with 500+ qubits. O(n²) memory. H, S, CX, X, Y, Z only.';
    this.supportedGates = new Set(['H', 'S', 'SDG', 'X', 'Y', 'Z', 'CX', 'CY', 'CZ', 'SWAP', 'SX', 'MEASURE', 'BARRIER', 'RESET']);
  }

  run(circuit, config = {}) {
    const startTime = performance.now();
    const { shots = 1024 } = config;
    const numQubits = circuit.numQubits;
    const ops = circuit.sortedOperations;

    // Validate gates
    for (const op of ops) {
      if (!this.supportedGates.has(op.gate)) {
        throw new Error(`Stabilizer simulator only supports Clifford gates. '${op.gate}' is not supported.`);
      }
    }

    const measurements = [];
    const gateOps = [];
    for (const op of ops) {
      if (op.gate === 'MEASURE') measurements.push({ qubit: op.qubits[0], clbit: op.clbits[0] ?? op.qubits[0] });
      else if (op.gate !== 'BARRIER') gateOps.push(op);
    }

    const counts = {};

    for (let shot = 0; shot < shots; shot++) {
      const tab = new StabilizerTableau(numQubits);

      for (const op of gateOps) {
        switch (op.gate) {
          case 'H': tab.hadamard(op.qubits[0]); break;
          case 'S': tab.phase(op.qubits[0]); break;
          case 'SDG':
            tab.phase(op.qubits[0]);
            tab.phase(op.qubits[0]);
            tab.phase(op.qubits[0]);
            break;
          case 'X': tab.pauliX(op.qubits[0]); break;
          case 'Y': tab.pauliY(op.qubits[0]); break;
          case 'Z': tab.pauliZ(op.qubits[0]); break;
          case 'CX': tab.cnot(op.qubits[0], op.qubits[1]); break;
          case 'CY':
            tab.phase(op.qubits[1]); tab.phase(op.qubits[1]); tab.phase(op.qubits[1]);
            tab.cnot(op.qubits[0], op.qubits[1]);
            tab.phase(op.qubits[1]);
            break;
          case 'CZ':
            tab.hadamard(op.qubits[1]);
            tab.cnot(op.qubits[0], op.qubits[1]);
            tab.hadamard(op.qubits[1]);
            break;
          case 'SWAP':
            tab.cnot(op.qubits[0], op.qubits[1]);
            tab.cnot(op.qubits[1], op.qubits[0]);
            tab.cnot(op.qubits[0], op.qubits[1]);
            break;
          case 'SX':
            tab.hadamard(op.qubits[0]);
            tab.phase(op.qubits[0]);
            tab.hadamard(op.qubits[0]);
            break;
          case 'RESET':
            tab.measure(op.qubits[0]);
            break;
        }
      }

      // Measure
      if (measurements.length > 0) {
        const bits = new Array(circuit.numClbits).fill(0);
        for (const { qubit, clbit } of measurements) {
          bits[clbit] = tab.measure(qubit);
        }
        const bitstring = bits.join('');
        counts[bitstring] = (counts[bitstring] || 0) + 1;
      } else {
        const bits = [];
        for (let q = 0; q < numQubits; q++) {
          bits.push(tab.measure(q));
        }
        const bitstring = bits.join('');
        counts[bitstring] = (counts[bitstring] || 0) + 1;
      }
    }

    const executionTime = performance.now() - startTime;

    return new SimulationResult({
      counts,
      metadata: {
        backend: this.name,
        shots,
        executionTime: Math.round(executionTime),
        numQubits,
        noiseModel: null,
        method: 'stabilizer'
      }
    });
  }
}
