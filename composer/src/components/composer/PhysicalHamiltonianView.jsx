import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCircuitStore } from '../../stores/circuitStore';
import { useEdaStore } from '../../stores/edaStore';
import { pulseEngine } from '../../quantum-engine/pulse-engine';
import CrossProductBridge from '../../quantum-engine/cross-product-bridge';
import { loadTransmonAnalogPreset } from '../../utils/presetTemplates';
import { calculateTransmonTCAD, getCircuitTCADProfiles, SILICON_EPS_R, SAPPHIRE_EPS_R } from '../../quantum-engine/tcad-physics.js';

export default function PhysicalHamiltonianView() {
  const navigate = useNavigate();
  const circuit = useCircuitStore(state => state.circuit);
  const edaComponents = useEdaStore(state => state.components);
  const [activeTab, setActiveTab] = useState('terms'); // 'terms' | 'matrix' | 'pulses' | 'tcad'
  const [selectedQubit, setSelectedQubit] = useState(0);
  const [qubitOverrides, setQubitOverrides] = useState({});
  const [tcadNotice, setTcadNotice] = useState(null);
  const [showGeometryControls, setShowGeometryControls] = useState(true);
  const canvasRef = useRef(null);

  // Compute rigorous physical TCAD profiles for all qubits in the active circuit
  const tcadProfiles = useMemo(() => {
    const baseProfiles = getCircuitTCADProfiles(circuit, { components: edaComponents });
    return baseProfiles.map(p => {
      const q = p.qubitIndex;
      const override = qubitOverrides[q];
      if (!override) return p;
      const updated = calculateTransmonTCAD({
        padWidth_um: override.padWidth_um !== undefined ? override.padWidth_um : p.padWidth_um,
        padHeight_um: override.padHeight_um !== undefined ? override.padHeight_um : p.padHeight_um,
        padGap_um: override.padGap_um !== undefined ? override.padGap_um : p.padGap_um,
        inductance_nH: override.inductance_nH !== undefined ? override.inductance_nH : p.inductance_nH,
        epsR: override.epsR !== undefined ? override.epsR : p.epsR,
        resonator_freq_GHz: override.resonator_freq_GHz !== undefined ? override.resonator_freq_GHz : p.omega_r_GHz,
        coupling_cap_fF: override.coupling_cap_fF !== undefined ? override.coupling_cap_fF : 4.5
      });
      return {
        ...p,
        ...updated,
        source: override.isCustom ? 'Custom Lithography Tuning' : p.source
      };
    });
  }, [circuit, edaComponents, qubitOverrides]);

  const activeQubitProfile = tcadProfiles[selectedQubit] || tcadProfiles[0] || calculateTransmonTCAD();

  const calibration = useMemo(() => {
    return pulseEngine._calibration || {
      omega01_GHz: activeQubitProfile.omega01_GHz,
      anharmonicity_MHz: activeQubitProfile.alpha_MHz,
      Ec_MHz: activeQubitProfile.Ec_MHz,
      Ej_MHz: activeQubitProfile.Ej_MHz,
      coupling_g_MHz: activeQubitProfile.g_MHz || 12.4
    };
  }, [activeQubitProfile]);

  const updateGeometryParam = (key, val) => {
    setQubitOverrides(prev => ({
      ...prev,
      [selectedQubit]: {
        ...(prev[selectedQubit] || {
          padWidth_um: activeQubitProfile.padWidth_um,
          padHeight_um: activeQubitProfile.padHeight_um,
          padGap_um: activeQubitProfile.padGap_um,
          inductance_nH: activeQubitProfile.inductance_nH,
          epsR: activeQubitProfile.epsR,
          resonator_freq_GHz: activeQubitProfile.omega_r_GHz,
        }),
        [key]: val,
        isCustom: true
      }
    }));
  };

  const resetQubitGeometry = () => {
    setQubitOverrides(prev => {
      const next = { ...prev };
      delete next[selectedQubit];
      return next;
    });
    setTcadNotice(`Reset Q${selectedQubit} geometry to layout defaults.`);
    setTimeout(() => setTcadNotice(null), 3000);
  };

  const handleCalibratePulses = () => {
    CrossProductBridge.bridgeAnalogToPulse(activeQubitProfile);
    setTcadNotice(`✓ Calibrated Pulse Engine with Q${selectedQubit}: ω₀₁ = ${activeQubitProfile.omega01_GHz} GHz, α = ${activeQubitProfile.alpha_MHz} MHz, Ec = ${activeQubitProfile.Ec_MHz} MHz`);
    setTimeout(() => setTcadNotice(null), 4000);
  };

  // Compile microwave pulse schedule from circuit
  const schedule = useMemo(() => {
    if (!circuit || circuit.operations.length === 0) return null;
    try {
      return pulseEngine.compile(circuit);
    } catch {
      return null;
    }
  }, [circuit]);

  // Extract active Hamiltonian drive terms from circuit operations
  const activeTerms = useMemo(() => {
    const numQ = circuit?.numQubits || 2;
    const terms = [];

    // Drift Hamiltonian terms (always present for physical transmons)
    for (let q = 0; q < numQ; q++) {
      const qProfile = tcadProfiles[q] || tcadProfiles[0] || {};
      const freq = (qProfile.omega01_GHz || (calibration.omega01_GHz + (q * 0.08))).toFixed(3);
      const alpha = (qProfile.alpha_MHz || calibration.anharmonicity_MHz).toFixed(1);
      const ec = (qProfile.Ec_MHz || calibration.Ec_MHz).toFixed(1);
      terms.push({
        type: 'drift',
        qubit: q,
        symbol: `H₀,q${q}`,
        equation: `½ · ℏω₀₁ · σ_z`,
        value: `${freq} GHz · σ_z`,
        description: `Transmon Q${q} fundamental ground-to-excited splitting`,
        active: true
      });
      terms.push({
        type: 'anharmonicity',
        qubit: q,
        symbol: `H_α,q${q}`,
        equation: `½ · α · a†² a²`,
        value: `${alpha} MHz (Ec ≈ ${ec} MHz)`,
        description: `Transmon weakly-anharmonic cosine potential barrier`,
        active: true
      });
    }

    // Nearest-neighbor coupling terms
    for (let q = 0; q < numQ - 1; q++) {
      const qProfile = tcadProfiles[q] || {};
      const couplingG = (qProfile.g_MHz || calibration.coupling_g_MHz || 12.4).toFixed(1);
      terms.push({
        type: 'coupling',
        qubits: [q, q + 1],
        symbol: `H_int(q${q},q${q + 1})`,
        equation: `ℏg · (σ₊ · σ₋ + σ₋ · σ₊)`,
        value: `${couplingG} MHz · (σ_xσ_x + σ_yσ_y)`,
        description: `Capacitive CPW exchange coupling between Q${q} and Q${q + 1}`,
        active: true
      });
    }

    // Dynamic Microwave Drive terms from active gates
    const recentOps = (circuit?.operations || []).slice(-8);
    for (const op of recentOps) {
      if (['X', 'SX', 'RX'].includes(op.gate)) {
        terms.push({
          type: 'drive',
          qubit: op.qubits[0],
          symbol: `H_drive(q${op.qubits[0]})`,
          equation: `ℏΩ_x(t) · cos(ω_d t) · σ_x`,
          value: `Ω_rabi = 28.57 MHz · σ_x (Gate: ${op.gate})`,
          description: `Resonant microwave Gaussian/DRAG pulse on d${op.qubits[0]}`,
          active: true
        });
      } else if (['Y', 'RY'].includes(op.gate)) {
        terms.push({
          type: 'drive',
          qubit: op.qubits[0],
          symbol: `H_drive(q${op.qubits[0]})`,
          equation: `ℏΩ_y(t) · sin(ω_d t) · σ_y`,
          value: `Ω_rabi = 28.57 MHz · σ_y (Gate: ${op.gate})`,
          description: `Quad-phase (Q) microwave DRAG pulse on d${op.qubits[0]}`,
          active: true
        });
      } else if (['Z', 'S', 'SDG', 'T', 'TDG', 'RZ', 'P'].includes(op.gate)) {
        terms.push({
          type: 'frame',
          qubit: op.qubits[0],
          symbol: `H_frame(q${op.qubits[0]})`,
          equation: `Δθ · δ(t) · σ_z`,
          value: `Virtual-Z Frame Rotation (Gate: ${op.gate})`,
          description: `Zero-duration Hamiltonian reference frame phase shift`,
          active: true
        });
      } else if (['CX', 'CZ', 'CY'].includes(op.gate)) {
        const [c, t] = op.qubits;
        terms.push({
          type: 'cross-resonance',
          qubits: [c, t],
          symbol: `H_CR(q${c}→q${t})`,
          equation: `ℏΩ_CR(t) · (σ_z ⊗ σ_x)`,
          value: `g_eff = 3.82 MHz · (σ_${c}^z · σ_${t}^x) (Gate: ${op.gate})`,
          description: `Cross-Resonance off-resonant drive on control channel u${c}_${t}`,
          active: true
        });
      }
    }

    return terms;
  }, [circuit, calibration]);

  // Construct numerical 2-qubit or 1-qubit Hamiltonian matrix (in GHz)
  const hamiltonianMatrix = useMemo(() => {
    const q0 = tcadProfiles[0] || {};
    const q1 = tcadProfiles[1] || {};
    const w0 = q0.omega01_GHz || calibration.omega01_GHz || 5.024;
    const w1 = q1.omega01_GHz || (w0 + 0.082);
    const g = ((q0.g_MHz || calibration.coupling_g_MHz || 12.4)) / 1000.0; // convert MHz to GHz
    const numQ = Math.min(circuit?.numQubits || 2, 2);

    if (numQ === 1) {
      // 2x2 Single-Qubit Hamiltonian in rotating frame
      const omega = 0.028; // Rabi drive in GHz
      const hasX = circuit?.operations?.some(o => ['X', 'H', 'SX'].includes(o.gate));
      const hasY = circuit?.operations?.some(o => o.gate === 'Y');
      const reDrive = hasX ? omega / 2 : 0;
      const imDrive = hasY ? omega / 2 : 0;

      return {
        dim: 2,
        labels: ['|0⟩', '|1⟩'],
        matrix: [
          [{ re: (w0 / 2).toFixed(4), im: '0.0000' }, { re: reDrive.toFixed(4), im: (-imDrive).toFixed(4) }],
          [{ re: reDrive.toFixed(4), im: imDrive.toFixed(4) }, { re: (-w0 / 2).toFixed(4), im: '0.0000' }]
        ],
        eigenvalues: [
          (w0 / 2 + Math.sqrt(reDrive ** 2 + imDrive ** 2)).toFixed(4) + ' GHz',
          (-w0 / 2 - Math.sqrt(reDrive ** 2 + imDrive ** 2)).toFixed(4) + ' GHz'
        ]
      };
    }

    // 4x4 Two-Qubit Coupled Transmon Hamiltonian (GHz)
    const H00 = ((w0 + w1) / 2).toFixed(4);
    const H11 = ((w0 - w1) / 2).toFixed(4);
    const H22 = ((-w0 + w1) / 2).toFixed(4);
    const H33 = ((-w0 - w1) / 2).toFixed(4);
    const J = (g / 2).toFixed(4);

    return {
      dim: 4,
      labels: ['|00⟩', '|01⟩', '|10⟩', '|11⟩'],
      matrix: [
        [{ re: H00, im: '0' }, { re: '0', im: '0' }, { re: '0', im: '0' }, { re: '0', im: '0' }],
        [{ re: '0', im: '0' }, { re: H11, im: '0' }, { re: J, im: '0' }, { re: '0', im: '0' }],
        [{ re: '0', im: '0' }, { re: J, im: '0' }, { re: H22, im: '0' }, { re: '0', im: '0' }],
        [{ re: '0', im: '0' }, { re: '0', im: '0' }, { re: '0', im: '0' }, { re: H33, im: '0' }]
      ],
      eigenvalues: [
        H00 + ' GHz (Ground |00⟩)',
        (parseFloat(H11) + parseFloat(J)).toFixed(4) + ' GHz (|ψ₋⟩)',
        (parseFloat(H22) - parseFloat(J)).toFixed(4) + ' GHz (|ψ₊⟩)',
        H33 + ' GHz (Excited |11⟩)'
      ]
    };
  }, [circuit, calibration]);

  // Draw microwave pulse canvas if pulse tab is active
  useEffect(() => {
    if (activeTab !== 'pulses' || !schedule || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const channels = Object.keys(schedule.channels).filter(c => schedule.channels[c].length > 0);
    if (channels.length === 0) return;

    const rowH = 50;
    const pad = 12;
    const lblW = 40;
    const pxPerNs = 1.6;
    const drawW = Math.max(500, schedule.totalDuration * pxPerNs);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = (drawW + lblW + pad * 2) * dpr;
    canvas.height = (channels.length * rowH + pad * 2) * dpr;
    canvas.style.width = `${drawW + lblW + pad * 2}px`;
    canvas.style.height = `${channels.length * rowH + pad * 2}px`;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    channels.forEach((ch, idx) => {
      const y = pad + idx * rowH;
      const x = lblW + pad;

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(ch, lblW, y + rowH / 2 + 4);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(x, y + rowH / 2);
      ctx.lineTo(x + drawW, y + rowH / 2);
      ctx.stroke();

      const pulses = schedule.channels[ch];
      pulses.forEach(p => {
        if (p.type === 'frameChange') {
          const px = x + p.startTime * pxPerNs;
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px, y + 8);
          ctx.lineTo(px, y + rowH - 8);
          ctx.stroke();
        } else if (p.I && p.Q) {
          const numSamples = p.I.length;
          const scale = rowH / 2 - 8;

          // Q component (red)
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
          ctx.beginPath();
          for (let i = 0; i < numSamples; i++) {
            const px = x + (p.startTime + i * pulseEngine.dt) * pxPerNs;
            const py = y + rowH / 2 - p.Q[i] * scale;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          // I component (blue)
          ctx.strokeStyle = '#38bdf8';
          ctx.beginPath();
          for (let i = 0; i < numSamples; i++) {
            const px = x + (p.startTime + i * pulseEngine.dt) * pxPerNs;
            const py = y + rowH / 2 - p.I[i] * scale;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
      });
    });
  }, [activeTab, schedule]);

  const handleSimulateInAnalog = () => {
    CrossProductBridge.bridgeComposerToAnalog(navigate, { tcadProfile: activeQubitProfile });
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0d1117',
      color: '#e2e8f0',
      fontSize: '11px',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace'
    }}>
      {/* Sub-Header Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 8px',
        background: '#161b22',
        borderBottom: '1px solid #21262d',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'terms', label: '∿ Hamiltonian Terms' },
            { id: 'matrix', label: '▦ Matrix (GHz)' },
            { id: 'pulses', label: '〰 Microwave Pulses' },
            { id: 'tcad', label: '⚡ Silicon TCAD' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                border: activeTab === tab.id ? '1px solid #38bdf8' : '1px solid transparent',
                color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleSimulateInAnalog}
          title="Open Schrödinger Hamiltonian solver in Analog Node Engine"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2))',
            border: '1px solid #8b5cf6',
            color: '#c084fc',
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          ⚡ Sim in Analog
        </button>
      </div>

      {/* Main Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {/* Tab 1: Hamiltonian Terms */}
        {activeTab === 'terms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Master Equation Card */}
            <div style={{
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: '6px',
              padding: '8px 10px'
            }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                Total Transmon Physical Hamiltonian
              </div>
              <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>
                Ĥ(t) = Ĥ_drift + Ĥ_int + Ĥ_drive(t)
              </div>
              <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '4px', lineHeight: '1.4' }}>
                = ∑ [ ½ℏω_q σ_z - ½α a†²a² ] + ∑ ½ℏg (σ_xσ_x + σ_yσ_y) + ∑ ½ℏΩ_q(t) [ cosφ σ_x + sinφ σ_y ]
              </div>
            </div>

            {/* Active Terms Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Active Hamiltonian Components ({activeTerms.length} Terms)
              </div>
              {activeTerms.map((term, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 8px',
                    background: term.type === 'drive' ? 'rgba(56, 189, 248, 0.06)' : term.type === 'cross-resonance' ? 'rgba(168, 85, 247, 0.08)' : '#161b22',
                    border: '1px solid #21262d',
                    borderRadius: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: term.type === 'drive' ? '#38bdf8' : term.type === 'cross-resonance' ? '#a855f7' : '#22c55e'
                    }} />
                    <span style={{ fontWeight: 700, color: '#f1f5f9', fontFamily: 'monospace' }}>{term.symbol}</span>
                    <span style={{ color: '#64748b', fontSize: '10px' }}>({term.equation})</span>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, color: term.type === 'drive' ? '#38bdf8' : '#a855f7' }}>
                    {term.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Numerical Matrix */}
        {activeTab === 'matrix' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>
                Matrix Elements in Computational Basis <strong style={{ color: '#f1f5f9' }}>⟨i|Ĥ|j⟩ (Units: GHz)</strong>:
              </span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Dim: {hamiltonianMatrix.dim}×{hamiltonianMatrix.dim}</span>
            </div>

            {/* Matrix Grid */}
            <div style={{
              display: 'inline-block',
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: '6px',
              padding: '8px',
              overflowX: 'auto'
            }}>
              <table style={{ borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '11px', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '4px 8px', color: '#64748b' }}></th>
                    {hamiltonianMatrix.labels.map((lbl, idx) => (
                      <th key={idx} style={{ padding: '4px 8px', color: '#38bdf8', fontWeight: 600 }}>{lbl}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hamiltonianMatrix.matrix.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td style={{ padding: '4px 8px', color: '#38bdf8', fontWeight: 600 }}>
                        {hamiltonianMatrix.labels[rIdx]}
                      </td>
                      {row.map((val, cIdx) => {
                        const isDiag = rIdx === cIdx;
                        const isNonZero = parseFloat(val.re) !== 0 || parseFloat(val.im) !== 0;
                        return (
                          <td
                            key={cIdx}
                            style={{
                              padding: '4px 8px',
                              textAlign: 'center',
                              background: isDiag ? 'rgba(56, 189, 248, 0.08)' : isNonZero ? 'rgba(168, 85, 247, 0.08)' : 'transparent',
                              color: isDiag ? '#38bdf8' : isNonZero ? '#c084fc' : '#475569',
                              border: '1px solid #21262d',
                              fontWeight: isNonZero ? 600 : 400
                            }}
                          >
                            {val.re}{parseFloat(val.im) !== 0 ? ` + ${val.im}i` : ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Eigenvalues */}
            <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '4px', padding: '6px 10px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
                Energy Eigenvalues E_n
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontFamily: 'monospace', color: '#34d399' }}>
                {hamiltonianMatrix.eigenvalues.map((ev, i) => (
                  <span key={i}>E_{i} = <strong>{ev}</strong></span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Microwave Pulses */}
        {activeTab === 'pulses' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#94a3b8' }}>
              <span>Drive Voltage Envelopes: <span style={{ color: '#38bdf8' }}>● I(t) In-Phase</span> | <span style={{ color: '#ef4444' }}>● Q(t) Quadrature</span></span>
              {schedule && <span style={{ color: '#64748b' }}>Duration: {schedule.totalDuration} ns</span>}
            </div>
            {!schedule ? (
              <div style={{ textAlign: 'center', color: '#64748b', marginTop: '30px' }}>
                Add gates to the circuit canvas to synthesize microwave pulse waveforms.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #21262d', borderRadius: '4px', background: '#090d16' }}>
                <canvas ref={canvasRef} />
              </div>
            )}
          </div>
        )}

        {/* Tab 4: TCAD Silicon Parameters & Real Physical Math */}
        {activeTab === 'tcad' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Feedback notification toast if calibrated */}
            {tcadNotice && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid #22c55e',
                color: '#4ade80',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>{tcadNotice}</span>
                <button
                  onClick={() => setTcadNotice(null)}
                  style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontSize: '11px' }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Qubit Selector & Action Toolbar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#161b22',
              border: '1px solid #21262d',
              borderRadius: '6px',
              padding: '6px 8px',
              flexWrap: 'wrap',
              gap: '6px'
            }}>
              {/* Qubit Selector Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, marginRight: '4px', textTransform: 'uppercase' }}>
                  Target Qubit:
                </span>
                {tcadProfiles.map((p, idx) => {
                  const isSel = idx === selectedQubit;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedQubit(idx)}
                      style={{
                        background: isSel ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: isSel ? '1px solid #38bdf8' : '1px solid #30363d',
                        color: isSel ? '#38bdf8' : '#94a3b8',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '10px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>Q{idx}</span>
                      <span style={{ color: isSel ? '#34d399' : '#64748b', fontFamily: 'monospace' }}>
                        {p.omega01_GHz} GHz
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={handleCalibratePulses}
                  title="Inject these physical TCAD Hamiltonian parameters into the Microwave Pulse Engine"
                  style={{
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid #0284c7',
                    color: '#38bdf8',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ⚡ Calibrate Pulse Engine
                </button>
                <button
                  onClick={resetQubitGeometry}
                  title="Reset geometry to default mask layout"
                  style={{
                    background: 'transparent',
                    border: '1px solid #30363d',
                    color: '#94a3b8',
                    borderRadius: '4px',
                    padding: '3px 6px',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Reset
                </button>
              </div>
            </div>

            {/* Lithography Geometry Tuning Controls */}
            <div style={{
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: '6px',
              padding: '8px 10px'
            }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: showGeometryControls ? '8px' : '0px',
                  cursor: 'pointer'
                }}
                onClick={() => setShowGeometryControls(s => !s)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#38bdf8', fontSize: '11px' }}>📐</span>
                  <span style={{ fontSize: '10px', color: '#f1f5f9', fontWeight: 700, textTransform: 'uppercase' }}>
                    Lithography Mask & Substrate Parameters (Q{selectedQubit})
                  </span>
                  <span style={{
                    fontSize: '9px',
                    color: activeQubitProfile.source.includes('EDA') ? '#34d399' : '#a855f7',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '1px 5px',
                    borderRadius: '3px'
                  }}>
                    {activeQubitProfile.source}
                  </span>
                </div>
                <span style={{ color: '#64748b', fontSize: '10px' }}>
                  {showGeometryControls ? '▲ Hide Controls' : '▼ Edit Lithography'}
                </span>
              </div>

              {showGeometryControls && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                  {/* Pad Width W */}
                  <div style={{ background: '#0d1117', border: '1px solid #21262d', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '10px', marginBottom: '3px' }}>
                      <span>Pad Width (W)</span>
                      <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 600 }}>
                        {activeQubitProfile.padWidth_um} µm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="800"
                      step="5"
                      value={activeQubitProfile.padWidth_um}
                      onChange={e => updateGeometryParam('padWidth_um', parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#38bdf8' }}
                    />
                  </div>

                  {/* Pad Height H */}
                  <div style={{ background: '#0d1117', border: '1px solid #21262d', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '10px', marginBottom: '3px' }}>
                      <span>Pad Height (H)</span>
                      <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 600 }}>
                        {activeQubitProfile.padHeight_um} µm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="600"
                      step="5"
                      value={activeQubitProfile.padHeight_um}
                      onChange={e => updateGeometryParam('padHeight_um', parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#38bdf8' }}
                    />
                  </div>

                  {/* Trench Ground Gap S */}
                  <div style={{ background: '#0d1117', border: '1px solid #21262d', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '10px', marginBottom: '3px' }}>
                      <span>Trench Gap (S)</span>
                      <span style={{ fontFamily: 'monospace', color: '#f59e0b', fontWeight: 600 }}>
                        {activeQubitProfile.padGap_um} µm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="80"
                      step="1"
                      value={activeQubitProfile.padGap_um}
                      onChange={e => updateGeometryParam('padGap_um', parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#f59e0b' }}
                    />
                  </div>

                  {/* Josephson Inductance L_J */}
                  <div style={{ background: '#0d1117', border: '1px solid #21262d', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '10px', marginBottom: '3px' }}>
                      <span>Junction Inductance (L_J)</span>
                      <span style={{ fontFamily: 'monospace', color: '#a855f7', fontWeight: 600 }}>
                        {activeQubitProfile.inductance_nH} nH
                      </span>
                    </div>
                    <input
                      type="range"
                      min="4.0"
                      max="25.0"
                      step="0.1"
                      value={activeQubitProfile.inductance_nH}
                      onChange={e => updateGeometryParam('inductance_nH', parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#a855f7' }}
                    />
                  </div>

                  {/* Substrate Dielectric Selection */}
                  <div style={{ background: '#0d1117', border: '1px solid #21262d', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}>Substrate Dielectric</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => updateGeometryParam('epsR', SILICON_EPS_R)}
                        style={{
                          flex: 1,
                          padding: '3px 4px',
                          fontSize: '9.5px',
                          borderRadius: '3px',
                          border: activeQubitProfile.epsR === SILICON_EPS_R ? '1px solid #38bdf8' : '1px solid #30363d',
                          background: activeQubitProfile.epsR === SILICON_EPS_R ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                          color: activeQubitProfile.epsR === SILICON_EPS_R ? '#38bdf8' : '#94a3b8',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Float-Zone Si (11.7)
                      </button>
                      <button
                        onClick={() => updateGeometryParam('epsR', SAPPHIRE_EPS_R)}
                        style={{
                          flex: 1,
                          padding: '3px 4px',
                          fontSize: '9.5px',
                          borderRadius: '3px',
                          border: activeQubitProfile.epsR === SAPPHIRE_EPS_R ? '1px solid #38bdf8' : '1px solid #30363d',
                          background: activeQubitProfile.epsR === SAPPHIRE_EPS_R ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                          color: activeQubitProfile.epsR === SAPPHIRE_EPS_R ? '#38bdf8' : '#94a3b8',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Sapphire (10.0)
                      </button>
                    </div>
                  </div>

                  {/* Readout Cavity Frequency */}
                  <div style={{ background: '#0d1117', border: '1px solid #21262d', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '10px', marginBottom: '3px' }}>
                      <span>Readout Cavity (ω_r)</span>
                      <span style={{ fontFamily: 'monospace', color: '#e879f9', fontWeight: 600 }}>
                        {activeQubitProfile.omega_r_GHz} GHz
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5.0"
                      max="9.0"
                      step="0.05"
                      value={activeQubitProfile.omega_r_GHz}
                      onChange={e => updateGeometryParam('resonator_freq_GHz', parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#e879f9' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 8 Step-by-Step Mathematical Derivation Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
              {/* Card 1: Total Capacitance */}
              <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '6px', padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div>
                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      1. Conformal Electrostatics
                    </span>
                    <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '11px' }}>
                      Total Island Capacitance C_Σ
                    </div>
                  </div>
                  <div style={{ color: '#34d399', fontWeight: 700, fontSize: '14px', fontFamily: 'monospace' }}>
                    {activeQubitProfile.C_sigma_fF} fF
                  </div>
                </div>
                <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>
                  {activeQubitProfile.derivations.capacitance.formula}
                </div>
                <div style={{ background: '#090d16', border: '1px solid #21262d', borderRadius: '3px', padding: '3px 6px', fontFamily: 'monospace', fontSize: '9.5px', color: '#94a3b8', marginBottom: '4px' }}>
                  {activeQubitProfile.derivations.capacitance.substitution}
                </div>
                <div style={{ color: '#64748b', fontSize: '9px' }}>
                  {activeQubitProfile.derivations.capacitance.physics}
                </div>
              </div>

              {/* Card 2: Charging Energy */}
              <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '6px', padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div>
                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      2. Single-Electron Coulomb Energy
                    </span>
                    <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '11px' }}>
                      Charging Energy E_C
                    </div>
                  </div>
                  <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '14px', fontFamily: 'monospace' }}>
                    {activeQubitProfile.Ec_MHz} MHz
                  </div>
                </div>
                <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>
                  {activeQubitProfile.derivations.chargingEnergy.formula}
                </div>
                <div style={{ background: '#090d16', border: '1px solid #21262d', borderRadius: '3px', padding: '3px 6px', fontFamily: 'monospace', fontSize: '9.5px', color: '#94a3b8', marginBottom: '4px' }}>
                  {activeQubitProfile.derivations.chargingEnergy.substitution}
                </div>
                <div style={{ color: '#64748b', fontSize: '9px' }}>
                  {activeQubitProfile.derivations.chargingEnergy.physics}
                </div>
              </div>

              {/* Card 3: Josephson Energy */}
              <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '6px', padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div>
                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      3. Cooper-Pair Tunneling Energy
                    </span>
                    <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '11px' }}>
                      Josephson Coupling E_J & I_c
                    </div>
                  </div>
                  <div style={{ color: '#a855f7', fontWeight: 700, fontSize: '14px', fontFamily: 'monospace' }}>
                    {activeQubitProfile.Ej_GHz} GHz
                  </div>
                </div>
                <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>
                  {activeQubitProfile.derivations.josephsonEnergy.formula}
                </div>
                <div style={{ background: '#090d16', border: '1px solid #21262d', borderRadius: '3px', padding: '3px 6px', fontFamily: 'monospace', fontSize: '9.5px', color: '#94a3b8', marginBottom: '4px' }}>
                  {activeQubitProfile.derivations.josephsonEnergy.substitution}
                </div>
                <div style={{ color: '#64748b', fontSize: '9px' }}>
                  {activeQubitProfile.derivations.josephsonEnergy.physics}
                </div>
              </div>

              {/* Card 4: Qubit Frequency */}
              <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '6px', padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div>
                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      4. Koch et al. Perturbation Theory
                    </span>
                    <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '11px' }}>
                      Qubit Frequency ℏω₀₁
                    </div>
                  </div>
                  <div style={{ color: '#34d399', fontWeight: 700, fontSize: '14px', fontFamily: 'monospace' }}>
                    {activeQubitProfile.omega01_GHz} GHz
                  </div>
                </div>
                <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>
                  {activeQubitProfile.derivations.qubitFrequency.formula}
                </div>
                <div style={{ background: '#090d16', border: '1px solid #21262d', borderRadius: '3px', padding: '3px 6px', fontFamily: 'monospace', fontSize: '9.5px', color: '#94a3b8', marginBottom: '4px' }}>
                  {activeQubitProfile.derivations.qubitFrequency.substitution}
                </div>
                <div style={{ color: '#64748b', fontSize: '9px' }}>
                  {activeQubitProfile.derivations.qubitFrequency.physics}
                </div>
              </div>

              {/* Card 5: Anharmonicity */}
              <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '6px', padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div>
                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      5. Weak Nonlinearity (Kerr Shift)
                    </span>
                    <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '11px' }}>
                      Negative Anharmonicity α
                    </div>
                  </div>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '14px', fontFamily: 'monospace' }}>
                    {activeQubitProfile.alpha_MHz} MHz
                  </div>
                </div>
                <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>
                  {activeQubitProfile.derivations.anharmonicity.formula}
                </div>
                <div style={{ background: '#090d16', border: '1px solid #21262d', borderRadius: '3px', padding: '3px 6px', fontFamily: 'monospace', fontSize: '9.5px', color: '#94a3b8', marginBottom: '4px' }}>
                  {activeQubitProfile.derivations.anharmonicity.substitution}
                </div>
                <div style={{ color: '#64748b', fontSize: '9px' }}>
                  {activeQubitProfile.derivations.anharmonicity.physics}
                </div>
              </div>

              {/* Card 6: Quantum Zero-Point Fluctuations */}
              <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '6px', padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div>
                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      6. Ground-State Wavepacket Width
                    </span>
                    <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '11px' }}>
                      Quantum ZPF (Δφ & Δn)
                    </div>
                  </div>
                  <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '12px', fontFamily: 'monospace' }}>
                    Δφ = {activeQubitProfile.phi_zpf} rad
                  </div>
                </div>
                <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>
                  {activeQubitProfile.derivations.quantumFluctuations.formula}
                </div>
                <div style={{ background: '#090d16', border: '1px solid #21262d', borderRadius: '3px', padding: '3px 6px', fontFamily: 'monospace', fontSize: '9.5px', color: '#94a3b8', marginBottom: '4px' }}>
                  {activeQubitProfile.derivations.quantumFluctuations.substitution}
                </div>
                <div style={{ color: '#64748b', fontSize: '9px' }}>
                  {activeQubitProfile.derivations.quantumFluctuations.physics}
                </div>
              </div>

              {/* Card 7: Charge Dispersion */}
              <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '6px', padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div>
                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      7. 1/f Charge-Noise Dephasing Immunity
                    </span>
                    <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '11px' }}>
                      Charge Dispersion ε₀₁
                    </div>
                  </div>
                  <div style={{ color: '#34d399', fontWeight: 700, fontSize: '14px', fontFamily: 'monospace' }}>
                    {activeQubitProfile.eps01_kHz < 0.001 ? '< 0.001' : activeQubitProfile.eps01_kHz} kHz
                  </div>
                </div>
                <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>
                  {activeQubitProfile.derivations.chargeDispersion.formula}
                </div>
                <div style={{ background: '#090d16', border: '1px solid #21262d', borderRadius: '3px', padding: '3px 6px', fontFamily: 'monospace', fontSize: '9.5px', color: '#94a3b8', marginBottom: '4px' }}>
                  {activeQubitProfile.derivations.chargeDispersion.substitution}
                </div>
                <div style={{ color: '#64748b', fontSize: '9px' }}>
                  {activeQubitProfile.derivations.chargeDispersion.physics}
                </div>
              </div>

              {/* Card 8: Dispersive Readout Coupling */}
              <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '6px', padding: '8px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div>
                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      8. Jaynes-Cummings QND Readout
                    </span>
                    <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '11px' }}>
                      Dispersive Shift χ & g
                    </div>
                  </div>
                  <div style={{ color: '#c084fc', fontWeight: 700, fontSize: '14px', fontFamily: 'monospace' }}>
                    χ = {activeQubitProfile.chi_MHz} MHz
                  </div>
                </div>
                <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>
                  {activeQubitProfile.derivations.dispersiveReadout.formula}
                </div>
                <div style={{ background: '#090d16', border: '1px solid #21262d', borderRadius: '3px', padding: '3px 6px', fontFamily: 'monospace', fontSize: '9.5px', color: '#94a3b8', marginBottom: '4px' }}>
                  {activeQubitProfile.derivations.dispersiveReadout.substitution}
                </div>
                <div style={{ color: '#64748b', fontSize: '9px' }}>
                  {activeQubitProfile.derivations.dispersiveReadout.physics}
                </div>
              </div>
            </div>

            {/* Operating Regime Banner */}
            <div style={{
              background: '#161b22',
              border: '1px solid #30363d',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              color: '#94a3b8',
              lineHeight: '1.5'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  background: activeQubitProfile.ej_ec_ratio >= 50 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: activeQubitProfile.ej_ec_ratio >= 50 ? '#34d399' : '#f87171',
                  border: `1px solid ${activeQubitProfile.ej_ec_ratio >= 50 ? '#22c55e' : '#ef4444'}`,
                  borderRadius: '10px',
                  padding: '1px 8px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  fontSize: '10px'
                }}>
                  E_J / E_C = {activeQubitProfile.ej_ec_ratio}
                </span>
                <strong style={{ color: '#f1f5f9' }}>
                  {activeQubitProfile.ej_ec_ratio >= 50 ? 'Transmon Operating Regime (Phase Protected)' : 'Sub-Transmon / Charge-Sensitive Regime'}
                </strong>
              </div>
              <div>
                With <span style={{ color: '#34d399', fontFamily: 'monospace' }}>E_J/E_C = {activeQubitProfile.ej_ec_ratio} &gt; 50</span>, the transmon ground-state wavepacket width is <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>Δφ = {activeQubitProfile.phi_zpf} rad</span>, exponentially suppressing charge-dispersion dephasing to <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{activeQubitProfile.eps01_kHz < 0.001 ? '< 0.001' : activeQubitProfile.eps01_kHz} kHz</span>. At the same time, weak negative anharmonicity (<span style={{ color: '#f59e0b', fontFamily: 'monospace' }}>α = {activeQubitProfile.alpha_MHz} MHz</span>) prevents parasitic driving into the non-computational second excited state |2⟩.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

