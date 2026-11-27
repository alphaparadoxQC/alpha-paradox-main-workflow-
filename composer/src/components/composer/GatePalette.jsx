import { useState } from 'react';
import { useCircuitStore } from '../../stores/circuitStore';

// Rich Quantum Gate Definitions with CAD-grade vector icons and physics metadata
export const GATE_DEFINITIONS = {
  // ── Standard Single-Qubit Gates ──────────────────────────────────────────
  'H': {
    id: 'H',
    internal: 'H',
    label: 'H',
    symbol: 'H',
    fullName: 'Hadamard Gate',
    formula: '|0⟩ → (|0⟩+|1⟩)/√2,  |1⟩ → (|0⟩−|1⟩)/√2',
    description: 'Creates an equal superposition. Core transformation for quantum parallelism.',
    category: 'standard',
    color: '#f43f5e',
    gradient: 'linear-gradient(145deg, #fb7185 0%, #e11d48 100%)',
    glow: 'rgba(225, 29, 72, 0.45)',
    textColor: '#ffffff',
  },
  'X': {
    id: 'X',
    internal: 'X',
    label: 'X',
    symbol: (
      <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
        <circle cx="10" cy="10" r="7.5" />
        <line x1="10" y1="2.5" x2="10" y2="17.5" />
        <line x1="2.5" y1="10" x2="17.5" y2="10" />
      </svg>
    ),
    fullName: 'Pauli-X (NOT / Bit-Flip)',
    formula: '|0⟩ ↔ |1⟩  (π rotation around X)',
    description: 'Flips the computational basis state. Quantum equivalent of the classical NOT gate.',
    category: 'standard',
    color: '#f43f5e',
    gradient: 'linear-gradient(145deg, #fb7185 0%, #e11d48 100%)',
    glow: 'rgba(225, 29, 72, 0.45)',
    textColor: '#ffffff',
  },
  'Y': {
    id: 'Y',
    internal: 'Y',
    label: 'Y',
    symbol: 'Y',
    fullName: 'Pauli-Y Gate',
    formula: '|0⟩ → i|1⟩,  |1⟩ → −i|0⟩',
    description: 'Combined bit and phase flip. 180° rotation around the Bloch Y-axis.',
    category: 'standard',
    color: '#f43f5e',
    gradient: 'linear-gradient(145deg, #fb7185 0%, #e11d48 100%)',
    glow: 'rgba(225, 29, 72, 0.45)',
    textColor: '#ffffff',
  },
  'Z': {
    id: 'Z',
    internal: 'Z',
    label: 'Z',
    symbol: 'Z',
    fullName: 'Pauli-Z (Phase-Flip)',
    formula: '|1⟩ → −|1⟩,  |0⟩ → |0⟩',
    description: 'Flips relative phase by π (180°). Leaves ground state |0⟩ unchanged.',
    category: 'standard',
    color: '#f43f5e',
    gradient: 'linear-gradient(145deg, #fb7185 0%, #e11d48 100%)',
    glow: 'rgba(225, 29, 72, 0.45)',
    textColor: '#ffffff',
  },
  'S': {
    id: 'S',
    internal: 'S',
    label: 'S',
    symbol: 'S',
    fullName: 'Phase Gate (S / √Z)',
    formula: '|1⟩ → i|1⟩  (π/2 phase shift)',
    description: 'Quarter turn phase shift. Two S gates equal one Pauli-Z gate.',
    category: 'standard',
    color: '#f43f5e',
    gradient: 'linear-gradient(145deg, #fb7185 0%, #e11d48 100%)',
    glow: 'rgba(225, 29, 72, 0.45)',
    textColor: '#ffffff',
  },
  'SDG': {
    id: 'SDG',
    internal: 'SDG',
    label: 'S†',
    symbol: (
      <span>S<sup style={{ fontSize: '0.65em', top: '-0.35em', position: 'relative' }}>†</sup></span>
    ),
    fullName: 'S-Dagger Gate (S†)',
    formula: '|1⟩ → −i|1⟩  (−π/2 phase shift)',
    description: 'Inverse phase shift (−π/2 radians). S† × S = I (Identity).',
    category: 'standard',
    color: '#f43f5e',
    gradient: 'linear-gradient(145deg, #fb7185 0%, #e11d48 100%)',
    glow: 'rgba(225, 29, 72, 0.45)',
    textColor: '#ffffff',
  },
  'I': {
    id: 'I',
    internal: 'I',
    label: 'I',
    symbol: 'I',
    fullName: 'Identity (Idle)',
    formula: '|ψ⟩ → |ψ⟩',
    description: 'Leaves the qubit state unchanged for one clock cycle.',
    category: 'standard',
    color: '#f43f5e',
    gradient: 'linear-gradient(145deg, #fb7185 0%, #e11d48 100%)',
    glow: 'rgba(225, 29, 72, 0.45)',
    textColor: '#ffffff',
  },
  'T': {
    id: 'T',
    internal: 'T',
    label: 'T',
    symbol: 'T',
    fullName: 'T Gate (π/8 / √S)',
    formula: '|1⟩ → e^(iπ/4)|1⟩',
    description: 'Eighth-turn phase shift (π/4 radians). Essential for universal fault-tolerant computation.',
    category: 'standard',
    color: '#f43f5e',
    gradient: 'linear-gradient(145deg, #fb7185 0%, #e11d48 100%)',
    glow: 'rgba(225, 29, 72, 0.45)',
    textColor: '#ffffff',
  },
  'TDG': {
    id: 'TDG',
    internal: 'TDG',
    label: 'T†',
    symbol: (
      <span>T<sup style={{ fontSize: '0.65em', top: '-0.35em', position: 'relative' }}>†</sup></span>
    ),
    fullName: 'T-Dagger Gate (T†)',
    formula: '|1⟩ → e^(−iπ/4)|1⟩',
    description: 'Inverse T gate (−π/4 radians phase shift). T† × T = I.',
    category: 'standard',
    color: '#f43f5e',
    gradient: 'linear-gradient(145deg, #fb7185 0%, #e11d48 100%)',
    glow: 'rgba(225, 29, 72, 0.45)',
    textColor: '#ffffff',
  },
  'P': {
    id: 'P',
    internal: 'P',
    label: 'P',
    symbol: 'P',
    fullName: 'Phase Gate P(λ)',
    formula: '|1⟩ → e^(iλ)|1⟩',
    description: 'Arbitrary angle phase shift around the Z-axis.',
    category: 'standard',
    color: '#f43f5e',
    gradient: 'linear-gradient(145deg, #fb7185 0%, #e11d48 100%)',
    glow: 'rgba(225, 29, 72, 0.45)',
    textColor: '#ffffff',
  },
  'RX': {
    id: 'RX',
    internal: 'RX',
    label: 'RX',
    symbol: (
      <span>R<sub style={{ fontSize: '0.62em', bottom: '-0.25em', position: 'relative' }}>X</sub></span>
    ),
    fullName: 'Rotation RX(θ)',
    formula: 'exp(−i θ X / 2)',
    description: 'Continuous rotation by angle θ around the Bloch X-axis.',
    category: 'standard',
    color: '#f43f5e',
    gradient: 'linear-gradient(145deg, #fb7185 0%, #e11d48 100%)',
    glow: 'rgba(225, 29, 72, 0.45)',
    textColor: '#ffffff',
  },
  'RY': {
    id: 'RY',
    internal: 'RY',
    label: 'RY',
    symbol: (
      <span>R<sub style={{ fontSize: '0.62em', bottom: '-0.25em', position: 'relative' }}>Y</sub></span>
    ),
    fullName: 'Rotation RY(θ)',
    formula: 'exp(−i θ Y / 2)',
    description: 'Continuous rotation by angle θ around the Bloch Y-axis.',
    category: 'standard',
    color: '#f43f5e',
    gradient: 'linear-gradient(145deg, #fb7185 0%, #e11d48 100%)',
    glow: 'rgba(225, 29, 72, 0.45)',
    textColor: '#ffffff',
  },
  'RZ': {
    id: 'RZ',
    internal: 'RZ',
    label: 'RZ',
    symbol: (
      <span>R<sub style={{ fontSize: '0.62em', bottom: '-0.25em', position: 'relative' }}>Z</sub></span>
    ),
    fullName: 'Rotation RZ(θ)',
    formula: 'exp(−i θ Z / 2)',
    description: 'Continuous rotation by angle θ around the Bloch Z-axis.',
    category: 'standard',
    color: '#f43f5e',
    gradient: 'linear-gradient(145deg, #fb7185 0%, #e11d48 100%)',
    glow: 'rgba(225, 29, 72, 0.45)',
    textColor: '#ffffff',
  },
  'U': {
    id: 'U',
    internal: 'U',
    label: 'U',
    symbol: 'U',
    fullName: 'Universal Gate U(θ,φ,λ)',
    formula: 'General SU(2) 3-Euler angle parameterization',
    description: 'Arbitrary single-qubit unitary gate with 3 rotation angles.',
    category: 'standard',
    color: '#f43f5e',
    gradient: 'linear-gradient(145deg, #fb7185 0%, #e11d48 100%)',
    glow: 'rgba(225, 29, 72, 0.45)',
    textColor: '#ffffff',
  },

  // ── Multi-Qubit / Controlled Gates ───────────────────────────────────────
  'SWAP': {
    id: 'SWAP',
    internal: 'SWAP',
    label: 'SWAP',
    symbol: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 6.5l2.5-2.5L9.5 6.5" />
        <path d="M7 4v9.5" />
        <path d="M15.5 13.5l-2.5 2.5L10.5 13.5" />
        <path d="M13 16V6.5" />
      </svg>
    ),
    fullName: 'SWAP Gate',
    formula: '|a, b⟩ → |b, a⟩',
    description: 'Exchanges the quantum states of two qubits. Decomposed into 3 CNOT gates.',
    category: 'multi',
    color: '#3b82f6',
    gradient: 'linear-gradient(145deg, #38bdf8 0%, #1d4ed8 100%)',
    glow: 'rgba(29, 78, 216, 0.45)',
    textColor: '#ffffff',
  },
  'CSWAP': {
    id: 'CSWAP',
    internal: 'CSWAP',
    label: 'CSWAP',
    symbol: (
      <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="10" cy="4" r="2.2" fill="currentColor" stroke="none" />
        <line x1="10" y1="6.5" x2="10" y2="10.5" strokeDasharray="1.5 1.5" />
        <line x1="6" y1="12.5" x2="14" y2="16.5" />
        <line x1="14" y1="12.5" x2="6" y2="16.5" />
      </svg>
    ),
    fullName: 'Fredkin Gate (CSWAP)',
    formula: '|1, a, b⟩ → |1, b, a⟩',
    description: 'Controlled SWAP: swaps two target qubits only when control qubit is |1⟩.',
    category: 'multi',
    color: '#3b82f6',
    gradient: 'linear-gradient(145deg, #38bdf8 0%, #1d4ed8 100%)',
    glow: 'rgba(29, 78, 216, 0.45)',
    textColor: '#ffffff',
  },
  'CZ': {
    id: 'CZ',
    internal: 'CZ',
    label: 'CZ',
    symbol: 'CZ',
    fullName: 'Controlled-Z Gate',
    formula: '|11⟩ → −|11⟩',
    description: 'Applies phase flip when both qubits are in |1⟩ state. Symmetric entangling gate.',
    category: 'multi',
    color: '#3b82f6',
    gradient: 'linear-gradient(145deg, #38bdf8 0%, #1d4ed8 100%)',
    glow: 'rgba(29, 78, 216, 0.45)',
    textColor: '#ffffff',
  },
  'CP': {
    id: 'CP',
    internal: 'CP',
    label: 'CP',
    symbol: 'CP',
    fullName: 'Controlled-Phase CP(θ)',
    formula: '|11⟩ → e^(iθ)|11⟩',
    description: 'Applies relative phase shift θ to |11⟩. Core component of QFT.',
    category: 'multi',
    color: '#3b82f6',
    gradient: 'linear-gradient(145deg, #38bdf8 0%, #1d4ed8 100%)',
    glow: 'rgba(29, 78, 216, 0.45)',
    textColor: '#ffffff',
  },
  'CY': {
    id: 'CY',
    internal: 'CY',
    label: 'CY',
    symbol: 'CY',
    fullName: 'Controlled-Y Gate',
    formula: '|1, ψ⟩ → |1, Yψ⟩',
    description: 'Applies Pauli-Y gate to the target qubit when control is |1⟩.',
    category: 'multi',
    color: '#3b82f6',
    gradient: 'linear-gradient(145deg, #38bdf8 0%, #1d4ed8 100%)',
    glow: 'rgba(29, 78, 216, 0.45)',
    textColor: '#ffffff',
  },
  'CH': {
    id: 'CH',
    internal: 'CH',
    label: 'CH',
    symbol: 'CH',
    fullName: 'Controlled-Hadamard',
    formula: '|1, ψ⟩ → |1, Hψ⟩',
    description: 'Applies Hadamard superposition to target when control is |1⟩.',
    category: 'multi',
    color: '#3b82f6',
    gradient: 'linear-gradient(145deg, #38bdf8 0%, #1d4ed8 100%)',
    glow: 'rgba(29, 78, 216, 0.45)',
    textColor: '#ffffff',
  },
  'CRX': {
    id: 'CRX',
    internal: 'CRX',
    label: 'CRX',
    symbol: 'CRX',
    fullName: 'Controlled-RX(θ)',
    formula: '|1, ψ⟩ → |1, RX(θ)ψ⟩',
    description: 'Rotates target around X-axis when control qubit is |1⟩.',
    category: 'multi',
    color: '#3b82f6',
    gradient: 'linear-gradient(145deg, #38bdf8 0%, #1d4ed8 100%)',
    glow: 'rgba(29, 78, 216, 0.45)',
    textColor: '#ffffff',
  },
  'CRY': {
    id: 'CRY',
    internal: 'CRY',
    label: 'CRY',
    symbol: 'CRY',
    fullName: 'Controlled-RY(θ)',
    formula: '|1, ψ⟩ → |1, RY(θ)ψ⟩',
    description: 'Rotates target around Y-axis when control qubit is |1⟩.',
    category: 'multi',
    color: '#3b82f6',
    gradient: 'linear-gradient(145deg, #38bdf8 0%, #1d4ed8 100%)',
    glow: 'rgba(29, 78, 216, 0.45)',
    textColor: '#ffffff',
  },
  'CRZ': {
    id: 'CRZ',
    internal: 'CRZ',
    label: 'CRZ',
    symbol: 'CRZ',
    fullName: 'Controlled-RZ(θ)',
    formula: '|1, ψ⟩ → |1, RZ(θ)ψ⟩',
    description: 'Rotates target around Z-axis when control qubit is |1⟩.',
    category: 'multi',
    color: '#3b82f6',
    gradient: 'linear-gradient(145deg, #38bdf8 0%, #1d4ed8 100%)',
    glow: 'rgba(29, 78, 216, 0.45)',
    textColor: '#ffffff',
  },
  'CU': {
    id: 'CU',
    internal: 'CU',
    label: 'CU',
    symbol: 'CU',
    fullName: 'Controlled-Universal CU(θ,φ,λ)',
    formula: '|1, ψ⟩ → |1, Uψ⟩',
    description: 'General controlled-unitary operation with 3 Euler rotation parameters.',
    category: 'multi',
    color: '#3b82f6',
    gradient: 'linear-gradient(145deg, #38bdf8 0%, #1d4ed8 100%)',
    glow: 'rgba(29, 78, 216, 0.45)',
    textColor: '#ffffff',
  },

  // ── Operations & Readout ──────────────────────────────────────────────────
  'MEASURE': {
    id: 'MEASURE',
    internal: 'MEASURE',
    label: 'Measure',
    symbol: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.5 17a8.5 8.5 0 0 1 17 0" />
        <line x1="12" y1="17" x2="16.5" y2="8.5" />
        <circle cx="12" cy="17" r="1.5" fill="currentColor" />
        <text x="17" y="10" fontSize="8" strokeWidth="0.4" fill="currentColor" fontWeight="bold" fontFamily="monospace">z</text>
      </svg>
    ),
    fullName: 'Quantum Measurement',
    formula: 'Computational basis projection {|0⟩, |1⟩}',
    description: 'Collapses qubit wavefunction into a classical bit (0 or 1) and writes to classical register.',
    category: 'operation',
    color: '#64748b',
    gradient: 'linear-gradient(145deg, #475569 0%, #1e293b 100%)',
    glow: 'rgba(100, 116, 139, 0.45)',
    textColor: '#ffffff',
  },
  'BARRIER': {
    id: 'BARRIER',
    internal: 'BARRIER',
    label: 'Barrier',
    symbol: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
        <line x1="10" y1="3" x2="10" y2="17" strokeDasharray="2.5 2.5" />
        <line x1="6" y1="3" x2="14" y2="3" />
        <line x1="6" y1="17" x2="14" y2="17" />
      </svg>
    ),
    fullName: 'Circuit Barrier',
    formula: 'Compiler boundary & visual delimiter',
    description: 'Prevents compiler reordering and optimization across this execution slice.',
    category: 'operation',
    color: '#64748b',
    gradient: 'linear-gradient(145deg, #475569 0%, #1e293b 100%)',
    glow: 'rgba(100, 116, 139, 0.45)',
    textColor: '#ffffff',
  },
  'RESET': {
    id: 'RESET',
    internal: 'RESET',
    label: '|0⟩',
    symbol: '|0⟩',
    fullName: 'State Reset (|0⟩)',
    formula: '|ψ⟩ → |0⟩',
    description: 'Forces qubit state back to ground state |0⟩ unconditionally for mid-circuit reuse.',
    category: 'operation',
    color: '#64748b',
    gradient: 'linear-gradient(145deg, #475569 0%, #1e293b 100%)',
    glow: 'rgba(100, 116, 139, 0.45)',
    textColor: '#ffffff',
  },

  // ── Two-Qubit Coupling (Ising) ────────────────────────────────────────────
  'RXX': {
    id: 'RXX',
    internal: 'RXX',
    label: 'RXX',
    symbol: 'RXX',
    fullName: 'Ising Coupling RXX(θ)',
    formula: 'exp(−i θ X⊗X / 2)',
    description: 'Two-qubit transverse Ising interaction. Native entangling gate on trapped-ion architectures.',
    category: 'coupling',
    color: '#ec4899',
    gradient: 'linear-gradient(145deg, #f472b6 0%, #c026d3 100%)',
    glow: 'rgba(236, 72, 153, 0.45)',
    textColor: '#ffffff',
  },
  'RYY': {
    id: 'RYY',
    internal: 'RYY',
    label: 'RYY',
    symbol: 'RYY',
    fullName: 'Ising Coupling RYY(θ)',
    formula: 'exp(−i θ Y⊗Y / 2)',
    description: 'Two-qubit Y-Y interaction gate.',
    category: 'coupling',
    color: '#ec4899',
    gradient: 'linear-gradient(145deg, #f472b6 0%, #c026d3 100%)',
    glow: 'rgba(236, 72, 153, 0.45)',
    textColor: '#ffffff',
  },
  'RZZ': {
    id: 'RZZ',
    internal: 'RZZ',
    label: 'RZZ',
    symbol: 'RZZ',
    fullName: 'Ising Coupling RZZ(θ)',
    formula: 'exp(−i θ Z⊗Z / 2)',
    description: 'Two-qubit longitudinal Ising coupling. Native cross-resonance on superconducting circuits.',
    category: 'coupling',
    color: '#ec4899',
    gradient: 'linear-gradient(145deg, #f472b6 0%, #c026d3 100%)',
    glow: 'rgba(236, 72, 153, 0.45)',
    textColor: '#ffffff',
  },

  // ── Advanced / Quantum Algorithms ─────────────────────────────────────────
  'QFT': {
    id: 'QFT',
    internal: 'QFT',
    label: 'QFT',
    symbol: 'QFT',
    fullName: 'Quantum Fourier Transform',
    formula: '|j⟩ → (1/√N) ∑ e^(2πijk/N)|k⟩',
    description: 'Transforms computational basis into frequency domain. Core subroutine of Shor algorithm and QPE.',
    category: 'advanced',
    color: '#10b981',
    gradient: 'linear-gradient(145deg, #34d399 0%, #059669 100%)',
    glow: 'rgba(16, 185, 129, 0.45)',
    textColor: '#ffffff',
  },
  'IQFT': {
    id: 'IQFT',
    internal: 'IQFT',
    label: 'iQFT',
    symbol: 'iQFT',
    fullName: 'Inverse QFT (iQFT)',
    formula: 'QFT† (Adjoint)',
    description: 'Inverse Fourier Transform for phase estimation readout and period finding.',
    category: 'advanced',
    color: '#10b981',
    gradient: 'linear-gradient(145deg, #34d399 0%, #059669 100%)',
    glow: 'rgba(16, 185, 129, 0.45)',
    textColor: '#ffffff',
  },
  'MCX': {
    id: 'MCX',
    internal: 'MCX',
    label: 'MCX',
    symbol: 'MCX',
    fullName: 'Multi-Controlled X',
    formula: 'Generalized Toffoli (CⁿX)',
    description: 'Flips target qubit only when all control qubits are |1⟩. Universal reversible gate.',
    category: 'advanced',
    color: '#10b981',
    gradient: 'linear-gradient(145deg, #34d399 0%, #059669 100%)',
    glow: 'rgba(16, 185, 129, 0.45)',
    textColor: '#ffffff',
  },
};

