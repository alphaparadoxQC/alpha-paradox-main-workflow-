/**
 * ============================================================
 * QUANTUM NOISE MODEL ENGINE
 * ============================================================
 * Implements realistic noise channels for quantum circuit
 * simulation using Kraus operator formalism.
 *
 * Supported noise channels:
 * 1. Depolarizing noise
 * 2. Amplitude damping (T1 decay)
 * 3. Phase damping / dephasing (T2 decay)
 * 4. Readout (measurement) error
 * 5. Thermal relaxation
 * 6. Custom Kraus channels
 *
 * The noise model can be applied:
 * - After every gate (gate error)
 * - At measurement (readout error)
 * - Idle qubits (thermal noise)
 * ============================================================
 */

import { Complex, magnitudeSquared, multiply, add, ZERO } from '../complex';

// ─── Types ──────────────────────────────────────────────────

/** A Kraus operator: 2x2 complex matrix */
export type NoiseKrausOperator = [[Complex, Complex], [Complex, Complex]];

/** A noise channel defined by a set of Kraus operators Σ_k K_k† K_k = I */
export interface NoiseChannel {
  name: string;
  operators: NoiseKrausOperator[];
  /** Probability / error rate for this channel */
  errorRate: number;
}

/** Per-gate noise configuration */
export interface GateNoise {
  /** Single-qubit gate error rate */
  singleQubitError: number;
  /** Two-qubit gate error rate */
  twoQubitError: number;
  /** Which channels to apply after single-qubit gates */
  singleQubitChannels: NoiseChannel[];
  /** Which channels to apply after two-qubit gates */
  twoQubitChannels: NoiseChannel[];
}

/** Measurement noise configuration */
export interface ReadoutNoise {
  /** P(measure 1 | true state is 0) */
  p0to1: number;
  /** P(measure 0 | true state is 1) */
  p1to0: number;
}

/** Full noise model for a quantum device */
export interface NoiseModel {
  name: string;
  gateNoise: GateNoise;
  readoutNoise: ReadoutNoise;
  /** T1 relaxation time (microseconds) */
  t1: number;
  /** T2 dephasing time (microseconds) */
  t2: number;
  /** Gate time (microseconds) — used to calculate idle noise */
  gateTime: number;
  /** Whether noise is enabled */
  enabled: boolean;
}

// ─── Predefined Noise Models ────────────────────────────────

/**
 * Ideal (noiseless) model — for baseline comparison.
 */
export const IDEAL_NOISE_MODEL: NoiseModel = {
  name: 'Ideal',
  gateNoise: {
    singleQubitError: 0,
    twoQubitError: 0,
    singleQubitChannels: [],
    twoQubitChannels: [],
  },
  readoutNoise: { p0to1: 0, p1to0: 0 },
  t1: Infinity,
  t2: Infinity,
  gateTime: 0,
  enabled: false,
};

/**
 * IBM Quantum Eagle-class noise model (approximate).
 * Based on published error rates for IBM Eagle r3 processors.
 */
export const IBM_EAGLE_NOISE_MODEL: NoiseModel = {
  name: 'IBM Eagle (approx.)',
  gateNoise: {
    singleQubitError: 2.5e-4,  // ~0.025% single-qubit error
    twoQubitError: 7.5e-3,     // ~0.75% CX error
    singleQubitChannels: [],   // Populated at init
    twoQubitChannels: [],
  },
  readoutNoise: { p0to1: 0.015, p1to0: 0.025 },
  t1: 300,        // ~300 μs
  t2: 150,        // ~150 μs
  gateTime: 0.035, // ~35 ns single-qubit gate
  enabled: true,
};

/**
 * Google Sycamore-class noise model (approximate).
 */
export const GOOGLE_SYCAMORE_NOISE_MODEL: NoiseModel = {
  name: 'Google Sycamore (approx.)',
  gateNoise: {
    singleQubitError: 1.5e-3,
    twoQubitError: 6.2e-3,
    singleQubitChannels: [],
    twoQubitChannels: [],
  },
  readoutNoise: { p0to1: 0.038, p1to0: 0.046 },
  t1: 20,
  t2: 10,
  gateTime: 0.025,
  enabled: true,
};

/**
 * High-noise model for stress testing.
 */
export const HIGH_NOISE_MODEL: NoiseModel = {
  name: 'High Noise (testing)',
  gateNoise: {
    singleQubitError: 0.05,
    twoQubitError: 0.15,
    singleQubitChannels: [],
    twoQubitChannels: [],
  },
  readoutNoise: { p0to1: 0.1, p1to0: 0.1 },
  t1: 5,
  t2: 2,
  gateTime: 0.05,
  enabled: true,
};

// ─── Kraus Operator Generators ──────────────────────────────

/**
 * Depolarizing channel: with probability p, the qubit is replaced
 * by a completely mixed state (I/2).
 *
 * Kraus operators:
 *   K0 = sqrt(1-p) · I
 *   K1 = sqrt(p/3) · X
 *   K2 = sqrt(p/3) · Y
 *   K3 = sqrt(p/3) · Z
 */
