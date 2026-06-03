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

export interface ActiveSpace {
  activeElectrons: number;
  activeOrbitals: number;
  frozenCore: number;
  description: string;
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
  /** Molecular charge (default: 0 for neutral) */
  charge?: number;
  /** Spin multiplicity (default: 1 for singlet) */
  multiplicity?: number;
  /** Active space definition for VQE */
  activeSpace?: ActiveSpace;
  /**
   * If true, `expectedGroundStateEnergy` is a heuristic estimate
   * (e.g. for custom molecules) and should not be treated as a
   * validated reference value.
   */
  isEnergyEstimated?: boolean;
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
  Bk: { color: '#8A2BE2', radius: 1.70 }, // Actinide color/radius approximation
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
    charge: 0,
    multiplicity: 1,
    activeSpace: { activeElectrons: 2, activeOrbitals: 2, frozenCore: 0, description: 'Full space CAS(2,2)' },
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
    charge: 0,
    multiplicity: 1,
    activeSpace: { activeElectrons: 2, activeOrbitals: 3, frozenCore: 1, description: 'CAS(2,3) — Li 1s frozen' },
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
    qubitsRequired: 8, // Active space approximation (frozen core)
    vqeDepth: 8,
    charge: 0,
    multiplicity: 1,
    activeSpace: { activeElectrons: 6, activeOrbitals: 4, frozenCore: 1, description: 'CAS(6,4) — O 1s frozen' },
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
    charge: 0,
    multiplicity: 1,
    activeSpace: { activeElectrons: 4, activeOrbitals: 4, frozenCore: 1, description: 'CAS(4,4) — Be 1s frozen' },
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
    qubitsRequired: 8, // Active space approximation (frozen core)
    vqeDepth: 7,
    charge: 0,
    multiplicity: 1,
    activeSpace: { activeElectrons: 6, activeOrbitals: 4, frozenCore: 2, description: 'CAS(6,4) — N 1s,2s frozen' },
  },
  {
    id: 'h2bk',
    name: 'Berkelium Dihydride',
    formula: 'H₂Bk',
    smiles: '[BkH2]',
    atoms: [
      { symbol: 'Bk', position: [0, 0, 0], ...ATOM_PROPS.Bk },
      { symbol: 'H', position: [-1.9, 0, 0], ...ATOM_PROPS.H },
      { symbol: 'H', position: [1.9, 0, 0], ...ATOM_PROPS.H },
    ],
    bonds: [
      { atom1Index: 0, atom2Index: 1, order: 1, length: 1.9 },
      { atom1Index: 0, atom2Index: 2, order: 1, length: 1.9 },
    ],
    angles: [{ atoms: [1, 0, 2], value: 180.0 }],
    electrons: 99, // Bk has 97, H has 1 each. 99 total.
    expectedGroundStateEnergy: -27532.1, // Approximate large core energy for Bk
    orbitals: [
      { name: '5f', energy: -8.2, electrons: 8, type: 'nonbonding' },
      { name: '6d', energy: -4.1, electrons: 1, type: 'bonding' },
      { name: '7s', energy: -5.0, electrons: 2, type: 'bonding' },
      { name: 'LUMO+', energy: -2.1, electrons: 0, type: 'antibonding' },
    ],
    qubitsRequired: 8, // Active space approximation CAS(4,8)
    vqeDepth: 10,
    charge: 0,
    multiplicity: 1,
    activeSpace: { activeElectrons: 4, activeOrbitals: 4, frozenCore: 47, description: 'CAS(4,4) — large frozen core' },
    isEnergyEstimated: true,
  },
];

export function getMoleculeById(id: string): MoleculeData | undefined {
  return MOLECULES.find(m => m.id === id);
}
