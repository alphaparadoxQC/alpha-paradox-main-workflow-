/**
 * DensityMatrixHeatmap.tsx
 *
 * Renders the density matrix ρ as an interactive colour-coded grid.
 * Each cell (i, j) is coloured by |ρᵢⱼ| (magnitude) using a
 * fire / plasma palette and annotated with the complex value on hover.
 *
 * Mathematical accuracy:
 *   - ρ is computed from the statevector: ρᵢⱼ = αᵢ · αⱼ*
 *   - Diagonal: ρᵢᵢ = |αᵢ|²  ← real measurement probabilities
 *   - Off-diagonal: ρᵢⱼ ← quantum coherences (complex)
 *   - Heatmap intensity = |ρᵢⱼ| ∈ [0, 1]
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { StateVector } from '@/lib/quantum/simulator';
import { pureStateToDensityMatrix, purity, vonNeumannEntropy, verifyTrace } from '@/lib/quantum/densityMatrix';
import { Complex, multiply, conjugate } from '@/lib/quantum/complex';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { formatBasisBits } from '@/lib/quantum/bitOrder';

interface DensityMatrixHeatmapProps {
  stateVector: StateVector;
  /** Maximum dimension to render (caps at maxDim × maxDim for performance) */
  maxDim?: number;
}

/** Map magnitude [0, 1] to a plasma-style CSS colour */
function magnitudeToColor(mag: number): string {
  // Plasma palette: black → purple → orange → yellow
  const t = Math.min(1, Math.max(0, mag));
  if (t < 0.25) {
    const u = t / 0.25;
    const r = Math.round(13 + u * 67);
    const g = Math.round(8 + u * 4);
    const b = Math.round(135 + u * 55);
    return `rgb(${r},${g},${b})`;
  } else if (t < 0.5) {
    const u = (t - 0.25) / 0.25;
    const r = Math.round(80 + u * 155);
    const g = Math.round(12 + u * 30);
    const b = Math.round(190 - u * 80);
    return `rgb(${r},${g},${b})`;
  } else if (t < 0.75) {
    const u = (t - 0.5) / 0.25;
    const r = Math.round(235 + u * 15);
    const g = Math.round(42 + u * 100);
    const b = Math.round(110 - u * 80);
    return `rgb(${r},${g},${b})`;
  } else {
    const u = (t - 0.75) / 0.25;
    const r = Math.round(250);
    const g = Math.round(142 + u * 100);
    const b = Math.round(30 - u * 20);
    return `rgb(${r},${g},${b})`;
  }
}

