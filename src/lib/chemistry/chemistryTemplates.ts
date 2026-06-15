import { QuantumGate } from '@/types/quantum';
import { MoleculeData, OrbitalInfo } from './moleculeData';
import { generateUCCSDAnsatz, getUCCSDParameterCount } from './ansatz/uccsd';

export interface ChemistryTemplate {
  id: string;
  name: string;
  category: 'ground-state' | 'dissociation' | 'excited-state';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  molecule: MoleculeData;
  circuit: {
    qubits: number;
    gates: QuantumGate[];
    depth: number;
  };
  description: string;
  explanation: string[];
  expectedResults: {
    groundStateEnergy: number;
    energyUnit: 'Ha' | 'eV';
    accuracy: string;
    bondOrder?: number;
  };
  learningObjectives: string[];
  references: { title: string; url: string }[];
}

// Atom properties
const ATOM_PROPS = {
  H: { color: '#FFFFFF', radius: 0.31 },
  He: { color: '#D9FFFF', radius: 0.28 },
  Li: { color: '#CC80FF', radius: 1.28 },
  O: { color: '#FF0D0D', radius: 0.66 },
};

// HeH+ molecule data (not in main list)
const HeHPlusMolecule: MoleculeData = {
  id: 'heh_plus',
  name: 'Helium Hydride Ion',
  formula: 'HeH⁺',
  atoms: [
    { symbol: 'He', position: [-0.46, 0, 0], ...ATOM_PROPS.He },
    { symbol: 'H', position: [0.46, 0, 0], ...ATOM_PROPS.H },
  ],
  bonds: [{ atom1Index: 0, atom2Index: 1, order: 1, length: 0.77 }],
  angles: [],
  electrons: 2,
  expectedGroundStateEnergy: -2.862,
  orbitals: [
    { name: 'σ1s', energy: -54.4, electrons: 2, type: 'bonding' },
    { name: 'σ*1s', energy: 13.6, electrons: 0, type: 'antibonding' },
  ],
  qubitsRequired: 4,
  vqeDepth: 2,
};

/**
 * Generate UCCSD circuit for a molecule with preset parameters.
 * Each molecule gets structurally different gates because UCCSD uses
 * H, Rx, Rz, CNOT staircases whose connectivity follows the orbital
 * excitation indices (occupied → virtual).
 */
const generateMoleculeCircuit = (
  qubits: number,
  electrons: number,
  presetAngles?: number[]
): QuantumGate[] => {
  const paramCount = getUCCSDParameterCount(qubits, electrons);
  const params = presetAngles ?? Array.from({ length: paramCount }, (_, i) => 
    // Deterministic, physically motivated starting angles
    (i % 2 === 0 ? 1 : -1) * Math.PI / (4 + i * 0.3)
  );
  return generateUCCSDAnsatz(qubits, electrons, params);
};

// Calculate circuit depth from gates
const circuitDepth = (gates: QuantumGate[]): number => {
  return gates.reduce((max, g) => Math.max(max, g.position), 0) + 1;
};

// Generate H2 ground state circuit — UCCSD with 2 electrons, 4 qubits
const generateH2GroundStateCircuit = (): QuantumGate[] => {
  return generateMoleculeCircuit(4, 2);
};

// Generate H2 dissociation circuit — deeper UCCSD with stretched parameters
const generateH2DissociationCircuit = (): QuantumGate[] => {
  const paramCount = getUCCSDParameterCount(4, 2);
  // At stretched bond lengths, correlations are stronger → larger angles
  const params = Array.from({ length: paramCount }, (_, i) => 
    (i % 2 === 0 ? 1 : -1) * Math.PI / (3 + i * 0.2)
  );
  return generateUCCSDAnsatz(4, 2, params);
};

// Generate LiH ground state circuit — 4 electrons, 6 qubits
const generateLiHGroundStateCircuit = (): QuantumGate[] => {
  return generateMoleculeCircuit(6, 4);
};

