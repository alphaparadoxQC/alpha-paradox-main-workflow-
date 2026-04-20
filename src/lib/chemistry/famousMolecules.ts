// Curated list of famous, real-world molecules that can be loaded
// into the custom-molecule builder. Each entry is just a flat list of
// element symbols (with repeats) so it plugs straight into
// `buildCustomMolecule` and the existing VQE pipeline.

export interface FamousMolecule {
  id: string;
  name: string;
  formula: string;
  category: 'biological' | 'pharmaceutical' | 'industrial' | 'fundamental' | 'energy';
  description: string;
  // Flat element list. Limit to ~8 atoms so VQE stays interactive.
  // For larger real-world molecules we use a representative simplified core.
  atoms: string[];
}

export const FAMOUS_MOLECULES: FamousMolecule[] = [
  // Fundamental
  {
    id: 'h2',
    name: 'Hydrogen',
    formula: 'H₂',
    category: 'fundamental',
    description: 'Simplest molecule — VQE benchmark for quantum chemistry.',
    atoms: ['H', 'H'],
  },
  {
    id: 'water',
    name: 'Water',
    formula: 'H₂O',
    category: 'fundamental',
    description: 'Universal solvent. Bent geometry, polar bonds.',
    atoms: ['O', 'H', 'H'],
  },
  {
    id: 'ammonia',
    name: 'Ammonia',
    formula: 'NH₃',
    category: 'industrial',
    description: 'Haber-Bosch product, fertilizer feedstock.',
    atoms: ['N', 'H', 'H', 'H'],
  },
  {
    id: 'methane',
    name: 'Methane',
    formula: 'CH₄',
    category: 'energy',
    description: 'Natural gas — tetrahedral hydrocarbon.',
    atoms: ['C', 'H', 'H', 'H', 'H'],
  },
  {
    id: 'co2',
    name: 'Carbon Dioxide',
    formula: 'CO₂',
    category: 'fundamental',
    description: 'Linear, key greenhouse gas.',
    atoms: ['C', 'O', 'O'],
  },
  {
    id: 'o2',
    name: 'Oxygen',
    formula: 'O₂',
    category: 'fundamental',
    description: 'Diatomic oxygen — paramagnetic ground state.',
    atoms: ['O', 'O'],
  },
  {
    id: 'n2',
    name: 'Nitrogen',
    formula: 'N₂',
    category: 'fundamental',
    description: 'Triple-bonded, atmospheric majority.',
    atoms: ['N', 'N'],
  },
  {
    id: 'hcl',
    name: 'Hydrochloric Acid',
    formula: 'HCl',
    category: 'industrial',
    description: 'Strong acid; classic polar diatomic.',
    atoms: ['H', 'Cl'],
  },
  {
    id: 'hf',
    name: 'Hydrogen Fluoride',
    formula: 'HF',
    category: 'industrial',
    description: 'Strongest single-bond polarity.',
    atoms: ['H', 'F'],
  },
  {
    id: 'lih',
    name: 'Lithium Hydride',
    formula: 'LiH',
    category: 'fundamental',
    description: 'Classic VQE benchmark beyond H₂.',
    atoms: ['Li', 'H'],
  },
  {
    id: 'beh2',
    name: 'Beryllium Hydride',
    formula: 'BeH₂',
    category: 'fundamental',
    description: 'Linear, used in advanced VQE studies.',
    atoms: ['Be', 'H', 'H'],
  },

  // Biological / pharmaceutical (simplified cores)
  {
    id: 'formaldehyde',
    name: 'Formaldehyde',
    formula: 'CH₂O',
    category: 'biological',
    description: 'Smallest aldehyde — preservative and biochem precursor.',
    atoms: ['C', 'O', 'H', 'H'],
  },
  {
    id: 'methanol',
    name: 'Methanol',
    formula: 'CH₃OH',
    category: 'industrial',
    description: 'Simplest alcohol, fuel and feedstock.',
    atoms: ['C', 'O', 'H', 'H', 'H', 'H'],
  },
  {
    id: 'glycine-core',
    name: 'Glycine (core)',
    formula: 'C₂NO₂H',
    category: 'biological',
    description: 'Simplest amino acid — backbone of proteins (simplified).',
    atoms: ['N', 'C', 'C', 'O', 'O', 'H'],
  },
  {
    id: 'urea-core',
    name: 'Urea (core)',
    formula: 'CN₂O',
    category: 'biological',
    description: 'First organic compound synthesized from inorganic precursors.',
    atoms: ['C', 'O', 'N', 'N'],
  },
  {
    id: 'cyanide',
    name: 'Hydrogen Cyanide',
    formula: 'HCN',
    category: 'industrial',
    description: 'Linear, prebiotic chemistry building block.',
    atoms: ['H', 'C', 'N'],
  },

  // Energy
  {
    id: 'h2o2',
    name: 'Hydrogen Peroxide',
    formula: 'H₂O₂',
    category: 'energy',
    description: 'Rocket propellant and disinfectant.',
    atoms: ['O', 'O', 'H', 'H'],
  },
];

export const CATEGORY_LABELS: Record<FamousMolecule['category'], string> = {
  fundamental: 'Fundamental',
  biological: 'Biological',
  pharmaceutical: 'Pharmaceutical',
  industrial: 'Industrial',
  energy: 'Energy',
};
