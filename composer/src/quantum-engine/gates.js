/**
 * Quantum Gate Library
 * All gates as 2×2 or 4×4 complex matrices.
 */
import { Complex } from './complex.js';

const SQRT2_INV = 1 / Math.sqrt(2);

// ─── Single-Qubit Gates ─────────────────────────────────────────────

export const GATES = {
  // Pauli Gates
  I: {
    name: 'I', label: 'I', qubits: 1, category: 'standard', color: '#6b7280',
    description: 'Identity gate. Leaves the qubit state unchanged. Equivalent to doing nothing for one time step.',
    decomposition: null,
    matrix: [
      [Complex.one(), Complex.zero()],
      [Complex.zero(), Complex.one()]
    ]
  },

  H: {
    name: 'H', label: 'H', qubits: 1, category: 'standard', color: '#3b82f6',
    description: 'Hadamard gate. Creates an equal superposition of |0⟩ and |1⟩. Maps |0⟩ → |+⟩ and |1⟩ → |−⟩. Fundamental for quantum parallelism.',
    decomposition: null,
    matrix: [
      [new Complex(SQRT2_INV), new Complex(SQRT2_INV)],
      [new Complex(SQRT2_INV), new Complex(-SQRT2_INV)]
    ]
  },

  X: {
    name: 'X', label: 'X', qubits: 1, category: 'standard', color: '#ef4444',
    description: 'Pauli-X gate (NOT gate). Flips |0⟩ ↔ |1⟩. Equivalent to a π rotation around the X-axis of the Bloch sphere.',
    decomposition: null,
    matrix: [
      [Complex.zero(), Complex.one()],
      [Complex.one(), Complex.zero()]
    ]
  },

  Y: {
    name: 'Y', label: 'Y', qubits: 1, category: 'standard', color: '#22c55e',
    description: 'Pauli-Y gate. Combines a bit-flip and a phase-flip. Equivalent to a π rotation around the Y-axis of the Bloch sphere.',
    decomposition: null,
    matrix: [
      [Complex.zero(), new Complex(0, -1)],
      [new Complex(0, 1), Complex.zero()]
    ]
  },

  Z: {
    name: 'Z', label: 'Z', qubits: 1, category: 'standard', color: '#a855f7',
    description: 'Pauli-Z gate. Applies a phase flip: |1⟩ → −|1⟩. Equivalent to a π rotation around the Z-axis. Special case of the P gate with λ=π.',
    decomposition: null,
    matrix: [
      [Complex.one(), Complex.zero()],
      [Complex.zero(), new Complex(-1)]
    ]
  },

  S: {
    name: 'S', label: 'S', qubits: 1, category: 'standard', color: '#06b6d4',
    description: 'S gate (√Z). Applies a π/2 phase shift to |1⟩. Two S gates equal one Z gate. Used in T-gate based fault-tolerant circuits.',
    decomposition: null,
    matrix: [
      [Complex.one(), Complex.zero()],
      [Complex.zero(), Complex.i()]
    ]
  },

  SDG: {
    name: 'SDG', label: 'S†', qubits: 1, category: 'standard', color: '#06b6d4',
    description: 'S-dagger gate (inverse of S). Applies a −π/2 phase shift to |1⟩. S† × S = I (identity).',
    decomposition: null,
    matrix: [
      [Complex.one(), Complex.zero()],
      [Complex.zero(), new Complex(0, -1)]
    ]
  },

  T: {
    name: 'T', label: 'T', qubits: 1, category: 'standard', color: '#f59e0b',
    description: 'T gate (√S, π/8 gate). Applies a π/4 phase shift to |1⟩. Critical for universal quantum computation and fault-tolerant circuits.',
    decomposition: null,
    matrix: [
      [Complex.one(), Complex.zero()],
      [Complex.zero(), Complex.fromPolar(1, Math.PI / 4)]
    ]
  },

  TDG: {
    name: 'TDG', label: 'T†', qubits: 1, category: 'standard', color: '#f59e0b',
    description: 'T-dagger gate (inverse of T). Applies a −π/4 phase shift to |1⟩. T† × T = I (identity).',
    decomposition: null,
    matrix: [
      [Complex.one(), Complex.zero()],
      [Complex.zero(), Complex.fromPolar(1, -Math.PI / 4)]
    ]
  },

  SX: {
    name: 'SX', label: '√X', qubits: 1, category: 'standard', color: '#ec4899',
    description: 'Square root of X gate (√X). Applying it twice gives an X gate. Used as a native gate in Alpha hardware.',
    decomposition: null,
    matrix: [
      [new Complex(0.5, 0.5), new Complex(0.5, -0.5)],
      [new Complex(0.5, -0.5), new Complex(0.5, 0.5)]
    ]
  },
};

