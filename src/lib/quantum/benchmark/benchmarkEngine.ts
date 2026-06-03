/**
 * ============================================================
 * QUANTUM BENCHMARKING ENGINE
 * ============================================================
 * Automated fidelity checks, state comparisons, and benchmark
 * pipelines for validating quantum simulation accuracy.
 *
 * Features:
 * 1. State Fidelity: F(ρ, σ) = |⟨ψ|φ⟩|² for pure states
 * 2. Circuit Benchmarks: Standard test circuits with known outputs
 * 3. Performance Profiling: Timing and memory analysis
 * 4. Cross-validation: Compare CPU vs GPU vs MPS results
 * 5. Regression testing: Detect accuracy degradation
 *
 * Reference implementations follow:
 * - PennyLane conventions
 * - Qiskit Aer expected outputs
 * - Cirq analytical results
 * ============================================================
 */

import { Complex, magnitudeSquared } from '../complex';

// ─── Types ──────────────────────────────────────────────────

export interface BenchmarkResult {
  name: string;
  passed: boolean;
  fidelity: number;
  executionTimeMs: number;
  memoryUsedBytes?: number;
  details: string;
  expectedProbabilities: { state: string; probability: number }[];
  actualProbabilities: { state: string; probability: number }[];
}

export interface BenchmarkSuite {
  name: string;
  results: BenchmarkResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageFidelity: number;
  totalExecutionTimeMs: number;
  timestamp: number;
}

export interface BenchmarkCase {
  name: string;
  qubitCount: number;
  gates: { type: string; qubit: number; targetQubit?: number; angle?: number; position: number }[];
  expectedProbabilities: { state: string; probability: number }[];
  /** Minimum acceptable fidelity (0-1) */
  fidelityThreshold: number;
  /** Tags for filtering */
  tags: string[];
}

// ─── State Fidelity ─────────────────────────────────────────

/**
 * Compute fidelity between two pure states: F = |⟨ψ|φ⟩|²
 * Returns a value in [0, 1] where 1 = identical states.
 */
export const stateFidelity = (
  psi: Complex[],
  phi: Complex[]
): number => {
  if (psi.length !== phi.length) {
    throw new Error(`State dimension mismatch: ${psi.length} vs ${phi.length}`);
  }

  // Inner product ⟨ψ|φ⟩ = Σ_i conj(ψ_i) · φ_i
  let re = 0, im = 0;
  for (let i = 0; i < psi.length; i++) {
    // conj(psi) * phi = (psi.re - i*psi.im) * (phi.re + i*phi.im)
    re += psi[i].re * phi[i].re + psi[i].im * phi[i].im;
    im += psi[i].re * phi[i].im - psi[i].im * phi[i].re;
  }

  // F = |⟨ψ|φ⟩|²
  return re * re + im * im;
};

/**
 * Compute fidelity between two probability distributions.
 * Uses the Bhattacharyya coefficient: BC = Σ_i sqrt(p_i * q_i)
 * Classical fidelity = BC²
 */
export const probabilityFidelity = (
  expected: { state: string; probability: number }[],
  actual: { state: string; probability: number }[]
): number => {
  // Build lookup maps
  const expectedMap = new Map<string, number>();
  for (const e of expected) {
    expectedMap.set(e.state, e.probability);
  }

  const actualMap = new Map<string, number>();
  for (const a of actual) {
    actualMap.set(a.state, a.probability);
  }

  // Compute Bhattacharyya coefficient
  let bc = 0;
  const allStates = new Set([...expectedMap.keys(), ...actualMap.keys()]);

  for (const state of allStates) {
    const p = expectedMap.get(state) || 0;
    const q = actualMap.get(state) || 0;
    bc += Math.sqrt(p * q);
  }

  return bc * bc; // Classical fidelity
};

/**
 * Total Variation Distance: TVD = (1/2) Σ_i |p_i - q_i|
 * Returns 0 for identical distributions, 1 for orthogonal.
 */
