// Molecule data for quantum chemistry simulations

export interface Atom {
  symbol: string;
  position: [number, number, number];
  color: string;
  radius: number;
}

export interface Bond {
  atom1Index: number;
  atom2Index: number;
  order: 1 | 2 | 3;
  length: number; // in Angstroms
}

export interface MoleculeData {
  id: string;
  name: string;
  formula: string;
  /** Canonical SMILES — drives the RDKit/3Dmol viewer for accurate 3D structure. */
  smiles?: string;
  atoms: Atom[];
  bonds: Bond[];
  angles: { atoms: [number, number, number]; value: number }[];
  electrons: number;
  expectedGroundStateEnergy: number; // in Hartrees
  orbitals: OrbitalInfo[];
  qubitsRequired: number;
  vqeDepth: number;
}

export interface OrbitalInfo {
  name: string;
  energy: number; // in eV
  electrons: number;
  type: 'bonding' | 'antibonding' | 'nonbonding';
}

// Atomic colors and radii
const ATOM_PROPS: Record<string, { color: string; radius: number }> = {
  H: { color: '#FFFFFF', radius: 0.31 },
  Li: { color: '#CC80FF', radius: 1.28 },
  Be: { color: '#C2FF00', radius: 0.96 },
  B: { color: '#FFB5B5', radius: 0.84 },
  C: { color: '#909090', radius: 0.76 },
  N: { color: '#3050F8', radius: 0.71 },
  O: { color: '#FF0D0D', radius: 0.66 },
};