// ─── Parameterized Gate Factories ────────────────────────────────────

export function RX(theta) {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);
  return {
    name: 'RX', label: 'RX', qubits: 1, category: 'rotation', color: '#f472b6',
    params: { theta },
    matrix: [
      [new Complex(cos), new Complex(0, -sin)],
      [new Complex(0, -sin), new Complex(cos)]
    ]
  };
}

export function RY(theta) {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);
  return {
    name: 'RY', label: 'RY', qubits: 1, category: 'rotation', color: '#f472b6',
    params: { theta },
    matrix: [
      [new Complex(cos), new Complex(-sin)],
      [new Complex(sin), new Complex(cos)]
    ]
  };
}

export function RZ(theta) {
  return {
    name: 'RZ', label: 'RZ', qubits: 1, category: 'rotation', color: '#f472b6',
    params: { theta },
    matrix: [
      [Complex.fromPolar(1, -theta / 2), Complex.zero()],
      [Complex.zero(), Complex.fromPolar(1, theta / 2)]
    ]
  };
}

export function P(lambda) {
  return {
    name: 'P', label: 'P', qubits: 1, category: 'rotation', color: '#8b5cf6',
    params: { lambda },
    matrix: [
      [Complex.one(), Complex.zero()],
      [Complex.zero(), Complex.fromPolar(1, lambda)]
    ]
  };
}

export function U(theta, phi, lambda) {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);
  return {
    name: 'U', label: 'U', qubits: 1, category: 'rotation', color: '#8b5cf6',
    params: { theta, phi, lambda },
    matrix: [
      [new Complex(cos), Complex.fromPolar(-sin, lambda)],
      [Complex.fromPolar(sin, phi), Complex.fromPolar(cos, phi + lambda)]
    ]
  };
}

// ─── Two-Qubit Gates ────────────────────────────────────────────────

const _0 = Complex.zero();
const _1 = Complex.one();

GATES.CX = {
  name: 'CX', label: 'CX', qubits: 2, category: 'multi', color: '#10b981',
  description: 'Controlled-X (CNOT) gate. Flips the target qubit if the control qubit is |1⟩. Fundamental entangling gate for creating Bell states.',
  decomposition: null,
  matrix: [
    [_1, _0, _0, _0],
    [_0, _1, _0, _0],
    [_0, _0, _0, _1],
    [_0, _0, _1, _0]
  ]
};

GATES.CY = {
  name: 'CY', label: 'CY', qubits: 2, category: 'multi', color: '#10b981',
  description: 'Controlled-Y gate. Applies a Pauli-Y to the target qubit when the control is |1⟩.',
  decomposition: [{ gate: 'SDG', target: 1 }, { gate: 'CX', control: 0, target: 1 }, { gate: 'S', target: 1 }],
  matrix: [
    [_1, _0, _0, _0],
    [_0, _1, _0, _0],
    [_0, _0, _0, new Complex(0, -1)],
    [_0, _0, new Complex(0, 1), _0]
  ]
};

GATES.CZ = {
  name: 'CZ', label: 'CZ', qubits: 2, category: 'multi', color: '#10b981',
  description: 'Controlled-Z gate. Applies a phase flip to the target qubit when both qubits are |1⟩. Symmetric: CZ(a,b) = CZ(b,a).',
  decomposition: [{ gate: 'H', target: 1 }, { gate: 'CX', control: 0, target: 1 }, { gate: 'H', target: 1 }],
  matrix: [
    [_1, _0, _0, _0],
    [_0, _1, _0, _0],
    [_0, _0, _1, _0],
    [_0, _0, _0, new Complex(-1)]
  ]
};

