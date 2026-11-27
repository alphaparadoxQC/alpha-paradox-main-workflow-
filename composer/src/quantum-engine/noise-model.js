/**
 * Noise Model — implements 5 noise channels for noisy simulation.
 */
import { Complex } from './complex.js';

export class NoiseModel {
  constructor(config = {}) {
    this.gateRotationError = config.gateRotationError ?? null;
    this.depolarizingError = config.depolarizingError ?? null;
    this.readoutError = config.readoutError ?? null;
    this.initializationError = config.initializationError ?? null;
    this.thermalRelaxation = config.thermalRelaxation ?? null;
  }

  get hasNoise() {
    return !!(this.gateRotationError || this.depolarizingError ||
              this.readoutError || this.initializationError || this.thermalRelaxation);
  }

  /**
   * Apply gate rotation error to a statevector after a gate.
   * Applies a small coherent rotation: exp(-i * magnitude * (εx·X + εy·Y + εz·Z) / 2)
   */
  applyGateRotation(state, qubit, numQubits) {
    if (!this.gateRotationError?.enabled) return state;
    const { ex = 1, ey = 1, ez = 1 } = this.gateRotationError;
    const norm = Math.sqrt(ex * ex + ey * ey + ez * ez);
    if (norm < 1e-12) return state;

    // Use the norm of the user-provided vector as the rotation magnitude
    // since the UI doesn't have a separate magnitude field.
    const angle = norm / 2;
    const nx = ex / norm, ny = ey / norm, nz = ez / norm;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Rotation matrix: cos(a)·I - i·sin(a)·(nx·X + ny·Y + nz·Z)
    const errorMatrix = [
      [new Complex(cos, -sin * nz), new Complex(-sin * ny, -sin * nx)],
      [new Complex(sin * ny, -sin * nx), new Complex(cos, sin * nz)]
    ];

    return applyGateToState(state, errorMatrix, qubit, numQubits);
  }

  /**
   * Apply depolarizing error: with prob p, replace qubit with I/2
   * E(ρ) = (1-p)ρ + (p/3)(XρX + YρY + ZρZ)
   * In statevector: randomly apply I, X, Y, or Z
   */
  applyDepolarizing(state, qubit, numQubits) {
    if (!this.depolarizingError?.enabled) return state;
    const p = this.depolarizingError.p ?? this.depolarizingError.probability ?? 0.01;
    const r = Math.random();

    if (r < p / 3) {
      // Apply X
      return applyPauliToState(state, 'X', qubit, numQubits);
    } else if (r < 2 * p / 3) {
      // Apply Y
      return applyPauliToState(state, 'Y', qubit, numQubits);
    } else if (r < p) {
      // Apply Z
      return applyPauliToState(state, 'Z', qubit, numQubits);
    }
    return state; // No error (probability 1-p)
  }

  /**
   * Apply readout error: flip measurement bit with probability p
   */
  applyReadoutError(bit) {
    if (!this.readoutError?.enabled) return bit;
    const p = this.readoutError.p ?? this.readoutError.probability ?? 0.02;
    return Math.random() < p ? (1 - bit) : bit;
  }

  /**
   * Apply initialization error: with prob p, initialize to |1⟩ instead of |0⟩
   */
  shouldFlipInitialization() {
    if (!this.initializationError?.enabled) return false;
    const p = this.initializationError.p ?? this.initializationError.probability ?? 0.01;
    return Math.random() < p;
  }

  /**
   * Apply thermal relaxation: simulate T1/T2 dephasing.
   * Simplified model for statevector simulation.
   */
  applyThermalRelaxation(state, qubit, numQubits, gateTime = 1) {
    if (!this.thermalRelaxation?.enabled) return state;
    const { t1 = 50, t2 = 70 } = this.thermalRelaxation;

    const pReset = 1 - Math.exp(-gateTime / t1);
    const pZ = (1 - pReset) * (1 - Math.exp(-gateTime * (1 / t2 - 1 / (2 * t1))));
    const r = Math.random();

    if (r < pReset) {
      // Reset to |0⟩ — project onto |0⟩ and renormalize
      return projectAndReset(state, qubit, numQubits);
    } else if (r < pReset + pZ) {
      // Apply Z error (dephasing)
      return applyPauliToState(state, 'Z', qubit, numQubits);
    }
    return state;
  }

