// Singleton loader for RDKit.js (cheminformatics) and 3Dmol.js (WebGL viewer)
// Both libraries are loaded from CDN to keep our bundle slim.
//
// 3D-coordinate strategy:
//   1. Ask the NCI CADD resolver for an SDF (real 3D coords from a server-side
//      RDKit / OpenBabel pipeline) — this is the same approach Jmol uses.
//   2. If that's unreachable, fall back to RDKit-JS 2D coordinates (still
//      better than rendering arbitrary atom clouds).

declare global {
  interface Window {
    initRDKitModule?: (opts?: { locateFile?: (f: string) => string }) => Promise<RDKitModule>;
    RDKit?: RDKitModule;
    $3Dmol?: any;
  }
}

export interface RDKitMol {
  is_valid(): boolean;
  get_molblock(): string;
  get_smiles(): string;
  set_new_coords?(useCoordGen?: boolean): boolean;
  delete(): void;
}

export interface RDKitModule {
  get_mol(smiles: string, details?: string): RDKitMol;
  version?(): string;
}

const RDKIT_VERSION = '2024.3.5';
const RDKIT_BASE = `https://unpkg.com/@rdkit/rdkit@${RDKIT_VERSION}/dist`;
const TDMOL_URL = 'https://3dmol.org/build/3Dmol-min.js';
const NCI_RESOLVER = 'https://cactus.nci.nih.gov/chemical/structure';

let rdkitPromise: Promise<RDKitModule> | null = null;
let tdmolPromise: Promise<any> | null = null;

// Cache successful SMILES → MOL block lookups so we don't hit the network twice
const molblockCache = new Map<string, string>();

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if ((existing as any)._loaded) return resolve();
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)));
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => {
      (s as any)._loaded = true;
      resolve();
    };
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export function loadRDKit(): Promise<RDKitModule> {
  if (typeof window === 'undefined') return Promise.reject(new Error('RDKit needs window'));
  if (window.RDKit) return Promise.resolve(window.RDKit);
  if (rdkitPromise) return rdkitPromise;

  rdkitPromise = loadScript(`${RDKIT_BASE}/RDKit_minimal.js`)
    .then(() => {
      if (!window.initRDKitModule) throw new Error('initRDKitModule not found');
      return window.initRDKitModule({
        locateFile: (file: string) => `${RDKIT_BASE}/${file}`,
      });
    })
    .then((mod) => {
      window.RDKit = mod;
      return mod;
    })
    .catch((e) => {
      rdkitPromise = null;
      throw e;
    });

  return rdkitPromise;
}

export function load3Dmol(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('3Dmol needs window'));
  if (window.$3Dmol) return Promise.resolve(window.$3Dmol);
  if (tdmolPromise) return tdmolPromise;

  tdmolPromise = loadScript(TDMOL_URL)
    .then(() => {
      if (!window.$3Dmol) throw new Error('$3Dmol not found after load');
      return window.$3Dmol;
    })
    .catch((e) => {
      tdmolPromise = null;
      throw e;
    });

  return tdmolPromise;
}

/**
 * Convert a SMILES string into a 3D SDF/MOL block. Tries the NCI/CADD
 * resolver (true 3D, server-side embedding) first, then falls back to
 * RDKit-JS 2D coordinates.
 */
export async function smilesTo3DMolBlock(smiles: string): Promise<{ block: string; format: 'sdf' | 'mol'; is3D: boolean } | null> {
  if (!smiles) return null;
  if (molblockCache.has(smiles)) {
    return { block: molblockCache.get(smiles)!, format: 'sdf', is3D: true };
  }

  // 1. NCI/CADD resolver — returns a 3D SDF
  try {
    const url = `${NCI_RESOLVER}/${encodeURIComponent(smiles)}/file?format=sdf&get3d=true`;
    const res = await fetch(url, { method: 'GET' });
    if (res.ok) {
      const text = await res.text();
      if (text && (text.includes('V2000') || text.includes('V3000'))) {
        molblockCache.set(smiles, text);
        return { block: text, format: 'sdf', is3D: true };
      }
    }
  } catch {
    // Network blocked — fall through to RDKit 2D
  }

  // 2. RDKit-JS 2D fallback. Better than nothing — geometry will be planar
  // but bond perception (incl. aromaticity) is still correct.
  try {
    const rdkit = await loadRDKit();
    const mol = rdkit.get_mol(smiles, JSON.stringify({ removeHs: false }));
    if (!mol || !mol.is_valid()) {
      mol?.delete();
      return null;
    }
    try {
      if (typeof mol.set_new_coords === 'function') mol.set_new_coords(true);
      const block = mol.get_molblock();
      return { block, format: 'mol', is3D: false };
    } finally {
      mol.delete();
    }
  } catch (e) {
    console.warn('[rdkitLoader] RDKit fallback failed:', e);
    return null;
  }
}
