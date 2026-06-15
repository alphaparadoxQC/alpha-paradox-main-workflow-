/**
 * Client-side SMILES Parser
 * Extracts atoms, bonds, and molecular descriptors from SMILES strings
 * without requiring a backend server.
 *
 * Supports: organic subset atoms, brackets, charges, bond orders,
 * ring closures, branches, and aromatic atoms.
 */

import { MoleculeResponse } from './apiClient';

// Atomic weights for molecular weight calculation
const ATOMIC_WEIGHT: Record<string, number> = {
  H: 1.008, He: 4.003, Li: 6.941, Be: 9.012, B: 10.81, C: 12.011,
  N: 14.007, O: 15.999, F: 18.998, Ne: 20.18, Na: 22.99, Mg: 24.305,
  Al: 26.982, Si: 28.086, P: 30.974, S: 32.06, Cl: 35.45, Ar: 39.948,
  K: 39.098, Ca: 40.078, Ti: 47.867, V: 50.942, Cr: 51.996, Mn: 54.938,
  Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.38, Ga: 69.723,
  Ge: 72.63, As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798, Rb: 85.468,
  Sr: 87.62, Zr: 91.224, Mo: 95.95, Ag: 107.868, Sn: 118.71, Sb: 121.76,
  Te: 127.6, I: 126.904, Xe: 131.293, Cs: 132.905, Ba: 137.327,
  Pt: 195.084, Au: 196.967, Hg: 200.592, Pb: 207.2, Bi: 208.98,
  Bk: 247, U: 238.029,
};

// Default valence for implicit hydrogen calculation
const DEFAULT_VALENCE: Record<string, number[]> = {
  B: [3], C: [4], N: [3, 5], O: [2], F: [1], Si: [4], P: [3, 5],
  S: [2, 4, 6], Cl: [1], Br: [1], I: [1],
};

interface ParsedAtom {
  symbol: string;
  aromatic: boolean;
  charge: number;
  hCount: number | null; // null = implicit
  isotope?: number;
  idx: number;
}

interface ParsedBond {
  from: number;
  to: number;
  order: number; // 1, 2, 3
}

/**
 * Parse a SMILES string into atoms and bonds.
 */
function parseSmiles(smiles: string): { atoms: ParsedAtom[]; bonds: ParsedBond[] } {
  const atoms: ParsedAtom[] = [];
  const bonds: ParsedBond[] = [];
  const stack: number[] = []; // branch stack
  let current = -1; // current atom index
  let nextBondOrder = 1;
  const ringOpenings: Record<number, { atomIdx: number; bondOrder: number }> = {};
  let i = 0;

  while (i < smiles.length) {
    const ch = smiles[i];

    // Branch start/end
    if (ch === '(') {
      stack.push(current);
      i++;
      continue;
    }
    if (ch === ')') {
      current = stack.pop() ?? -1;
      i++;
      continue;
    }

    // Bond order
    if (ch === '-') { nextBondOrder = 1; i++; continue; }
    if (ch === '=') { nextBondOrder = 2; i++; continue; }
    if (ch === '#') { nextBondOrder = 3; i++; continue; }
    if (ch === ':') { nextBondOrder = 1; i++; continue; } // aromatic bond
    if (ch === '/' || ch === '\\') { i++; continue; } // stereo, ignore
    if (ch === '.') { current = -1; i++; continue; } // disconnected

    // Bracket atom [...]
    if (ch === '[') {
      const close = smiles.indexOf(']', i);
      if (close === -1) throw new Error('Unclosed bracket in SMILES');
      const bracketContent = smiles.substring(i + 1, close);
      const atom = parseBracketAtom(bracketContent, atoms.length);
      atoms.push(atom);
      if (current >= 0) {
        bonds.push({ from: current, to: atom.idx, order: nextBondOrder });
        nextBondOrder = 1;
      }
      current = atom.idx;
      i = close + 1;
      // Check ring digits after bracket
      while (i < smiles.length && (smiles[i] >= '0' && smiles[i] <= '9' || smiles[i] === '%')) {
        const ringNum = readRingNumber(smiles, i);
        i = ringNum.nextPos;
        handleRing(ringNum.num, current, nextBondOrder, ringOpenings, bonds);
      }
      continue;
    }

    // Organic subset atom (B, C, N, O, P, S, F, Cl, Br, I, or lowercase aromatic)
    const orgAtom = readOrganicAtom(smiles, i);
    if (orgAtom) {
      const atom: ParsedAtom = {
        symbol: orgAtom.symbol,
        aromatic: orgAtom.aromatic,
        charge: 0,
        hCount: null, // implicit
        idx: atoms.length,
      };
      atoms.push(atom);
      if (current >= 0) {
        bonds.push({ from: current, to: atom.idx, order: nextBondOrder });
        nextBondOrder = 1;
      }
      current = atom.idx;
      i = orgAtom.nextPos;
      // Check ring digits
      while (i < smiles.length && (smiles[i] >= '0' && smiles[i] <= '9' || smiles[i] === '%')) {
        const ringNum = readRingNumber(smiles, i);
        i = ringNum.nextPos;
        handleRing(ringNum.num, current, nextBondOrder, ringOpenings, bonds);
      }
      continue;
    }

    // Skip unknown characters
    i++;
  }

  // Add implicit hydrogens
  addImplicitHydrogens(atoms, bonds);

  return { atoms, bonds };
}

