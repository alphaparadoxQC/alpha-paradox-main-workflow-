import React, { useState } from 'react';
import { useEdaStore } from '../../stores/edaStore';

export default function ExportRendererModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('gds'); // 'gds', 'q3d', 'hfss', 'gmsh'
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Cheesing parameters
  const [enableCheesing, setEnableCheesing] = useState(false);
  const [cheeseShape, setCheeseShape] = useState('0'); // 0: square, 1: circle
  const [cheeseSizeX, setCheeseSizeX] = useState('50um');
  const [cheeseSizeY, setCheeseSizeY] = useState('50um');
  const [cheeseDeltaX, setCheeseDeltaX] = useState('100um');
  const [cheeseDeltaY, setCheeseDeltaY] = useState('100um');
  const [cheeseKeepout, setCheeseKeepout] = useState('30um');

  // HFSS parameters
  const [substrateMaterial, setSubstrateMaterial] = useState('Silicon (eps_r=11.45)');
  const [boxHeight, setBoxHeight] = useState('2000um');

  const components = useEdaStore((state) => state.components);
  const chips = useEdaStore((state) => state.chips);

  if (!isOpen) return null;

  // --- Handlers ---
  const handleExportGds = async () => {
    setLoading(true);
    setErrorMessage(null);
    setResultData(null);
    try {
      const payload = {
        components,
        chips,
        cheesing: {
          enabled: enableCheesing,
          shape: cheeseShape,
          cheese_0_x: cheeseSizeX,
          cheese_0_y: cheeseSizeY,
          delta_x: cheeseDeltaX,
          delta_y: cheeseDeltaY,
          edge_nocheese: cheeseKeepout,
        },
      };

      const res = await fetch('http://localhost:8000/api/eda/export_gds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Export failed');

      if (data.data_b64) {
        const byteCharacters = atob(data.data_b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/octet-stream' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = data.filename || 'alpha_paradox_layout.gds';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setResultData({
        type: 'gds',
        message: data.message || 'GDSII generated and downloaded successfully.',
        filename: data.filename || 'alpha_paradox_layout.gds',
        cheesing_applied: enableCheesing,
      });
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunQ3D = async () => {
    setLoading(true);
    setErrorMessage(null);
    setResultData(null);
    try {
      const res = await fetch('http://localhost:8000/api/eda/render_q3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components, chips }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Q3D Extraction failed');
      setResultData({ type: 'q3d', ...data });
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunHFSS = async () => {
    setLoading(true);
    setErrorMessage(null);
    setResultData(null);
    try {
      const res = await fetch('http://localhost:8000/api/eda/render_ansys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components, chips }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'HFSS Render failed');
      setResultData({ type: 'hfss', ...data });
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunGmsh = async () => {
    setLoading(true);
    setErrorMessage(null);
    setResultData(null);
    try {
      const res = await fetch('http://localhost:8000/api/eda/render_gmsh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components, chips }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Gmsh meshing failed');
      setResultData({ type: 'gmsh', ...data });
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        background: '#18181b',
        border: '1px solid #3f3f46',
        borderRadius: '12px',
        width: '740px',
        maxWidth: '92vw',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #27272a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#202023'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', color: '#f4f4f5', fontWeight: 600 }}>
                Alpha Paradox Multi-Renderer & Export Hub
              </h2>
              <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
                GDSII Lithography, Ansys HFSS, Q3D Maxwell Capacitance & Gmsh 3D Mesh
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a1a1aa',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
          >
            ×
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #27272a',
          background: '#141416'
        }}>
          {[
            { id: 'gds', label: 'GDSII & Cheesing' },
            { id: 'q3d', label: 'Q3D Capacitance' },
            { id: 'hfss', label: 'Ansys HFSS 3D' },
            { id: 'gmsh', label: 'Gmsh 3D Mesh' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setResultData(null); setErrorMessage(null); }}
              style={{
                flex: 1,
                padding: '12px 10px',
                background: activeTab === tab.id ? '#18181b' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #38bdf8' : '2px solid transparent',
                color: activeTab === tab.id ? '#38bdf8' : '#71717a',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
          
          {/* TAB 1: GDSII & CHEESING */}
          {activeTab === 'gds' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '12px',
                color: '#bae6fd',
                lineHeight: '1.5'
              }}>
                <strong>QGDSRenderer:</strong> Exports planar superconducting layers to industry-standard GDSII stream format for photolithography and electron-beam lithography (EBL).
              </div>

              {/* Cheesing Section */}
              <div style={{
                background: '#202023',
                border: '1px solid #27272a',
                borderRadius: '8px',
                padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#f4f4f5' }}>
                      CMP Metal Fill & Flux Vortex Cheesing
                    </span>
                    <div style={{ fontSize: '11px', color: '#71717a' }}>
                      Punches periodic holes in ground planes for CMP density compliance and vortex pinning.
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={enableCheesing}
                      onChange={(e) => setEnableCheesing(e.target.checked)}
                      style={{ accentColor: '#38bdf8', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '12px', color: enableCheesing ? '#38bdf8' : '#71717a', fontWeight: 600 }}>
                      {enableCheesing ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                {enableCheesing && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid #27272a'
                  }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Cheese Shape</label>
                      <select
                        value={cheeseShape}
                        onChange={(e) => setCheeseShape(e.target.value)}
                        style={{ width: '100%', background: '#141416', color: '#fff', border: '1px solid #3f3f46', borderRadius: '4px', padding: '6px', fontSize: '11px' }}
                      >
                        <option value="0">Square (Shape 0)</option>
                        <option value="1">Circle (Shape 1)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Cheese Size (X)</label>
                      <input
                        type="text"
                        value={cheeseSizeX}
                        onChange={(e) => setCheeseSizeX(e.target.value)}
                        style={{ width: '100%', background: '#141416', color: '#fff', border: '1px solid #3f3f46', borderRadius: '4px', padding: '6px', fontSize: '11px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Cheese Size (Y)</label>
                      <input
                        type="text"
                        value={cheeseSizeY}
                        onChange={(e) => setCheeseSizeY(e.target.value)}
                        style={{ width: '100%', background: '#141416', color: '#fff', border: '1px solid #3f3f46', borderRadius: '4px', padding: '6px', fontSize: '11px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Grid Step ΔX</label>
                      <input
                        type="text"
                        value={cheeseDeltaX}
                        onChange={(e) => setCheeseDeltaX(e.target.value)}
                        style={{ width: '100%', background: '#141416', color: '#fff', border: '1px solid #3f3f46', borderRadius: '4px', padding: '6px', fontSize: '11px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Grid Step ΔY</label>
                      <input
                        type="text"
                        value={cheeseDeltaY}
                        onChange={(e) => setCheeseDeltaY(e.target.value)}
                        style={{ width: '100%', background: '#141416', color: '#fff', border: '1px solid #3f3f46', borderRadius: '4px', padding: '6px', fontSize: '11px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>No-Cheese Keepout</label>
                      <input
                        type="text"
                        value={cheeseKeepout}
                        onChange={(e) => setCheeseKeepout(e.target.value)}
                        style={{ width: '100%', background: '#141416', color: '#fff', border: '1px solid #3f3f46', borderRadius: '4px', padding: '6px', fontSize: '11px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleExportGds}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '12px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                }}
              >
                {loading ? 'Generating GDSII stream...' : 'Generate & Download GDSII (.gds)'}
              </button>
            </div>
          )}

          {/* TAB 2: Q3D CAPACITANCE */}
          {activeTab === 'q3d' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(129, 140, 248, 0.08)',
                border: '1px solid rgba(129, 140, 248, 0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '12px',
                color: '#c7d2fe',
                lineHeight: '1.5'
              }}>
                <strong>QQ3DRenderer / QQ3DPyaedt:</strong> Extracts the electrostatic Maxwell capacitance matrix C<sub>ij</sub>, charging energies E<sub>C</sub> = e<sup>2</sup>/(2C<sub>Σ</sub>), and Hamiltonian exchange coupling rates g<sub>ij</sub>.
              </div>

              <button
                onClick={handleRunQ3D}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '12px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                }}
              >
                {loading ? 'Solving Maxwell field equations...' : 'Extract Maxwell Capacitance Matrix'}
              </button>

              {resultData?.type === 'q3d' && (
                <div style={{ background: '#202023', border: '1px solid #27272a', borderRadius: '8px', padding: '16px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8' }}>
                      Solver Engine: {resultData.engine}
                    </span>
                    <span style={{ fontSize: '11px', color: '#a1a1aa' }}>
                      Units: fF (Femtofarads)
                    </span>
                  </div>

                  {/* Matrix Table */}
                  <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center' }}>
                      <thead>
                        <tr style={{ background: '#141416', color: '#a1a1aa' }}>
                          <th style={{ padding: '6px', border: '1px solid #27272a' }}>Net</th>
                          {resultData.net_names?.map((n) => (
                            <th key={n} style={{ padding: '6px', border: '1px solid #27272a' }}>{n}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {resultData.capacitance_matrix_fF?.map((row, rIdx) => (
                          <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? '#1b1b1e' : '#222226' }}>
                            <td style={{ padding: '6px', border: '1px solid #27272a', fontWeight: 600, color: '#e4e4e7' }}>
                              {resultData.net_names?.[rIdx]}
                            </td>
                            {row.map((val, cIdx) => (
                              <td
                                key={cIdx}
                                style={{
                                  padding: '6px',
                                  border: '1px solid #27272a',
                                  color: rIdx === cIdx ? '#34d399' : '#38bdf8',
                                  fontWeight: rIdx === cIdx ? 700 : 500
                                }}
                              >
                                {val.toFixed(2)} fF
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Hamiltonian Parameters */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: '#141416', padding: '10px', borderRadius: '6px', border: '1px solid #27272a' }}>
                      <div style={{ fontSize: '11px', color: '#71717a', fontWeight: 600, marginBottom: '6px' }}>
                        Charging Energies E<sub>C</sub> (MHz)
                      </div>
                      {Object.entries(resultData.charging_energies_MHz || {}).map(([comp, ec]) => (
                        <div key={comp} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#e4e4e7', padding: '2px 0' }}>
                          <span>{comp}:</span>
                          <span style={{ color: '#fbbf24', fontWeight: 600 }}>{ec} MHz</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: '#141416', padding: '10px', borderRadius: '6px', border: '1px solid #27272a' }}>
                      <div style={{ fontSize: '11px', color: '#71717a', fontWeight: 600, marginBottom: '6px' }}>
                        Exchange Couplings g<sub>ij</sub> (MHz)
                      </div>
                      {Object.entries(resultData.coupling_rates_MHz || {}).map(([pair, g]) => (
                        <div key={pair} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#e4e4e7', padding: '2px 0' }}>
                          <span>{pair}:</span>
                          <span style={{ color: '#38bdf8', fontWeight: 600 }}>{g} MHz</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ANSYS HFSS */}
          {activeTab === 'hfss' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(52, 211, 153, 0.08)',
                border: '1px solid rgba(52, 211, 153, 0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '12px',
                color: '#a7f3d0',
                lineHeight: '1.5'
              }}>
                <strong>QHFSSRenderer / QHFSSPyaedt:</strong> Generates 3D full-wave electromagnetic models with substrate volumes, radiation boundaries, and lumped RLC ports for S-parameter and EPR analysis.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Substrate Material</label>
                  <select
                    value={substrateMaterial}
                    onChange={(e) => setSubstrateMaterial(e.target.value)}
                    style={{ width: '100%', background: '#141416', color: '#fff', border: '1px solid #3f3f46', borderRadius: '4px', padding: '8px', fontSize: '12px' }}
                  >
                    <option value="silicon">Silicon (eps_r = 11.45, tan_delta = 1e-5)</option>
                    <option value="sapphire">Sapphire (eps_r = 10.0, tan_delta = 5e-6)</option>
                    <option value="high_res_si">High-Res Silicon (eps_r = 11.9)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#a1a1aa', display: 'block', marginBottom: '4px' }}>Radiation Airbox Height</label>
                  <input
                    type="text"
                    value={boxHeight}
                    onChange={(e) => setBoxHeight(e.target.value)}
                    style={{ width: '100%', background: '#141416', color: '#fff', border: '1px solid #3f3f46', borderRadius: '4px', padding: '8px', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                onClick={handleRunHFSS}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '12px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)'
                }}
              >
                {loading ? 'Dispatching to Ansys AEDT...' : 'Trigger Ansys HFSS 3D Simulation'}
              </button>

              {resultData?.type === 'hfss' && (
                <div style={{ background: '#202023', border: '1px solid #27272a', borderRadius: '8px', padding: '16px', fontSize: '12px', color: '#e4e4e7', lineHeight: '1.6' }}>
                  <div style={{ fontWeight: 600, color: resultData.status === 'success' ? '#34d399' : '#fbbf24', marginBottom: '8px' }}>
                    Status: {resultData.status.toUpperCase()}
                  </div>
                  <div>{resultData.message}</div>
                  <button
                    onClick={() => {
                      useEdaStore.getState().setActiveCanvasTab('HFSS Suite');
                      onClose();
                    }}
                    style={{
                      marginTop: '12px',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Open Interactive HFSS Suite & S-Parameters →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GMSH 3D MESH */}
          {activeTab === 'gmsh' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(251, 191, 36, 0.08)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '12px',
                color: '#fef3c7',
                lineHeight: '1.5'
              }}>
                <strong>QGmshRenderer:</strong> Generates open-source 3D finite-element Delaunay/Voronoi tetrahedral meshes (.msh) with physical group tagging for Palace and Elmer multiphysics solvers.
              </div>

              <button
                onClick={handleRunGmsh}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '12px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(217, 119, 6, 0.4)'
                }}
              >
                {loading ? 'Partitioning 3D geometry...' : 'Generate 3D Finite Element Mesh'}
              </button>

              {resultData?.type === 'gmsh' && (
                <div style={{ background: '#202023', border: '1px solid #27272a', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#fbbf24' }}>
                      Engine: {resultData.engine}
                    </span>
                    <span style={{ fontSize: '11px', color: '#a1a1aa' }}>
                      Format: Gmsh 3D (.msh)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ background: '#141416', padding: '8px 12px', borderRadius: '6px', border: '1px solid #27272a' }}>
                      <div style={{ fontSize: '10px', color: '#71717a' }}>COMPONENTS</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#f4f4f5' }}>{resultData.mesh_statistics?.components_rendered}</div>
                    </div>
                    <div style={{ background: '#141416', padding: '8px 12px', borderRadius: '6px', border: '1px solid #27272a' }}>
                      <div style={{ fontSize: '10px', color: '#71717a' }}>MESH NODES</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8' }}>{resultData.mesh_statistics?.nodes_count?.toLocaleString()}</div>
                    </div>
                    <div style={{ background: '#141416', padding: '8px 12px', borderRadius: '6px', border: '1px solid #27272a' }}>
                      <div style={{ fontSize: '10px', color: '#71717a' }}>TETRAHEDRA</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#34d399' }}>{resultData.mesh_statistics?.tetrahedra_count?.toLocaleString()}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: '#a1a1aa', marginBottom: '6px', fontWeight: 600 }}>
                    Physical Surface & Volume Groups:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {resultData.mesh_statistics?.physical_groups?.map((g) => (
                      <span key={g.name} style={{ background: '#141416', border: '1px solid #3f3f46', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', color: '#e4e4e7' }}>
                        {g.name} ({g.dimension}D, ID:{g.id})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message Box */}
          {errorMessage && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              color: '#fca5a5',
              fontSize: '12px'
            }}>
              {errorMessage}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #27272a',
          background: '#141416',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          <button
            onClick={onClose}
            style={{
              background: '#27272a',
              border: 'none',
              borderRadius: '6px',
              color: '#f4f4f5',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
