import { Handle, Position } from '@xyflow/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import useAnalogStore from '../../../stores/analogStore';

// High-fidelity scientific color palette for eigenstates
const EIGENSTATE_PALETTE = [
  { stroke: '#38bdf8', fill: 'rgba(56, 189, 248, 0.32)', glow: 'rgba(56, 189, 248, 0.45)' }, // E0 - Sky Blue
  { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.32)', glow: 'rgba(244, 63, 94, 0.45)' },   // E1 - Rose Coral
  { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.32)', glow: 'rgba(16, 185, 129, 0.45)' }, // E2 - Emerald
  { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.32)', glow: 'rgba(245, 158, 11, 0.45)' }, // E3 - Amber
  { stroke: '#a855f7', fill: 'rgba(168, 85, 247, 0.32)', glow: 'rgba(168, 85, 247, 0.45)' }, // E4 - Violet
  { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.32)', glow: 'rgba(6, 182, 212, 0.45)' },   // E5 - Cyan
  { stroke: '#fb923c', fill: 'rgba(251, 146, 60, 0.32)', glow: 'rgba(251, 146, 60, 0.45)' }, // E6 - Orange
  { stroke: '#e879f9', fill: 'rgba(232, 121, 249, 0.32)', glow: 'rgba(232, 121, 249, 0.45)' },// E7 - Fuchsia
];

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function EnergyPlotNode({ id, data }) {
  const canvasRef = useRef(null);
  const hoverRef = useRef({ active: false, cx: 0, cy: 0 });
  const updateNodeData = useAnalogStore((s) => s.updateNodeData);
  const result = data._result;

  const psiScale = data.psiScale ?? 1.0;

  // Redraw plot whenever simulation result or display parameters change
  const renderPlot = useCallback(() => {
    if (!canvasRef.current) return;
    drawPlot(canvasRef.current, result, data, hoverRef.current);
  }, [
    result,
    data.ymin,
    data.ymax,
    data.showV,
    data.showPsi2,
    data.showRePsi,
    data.showImPsi,
    data.showEn,
    data.psiScale,
  ]);

  useEffect(() => {
    renderPlot();
  }, [renderPlot]);

  // Interactive mouse probe handlers
  const handleMouseMove = (e) => {
    if (!canvasRef.current || !result) return;
    const rect = canvasRef.current.getBoundingClientRect();
    hoverRef.current = {
      active: true,
      cx: e.clientX - rect.left,
      cy: e.clientY - rect.top,
    };
    renderPlot();
  };

  const handleMouseLeave = () => {
    hoverRef.current = { active: false, cx: 0, cy: 0 };
    renderPlot();
  };

  // Auto-fit bounds calculation
  const handleAutoScale = () => {
    if (!result) return;
    const V = result.potential || [];
    const E = result.eigenvalues || [];
    const validV = V.filter((v) => Number.isFinite(v));
    const validE = E.filter((e) => Number.isFinite(e));

    const minV = validV.length > 0 ? Math.min(...validV) : 0;
    const maxE = validE.length > 0 ? Math.max(...validE) : 10;
    const maxBound = Math.max(
      maxE * 1.25,
      validV.length > 0 ? Math.min(Math.max(...validV), maxE * 1.4) : 10
    );

    const span = maxBound - minV || 10;
    const autoYmin = Math.floor(minV - span * 0.05);
    const autoYmax = Math.ceil(maxBound + span * 0.1);

    updateNodeData(id, { ymin: autoYmin, ymax: autoYmax });
  };

  const toggles = [
    { key: 'showV', label: 'V(x)', color: '#94a3b8', default: true },
    { key: 'showPsi2', label: '|ψ|²', color: '#38bdf8', default: true },
    { key: 'showRePsi', label: 'Re(ψ)', color: '#a855f7', default: false },
    { key: 'showImPsi', label: 'Im(ψ)', color: '#ec4899', default: false },
    { key: 'showEn', label: '{Eₙ}', color: '#10b981', default: true },
  ];

  const scaleOptions = [0.5, 1.0, 2.0, 4.0];

  return (
    <div className="analog-node energy-plot-node">
      <div className="analog-node-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: result ? '#10b981' : '#f59e0b' }} />
          <span>Energy Spectrum &amp; Eigenstates</span>
        </div>
        {!result && <span className="node-warning" title="No simulation result. Click Run above.">Awaiting Run</span>}
      </div>

      <div className="analog-node-body" style={{ padding: '0.5rem' }}>
        <Handle type="target" position={Position.Left} id="V" style={{ top: '30%', background: '#3b82f6' }} />
        <Handle type="target" position={Position.Left} id="eigenstates" style={{ top: '55%', background: '#ec4899' }} />
        <Handle type="target" position={Position.Left} id="psi" style={{ top: '80%', background: '#06b6d4' }} />

        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'stretch' }}>
          {/* Scientific Canvas */}
          <div style={{ position: 'relative' }}>
            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                display: 'block',
                background: '#0a0e17',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: result ? 'crosshair' : 'default',
              }}
            />
          </div>

          {/* Controls Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', width: '135px', flexShrink: 0 }}>
            {/* Display Elements */}
            <div className="ep-control-group">
              <span className="ep-control-label">Layers</span>
              {toggles.map((t) => (
                <label key={t.key} className="ep-toggle-item">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="ep-swatch" style={{ background: t.color }} />
                    <span>{t.label}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={data[t.key] ?? t.default}
                    onChange={(e) => updateNodeData(id, { [t.key]: e.target.checked })}
                    style={{ accentColor: t.color, cursor: 'pointer' }}
                  />
                </label>
              ))}
            </div>

            {/* Wavefunction Amplitude Scale */}
            <div className="ep-control-group">
              <span className="ep-control-label">Wave Amplitude</span>
              <div className="ep-scale-btn-group">
                {scaleOptions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`ep-scale-btn ${psiScale === s ? 'active' : ''}`}
                    onClick={() => updateNodeData(id, { psiScale: s })}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Viewport Bounds */}
            <div className="ep-control-group">
              <span className="ep-control-label">Energy Range</span>
              <div className="node-field" style={{ margin: '0 0 0.2rem 0' }}>
                <label style={{ fontSize: '0.65rem' }}>Y<sub>min</sub></label>
                <input
                  type="number"
                  value={data.ymin ?? 0}
                  onChange={(e) => updateNodeData(id, { ymin: parseFloat(e.target.value) || 0 })}
                  style={{ width: '60px', padding: '0.15rem 0.3rem' }}
                />
              </div>
              <div className="node-field" style={{ margin: '0 0 0.2rem 0' }}>
                <label style={{ fontSize: '0.65rem' }}>Y<sub>max</sub></label>
                <input
                  type="number"
                  value={data.ymax ?? 10}
                  onChange={(e) => updateNodeData(id, { ymax: parseFloat(e.target.value) || 10 })}
                  style={{ width: '60px', padding: '0.15rem 0.3rem' }}
                />
              </div>

              <button
                className="lc-btn"
                type="button"
                onClick={handleAutoScale}
                style={{ width: '100%', marginTop: '0.2rem', textAlign: 'center' }}
              >
                Auto Scale
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── HiDPI High-Fidelity Canvas Rendering ───────────────────────────────────────────
function drawPlot(canvas, result, data, hover) {
  const cssW = 360;
  const cssH = 230;
  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 2) : 2;

  // Set backing buffer size scaled to device pixel ratio
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);

  const pad = { top: 18, right: 46, bottom: 26, left: 38 };
  const plotW = cssW - pad.left - pad.right;
  const plotH = cssH - pad.top - pad.bottom;

  // Clear canvas background
  ctx.fillStyle = '#0a0e17';
  ctx.fillRect(0, 0, cssW, cssH);

  // If no simulation result is loaded yet, show standby guide
  if (!result || !result.x || !result.potential) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (plotH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Awaiting Simulation Results', pad.left + plotW / 2, pad.top + plotH / 2 - 8);
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillText('Click [Run] to solve Schrödinger Hamiltonian', pad.left + plotW / 2, pad.top + plotH / 2 + 10);
    ctx.restore();
    return;
  }

  const xArr = result.x;
  const V = result.potential;
  const eigenvalues = result.eigenvalues || [];
  const eigenvectors = result.eigenvectors || [];

  const xmin = result.xmin ?? (xArr.length ? xArr[0] : -5);
  const xmax = result.xmax ?? (xArr.length ? xArr[xArr.length - 1] : 5);

  // Dynamic automatic range fallback if not explicitly set
  let ymin = data.ymin;
  let ymax = data.ymax;
  if (ymin == null || ymax == null) {
    const validV = V.filter(Number.isFinite);
    const validE = eigenvalues.filter(Number.isFinite);
    const minV = validV.length ? Math.min(...validV) : 0;
    const maxVal = Math.max(
      validE.length ? Math.max(...validE) * 1.25 : 10,
      validV.length ? Math.min(Math.max(...validV), (validE[validE.length - 1] || 10) * 1.4) : 10
    );
    ymin = ymin ?? Math.floor(Math.min(0, minV));
    ymax = ymax ?? Math.ceil(maxVal || 10);
  }

  const yRange = ymax - ymin || 1;
  const xRange = xmax - xmin || 1;

  const mapX = (x) => pad.left + ((x - xmin) / xRange) * plotW;
  const mapY = (y) => pad.top + plotH - ((y - ymin) / yRange) * plotH;

  // ── Grid & Coordinate Frame ──────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 0.6;
  const numYGrid = 5;
  for (let i = 0; i <= numYGrid; i++) {
    const y = pad.top + (plotH / numYGrid) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();
  }

  const numXGrid = 4;
  for (let i = 0; i <= numXGrid; i++) {
    const x = pad.left + (plotW / numXGrid) * i;
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, pad.top + plotH);
    ctx.stroke();
  }

  // Zero-energy and Zero-x reference dashed lines if within viewport
  if (ymin < 0 && ymax > 0) {
    const yZero = mapY(0);
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.beginPath();
    ctx.moveTo(pad.left, yZero);
    ctx.lineTo(pad.left + plotW, yZero);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (xmin < 0 && xmax > 0) {
    const xZero = mapX(0);
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.beginPath();
    ctx.moveTo(xZero, pad.top);
    ctx.lineTo(xZero, pad.top + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── Axis Labels & Ticks ──────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = '8.5px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= numYGrid; i++) {
    const val = ymin + (yRange / numYGrid) * (numYGrid - i);
    const y = pad.top + (plotH / numYGrid) * i;
    ctx.fillText(val.toFixed(1), pad.left - 5, y);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i <= numXGrid; i++) {
    const val = xmin + (xRange / numXGrid) * i;
    const x = pad.left + (plotW / numXGrid) * i;
    ctx.fillText(val.toFixed(1), x, pad.top + plotH + 5);
  }

  // ── Adaptive Wavefunction Scaling ────────────────────────────────────────────
  let baseScale = 1.0;
  if (eigenvalues.length >= 2) {
    const avgSpacing = (eigenvalues[eigenvalues.length - 1] - eigenvalues[0]) / (eigenvalues.length - 1);
    let maxP = 0.2;
    for (const psi of eigenvectors.slice(0, 3)) {
      for (let j = 0; j < psi.length; j += 4) {
        const p = psi[j] * psi[j];
        if (p > maxP) maxP = p;
      }
    }
    baseScale = (avgSpacing * 0.45) / maxP;
  } else {
    baseScale = (yRange * 0.15);
  }
  const effectiveScale = baseScale * (data.psiScale ?? 1.0);

  // ── Draw Potential V(x) ──────────────────────────────────────────────────────
  if (data.showV !== false && V && xArr.length > 0) {
    // 1. Subtle well depth fill
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.left, pad.top, plotW, plotH);
    ctx.clip();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = 'rgba(148, 163, 184, 0.4)';
    ctx.shadowBlur = 4;

    ctx.beginPath();
    let started = false;
    for (let i = 0; i < xArr.length; i++) {
      const px = mapX(xArr[i]);
      const rawPy = mapY(V[i]);
      const py = Math.max(pad.top - 20, Math.min(pad.top + plotH + 20, rawPy));
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  // ── Draw Energy Levels {En} and Level Badges ─────────────────────────────────
  if (data.showEn !== false && eigenvalues.length > 0) {
    for (let i = 0; i < eigenvalues.length; i++) {
      const E = eigenvalues[i];
      const y = mapY(E);
      if (y < pad.top - 2 || y > pad.top + plotH + 2) continue;

      const pal = EIGENSTATE_PALETTE[i % EIGENSTATE_PALETTE.length];

      // Dashed level line
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 0.9;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;

      // Badge on right margin
      const tagText = `E${i}=${E.toFixed(1)}`;
      ctx.font = 'bold 8px monospace';
      const textW = ctx.measureText(tagText).width;
      const bW = textW + 6;
      const bH = 12;
      const bX = pad.left + plotW + 2;
      const bY = y - bH / 2;

      ctx.fillStyle = 'rgba(10, 14, 23, 0.9)';
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 0.7;
      drawRoundedRect(ctx, bX, bY, bW, bH, 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = pal.stroke;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tagText, bX + bW / 2, y + 0.5);
    }
  }

  // ── Draw |ψ|² for each Eigenstate (Gradient Area Fill + Crisp Luminous Top) ───
  if (data.showPsi2 !== false && eigenvectors.length > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.left, pad.top, plotW, plotH);
    ctx.clip();

    for (let i = 0; i < eigenvectors.length; i++) {
      const psi = eigenvectors[i];
      const E = eigenvalues[i] ?? 0;
      const pal = EIGENSTATE_PALETTE[i % EIGENSTATE_PALETTE.length];
      const baselineY = mapY(E);

      // Area fill down to eigenvalue baseline
      ctx.fillStyle = pal.fill;
      ctx.beginPath();
      ctx.moveTo(mapX(xArr[0]), baselineY);
      for (let j = 0; j < xArr.length; j++) {
        const prob = psi[j] * psi[j];
        const px = mapX(xArr[j]);
        const py = mapY(E + prob * effectiveScale);
        ctx.lineTo(px, py);
      }
      ctx.lineTo(mapX(xArr[xArr.length - 1]), baselineY);
      ctx.closePath();
      ctx.fill();

      // Top glowing stroke
      ctx.strokeStyle = pal.stroke;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = pal.glow;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      for (let j = 0; j < xArr.length; j++) {
        const prob = psi[j] * psi[j];
        const px = mapX(xArr[j]);
        const py = mapY(E + prob * effectiveScale);
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  // ── Draw Re(ψ) Waveforms ─────────────────────────────────────────────────────
  if (data.showRePsi && eigenvectors.length > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.left, pad.top, plotW, plotH);
    ctx.clip();

    for (let i = 0; i < eigenvectors.length; i++) {
      const psi = eigenvectors[i];
      const E = eigenvalues[i] ?? 0;
      const pal = EIGENSTATE_PALETTE[i % EIGENSTATE_PALETTE.length];

      ctx.strokeStyle = pal.stroke;
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let j = 0; j < xArr.length; j++) {
        const px = mapX(xArr[j]);
        const py = mapY(E + psi[j] * effectiveScale * 0.7);
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
    ctx.restore();
  }

  // ── Draw Im(ψ) Waveforms ─────────────────────────────────────────────────────
  if (data.showImPsi && eigenvectors.length > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.left, pad.top, plotW, plotH);
    ctx.clip();

    for (let i = 0; i < eigenvectors.length; i++) {
      const psi = eigenvectors[i];
      const E = eigenvalues[i] ?? 0;
      const pal = EIGENSTATE_PALETTE[i % EIGENSTATE_PALETTE.length];

      ctx.strokeStyle = pal.stroke;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      for (let j = 0; j < xArr.length; j++) {
        const px = mapX(xArr[j]);
        const py = mapY(E + (psi[j] * 0.5) * effectiveScale);
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;
    }
    ctx.restore();
  }

  // ── Draw Superposition / Time Evolution |Ψ(x,t)|² ────────────────────────────
  if (result.superposition && data.showPsi2 !== false) {
    const sp = result.superposition;
    if (sp.prob_density && sp.prob_density.length > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(pad.left, pad.top, plotW, plotH);
      ctx.clip();

      const baseE = eigenvalues[0] ?? ymin;
      const baseY = mapY(baseE);

      // Radiant area gradient
      const grad = ctx.createLinearGradient(0, pad.top, 0, baseY);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0.02)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(mapX(xArr[0]), baseY);
      for (let j = 0; j < xArr.length; j++) {
        const px = mapX(xArr[j]);
        const py = mapY(baseE + sp.prob_density[j] * effectiveScale * 1.5);
        ctx.lineTo(px, py);
      }
      ctx.lineTo(mapX(xArr[xArr.length - 1]), baseY);
      ctx.closePath();
      ctx.fill();

      // Top glowing stroke
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.0;
      ctx.shadowColor = 'rgba(6, 182, 212, 0.7)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (let j = 0; j < xArr.length; j++) {
        const px = mapX(xArr[j]);
        const py = mapY(baseE + sp.prob_density[j] * effectiveScale * 1.5);
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  // ── Interactive Cursor Inspection Crosshair & Floating HUD ──────────────────
  if (hover && hover.active) {
    const { cx, cy } = hover;
    if (cx >= pad.left && cx <= pad.left + plotW && cy >= pad.top && cy <= pad.top + plotH) {
      // Find nearest spatial index
      const frac = (cx - pad.left) / plotW;
      const physX = xmin + frac * xRange;

      let nearestIdx = 0;
      let minDist = Infinity;
      for (let i = 0; i < xArr.length; i++) {
        const d = Math.abs(xArr[i] - physX);
        if (d < minDist) {
          minDist = d;
          nearestIdx = i;
        }
      }

      const exactX = xArr[nearestIdx];
      const exactV = V[nearestIdx];
      const plotX = mapX(exactX);

      // Vertical guide line
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotX, pad.top);
      ctx.lineTo(plotX, pad.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point marker on potential curve
      if (exactV != null && data.showV !== false) {
        const plotVy = mapY(exactV);
        if (plotVy >= pad.top && plotVy <= pad.top + plotH) {
          ctx.beginPath();
          ctx.arc(plotX, plotVy, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Compact floating HUD overlay card
      const hudLines = [
        `x: ${exactX >= 0 ? '+' : ''}${exactX.toFixed(3)}  |  V: ${exactV != null ? exactV.toFixed(2) : '--'}`,
      ];

      if (result.superposition?.prob_density) {
        const spVal = result.superposition.prob_density[nearestIdx] ?? 0;
        hudLines.push(`|Ψ(t)|²: ${spVal.toFixed(3)}`);
      } else if (eigenvectors.length > 0 && data.showPsi2 !== false) {
        const p0 = (eigenvectors[0][nearestIdx] ** 2).toFixed(3);
        const p1 = eigenvectors[1] ? (eigenvectors[1][nearestIdx] ** 2).toFixed(3) : null;
        hudLines.push(`|ψ₀|²: ${p0}${p1 ? `  |ψ₁|²: ${p1}` : ''}`);
      }

      const hudW = 190;
      const hudH = hudLines.length * 13 + 6;
      const hudX = pad.left + 6;
      const hudY = pad.top + 6;

      ctx.fillStyle = 'rgba(10, 14, 23, 0.88)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, hudX, hudY, hudW, hudH, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '8.5px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      hudLines.forEach((line, li) => {
        ctx.fillText(line, hudX + 6, hudY + 4 + li * 13);
      });
    }
  }

  ctx.restore();
}
