/**
 * EDUCATIONAL DFT Estimator
 * 
 * This module does NOT perform real Density Functional Theory calculations.
 * There are no SCF iterations, no basis function evaluations, no numerical
 * integration grids, and no exchange-correlation functional evaluations.
 * 
 * Instead, it uses tabulated offsets from the molecule's preset ground-state
 * energy to produce ballpark results that vary plausibly with functional and
 * basis set choice. The functional names (B3LYP, PBE, M06-2X, BLYP), basis
 * sets (cc-pVTZ, def2-TZVP), and relativistic treatments (ZORA, DKH, Spin-Orbit)
 * are educational labels applied to lookup tables — they do not drive real
 * computations.
 * 
 * For real DFT, integrate a WASM-compiled backend such as Psi4 or PySCF.
 */
import type { MoleculeData } from './moleculeData';

export type DFTFunctional = 'B3LYP' | 'PBE' | 'M06-2X' | 'BLYP';
export type DFTBasis =
  | 'STO-3G'
  | '6-31G'
  | '6-31G*'
  | '6-311G**'
  | 'cc-pVDZ'
  | 'cc-pVTZ'
  | 'LANL2DZ'
  | 'SDD'
  | 'def2-TZVP'
  | 'cc-pVnZ-PP';

export type RelativisticTreatment = 'None' | 'Scalar ZORA' | 'DKH' | 'Spin-Orbit';

export interface DFTResult {
  groundStateEnergy: number; // Hartree
  homo: number; // eV
  lumo: number; // eV
  gap: number; // eV
  dipole: number; // Debye
  converged: boolean;
  functional: DFTFunctional;
  basis: DFTBasis;
  relativistic: RelativisticTreatment;
  /** Always true — this module uses tabulated estimates, not real SCF. */
  isHeuristic: boolean;
  /** Describes how the result was computed. */
  methodology: 'tabulated-estimator' | 'real-scf';
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
  'LANL2DZ': { desc: 'Los Alamos ECP double-zeta — good for transition metals/heavy atoms.', difficulty: 'research' },
  'SDD': { desc: 'Stuttgart-Dresden ECP — standard for actinides/heavy elements.', difficulty: 'research' },
  'def2-TZVP': { desc: 'Ahlrichs triple-zeta + ECP — robust for heavy systems.', difficulty: 'research' },
  'cc-pVnZ-PP': { desc: 'Correlation-consistent + pseudopotentials.', difficulty: 'research' },
};

export const RELATIVISTIC_DESCRIPTIONS: Record<RelativisticTreatment, string> = {
  'None': 'No relativistic corrections (Schrödinger equation only). Valid for light atoms.',
  'Scalar ZORA': 'Zeroth-Order Regular Approximation (scalar only). Essential for heavy atoms.',
  'DKH': 'Douglas-Kroll-Hess. High accuracy scalar relativistic treatment.',
  'Spin-Orbit': 'Includes spin-orbit coupling. Critical for actinide spectroscopy and gaps.',
};

export function getFunctionalDescription(f: DFTFunctional): string {
  return FUNCTIONAL_DESCRIPTIONS[f];
}

export function getRelativisticDescription(r: RelativisticTreatment): string {
  return RELATIVISTIC_DESCRIPTIONS[r];
}

export function getBasisInfo(b: DFTBasis) {
  return BASIS_DESCRIPTIONS[b];
}

export const FUNCTIONALS: DFTFunctional[] = ['B3LYP', 'PBE', 'M06-2X', 'BLYP'];
export const BASES: DFTBasis[] = ['STO-3G', '6-31G', '6-31G*', '6-311G**', 'cc-pVDZ', 'cc-pVTZ', 'LANL2DZ', 'SDD', 'def2-TZVP', 'cc-pVnZ-PP'];
export const RELATIVISTIC_TREATMENTS: RelativisticTreatment[] = ['None', 'Scalar ZORA', 'DKH', 'Spin-Orbit'];

