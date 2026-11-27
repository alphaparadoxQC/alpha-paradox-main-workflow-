import { Handle, Position } from '@xyflow/react';
import { useEffect, useRef } from 'react';
import useAnalogStore from '../../../stores/analogStore';

const LINE_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function ScalarTimePlotNode({ id, data }) {
  const canvasRef = useRef(null);
  const updateNodeData = useAnalogStore((s) => s.updateNodeData);
  const result = useAnalogStore((s) => s.simulationResult);

  // Which series to plot
  const series = data.series || 'fidelity';

  useEffect(() => {
    if (!canvasRef.current || !result?.time_series) return;
    drawTimePlot(canvasRef.current, result, data, series);
  }, [result, data.ymin, data.ymax, series]);

  const seriesOptions = [
    { key: 'fidelity', label: 'Fidelity |⟨ψ₀|ψ(t)⟩|²' },
    { key: 'expectation_x', label: '⟨x⟩' },
    { key: 'expectation_p', label: '⟨p⟩' },
    { key: 'expectation_E', label: '⟨H⟩ (Energy)' },
  ];

  return (
    <div className="analog-node scalar-time-plot-node">
      <div className="analog-node-header">
        Scalar Time Trace Plot
        {!result?.time_series && <span className="node-warning" title="No time series data">!</span>}
      </div>
      <div className="analog-node-body" style={{ padding: '0.4rem' }}>
        <Handle type="target" position={Position.Left} id="scalar" style={{ top: '50%', background: '#10b981' }} />

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={260}
            height={180}
            style={{
              background: '#0d1117',
              borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />

          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.68rem', minWidth: '90px' }}>
            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.62rem' }}>Series</label>
            <select
              value={series}
              onChange={(e) => updateNodeData(id, { series: e.target.value })}
              style={{
                background: '#1a1f2b', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '3px', color: '#e6edf3', fontSize: '0.65rem', padding: '0.15rem',
              }}
            >
              {seriesOptions.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>

            <div className="node-field" style={{ fontSize: '0.62rem', marginTop: '0.3rem' }}>
              <label>Y<sub>min</sub></label>
              <input
                type="number"
                value={data.ymin ?? 0}
                onChange={(e) => updateNodeData(id, { ymin: parseFloat(e.target.value) || 0 })}
                style={{ width: '45px' }}
              />
            </div>
            <div className="node-field" style={{ fontSize: '0.62rem' }}>
              <label>Y<sub>max</sub></label>
              <input
                type="number"
                value={data.ymax ?? 1}
                onChange={(e) => updateNodeData(id, { ymax: parseFloat(e.target.value) || 1 })}
                style={{ width: '45px' }}
              />
            </div>

            <button
              className="lc-btn"
              onClick={() => {
                if (!result?.time_series) return;
                const vals = result.time_series[series] || [];
                if (vals.length === 0) return;
                const mn = Math.min(...vals);
                const mx = Math.max(...vals);
                const margin = (mx - mn) * 0.1 || 0.5;
                updateNodeData(id, {
                  ymin: Math.floor((mn - margin) * 100) / 100,
                  ymax: Math.ceil((mx + margin) * 100) / 100,
                });
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
function drawTimePlot(canvas, result, data, series) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const pad = { top: 10, right: 10, bottom: 22, left: 38 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  ctx.clearRect(0, 0, W, H);

  const ts = result.time_series;
  if (!ts || !ts.t || ts.t.length === 0) return;

  const tArr = ts.t;
  const values = ts[series] || [];
  if (values.length === 0) return;

  const tmin = tArr[0];
  const tmax = tArr[tArr.length - 1] || 1;
  const ymin = data.ymin ?? 0;
  const ymax = data.ymax ?? 1;

  const mapX = (t) => pad.left + ((t - tmin) / (tmax - tmin || 1)) * plotW;
  const mapY = (y) => pad.top + plotH - ((y - ymin) / (ymax - ymin || 1)) * plotH;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();
  }

  // Axes labels
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '8px monospace';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const val = ymin + ((ymax - ymin) / 4) * (4 - i);
    const y = pad.top + (plotH / 4) * i;
    ctx.fillText(val.toFixed(2), pad.left - 3, y + 3);
  }
  ctx.textAlign = 'center';
  for (let i = 0; i <= 3; i++) {
    const val = tmin + ((tmax - tmin) / 3) * i;
    const px = pad.left + (plotW / 3) * i;
    ctx.fillText(val.toFixed(2), px, H - 5);
  }

  // Draw the line
  ctx.strokeStyle = LINE_COLORS[0];
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let j = 0; j < values.length; j++) {
    const px = mapX(tArr[j]);
    const py = mapY(values[j]);
    if (j === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}