GATES.SWAP = {
  name: 'SWAP', label: 'SWAP', qubits: 2, category: 'multi', color: '#10b981',
  description: 'SWAP gate. Exchanges the quantum states of two qubits. Decomposed into three CNOT gates.',
  decomposition: [
    { gate: 'CX', control: 0, target: 1 },
    { gate: 'CX', control: 1, target: 0 },
    { gate: 'CX', control: 0, target: 1 }
  ],
  matrix: [
    [_1, _0, _0, _0],
    [_0, _0, _1, _0],
    [_0, _1, _0, _0],
    [_0, _0, _0, _1]
  ]
};

export function CP(theta) {
  return {
    name: 'CP', label: 'CP', qubits: 2, category: 'multi', color: '#10b981',
    params: { theta },
    matrix: [
      [_1, _0, _0, _0],
      [_0, _1, _0, _0],
      [_0, _0, _1, _0],
      [_0, _0, _0, Complex.fromPolar(1, theta)]
    ]
  };
}

export function CRX(theta) {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);
  return {
    name: 'CRX', label: 'CRX', qubits: 2, category: 'multi', color: '#10b981',
    params: { theta },
    matrix: [
      [_1, _0, _0, _0],
      [_0, _1, _0, _0],
      [_0, _0, new Complex(cos), new Complex(0, -sin)],
      [_0, _0, new Complex(0, -sin), new Complex(cos)]
    ]
  };
}

export function CRY(theta) {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);
  return {
    name: 'CRY', label: 'CRY', qubits: 2, category: 'multi', color: '#10b981',
    params: { theta },
    matrix: [
      [_1, _0, _0, _0],
      [_0, _1, _0, _0],
      [_0, _0, new Complex(cos), new Complex(-sin)],
      [_0, _0, new Complex(sin), new Complex(cos)]
    ]
  };
}

export function CRZ(theta) {
  return {
    name: 'CRZ', label: 'CRZ', qubits: 2, category: 'multi', color: '#10b981',
    params: { theta },
    matrix: [
      [_1, _0, _0, _0],
      [_0, _1, _0, _0],
      [_0, _0, Complex.fromPolar(1, -theta / 2), _0],
      [_0, _0, _0, Complex.fromPolar(1, theta / 2)]
    ]
  };
}

export function CU(theta, phi, lambda) {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);
  return {
    name: 'CU', label: 'CU', qubits: 2, category: 'multi', color: '#10b981',
    params: { theta, phi, lambda },
    matrix: [
      [_1, _0, _0, _0],
      [_0, _1, _0, _0],
      [_0, _0, new Complex(cos), Complex.fromPolar(-sin, lambda)],
      [_0, _0, Complex.fromPolar(sin, phi), Complex.fromPolar(cos, phi + lambda)]
    ]
  };
}

GATES.CH = {
  name: 'CH', label: 'CH', qubits: 2, category: 'multi', color: '#10b981',
  description: 'Controlled-Hadamard gate. Applies a Hadamard to the target qubit when the control is |1⟩.',
  decomposition: [{ gate: 'S', target: 1 }, { gate: 'H', target: 1 }, { gate: 'T', target: 1 }, { gate: 'CX', control: 0, target: 1 }, { gate: 'TDG', target: 1 }, { gate: 'H', target: 1 }, { gate: 'SDG', target: 1 }],
  matrix: [
    [_1, _0, _0, _0],
    [_0, _1, _0, _0],
    [_0, _0, new Complex(SQRT2_INV), new Complex(SQRT2_INV)],
    [_0, _0, new Complex(SQRT2_INV), new Complex(-SQRT2_INV)]
  ]
};

export function RXX(theta) {
  const cos = Math.cos(theta / 2);
  const isin = new Complex(0, -Math.sin(theta / 2));
  return {
    name: 'RXX', label: 'RXX', qubits: 2, category: 'multi', color: '#f472b6',
    params: { theta },
    matrix: [
      [new Complex(cos), _0, _0, isin],
      [_0, new Complex(cos), isin, _0],
      [_0, isin, new Complex(cos), _0],
      [isin, _0, _0, new Complex(cos)]
    ]
  };
}

