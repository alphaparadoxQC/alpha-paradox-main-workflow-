/**
 * Hardware backend definitions with coupling maps and specs
 */

export interface QubitSpec {
  t1: number; // microseconds
  t2: number; // microseconds
  readoutError: number; // 0-1
  gateFidelity: number; // 0-1
}

export interface HardwareBackend {
  id: string;
  name: string;
  qubitCount: number;
  couplingMap: [number, number][]; // bidirectional edges
  nativeGates: string[];
  description: string;
  category: 'hardware' | 'simulator' | 'custom';
  qubitSpecs?: QubitSpec[];
  avgT1?: number;
  avgT2?: number;
  avgGateFidelity?: number;
  avgReadoutError?: number;
  singleQubitGateTime?: number; // nanoseconds
  twoQubitGateTime?: number; // nanoseconds
}

export const HARDWARE_BACKENDS: HardwareBackend[] = [
  {
    id: 'tcg-crest-5',
    name: 'TCG CREST 5-Qubit',
    qubitCount: 5,
    couplingMap: [[0,1],[1,0],[1,2],[2,1],[2,3],[3,2],[3,4],[4,3]],
    nativeGates: ['Rz', 'SX', 'CNOT'],
    description: 'Linear topology: 0─1─2─3─4',
    category: 'hardware',
    avgT1: 80,
    avgT2: 60,
    avgGateFidelity: 0.995,
    avgReadoutError: 0.015,
    singleQubitGateTime: 35,
    twoQubitGateTime: 300,
    qubitSpecs: [
      { t1: 85, t2: 62, readoutError: 0.012, gateFidelity: 0.996 },
      { t1: 78, t2: 58, readoutError: 0.018, gateFidelity: 0.994 },
      { t1: 82, t2: 61, readoutError: 0.014, gateFidelity: 0.995 },
      { t1: 76, t2: 55, readoutError: 0.016, gateFidelity: 0.993 },
      { t1: 80, t2: 60, readoutError: 0.015, gateFidelity: 0.997 },
    ],
  },
  {
    id: 'generic-7',
    name: 'Generic 7-Qubit (T-shape)',
    qubitCount: 7,
    couplingMap: [
      [0,1],[1,0],[1,2],[2,1],[2,3],[3,2],
      [1,4],[4,1],[4,5],[5,4],[4,6],[6,4],
    ],
    nativeGates: ['Rz', 'SX', 'CNOT'],
    description: 'T-shape: 0─1─2─3 with 1─4─5 and 4─6',
    category: 'hardware',
    avgT1: 100,
    avgT2: 75,
    avgGateFidelity: 0.993,
    avgReadoutError: 0.02,
    singleQubitGateTime: 30,
    twoQubitGateTime: 250,
    qubitSpecs: [
      { t1: 105, t2: 78, readoutError: 0.019, gateFidelity: 0.994 },
      { t1: 98, t2: 72, readoutError: 0.021, gateFidelity: 0.992 },
      { t1: 102, t2: 76, readoutError: 0.018, gateFidelity: 0.994 },
      { t1: 95, t2: 70, readoutError: 0.022, gateFidelity: 0.991 },
      { t1: 100, t2: 75, readoutError: 0.020, gateFidelity: 0.993 },
      { t1: 103, t2: 77, readoutError: 0.019, gateFidelity: 0.995 },
      { t1: 97, t2: 73, readoutError: 0.021, gateFidelity: 0.992 },
    ],
  },
  {
    id: 'ibm-heavy-hex-27',
    name: 'IBM Heavy-Hex 27-Qubit',
    qubitCount: 27,
    couplingMap: [
      [0,1],[1,0],[1,2],[2,1],[2,3],[3,2],[3,4],[4,3],
      [4,5],[5,4],[5,6],[6,5],[6,7],[7,6],[7,8],[8,7],
      [0,9],[9,0],[2,10],[10,2],[4,11],[11,4],[6,12],[12,6],[8,13],[13,8],
      [9,14],[14,9],[10,14],[14,10],[10,15],[15,10],[11,15],[15,11],
      [11,16],[16,11],[12,16],[16,12],[12,17],[17,12],[13,17],[17,13],
      [14,18],[18,14],[15,19],[19,15],[16,20],[20,16],[17,21],[21,17],
      [18,19],[19,18],[19,20],[20,19],[20,21],[21,20],
      [18,22],[22,18],[20,23],[23,20],
      [22,23],[23,22],[23,24],[24,23],[24,25],[25,24],[25,26],[26,25],
    ],
    nativeGates: ['Rz', 'SX', 'CNOT'],
    description: 'IBM-style heavy-hex lattice (27 qubits)',
    category: 'hardware',
    avgT1: 120,
    avgT2: 90,
    avgGateFidelity: 0.998,
    avgReadoutError: 0.01,
    singleQubitGateTime: 25,
    twoQubitGateTime: 200,
  },
  {
    id: 'simulator',
    name: 'Ideal Simulator',
    qubitCount: 32,
    couplingMap: [], // all-to-all
    nativeGates: ['H', 'X', 'Y', 'Z', 'S', 'T', 'Rx', 'Ry', 'Rz', 'CNOT', 'CZ', 'SWAP', 'CCX'],
    description: 'All-to-all connectivity, no noise',
    category: 'simulator',
    avgGateFidelity: 1.0,
    avgReadoutError: 0,
  },
];

/**
 * Create a custom backend from user-defined params
 */
export function createCustomBackend(
  name: string,
  qubitCount: number,
  couplingMap: [number, number][],
  nativeGates: string[],
): HardwareBackend {
  return {
    id: 'custom',
    name,
    qubitCount,
    couplingMap,
    nativeGates,
    description: `Custom ${qubitCount}-qubit backend`,
    category: 'custom',
  };
}
