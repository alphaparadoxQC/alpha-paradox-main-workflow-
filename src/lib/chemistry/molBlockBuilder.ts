import { MoleculeData } from './moleculeData';

/**
 * Builds a robust V2000 MOL block from pre-calculated 3D coordinates.
 * This acts as a robust fallback for 3Dmol.js when RDKit fails to parse
 * SMILES containing super-heavy or exotic actinide/transactinide chains
 * (which break standard organic valency rules).
 */
export function buildMolBlock(molecule: MoleculeData): string {
  let out = `${molecule.name || 'Custom Molecule'}\n`;
  out += `  QuantumWorkloadManager 3Dmol Generator\n`;
  out += `\n`;
  
  const numAtoms = String(molecule.atoms.length).padStart(3, ' ');
  const numBonds = String(molecule.bonds.length).padStart(3, ' ');
  
  // Counts line (V2000)
  out += `${numAtoms}${numBonds}  0  0  0  0  0  0  0  0999 V2000\n`;
  
  // Atoms block
  molecule.atoms.forEach(atom => {
    const x = atom.position[0].toFixed(4).padStart(10, ' ');
    const y = atom.position[1].toFixed(4).padStart(10, ' ');
    const z = atom.position[2].toFixed(4).padStart(10, ' ');
    const sym = atom.symbol.padEnd(3, ' ');
    out += `${x}${y}${z} ${sym} 0  0  0  0  0  0  0  0  0  0  0  0\n`;
  });
  
  // Bonds block
  molecule.bonds.forEach(bond => {
    // V2000 is 1-indexed
    const a1 = String(bond.atom1Index + 1).padStart(3, ' ');
    const a2 = String(bond.atom2Index + 1).padStart(3, ' ');
    const order = String(bond.order).padStart(3, ' ');
    out += `${a1}${a2}${order}  0  0  0  0\n`;
  });
  
  out += `M  END\n`;
  return out;
}
