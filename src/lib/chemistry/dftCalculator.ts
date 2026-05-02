/**
 * Simulated DFT calculator for educational purposes.
 * Returns realistic ballpark values based on functional/basis combination
 * for the molecules already in the platform's library.
 */
import type { MoleculeData } from './moleculeData';

export type DFTFunctional = 'B3LYP' | 'PBE' | 'M06-2X' | 'BLYP';
export type DFTBasis =
  | 'STO-3G'
  | '6-31G'
  | '6-31G*'
  | '6-311G**'
  | 'cc-pVDZ'
  | 'cc-pVTZ';

export interface DFTResult {
  groundStateEnergy: number; // Hartree
  homo: number; // eV
  lumo: number; // eV
  gap: number; // eV
  dipole: number; // Debye
  converged: boolean;
  functional: DFTFunctional;
  basis: DFTBasis;
}

const FUNCTIONAL_DESCRIPTIONS: Record<DFTFunctional, string> = {
  B3LYP: 'Hybrid functional — most popular general-purpose DFT (Becke 3-parameter Lee-Yang-Parr).',
  PBE: 'Pure GGA functional — fast, good for solids and large systems.',
  'M06-2X': 'Meta-hybrid — excellent for thermochemistry & non-covalent interactions.',
  BLYP: 'Pure GGA functional — Becke exchange + LYP correlation, good baseline.',
};

const BASIS_DESCRIPTIONS: Record<DFTBasis, { desc: string; difficulty: 'beginner' | 'intermediate' | 'advanced' | 'research' }> = {
  'STO-3G': { desc: 'Minimal basis — fastest, lowest accuracy.', difficulty: 'beginner' },
  '6-31G': { desc: 'Split-valence — standard educational basis.', difficulty: 'intermediate' },
  '6-31G*': { desc: 'Adds polarization on heavy atoms — good for organics.', difficulty: 'advanced' },
  '6-311G**': { desc: 'Triple-zeta + polarization on H — high accuracy.', difficulty: 'advanced' },
  'cc-pVDZ': { desc: 'Correlation-consistent double-zeta — research grade.', difficulty: 'research' },
  'cc-pVTZ': { desc: 'Correlation-consistent triple-zeta — high cost / high accuracy.', difficulty: 'research' },
};

export function getFunctionalDescription(f: DFTFunctional): string {
  return FUNCTIONAL_DESCRIPTIONS[f];
}

export function getBasisInfo(b: DFTBasis) {
  return BASIS_DESCRIPTIONS[b];
}

export const FUNCTIONALS: DFTFunctional[] = ['B3LYP', 'PBE', 'M06-2X', 'BLYP'];
export const BASES: DFTBasis[] = ['STO-3G', '6-31G', '6-31G*', '6-311G**', 'cc-pVDZ', 'cc-pVTZ'];

// Tabulated reference values for H2/B3LYP/STO-3G + scaling for other combos
const FUNCTIONAL_OFFSET: Record<DFTFunctional, number> = {
  B3LYP: 0.0,
  PBE: 0.005,
  'M06-2X': -0.003,
  BLYP: 0.008,
};

const BASIS_OFFSET: Record<DFTBasis, number> = {
  'STO-3G': 0.0,
  '6-31G': -0.02,
  '6-31G*': -0.025,
  '6-311G**': -0.03,
  'cc-pVDZ': -0.028,
  'cc-pVTZ': -0.034,
};

const BASIS_GAP_SCALE: Record<DFTBasis, number> = {
  'STO-3G': 1.0,
  '6-31G': 0.92,
  '6-31G*': 0.88,
  '6-311G**': 0.85,
  'cc-pVDZ': 0.86,
  'cc-pVTZ': 0.82,
};

export async function runDFT(
  molecule: MoleculeData,
  functional: DFTFunctional,
  basis: DFTBasis
): Promise<DFTResult> {
  // Simulate compute time
  await new Promise((r) => setTimeout(r, 1200));

  const baseEnergy = molecule.expectedGroundStateEnergy * 1.005;
  const energy = baseEnergy + FUNCTIONAL_OFFSET[functional] + BASIS_OFFSET[basis];

  // For H2 specifically the brief asked for HOMO -15.4, LUMO 4.8, gap 20.2
  let homo: number;
  let lumo: number;
  if (molecule.id === 'h2') {
    homo = -15.4;
    lumo = 4.8;
  } else {
    // Approximate from electron count and functional
    homo = -10 - molecule.electrons * 0.4 + FUNCTIONAL_OFFSET[functional] * 50;
    lumo = homo + 6 + Math.abs(molecule.expectedGroundStateEnergy) * 0.05;
  }
  const gap = (lumo - homo) * BASIS_GAP_SCALE[basis];

  // Dipole — H2 is symmetric so 0.00
  const dipole = molecule.atoms.length <= 2 && new Set(molecule.atoms.map((a) => a.symbol)).size === 1
    ? 0.0
    : Math.min(4.5, molecule.atoms.length * 0.35);

  return {
    groundStateEnergy: Number(energy.toFixed(4)),
    homo: Number(homo.toFixed(2)),
    lumo: Number(lumo.toFixed(2)),
    gap: Number(gap.toFixed(2)),
    dipole: Number(dipole.toFixed(2)),
    converged: true,
    functional,
    basis,
  };
}

export function reactivityFromGap(gapEv: number): { label: 'Low' | 'Medium' | 'High'; description: string } {
  if (gapEv > 6) return { label: 'Low', description: 'Wide gap — chemically stable, low reactivity' };
  if (gapEv >= 3) return { label: 'Medium', description: 'Moderate gap — typical organic reactivity' };
  return { label: 'High', description: 'Narrow gap — reactive / conducting character' };
}
