import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { load3Dmol, smilesTo3DMolBlock } from '@/lib/chemistry/rdkitLoader';

export interface Molecule3DViewerProps {
  /** SMILES — preferred input. If provided, RDKit generates 3D coordinates. */
  smiles?: string;
  /** Pre-built MOL block (V2000/V3000) — used when caller already has coords. */
  molBlock?: string;
  /** Fallback MOL block if SMILES parsing fails (for heavy exotic elements). */
  fallbackMolBlock?: string;
  /** Optional formula label shown in the corner. */
  label?: string;
  /** Heavy-atom count used to surface VQE size warnings. */
  heavyAtoms?: number;
  /** Maximum heavy atoms before showing a "too large for VQE" warning. */
  vqeWarnAt?: number;
  /** Container height (px). Default 320. */
  height?: number;
  /** Show hydrogens by default. */
  defaultShowHs?: boolean;
}

/**
 * Accurate 3D molecule viewer powered by RDKit.js (structure perception
 * + 3D embedding) and 3Dmol.js (WebGL rendering with CPK colors and
 * proper bond rendering including aromatics).
 *
 * Automatically adapts rendering mode based on molecule size:
 * - ≤30 atoms: Ball-and-stick (full detail)
 * - 31-80 atoms: Stick-only (cleaner visuals)
 * - >80 atoms: Line representation (fast rendering)
 *
 * Falls back to an error message if RDKit/3Dmol fail to load (CDN blocked).
 */
export function Molecule3DViewer({
  smiles,
  molBlock,
  fallbackMolBlock,
  label,
  heavyAtoms,
  vqeWarnAt = 2000,
  height = 320,
  defaultShowHs = true,
}: Molecule3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHs, setShowHs] = useState(defaultShowHs);
  const [renderMode, setRenderMode] = useState<'auto' | 'ballstick' | 'stick' | 'surface'>('auto');
  const atomCountRef = useRef(0);

  // Build / rebuild the molecule whenever the input changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const $3Dmol = await load3Dmol();
        if (cancelled || !containerRef.current) return;

        let block: string | null = molBlock ?? null;
        let format: 'sdf' | 'mol' = molBlock ? 'sdf' : 'sdf';
        let is3D = !!molBlock;
        if (!block && smiles) {
          try {
            const result = await smilesTo3DMolBlock(smiles);
            if (!result) throw new Error(`Could not parse SMILES: ${smiles}`);
            block = result.block;
            format = result.format;
            is3D = result.is3D;
          } catch (smilesErr) {
            // If RDKit fails (often due to heavy/exotic element valences), use fallback geometric coords if provided
            if (fallbackMolBlock) {
              console.warn('[Molecule3DViewer] RDKit failed, using geometric fallback block.', smilesErr);
              block = fallbackMolBlock;
              format = 'sdf';
              is3D = true;
            } else {
              throw smilesErr;
            }
          }
        }
        if (!block) throw new Error('No molecule provided');
        if (cancelled) return;

        // Tear down any previous viewer
        if (viewerRef.current) {
          try { viewerRef.current.clear(); } catch { /* noop */ }
        }
        containerRef.current.innerHTML = '';

        const viewer = $3Dmol.createViewer(containerRef.current, {
          backgroundColor: '#0b0f1a',
          antialias: true,
        });
        viewerRef.current = viewer;

        viewer.addModel(block, format);
        
        // Count atoms for adaptive rendering
        const model = viewer.getModel();
        const allAtoms = model ? model.selectedAtoms({}) : [];
        const heavyCount = allAtoms.filter((a: any) => a.elem !== 'H').length;
        atomCountRef.current = heavyCount;
        
        applyAdaptiveStyle(viewer, showHs, renderMode, heavyCount);
        viewer.zoomTo();
        viewer.render();
        
        // Adjust zoom based on molecule size
        const zoomFactor = heavyCount > 80 ? 0.9 : heavyCount > 30 ? 1.0 : 1.1;
        viewer.zoom(zoomFactor, 400);

        if (!is3D) {
          console.info('[Molecule3DViewer] Using 2D coordinates (offline fallback) for', smiles);
        }

        if (!cancelled) setLoading(false);
      } catch (e) {
        console.error('[Molecule3DViewer]', e);
        if (!cancelled) {
          setError((e as Error).message || 'Failed to render molecule');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smiles, molBlock]);

  // Toggle hydrogens or render mode without rebuilding the molecule
  useEffect(() => {
    if (!viewerRef.current) return;
    try {
      applyAdaptiveStyle(viewerRef.current, showHs, renderMode, atomCountRef.current);
      viewerRef.current.render();
    } catch { /* noop */ }
  }, [showHs, renderMode]);

  const tooLargeForVQE = heavyAtoms !== undefined && heavyAtoms > vqeWarnAt;

  const cycleRenderMode = () => {
    setRenderMode(prev => {
      if (prev === 'auto') return 'ballstick';
      if (prev === 'ballstick') return 'stick';
      if (prev === 'stick') return 'surface';
      return 'auto';
    });
  };

  const renderModeLabel = renderMode === 'auto' ? 'Auto' 
    : renderMode === 'ballstick' ? 'Ball+Stick' 
    : renderMode === 'stick' ? 'Stick' 
    : 'Surface';

  return (
    <div className="relative w-full rounded-lg border border-border bg-[#0b0f1a] overflow-hidden">
      <div
        ref={containerRef}
        style={{ width: '100%', height }}
        className="relative"
      />

      {/* Loading overlay */}
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center bg-background/80">
          <AlertTriangle className="w-6 h-6 text-destructive" />
          <p className="text-xs text-destructive">{error}</p>
          <p className="text-[10px] text-muted-foreground">
            3D viewer requires network access to load RDKit.js + 3Dmol.js
          </p>
        </div>
      )}

      {/* Top-left badges */}
      <div className="absolute top-2 left-2 flex flex-col gap-1.5 pointer-events-none">
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] gap-1 pointer-events-none">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
           WebGL GPU Accelerated
        </Badge>
        {label && (
          <Badge variant="secondary" className="text-[10px] font-mono pointer-events-auto">
            {label}
          </Badge>
        )}
        {tooLargeForVQE && (
          <Badge variant="destructive" className="text-[10px] gap-1 pointer-events-auto">
            <AlertTriangle className="w-3 h-3" />
            {heavyAtoms} heavy atoms — too large for VQE
          </Badge>
        )}
      </div>

      {/* Top-right controls */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          className="h-7 text-[10px] px-2"
          onClick={cycleRenderMode}
          disabled={loading || !!error}
        >
          {renderModeLabel}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="h-7 text-[10px] px-2"
          onClick={() => setShowHs((v) => !v)}
          disabled={loading || !!error}
        >
          {showHs ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
          {showHs ? 'Hide H' : 'Show H'}
        </Button>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-2 right-2">
        <Badge variant="outline" className="text-[9px] bg-background/60 backdrop-blur-sm">
          Drag to rotate · Scroll to zoom
        </Badge>
      </div>
    </div>
  );
}

