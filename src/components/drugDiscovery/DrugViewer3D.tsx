// Accurate drug 3D viewer using RDKit.js (structure perception + 3D
// embedding) and 3Dmol.js (WebGL rendering). Replaces the previous
// Three.js renderer that showed wrong geometry for custom compounds.

import type { DrugCandidate } from '@/lib/drugDiscovery/drugData';
import { Molecule3DViewer } from '@/components/chemistry/Molecule3DViewer';

interface DrugViewer3DProps {
  drug: DrugCandidate;
  showLabels?: boolean;
  height?: number;
}

export function DrugViewer3D({ drug, height = 240 }: DrugViewer3DProps) {
  const heavy = drug.atoms.filter((a) => a.symbol !== 'H').length || undefined;

  return (
    <Molecule3DViewer
      smiles={drug.smiles}
      label={drug.formula}
      heavyAtoms={heavy}
      height={height}
    />
  );
}
