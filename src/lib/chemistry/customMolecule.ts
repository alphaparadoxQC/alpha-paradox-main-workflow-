// Build a MoleculeData from a list of element symbols using simple
// VSEPR-style geometry heuristics so the user can pick any atoms,
// arrange them into a molecule and run a VQE simulation.

import { MoleculeData, Atom, Bond } from './moleculeData';
import { ELEMENTS, ElementData, getElementBySymbol } from './periodicTable';
import { atomsToSmiles } from './smilesBuilder';

export interface CustomAtomSelection {
  symbol: string;
  count: number;
}

/**
 * Choose a "central" atom from the selection: highest valence wins,
 * then highest atomic number. Falls back to first element.
 */
function pickCentralElement(elements: ElementData[]): ElementData {
  return [...elements].sort((a, b) => {
    if (b.valence !== a.valence) return b.valence - a.valence;
    return b.number - a.number;
  })[0];
}

/**
 * Place `n` ligand atoms around a central atom using ideal VSEPR geometries.
 * Returns an array of unit vectors.
 */
function vseprDirections(n: number): [number, number, number][] {
  switch (n) {
    case 1: return [[1, 0, 0]];
    case 2: return [[-1, 0, 0], [1, 0, 0]]; // linear
    case 3: { // trigonal planar
      const a = (2 * Math.PI) / 3;
      return [
        [1, 0, 0],
        [Math.cos(a), Math.sin(a), 0],
        [Math.cos(2 * a), Math.sin(2 * a), 0],
      ];
    }
    case 4: { // tetrahedral
      return [
        [1, 1, 1],
        [-1, -1, 1],
        [-1, 1, -1],
        [1, -1, -1],
      ].map(([x, y, z]) => {
        const m = Math.sqrt(x * x + y * y + z * z);
        return [x / m, y / m, z / m] as [number, number, number];
      });
    }
    case 5: { // trigonal bipyramidal
      const eq = (2 * Math.PI) / 3;
      return [
        [0, 0, 1], [0, 0, -1],
        [1, 0, 0],
        [Math.cos(eq), Math.sin(eq), 0],
        [Math.cos(2 * eq), Math.sin(2 * eq), 0],
      ];
    }
    case 6: { // octahedral
      return [
        [1, 0, 0], [-1, 0, 0],
        [0, 1, 0], [0, -1, 0],
        [0, 0, 1], [0, 0, -1],
      ];
    }
    default: {
      // distribute on a Fibonacci sphere
      const dirs: [number, number, number][] = [];
      const phi = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < n; i++) {
        const y = 1 - (i / (n - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const theta = phi * i;
        dirs.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
      }
      return dirs;
    }
  }
}

/**
 * Build a MoleculeData from a flat list of element symbols.
 * Simple heuristic: highest-valence atom is central, others are ligands.
 */
export function buildCustomMolecule(symbols: string[]): MoleculeData | null {
  const elements = symbols
    .map(s => getElementBySymbol(s))
    .filter((e): e is ElementData => !!e);
  if (elements.length === 0) return null;

  // Single atom — render alone
  if (elements.length === 1) {
    const e = elements[0];
    const atoms: Atom[] = [{ symbol: e.symbol, position: [0, 0, 0], color: e.color, radius: e.covalentRadius }];
    return makeMolecule(elements, atoms, []);
  }

  const central = pickCentralElement(elements);
  const centralIdx = elements.indexOf(central);
  const ligands = elements.filter((_, i) => i !== centralIdx);

  const dirs = vseprDirections(ligands.length);

  const atoms: Atom[] = [
    { symbol: central.symbol, position: [0, 0, 0], color: central.color, radius: central.covalentRadius },
  ];
  const bonds: Bond[] = [];

  ligands.forEach((lig, i) => {
    const bondLen = central.covalentRadius + lig.covalentRadius;
    const [dx, dy, dz] = dirs[i];
    atoms.push({
      symbol: lig.symbol,
      position: [dx * bondLen, dy * bondLen, dz * bondLen],
      color: lig.color,
      radius: lig.covalentRadius,
    });
    bonds.push({ atom1Index: 0, atom2Index: i + 1, order: 1, length: bondLen });
  });

  return makeMolecule(elements, atoms, bonds);
}

function makeMolecule(
  elements: ElementData[],
  atoms: Atom[],
  bonds: Bond[]
): MoleculeData {
  const electrons = elements.reduce((sum, e) => sum + e.number, 0);
  const formula = formatFormula(elements.map(e => e.symbol));

  // Heuristic qubit count: 2 spin-orbitals per valence pair, capped to keep
  // simulations responsive in the browser. Min 4 qubits, max 14.
  const valenceElectrons = elements.reduce((s, e) => s + e.valence, 0);
  const qubitsRequired = Math.max(4, Math.min(14, valenceElectrons * 2));
  const vqeDepth = Math.max(2, Math.min(8, Math.ceil(qubitsRequired / 2)));

  return {
    id: `custom-${elements.map(e => e.symbol).join('-').toLowerCase()}`,
    name: `Custom ${formula}`,
    formula,
    smiles: atomsToSmiles(elements.map(e => e.symbol)),
    atoms,
    bonds,
    angles: [],
    electrons,
    // Rough estimate: scale with electron count (Ha). Just a target reference.
    expectedGroundStateEnergy: -0.5 * electrons * 1.1,
    orbitals: elements.flatMap((e, i) => ([
      { name: `σ${i + 1}`, energy: -20 - i * 5, electrons: Math.min(2, e.valence), type: 'bonding' as const },
    ])),
    qubitsRequired,
    vqeDepth,
  };
}

function formatFormula(symbols: string[]): string {
  const counts = new Map<string, number>();
  symbols.forEach(s => counts.set(s, (counts.get(s) || 0) + 1));
  const subscripts: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  };
  return Array.from(counts.entries())
    .map(([sym, n]) => n === 1 ? sym : sym + String(n).split('').map(d => subscripts[d]).join(''))
    .join('');
}
