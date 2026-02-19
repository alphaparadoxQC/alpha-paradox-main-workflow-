/**
 * Hardware backend definitions with coupling maps
 */

export interface HardwareBackend {
  id: string;
  name: string;
  qubitCount: number;
  couplingMap: [number, number][]; // bidirectional edges
  nativeGates: string[];
  description: string;
}

export const HARDWARE_BACKENDS: HardwareBackend[] = [
  {
    id: 'tcg-crest-5',
    name: 'TCG CREST 5-Qubit',
    qubitCount: 5,
    couplingMap: [[0,1],[1,0],[1,2],[2,1],[2,3],[3,2],[3,4],[4,3]],
    nativeGates: ['Rz', 'SX', 'CNOT'],
    description: 'Linear topology: 0─1─2─3─4',
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
  },
  {
    id: 'ibm-heavy-hex-27',
    name: 'IBM Heavy-Hex 27-Qubit',
    qubitCount: 27,
    couplingMap: [
      // Simplified heavy-hex subset
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
  },
];