function readOrganicAtom(smiles: string, pos: number): { symbol: string; aromatic: boolean; nextPos: number } | null {
  const ch = smiles[pos];
  // Two-char atoms first
  if (pos + 1 < smiles.length) {
    const two = smiles.substring(pos, pos + 2);
    if (['Cl', 'Br'].includes(two)) return { symbol: two, aromatic: false, nextPos: pos + 2 };
  }
  // Aromatic atoms
  if ('bcnops'.includes(ch)) {
    return { symbol: ch.toUpperCase(), aromatic: true, nextPos: pos + 1 };
  }
  // Regular organic subset
  if ('BCNOSPFI'.includes(ch)) {
    return { symbol: ch, aromatic: false, nextPos: pos + 1 };
  }
  // H as explicit atom in chains
  if (ch === 'H') {
    return { symbol: 'H', aromatic: false, nextPos: pos + 1 };
  }
  return null;
}

function parseBracketAtom(content: string, idx: number): ParsedAtom {
  let pos = 0;
  let isotope: number | undefined;
  let symbol = '';
  let aromatic = false;
  let hCount: number | null = 0;
  let charge = 0;

  // Isotope number
  while (pos < content.length && content[pos] >= '0' && content[pos] <= '9') {
    isotope = (isotope ?? 0) * 10 + parseInt(content[pos]);
    pos++;
  }

  // Symbol (1 or 2 chars)
  if (pos < content.length) {
    if (content[pos] >= 'A' && content[pos] <= 'Z') {
      symbol = content[pos];
      pos++;
      if (pos < content.length && content[pos] >= 'a' && content[pos] <= 'z') {
        symbol += content[pos];
        pos++;
      }
    } else if (content[pos] >= 'a' && content[pos] <= 'z') {
      symbol = content[pos].toUpperCase();
      aromatic = true;
      pos++;
    }
  }

  // H count
  if (pos < content.length && content[pos] === 'H') {
    pos++;
    if (pos < content.length && content[pos] >= '0' && content[pos] <= '9') {
      hCount = parseInt(content[pos]);
      pos++;
    } else {
      hCount = 1;
    }
  }

  // Charge
  if (pos < content.length) {
    if (content[pos] === '+') {
      pos++;
      charge = 1;
      if (pos < content.length && content[pos] >= '0' && content[pos] <= '9') {
        charge = parseInt(content[pos]);
        pos++;
      }
    } else if (content[pos] === '-') {
      pos++;
      charge = -1;
      if (pos < content.length && content[pos] >= '0' && content[pos] <= '9') {
        charge = -parseInt(content[pos]);
        pos++;
      }
    }
  }

  return { symbol: symbol || 'C', aromatic, charge, hCount, isotope, idx };
}