// Aliases mapping for backward compatibility
const ALIAS_MAP = {
  '⊕': 'X',
  'S†': 'SDG',
  'T†': 'TDG',
  '↗': 'MEASURE',
  '⋮': 'BARRIER',
  '|0⟩': 'RESET',
  '⇕': 'SWAP',
  '⤨': 'CSWAP',
  'iQFT': 'IQFT',
};

// Categorized groups rendered in the Dock Toolbar
const PALETTE_GROUPS = [
  {
    id: 'single',
    label: '1-Qubit',
    color: '#f43f5e',
    gates: ['H', 'X', 'Y', 'Z', 'S', 'SDG', 'I', 'T', 'TDG', 'P', 'RX', 'RY', 'RZ', 'U']
  },
  {
    id: 'multi',
    label: '2-Qubit',
    color: '#3b82f6',
    gates: ['SWAP', 'CSWAP', 'CZ', 'CP', 'CY', 'CH', 'CRX', 'CRY', 'CRZ', 'CU']
  },
  {
    id: 'ops',
    label: 'Operations',
    color: '#94a3b8',
    gates: ['MEASURE', 'BARRIER', 'RESET']
  },
  {
    id: 'coupling',
    label: 'Coupling',
    color: '#ec4899',
    gates: ['RXX', 'RYY', 'RZZ']
  },
  {
    id: 'advanced',
    label: 'Algorithms',
    color: '#10b981',
    gates: ['QFT', 'IQFT', 'MCX']
  }
];

