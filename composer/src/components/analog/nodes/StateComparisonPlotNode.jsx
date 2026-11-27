import { Handle, Position } from '@xyflow/react';
import { useEffect, useRef } from 'react';
import useAnalogStore from '../../../stores/analogStore';

export default function StateComparisonPlotNode({ id, data }) {
  const canvasRef = useRef(null);
  const updateNodeData = useAnalogStore((s) => s.updateNodeData);
  const result = data._result;

  useEffect(() => {
    if (!canvasRef.current || !result) return;
    drawPlot(canvasRef.current, result, data);
  }, [
    result, data.ymin, data.ymax,
    data.showV,
    data.showPsi2, data.showRePsi, data.showImPsi,
    data.showPhi2, data.showRePhi, data.showImPhi
  ]);

  const toggles = [
    { key: 'showV', label: 'V', default: false },
    { key: 'showPsi2', label: '|ψ|²', default: true },
    { key: 'showRePsi', label: 'Re(ψ)', default: false },
    { key: 'showImPsi', label: 'Im(ψ)', default: false },
    { key: 'showPhi2', label: '|φ|²', default: true },
    { key: 'showRePhi', label: 'Re(φ)', default: false },
    { key: 'showImPhi', label: 'Im(φ)', default: false },
  ];

  return (
    <div className="analog-node state-comparison-plot-node" style={{ minWidth: '400px' }}>
      <div className="analog-node-header" style={{ background: 'rgba(236, 72, 153, 0.08)' }}>
        State Comparison Plot
        {!result && <span className="node-warning" title="No simulation result">!</span>}
      </div>
      <div className="analog-node-body" style={{ padding: '0.4rem' }}>
        <Handle type="target" position={Position.Left} id="V" style={{ top: '30%', background: '#3b82f6' }} />
        <Handle type="target" position={Position.Left} id="psi" style={{ top: '55%', background: '#06b6d4' }} />
        <Handle type="target" position={Position.Left} id="phi" style={{ top: '80%', background: '#ec4899' }} />

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={280}
            height={200}
            style={{
              background: '#ffffff', // From the screenshot, plots have a white background and grid
              borderRadius: '2px',
              border: '1px solid #ccc',
            }}
          />

          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.68rem', flex: 1 }}>
            {toggles.map((t) => (
              <label key={t.key} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#e6edf3', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={data[t.key] ?? t.default}
                  onChange={(e) => updateNodeData(id, { [t.key]: e.target.checked })}
                  style={{ accentColor: '#ec4899' }}
                />
                <span dangerouslySetInnerHTML={{ __html: t.label.replace('2', '²') }} />
              </label>
            ))}

            <div style={{ marginTop: '0.4rem' }}>
              <div className="node-field" style={{ fontSize: '0.65rem' }}>
                <label style={{color: '#e6edf3'}}>Y<sub>min</sub></label>
                <input
                  type="number"
                  value={data.ymin ?? -1}
                  onChange={(e) => updateNodeData(id, { ymin: parseFloat(e.target.value) || -1 })}
                  style={{ width: '50px' }}
                />
              </div>
              <div className="node-field" style={{ fontSize: '0.65rem' }}>
                <label style={{color: '#e6edf3'}}>Y<sub>max</sub></label>
                <input
                  type="number"
                  value={data.ymax ?? 1}
                  onChange={(e) => updateNodeData(id, { ymax: parseFloat(e.target.value) || 1 })}
                  style={{ width: '50px' }}
                />
              </div>
            </div>

            <button
              className="lc-btn"
              onClick={() => {
                updateNodeData(id, { ymin: -1, ymax: 1 });
              }}
              style={{ marginTop: '0.2rem' }}
            >
              Reset view
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Canvas Drawing ───────────────────────────────────────────
function drawPlot(canvas, result, data) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const pad = { top: 15, right: 15, bottom: 25, left: 35 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  ctx.clearRect(0, 0, W, H);
  
  // White background as in screenshot
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  const xArr = result.x;
  if (!xArr) return;
  const xmin = result.xmin;
  const xmax = result.xmax;
  const ymin = data.ymin ?? -1;
  const ymax = data.ymax ?? 1;

  const mapX = (x) => pad.left + ((x - xmin) / (xmax - xmin)) * plotW;
  const mapY = (y) => pad.top + plotH - ((y - ymin) / (ymax - ymin)) * plotH;

  // ── Grid lines ──────────────────────────────────────────
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  
  // horizontal
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();
  }
  // vertical
  for (let i = 0; i <= 4; i++) {
    const x = pad.left + (plotW / 4) * i;
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, pad.top + plotH);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  
  // Plot border
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.strokeRect(pad.left, pad.top, plotW, plotH);
  
  // Draw tick marks
  ctx.beginPath();
  for (let i = 0; i <= 8; i++) {
    const x = pad.left + (plotW / 8) * i;
    ctx.moveTo(x, pad.top + plotH);
    ctx.lineTo(x, pad.top + plotH - (i % 2 === 0 ? 5 : 3));
  }
  for (let i = 0; i <= 8; i++) {
    const y = pad.top + (plotH / 8) * i;
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + (i % 2 === 0 ? 5 : 3), y);
  }
  ctx.stroke();

  // ── Axes labels ─────────────────────────────────────────
  ctx.fillStyle = '#475569';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 4; i+=2) {
    const val = ymin + ((ymax - ymin) / 4) * (4 - i);
    const y = pad.top + (plotH / 4) * i;
    ctx.fillText(val.toFixed(1), pad.left - 5, y);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i <= 4; i+=2) {
    const val = xmin + ((xmax - xmin) / 4) * i;
    const x = pad.left + (plotW / 4) * i;
    ctx.fillText(val.toFixed(0), x, pad.top + plotH + 5);
  }

  // ── Zero line ──────────────────────────────────────────
  if (ymin < 0 && ymax > 0) {
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, mapY(0));
    ctx.lineTo(pad.left + plotW, mapY(0));
    ctx.stroke();
  }

  // ── Draw Data ─────────────────────────────────────────
  
  // Potential V
  if (data.showV && result.potential) {
    ctx.strokeStyle = '#94a3b8'; // Grey line
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < xArr.length; i++) {
      const px = mapX(xArr[i]);
      const py = mapY(result.potential[i]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Psi state
  const psi = result.superposition; // the primary state (e.g. from Time Evolution)
  if (psi) {
    if (data.showPsi2 !== false && psi.prob_density) {
      ctx.strokeStyle = '#10b981'; // Green (matches screenshot)
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 2]); // Dashed line in screenshot
      ctx.beginPath();
      for (let i = 0; i < xArr.length; i++) {
        const px = mapX(xArr[i]);
        const py = mapY(psi.prob_density[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (data.showRePsi && psi.wavefunction_re) {
      ctx.strokeStyle = '#3b82f6'; // Blue
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < xArr.length; i++) {
        const px = mapX(xArr[i]);
        const py = mapY(psi.wavefunction_re[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    if (data.showImPsi && psi.wavefunction_im) {
      ctx.strokeStyle = '#ec4899'; // Pink
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < xArr.length; i++) {
        const px = mapX(xArr[i]);
        const py = mapY(psi.wavefunction_im[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }

  // Phi state (from second input). 
  // Currently we just have result.phi if we pass it through. 
  // For now, if we have it:
  if (result.phi) {
    const phi = result.phi;
    if (data.showPhi2 && phi.prob_density) {
      ctx.strokeStyle = '#f59e0b'; // Yellow
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < xArr.length; i++) {
        const px = mapX(xArr[i]);
        const py = mapY(phi.prob_density[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    if (data.showRePhi && phi.wavefunction_re) {
      ctx.strokeStyle = '#8b5cf6'; // Purple
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < xArr.length; i++) {
        const px = mapX(xArr[i]);
        const py = mapY(phi.wavefunction_re[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    if (data.showImPhi && phi.wavefunction_im) {
      ctx.strokeStyle = '#06b6d4'; // Cyan
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < xArr.length; i++) {
        const px = mapX(xArr[i]);
        const py = mapY(phi.wavefunction_im[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }
}
