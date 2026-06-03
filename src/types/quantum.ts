export type GateType = 
  | 'H'      // Hadamard
  | 'X'      // Pauli-X
  | 'Y'      // Pauli-Y
  | 'Z'      // Pauli-Z
  | 'CNOT'   // Controlled NOT
  | 'SWAP'   // Swap
  | 'S'      // Phase
  | 'T'      // T gate (π/8)
  | 'CZ'     // Controlled-Z
  | 'CCX'    // Toffoli (CCX)
   | 'M'     // Measure
   | 'Rx'    // Rotation around X-axis (parametric)
   | 'Ry'    // Rotation around Y-axis (parametric)
   | 'Rz'    // Rotation around Z-axis (parametric)
   | 'Sdg'   // S-dagger (S†)
   | 'S†'    // S-dagger (alias)
   | 'Tdg'   // T-dagger (T†)
   | 'T†'    // T-dagger (alias)
   | 'SX'    // √X gate
   | 'SXdg'  // √X-dagger (SX†)
   | 'SX†'   // √X-dagger (alias)
   | 'P'     // Phase gate (parametric)
   | 'DISPLAY' // Phase Disk Amplitude Display
   | 'FUSED';  // Compiler-fused gate (multiple gates collapsed into one matrix)

export interface QuantumGate {
  id: string;
  type: GateType;
  qubit: number;
  position: number;
  controlQubit?: number; // For CNOT
  targetQubit?: number;  // For SWAP
  controlQubit2?: number; // For Toffoli (second control)
   angle?: number; // For rotation gates (Rx, Ry, Rz) - angle in radians
   fusedMatrix?: [[{re: number; im: number}, {re: number; im: number}], [{re: number; im: number}, {re: number; im: number}]]; // For compiler-fused gates
}

export interface CircuitState {
  gates: QuantumGate[];
  qubitCount: number;
}

export interface SimulationResult {
  probabilities: { state: string; probability: number }[];
  blochVectors: { x: number; y: number; z: number }[];
  stateVector?: any; // Using any for now to avoid circular dependency or import the type
  isEntangled?: boolean;
  entangledPairs?: [number, number][];
  amplitudes?: { state: string; re: number; im: number; magnitude: number; phase: number }[];
  circuitDepth?: number;
  hasMeasurement?: boolean;
  displays?: Record<string, { x: number; y: number; z: number }>;
  gpuAccelerated?: boolean;
  metadata?: {
    top1000Mass: number;
    isSampled: boolean;
    totalShots?: number;
    isExact: boolean;
    backendName: string;
    classification?: string;
  };
}

export interface GateInfo {
  type: GateType;
  name: string;
  description: string;
  color: string;
  symbol: string;
}

