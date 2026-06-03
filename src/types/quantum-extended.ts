/**
 * ============================================================
 * EXTENDED QUANTUM GATE TYPES
 * ============================================================
 * Comprehensive gate type definitions including:
 * - Standard gates (H, X, Y, Z, S, T)
 * - Parametric gates (Rx, Ry, Rz, U1, U2, U3)
 * - Two-qubit gates (CNOT, SWAP, CZ, iSWAP, etc.)
 * - Multi-controlled gates (CCX, CSWAP, MCX)
 * - Classical operations (Measure, Reset, Barrier)
 * - Custom oracles (QFT, IQFT, Grover, etc.)
 * ============================================================
 */

// Gate categories for organization in the palette
export type GateCategory = 
  | 'standard'      // Basic single-qubit gates
  | 'parametric'    // Rotation/phase gates with angle parameters
  | 'twoQubit'      // Two-qubit entangling gates
  | 'multiControl'  // Multi-controlled operations
  | 'classical'     // Classical operations (measure, reset)
  | 'oracle'        // Custom quantum oracles
  | 'utility'       // Utility gates (barrier, identity)
  | 'displays';     // Visual state analyzers

// Extended gate type union
export type ExtendedGateType = 
  // Standard single-qubit gates
  | 'H'       // Hadamard
  | 'X'       // Pauli-X (NOT)
  | 'Y'       // Pauli-Y
  | 'Z'       // Pauli-Z
  | 'S'       // Phase gate (√Z)
  | 'Sdg'     // S-dagger (S†)
  | 'T'       // T gate (π/8)
  | 'Tdg'     // T-dagger (T†)
  | 'SX'      // √X gate
  | 'SXdg'    // √X dagger
  
  // Parametric rotation gates
  | 'Rx'      // X-axis rotation
  | 'Ry'      // Y-axis rotation
  | 'Rz'      // Z-axis rotation
  | 'P'       // Phase gate P(θ) = Rz(θ)
  | 'U1'      // U1(λ) gate
  | 'U2'      // U2(φ, λ) gate
  | 'U3'      // Universal U3(θ, φ, λ) gate
  | 'RXX'     // XX rotation (parametric)
  | 'RYY'     // YY rotation (parametric)
  | 'RZZ'     // ZZ rotation (parametric)
  
  // Two-qubit gates
  | 'CNOT'    // Controlled-NOT (CX)
  | 'CY'      // Controlled-Y
  | 'CZ'      // Controlled-Z
  | 'CH'      // Controlled-Hadamard
  | 'SWAP'    // Swap
  | 'iSWAP'   // iSWAP
  | 'SQSWAP'  // √SWAP
  | 'DCX'     // Double CNOT
  | 'ECR'     // Echoed cross-resonance
  | 'CP'      // Controlled-Phase
  | 'CRx'     // Controlled Rx
  | 'CRy'     // Controlled Ry
  | 'CRz'     // Controlled Rz
  
  // Multi-controlled gates
  | 'CCX'     // Toffoli (CCNOT)
  | 'CCZ'     // Controlled-CZ
  | 'CSWAP'   // Fredkin (Controlled-SWAP)
  | 'C3X'     // 3-controlled X
  | 'C4X'     // 4-controlled X
  | 'MCX'     // Multi-controlled X
  | 'MCZ'     // Multi-controlled Z
  | 'MCRY'    // Multi-controlled Ry
  
  // Classical operations
  | 'M'       // Measurement
  | 'Reset'   // Reset to |0⟩
  | 'Barrier' // Barrier (no-op, for visualization)
  | 'I'       // Identity (wait/delay)
  
  // Custom oracles
  | 'QFT'     // Quantum Fourier Transform
  | 'IQFT'    // Inverse QFT
  | 'Grover'  // Grover diffusion operator
  | 'Oracle'  // Custom oracle (user-defined)
  | 'UnitaryBox' // User-defined unitary
  
  // Displays
  | 'DISPLAY'; // Phase disk amplitude display

// Extended gate interface with additional properties
export interface ExtendedQuantumGate {
  id: string;
  type: ExtendedGateType;
  qubit: number;
  position: number;
  
  // Control/target qubits
  controlQubit?: number;
  controlQubit2?: number;
  controlQubits?: number[]; // For multi-controlled gates
  targetQubit?: number;
  targetQubits?: number[]; // For multi-target gates
  
  // Parameters
  angle?: number;         // θ for rotation gates
  phi?: number;           // φ for U2/U3
  lambda?: number;        // λ for U1/U2/U3
  
  // Custom oracle matrix (for Oracle gate)
  customMatrix?: number[][];
  oracleName?: string;
  