export const createDepolarizingChannel = (p: number): NoiseChannel => {
  const s0 = Math.sqrt(1 - p);
  const s1 = Math.sqrt(p / 3);

  const K0: NoiseKrausOperator = [
    [{ re: s0, im: 0 }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: s0, im: 0 }],
  ];

  const K1: NoiseKrausOperator = [ // sqrt(p/3) · X
    [{ re: 0, im: 0 }, { re: s1, im: 0 }],
    [{ re: s1, im: 0 }, { re: 0, im: 0 }],
  ];

  const K2: NoiseKrausOperator = [ // sqrt(p/3) · Y
    [{ re: 0, im: 0 }, { re: 0, im: -s1 }],
    [{ re: 0, im: s1 }, { re: 0, im: 0 }],
  ];

  const K3: NoiseKrausOperator = [ // sqrt(p/3) · Z
    [{ re: s1, im: 0 }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: -s1, im: 0 }],
  ];

  return {
    name: 'Depolarizing',
    operators: [K0, K1, K2, K3],
    errorRate: p,
  };
};

/**
 * Amplitude damping channel: models T1 energy relaxation (|1⟩ → |0⟩).
 *
 * Kraus operators:
 *   K0 = [[1, 0], [0, sqrt(1-γ)]]
 *   K1 = [[0, sqrt(γ)], [0, 0]]
 *
 * where γ = 1 - exp(-t_gate / T1)
 */
export const createAmplitudeDampingChannel = (gamma: number): NoiseChannel => {
  const sqrtGamma = Math.sqrt(gamma);
  const sqrt1mGamma = Math.sqrt(1 - gamma);

  const K0: NoiseKrausOperator = [
    [{ re: 1, im: 0 }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: sqrt1mGamma, im: 0 }],
  ];

  const K1: NoiseKrausOperator = [
    [{ re: 0, im: 0 }, { re: sqrtGamma, im: 0 }],
    [{ re: 0, im: 0 }, { re: 0, im: 0 }],
  ];

  return {
    name: 'Amplitude Damping',
    operators: [K0, K1],
    errorRate: gamma,
  };
};

/**
 * Phase damping channel: models T2 dephasing (loss of coherence).
 *
 * Kraus operators:
 *   K0 = [[1, 0], [0, sqrt(1-λ)]]
 *   K1 = [[0, 0], [0, sqrt(λ)]]
 *
 * where λ = 1 - exp(-t_gate / T_phi), T_phi = 1/(1/T2 - 1/(2*T1))
 */
export const createPhaseDampingChannel = (lambda: number): NoiseChannel => {
  const sqrtLambda = Math.sqrt(lambda);
  const sqrt1mLambda = Math.sqrt(1 - lambda);

  const K0: NoiseKrausOperator = [
    [{ re: 1, im: 0 }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: sqrt1mLambda, im: 0 }],
  ];

  const K1: NoiseKrausOperator = [
    [{ re: 0, im: 0 }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: sqrtLambda, im: 0 }],
  ];

  return {
    name: 'Phase Damping',
    operators: [K0, K1],
    errorRate: lambda,
  };
};

/**
 * Create a thermal relaxation channel combining T1 and T2 effects.
 * This is the standard model used by Qiskit Aer.
 */
export const createThermalRelaxationChannel = (
  t1: number,
  t2: number,
  gateTime: number
): NoiseChannel => {
  // Calculate decay parameters
  const gamma = 1 - Math.exp(-gateTime / t1);
  const tPhi = t2 > 0 && t1 > 0 ? 1 / (1 / t2 - 1 / (2 * t1)) : Infinity;
  const lambda = tPhi < Infinity ? 1 - Math.exp(-gateTime / tPhi) : 0;

  // Use combined amplitude + phase damping
  // For simplicity, we compose both channels
  const ampDamp = createAmplitudeDampingChannel(Math.min(gamma, 1));
  const phaseDamp = createPhaseDampingChannel(Math.min(lambda, 1));

  return {
    name: 'Thermal Relaxation',
    operators: [...ampDamp.operators, ...phaseDamp.operators],
    errorRate: gamma + lambda,
  };
};

// ─── Noise Application ──────────────────────────────────────

/**
 * Apply a noise channel to a single qubit in a state vector.
 * Uses the density-matrix-like approach within the state vector formalism:
 *
 * For a pure state |ψ⟩, after applying channel {K_k}:
 *   ρ' = Σ_k K_k |ψ⟩⟨ψ| K_k†
 *
 * Since we use state vectors, we stochastically apply one Kraus operator:
 *   1. Compute p_k = ⟨ψ| K_k† K_k |ψ⟩ for each k
 *   2. Sample k according to probabilities p_k
 *   3. Apply |ψ'⟩ = K_k |ψ⟩ / sqrt(p_k)
 */
