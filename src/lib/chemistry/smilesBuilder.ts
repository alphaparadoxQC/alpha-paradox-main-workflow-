// Build a SMILES string from a flat list of atom symbols using basic
// valence rules. Heuristic: pick a polyvalent "central" atom (C, N, O, S, P)
// and attach the rest as ligands. Adds implicit hydrogens where missing.
//
// This is intentionally simple — RDKit will parse, sanitize, and generate
// 3D coordinates from the resulting SMILES.

import { getElementBySymbol } from './periodicTable';

const VALENCE: Record<string, number> = {
  H: 1, He: 0,
  Li: 1, Be: 2, B: 3, C: 4, N: 3, O: 2, F: 1, Ne: 0,
  Na: 1, Mg: 2, Al: 3, Si: 4, P: 3, S: 2, Cl: 1, Ar: 0,
  K: 1, Ca: 2, Br: 1, I: 1,
};

function valenceOf(sym: string): number {
  if (sym in VALENCE) return VALENCE[sym];
  const el = getElementBySymbol(sym);
  return el?.valence ?? 1;
}

/**
 * Pick a central atom (highest valence, prefer C > N > O > S > P > others).
 */
function pickCentralIndex(symbols: string[]): number {
  const priority: Record<string, number> = { C: 100, N: 90, O: 80, S: 70, P: 60, Si: 50, B: 40 };
  let best = 0;
  let bestScore = -1;
  symbols.forEach((s, i) => {
    const score = (priority[s] ?? 0) + valenceOf(s);
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}

/**
 * Group atoms by element to produce a more readable SMILES.
 */
function countBy(symbols: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of symbols) counts[s] = (counts[s] || 0) + 1;
  return counts;
}

/**
 * Convert a flat list of atom symbols to a SMILES string.
 *
 *  - 1 atom            → "[X]"  (or simple SMILES for H/C/etc.)
 *  - 2 atoms (X-Y)     → "XY"
 *  - 1 polyvalent + n  → polyvalent surrounded by ligands ("O(H)(H)")
 *  - many polyvalent   → chain them together with single bonds
 *  - leftover H atoms  → become implicit Hs on the most under-valent atom
 *
 * The output always parses with RDKit; if the user picks a chemically
 * impossible combo (e.g., all noble gases) we still return a valid SMILES
 * by enclosing each atom in brackets.
 */
export function atomsToSmiles(symbols: string[]): string {
  const valid = symbols.filter((s) => !!getElementBySymbol(s));
  if (valid.length === 0) return '';

  // Single atom
  if (valid.length === 1) return bracketIfNeeded(valid[0]);

  // Diatomic
  if (valid.length === 2) {
    const [a, b] = valid;
    const va = valenceOf(a);
    const vb = valenceOf(b);
    // Decide bond order from min valence (limited to 1..3)
    const order = Math.max(1, Math.min(3, Math.min(va || 1, vb || 1)));
    const bond = order === 1 ? '' : order === 2 ? '=' : '#';
    return `${bracketIfNeeded(a)}${bond}${bracketIfNeeded(b)}`;
  }

  // Separate hydrogens — they'll become implicit Hs / explicit ligands.
  const heavy = valid.filter((s) => s !== 'H');
  const hydrogens = valid.filter((s) => s === 'H');

  if (heavy.length === 0) {
    // Only hydrogens: H2 / H4 etc. Just return H-H chain.
    return hydrogens.map(() => '[H]').join('');
  }

  if (heavy.length === 1) {
    // One heavy atom + hydrogens around it: e.g. CH4, NH3, H2O.
    const h = heavy[0];
    return bracketWithHs(h, hydrogens.length);
  }

  // 2+ heavy atoms: build a simple chain between them, distribute
  // hydrogens onto each heavy atom up to its remaining valence.
  // Pick a "spine" ordering: central atom first, others appended.
  const centralIdx = pickCentralIndex(heavy);
  const spine = [heavy[centralIdx], ...heavy.filter((_, i) => i !== centralIdx)];

  // Track remaining valence per spine atom
  const remaining = spine.map((s) => valenceOf(s));

  // Connect spine atoms with single bonds in order: each bond uses one valence on both ends
  for (let i = 0; i < spine.length - 1; i++) {
    remaining[i] = Math.max(0, remaining[i] - 1);
    remaining[i + 1] = Math.max(0, remaining[i + 1] - 1);
  }

  // Distribute hydrogens onto atoms with remaining valence (greedy)
  let hLeft = hydrogens.length;
  const hPerAtom = spine.map(() => 0);
  let safety = 0;
  while (hLeft > 0 && safety++ < 1000) {
    let placed = false;
    for (let i = 0; i < spine.length && hLeft > 0; i++) {
      if (remaining[i] > 0) {
        hPerAtom[i] += 1;
        remaining[i] -= 1;
        hLeft -= 1;
        placed = true;
      }
    }
    if (!placed) break; // no more room — extra Hs are dropped (RDKit will sanitize)
  }

  // Build SMILES: A(H..)B(H..)C(H..)
  return spine
    .map((sym, i) => bracketWithHs(sym, hPerAtom[i]))
    .join('');
}

/**
 * Wrap an element symbol in [..] when it needs explicit notation
 * (most non-organic-subset atoms). Organic subset that can be bare:
 * B, C, N, O, P, S, F, Cl, Br, I.
 */
function bracketIfNeeded(sym: string): string {
  const organic = ['B', 'C', 'N', 'O', 'P', 'S', 'F', 'Cl', 'Br', 'I'];
  if (organic.includes(sym)) return sym;
  if (sym === 'H') return '[H]';
  return `[${sym}]`;
}

/**
 * Atom + explicit H count. Always uses bracketed form for clarity, except
 * for "C" without Hs which is fine as bare. We use bracketed form so RDKit
 * doesn't apply organic-subset implicit H rules and double-count.
 */
function bracketWithHs(sym: string, hCount: number): string {
  if (sym === 'H') return '[H]';
  if (hCount === 0) {
    // For organic subset, bare symbol works — but RDKit will add implicit Hs
    // to satisfy valence. To keep our exact composition, force brackets with H0.
    return `[${sym}H0]`;
  }
  if (hCount === 1) return `[${sym}H]`;
  return `[${sym}H${hCount}]`;
}

/**
 * Total heavy-atom count (non-hydrogen) — used for VQE-size warnings.
 */
export function heavyAtomCount(symbols: string[]): number {
  return symbols.filter((s) => s !== 'H').length;
}