function readRingNumber(smiles: string, pos: number): { num: number; nextPos: number } {
  if (smiles[pos] === '%' && pos + 2 < smiles.length) {
    const num = parseInt(smiles.substring(pos + 1, pos + 3));
    return { num, nextPos: pos + 3 };
  }
  return { num: parseInt(smiles[pos]), nextPos: pos + 1 };
}

function handleRing(
  ringNum: number, atomIdx: number, bondOrder: number,
  ringOpenings: Record<number, { atomIdx: number; bondOrder: number }>,
  bonds: ParsedBond[]
) {
  if (ringOpenings[ringNum] !== undefined) {
    const opening = ringOpenings[ringNum];
    bonds.push({ from: opening.atomIdx, to: atomIdx, order: Math.max(opening.bondOrder, bondOrder) });
    delete ringOpenings[ringNum];
  } else {
    ringOpenings[ringNum] = { atomIdx, bondOrder };
  }
}

function addImplicitHydrogens(atoms: ParsedAtom[], bonds: ParsedBond[]) {
  // Calculate bond count per atom
  const bondCount = new Array(atoms.length).fill(0);
  for (const b of bonds) {
    bondCount[b.from] += b.order;
    bondCount[b.to] += b.order;
  }

  for (const atom of atoms) {
    if (atom.hCount !== null) continue; // explicit H count set
    const valences = DEFAULT_VALENCE[atom.symbol];
    if (!valences) { atom.hCount = 0; continue; }
    const bc = bondCount[atom.idx] + (atom.aromatic ? 1 : 0);
    // Find lowest valid valence >= bond count
    const targetValence = valences.find(v => v >= bc) ?? valences[valences.length - 1];
    atom.hCount = Math.max(0, targetValence - bc);
  }
}

/**
 * Build a MoleculeResponse from a SMILES string (client-side only).
 */
