import React, { useState, useEffect } from 'react';
import { useEdaStore } from '../../stores/edaStore';

export default function QuantumAnalysisPanel() {
  const [activeTab, setActiveTab] = useState('cpw');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Store access
  const selectedComponentId = useEdaStore((state) => state.selectedComponentId);
  const components = useEdaStore((state) => state.components) || [];
  const updateComponentParams = useEdaStore((state) => state.updateComponentParams);
  const selectedComponent = components.find((c) => c.id === selectedComponentId);

  // CPW State
  const [cpwFreq, setCpwFreq] = useState(5.0);
  const [cpwWidth, setCpwWidth] = useState(10.0);
  const [cpwGap, setCpwGap] = useState(6.0);
  const [cpwEps, setCpwEps] = useState(11.45);
  const [cpwRes, setCpwRes] = useState(null);

  // Transmon State
  const [ej, setEj] = useState(14000.0);
  const [ec, setEc] = useState(300.0);
  const [ng, setNg] = useState(0.0);
  const [transmonRes, setTransmonRes] = useState(null);

  // Kappa State
  const [kappaFreq, setKappaFreq] = useState(5.0);
  const [kappaCin, setKappaCin] = useState(10.0);
  const [kappaRes, setKappaRes] = useState(null);

  // LOM State
  const [lomLj, setLomLj] = useState(12.0);
  const [lomCj, setLomCj] = useState(2.0);
  const [lomFreqReadout, setLomFreqReadout] = useState(7.0);
  const [lomFreqBus, setLomFreqBus] = useState(6.0);
  const [lomRes, setLomRes] = useState(null);

  // Auto-run CPW calculation
  useEffect(() => {
    let cancelled = false;
    async function runCpw() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:8000/api/eda/analysis/cpw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            freq_ghz: cpwFreq,
            line_width_um: cpwWidth,
            line_gap_um: cpwGap,
            dielectric_constant: cpwEps,
          }),
        });
        const data = await res.json();
        if (!cancelled && data.status === 'success') {
          setCpwRes(data);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const timer = setTimeout(runCpw, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cpwFreq, cpwWidth, cpwGap, cpwEps]);

  // Auto-run Transmon calculation
  useEffect(() => {
    let cancelled = false;
    async function runTransmon() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:8000/api/eda/analysis/transmon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Ej_MHz: ej,
            Ec_MHz: ec,
            ng: ng,
          }),
        });
        const data = await res.json();
        if (!cancelled && data.status === 'success') {
          setTransmonRes(data);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const timer = setTimeout(runTransmon, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ej, ec, ng]);

  // Auto-run Kappa calculation
  useEffect(() => {
    let cancelled = false;
    async function runKappa() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:8000/api/eda/analysis/kappa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            freq_ghz: kappaFreq,
            Cin_fF: kappaCin,
            freq_res_ghz: kappaFreq,
          }),
        });
        const data = await res.json();
        if (!cancelled && data.status === 'success') {
          setKappaRes(data);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const timer = setTimeout(runKappa, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [kappaFreq, kappaCin]);

  // Auto-run LOM calculation
  useEffect(() => {
    let cancelled = false;
    async function runLom() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:8000/api/eda/analysis/lom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Lj_nH: lomLj,
            Cj_fF: lomCj,
            freq_readout_GHz: lomFreqReadout,
            freq_bus_GHz: [lomFreqBus],
          }),
        });
        const data = await res.json();
        if (!cancelled && data.status === 'success') {
          setLomRes(data);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const timer = setTimeout(runLom, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [lomLj, lomCj, lomFreqReadout, lomFreqBus]);

  // Helper to apply CPW parameters to currently selected component
  const applyCpwToComponent = () => {
    if (!selectedComponent) return;
    const p = selectedComponent.params || {};
    const updated = { ...p };
    if ('trace_width' in p || 'width' in p) {
      if ('trace_width' in p) updated.trace_width = `${cpwWidth}um`;
      if ('width' in p) updated.width = `${cpwWidth}um`;
    }
    if ('trace_gap' in p || 'gap' in p) {
      if ('trace_gap' in p) updated.trace_gap = `${cpwGap}um`;
      if ('gap' in p) updated.gap = `${cpwGap}um`;
    }
    updateComponentParams(selectedComponent.id, updated);
    alert(`Applied trace_width: ${cpwWidth}um and gap: ${cpwGap}um to ${selectedComponent.name || selectedComponent.type}!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e', color: '#e4e4e7', fontSize: '12px' }}>
      {/* Sub-tabs header */}
      <div style={{ display: 'flex', background: '#252526', borderBottom: '1px solid #3f3f46' }}>
        <button
          onClick={() => setActiveTab('cpw')}
          style={{
            flex: 1,
            padding: '6px 8px',
            background: activeTab === 'cpw' ? '#1e1e1e' : 'transparent',
            color: activeTab === 'cpw' ? '#38bdf8' : '#9ca3af',
            border: 'none',
            borderBottom: activeTab === 'cpw' ? '2px solid #38bdf8' : '2px solid transparent',
            fontWeight: activeTab === 'cpw' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          CPW Line
        </button>
        <button
          onClick={() => setActiveTab('transmon')}
          style={{
            flex: 1,
            padding: '6px 8px',
            background: activeTab === 'transmon' ? '#1e1e1e' : 'transparent',
            color: activeTab === 'transmon' ? '#a855f7' : '#9ca3af',
            border: 'none',
            borderBottom: activeTab === 'transmon' ? '2px solid #a855f7' : '2px solid transparent',
            fontWeight: activeTab === 'transmon' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          Transmon CPB
        </button>
        <button
          onClick={() => setActiveTab('kappa')}
          style={{
            flex: 1,
            padding: '6px 8px',
            background: activeTab === 'kappa' ? '#1e1e1e' : 'transparent',
            color: activeTab === 'kappa' ? '#10b981' : '#9ca3af',
            border: 'none',
            borderBottom: activeTab === 'kappa' ? '2px solid #10b981' : '2px solid transparent',
            fontWeight: activeTab === 'kappa' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          Coupling (κ)
        </button>
        <button
          onClick={() => setActiveTab('lom')}
          style={{
            flex: 1,
            padding: '6px 8px',
            background: activeTab === 'lom' ? '#1e1e1e' : 'transparent',
            color: activeTab === 'lom' ? '#f59e0b' : '#9ca3af',
            border: 'none',
            borderBottom: activeTab === 'lom' ? '2px solid #f59e0b' : '2px solid transparent',
            fontWeight: activeTab === 'lom' ? 'bold' : 'normal',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          LOM & EPR
        </button>
      </div>

      {/* Main Tab Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {error && (
          <div style={{ background: '#451a1a', color: '#fca5a5', padding: '6px 8px', borderRadius: '4px', marginBottom: '8px', fontSize: '11px' }}>
            {error}
          </div>
        )}

        {/* ─── TAB 1: CPW Line ─── */}
        {activeTab === 'cpw' && (
          <div>
            <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '8px', lineHeight: '1.4' }}>
              Computes guided impedance <code style={{ color: '#38bdf8' }}>Z₀</code> and quarter-wave resonator length using conformal mapping (<code style={{ color: '#38bdf8' }}>cpw_calculations</code>).
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af' }}>Trace Width (s): {cpwWidth} µm</label>
                <input
                  type="range"
                  min="2"
                  max="30"
                  step="0.5"
                  value={cpwWidth}
                  onChange={(e) => setCpwWidth(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af' }}>Gap Width (w): {cpwGap} µm</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={cpwGap}
                  onChange={(e) => setCpwGap(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af' }}>Frequency: {cpwFreq} GHz</label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="0.1"
                  value={cpwFreq}
                  onChange={(e) => setCpwFreq(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af' }}>Substrate εᵣ: {cpwEps}</label>
                <input
                  type="number"
                  step="0.05"
                  value={cpwEps}
                  onChange={(e) => setCpwEps(parseFloat(e.target.value))}
                  style={{ width: '100%', background: '#2d2d30', color: '#fff', border: '1px solid #3f3f46', borderRadius: '3px', padding: '2px 4px', fontSize: '11px' }}
                />
              </div>
            </div>

            {cpwRes && (
              <div style={{ background: '#252526', borderRadius: '6px', padding: '8px', border: '1px solid #3f3f46' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 'bold', color: '#38bdf8', fontSize: '13px' }}>
                    Z₀ = {cpwRes.Z0?.toFixed(2)} Ω
                  </span>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: Math.abs(cpwRes.Z0 - 50.0) < 2.0 ? '#065f46' : '#78350f',
                    color: Math.abs(cpwRes.Z0 - 50.0) < 2.0 ? '#34d399' : '#fde68a',
                  }}>
                    {Math.abs(cpwRes.Z0 - 50.0) < 2.0 ? 'Matched ~50Ω' : '≠ Off 50Ω'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px', color: '#d4d4d8', marginBottom: '8px' }}>
                  <div>ε_eff: <strong>{cpwRes.eps_eff?.toFixed(2)}</strong></div>
                  <div>Filling Factor q: <strong>{cpwRes.filling_factor?.toFixed(3)}</strong></div>
                  <div>λ_guided: <strong>{cpwRes.guided_wavelength_mm?.toFixed(2)} mm</strong></div>
                  <div>λ/4 Length: <strong style={{ color: '#38bdf8' }}>{cpwRes.quarter_wave_len_mm?.toFixed(2)} mm</strong></div>
                  <div>Capacitance: <strong>{(cpwRes.capacitance_per_m_fF / 1000)?.toFixed(1)} fF/mm</strong></div>
                  <div>Inductance: <strong>{(cpwRes.geometric_inductance_per_m_nH / 1000)?.toFixed(2)} nH/mm</strong></div>
                </div>

                {selectedComponent && (
                  <button
                    onClick={applyCpwToComponent}
                    style={{
                      width: '100%',
                      padding: '5px',
                      background: '#0284c7',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    Apply ({cpwWidth}µm / {cpwGap}µm) to "{selectedComponent.name || selectedComponent.type}"
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: Transmon CPB ─── */}
        {activeTab === 'transmon' && (
          <div>
            <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '8px', lineHeight: '1.4' }}>
              Cooper Pair Box Hamiltonian diagonalization in charge basis (<code style={{ color: '#a855f7' }}>Hcpb</code>) and exact Mathieu analytical eigensolver.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af' }}>Ej: {ej.toFixed(0)} MHz</label>
                <input
                  type="range"
                  min="5000"
                  max="35000"
                  step="250"
                  value={ej}
                  onChange={(e) => setEj(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#a855f7' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af' }}>Ec: {ec.toFixed(0)} MHz</label>
                <input
                  type="range"
                  min="150"
                  max="600"
                  step="10"
                  value={ec}
                  onChange={(e) => setEc(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#a855f7' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af' }}>Offset Charge ng: {ng.toFixed(2)} (2e)</label>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.05"
                  value={ng}
                  onChange={(e) => setNg(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#a855f7' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af' }}>Ej / Ec Ratio</label>
                <div style={{ color: (ej / ec) > 25 ? '#34d399' : '#f87171', fontWeight: 'bold', paddingTop: '4px' }}>
                  {(ej / ec).toFixed(1)} {ej / ec > 25 ? '(Transmon Regime)' : '(CPB / Charge sensitive)'}
                </div>
              </div>
            </div>

            {transmonRes && (
              <div style={{ background: '#252526', borderRadius: '6px', padding: '8px', border: '1px solid #3f3f46' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>Qubit Frequency f₀₁</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#a855f7' }}>
                      {(transmonRes.f01_MHz / 1000)?.toFixed(3)} GHz
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>Anharmonicity α</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f43f5e' }}>
                      {transmonRes.anharmonicity_MHz?.toFixed(1)} MHz
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>Charge Dispersion Δε₀₁</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8' }}>
                      {transmonRes.charge_dispersion_f01_kHz < 1 ? '< 1 kHz (Protected)' : `${transmonRes.charge_dispersion_f01_kHz?.toFixed(1)} kHz`}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>f₁₂ Transition</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#d4d4d8' }}>
                      {(transmonRes.f12_MHz / 1000)?.toFixed(3)} GHz
                    </div>
                  </div>
                </div>

                {/* Wavefunction Preview SVG */}
                {transmonRes.theta && transmonRes.psi0 && (
                  <div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Wavefunctions ψₖ(θ) vs Junction Phase θ [-π, π]</span>
                      <span style={{ color: '#a855f7' }}>|0⟩ (Purple) |1⟩ (Cyan)</span>
                    </div>
                    <svg viewBox="0 0 240 70" style={{ width: '100%', height: '70px', background: '#18181b', borderRadius: '4px' }}>
                      {/* Zero line */}
                      <line x1="0" y1="35" x2="240" y2="35" stroke="#333" strokeDasharray="2,2" />
                      {/* Polyline for psi0 */}
                      <polyline
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="1.5"
                        points={transmonRes.psi0.map((v, i) => {
                          const x = (i / (transmonRes.psi0.length - 1)) * 240;
                          const y = 35 - v * 80;
                          return `${x},${y}`;
                        }).join(' ')}
                      />
                      {/* Polyline for psi1 */}
                      <polyline
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        points={transmonRes.psi1.map((v, i) => {
                          const x = (i / (transmonRes.psi1.length - 1)) * 240;
                          const y = 35 - v * 80;
                          return `${x},${y}`;
                        }).join(' ')}
                      />
                    </svg>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: Coupling & Loss (kappa) ─── */}
        {activeTab === 'kappa' && (
          <div>
            <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '8px', lineHeight: '1.4' }}>
              Calculates photon escape rate <code style={{ color: '#10b981' }}>κ</code>, external quality factor <code style={{ color: '#10b981' }}>Q_ext</code>, and photon cavity lifetime (<code style={{ color: '#10b981' }}>kappa_calculation</code>).
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af' }}>Resonator Frequency: {kappaFreq} GHz</label>
                <input
                  type="range"
                  min="3"
                  max="10"
                  step="0.1"
                  value={kappaFreq}
                  onChange={(e) => setKappaFreq(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#10b981' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af' }}>Coupling Cap C_c: {kappaCin} fF</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="0.5"
                  value={kappaCin}
                  onChange={(e) => setKappaCin(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#10b981' }}
                />
              </div>
            </div>

            {kappaRes && (
              <div style={{ background: '#252526', borderRadius: '6px', padding: '8px', border: '1px solid #3f3f46' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>Photon Loss κ / 2π</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
                      {(kappaRes.kappa_MHz * 1000)?.toFixed(2)} kHz
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>External Quality Factor Q_ext</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#38bdf8' }}>
                      {kappaRes.Q_ext?.toExponential(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>Cavity Lifetime τ</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fbbf24' }}>
                      {(kappaRes.photon_lifetime_ns / 1000)?.toFixed(2)} µs
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>Coupling Regime</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: kappaRes.Q_ext > 1e5 ? '#34d399' : '#f87171' }}>
                      {kappaRes.Q_ext > 1e5 ? 'High-Q / Dispersive' : 'Fast Readout'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 4: LOM & EPR ─── */}
        {activeTab === 'lom' && (
          <div>
            <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '8px', lineHeight: '1.4' }}>
              Extracts Hamiltonian parameters from Maxwell Capacitance matrices using the Lumped Oscillator Model (<code style={{ color: '#f59e0b' }}>LOManalysis</code>).
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af' }}>Junction Lj: {lomLj} nH</label>
                <input
                  type="range"
                  min="6"
                  max="20"
                  step="0.5"
                  value={lomLj}
                  onChange={(e) => setLomLj(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#f59e0b' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af' }}>Junction Cj: {lomCj} fF</label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={lomCj}
                  onChange={(e) => setLomCj(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#f59e0b' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af' }}>Readout Resonator: {lomFreqReadout} GHz</label>
                <input
                  type="range"
                  min="5"
                  max="9"
                  step="0.1"
                  value={lomFreqReadout}
                  onChange={(e) => setLomFreqReadout(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#f59e0b' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#9ca3af' }}>Bus Resonator: {lomFreqBus} GHz</label>
                <input
                  type="range"
                  min="4"
                  max="8"
                  step="0.1"
                  value={lomFreqBus}
                  onChange={(e) => setLomFreqBus(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#f59e0b' }}
                />
              </div>
            </div>

            {lomRes && (
              <div style={{ background: '#252526', borderRadius: '6px', padding: '8px', border: '1px solid #3f3f46', marginBottom: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>Qubit Frequency f_Q</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f59e0b' }}>
                      {lomRes.fQ_GHz?.toFixed(3)} GHz
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>Charging Energy E_C</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#a855f7' }}>
                      {lomRes.EC_MHz?.toFixed(1)} MHz
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>Readout Coupling g_r</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}>
                      {lomRes.g_readout_MHz?.toFixed(2)} MHz
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>Dispersive Shift χ_r</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8' }}>
                      {lomRes.chi_readout_MHz?.toFixed(3)} MHz
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>Bus Coupling g_b</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}>
                      {lomRes.g_bus1_MHz?.toFixed(2)} MHz
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>Bus Shift χ_b</div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8' }}>
                      {lomRes.chi_bus1_MHz?.toFixed(3)} MHz
                    </div>
                  </div>
                </div>

                {/* Matrix labels display */}
                {lomRes.matrix_labels && (
                  <div style={{ fontSize: '10px', color: '#71717a', borderTop: '1px solid #333', paddingTop: '4px' }}>
                    Capacitance Matrix: {lomRes.matrix_labels.join(' × ')} (5×5 system)
                  </div>
                )}
              </div>
            )}

            <div style={{ background: '#252526', borderRadius: '6px', padding: '8px', border: '1px solid #3f3f46', marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px', fontSize: '11px' }}>
                Python SDK & Jupyter Notebook Integration
              </div>
              <div style={{ fontFamily: 'Consolas, monospace', fontSize: '10px', color: '#d4d4d8', background: '#18181b', padding: '6px', borderRadius: '4px', overflowX: 'auto', lineHeight: '1.4' }}>
                <span style={{ color: '#6ee7b7' }}>from</span> alpha.analyses <span style={{ color: '#6ee7b7' }}>import</span> LOManalysis, EPRanalysis, Sweeper<br/>
                lom = LOManalysis(design=design)<br/>
                lom.setup.junctions.Lj = <span style={{ color: '#fcd34d' }}>12.0</span>  <span style={{ color: '#71717a' }}># nH</span><br/>
                lom.setup.freq_readout = <span style={{ color: '#fcd34d' }}>7.0</span>  <span style={{ color: '#71717a' }}># GHz</span><br/>
                lom.sim.capacitance_matrix = cap_df<br/>
                results = lom.run_lom()<br/>
                <span style={{ color: '#38bdf8' }}>print</span>(results[[<span style={{ color: '#fdba74' }}>"fQ"</span>, <span style={{ color: '#fdba74' }}>"alpha"</span>, <span style={{ color: '#fdba74' }}>"χr MHz"</span>, <span style={{ color: '#fdba74' }}>"gr MHz"</span>]])
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => window.open('/lab', '_blank')}
                style={{
                  flex: 1,
                  padding: '6px',
                  background: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Open in Jupyter Lab
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