  /**
   * Create NoiseModel from UI configuration
   */
  static fromConfig(config) {
    if (!config || config.noiseType === 'none') return new NoiseModel();

    return new NoiseModel({
      gateRotationError: config.gateRotationError?.enabled ? {
        enabled: true,
        magnitude: config.gateRotationError.magnitude ?? 0.01,
        ex: config.gateRotationError.ex ?? 1,
        ey: config.gateRotationError.ey ?? 1,
        ez: config.gateRotationError.ez ?? 1,
      } : null,
      depolarizingError: config.depolarizingError?.enabled ? {
        enabled: true,
        probability: config.depolarizingError.probability ?? 0.01,
      } : null,
      readoutError: config.readoutError?.enabled ? {
        enabled: true,
        probability: config.readoutError.probability ?? 0.02,
      } : null,
      initializationError: config.initializationError?.enabled ? {
        enabled: true,
        probability: config.initializationError.probability ?? 0.01,
      } : null,
      thermalRelaxation: config.thermalRelaxation?.enabled ? {
        enabled: true,
        t1: config.thermalRelaxation.t1 ?? 50,
        t2: config.thermalRelaxation.t2 ?? 70,
      } : null,
    });
  }

  toJSON() {
    return {
      gateRotationError: this.gateRotationError,
      depolarizingError: this.depolarizingError,
      readoutError: this.readoutError,
      initializationError: this.initializationError,
      thermalRelaxation: this.thermalRelaxation,
    };
  }
}

// ─── Helper functions ────────────────────────────────────────────────

function applyGateToState(state, matrix, qubit, numQubits) {
  const n = state.length;
  const newState = new Array(n);
  const step = 1 << (numQubits - 1 - qubit);

  for (let i = 0; i < n; i++) {
    newState[i] = Complex.zero();
  }

  for (let i = 0; i < n; i++) {
    const bit = (i >> (numQubits - 1 - qubit)) & 1;
    const pair = bit === 0 ? i + step : i - step;

    if (bit === 0) {
      newState[i] = newState[i].add(matrix[0][0].mul(state[i])).add(matrix[0][1].mul(state[pair]));
      newState[pair] = newState[pair].add(matrix[1][0].mul(state[i])).add(matrix[1][1].mul(state[pair]));
    }
  }

  return newState;
}

function applyPauliToState(state, pauli, qubit, numQubits) {
  const n = state.length;
  const newState = new Array(n);
  const step = 1 << (numQubits - 1 - qubit);

  for (let i = 0; i < n; i++) {
    const bit = (i >> (numQubits - 1 - qubit)) & 1;
    const pair = bit === 0 ? i + step : i - step;

    switch (pauli) {
      case 'X':
        newState[i] = state[pair].clone();
        break;
      case 'Y':
        newState[i] = bit === 0
          ? state[pair].mul(new Complex(0, -1))
          : state[pair].mul(new Complex(0, 1));
        break;
      case 'Z':
        newState[i] = bit === 0 ? state[i].clone() : state[i].mul(new Complex(-1));
        break;
      default:
        newState[i] = state[i].clone();
    }
  }

  return newState;
}

function projectAndReset(state, qubit, numQubits) {
  const n = state.length;
  const newState = new Array(n);
  let norm = 0;

  for (let i = 0; i < n; i++) {
    const bit = (i >> (numQubits - 1 - qubit)) & 1;
    if (bit === 0) {
      newState[i] = state[i].clone();
      norm += state[i].magnitudeSquared();
    } else {
      // Move |1⟩ amplitude to corresponding |0⟩ state
      const pair = i - (1 << (numQubits - 1 - qubit));
      newState[pair] = (newState[pair] || Complex.zero()).add(state[i]);
      newState[i] = Complex.zero();
      norm += state[i].magnitudeSquared();
    }
  }

  // Renormalize
  const factor = 1 / Math.sqrt(norm || 1);
  for (let i = 0; i < n; i++) {
    if (!newState[i]) newState[i] = Complex.zero();
    newState[i] = newState[i].mul(factor);
  }

  return newState;
}
