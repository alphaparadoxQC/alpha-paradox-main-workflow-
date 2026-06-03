// Drug Discovery Data Models and Sample Data

export interface DrugCandidate {
  id: string;
  name: string;
  formula: string;
  smiles: string;
  molecularWeight: number;
  logP: number; // Partition coefficient
  hBondDonors: number;
  hBondAcceptors: number;
  rotableBonds: number;
  polarSurfaceArea: number; // Å²
  atoms: DrugAtom[];
  bonds: DrugBond[];
  targetAffinity?: number; // Predicted binding affinity in kcal/mol
}

export interface DrugAtom {
  symbol: string;
  position: [number, number, number];
  charge: number;
  color: string;
  radius: number;
}

export interface DrugBond {
  atom1: number;
  atom2: number;
  order: 1 | 2 | 3;
}

export interface ProteinTarget {
  id: string;
  name: string;
  pdbId: string;
  description: string;
  bindingSite: BindingSite;
  diseaseArea: string;
  organism: string;
}

export interface BindingSite {
  residues: string[];
  center: [number, number, number];
  radius: number;
  keyInteractions: string[];
}

export interface DockingResult {
  drugId: string;
  targetId: string;
  bindingEnergy: number; // kcal/mol
  bindingAffinity: number; // Ki in nM
  poseScore: number;
  interactionCount: number;
  hBonds: number;
  hydrophobicContacts: number;
  electrostaticScore: number;
  vqeEnergy?: number;
  quantumCorrection?: number;
}

export interface LipinskiResult {
  passes: boolean;
  violations: number;
  rules: {
    molecularWeight: { value: number; passes: boolean; limit: string };
    logP: { value: number; passes: boolean; limit: string };
    hBondDonors: { value: number; passes: boolean; limit: string };
    hBondAcceptors: { value: number; passes: boolean; limit: string };
  };
}

export interface ADMETProfile {
  absorption: { score: number; label: string; description: string };
  distribution: { score: number; label: string; description: string };
  metabolism: { score: number; label: string; description: string };
  excretion: { score: number; label: string; description: string };
  toxicity: { score: number; label: string; description: string };
  overallScore: number;
}

// Atom properties for visualization
const ATOM_COLORS: Record<string, { color: string; radius: number }> = {
  C: { color: '#909090', radius: 0.77 },
  H: { color: '#FFFFFF', radius: 0.37 },
  O: { color: '#FF0D0D', radius: 0.73 },
  N: { color: '#3050F8', radius: 0.75 },
  S: { color: '#FFFF30', radius: 1.02 },
  F: { color: '#90E050', radius: 0.71 },
  Cl: { color: '#1FF01F', radius: 0.99 },
  Br: { color: '#A62929', radius: 1.14 },
  P: { color: '#FF8000', radius: 1.10 },
};