export const GATE_INFO: Record<GateType, GateInfo> = {
  H: {
    type: 'H',
    name: 'Hadamard',
    description: 'Creates superposition',
    color: 'hsl(185, 100%, 50%)',
    symbol: 'H',
  },
  X: {
    type: 'X',
    name: 'Pauli-X',
    description: 'Bit flip (NOT gate)',
    color: 'hsl(330, 100%, 65%)',
    symbol: 'X',
  },
  Y: {
    type: 'Y',
    name: 'Pauli-Y',
    description: 'Y rotation',
    color: 'hsl(45, 100%, 55%)',
    symbol: 'Y',
  },
  Z: {
    type: 'Z',
    name: 'Pauli-Z',
    description: 'Phase flip',
    color: 'hsl(160, 100%, 45%)',
    symbol: 'Z',
  },
  CNOT: {
    type: 'CNOT',
    name: 'CNOT',
    description: 'Controlled NOT',
    color: 'hsl(265, 100%, 65%)',
    symbol: '⊕',
  },
  SWAP: {
    type: 'SWAP',
    name: 'SWAP',
    description: 'Swap two qubits',
    color: 'hsl(25, 100%, 55%)',
    symbol: '×',
  },
  S: {
    type: 'S',
    name: 'Phase',
    description: 'S gate (π/2 phase)',
    color: 'hsl(199, 89%, 48%)',
    symbol: 'S',
  },
  M: {
    type: 'M',
    name: 'Measure',
    description: 'Measurement',
    color: 'hsl(0, 0%, 70%)',
    symbol: 'M',
  },
  T: {
    type: 'T',
    name: 'T Gate',
    description: 'π/8 phase rotation',
    color: 'hsl(280, 80%, 60%)',
    symbol: 'T',
  },
  CZ: {
    type: 'CZ',
    name: 'Controlled-Z',
    description: 'Controlled phase flip',
    color: 'hsl(120, 70%, 45%)',
    symbol: 'CZ',
  },
  CCX: {
    type: 'CCX',
    name: 'Toffoli',
    description: 'CCX (double control)',
    color: 'hsl(350, 80%, 55%)',
    symbol: 'CCX',
  },
   // ============================================================
   // ROTATION GATES (Parametric)
   // These gates rotate the qubit state around the specified axis
   // by a user-configurable angle (in radians).
   // Default angle is π/2 but can be adjusted via the Properties dialog.
   // ============================================================
   Rx: {
     type: 'Rx',
     name: 'Rx Rotation',
     description: 'Rotation around X-axis',
     color: 'hsl(0, 85%, 60%)',
     symbol: 'Rx',
   },
   Ry: {
     type: 'Ry',
     name: 'Ry Rotation',
     description: 'Rotation around Y-axis',
     color: 'hsl(120, 70%, 50%)',
     symbol: 'Ry',
   },
   Rz: {
     type: 'Rz',
     name: 'Rz Rotation',
     description: 'Rotation around Z-axis',
     color: 'hsl(240, 80%, 60%)',
     symbol: 'Rz',
   },
   P: {
     type: 'P',
     name: 'Phase',
     description: 'Phase rotation',
     color: 'hsl(199, 89%, 48%)',
     symbol: 'P',
   },
   Sdg: {
     type: 'Sdg',
     name: 'S-dagger',
     description: 'Inverse S gate',
     color: 'hsl(199, 89%, 38%)',
     symbol: 'S†',
   },
   'S†': {
     type: 'S†',
     name: 'S-dagger',
     description: 'Inverse S gate',
     color: 'hsl(199, 89%, 38%)',
     symbol: 'S†',
   },
   Tdg: {
     type: 'Tdg',
     name: 'T-dagger',
     description: 'Inverse T gate',
     color: 'hsl(280, 80%, 50%)',
     symbol: 'T†',
   },
   'T†': {
     type: 'T†',
     name: 'T-dagger',
     description: 'Inverse T gate',
     color: 'hsl(280, 80%, 50%)',
     symbol: 'T†',
   },
   SX: {
     type: 'SX',
     name: 'SX',
     description: 'Square root of X',
     color: 'hsl(330, 100%, 55%)',
     symbol: '√X',
   },
   SXdg: {
     type: 'SXdg',
     name: 'SX-dagger',
     description: 'Inverse SX gate',
     color: 'hsl(330, 100%, 45%)',
     symbol: '√X†',
   },
   'SX†': {
     type: 'SX†',
     name: 'SX-dagger',
     description: 'Inverse SX gate',
     color: 'hsl(330, 100%, 45%)',
     symbol: '√X†',
   },
   DISPLAY: {
     type: 'DISPLAY',
     name: 'Amplitude Display',
     description: 'Phase Disk Amplitude Display',
     color: 'hsl(210, 100%, 60%)',
     symbol: 'Display',
   },
   FUSED: {
     type: 'FUSED',
     name: 'Fused Gate',
     description: 'Compiler-optimized fused gate operation',
     color: 'hsl(50, 90%, 55%)',
     symbol: 'F',
   },
};