export const applyNoiseToQubit = (
  amplitudes: Complex[],
  qubitCount: number,
  targetQubit: number,
  channel: NoiseChannel,
  bitPosition: number
): Complex[] => {
  const numStates = amplitudes.length;
  const mask = 1 << bitPosition;

  // 1. Compute probabilities for each Kraus operator
  const krausResults: { amplitudes: Complex[]; probability: number }[] = [];

  for (const K of channel.operators) {
    const newAmps: Complex[] = new Array(numStates);
    let prob = 0;

    for (let i = 0; i < numStates; i++) {
      const bit = (i >> bitPosition) & 1;
      const partner = i ^ mask;
      const idx0 = bit === 0 ? i : partner;
      const idx1 = bit === 0 ? partner : i;

      if (i > partner) {
        newAmps[i] = newAmps[i] || { re: 0, im: 0 };
        continue;
      }

      const alpha = amplitudes[idx0];
      const beta = amplitudes[idx1];

      // Apply K: [new_a, new_b] = K · [a, b]
      const newAlpha: Complex = add(
        multiply(K[0][0], alpha),
        multiply(K[0][1], beta)
      );
      const newBeta: Complex = add(
        multiply(K[1][0], alpha),
        multiply(K[1][1], beta)
      );

      newAmps[idx0] = newAlpha;
      newAmps[idx1] = newBeta;

      prob += magnitudeSquared(newAlpha) + magnitudeSquared(newBeta);
    }

    // Normalize probability (should sum to ~1 across all operators)
    krausResults.push({ amplitudes: newAmps, probability: prob / 2 });
  }

  // 2. Stochastically select one Kraus operator
  const totalProb = krausResults.reduce((s, kr) => s + kr.probability, 0);
  let r = Math.random() * totalProb;
  let selectedIdx = 0;

  for (let k = 0; k < krausResults.length; k++) {
    r -= krausResults[k].probability;
    if (r <= 0) {
      selectedIdx = k;
      break;
    }
  }

  // 3. Apply selected operator and renormalize
  const selected = krausResults[selectedIdx];
  const invNorm = 1 / Math.sqrt(selected.probability);

  return selected.amplitudes.map(a => ({
    re: a.re * invNorm,
    im: a.im * invNorm,
  }));
};

/**
 * Apply readout noise to measurement results.
 * Flips measurement outcome with given error probabilities.
 */
export const applyReadoutNoise = (
  probabilities: { state: string; probability: number }[],
  readout: ReadoutNoise
): { state: string; probability: number }[] => {
  if (readout.p0to1 === 0 && readout.p1to0 === 0) return probabilities;

  // For each probability entry, apply the confusion matrix
  // P_noisy(b) = Σ_a M(b|a) · P_ideal(a)
  // Where M is the readout confusion matrix per qubit
  return probabilities.map(p => {
    // Count bits in the state string
    const bits = p.state.replace(/[|⟩]/g, '');
    let adjustedProb = p.probability;

    for (const bit of bits) {
      if (bit === '0') {
        // P(still 0) = 1 - p0to1
        adjustedProb *= (1 - readout.p0to1);
      } else if (bit === '1') {
        // P(still 1) = 1 - p1to0
        adjustedProb *= (1 - readout.p1to0);
      }
    }

    return { state: p.state, probability: adjustedProb };
  });
};

// ─── Noise Model Initialization ─────────────────────────────

/**
 * Initialize noise channels for a given noise model.
 * Converts physical parameters (T1, T2, error rates) into
 * Kraus operators that can be applied during simulation.
 */
export const initializeNoiseModel = (model: NoiseModel): NoiseModel => {
  const initialized = { ...model };

  if (!model.enabled) return initialized;

  // Build single-qubit noise channels
  const singleChannels: NoiseChannel[] = [];

  // Depolarizing error for gates
  if (model.gateNoise.singleQubitError > 0) {
    singleChannels.push(
      createDepolarizingChannel(model.gateNoise.singleQubitError)
    );
  }

  // Thermal relaxation during gate execution
  if (model.t1 < Infinity && model.gateTime > 0) {
    singleChannels.push(
      createThermalRelaxationChannel(model.t1, model.t2, model.gateTime)
    );
  }

  // Build two-qubit noise channels
  const twoChannels: NoiseChannel[] = [];

  if (model.gateNoise.twoQubitError > 0) {
    twoChannels.push(
      createDepolarizingChannel(model.gateNoise.twoQubitError)
    );
  }

  initialized.gateNoise = {
    ...model.gateNoise,
    singleQubitChannels: singleChannels,
    twoQubitChannels: twoChannels,
  };

  return initialized;
};

// ─── Utility ────────────────────────────────────────────────

/**
 * Get all available noise model presets.
 */
export const getNoiseModelPresets = (): NoiseModel[] => [
  IDEAL_NOISE_MODEL,
  IBM_EAGLE_NOISE_MODEL,
  GOOGLE_SYCAMORE_NOISE_MODEL,
  HIGH_NOISE_MODEL,
];