/**
 * Adaptive style based on molecule size and user preference.
 * - ≤20 heavy atoms: Ball-and-stick (sphere 0.3)
 * - 21-60 heavy atoms: Stick-only (stick 0.15, no spheres) 
 * - >60 heavy atoms: Line representation (fast)
 */
function applyAdaptiveStyle(viewer: any, showHs: boolean, mode: string, heavyAtomCount: number) {
  // Clear any existing labels
  viewer.removeAllLabels();

  // Determine effective mode (Tuned aggressively to prevent WebGL/GPU lag)
  let effectiveMode = mode;
  if (mode === 'auto') {
    if (heavyAtomCount <= 20) effectiveMode = 'ballstick';
    else if (heavyAtomCount <= 60) effectiveMode = 'stick';
    else effectiveMode = 'line'; // Extreme fallback for 60+ to prevent crash
  }

  if (effectiveMode === 'surface') {
    viewer.setStyle({}, {
      stick: { radius: 0.1, colorscheme: 'Jmol' },
    });
    viewer.addSurface('VDW', {
      opacity: 0.7,
      colorscheme: 'Jmol',
    });
  } else if (effectiveMode === 'stick') {
    // Stick only — clean for large molecules
    viewer.setStyle({}, {
      stick: { radius: 0.12, colorscheme: 'Jmol' },
      sphere: { scale: 0.18, colorscheme: 'Jmol' },
    });
  } else if (effectiveMode === 'line') {
    // Extreme fallback: Line mode only (no spheres, no thick sticks)
    viewer.setStyle({}, {
      line: { colorscheme: 'Jmol', linewidth: 2 }
    });
  } else {
    // Ball-and-stick — full detail
    viewer.setStyle({}, {
      stick: { radius: 0.15, colorscheme: 'Jmol' },
      sphere: { scale: 0.3, colorscheme: 'Jmol' },
    });
  }
  
  if (!showHs) {
    // Hide hydrogen atoms entirely
    viewer.setStyle({ elem: 'H' }, { stick: { hidden: true }, sphere: { hidden: true } });
  }

  // Add atom labels — skip H labels for large molecules to reduce clutter
  const model = viewer.getModel();
  if (model && heavyAtomCount <= 200) { // STRICT cutoff: >200 atoms = no labels, prevents WebGL text sprite crash
    const atoms = model.selectedAtoms({});
    const labelThreshold = heavyAtomCount > 50 ? false : true; // Only label small molecules
    atoms.forEach((atom: any) => {
      if (!showHs && atom.elem === 'H') return;
      if (atom.elem === 'H' && heavyAtomCount > 20) return; // Skip H labels for medium+ molecules
      if (!labelThreshold && atom.elem !== 'C' && atom.elem !== 'N' && atom.elem !== 'O' && atom.elem !== 'S') return;
      viewer.addLabel(atom.elem, {
        position: { x: atom.x, y: atom.y, z: atom.z },
        alignment: "center",
        fontColor: "white",
        fontSize: heavyAtomCount > 50 ? 9 : 12,
        showBackground: false,
        fontWeight: "bold"
      });
    });
  }
}

