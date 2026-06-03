// Curated list of famous, real-world molecules. Each entry includes a
// canonical SMILES so the RDKit/3Dmol viewer renders accurate 3D structure.

export interface FamousMolecule {
  id: string;
  name: string;
  formula: string;
  category: 'biological' | 'pharmaceutical' | 'industrial' | 'fundamental' | 'energy' | 'macromolecule';
  description: string;
  /** Flat element list — drives the VQE pipeline + serves as a fallback. */
  atoms: string[];
  /** Canonical SMILES — drives the 3D viewer (preferred over `atoms`). */
  smiles: string;
}

export const FAMOUS_MOLECULES: FamousMolecule[] = [
  // ─── Fundamental ──────────────────────────────────────────
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

  // ─── Biological (small) ───────────────────────────────────
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

  // ─── Biological (medium) ──────────────────────────────────
  { id: 'glucose', name: 'Glucose', formula: 'C₆H₁₂O₆', category: 'biological',
    description: 'Primary energy source for cells — universal metabolic fuel. 24 atoms.',
    atoms: ['C','C','C','C','C','C','O','O','O','O','O','O'],
    smiles: 'OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@@H]1O' },
  { id: 'dopamine', name: 'Dopamine', formula: 'C₈H₁₁NO₂', category: 'biological',
    description: 'Neurotransmitter — reward, motivation, motor control. 22 atoms.',
    atoms: ['C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'N', 'O', 'O'],
    smiles: 'NCCc1ccc(O)c(O)c1' },
  { id: 'serotonin', name: 'Serotonin', formula: 'C₁₀H₁₂N₂O', category: 'biological',
    description: 'Neurotransmitter — mood, sleep, appetite regulation. 25 atoms.',
    atoms: ['C','C','C','C','C','C','C','C','C','C','N','N','O'],
    smiles: 'NCCc1c[nH]c2ccc(O)cc12' },

  // ─── Pharmaceutical (medium) ──────────────────────────────
  { id: 'aspirin', name: 'Aspirin', formula: 'C₉H₈O₄', category: 'pharmaceutical',
    description: 'Acetylsalicylic acid — anti-inflammatory.',
    atoms: ['C','C','O','O','C','C','C','C','C','C','C','O','O'],
    smiles: 'CC(=O)Oc1ccccc1C(=O)O' },
  { id: 'caffeine', name: 'Caffeine', formula: 'C₈H₁₀N₄O₂', category: 'pharmaceutical',
    description: 'CNS stimulant in coffee and tea.',
    atoms: ['C','N','C','N','C','C','C','O','N','C','O','N','C'],
    smiles: 'Cn1cnc2c1c(=O)n(C)c(=O)n2C' },
  { id: 'acetaminophen', name: 'Acetaminophen', formula: 'C₈H₉NO₂', category: 'pharmaceutical',
    description: 'Paracetamol — world\'s most common analgesic and antipyretic. 20 atoms.',
    atoms: ['C','C','C','C','C','C','N','C','O','O'],
    smiles: 'CC(=O)Nc1ccc(O)cc1' },
  { id: 'nicotine', name: 'Nicotine', formula: 'C₁₀H₁₄N₂', category: 'pharmaceutical',
    description: 'Tobacco alkaloid — nicotinic acetylcholine receptor agonist. 26 atoms.',
    atoms: ['C','C','C','C','C','C','C','C','C','C','N','N'],
    smiles: 'CN1CCC[C@@H]1c1cccnc1' },

  // ─── Pharmaceutical (large) ───────────────────────────────
  { id: 'penicillinG', name: 'Penicillin G', formula: 'C₁₆H₁₈N₂O₄S', category: 'pharmaceutical',
    description: 'First mass-produced antibiotic — β-lactam ring structure. 39 atoms.',
    atoms: ['C','C','C','C','C','C','C','C','C','C','C','C','C','C','C','C','N','N','O','O','O','O','S'],
    smiles: 'CC1([C@@H](N2[C@H](S1)[C@@H](C2=O)NC(=O)Cc3ccccc3)C(=O)O)C' },
  { id: 'morphine', name: 'Morphine', formula: 'C₁₇H₁₉NO₃', category: 'pharmaceutical',
    description: 'Opioid analgesic — gold standard for severe pain management. 40 atoms.',
    atoms: ['C','C','C','C','C','C','C','C','C','C','C','C','C','C','C','C','C','N','O','O','O'],
    smiles: 'CN1CC[C@]23c4c5ccc(O)c4O[C@H]2[C@@H](O)C=C[C@H]3[C@@H]1C5' },

  // ─── Biological macromolecules ────────────────────────────
  { id: 'atp', name: 'ATP', formula: 'C₁₀H₁₆N₅O₁₃P₃', category: 'macromolecule',
    description: 'Adenosine triphosphate — universal energy currency of life. 47 atoms.',
    atoms: ['C','C','C','C','C','C','C','C','C','C','N','N','N','N','N','O','O','O','O','O','O','O','O','O','O','O','O','O','P','P','P'],
    smiles: 'c1nc(c2c(n1)n(cn2)[C@@H]3[C@@H]([C@@H]([C@H](O3)COP(=O)(O)OP(=O)(O)OP(=O)(O)O)O)O)N' },
  { id: 'estradiol', name: 'Estradiol', formula: 'C₁₈H₂₄O₂', category: 'biological',
    description: 'Primary female sex hormone — steroid ring system. 44 atoms.',
    atoms: [...Array(18).fill('C'), 'O', 'O'],
    smiles: 'C[C@]12CC[C@H]3[C@@H](CCc4cc(O)ccc43)[C@@H]1CC[C@@H]2O' },
  { id: 'retinol', name: 'Retinol (Vitamin A)', formula: 'C₂₀H₃₀O', category: 'biological',
    description: 'Essential vitamin — vision, immune function, skin health. 51 atoms.',
    atoms: [...Array(20).fill('C'), 'O'],
    smiles: 'CC1=C(C(CCC1)(C)C)/C=C/C(=C/C=C/C(=C/CO)/C)/C' },
  { id: 'cortisol', name: 'Cortisol', formula: 'C₂₁H₃₀O₅', category: 'biological',
    description: 'Stress hormone — anti-inflammatory steroid. 56 atoms.',
    atoms: [...Array(21).fill('C'), 'O','O','O','O','O'],
    smiles: 'O[C@@]1(CC[C@@H]2[C@@]1(CC(=O)[C@H]3[C@H]2CCC4=CC(=O)CC[C@]34C)C)C(=O)CO' },
  { id: 'cholesterol', name: 'Cholesterol', formula: 'C₂₇H₄₆O', category: 'macromolecule',
    description: 'Sterol lipid — cell membrane component, hormone precursor. 74 atoms.',
    atoms: [...Array(27).fill('C'), 'O'],
    smiles: 'C[C@H](CCCC(C)C)[C@H]1CC[C@@H]2[C@@]1(CC[C@H]3[C@H]2CC=C4[C@@]3(CC[C@@H](C4)O)C)C' },
  { id: 'heme', name: 'Heme B (Hemoglobin)', formula: 'C₃₄H₃₂FeN₄O₄', category: 'macromolecule',
    description: 'Iron-porphyrin complex — oxygen transport in blood. 77 atoms.',
    atoms: [...Array(34).fill('C'), 'Fe', 'N','N','N','N', 'O','O','O','O'],
    smiles: 'Cc1c(CCC(=O)O)c2cc3[nH]c(cc4nc(cc5[nH]c(cc1n2)c(C)c5C=C)c(CCC(=O)O)c4C)c(C=C)c3C' },
  { id: 'taxol', name: 'Taxol (Paclitaxel)', formula: 'C₄₇H₅₁NO₁₄', category: 'macromolecule',
    description: 'Anticancer drug from Pacific yew tree. 113 atoms — one of the largest small molecules.',
    atoms: [...Array(47).fill('C'), 'N', ...Array(14).fill('O')],
    smiles: 'CC1=C2[C@@]([C@]([C@H]([C@@H]3[C@]4([C@H](OC4)C[C@@H]([C@]3(C(=O)[C@@H]2OC(=O)C)C)O)OC(=O)C)OC(=O)c5ccccc5)(C[C@@H]1OC(=O)[C@@H](O)[C@@H](NC(=O)c6ccccc6)c7ccccc7)O)(C)C' },

  // ─── Energy ───────────────────────────────────────────────
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
  macromolecule: 'Large Molecules',
};