export const MOLECULES: MoleculeData[] = [
  {
    id: 'h2',
    name: 'Hydrogen',
    formula: 'H₂',
    smiles: '[H][H]',
    atoms: [
      { symbol: 'H', position: [-0.37, 0, 0], ...ATOM_PROPS.H },
      { symbol: 'H', position: [0.37, 0, 0], ...ATOM_PROPS.H },
    ],
    bonds: [{ atom1Index: 0, atom2Index: 1, order: 1, length: 0.74 }],
    angles: [],
    electrons: 2,
    expectedGroundStateEnergy: -1.137,
    orbitals: [
      { name: 'σ1s', energy: -15.43, electrons: 2, type: 'bonding' },
      { name: 'σ*1s', energy: 4.76, electrons: 0, type: 'antibonding' },
    ],
    qubitsRequired: 4,
    vqeDepth: 2,
  },
  {
    id: 'lih',
    name: 'Lithium Hydride',
    formula: 'LiH',
    smiles: '[LiH]',
    atoms: [
      { symbol: 'Li', position: [-0.80, 0, 0], ...ATOM_PROPS.Li },
      { symbol: 'H', position: [0.80, 0, 0], ...ATOM_PROPS.H },
    ],
    bonds: [{ atom1Index: 0, atom2Index: 1, order: 1, length: 1.60 }],
    angles: [],
    electrons: 4,
    expectedGroundStateEnergy: -7.979,
    orbitals: [
      { name: '1σ', energy: -67.4, electrons: 2, type: 'bonding' },
      { name: '2σ', energy: -8.0, electrons: 2, type: 'bonding' },
      { name: '3σ*', energy: 2.5, electrons: 0, type: 'antibonding' },
    ],
    qubitsRequired: 6,
    vqeDepth: 4,
  },
  {
    id: 'h2o',
    name: 'Water',
    formula: 'H₂O',
    smiles: 'O',
    atoms: [
      { symbol: 'O', position: [0, 0.12, 0], ...ATOM_PROPS.O },
      { symbol: 'H', position: [-0.76, -0.48, 0], ...ATOM_PROPS.H },
      { symbol: 'H', position: [0.76, -0.48, 0], ...ATOM_PROPS.H },
    ],
    bonds: [
      { atom1Index: 0, atom2Index: 1, order: 1, length: 0.96 },
      { atom1Index: 0, atom2Index: 2, order: 1, length: 0.96 },
    ],
    angles: [{ atoms: [1, 0, 2], value: 104.5 }],
    electrons: 10,
    expectedGroundStateEnergy: -76.438,
    orbitals: [
      { name: '1a₁', energy: -559.5, electrons: 2, type: 'bonding' },
      { name: '2a₁', energy: -36.8, electrons: 2, type: 'bonding' },
      { name: '1b₂', energy: -19.5, electrons: 2, type: 'bonding' },
      { name: '3a₁', energy: -15.6, electrons: 2, type: 'nonbonding' },
      { name: '1b₁', energy: -13.8, electrons: 2, type: 'nonbonding' },
      { name: '4a₁*', energy: 4.2, electrons: 0, type: 'antibonding' },
    ],
    qubitsRequired: 14,
    vqeDepth: 8,
  },
  {
    id: 'beh2',
    name: 'Beryllium Hydride',
    formula: 'BeH₂',
    smiles: '[BeH2]',
    atoms: [
      { symbol: 'Be', position: [0, 0, 0], ...ATOM_PROPS.Be },
      { symbol: 'H', position: [-1.33, 0, 0], ...ATOM_PROPS.H },
      { symbol: 'H', position: [1.33, 0, 0], ...ATOM_PROPS.H },
    ],
    bonds: [
      { atom1Index: 0, atom2Index: 1, order: 1, length: 1.33 },
      { atom1Index: 0, atom2Index: 2, order: 1, length: 1.33 },
    ],
    angles: [{ atoms: [1, 0, 2], value: 180.0 }],
    electrons: 6,
    expectedGroundStateEnergy: -15.835,
    orbitals: [
      { name: '1σg', energy: -128.7, electrons: 2, type: 'bonding' },
      { name: '2σg', energy: -11.3, electrons: 2, type: 'bonding' },
      { name: '1σu', energy: -8.2, electrons: 2, type: 'bonding' },
      { name: '3σg*', energy: 3.1, electrons: 0, type: 'antibonding' },
    ],
    qubitsRequired: 8,
    vqeDepth: 5,
  },
  {
    id: 'nh3',
    name: 'Ammonia',
    formula: 'NH₃',
    smiles: 'N',
    atoms: [
      { symbol: 'N', position: [0, 0.11, 0], ...ATOM_PROPS.N },
      { symbol: 'H', position: [0, -0.47, 0.94], ...ATOM_PROPS.H },
      { symbol: 'H', position: [0.81, -0.47, -0.47], ...ATOM_PROPS.H },
      { symbol: 'H', position: [-0.81, -0.47, -0.47], ...ATOM_PROPS.H },
    ],
    bonds: [
      { atom1Index: 0, atom2Index: 1, order: 1, length: 1.01 },
      { atom1Index: 0, atom2Index: 2, order: 1, length: 1.01 },
      { atom1Index: 0, atom2Index: 3, order: 1, length: 1.01 },
    ],
    angles: [
      { atoms: [1, 0, 2], value: 107.8 },
      { atoms: [2, 0, 3], value: 107.8 },
      { atoms: [1, 0, 3], value: 107.8 },
    ],
    electrons: 10,
    expectedGroundStateEnergy: -56.563,
    orbitals: [
      { name: '1a₁', energy: -422.5, electrons: 2, type: 'bonding' },
      { name: '2a₁', energy: -30.6, electrons: 2, type: 'bonding' },
      { name: '1e', energy: -17.1, electrons: 4, type: 'bonding' },
      { name: '3a₁', energy: -11.0, electrons: 2, type: 'nonbonding' },
      { name: '4a₁*', energy: 4.8, electrons: 0, type: 'antibonding' },
    ],
    qubitsRequired: 12,
    vqeDepth: 7,
  },
];

export function getMoleculeById(id: string): MoleculeData | undefined {
  return MOLECULES.find(m => m.id === id);
}
