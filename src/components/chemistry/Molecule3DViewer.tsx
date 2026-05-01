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
 * Falls back to an error message if RDKit/3Dmol fail to load (CDN blocked).
 */
export function Molecule3DViewer({
  smiles,
  molBlock,
  label,
  heavyAtoms,
  vqeWarnAt = 10,
  height = 320,
  defaultShowHs = true,
}: Molecule3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHs, setShowHs] = useState(defaultShowHs);

  // Build / rebuild the molecule whenever the input changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const $3Dmol = await load3Dmol();
        if (cancelled || !containerRef.current) return;

        // Resolve mol block: explicit > SMILES → RDKit
        let block = molBlock ?? null;
        if (!block && smiles) {
          block = await smilesTo3DMolBlock(smiles);
          if (!block) throw new Error(`Invalid SMILES: ${smiles}`);
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

        viewer.addModel(block, 'mol');
        applyStyle(viewer, showHs);
        viewer.zoomTo();
        viewer.render();
        viewer.zoom(1.1, 400);

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

  // Toggle hydrogens without rebuilding the molecule
  useEffect(() => {
    if (!viewerRef.current) return;
    try {
      applyStyle(viewerRef.current, showHs);
      viewerRef.current.render();
    } catch { /* noop */ }
  }, [showHs]);

  const tooLargeForVQE = heavyAtoms !== undefined && heavyAtoms > vqeWarnAt;

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

function applyStyle(viewer: any, showHs: boolean) {
  // Reset and apply ball-and-stick with CPK coloring
  viewer.setStyle({}, {
    stick: { radius: 0.12, colorscheme: 'Jmol' },
    sphere: { scale: 0.25, colorscheme: 'Jmol' },
  });
  if (!showHs) {
    // Hide hydrogen atoms entirely
    viewer.setStyle({ elem: 'H' }, { stick: { hidden: true }, sphere: { hidden: true } });
  }
}
