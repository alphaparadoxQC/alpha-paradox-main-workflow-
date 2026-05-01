// Curated list of famous, real-world molecules. Each entry includes a
// canonical SMILES so the RDKit/3Dmol viewer renders accurate 3D structure.

export interface FamousMolecule {
  id: string;
  name: string;
  formula: string;
  category: 'biological' | 'pharmaceutical' | 'industrial' | 'fundamental' | 'energy';
  description: string;
  /** Flat element list — drives the VQE pipeline + serves as a fallback. */
  atoms: string[];
  /** Canonical SMILES — drives the 3D viewer (preferred over `atoms`). */
  smiles: string;
}

export const FAMOUS_MOLECULES: FamousMolecule[] = [
  // Fundamental
  { id: 'h2', name: 'Hydrogen', formula: 'H₂', category: 'fundamental',
    description: 'Simplest molecule — VQE benchmark for quantum chemistry.',
    atoms: ['H', 'H'], smiles: '[H][H]' },
  { id: 'water', name: 'Water', formula: 'H₂O', category: 'fundamental',
    description: 'Universal solvent. Bent geometry, polar bonds.',
    atoms: ['O', 'H', 'H'], smiles: 'O' },
  { id: 'ammonia', name: 'Ammonia', formula: 'NH₃', category: 'industrial',
    description: 'Haber-Bosch product, fertilizer feedstock.',
    atoms: ['N', 'H', 'H', 'H'], smiles: 'N' },
  { id: 'methane', name: 'Methane', formula: 'CH₄', category: 'energy',
    description: 'Natural gas — tetrahedral hydrocarbon.',
    atoms: ['C', 'H', 'H', 'H', 'H'], smiles: 'C' },
  { id: 'co2', name: 'Carbon Dioxide', formula: 'CO₂', category: 'fundamental',
    description: 'Linear, key greenhouse gas.',
    atoms: ['C', 'O', 'O'], smiles: 'O=C=O' },
  { id: 'o2', name: 'Oxygen', formula: 'O₂', category: 'fundamental',
    description: 'Diatomic oxygen — paramagnetic ground state.',
    atoms: ['O', 'O'], smiles: 'O=O' },
  { id: 'n2', name: 'Nitrogen', formula: 'N₂', category: 'fundamental',
    description: 'Triple-bonded, atmospheric majority.',
    atoms: ['N', 'N'], smiles: 'N#N' },
  { id: 'hcl', name: 'Hydrochloric Acid', formula: 'HCl', category: 'industrial',
    description: 'Strong acid; classic polar diatomic.',
    atoms: ['H', 'Cl'], smiles: 'Cl' },
  { id: 'hf', name: 'Hydrogen Fluoride', formula: 'HF', category: 'industrial',
    description: 'Strongest single-bond polarity.',
    atoms: ['H', 'F'], smiles: 'F' },
  { id: 'lih', name: 'Lithium Hydride', formula: 'LiH', category: 'fundamental',
    description: 'Classic VQE benchmark beyond H₂.',
    atoms: ['Li', 'H'], smiles: '[LiH]' },
  { id: 'beh2', name: 'Beryllium Hydride', formula: 'BeH₂', category: 'fundamental',
    description: 'Linear, used in advanced VQE studies.',
    atoms: ['Be', 'H', 'H'], smiles: '[BeH2]' },

  // Biological / pharmaceutical
  { id: 'formaldehyde', name: 'Formaldehyde', formula: 'CH₂O', category: 'biological',
    description: 'Smallest aldehyde — preservative and biochem precursor.',
    atoms: ['C', 'O', 'H', 'H'], smiles: 'C=O' },
  { id: 'methanol', name: 'Methanol', formula: 'CH₃OH', category: 'industrial',
    description: 'Simplest alcohol, fuel and feedstock.',
    atoms: ['C', 'O', 'H', 'H', 'H', 'H'], smiles: 'CO' },
  { id: 'ethanol', name: 'Ethanol', formula: 'C₂H₆O', category: 'biological',
    description: 'Beverage alcohol, biofuel, solvent.',
    atoms: ['C', 'C', 'O', 'H', 'H', 'H', 'H', 'H'], smiles: 'CCO' },
  { id: 'benzene', name: 'Benzene', formula: 'C₆H₆', category: 'industrial',
    description: 'Aromatic ring — foundation of organic chemistry.',
    atoms: ['C', 'C', 'C', 'C', 'C', 'C'], smiles: 'c1ccccc1' },
  { id: 'glycine', name: 'Glycine', formula: 'C₂H₅NO₂', category: 'biological',
    description: 'Simplest amino acid — backbone of proteins.',
    atoms: ['N', 'C', 'C', 'O', 'O'], smiles: 'NCC(=O)O' },
  { id: 'urea', name: 'Urea', formula: 'CH₄N₂O', category: 'biological',
    description: 'First organic compound synthesized from inorganic precursors.',
    atoms: ['C', 'O', 'N', 'N'], smiles: 'NC(=O)N' },
  { id: 'cyanide', name: 'Hydrogen Cyanide', formula: 'HCN', category: 'industrial',
    description: 'Linear, prebiotic chemistry building block.',
    atoms: ['H', 'C', 'N'], smiles: 'C#N' },

  // Pharmaceutical
  { id: 'aspirin', name: 'Aspirin', formula: 'C₉H₈O₄', category: 'pharmaceutical',
    description: 'Acetylsalicylic acid — anti-inflammatory.',
    atoms: ['C', 'C', 'O', 'O', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'O', 'O'],
    smiles: 'CC(=O)Oc1ccccc1C(=O)O' },
  { id: 'caffeine', name: 'Caffeine', formula: 'C₈H₁₀N₄O₂', category: 'pharmaceutical',
    description: 'CNS stimulant in coffee and tea.',
    atoms: ['C', 'N', 'C', 'N', 'C', 'C', 'C', 'O', 'N', 'C', 'O', 'N', 'C'],
    smiles: 'Cn1cnc2c1c(=O)n(C)c(=O)n2C' },

  // Energy
  { id: 'h2o2', name: 'Hydrogen Peroxide', formula: 'H₂O₂', category: 'energy',
    description: 'Rocket propellant and disinfectant.',
    atoms: ['O', 'O', 'H', 'H'], smiles: 'OO' },
];

export const CATEGORY_LABELS: Record<FamousMolecule['category'], string> = {
  fundamental: 'Fundamental',
  biological: 'Biological',
  pharmaceutical: 'Pharmaceutical',
  industrial: 'Industrial',
  energy: 'Energy',
};