export function RYY(theta) {
  const cos = Math.cos(theta / 2);
  const isin = new Complex(0, Math.sin(theta / 2));
  return {
    name: 'RYY', label: 'RYY', qubits: 2, category: 'multi', color: '#f472b6',
    params: { theta },
    matrix: [
      [new Complex(cos), _0, _0, isin],
      [_0, new Complex(cos), new Complex(0, -Math.sin(theta / 2)), _0],
      [_0, new Complex(0, -Math.sin(theta / 2)), new Complex(cos), _0],
      [isin, _0, _0, new Complex(cos)]
    ]
  };
}

export function RZZ(theta) {
  return {
    name: 'RZZ', label: 'RZZ', qubits: 2, category: 'multi', color: '#f472b6',
    params: { theta },
    matrix: [
      [Complex.fromPolar(1, -theta / 2), _0, _0, _0],
      [_0, Complex.fromPolar(1, theta / 2), _0, _0],
      [_0, _0, Complex.fromPolar(1, theta / 2), _0],
      [_0, _0, _0, Complex.fromPolar(1, -theta / 2)]
    ]
  };
}

// ─── Three-Qubit Gates ──────────────────────────────────────────────

GATES.CCX = {
  name: 'CCX', label: 'CCX', qubits: 3, category: 'multi', color: '#10b981',
  description: 'Toffoli gate (CCX). Flips the target qubit only when both control qubits are |1⟩. Universal for classical reversible computing.',
  decomposition: [
    { gate: 'H', target: 2 },
    { gate: 'CX', control: 1, target: 2 },
    { gate: 'TDG', target: 2 },
    { gate: 'CX', control: 0, target: 2 },
    { gate: 'T', target: 2 },
    { gate: 'CX', control: 1, target: 2 },
    { gate: 'TDG', target: 2 },
    { gate: 'CX', control: 0, target: 2 },
    { gate: 'T', target: 1 },
    { gate: 'T', target: 2 },
    { gate: 'H', target: 2 },
    { gate: 'CX', control: 0, target: 1 },
    { gate: 'T', target: 0 },
    { gate: 'TDG', target: 1 },
    { gate: 'CX', control: 0, target: 1 }
  ],
  matrix: (() => {
    const m = Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => Complex.zero())
    );
    for (let i = 0; i < 8; i++) m[i][i] = Complex.one();
    // Swap |110⟩ ↔ |111⟩
    m[6][6] = Complex.zero(); m[6][7] = Complex.one();
    m[7][7] = Complex.zero(); m[7][6] = Complex.one();
    return m;
  })()
};

GATES.CSWAP = {
  name: 'CSWAP', label: 'CSWAP', qubits: 3, category: 'multi', color: '#10b981',
  description: 'Fredkin gate (CSWAP). Swaps two target qubits only when the control qubit is |1⟩. Universal for reversible computing.',
  decomposition: [
    { gate: 'CX', control: 2, target: 1 },
    { gate: 'CCX', controls: [0, 1], target: 2 },
    { gate: 'CX', control: 2, target: 1 }
  ],
  matrix: (() => {
    const m = Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => Complex.zero())
    );
    for (let i = 0; i < 8; i++) m[i][i] = Complex.one();
    // Swap |101⟩ ↔ |110⟩
    m[5][5] = Complex.zero(); m[5][6] = Complex.one();
    m[6][6] = Complex.zero(); m[6][5] = Complex.one();
    return m;
  })()
};

// ─── Gate Palette Configuration (for UI) ─────────────────────────────

export const GATE_PALETTE = [
  {
    label: 'Standard',
    gates: ['H', 'CX', 'Y', 'Z', 'S', 'SDG', 'I', 'T', 'TDG']
  },
  {
    label: 'Rotation',
    gates: ['P', 'RX', 'RY', 'RZ', 'U']
  },
  {
    label: 'Multi-Qubit',
    gates: ['BARRIER', 'MEASURE', 'CZ', 'CP', 'CY', 'CH', 'CRX', 'CRY', 'CRZ', 'CU']
  },
  {
    label: 'Coupling',
    gates: ['RXX', 'RYY', 'RZZ']
  },
  {
    label: 'Advanced',
    gates: ['QFT', 'IQFT']
  },
  {
    label: 'Extra',
    gates: ['SX', 'CCX', 'CSWAP', 'SWAP', 'RESET', 'X', 'MCX']
  }
];