// Sample drug candidates
export const DRUG_CANDIDATES: DrugCandidate[] = [
  {
    id: 'aspirin',
    name: 'Aspirin',
    formula: 'C₉H₈O₄',
    smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O',
    molecularWeight: 180.16,
    logP: 1.19,
    hBondDonors: 1,
    hBondAcceptors: 4,
    rotableBonds: 3,
    polarSurfaceArea: 63.6,
    atoms: [
      { symbol: 'C', position: [0, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [1.4, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'O', position: [2.1, 1.2, 0], charge: -0.3, ...ATOM_COLORS.O },
      { symbol: 'O', position: [2.1, -1.2, 0], charge: 0, ...ATOM_COLORS.O },
      { symbol: 'C', position: [3.5, -1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [4.2, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [5.6, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [6.3, 1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [5.6, 2.4, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [4.2, 2.4, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [3.5, 1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'O', position: [7.7, 1.2, 0], charge: -0.5, ...ATOM_COLORS.O },
      { symbol: 'O', position: [6.3, 3.6, 0], charge: 0, ...ATOM_COLORS.O },
    ],
    bonds: [
      { atom1: 0, atom2: 1, order: 1 },
      { atom1: 1, atom2: 2, order: 2 },
      { atom1: 1, atom2: 3, order: 1 },
      { atom1: 3, atom2: 4, order: 1 },
      { atom1: 4, atom2: 5, order: 2 },
      { atom1: 5, atom2: 6, order: 1 },
      { atom1: 6, atom2: 7, order: 2 },
      { atom1: 7, atom2: 8, order: 1 },
      { atom1: 8, atom2: 9, order: 2 },
      { atom1: 9, atom2: 10, order: 1 },
      { atom1: 10, atom2: 5, order: 1 },
      { atom1: 7, atom2: 11, order: 1 },
      { atom1: 8, atom2: 12, order: 2 },
    ],
  },
  {
    id: 'ibuprofen',
    name: 'Ibuprofen',
    formula: 'C₁₃H₁₈O₂',
    smiles: 'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O',
    molecularWeight: 206.28,
    logP: 3.97,
    hBondDonors: 1,
    hBondAcceptors: 2,
    rotableBonds: 4,
    polarSurfaceArea: 37.3,
    atoms: [
      { symbol: 'C', position: [0, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [1.4, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [2.1, 1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [3.5, 1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [4.2, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [5.6, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [6.3, 1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [5.6, 2.4, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [4.2, 2.4, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [7.7, 1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [8.4, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [9.8, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'O', position: [10.5, 1.2, 0], charge: -0.5, ...ATOM_COLORS.O },
      { symbol: 'O', position: [10.5, -1.2, 0], charge: 0, ...ATOM_COLORS.O },
    ],
    bonds: [
      { atom1: 0, atom2: 1, order: 1 },
      { atom1: 1, atom2: 2, order: 1 },
      { atom1: 1, atom2: 3, order: 1 },
      { atom1: 3, atom2: 4, order: 1 },
      { atom1: 4, atom2: 5, order: 2 },
      { atom1: 5, atom2: 6, order: 1 },
      { atom1: 6, atom2: 7, order: 2 },
      { atom1: 7, atom2: 8, order: 1 },
      { atom1: 8, atom2: 4, order: 1 },
      { atom1: 6, atom2: 9, order: 1 },
      { atom1: 9, atom2: 10, order: 1 },
      { atom1: 10, atom2: 11, order: 1 },
      { atom1: 11, atom2: 12, order: 1 },
      { atom1: 11, atom2: 13, order: 2 },
    ],
  },
  {
    id: 'caffeine',
    name: 'Caffeine',
    formula: 'C₈H₁₀N₄O₂',
    smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
    molecularWeight: 194.19,
    logP: -0.07,
    hBondDonors: 0,
    hBondAcceptors: 6,
    rotableBonds: 0,
    polarSurfaceArea: 58.4,
    atoms: [
      { symbol: 'N', position: [0, 0, 0], charge: 0, ...ATOM_COLORS.N },
      { symbol: 'C', position: [1.4, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'N', position: [2.1, 1.2, 0], charge: 0, ...ATOM_COLORS.N },
      { symbol: 'C', position: [1.4, 2.4, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [0, 2.4, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [-0.7, 1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'O', position: [-2.1, 1.2, 0], charge: -0.4, ...ATOM_COLORS.O },
      { symbol: 'N', position: [-0.7, 3.6, 0], charge: 0, ...ATOM_COLORS.N },
      { symbol: 'C', position: [0, 4.8, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'O', position: [1.4, 4.8, 0], charge: -0.4, ...ATOM_COLORS.O },
      { symbol: 'N', position: [2.1, 3.6, 0], charge: 0, ...ATOM_COLORS.N },
      { symbol: 'C', position: [-0.7, -1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [3.5, 3.6, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [-2.1, 3.6, 0], charge: 0, ...ATOM_COLORS.C },
    ],
    bonds: [
      { atom1: 0, atom2: 1, order: 1 },
      { atom1: 1, atom2: 2, order: 2 },
      { atom1: 2, atom2: 3, order: 1 },
      { atom1: 3, atom2: 4, order: 2 },
      { atom1: 4, atom2: 5, order: 1 },
      { atom1: 5, atom2: 0, order: 1 },
      { atom1: 5, atom2: 6, order: 2 },
      { atom1: 4, atom2: 7, order: 1 },
      { atom1: 7, atom2: 8, order: 1 },
      { atom1: 8, atom2: 9, order: 2 },
      { atom1: 8, atom2: 10, order: 1 },
      { atom1: 10, atom2: 3, order: 1 },
      { atom1: 0, atom2: 11, order: 1 },
      { atom1: 10, atom2: 12, order: 1 },
      { atom1: 7, atom2: 13, order: 1 },
    ],
  },
  {
    id: 'penicillin',
    name: 'Penicillin G',
    formula: 'C₁₆H₁₈N₂O₄S',
    smiles: 'CC1(C)SC2C(NC(=O)CC3=CC=CC=C3)C(=O)N2C1C(=O)O',
    molecularWeight: 334.39,
    logP: 1.83,
    hBondDonors: 2,
    hBondAcceptors: 5,
    rotableBonds: 4,
    polarSurfaceArea: 112.0,
    atoms: [
      { symbol: 'S', position: [0, 0, 0], charge: 0, ...ATOM_COLORS.S },
      { symbol: 'C', position: [1.4, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [2.1, 1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'N', position: [3.5, 1.2, 0], charge: 0, ...ATOM_COLORS.N },
      { symbol: 'C', position: [4.2, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [3.5, -1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [2.1, -1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'O', position: [5.6, 0, 0], charge: -0.4, ...ATOM_COLORS.O },
      { symbol: 'C', position: [1.4, -2.4, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'O', position: [2.1, -3.6, 0], charge: -0.5, ...ATOM_COLORS.O },
      { symbol: 'O', position: [0, -2.4, 0], charge: 0, ...ATOM_COLORS.O },
      { symbol: 'N', position: [4.2, -2.4, 0], charge: 0, ...ATOM_COLORS.N },
      { symbol: 'C', position: [5.6, -2.4, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'O', position: [6.3, -3.6, 0], charge: -0.4, ...ATOM_COLORS.O },
      { symbol: 'C', position: [6.3, -1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [7.7, -1.2, 0], charge: 0, ...ATOM_COLORS.C },
    ],
    bonds: [
      { atom1: 0, atom2: 1, order: 1 },
      { atom1: 1, atom2: 2, order: 1 },
      { atom1: 2, atom2: 3, order: 1 },
      { atom1: 3, atom2: 4, order: 1 },
      { atom1: 4, atom2: 5, order: 1 },
      { atom1: 5, atom2: 6, order: 1 },
      { atom1: 6, atom2: 1, order: 1 },
      { atom1: 4, atom2: 7, order: 2 },
      { atom1: 6, atom2: 8, order: 1 },
      { atom1: 8, atom2: 9, order: 1 },
      { atom1: 8, atom2: 10, order: 2 },
      { atom1: 5, atom2: 11, order: 1 },
      { atom1: 11, atom2: 12, order: 1 },
      { atom1: 12, atom2: 13, order: 2 },
      { atom1: 12, atom2: 14, order: 1 },
      { atom1: 14, atom2: 15, order: 1 },
    ],
  },
  {
    id: 'remdesivir',
    name: 'Remdesivir',
    formula: 'C₂₇H₃₅N₆O₈P',
    smiles: 'CCC(CC)COC(=O)C(C)NP(=O)(OCC1C(C(C(O1)N2C=CC(=O)NC2=O)(C#N)C3=CC=CC=C3)O)OC4=CC=CC=C4',
    molecularWeight: 602.58,
    logP: 1.91,
    hBondDonors: 4,
    hBondAcceptors: 12,
    rotableBonds: 14,
    polarSurfaceArea: 204.0,
    atoms: [
      { symbol: 'N', position: [0, 0, 0], charge: 0, ...ATOM_COLORS.N },
      { symbol: 'C', position: [1.4, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'N', position: [2.1, 1.2, 0], charge: 0, ...ATOM_COLORS.N },
      { symbol: 'C', position: [3.5, 1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [4.2, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [3.5, -1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'N', position: [4.2, -2.4, 0], charge: 0, ...ATOM_COLORS.N },
      { symbol: 'P', position: [5.6, -2.4, 0], charge: 0, ...ATOM_COLORS.P },
      { symbol: 'O', position: [6.3, -1.2, 0], charge: -0.5, ...ATOM_COLORS.O },
      { symbol: 'O', position: [6.3, -3.6, 0], charge: -0.5, ...ATOM_COLORS.O },
      { symbol: 'O', position: [4.9, -3.6, 0], charge: 0, ...ATOM_COLORS.O },
    ],
    bonds: [
      { atom1: 0, atom2: 1, order: 1 },
      { atom1: 1, atom2: 2, order: 2 },
      { atom1: 2, atom2: 3, order: 1 },
      { atom1: 3, atom2: 4, order: 2 },
      { atom1: 4, atom2: 5, order: 1 },
      { atom1: 5, atom2: 0, order: 1 },
      { atom1: 5, atom2: 6, order: 1 },
      { atom1: 6, atom2: 7, order: 1 },
      { atom1: 7, atom2: 8, order: 2 },
      { atom1: 7, atom2: 9, order: 1 },
      { atom1: 7, atom2: 10, order: 1 },
    ],
  },
  {
    id: 'paracetamol',
    name: 'Paracetamol',
    formula: 'C₈H₉NO₂',
    smiles: 'CC(=O)NC1=CC=C(O)C=C1',
    molecularWeight: 151.16,
    logP: 0.46,
    hBondDonors: 2,
    hBondAcceptors: 3,
    rotableBonds: 1,
    polarSurfaceArea: 49.3,
    atoms: [
      { symbol: 'C', position: [0, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [1.4, 0, 0], charge: 0.3, ...ATOM_COLORS.C },
      { symbol: 'O', position: [2.1, 1.2, 0], charge: -0.4, ...ATOM_COLORS.O },
      { symbol: 'N', position: [2.1, -1.2, 0], charge: -0.2, ...ATOM_COLORS.N },
      { symbol: 'C', position: [3.5, -1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [4.2, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [5.6, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [6.3, 1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'O', position: [7.7, 1.2, 0], charge: -0.3, ...ATOM_COLORS.O },
      { symbol: 'C', position: [5.6, 2.4, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [4.2, 2.4, 0], charge: 0, ...ATOM_COLORS.C },
    ],
    bonds: [
      { atom1: 0, atom2: 1, order: 1 },
      { atom1: 1, atom2: 2, order: 2 },
      { atom1: 1, atom2: 3, order: 1 },
      { atom1: 3, atom2: 4, order: 1 },
      { atom1: 4, atom2: 5, order: 2 },
      { atom1: 5, atom2: 6, order: 1 },
      { atom1: 6, atom2: 7, order: 2 },
      { atom1: 7, atom2: 8, order: 1 },
      { atom1: 7, atom2: 9, order: 1 },
      { atom1: 9, atom2: 10, order: 2 },
      { atom1: 10, atom2: 4, order: 1 },
    ],
  },
  {
    id: 'warfarin',
    name: 'Warfarin',
    formula: 'C₁₉H₁₆O₄',
    smiles: 'CC(=O)CC(C1=CC=CC=C1)C2=C(O)C3=CC=CC=C3OC2=O',
    molecularWeight: 308.33,
    logP: 2.70,
    hBondDonors: 1,
    hBondAcceptors: 4,
    rotableBonds: 4,
    polarSurfaceArea: 63.6,
    atoms: [
      { symbol: 'C', position: [0, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [1.4, 0, 0], charge: 0.3, ...ATOM_COLORS.C },
      { symbol: 'O', position: [2.1, 1.2, 0], charge: -0.4, ...ATOM_COLORS.O },
      { symbol: 'C', position: [2.1, -1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [3.5, -1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [4.2, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [5.6, 0, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [6.3, 1.2, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [5.6, 2.4, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'C', position: [4.2, 2.4, 0], charge: 0, ...ATOM_COLORS.C },
      { symbol: 'O', position: [3.5, 3.6, 0], charge: -0.4, ...ATOM_COLORS.O },
      { symbol: 'C', position: [2.1, 3.6, 0], charge: 0.3, ...ATOM_COLORS.C },
      { symbol: 'O', position: [1.4, 4.8, 0], charge: -0.4, ...ATOM_COLORS.O },
      { symbol: 'O', position: [7.7, 1.2, 0], charge: -0.3, ...ATOM_COLORS.O },
    ],
    bonds: [
      { atom1: 0, atom2: 1, order: 1 },
      { atom1: 1, atom2: 2, order: 2 },
      { atom1: 1, atom2: 3, order: 1 },
      { atom1: 3, atom2: 4, order: 1 },
      { atom1: 4, atom2: 5, order: 2 },
      { atom1: 5, atom2: 6, order: 1 },
      { atom1: 6, atom2: 7, order: 2 },
      { atom1: 7, atom2: 8, order: 1 },
      { atom1: 8, atom2: 9, order: 2 },
      { atom1: 9, atom2: 10, order: 1 },
      { atom1: 10, atom2: 11, order: 1 },
      { atom1: 11, atom2: 12, order: 2 },
      { atom1: 7, atom2: 13, order: 1 },
    ],
  },
];

// Sample protein targets
export const PROTEIN_TARGETS: ProteinTarget[] = [
  {
    id: 'cox2',
    name: 'Cyclooxygenase-2 (COX-2)',
    pdbId: '5KIR',
    description: 'Enzyme involved in prostaglandin biosynthesis and inflammation',
    diseaseArea: 'Inflammation & Pain',
    organism: 'Homo sapiens',
    bindingSite: {
      residues: ['ARG120', 'TYR355', 'GLU524', 'ARG513', 'HIS90'],
      center: [25.3, 14.2, 8.7],
      radius: 12.0,
      keyInteractions: ['H-bond with ARG120', 'Hydrophobic pocket', 'π-stacking with TYR355'],
    },
  },
  {
    id: 'ace2',
    name: 'ACE2 Receptor',
    pdbId: '6M0J',
    description: 'Angiotensin-converting enzyme 2, target for antiviral research',
    diseaseArea: 'Viral Infections',
    organism: 'Homo sapiens',
    bindingSite: {
      residues: ['GLN24', 'ASP30', 'LYS31', 'HIS34', 'GLU35'],
      center: [35.1, 22.8, 15.4],
      radius: 15.0,
      keyInteractions: ['Salt bridge with LYS31', 'H-bond network', 'Electrostatic with GLU35'],
    },
  },
  {
    id: 'rdrp',
    name: 'RNA-dependent RNA polymerase',
    pdbId: '7BV2',
    description: 'Viral replication enzyme, antiviral drug target',
    diseaseArea: 'Viral Infections',
    organism: 'SARS-CoV-2',
    bindingSite: {
      residues: ['ASP760', 'ASP761', 'SER759', 'ARG555', 'LYS545'],
      center: [45.2, 18.9, 22.1],
      radius: 10.0,
      keyInteractions: ['Mg²⁺ coordination', 'Nucleotide mimicry', 'Catalytic site blocking'],
    },
  },
  {
    id: 'egfr',
    name: 'Epidermal Growth Factor Receptor',
    pdbId: '1M17',
    description: 'Tyrosine kinase receptor, oncology target',
    diseaseArea: 'Oncology',
    organism: 'Homo sapiens',
    bindingSite: {
      residues: ['LYS745', 'MET793', 'THR790', 'LEU718', 'ALA743'],
      center: [28.4, 32.1, 19.8],
      radius: 14.0,
      keyInteractions: ['ATP binding site', 'Hinge region H-bond', 'Gatekeeper residue'],
    },
  },
];

// Lipinski's Rule of Five calculation
export function calculateLipinski(drug: DrugCandidate): LipinskiResult {
  const rules = {
    molecularWeight: {
      value: drug.molecularWeight,
      passes: drug.molecularWeight <= 500,
      limit: '≤ 500 Da',
    },
    logP: {
      value: drug.logP,
      passes: drug.logP <= 5,
      limit: '≤ 5',
    },
    hBondDonors: {
      value: drug.hBondDonors,
      passes: drug.hBondDonors <= 5,
      limit: '≤ 5',
    },
    hBondAcceptors: {
      value: drug.hBondAcceptors,
      passes: drug.hBondAcceptors <= 10,
      limit: '≤ 10',
    },
  };

  const violations = Object.values(rules).filter((r) => !r.passes).length;

  return {
    passes: violations <= 1,
    violations,
    rules,
  };
}

// ADMET prediction (simplified model)
export function predictADMET(drug: DrugCandidate): ADMETProfile {
  // Simplified scoring based on molecular properties
  const absorption = calculateAbsorption(drug);
  const distribution = calculateDistribution(drug);
  const metabolism = calculateMetabolism(drug);
  const excretion = calculateExcretion(drug);
  const toxicity = calculateToxicity(drug);

  const overallScore = (absorption.score + distribution.score + metabolism.score + excretion.score + toxicity.score) / 5;

  return { absorption, distribution, metabolism, excretion, toxicity, overallScore };
}

function calculateAbsorption(drug: DrugCandidate) {
  // Based on polar surface area and molecular weight
  let score = 100;
  if (drug.polarSurfaceArea > 140) score -= 40;
  else if (drug.polarSurfaceArea > 90) score -= 20;
  if (drug.molecularWeight > 500) score -= 30;
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    label: score > 70 ? 'Good' : score > 40 ? 'Moderate' : 'Poor',
    description: `PSA: ${drug.polarSurfaceArea.toFixed(1)} Å², MW: ${drug.molecularWeight.toFixed(1)} Da`,
  };
}

function calculateDistribution(drug: DrugCandidate) {
  // Based on logP and protein binding estimate
  let score = 100;
  if (drug.logP < 0 || drug.logP > 5) score -= 30;
  if (drug.polarSurfaceArea > 120) score -= 20;
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    label: score > 70 ? 'Good' : score > 40 ? 'Moderate' : 'Poor',
    description: `logP: ${drug.logP.toFixed(2)}, Volume of distribution estimate`,
  };
}

function calculateMetabolism(drug: DrugCandidate) {
  // Based on rotatable bonds and molecular complexity
  let score = 100;
  if (drug.rotableBonds > 10) score -= 30;
  else if (drug.rotableBonds > 7) score -= 15;
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    label: score > 70 ? 'Stable' : score > 40 ? 'Moderate' : 'Unstable',
    description: `${drug.rotableBonds} rotatable bonds, CYP450 substrate probability`,
  };
}

function calculateExcretion(drug: DrugCandidate) {
  // Based on molecular weight and charge
  let score = 100;
  if (drug.molecularWeight > 400) score -= 20;
  if (drug.logP > 4) score -= 20;
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    label: score > 70 ? 'Good' : score > 40 ? 'Moderate' : 'Slow',
    description: `Estimated half-life and clearance`,
  };
}

function calculateToxicity(drug: DrugCandidate) {
  // Simplified toxicity prediction
  let score = 100;
  if (drug.logP > 4.5) score -= 25; // Potential accumulation
  if (drug.hBondDonors > 4) score -= 15;
  if (drug.molecularWeight > 550) score -= 20;
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    label: score > 70 ? 'Low Risk' : score > 40 ? 'Moderate Risk' : 'High Risk',
    description: `hERG liability, hepatotoxicity, genotoxicity estimates`,
  };
}

// Simulate molecular docking with deterministic quantum-inspired scoring
export function simulateDocking(drug: DrugCandidate, target: ProteinTarget): DockingResult {
  // Deterministic scoring based on molecular descriptors and target properties
  // Uses physics-based energy terms instead of random values
  
  // Shape complementarity: penalize large/inflexible molecules
  const shapePenalty = Math.max(0, (drug.molecularWeight - 300) / 200) * 1.5;
  
  // Hydrogen bond energy: ~1.0–1.5 kcal/mol per H-bond
  const maxHBonds = Math.min(drug.hBondDonors + drug.hBondAcceptors, target.bindingSite.residues.length);
  const hBonds = Math.min(maxHBonds, 6);
  const hBondEnergy = -hBonds * 1.2;
  
  // Hydrophobic interaction: favorable for moderately lipophilic drugs
  const optimalLogP = 2.5;
  const hydrophobicScore = -Math.max(0, 3.0 - Math.abs(drug.logP - optimalLogP) * 0.8);
  
  // Electrostatic contribution: based on charge complementarity
  const chargeSum = drug.atoms.reduce((sum, a) => sum + Math.abs(a.charge), 0);
  const electrostaticScore = -(chargeSum * 0.3 + (drug.polarSurfaceArea > 50 ? 1.0 : 0.3));
  
  // Desolvation penalty: large PSA means harder to desolvate
  const desolvationPenalty = drug.polarSurfaceArea > 120 ? 2.0 : drug.polarSurfaceArea > 80 ? 1.0 : 0.3;
  
  // Entropy penalty from rotatable bonds (conformational entropy loss)
  const entropyPenalty = drug.rotableBonds * 0.3;
  
  // Total classical binding energy
  const classicalEnergy = hBondEnergy + hydrophobicScore + electrostaticScore 
                        + desolvationPenalty + entropyPenalty - shapePenalty - 3.5; // baseline attraction
  
  // Quantum correction: electron correlation effects on binding
  // Deterministic based on drug electronic structure
  const electronDensityFactor = chargeSum / Math.max(drug.atoms.length, 1);
  const quantumCorrection = -(electronDensityFactor * 0.8 + 0.15);
  
  const bindingEnergy = classicalEnergy + quantumCorrection;
  
  // Convert to binding affinity (Ki) via Boltzmann: ΔG = RT ln(Ki)
  const RT = 0.592; // kcal/mol at 298K
  const bindingAffinity = Math.exp(bindingEnergy / RT) * 1e9; // nM

  // Hydrophobic contacts based on LogP and binding site radius
  const hydrophobicContacts = Math.max(1, Math.floor(Math.min(drug.logP + 1, 5)));

  return {
    drugId: drug.id,
    targetId: target.id,
    bindingEnergy: Math.round(bindingEnergy * 100) / 100,
    bindingAffinity: Math.min(Math.round(bindingAffinity * 10) / 10, 10000),
    poseScore: Math.round(Math.max(60, Math.min(100, 95 - shapePenalty * 5 - entropyPenalty * 2)) * 10) / 10,
    interactionCount: hBonds + hydrophobicContacts,
    hBonds,
    hydrophobicContacts,
    electrostaticScore: Math.round(Math.abs(electrostaticScore) * 100) / 100,
    vqeEnergy: Math.round((classicalEnergy + quantumCorrection * 2) * 1000) / 1000,
    quantumCorrection: Math.round(quantumCorrection * 1000) / 1000,
  };
}

export function getDrugById(id: string): DrugCandidate | undefined {
  return DRUG_CANDIDATES.find((d) => d.id === id);
}

export function getTargetById(id: string): ProteinTarget | undefined {
  return PROTEIN_TARGETS.find((t) => t.id === id);
}