  // Display properties
  label?: string;         // Custom label for display
  color?: string;         // Custom color override
}

// Extended gate info with category
export interface ExtendedGateInfo {
  type: ExtendedGateType;
  name: string;
  description: string;
  color: string;
  symbol: string;
  category: GateCategory;
  parameterCount: number;
  qubitCount: number;      // Number of qubits this gate operates on
  isParametric: boolean;
  defaultParams?: {
    angle?: number;
    phi?: number;
    lambda?: number;
  };
}

/**
 * ============================================================
 * COMPREHENSIVE GATE INFORMATION
 * ============================================================
 */
export const EXTENDED_GATE_INFO: Record<ExtendedGateType, ExtendedGateInfo> = {
  // Standard single-qubit gates
  H: {
    type: 'H',
    name: 'Hadamard',
    description: 'Creates equal superposition',
    color: 'hsl(185, 100%, 50%)',
    symbol: 'H',
    category: 'standard',
    parameterCount: 0,
    qubitCount: 1,
    isParametric: false,
  },
  X: {
    type: 'X',
    name: 'Pauli-X',
    description: 'Bit flip (NOT gate)',
    color: 'hsl(330, 100%, 65%)',
    symbol: 'X',
    category: 'standard',
    parameterCount: 0,
    qubitCount: 1,
    isParametric: false,
  },
  Y: {
    type: 'Y',
    name: 'Pauli-Y',
    description: 'Y rotation (bit + phase flip)',
    color: 'hsl(45, 100%, 55%)',
    symbol: 'Y',
    category: 'standard',
    parameterCount: 0,
    qubitCount: 1,
    isParametric: false,
  },
  Z: {
    type: 'Z',
    name: 'Pauli-Z',
    description: 'Phase flip',
    color: 'hsl(160, 100%, 45%)',
    symbol: 'Z',
    category: 'standard',
    parameterCount: 0,
    qubitCount: 1,
    isParametric: false,
  },
  S: {
    type: 'S',
    name: 'S Gate',
    description: 'π/2 phase rotation (√Z)',
    color: 'hsl(199, 89%, 48%)',
    symbol: 'S',
    category: 'standard',
    parameterCount: 0,
    qubitCount: 1,
    isParametric: false,
  },
  Sdg: {
    type: 'Sdg',
    name: 'S†',
    description: 'S-dagger (-π/2 phase)',
    color: 'hsl(199, 70%, 40%)',
    symbol: 'S†',
    category: 'standard',
    parameterCount: 0,
    qubitCount: 1,
    isParametric: false,
  },
  T: {
    type: 'T',
    name: 'T Gate',
    description: 'π/4 phase rotation',
    color: 'hsl(280, 80%, 60%)',
    symbol: 'T',
    category: 'standard',
    parameterCount: 0,
    qubitCount: 1,
    isParametric: false,
  },
  Tdg: {
    type: 'Tdg',
    name: 'T†',
    description: 'T-dagger (-π/4 phase)',
    color: 'hsl(280, 60%, 45%)',
    symbol: 'T†',
    category: 'standard',
    parameterCount: 0,
    qubitCount: 1,
    isParametric: false,
  },
  SX: {
    type: 'SX',
    name: '√X',
    description: 'Square root of X gate',
    color: 'hsl(330, 80%, 55%)',
    symbol: '√X',
    category: 'standard',
    parameterCount: 0,
    qubitCount: 1,
    isParametric: false,
  },
  SXdg: {
    type: 'SXdg',
    name: '√X†',
    description: 'Square root of X dagger',
    color: 'hsl(330, 60%, 45%)',
    symbol: '√X†',
    category: 'standard',
    parameterCount: 0,
    qubitCount: 1,
    isParametric: false,
  },
  
  // Parametric rotation gates
  Rx: {
    type: 'Rx',
    name: 'Rx',
    description: 'X-axis rotation by θ',
    color: 'hsl(0, 85%, 60%)',
    symbol: 'Rx',
    category: 'parametric',
    parameterCount: 1,
    qubitCount: 1,
    isParametric: true,
    defaultParams: { angle: Math.PI / 2 },
  },
  Ry: {
    type: 'Ry',
    name: 'Ry',
    description: 'Y-axis rotation by θ',
    color: 'hsl(120, 70%, 50%)',
    symbol: 'Ry',
    category: 'parametric',
    parameterCount: 1,
    qubitCount: 1,
    isParametric: true,
    defaultParams: { angle: Math.PI / 2 },
  },
  Rz: {
    type: 'Rz',
    name: 'Rz',
    description: 'Z-axis rotation by θ',
    color: 'hsl(240, 80%, 60%)',
    symbol: 'Rz',
    category: 'parametric',
    parameterCount: 1,
    qubitCount: 1,
    isParametric: true,
    defaultParams: { angle: Math.PI / 2 },
  },
  P: {
    type: 'P',
    name: 'Phase Disk',
    description: 'Phase Disk P(θ)',
    color: 'hsl(260, 75%, 55%)',
    symbol: 'P',
    category: 'parametric',
    parameterCount: 1,
    qubitCount: 1,
    isParametric: true,
    defaultParams: { angle: Math.PI / 4 },
  },
  U1: {
    type: 'U1',
    name: 'U1',
    description: 'Single-parameter unitary U1(λ)',
    color: 'hsl(300, 70%, 55%)',
    symbol: 'U1',
    category: 'parametric',
    parameterCount: 1,
    qubitCount: 1,
    isParametric: true,
    defaultParams: { lambda: Math.PI / 4 },
  },
  U2: {
    type: 'U2',
    name: 'U2',
    description: 'Two-parameter unitary U2(φ,λ)',
    color: 'hsl(310, 70%, 55%)',
    symbol: 'U2',
    category: 'parametric',
    parameterCount: 2,
    qubitCount: 1,
    isParametric: true,
    defaultParams: { phi: 0, lambda: Math.PI },
  },
  U3: {
    type: 'U3',
    name: 'U3',
    description: 'Universal single-qubit gate U3(θ,φ,λ)',
    color: 'hsl(320, 70%, 55%)',
    symbol: 'U3',
    category: 'parametric',
    parameterCount: 3,
    qubitCount: 1,
    isParametric: true,
    defaultParams: { angle: Math.PI / 2, phi: 0, lambda: Math.PI },
  },
  RXX: {
    type: 'RXX',
    name: 'RXX',
    description: 'XX rotation (two-qubit)',
    color: 'hsl(0, 70%, 50%)',
    symbol: 'RXX',
    category: 'parametric',
    parameterCount: 1,
    qubitCount: 2,
    isParametric: true,
    defaultParams: { angle: Math.PI / 2 },
  },
  RYY: {
    type: 'RYY',
    name: 'RYY',
    description: 'YY rotation (two-qubit)',
    color: 'hsl(120, 60%, 45%)',
    symbol: 'RYY',
    category: 'parametric',
    parameterCount: 1,
    qubitCount: 2,
    isParametric: true,
    defaultParams: { angle: Math.PI / 2 },
  },
  RZZ: {
    type: 'RZZ',
    name: 'RZZ',
    description: 'ZZ rotation (two-qubit)',
    color: 'hsl(240, 60%, 50%)',
    symbol: 'RZZ',
    category: 'parametric',
    parameterCount: 1,
    qubitCount: 2,
    isParametric: true,
    defaultParams: { angle: Math.PI / 2 },
  },
  
  // Two-qubit gates
  CNOT: {
    type: 'CNOT',
    name: 'CNOT',
    description: 'Controlled NOT (CX)',
    color: 'hsl(265, 100%, 65%)',
    symbol: '⊕',
    category: 'twoQubit',
    parameterCount: 0,
    qubitCount: 2,
    isParametric: false,
  },
  CY: {
    type: 'CY',
    name: 'CY',
    description: 'Controlled Y',
    color: 'hsl(55, 90%, 50%)',
    symbol: 'CY',
    category: 'twoQubit',
    parameterCount: 0,
    qubitCount: 2,
    isParametric: false,
  },
  CZ: {
    type: 'CZ',
    name: 'CZ',
    description: 'Controlled Z (phase flip)',
    color: 'hsl(120, 70%, 45%)',
    symbol: 'CZ',
    category: 'twoQubit',
    parameterCount: 0,
    qubitCount: 2,
    isParametric: false,
  },
  CH: {
    type: 'CH',
    name: 'CH',
    description: 'Controlled Hadamard',
    color: 'hsl(185, 80%, 45%)',
    symbol: 'CH',
    category: 'twoQubit',
    parameterCount: 0,
    qubitCount: 2,
    isParametric: false,
  },
  SWAP: {
    type: 'SWAP',
    name: 'SWAP',
    description: 'Swap two qubits',
    color: 'hsl(25, 100%, 55%)',
    symbol: '×',
    category: 'twoQubit',
    parameterCount: 0,
    qubitCount: 2,
    isParametric: false,
  },
  iSWAP: {
    type: 'iSWAP',
    name: 'iSWAP',
    description: 'iSWAP gate',
    color: 'hsl(35, 90%, 50%)',
    symbol: 'iS',
    category: 'twoQubit',
    parameterCount: 0,
    qubitCount: 2,
    isParametric: false,
  },
  SQSWAP: {
    type: 'SQSWAP',
    name: '√SWAP',
    description: 'Square root of SWAP',
    color: 'hsl(30, 85%, 50%)',
    symbol: '√×',
    category: 'twoQubit',
    parameterCount: 0,
    qubitCount: 2,
    isParametric: false,
  },
  DCX: {
    type: 'DCX',
    name: 'DCX',
    description: 'Double CNOT',
    color: 'hsl(270, 80%, 60%)',
    symbol: 'DCX',
    category: 'twoQubit',
    parameterCount: 0,
    qubitCount: 2,
    isParametric: false,
  },
  ECR: {
    type: 'ECR',
    name: 'ECR',
    description: 'Echoed cross-resonance',
    color: 'hsl(290, 70%, 55%)',
    symbol: 'ECR',
    category: 'twoQubit',
    parameterCount: 0,
    qubitCount: 2,
    isParametric: false,
  },
  CP: {
    type: 'CP',
    name: 'Ctrl Phase Disk',
    description: 'Controlled Phase Disk',
    color: 'hsl(260, 65%, 55%)',
    symbol: 'CP',
    category: 'twoQubit',
    parameterCount: 1,
    qubitCount: 2,
    isParametric: true,
    defaultParams: { angle: Math.PI / 4 },
  },
  CRx: {
    type: 'CRx',
    name: 'CRx',
    description: 'Controlled Rx',
    color: 'hsl(0, 70%, 55%)',
    symbol: 'CRx',
    category: 'twoQubit',
    parameterCount: 1,
    qubitCount: 2,
    isParametric: true,
    defaultParams: { angle: Math.PI / 2 },
  },
  CRy: {
    type: 'CRy',
    name: 'CRy',
    description: 'Controlled Ry',
    color: 'hsl(120, 60%, 50%)',
    symbol: 'CRy',
    category: 'twoQubit',
    parameterCount: 1,
    qubitCount: 2,
    isParametric: true,
    defaultParams: { angle: Math.PI / 2 },
  },
  CRz: {
    type: 'CRz',
    name: 'CRz',
    description: 'Controlled Rz',
    color: 'hsl(240, 70%, 55%)',
    symbol: 'CRz',
    category: 'twoQubit',
    parameterCount: 1,
    qubitCount: 2,
    isParametric: true,
    defaultParams: { angle: Math.PI / 2 },
  },
  
  // Multi-controlled gates
  CCX: {
    type: 'CCX',
    name: 'Toffoli',
    description: 'Double-controlled NOT (CCNOT)',
    color: 'hsl(350, 80%, 55%)',
    symbol: 'CCX',
    category: 'multiControl',
    parameterCount: 0,
    qubitCount: 3,
    isParametric: false,
  },
  CCZ: {
    type: 'CCZ',
    name: 'CCZ',
    description: 'Double-controlled Z',
    color: 'hsl(150, 70%, 45%)',
    symbol: 'CCZ',
    category: 'multiControl',
    parameterCount: 0,
    qubitCount: 3,
    isParametric: false,
  },
  CSWAP: {
    type: 'CSWAP',
    name: 'Fredkin',
    description: 'Controlled SWAP (Fredkin)',
    color: 'hsl(40, 90%, 50%)',
    symbol: 'CSW',
    category: 'multiControl',
    parameterCount: 0,
    qubitCount: 3,
    isParametric: false,
  },
  C3X: {
    type: 'C3X',
    name: 'C3X',
    description: '3-controlled X gate',
    color: 'hsl(355, 75%, 50%)',
    symbol: 'C3X',
    category: 'multiControl',
    parameterCount: 0,
    qubitCount: 4,
    isParametric: false,
  },
  C4X: {
    type: 'C4X',
    name: 'C4X',
    description: '4-controlled X gate',
    color: 'hsl(360, 70%, 50%)',
    symbol: 'C4X',
    category: 'multiControl',
    parameterCount: 0,
    qubitCount: 5,
    isParametric: false,
  },
  MCX: {
    type: 'MCX',
    name: 'MCX',
    description: 'Multi-controlled X (n controls)',
    color: 'hsl(5, 80%, 55%)',
    symbol: 'MCX',
    category: 'multiControl',
    parameterCount: 0,
    qubitCount: 2, // Minimum, actual depends on controls
    isParametric: false,
  },
  MCZ: {
    type: 'MCZ',
    name: 'MCZ',
    description: 'Multi-controlled Z (n controls)',
    color: 'hsl(155, 65%, 45%)',
    symbol: 'MCZ',
    category: 'multiControl',
    parameterCount: 0,
    qubitCount: 2,
    isParametric: false,
  },
  MCRY: {
    type: 'MCRY',
    name: 'MCRY',
    description: 'Multi-controlled Ry',
    color: 'hsl(125, 60%, 50%)',
    symbol: 'MCRY',
    category: 'multiControl',
    parameterCount: 1,
    qubitCount: 2,
    isParametric: true,
    defaultParams: { angle: Math.PI / 2 },
  },
  
  // Classical operations
  M: {
    type: 'M',
    name: 'Measure',
    description: 'Measurement in Z basis',
    color: 'hsl(0, 0%, 70%)',
    symbol: 'M',
    category: 'classical',
    parameterCount: 0,
    qubitCount: 1,
    isParametric: false,
  },
  Reset: {
    type: 'Reset',
    name: 'Reset',
    description: 'Reset qubit to |0⟩',
    color: 'hsl(0, 0%, 50%)',
    symbol: '|0⟩',
    category: 'classical',
    parameterCount: 0,
    qubitCount: 1,
    isParametric: false,
  },
  Barrier: {
    type: 'Barrier',
    name: 'Barrier',
    description: 'Prevents gate reordering',
    color: 'hsl(0, 0%, 40%)',
    symbol: '║',
    category: 'classical',
    parameterCount: 0,
    qubitCount: 1,
    isParametric: false,
  },
  I: {
    type: 'I',
    name: 'Identity',
    description: 'Identity (no operation)',
    color: 'hsl(0, 0%, 60%)',
    symbol: 'I',
    category: 'utility',
    parameterCount: 0,
    qubitCount: 1,
    isParametric: false,
  },
  
  // Custom oracles
  QFT: {
    type: 'QFT',
    name: 'QFT',
    description: 'Quantum Fourier Transform',
    color: 'hsl(200, 90%, 55%)',
    symbol: 'QFT',
    category: 'oracle',
    parameterCount: 0,
    qubitCount: 1, // Applies to multiple
    isParametric: false,
  },
  IQFT: {
    type: 'IQFT',
    name: 'IQFT',
    description: 'Inverse QFT',
    color: 'hsl(200, 70%, 45%)',
    symbol: 'IQFT',
    category: 'oracle',
    parameterCount: 0,
    qubitCount: 1,
    isParametric: false,
  },
  Grover: {
    type: 'Grover',
    name: 'Grover',
    description: 'Grover diffusion operator',
    color: 'hsl(50, 90%, 50%)',
    symbol: 'G',
    category: 'oracle',
    parameterCount: 0,
    qubitCount: 1,
    isParametric: false,
  },
  Oracle: {
    type: 'Oracle',
    name: 'Oracle',
    description: 'Custom oracle (user-defined)',
    color: 'hsl(180, 70%, 50%)',
    symbol: 'Uf',
    category: 'oracle',
    parameterCount: 0,
    qubitCount: 1,
    isParametric: false,
  },
  UnitaryBox: {
    type: 'UnitaryBox',
    name: 'Unitary',
    description: 'Custom unitary matrix',
    color: 'hsl(270, 60%, 55%)',
    symbol: 'U',
    category: 'oracle',
    parameterCount: 0,
    qubitCount: 1,
    isParametric: false,
  },
  
  // Displays
  DISPLAY: {
    type: 'DISPLAY',
    name: 'Amplitude Display',
    description: 'Phase Disk Amplitude Display',
    color: 'hsl(210, 100%, 60%)',
    symbol: 'Display',
    category: 'displays',
    parameterCount: 0,
    qubitCount: 1,
    isParametric: false,
  },
};

// Get gates by category
export const getGatesByCategory = (category: GateCategory): ExtendedGateType[] => {
  return (Object.keys(EXTENDED_GATE_INFO) as ExtendedGateType[])
    .filter(key => EXTENDED_GATE_INFO[key].category === category);
};

// Category display info
export const GATE_CATEGORIES: { id: GateCategory; name: string; description: string }[] = [
  { id: 'standard', name: 'Standard', description: 'Basic single-qubit gates' },
  { id: 'parametric', name: 'Parametric', description: 'Rotation gates with angles' },
  { id: 'twoQubit', name: 'Two-Qubit', description: 'Entangling gates' },
  { id: 'displays', name: 'Displays', description: 'Visual state analyzers' },
  { id: 'multiControl', name: 'Multi-Control', description: 'Multi-controlled operations' },
  { id: 'classical', name: 'Classical', description: 'Measurement and reset' },
  { id: 'oracle', name: 'Oracles', description: 'Custom quantum oracles' },
];