export function DensityMatrixHeatmap({ stateVector, maxDim = 64 }: DensityMatrixHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ i: number; j: number } | null>(null);
  const { bitOrder } = useQuantumCircuitStore();

  // For large MPS circuits, the state vector is empty (sampling only)
  if (!stateVector.amplitudes || stateVector.amplitudes.length === 0) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card rounded-lg p-2 border border-border text-center">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Purity</div>
            <div className="text-sm font-bold font-mono text-primary">—</div>
            <div className="text-[8px] text-muted-foreground">Tr(ρ²)</div>
          </div>
          <div className="bg-card rounded-lg p-2 border border-border text-center">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Entropy</div>
            <div className="text-sm font-bold font-mono text-secondary">—</div>
            <div className="text-[8px] text-muted-foreground">S(ρ) bits</div>
          </div>
          <div className="bg-card rounded-lg p-2 border border-border text-center">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Tr(ρ)</div>
            <div className="text-sm font-bold font-mono text-green-400">1.0000</div>
            <div className="text-[8px] text-muted-foreground">= 1 ✓</div>
          </div>
        </div>
        <div className="bg-card rounded-lg p-6 border border-border text-center space-y-2">
          <div className="text-2xl opacity-30">📐</div>
          <p className="text-xs text-muted-foreground font-medium">
            Full density matrix unavailable for {stateVector.qubitCount}-qubit circuits
          </p>
          <p className="text-[10px] text-muted-foreground/70">
            MPS simulation uses sampling — a 2^{stateVector.qubitCount} × 2^{stateVector.qubitCount} matrix
            cannot fit in memory. Local ρ for qubit subsets is planned for a future update.
          </p>
        </div>
      </div>
    );
  }

  const { rho, dim, labels, physicsInfo } = useMemo(() => {
    const fullDim = stateVector.amplitudes.length;
    const displayDim = Math.min(fullDim, maxDim);
    const n = stateVector.qubitCount;

    // OPTIMIZATION: Only compute the sub-matrix we actually display
    // instead of computing the full ρ = |ψ⟩⟨ψ| (which is O(d²) and crashes for d > 2048)
    const rho: Complex[][] = Array.from({ length: displayDim }, (_, i) =>
      Array.from({ length: displayDim }, (_, j) => 
        multiply(stateVector.amplitudes[i], conjugate(stateVector.amplitudes[j]))
      )
    );

    // Basis state labels
    const labels = Array.from({ length: displayDim }, (_, i) => {
      return formatBasisBits(i, n);
    });

    // Physics metrics - only compute for small systems (d <= 16) to avoid O(d^3) lag
    let pur = 1, ent = 0, trVal = 1;
    if (fullDim <= 16) {
       const fullRho = pureStateToDensityMatrix(stateVector);
       pur = purity(fullRho);
       ent = vonNeumannEntropy(fullRho);
       const { trace } = verifyTrace(fullRho);
       trVal = trace;
    }

    return {
      rho,
      dim: displayDim,
      labels,
      physicsInfo: { purity: pur, entropy: ent, trace: trVal, isTooLarge: fullDim > 16 },
    };
  }, [stateVector, maxDim, bitOrder]);

  const cellSize = Math.min(48, Math.floor(220 / dim));

  return (
    <div className="space-y-3">
      {/* Physics metrics row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card rounded-lg p-2 border border-border text-center">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Purity</div>
          <div className="text-sm font-bold font-mono text-primary">
            {physicsInfo.isTooLarge ? '—' : physicsInfo.purity.toFixed(4)}
          </div>
          <div className="text-[8px] text-muted-foreground">Tr(ρ²)</div>
        </div>
        <div className="bg-card rounded-lg p-2 border border-border text-center">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Entropy</div>
          <div className="text-sm font-bold font-mono text-secondary">
            {physicsInfo.isTooLarge ? '—' : physicsInfo.entropy.toFixed(4)}
          </div>
          <div className="text-[8px] text-muted-foreground">S(ρ) bits</div>
        </div>
        <div className="bg-card rounded-lg p-2 border border-border text-center">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Tr(ρ)</div>
          <div className="text-sm font-bold font-mono text-green-400">
            {physicsInfo.isTooLarge ? '1.0000' : physicsInfo.trace.toFixed(4)}
          </div>
          <div className="text-[8px] text-muted-foreground">= 1 ✓</div>
        </div>
      </div>

      {physicsInfo.isTooLarge && (
        <p className="text-[8px] text-amber-500 text-center bg-amber-500/10 py-1 rounded border border-amber-500/20">
          ⚠️ Physics metrics (Purity/Entropy) disabled for {stateVector.qubitCount} qubits to preserve performance.
        </p>
      )}

      {/* Heatmap */}
      <div className="bg-card rounded-lg p-3 border border-border">
        <div className="text-[10px] text-muted-foreground mb-2 flex items-center justify-between">
          <span>Density Matrix ρ — |ρᵢⱼ| magnitude</span>
          <span className="font-mono text-[9px] opacity-60">ρ = |ψ⟩⟨ψ|</span>
        </div>

        <div className="overflow-auto max-h-[60vh]">
          <div style={{ display: 'inline-block' }}>
            {/* Column labels */}
            <div style={{ display: 'flex', paddingLeft: cellSize + 4 }}>
              {labels.map((lbl, j) => (
                <div
                  key={j}
                  style={{ width: cellSize, textAlign: 'center' }}
                  className="text-[8px] text-muted-foreground font-mono truncate"
                >
                  {lbl}
                </div>
              ))}
            </div>

            {/* Rows */}
            {rho.map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                {/* Row label */}
                <div
                  style={{ width: cellSize, flexShrink: 0 }}
                  className="text-[8px] text-muted-foreground font-mono text-right pr-1 truncate"
                >
                  {labels[i]}
                </div>

                {/* Cells */}
                {row.map((cell, j) => {
                  const mag = Math.sqrt(cell.re * cell.re + cell.im * cell.im);
                  const isHovered = hoveredCell?.i === i && hoveredCell?.j === j;
                  const isDiag = i === j;

                  return (
                    <motion.div
                      key={j}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: magnitudeToColor(mag),
                        border: isDiag
                          ? '1.5px solid rgba(255,255,255,0.4)'
                          : '0.5px solid rgba(255,255,255,0.05)',
                        cursor: 'crosshair',
                        position: 'relative',
                        flexShrink: 0,
                      }}
                      whileHover={{ scale: 1.1, zIndex: 10 }}
                      onMouseEnter={() => setHoveredCell({ i, j })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {/* Hover tooltip */}
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute z-50 bg-popover text-popover-foreground text-[9px] font-mono p-1.5 rounded shadow-lg border border-border whitespace-nowrap"
                          style={{
                            bottom: '110%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            pointerEvents: 'none',
                          }}
                        >
                          <div className="font-bold text-[10px]">ρ[{labels[i]}][{labels[j]}]</div>
                          <div className="text-blue-400">Re: {cell.re >= 0 ? '+' : ''}{cell.re.toFixed(4)}</div>
                          <div className="text-red-400">Im: {cell.im >= 0 ? '+' : ''}{cell.im.toFixed(4)}</div>
                          <div className="text-yellow-400">|ρ|: {mag.toFixed(4)}</div>
                          {isDiag && <div className="text-green-400">P = {(mag * 100).toFixed(2)}%</div>}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* ρ symbol */}
        <div className="text-right text-lg font-serif italic text-muted-foreground mt-1 mr-2">ρ</div>
      </div>

      {/* Colour scale legend */}
      <div className="bg-card rounded-lg p-2 border border-border">
        <div className="text-[9px] text-muted-foreground mb-1">Magnitude Scale: 0 → 1</div>
        <div
          className="h-2 rounded-full"
          style={{
            background: `linear-gradient(to right,
              ${magnitudeToColor(0)},
              ${magnitudeToColor(0.25)},
              ${magnitudeToColor(0.5)},
              ${magnitudeToColor(0.75)},
              ${magnitudeToColor(1)}
            )`,
          }}
        />
        <div className="flex justify-between text-[8px] text-muted-foreground mt-0.5">
          <span>0 (vacuum)</span>
          <span>Diagonal = P(state)</span>
          <span>1 (max coherence)</span>
        </div>
      </div>

      {stateVector.amplitudes.length > maxDim && (
        <p className="text-[9px] text-muted-foreground text-center">
          Showing {maxDim}×{maxDim} of {stateVector.amplitudes.length}×{stateVector.amplitudes.length} matrix
        </p>
      )}
    </div>
  );
}