export const totalVariationDistance = (
  expected: { state: string; probability: number }[],
  actual: { state: string; probability: number }[]
): number => {
  const expectedMap = new Map<string, number>();
  for (const e of expected) expectedMap.set(e.state, e.probability);

  const actualMap = new Map<string, number>();
  for (const a of actual) actualMap.set(a.state, a.probability);

  let tvd = 0;
  const allStates = new Set([...expectedMap.keys(), ...actualMap.keys()]);

  for (const state of allStates) {
    const p = expectedMap.get(state) || 0;
    const q = actualMap.get(state) || 0;
    tvd += Math.abs(p - q);
  }

  return tvd / 2;
};

// ─── Standard Benchmark Circuits ────────────────────────────

const generateId = () => `bench-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

/**
 * Bell state preparation: H(q0) → CNOT(q0, q1)
 * Expected: 50% |00⟩, 50% |11⟩
 */
export const BELL_STATE_BENCHMARK: BenchmarkCase = {
  name: 'Bell State (Φ+)',
  qubitCount: 2,
  gates: [
    { type: 'H', qubit: 0, position: 0 },
    { type: 'CNOT', qubit: 0, targetQubit: 1, position: 1 },
  ],
  expectedProbabilities: [
    { state: '|00⟩', probability: 0.5 },
    { state: '|11⟩', probability: 0.5 },
  ],
  fidelityThreshold: 0.999,
  tags: ['basic', 'entanglement'],
};

/**
 * GHZ state: H(q0) → CNOT(q0,q1) → CNOT(q1,q2)
 * Expected: 50% |000⟩, 50% |111⟩
 */
export const GHZ_STATE_BENCHMARK: BenchmarkCase = {
  name: 'GHZ State (3-qubit)',
  qubitCount: 3,
  gates: [
    { type: 'H', qubit: 0, position: 0 },
    { type: 'CNOT', qubit: 0, targetQubit: 1, position: 1 },
    { type: 'CNOT', qubit: 1, targetQubit: 2, position: 2 },
  ],
  expectedProbabilities: [
    { state: '|000⟩', probability: 0.5 },
    { state: '|111⟩', probability: 0.5 },
  ],
  fidelityThreshold: 0.999,
  tags: ['basic', 'entanglement', 'ghz'],
};

/**
 * Full Hadamard on 4 qubits: uniform superposition.
 * Expected: 1/16 probability for each of 16 states.
 */
export const HADAMARD_SUPERPOSITION_BENCHMARK: BenchmarkCase = {
  name: 'Uniform Superposition (4-qubit)',
  qubitCount: 4,
  gates: [
    { type: 'H', qubit: 0, position: 0 },
    { type: 'H', qubit: 1, position: 0 },
    { type: 'H', qubit: 2, position: 0 },
    { type: 'H', qubit: 3, position: 0 },
  ],
  expectedProbabilities: Array.from({ length: 16 }, (_, i) => ({
    state: `|${i.toString(2).padStart(4, '0')}⟩`,
    probability: 1 / 16,
  })),
  fidelityThreshold: 0.999,
  tags: ['basic', 'superposition'],
};

/**
 * X gate identity: X · X = I
 * Expected: |0⟩ with probability 1
 */
export const GATE_CANCELLATION_BENCHMARK: BenchmarkCase = {
  name: 'Gate Cancellation (X·X = I)',
  qubitCount: 1,
  gates: [
    { type: 'X', qubit: 0, position: 0 },
    { type: 'X', qubit: 0, position: 1 },
  ],
  expectedProbabilities: [
    { state: '|0⟩', probability: 1.0 },
  ],
  fidelityThreshold: 0.9999,
  tags: ['identity', 'cancellation'],
};

/**
 * H·H = I check
 */
export const HADAMARD_IDENTITY_BENCHMARK: BenchmarkCase = {
  name: 'Hadamard Identity (H·H = I)',
  qubitCount: 1,
  gates: [
    { type: 'H', qubit: 0, position: 0 },
    { type: 'H', qubit: 0, position: 1 },
  ],
  expectedProbabilities: [
    { state: '|0⟩', probability: 1.0 },
  ],
  fidelityThreshold: 0.9999,
  tags: ['identity', 'cancellation'],
};

/**
 * SWAP test: SWAP(q0, q1) on |10⟩ → |01⟩
 */
export const SWAP_TEST_BENCHMARK: BenchmarkCase = {
  name: 'SWAP Gate Test',
  qubitCount: 2,
  gates: [
    { type: 'X', qubit: 0, position: 0 },
    { type: 'SWAP', qubit: 0, targetQubit: 1, position: 1 },
  ],
  expectedProbabilities: [
    { state: '|01⟩', probability: 1.0 },
  ],
  fidelityThreshold: 0.999,
  tags: ['swap', 'permutation'],
};

/**
 * Rotation gate test: Ry(π) on |0⟩ → |1⟩
 */
export const ROTATION_BENCHMARK: BenchmarkCase = {
  name: 'Ry(π) Rotation',
  qubitCount: 1,
  gates: [
    { type: 'Ry', qubit: 0, angle: Math.PI, position: 0 },
  ],
  expectedProbabilities: [
    { state: '|1⟩', probability: 1.0 },
  ],
  fidelityThreshold: 0.999,
  tags: ['rotation', 'parametric'],
};

// ─── All Benchmark Cases ────────────────────────────────────

export const ALL_BENCHMARK_CASES: BenchmarkCase[] = [
  BELL_STATE_BENCHMARK,
  GHZ_STATE_BENCHMARK,
  HADAMARD_SUPERPOSITION_BENCHMARK,
  GATE_CANCELLATION_BENCHMARK,
  HADAMARD_IDENTITY_BENCHMARK,
  SWAP_TEST_BENCHMARK,
  ROTATION_BENCHMARK,
];

// ─── Benchmark Runner ───────────────────────────────────────

/**
 * Run a single benchmark case against a simulator function.
 */
export const runBenchmarkCase = (
  benchmarkCase: BenchmarkCase,
  simulator: (
    gates: any[],
    qubitCount: number
  ) => { probabilities: { state: string; probability: number }[] }
): BenchmarkResult => {
  const start = performance.now();

  // Add IDs to gates
  const gates = benchmarkCase.gates.map(g => ({
    ...g,
    id: generateId(),
  }));

  let result: { probabilities: { state: string; probability: number }[] };

  try {
    result = simulator(gates, benchmarkCase.qubitCount);
  } catch (error: any) {
    return {
      name: benchmarkCase.name,
      passed: false,
      fidelity: 0,
      executionTimeMs: performance.now() - start,
      details: `Simulation failed: ${error.message}`,
      expectedProbabilities: benchmarkCase.expectedProbabilities,
      actualProbabilities: [],
    };
  }

  const executionTimeMs = performance.now() - start;

  // Compute fidelity
  const fidelity = probabilityFidelity(
    benchmarkCase.expectedProbabilities,
    result.probabilities
  );

  const tvd = totalVariationDistance(
    benchmarkCase.expectedProbabilities,
    result.probabilities
  );

  const passed = fidelity >= benchmarkCase.fidelityThreshold;

  return {
    name: benchmarkCase.name,
    passed,
    fidelity,
    executionTimeMs,
    details: passed
      ? `Passed: F=${fidelity.toFixed(6)}, TVD=${tvd.toFixed(6)}, ${executionTimeMs.toFixed(1)}ms`
      : `FAILED: F=${fidelity.toFixed(6)} < ${benchmarkCase.fidelityThreshold} (TVD=${tvd.toFixed(6)})`,
    expectedProbabilities: benchmarkCase.expectedProbabilities,
    actualProbabilities: result.probabilities,
  };
};

/**
 * Run all benchmark cases and produce a suite report.
 */
export const runBenchmarkSuite = (
  simulator: (
    gates: any[],
    qubitCount: number
  ) => { probabilities: { state: string; probability: number }[] },
  cases: BenchmarkCase[] = ALL_BENCHMARK_CASES,
  suiteName: string = 'Default Benchmark Suite'
): BenchmarkSuite => {
  const results = cases.map(c => runBenchmarkCase(c, simulator));

  const passedTests = results.filter(r => r.passed).length;
  const failedTests = results.filter(r => !r.passed).length;
  const averageFidelity = results.length > 0
    ? results.reduce((sum, r) => sum + r.fidelity, 0) / results.length
    : 0;
  const totalExecutionTimeMs = results.reduce((sum, r) => sum + r.executionTimeMs, 0);

  return {
    name: suiteName,
    results,
    totalTests: results.length,
    passedTests,
    failedTests,
    averageFidelity,
    totalExecutionTimeMs,
    timestamp: Date.now(),
  };
};
