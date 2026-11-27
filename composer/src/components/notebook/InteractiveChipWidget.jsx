import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEdaStore } from '../../stores/edaStore';
import useNotebookStore from '../../stores/notebookStore';
import {
  parseMetalScript,
  bridgeNotebookToEda,
  runLVS,
  extractTransmonTCAD,
  bridgeEdaToAnalog
} from '../../quantum-engine/cross-product-bridge';

/**
 * InteractiveChipWidget — Live inline Silicon EDA floorplan synthesis & verification
 * widget rendered inside the Notebook below Alpha Metal Python cells.
 */
export default function InteractiveChipWidget({ cellId, code: initialCode }) {
  const navigate = useNavigate();
  const [selectedComp, setSelectedComp] = useState(null);
  const [lvsResult, setLvsResult] = useState(null);
  const [tcadResult, setTcadResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Subscribe to cell content
  const cellContent = useNotebookStore((state) => {
    if (initialCode) return initialCode;
    const cell = (state.cells || []).find((c) => c.id === cellId);
    return cell ? cell.content : '';
  });

  const parsed = useMemo(() => {
    return parseMetalScript(cellContent || '');
  }, [cellContent]);

  const components = parsed.components || [];
  const netlist = parsed.netlist || [];

  // Helper to convert dimensions to microns
  const toMicrons = (val) => {
    if (!val) return 0;
    const s = String(val).trim().toLowerCase();
    const num = parseFloat(s.replace(/[^0-9.-]/g, '')) || 0;
    if (s.includes('mm')) return num * 1000;
    if (s.includes('cm')) return num * 10000;
    if (s.includes('m') && !s.includes('um')) return num * 1e6;
    return num; // assume um
  };

  // Compute bounding box for SVG projection (in mm)
  const bounds = useMemo(() => {
    if (components.length === 0) {
      return { minX: -4.5, maxX: 4.5, minY: -3.0, maxY: 3.0 };
    }
    let minX = -4.0, maxX = 4.0, minY = -2.5, maxY = 2.5;
    components.forEach((c) => {
      const x = toMicrons(c.params?.pos_x) / 1000;
      const y = toMicrons(c.params?.pos_y) / 1000;
      minX = Math.min(minX, x - 1.2);
      maxX = Math.max(maxX, x + 1.2);
      minY = Math.min(minY, y - 1.0);
      maxY = Math.max(maxY, y + 1.0);
    });
    return { minX, maxX, minY, maxY };
  }, [components]);

  const chipWidthMm = bounds.maxX - bounds.minX;
  const chipHeightMm = bounds.maxY - bounds.minY;

  // Transform coordinates to SVG viewBox (origin at center)
  const svgWidth = 640;
  const svgHeight = 280;
  const scaleX = svgWidth / (chipWidthMm || 9.0);
  const scaleY = svgHeight / (chipHeightMm || 6.0);
  const scale = Math.min(scaleX, scaleY) * 0.85;

  const toSvgX = (mmX) => svgWidth / 2 + mmX * scale;
  const toSvgY = (mmY) => svgHeight / 2 - mmY * scale; // invert Y for Cartesian

  const handleOpenInEda = () => {
    bridgeNotebookToEda(cellContent, navigate);
  };

  const handleRunLVS = () => {
    // If not already in EDA store, load components first
    useEdaStore.setState({
      components,
      server_qgeometry: null,
      selectedComponentId: components[0]?.id || null,
    });
    const result = runLVS();
    setLvsResult(result);
  };

  const handleExtractTCAD = () => {
    const qubit = components.find(
      (c) => (c.type || '').includes('transmon') || (c.name || '').startsWith('Q')
    );
    if (!qubit) {
      alert('No transmon qubit found in layout to extract TCAD physics.');
      return;
    }
    const tcad = extractTransmonTCAD(qubit);
    setTcadResult(tcad);
  };

  const handlePushToAnalog = () => {
    if (!tcadResult) return;
    bridgeEdaToAnalog(navigate);
  };

  return (
    <div
      style={{
        marginTop: '12px',
        background: 'linear-gradient(180deg, #0d1527 0%, #080c16 100%)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        color: '#e2e8f0',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}
    >
      {/* ── Header Toolbar ──────────────────────────────────────────────── */}
      <div
        style={{
          padding: '8px 14px',
          background: 'rgba(15, 23, 42, 0.8)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.1rem' }}>📐</span>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#38bdf8' }}>
            Silicon EDA Layout Floorplan
          </span>
          <span
            style={{
              fontSize: '0.72rem',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#7dd3fc',
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            {components.length} Components Synthesized
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleRunLVS}
            title="Verify physical layout against circuit netlist (LVS)"
            style={{
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              color: '#c084fc',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>🔍</span>
            <span>Check LVS</span>
          </button>

          <button
            onClick={handleExtractTCAD}
            title="Extract physical Hamiltonian & capacitance metrics"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>🔬</span>
            <span>TCAD Physics</span>
          </button>

          <button
            onClick={handleOpenInEda}
            title="Open synthesized layout in the Silicon EDA canvas"
            style={{
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              border: 'none',
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.4)',
            }}
          >
            <span>📐</span>
            <span>Open in EDA Studio</span>
          </button>
        </div>
      </div>

      {/* ── Floorplan SVG Micro-Canvas ───────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          background: '#070b14',
          height: `${svgHeight}px`,
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Defs: Gradients & Shadows */}
          <defs>
            <radialGradient id="dieGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0f1d36" />
              <stop offset="100%" stopColor="#060913" />
            </radialGradient>
            <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Substrate Die Boundary */}
          <rect
            x={toSvgX(bounds.minX + 0.3)}
            y={toSvgY(bounds.maxY - 0.3)}
            width={(chipWidthMm - 0.6) * scale}
            height={(chipHeightMm - 0.6) * scale}
            rx="8"
            fill="url(#dieGrad)"
            stroke="rgba(56, 189, 248, 0.3)"
            strokeWidth="1.5"
          />

          {/* Subtle Grid Lines */}
          {[-3, -2, -1, 0, 1, 2, 3].map((gx) => (
            <line
              key={`gx_${gx}`}
              x1={toSvgX(gx)}
              y1={toSvgY(bounds.maxY - 0.3)}
              x2={toSvgX(gx)}
              y2={toSvgY(bounds.minY + 0.3)}
              stroke="rgba(255, 255, 255, 0.04)"
              strokeDasharray="3 3"
            />
          ))}
          {[-2, -1, 0, 1, 2].map((gy) => (
            <line
              key={`gy_${gy}`}
              x1={toSvgX(bounds.minX + 0.3)}
              y1={toSvgY(gy)}
              x2={toSvgX(bounds.maxX - 0.3)}
              y2={toSvgY(gy)}
              stroke="rgba(255, 255, 255, 0.04)"
              strokeDasharray="3 3"
            />
          ))}

          {/* Inter-Component Waveguides / CPW Resonators */}
          {netlist.map((net) => {
            const fromComp = components.find((c) => c.name === net.from);
            const toComp = components.find((c) => c.name === net.to);
            if (!fromComp || !toComp) return null;
            const x1 = toSvgX(toMicrons(fromComp.params?.pos_x) / 1000);
            const y1 = toSvgY(toMicrons(fromComp.params?.pos_y) / 1000);
            const x2 = toSvgX(toMicrons(toComp.params?.pos_x) / 1000);
            const y2 = toSvgY(toMicrons(toComp.params?.pos_y) / 1000);
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2 - 25; // arch for meander visualization

            return (
              <g key={net.id}>
                <path
                  d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                  filter="url(#glowGreen)"
                  opacity="0.85"
                />
                <text
                  x={midX}
                  y={midY - 6}
                  fill="#6ee7b7"
                  fontSize="9"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {net.resonator || 'CPW Bus'}
                </text>
              </g>
            );
          })}

          {/* Components Rendering */}
          {components.map((comp) => {
            const posX_mm = toMicrons(comp.params?.pos_x) / 1000;
            const posY_mm = toMicrons(comp.params?.pos_y) / 1000;
            const cx = toSvgX(posX_mm);
            const cy = toSvgY(posY_mm);
            const isSelected = selectedComp?.id === comp.id;
            const isTransmon =
              (comp.type || '').includes('transmon') ||
              (comp.name || '').startsWith('Q');
            const isLaunchpad = (comp.type || '').includes('launchpad');

            if (isTransmon) {
              // Draw Transmon Cross
              const armLength = 22;
              const armWidth = 6;
              return (
                <g
                  key={comp.id}
                  onClick={() => setSelectedComp(comp)}
                  style={{ cursor: 'pointer' }}
                  filter={isSelected ? 'url(#glowCyan)' : undefined}
                >
                  {/* Outer pocket cutout */}
                  <rect
                    x={cx - armLength - 6}
                    y={cy - armLength - 6}
                    width={(armLength + 6) * 2}
                    height={(armLength + 6) * 2}
                    rx="4"
                    fill="rgba(56, 189, 248, 0.05)"
                    stroke={isSelected ? '#38bdf8' : 'rgba(56, 189, 248, 0.3)'}
                    strokeWidth="1"
                    strokeDasharray={isSelected ? undefined : '2 2'}
                  />

                  {/* Horizontal Arm */}
                  <rect
                    x={cx - armLength}
                    y={cy - armWidth / 2}
                    width={armLength * 2}
                    height={armWidth}
                    rx="1.5"
                    fill="#38bdf8"
                  />
                  {/* Vertical Arm */}
                  <rect
                    x={cx - armWidth / 2}
                    y={cy - armLength}
                    width={armWidth}
                    height={armLength * 2}
                    rx="1.5"
                    fill="#38bdf8"
                  />
                  {/* Josephson Junction Center Island */}
                  <circle cx={cx} cy={cy} r="3" fill="#f43f5e" />

                  {/* Label */}
                  <text
                    x={cx}
                    y={cy - armLength - 9}
                    fill="#e0f2fe"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {comp.name}
                  </text>
                  <text
                    x={cx}
                    y={cy + armLength + 14}
                    fill="#94a3b8"
                    fontSize="8"
                    textAnchor="middle"
                  >
                    {comp.type}
                  </text>
                </g>
              );
            }

            if (isLaunchpad) {
              // Draw Launchpad Wirebond
              return (
                <g
                  key={comp.id}
                  onClick={() => setSelectedComp(comp)}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={cx - 14}
                    y={cy - 10}
                    width="28"
                    height="20"
                    rx="3"
                    fill="#f59e0b"
                    opacity="0.9"
                    stroke="#fbbf24"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={cx - 7}
                    y1={cy}
                    x2={cx + 7}
                    y2={cy}
                    stroke="#78350f"
                    strokeWidth="2"
                  />
                  <text
                    x={cx}
                    y={cy - 14}
                    fill="#fef3c7"
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {comp.name}
                  </text>
                </g>
              );
            }

            // Generic / Resonator Component
            return (
              <g
                key={comp.id}
                onClick={() => setSelectedComp(comp)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r="7"
                  fill="#c084fc"
                  opacity="0.8"
                  stroke="#e879f9"
                  strokeWidth="1"
                />
                <text
                  x={cx}
                  y={cy - 11}
                  fill="#f5d0fe"
                  fontSize="9"
                  textAnchor="middle"
                >
                  {comp.name}
                </text>
              </g>
            );
          })}

          {/* Scale Legend */}
          <g transform={`translate(20, ${svgHeight - 20})`}>
            <line x1="0" y1="0" x2={scale} y2="0" stroke="#94a3b8" strokeWidth="2" />
            <line x1="0" y1="-3" x2="0" y2="3" stroke="#94a3b8" strokeWidth="2" />
            <line x1={scale} y1="-3" x2={scale} y2="3" stroke="#94a3b8" strokeWidth="2" />
            <text x={scale / 2} y="-6" fill="#94a3b8" fontSize="8" textAnchor="middle">
              1.0 mm
            </text>
          </g>
        </svg>

        {/* Selected Component Overlay Card */}
        {selectedComp && (
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              background: 'rgba(15, 23, 42, 0.92)',
              border: '1px solid #38bdf8',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '0.72rem',
              backdropFilter: 'blur(8px)',
              maxWidth: '240px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b style={{ color: '#38bdf8' }}>{selectedComp.name}</b>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedComp(null);
                }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div style={{ color: '#cbd5e1', marginTop: '4px' }}>
              Type: <span style={{ color: '#c084fc' }}>{selectedComp.type}</span>
            </div>
            <div style={{ color: '#cbd5e1' }}>
              Location: ({selectedComp.params?.pos_x || '0um'}, {selectedComp.params?.pos_y || '0um'})
            </div>
            {selectedComp.params?.cross_length && (
              <div style={{ color: '#cbd5e1' }}>Arm: {selectedComp.params.cross_length}</div>
            )}
          </div>
        )}
      </div>

      {/* ── LVS Verification Results Banner ─────────────────────────────── */}
      {lvsResult && (
        <div
          style={{
            padding: '8px 14px',
            background: lvsResult.passed
              ? 'rgba(16, 185, 129, 0.12)'
              : 'rgba(239, 68, 68, 0.12)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.76rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <b style={{ color: lvsResult.passed ? '#34d399' : '#f87171' }}>
              {lvsResult.summary}
            </b>
            {lvsResult.errors?.length > 0 && (
              <div style={{ color: '#fca5a5', marginTop: '2px', fontSize: '0.7rem' }}>
                Violations: {lvsResult.errors.join(' | ')}
              </div>
            )}
          </div>
          <button
            onClick={() => setLvsResult(null)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── TCAD Physics Parameters Drawer ──────────────────────────────── */}
      {tcadResult && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(30, 41, 59, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '14px', fontSize: '0.74rem' }}>
            <div>
              <span style={{ color: '#94a3b8' }}>Transmon: </span>
              <b style={{ color: '#38bdf8' }}>{tcadResult.qubitName}</b>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>ω₀₁: </span>
              <b style={{ color: '#34d399' }}>{tcadResult.omega01_GHz} GHz</b>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>α (Anharmonicity): </span>
              <b style={{ color: '#f43f5e' }}>{tcadResult.anharmonicity_MHz} MHz</b>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Ej/Ec Ratio: </span>
              <b style={{ color: '#c084fc' }}>{tcadResult.ej_ec_ratio}</b>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handlePushToAnalog}
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
            >
              ⚡ Push to Physics Engine
            </button>
            <button
              onClick={() => setTcadResult(null)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Footer Info ─────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '6px 14px',
          background: 'rgba(10, 15, 26, 0.6)',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.7rem',
          color: '#64748b',
        }}
      >
        <span>
          Substrate: Silicon (ε_r=11.9) | Dimensions: {chipWidthMm.toFixed(1)}mm ×{' '}
          {chipHeightMm.toFixed(1)}mm
        </span>
        <span
          onClick={() => setShowDetails(!showDetails)}
          style={{ cursor: 'pointer', color: '#38bdf8' }}
        >
          {showDetails ? 'Hide Component Table ▲' : 'Show Component Table ▼'}
        </span>
      </div>

      {/* ── Expandable Component List Table ──────────────────────────────── */}
      {showDetails && (
        <div
          style={{
            maxHeight: '160px',
            overflowY: 'auto',
            background: '#090d16',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '8px 14px',
            fontSize: '0.7rem',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '4px 6px' }}>Component</th>
                <th style={{ padding: '4px 6px' }}>Type</th>
                <th style={{ padding: '4px 6px' }}>Position</th>
                <th style={{ padding: '4px 6px' }}>Parameters</th>
              </tr>
            </thead>
            <tbody>
              {components.map((c) => (
                <tr
                  key={c.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#cbd5e1' }}
                >
                  <td style={{ padding: '4px 6px', color: '#38bdf8', fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '4px 6px', color: '#c084fc' }}>{c.type}</td>
                  <td style={{ padding: '4px 6px' }}>
                    {c.params?.pos_x || '0um'}, {c.params?.pos_y || '0um'}
                  </td>
                  <td style={{ padding: '4px 6px', color: '#94a3b8' }}>
                    {c.params?.cross_length ? `length: ${c.params.cross_length}` : ''}{' '}
                    {c.params?.total_length ? `length: ${c.params.total_length}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