// Special non-gate operations
export const OPERATIONS = {
  MEASURE: { name: 'MEASURE', label: '↗', qubits: 1, category: 'operation', color: '#f97316', description: 'Measurement. Collapses the qubit into |0⟩ or |1⟩ and stores the classical result. Irreversible operation.', decomposition: null },
  BARRIER: { name: 'BARRIER', label: '⋮', qubits: 'all', category: 'operation', color: '#6b7280', description: 'Barrier. Visual separator that prevents circuit optimization from reordering gates across it. No physical effect.', decomposition: null },
  RESET: { name: 'RESET', label: '|0⟩', qubits: 1, category: 'operation', color: '#64748b', description: 'Reset. Forces a qubit back to the |0⟩ state regardless of its current state. Used for mid-circuit reset.', decomposition: null },
  QFT: { name: 'QFT', label: 'QFT', qubits: 'all', category: 'advanced', color: '#10b981', description: 'Quantum Fourier Transform. Transforms computational basis states into frequency-domain superpositions. Core of Shor\'s algorithm and QPE.', decomposition: [{ gate: 'H', target: 0 }, { gate: 'CP', control: 1, target: 0, params: 'π/2' }, { gate: 'CP', control: 2, target: 0, params: 'π/4' }, { gate: 'H', target: 1 }, { gate: 'CP', control: 2, target: 1, params: 'π/2' }, { gate: 'H', target: 2 }, { gate: 'SWAP', targets: [0, 2] }] },
  IQFT: { name: 'IQFT', label: 'iQFT', qubits: 'all', category: 'advanced', color: '#10b981', description: 'Inverse Quantum Fourier Transform. Reverses the QFT operation. Used in the readout phase of QPE and related algorithms.', decomposition: [{ gate: 'SWAP', targets: [0, 2] }, { gate: 'H', target: 2 }, { gate: 'CP', control: 2, target: 1, params: '-π/2' }, { gate: 'H', target: 1 }, { gate: 'CP', control: 2, target: 0, params: '-π/4' }, { gate: 'CP', control: 1, target: 0, params: '-π/2' }, { gate: 'H', target: 0 }] },
  MCX: { name: 'MCX', label: 'MCX', qubits: 4, category: 'multi', color: '#10b981', description: 'Multi-controlled X gate. Flips the target qubit only when all control qubits are |1⟩. Generalization of the Toffoli gate.', decomposition: [{ gate: 'CCX', controls: [0, 1], target: 'ancilla' }, { gate: 'CCX', controls: ['ancilla', 2], target: 3 }, { gate: 'CCX', controls: [0, 1], target: 'ancilla' }] },
};

/**
 * Get a gate definition by name, creating parameterized gates with defaults
 */
export function getGate(name, params = {}) {
  if (GATES[name]) return GATES[name];
  if (OPERATIONS[name]) return OPERATIONS[name];

  switch (name) {
    case 'RX': return RX(params.theta ?? Math.PI);
    case 'RY': return RY(params.theta ?? Math.PI);
    case 'RZ': return RZ(params.theta ?? Math.PI);
    case 'P': return P(params.lambda ?? Math.PI);
    case 'U': return U(params.theta ?? 0, params.phi ?? 0, params.lambda ?? 0);
    case 'CP': return CP(params.theta ?? Math.PI);
    case 'CRX': return CRX(params.theta ?? Math.PI);
    case 'CRY': return CRY(params.theta ?? Math.PI);
    case 'CRZ': return CRZ(params.theta ?? Math.PI);
    case 'CU': return CU(params.theta ?? 0, params.phi ?? 0, params.lambda ?? 0);
    case 'RXX': return RXX(params.theta ?? Math.PI);
    case 'RYY': return RYY(params.theta ?? Math.PI);
    case 'RZZ': return RZZ(params.theta ?? Math.PI);
    default: return null;
  }
}