export function parseSmilesClientSide(smiles: string): MoleculeResponse {
  const { atoms: parsedAtoms, bonds: parsedBonds } = parseSmiles(smiles.trim());

  if (parsedAtoms.length === 0) {
    throw new Error('Invalid SMILES: no atoms found');
  }

  // Expand to full atom list including implicit H
  const allAtoms: { symbol: string; x: number; y: number; z: number }[] = [];
  const allBonds: { start_atom: number; end_atom: number; bond_type: number }[] = [];
  const atomIndexMap: number[] = []; // parsedAtom idx -> allAtoms idx

  // Place heavy atoms in a circle
  for (let i = 0; i < parsedAtoms.length; i++) {
    const angle = (2 * Math.PI * i) / Math.max(parsedAtoms.length, 1);
    const r = Math.max(1.5, parsedAtoms.length * 0.3);
    allAtoms.push({
      symbol: parsedAtoms[i].symbol,
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      z: 0,
    });
    atomIndexMap.push(allAtoms.length - 1);
  }

  // Add bonds between heavy atoms
  for (const b of parsedBonds) {
    allBonds.push({
      start_atom: atomIndexMap[b.from],
      end_atom: atomIndexMap[b.to],
      bond_type: b.order,
    });
  }

  // Add implicit Hs
  for (const atom of parsedAtoms) {
    const hc = atom.hCount ?? 0;
    const parentIdx = atomIndexMap[atom.idx];
    const parent = allAtoms[parentIdx];
    for (let h = 0; h < hc; h++) {
      const a = (2 * Math.PI * h) / Math.max(hc, 1) + atom.idx;
      allAtoms.push({
        symbol: 'H',
        x: parent.x + Math.cos(a) * 1.0,
        y: parent.y + Math.sin(a) * 1.0,
        z: 0.3 * (h % 2 === 0 ? 1 : -1),
      });
      allBonds.push({ start_atom: parentIdx, end_atom: allAtoms.length - 1, bond_type: 1 });
    }
  }

  // Build formula
  const elemCounts = new Map<string, number>();
  for (const a of allAtoms) {
    elemCounts.set(a.symbol, (elemCounts.get(a.symbol) || 0) + 1);
  }
  // Hill system: C first, H second, rest alphabetical
  const formulaParts: string[] = [];
  const addPart = (sym: string) => {
    const n = elemCounts.get(sym);
    if (n) {
      formulaParts.push(n === 1 ? sym : `${sym}${n}`);
      elemCounts.delete(sym);
    }
  };
  addPart('C');
  addPart('H');
  for (const sym of [...elemCounts.keys()].sort()) addPart(sym);
  const formula = formulaParts.join('');

  // Molecular weight
  const mw = allAtoms.reduce((s, a) => s + (ATOMIC_WEIGHT[a.symbol] || 12), 0);

  // Count H-bond donors (N-H, O-H), acceptors (N, O, F)
  const hBondDonors = parsedAtoms.filter(a =>
    ['N', 'O'].includes(a.symbol) && (a.hCount ?? 0) > 0
  ).length;
  const hBondAcceptors = parsedAtoms.filter(a =>
    ['N', 'O', 'F'].includes(a.symbol)
  ).length;

  // Rough LogP estimate (Wildman-Crippen style)
  const logP = parsedAtoms.reduce((s, a) => {
    if (a.symbol === 'C') return s + 0.1441;
    if (a.symbol === 'N') return s - 0.7567;
    if (a.symbol === 'O') return s - 0.4802;
    if (a.symbol === 'S') return s + 0.6;
    if (a.symbol === 'F') return s + 0.375;
    if (a.symbol === 'Cl') return s + 0.871;
    if (a.symbol === 'Br') return s + 1.126;
    return s;
  }, 0);

  // TPSA (simplified: 20.23 per N, 9.23 per O as N/O polar surface)
  const tpsa = parsedAtoms.reduce((s, a) => {
    if (a.symbol === 'N') return s + 26.02;
    if (a.symbol === 'O') return s + 17.07;
    return s;
  }, 0);

  // Rotatable bonds (rough: count single bonds between two non-H, non-ring heavy atoms)
  const rotatableBonds = parsedBonds.filter(b =>
    b.order === 1 && parsedAtoms[b.from].symbol !== 'H' && parsedAtoms[b.to].symbol !== 'H'
  ).length;

  // Determine charge & multiplicity
  const totalCharge = parsedAtoms.reduce((s, a) => s + a.charge, 0);

  // Determine name from known SMILES
  const name = guessName(smiles) || formula;

  return {
    molecule: {
      name,
      formula,
      smiles,
      charge: totalCharge,
      multiplicity: 1,
      atoms: allAtoms,
      bonds: allBonds,
    },
    descriptors: {
      molecular_weight: mw,
      logp: Math.round(logP * 100) / 100,
      h_bond_donors: hBondDonors,
      h_bond_acceptors: hBondAcceptors,
      tpsa: Math.round(tpsa * 100) / 100,
      rotatable_bonds: rotatableBonds,
    },
  };
}

/** Guess molecule name from common SMILES */
function guessName(smiles: string): string {
  const known: Record<string, string> = {
    'O': 'Water', 'N': 'Ammonia', 'C': 'Methane', '[H][H]': 'Hydrogen',
    'CC': 'Ethane', 'C=C': 'Ethylene', 'C#C': 'Acetylene',
    'CCO': 'Ethanol', 'CO': 'Methanol', 'C=O': 'Formaldehyde',
    'CC=O': 'Acetaldehyde', 'CC(=O)O': 'Acetic Acid',
    'c1ccccc1': 'Benzene', 'C1=CC=CC=C1': 'Benzene',
    'O=C=O': 'Carbon Dioxide', 'O=O': 'Oxygen', 'N#N': 'Nitrogen',
    'CC(=O)Oc1ccccc1C(=O)O': 'Aspirin',
    'NCC(=O)O': 'Glycine', 'NC(=O)N': 'Urea', 'C#N': 'Hydrogen Cyanide',
    'OO': 'Hydrogen Peroxide', '[LiH]': 'Lithium Hydride', '[BeH2]': 'Beryllium Hydride',
    'Cl': 'Hydrochloric Acid', 'F': 'Hydrogen Fluoride',
    'Cn1cnc2c1c(=O)n(C)c(=O)n2C': 'Caffeine',
    'CC(=O)Nc1ccc(O)cc1': 'Acetaminophen',
    'NCCc1ccc(O)c(O)c1': 'Dopamine',
  };
  return known[smiles] || '';
}
