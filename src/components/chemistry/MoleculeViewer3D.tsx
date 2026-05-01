// Backwards-compatible wrapper: the old Three.js renderer rendered atoms
// from raw coordinates which produced wrong bonds for custom-built
// molecules. We now delegate to the RDKit/3Dmol pipeline whenever a
// SMILES is available (custom molecules + curated library) and only fall
// back to a coordinate-based renderer when no SMILES exists.

import { MoleculeData } from '@/lib/chemistry/moleculeData';
import { Molecule3DViewer } from './Molecule3DViewer';

interface MoleculeViewer3DProps {
  molecule: MoleculeData;
  showLabels?: boolean;
  showBondLengths?: boolean;
  height?: number;
}

export function MoleculeViewer3D({ molecule, height = 300 }: MoleculeViewer3DProps) {
  const heavy = molecule.atoms.filter((a) => a.symbol !== 'H').length;

  return (
    <Molecule3DViewer
      smiles={molecule.smiles}
      label={molecule.formula}
      heavyAtoms={heavy}
      height={height}
    />
  );
}