// Generate HeH+ ground state circuit — 2 electrons, 4 qubits
const generateHeHPlusCircuit = (): QuantumGate[] => {
  // Same qubit/electron count as H2 but with different preset angles
  // reflecting the stronger He nuclear charge
  const paramCount = getUCCSDParameterCount(4, 2);
  const params = Array.from({ length: paramCount }, (_, i) => 
    (i % 2 === 0 ? 1 : -1) * Math.PI / (5 + i * 0.4)
  );
  return generateUCCSDAnsatz(4, 2, params);
};

// Generate Water (H2O) circuit — 6 active electrons, 8 active qubits
const generateWaterCircuit = (): QuantumGate[] => {
  // Use active space electrons (6) instead of total (10)
  return generateMoleculeCircuit(8, 6);
};


// Import molecule data
import { MOLECULES, getMoleculeById } from './moleculeData';

export const CHEMISTRY_TEMPLATES: ChemistryTemplate[] = [
  {
    id: 'h2-ground-state',
    name: 'H₂ Ground State',
    category: 'ground-state',
    difficulty: 'beginner',
    molecule: getMoleculeById('h2')!,
    circuit: {
      qubits: 4,
      gates: generateH2GroundStateCircuit(),
      depth: circuitDepth(generateH2GroundStateCircuit()),
    },
    description: 'Calculate the ground state energy of molecular hydrogen (H₂), the simplest neutral molecule.',
    explanation: [
      'Molecular hydrogen (H₂) is the simplest molecule, making it ideal for learning VQE.',
      'We use 4 qubits to represent the 2 molecular orbitals (σ and σ*) with spin.',
      'The Hartree-Fock reference state |0011⟩ represents 2 electrons in the bonding orbital.',
      'Variational rotations and entangling gates capture electron correlation.',
    ],
    expectedResults: {
      groundStateEnergy: -1.137,
      energyUnit: 'Ha',
      accuracy: '±0.01 Ha (chemical accuracy)',
      bondOrder: 1,
    },
    learningObjectives: [
      'Understand molecular orbital theory basics',
      'Learn how qubits map to spin-orbitals',
      'See how VQE finds ground state energy',
    ],
    references: [
      { title: 'VQE for H₂', url: 'https://arxiv.org/abs/1304.3061' },
      { title: 'Molecular Hydrogen', url: 'https://en.wikipedia.org/wiki/Hydrogen_molecule' },
    ],
  },
  {
    id: 'h2-dissociation',
    name: 'H₂ Dissociation Curve',
    category: 'dissociation',
    difficulty: 'intermediate',
    molecule: getMoleculeById('h2')!,
    circuit: {
      qubits: 4,
      gates: generateH2DissociationCircuit(),
      depth: circuitDepth(generateH2DissociationCircuit()),
    },
    description: 'Study how H₂ energy changes as the bond stretches, a key test for quantum chemistry methods.',
    explanation: [
      'As H-H bond stretches, the molecule approaches dissociation into two H atoms.',
      'Classical methods (like Hartree-Fock) fail at large bond lengths due to static correlation.',
      'VQE with a deeper ansatz can capture this correlation throughout the curve.',
      'The dissociation limit should approach 2× the energy of a hydrogen atom (-1.0 Ha).',
    ],
    expectedResults: {
      groundStateEnergy: -1.137,
      energyUnit: 'Ha',
      accuracy: 'Varies with bond length',
    },
    learningObjectives: [
      'Understand bond breaking in quantum chemistry',
      'Learn about static vs dynamic correlation',
      'See where classical methods fail',
    ],
    references: [
      { title: 'Dissociation Curves', url: 'https://en.wikipedia.org/wiki/Potential_energy_surface' },
      { title: 'Static Correlation', url: 'https://en.wikipedia.org/wiki/Electron_correlation' },
    ],
  },
  {
    id: 'lih-ground-state',
    name: 'LiH Ground State',
    category: 'ground-state',
    difficulty: 'intermediate',
    molecule: getMoleculeById('lih')!,
    circuit: {
      qubits: 6,
      gates: generateLiHGroundStateCircuit(),
      depth: circuitDepth(generateLiHGroundStateCircuit()),
    },
    description: 'Calculate the ground state of lithium hydride, a polar molecule with ionic character.',
    explanation: [
      'LiH has 4 electrons: 2 in the Li 1s core and 2 in the Li-H bond.',
      'The bond has significant ionic character (Li⁺H⁻).',
      '6 qubits are used to represent the active molecular orbitals.',
      'A deeper ansatz is needed compared to H₂ due to more complex correlations.',
    ],
    expectedResults: {
      groundStateEnergy: -7.979,
      energyUnit: 'Ha',
      accuracy: '±0.02 Ha',
      bondOrder: 1,
    },
    learningObjectives: [
      'Study molecules with core electrons',
      'Understand ionic vs covalent bonding',
      'Learn about active space selection',
    ],
    references: [
      { title: 'LiH in VQE', url: 'https://arxiv.org/abs/1512.06860' },
      { title: 'Lithium Hydride', url: 'https://en.wikipedia.org/wiki/Lithium_hydride' },
    ],
  },
  {
    id: 'heh-plus-ground-state',
    name: 'HeH⁺ Ground State',
    category: 'ground-state',
    difficulty: 'beginner',
    molecule: HeHPlusMolecule,
    circuit: {
      qubits: 4,
      gates: generateHeHPlusCircuit(),
      depth: circuitDepth(generateHeHPlusCircuit()),
    },
    description: 'Calculate the ground state of HeH⁺, the universe\'s first molecule after the Big Bang.',
    explanation: [
      'HeH⁺ was the first molecule to form in the early universe.',
      'With only 2 electrons, it\'s as simple as H₂ but with different nuclear charges.',
      'The He nucleus attracts electrons more strongly than H.',
      'This creates a polarized bond with electrons closer to He.',
    ],
    expectedResults: {
      groundStateEnergy: -2.862,
      energyUnit: 'Ha',
      accuracy: '±0.01 Ha',
      bondOrder: 1,
    },
    learningObjectives: [
      'Compare with H₂ to understand electronegativity',
      'Learn about primordial chemistry',
      'See how nuclear charge affects bonding',
    ],
    references: [
      { title: 'HeH⁺ Detection', url: 'https://www.nature.com/articles/s41586-019-1090-x' },
      { title: 'Helium Hydride Ion', url: 'https://en.wikipedia.org/wiki/Helium_hydride_ion' },
    ],
  },
  {
    id: 'h2o-simplified',
    name: 'Water (H₂O) Simplified',
    category: 'ground-state',
    difficulty: 'advanced',
    molecule: getMoleculeById('h2o')!,
    circuit: {
      qubits: 8,
      gates: generateWaterCircuit(),
      depth: circuitDepth(generateWaterCircuit()),
    },
    description: 'A simplified VQE model for water, demonstrating larger molecule simulation.',
    explanation: [
      'Water has 10 electrons but we use an active space approach.',
      'Core electrons (O 1s) are frozen and not explicitly simulated.',
      'The 104.5° bond angle arises from sp³ hybridization of oxygen.',
      'This requires more qubits and a deeper ansatz than diatomics.',
    ],
    expectedResults: {
      groundStateEnergy: -76.438,
      energyUnit: 'Ha',
      accuracy: '±0.1 Ha (simplified model)',
    },
    learningObjectives: [
      'Understand active space approximations',
      'Learn about polyatomic molecule simulation',
      'See scaling challenges for larger molecules',
    ],
    references: [
      { title: 'Water in Quantum Computing', url: 'https://arxiv.org/abs/1801.01053' },
      { title: 'Water Molecule', url: 'https://en.wikipedia.org/wiki/Properties_of_water' },
    ],
  },
];

export function getChemistryTemplateById(id: string): ChemistryTemplate | undefined {
  return CHEMISTRY_TEMPLATES.find(t => t.id === id);
}

export function getChemistryTemplatesByDifficulty(difficulty: ChemistryTemplate['difficulty']): ChemistryTemplate[] {
  return CHEMISTRY_TEMPLATES.filter(t => t.difficulty === difficulty);
}
