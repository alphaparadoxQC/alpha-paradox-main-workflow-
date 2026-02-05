export type GateType = 
  | 'H'      // Hadamard
  | 'X'      // Pauli-X
  | 'Y'      // Pauli-Y
  | 'Z'      // Pauli-Z
  | 'CNOT'   // Controlled NOT
  | 'SWAP'   // Swap
  | 'S'      // Phase
  | 'M';     // Measure

export interface QuantumGate {
  id: string;
  type: GateType;
  qubit: number;
  position: number;
  controlQubit?: number; // For CNOT
  targetQubit?: number;  // For SWAP
}

export interface CircuitState {
  gates: QuantumGate[];
  qubitCount: number;
}

export interface SimulationResult {
  probabilities: { state: string; probability: number }[];
  blochVectors: { x: number; y: number; z: number }[];
  isEntangled?: boolean;
  entangledPairs?: [number, number][];
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
};