// Compatibility UI resolver for CircuitCanvas, GateExpandModal, etc.
export const getGateUIParams = (internalName) => {
  const resolvedKey = ALIAS_MAP[internalName] || internalName;
  const def = GATE_DEFINITIONS[resolvedKey];
  if (def) {
    return {
      symbol: def.symbol,
      color: def.color,
      gradient: def.gradient,
      textColor: def.textColor || '#ffffff',
    };
  }

  // Fallbacks for special gates
  if (internalName === 'CX') {
    return {
      symbol: (
        <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
          <circle cx="10" cy="10" r="7.5" />
          <line x1="10" y1="2.5" x2="10" y2="17.5" />
          <line x1="2.5" y1="10" x2="17.5" y2="10" />
        </svg>
      ),
      color: '#3b82f6',
      textColor: '#ffffff',
    };
  }

  return {
    symbol: internalName,
    color: '#f43f5e',
    textColor: '#ffffff',
  };
};

export default function GatePalette() {
  const setDragging = useCircuitStore((state) => state.setDragging);
  const [hoveredGate, setHoveredGate] = useState(null);

  const handleDragStart = (e, gateKey) => {
    const def = GATE_DEFINITIONS[gateKey];
    const internalName = def ? def.internal : (ALIAS_MAP[gateKey] || gateKey);
    e.dataTransfer.setData('type', 'new_gate');
    e.dataTransfer.setData('gate', internalName);
    setDragging(true);
  };

  const handleDragEnd = () => {
    setDragging(false);
  };

  return (
    <div className="gate-palette-wrapper" style={{ position: 'relative' }}>
      <div className="gate-palette">
        {PALETTE_GROUPS.map((group) => (
          <div key={group.id} className="palette-category">
            {/* Category Header */}
            <div className="palette-category-header">
              <span
                className="palette-category-dot"
                style={{ backgroundColor: group.color, color: group.color }}
              />
              <span>{group.label}</span>
              {group.id === 'ops' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    useCircuitStore.getState().measureAll();
                  }}
                  title="1-Click: Add measurement to all qubits"
                  style={{
                    marginLeft: 'auto',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#38bdf8',
                    borderRadius: '3px',
                    fontSize: '0.58rem',
                    padding: '1px 5px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  All
                </button>
              )}
            </div>

            {/* Gate Tiles Row */}
            <div className="palette-category-gates">
              {group.gates.map((gateKey) => {
                const def = GATE_DEFINITIONS[gateKey];
                if (!def) return null;
                const isWide = def.label && def.label.length >= 3;

                return (
                  <div
                    key={gateKey}
                    className={`gate-tile ${isWide ? 'wide-gate' : ''}`}
                    style={{
                      background: def.gradient,
                      color: def.textColor || '#ffffff',
                      '--gate-glow': def.glow,
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, gateKey)}
                    onDragEnd={handleDragEnd}
                    onDoubleClick={() => {
                      if (gateKey === 'MEASURE') {
                        useCircuitStore.getState().measureAll();
                      }
                    }}
                    onMouseEnter={() => setHoveredGate(def)}
                    onMouseLeave={() => setHoveredGate(null)}
                    title={gateKey === 'MEASURE' ? `${def.fullName} — Drag to qubit or double-click to Measure All` : `${def.fullName} — ${def.description}`}
                  >
                    {def.symbol}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Tactical Gate HUD / Preview Tooltip */}
      {hoveredGate && (
        <div
          style={{
            position: 'absolute',
            bottom: '-34px',
            left: '12px',
            zIndex: 100,
            background: 'rgba(10, 14, 23, 0.94)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            borderRadius: '5px',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.68rem',
            color: '#e6edf3',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: hoveredGate.color,
              boxShadow: `0 0 8px ${hoveredGate.color}`,
            }}
          />
          <span style={{ fontWeight: 700, color: '#ffffff' }}>{hoveredGate.fullName}:</span>
          <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{hoveredGate.formula}</span>
          <span style={{ color: 'rgba(255, 255, 255, 0.45)', marginLeft: '4px' }}>| {hoveredGate.description}</span>
        </div>
      )}
    </div>
  );
}
