/**
 * Chemistry Circuit Templates
 * Pre-built VQE circuits for molecular ground state calculations
 */

import { QuantumGate } from '@/types/quantum';
import { MoleculeData, OrbitalInfo } from './moleculeData';

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

// Helper to generate gate IDs
const gateId = () => `tmpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

// Generate H2 ground state circuit
const generateH2GroundStateCircuit = (): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  
  // Hartree-Fock reference state |0011⟩
  gates.push({ id: gateId(), type: 'X', qubit: 0, position: 0 });
  gates.push({ id: gateId(), type: 'X', qubit: 1, position: 0 });
  
  // UCCSD-inspired ansatz layer 1
  gates.push({ id: gateId(), type: 'Ry', qubit: 0, position: 1, angle: Math.PI / 4 });
  gates.push({ id: gateId(), type: 'Ry', qubit: 1, position: 1, angle: Math.PI / 4 });
  gates.push({ id: gateId(), type: 'Ry', qubit: 2, position: 1, angle: -Math.PI / 6 });
  gates.push({ id: gateId(), type: 'Ry', qubit: 3, position: 1, angle: -Math.PI / 6 });
  
  // Entangling layer
  gates.push({ id: gateId(), type: 'CNOT', qubit: 0, controlQubit: 0, targetQubit: 1, position: 2 });
  gates.push({ id: gateId(), type: 'CNOT', qubit: 2, controlQubit: 2, targetQubit: 3, position: 2 });
  
  gates.push({ id: gateId(), type: 'CNOT', qubit: 1, controlQubit: 1, targetQubit: 2, position: 3 });
  
  // Rz rotations
  gates.push({ id: gateId(), type: 'Rz', qubit: 0, position: 4, angle: Math.PI / 3 });
  gates.push({ id: gateId(), type: 'Rz', qubit: 1, position: 4, angle: Math.PI / 3 });
  gates.push({ id: gateId(), type: 'Rz', qubit: 2, position: 4, angle: -Math.PI / 4 });
  gates.push({ id: gateId(), type: 'Rz', qubit: 3, position: 4, angle: -Math.PI / 4 });
  
  return gates;
};

// Generate H2 dissociation circuit (parameterized for different bond lengths)
const generateH2DissociationCircuit = (): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  
  // Reference state
  gates.push({ id: gateId(), type: 'X', qubit: 0, position: 0 });
  gates.push({ id: gateId(), type: 'X', qubit: 1, position: 0 });
  
  // Hardware-efficient ansatz with more layers for dissociation
  for (let layer = 0; layer < 3; layer++) {
    const pos = layer * 3 + 1;
    
    gates.push({ id: gateId(), type: 'Ry', qubit: 0, position: pos, angle: Math.PI / (4 + layer) });
    gates.push({ id: gateId(), type: 'Ry', qubit: 1, position: pos, angle: Math.PI / (4 + layer) });
    gates.push({ id: gateId(), type: 'Ry', qubit: 2, position: pos, angle: -Math.PI / (5 + layer) });
    gates.push({ id: gateId(), type: 'Ry', qubit: 3, position: pos, angle: -Math.PI / (5 + layer) });
    
    gates.push({ id: gateId(), type: 'CNOT', qubit: 0, controlQubit: 0, targetQubit: 1, position: pos + 1 });
    gates.push({ id: gateId(), type: 'CNOT', qubit: 1, controlQubit: 1, targetQubit: 2, position: pos + 1 });
    gates.push({ id: gateId(), type: 'CNOT', qubit: 2, controlQubit: 2, targetQubit: 3, position: pos + 1 });
    
    gates.push({ id: gateId(), type: 'Rz', qubit: 0, position: pos + 2, angle: Math.PI / (3 + layer) });
    gates.push({ id: gateId(), type: 'Rz', qubit: 1, position: pos + 2, angle: Math.PI / (3 + layer) });
    gates.push({ id: gateId(), type: 'Rz', qubit: 2, position: pos + 2, angle: -Math.PI / (4 + layer) });
    gates.push({ id: gateId(), type: 'Rz', qubit: 3, position: pos + 2, angle: -Math.PI / (4 + layer) });
  }
  
  return gates;
};

// Generate LiH ground state circuit
const generateLiHGroundStateCircuit = (): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  
  // Hartree-Fock reference for LiH (4 electrons)
  gates.push({ id: gateId(), type: 'X', qubit: 0, position: 0 });
  gates.push({ id: gateId(), type: 'X', qubit: 1, position: 0 });
  gates.push({ id: gateId(), type: 'X', qubit: 2, position: 0 });
  gates.push({ id: gateId(), type: 'X', qubit: 3, position: 0 });
  
  // Multi-layer ansatz
  for (let layer = 0; layer < 4; layer++) {
    const pos = layer * 3 + 1;
    
    for (let q = 0; q < 6; q++) {
      gates.push({ 
        id: gateId(), 
        type: 'Ry', 
        qubit: q, 
        position: pos, 
        angle: (q < 4 ? 1 : -1) * Math.PI / (4 + layer) 
      });
    }
    
    for (let q = 0; q < 5; q++) {
      gates.push({ 
        id: gateId(), 
        type: 'CNOT', 
        qubit: q, 
        controlQubit: q, 
        targetQubit: q + 1, 
        position: pos + 1 
      });
    }
    
    for (let q = 0; q < 6; q++) {
      gates.push({ 
        id: gateId(), 
        type: 'Rz', 
        qubit: q, 
        position: pos + 2, 
        angle: (q < 4 ? 1 : -1) * Math.PI / (3 + layer) 
      });
    }
  }
  
  return gates;
};

// Generate HeH+ ground state circuit
const generateHeHPlusCircuit = (): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  
  // 2 electrons in bonding orbital
  gates.push({ id: gateId(), type: 'X', qubit: 0, position: 0 });
  gates.push({ id: gateId(), type: 'X', qubit: 1, position: 0 });
  
  // Simple ansatz (similar to H2)
  gates.push({ id: gateId(), type: 'Ry', qubit: 0, position: 1, angle: Math.PI / 5 });
  gates.push({ id: gateId(), type: 'Ry', qubit: 1, position: 1, angle: Math.PI / 5 });
  gates.push({ id: gateId(), type: 'Ry', qubit: 2, position: 1, angle: -Math.PI / 7 });
  gates.push({ id: gateId(), type: 'Ry', qubit: 3, position: 1, angle: -Math.PI / 7 });
  
  gates.push({ id: gateId(), type: 'CNOT', qubit: 0, controlQubit: 0, targetQubit: 1, position: 2 });
  gates.push({ id: gateId(), type: 'CNOT', qubit: 2, controlQubit: 2, targetQubit: 3, position: 2 });
  gates.push({ id: gateId(), type: 'CNOT', qubit: 1, controlQubit: 1, targetQubit: 2, position: 3 });
  
  gates.push({ id: gateId(), type: 'Rz', qubit: 0, position: 4, angle: Math.PI / 4 });
  gates.push({ id: gateId(), type: 'Rz', qubit: 1, position: 4, angle: Math.PI / 4 });
  gates.push({ id: gateId(), type: 'Rz', qubit: 2, position: 4, angle: -Math.PI / 5 });
  gates.push({ id: gateId(), type: 'Rz', qubit: 3, position: 4, angle: -Math.PI / 5 });
  
  return gates;
};

// Generate Water (H2O) simplified circuit
const generateWaterCircuit = (): QuantumGate[] => {
  const gates: QuantumGate[] = [];
  
  // Frozen core: 1s electrons not explicitly included
  // Active space: valence electrons
  for (let q = 0; q < 5; q++) {
    gates.push({ id: gateId(), type: 'X', qubit: q, position: 0 });
  }
  
  // Multi-layer ansatz for water
  for (let layer = 0; layer < 6; layer++) {
    const pos = layer * 3 + 1;
    
    for (let q = 0; q < 10; q++) {
      gates.push({ 
        id: gateId(), 
        type: 'Ry', 
        qubit: q, 
        position: pos, 
        angle: (q < 5 ? 1 : -1) * Math.PI / (4 + layer * 0.5) 
      });
    }
    
    for (let q = 0; q < 9; q++) {
      gates.push({ 
        id: gateId(), 
        type: 'CNOT', 
        qubit: q, 
        controlQubit: q, 
        targetQubit: q + 1, 
        position: pos + 1 
      });
    }
    
    for (let q = 0; q < 10; q++) {
      gates.push({ 
        id: gateId(), 
        type: 'Rz', 
        qubit: q, 
        position: pos + 2, 
        angle: (q < 5 ? 1 : -1) * Math.PI / (3 + layer * 0.5) 
      });
    }
  }
  
  return gates;
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
      depth: 5,
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
      depth: 10,
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
      depth: 13,
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
      depth: 5,
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
      qubits: 10,
      gates: generateWaterCircuit(),
      depth: 19,
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