export function hasHeavyAtoms(molecule: MoleculeData): boolean {
  // Rough definition: anything heavier than Ar (atomic number > 18)
  // For actinides specifically: Ac, Th, Pa, U, Np, Pu, Am, Cm, Bk, Cf, Es, Fm, Md, No, Lr
  const heavyAtoms = ['Bk', 'U', 'Th', 'Pu', 'Np', 'Am', 'Cm', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr', 'Ac', 'Pa', 'W', 'Pt', 'Au', 'Hg', 'Tl', 'Pb', 'Bi'];
  return molecule.atoms.some(a => heavyAtoms.includes(a.symbol));
}

export function validateBasisSet(molecule: MoleculeData, basis: DFTBasis): { valid: boolean; message?: string } {
  const isHeavy = hasHeavyAtoms(molecule);
  const isAllElectronBasis = ['STO-3G', '6-31G', '6-31G*', '6-311G**', 'cc-pVDZ', 'cc-pVTZ'].includes(basis);
  
  if (isHeavy && isAllElectronBasis) {
    return {
      valid: false,
      message: `Basis set ${basis} is an all-electron basis designed for light atoms. For molecules with heavy atoms or actinides (like ${molecule.atoms.find(a => ['Bk', 'U', 'Th', 'Pu'].includes(a.symbol))?.symbol || 'heavy metals'}), you MUST use an ECP/pseudopotential basis set (LANL2DZ, SDD, def2-TZVP, cc-pVnZ-PP).`
    };
  }
  return { valid: true };
}

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
  'LANL2DZ': -0.015,
  'SDD': -0.018,
  'def2-TZVP': -0.032,
  'cc-pVnZ-PP': -0.036,
};

const BASIS_GAP_SCALE: Record<DFTBasis, number> = {
  'STO-3G': 1.0,
  '6-31G': 0.92,
  '6-31G*': 0.88,
  '6-311G**': 0.85,
  'cc-pVDZ': 0.86,
  'cc-pVTZ': 0.82,
  'LANL2DZ': 0.78,
  'SDD': 0.75,
  'def2-TZVP': 0.80,
  'cc-pVnZ-PP': 0.76,
};

export async function runDFT(
  molecule: MoleculeData,
  functional: DFTFunctional,
  basis: DFTBasis,
  relativistic: RelativisticTreatment = 'None'
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
    
    // Actinides/heavy elements typically have much smaller gaps (metallic/semiconducting)
    if (hasHeavyAtoms(molecule)) {
      lumo = homo + 1.5 + Math.random() * 2.0; // Narrower gap for heavy systems
      if (relativistic === 'Spin-Orbit') lumo -= 0.5; // Spin-orbit splitting reduces gap
    } else {
      lumo = homo + 6 + Math.abs(molecule.expectedGroundStateEnergy) * 0.05;
    }
  }
  // Scale the gap based on basis set
  let scaledGap = (lumo - homo) * BASIS_GAP_SCALE[basis];
  
  if (hasHeavyAtoms(molecule) && relativistic === 'None') {
      // Artificially large gap if no relativistic treatment applied on heavy atom (bad physics)
      scaledGap += 4.0; 
  }
  
  // Adjust HOMO and LUMO symmetrically so that LUMO - HOMO exactly equals the scaled gap
  // This prevents contradictory UI values where the displayed gap doesn't match the displayed orbitals
  const midpoint = (lumo + homo) / 2;
  homo = midpoint - scaledGap / 2;
  lumo = midpoint + scaledGap / 2;

  // Dipole — H2 is symmetric so 0.00
  const dipole = molecule.atoms.length <= 2 && new Set(molecule.atoms.map((a) => a.symbol)).size === 1
    ? 0.0
    : Math.min(4.5, molecule.atoms.length * 0.35);

  return {
    groundStateEnergy: Number(energy.toFixed(4)),
    homo: Number(homo.toFixed(2)),
    lumo: Number(lumo.toFixed(2)),
    gap: Number(scaledGap.toFixed(2)),
    dipole: Number(dipole.toFixed(2)),
    converged: true,
    functional,
    basis,
    relativistic,
    isHeuristic: true,
    methodology: 'tabulated-estimator',
  };
}

export function reactivityFromGap(gapEv: number): { label: 'Low' | 'Medium' | 'High'; description: string } {
  if (gapEv > 6) return { label: 'Low', description: 'Wide gap — chemically stable, low reactivity' };
  if (gapEv >= 3) return { label: 'Medium', description: 'Moderate gap — typical organic reactivity' };
  return { label: 'High', description: 'Narrow gap — reactive / conducting character' };
}
