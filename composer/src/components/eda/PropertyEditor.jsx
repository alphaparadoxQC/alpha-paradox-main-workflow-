import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEdaStore } from '../../stores/edaStore';
import CrossProductBridge from '../../quantum-engine/cross-product-bridge';
import Editor from '@monaco-editor/react';

export default function PropertyEditor() {
  const navigate = useNavigate();
  const components = useEdaStore(state => state.components);
  const selectedId = useEdaStore(state => state.selectedComponentId);
  const updateComponentParams = useEdaStore(state => state.updateComponentParams);

  const [activeTab, setActiveTab] = useState('Options');
  const [compInfo, setCompInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  const selected = components.find(c => c.id === selectedId);

  // Fetch component info (Source & Help) when selection changes
  useEffect(() => {
    if (!selected?.type) {
      setCompInfo(null);
      return;
    }
    setLoadingInfo(true);
    fetch(`http://localhost:8000/api/eda/component_info/${selected.type}`)
      .then(res => res.json())
      .then(data => {
        setCompInfo(data);
        setLoadingInfo(false);
      })
      .catch(() => {
        setCompInfo({ source: "# Error loading source", help: "No documentation available." });
        setLoadingInfo(false);
      });
  }, [selected?.type]);

  return (
    <div style={{ display: 'flex', height: '100%', background: '#252526', color: '#cccccc', fontSize: '12px' }}>
      
      {/* Vertical Tabs */}
      <div style={{ width: '24px', background: '#333333', borderRight: '1px solid #3f3f46', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10px' }}>
        <VerticalTab label="Options" active={activeTab === 'Options'} onClick={() => setActiveTab('Options')} />
        <VerticalTab label="Help" active={activeTab === 'Help'} onClick={() => setActiveTab('Help')} />
        <VerticalTab label="Source" active={activeTab === 'Source'} onClick={() => setActiveTab('Source')} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: '#2d2d30', padding: '6px 8px', borderBottom: '1px solid #3f3f46', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected ? `${selected.name} : ${selected.type} : alpha_metal.qlibrary...` : 'No Selection'}
          </span>
          <span style={{ color: '#9ca3af', cursor: 'pointer' }} onClick={() => useEdaStore.getState().selectComponent(null)}>×</span>
        </div>

        {selected && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.15))',
            padding: '6px 10px',
            borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#93c5fd', fontWeight: '600' }}>
                {(() => {
                  try {
                    const t = CrossProductBridge.extractComponentTCAD(selected);
                    if (t.category === 'resonator') return 'Resonator TCAD';
                    if (t.category === 'coupler') return 'Coupler TCAD';
                    return `${selected.name} (${t.qubitType || 'Transmon'})`;
                  } catch (e) {
                    return 'Physical Hamiltonian';
                  }
                })()}
              </span>
              <button
                onClick={() => {
                  CrossProductBridge.bridgeEdaToAnalog(navigate, selected?.id);
                }}
                style={{
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Extract TCAD parameters and solve Hamiltonian in Analog Schrödinger Engine"
              >
                Sim in Analog
              </button>
            </div>
            {(() => {
              try {
                const t = CrossProductBridge.extractComponentTCAD(selected);
                return (
                  <div style={{ fontSize: '10px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                    {t.category === 'resonator' && (
                      <span>ω_r = <b style={{ color: '#38bdf8' }}>{t.omega_r_GHz} GHz</b> | L = {t.length_mm} mm | Z₀ = 50Ω</span>
                    )}
                    {t.category === 'coupler' && (
                      <span>g = <b style={{ color: '#ec4899' }}>{t.g_MHz} MHz</b> | C_g = {t.Cg_fF} fF</span>
                    )}
                    {t.category === 'qubit' && (
                      <span>ω₀₁ = <b style={{ color: '#34d399' }}>{t.omega01_GHz} GHz</b> | Ec = {t.Ec_MHz} MHz | Ej = {t.Ej_MHz} MHz</span>
                    )}
                  </div>
                );
              } catch (e) {
                return null;
              }
            })()}
          </div>
        )}

        {activeTab === 'Options' && (
          <>
            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 20px', padding: '4px 8px', borderBottom: '1px solid #3f3f46', fontWeight: 'bold' }}>
              <div>Name</div>
              <div>Value</div>
              <div>P</div>
            </div>

            {/* Table Body */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {selected ? (
                <>
                  {Object.entries(selected.params || {}).map(([key, value]) => {
                    const renderProperty = (k, v, parentPath = []) => {
                      const currentPath = [...parentPath, k];
                      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
                        return (
                          <React.Fragment key={currentPath.join('-')}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 20px', padding: '4px 8px', borderBottom: '1px solid #3f3f46', background: '#2d2d30' }}>
                              <div style={{ fontWeight: 'bold', paddingLeft: `${parentPath.length * 12}px` }}>▾ {k}</div>
                              <div></div>
                              <div></div>
                            </div>
                            {Object.entries(v).map(([subK, subV]) => renderProperty(subK, subV, currentPath))}
                          </React.Fragment>
                        );
                      }
                      
                      const displayVal = (typeof v === 'string' || typeof v === 'number') 
                        ? v 
                        : (v !== null && v !== undefined ? (Array.isArray(v) ? v.join(', ') : JSON.stringify(v)) : '');

                      return (
                        <div key={currentPath.join('-')} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 20px', padding: '4px 8px', borderBottom: '1px solid #3f3f46' }}>
                          <div style={{ paddingLeft: `${(parentPath.length * 12) + 12}px` }}>{k}</div>
                          <div>
                            <input 
                              type={k === 'color' ? 'color' : 'text'}
                              value={displayVal}
                              onChange={(e) => {
                                let newParams = { ...selected.params };
                                let curr = newParams;
                                for (let i = 0; i < parentPath.length; i++) {
                                  curr[parentPath[i]] = { ...curr[parentPath[i]] };
                                  curr = curr[parentPath[i]];
                                }
                                curr[k] = e.target.value;
                                updateComponentParams(selectedId, newParams);
                              }}
                              style={{ background: 'transparent', border: 'none', color: k === 'color' ? 'transparent' : '#d4d4d4', width: '100%', outline: 'none' }}
                            />
                          </div>
                          <div style={{ color: '#9ca3af' }}>C</div>
                        </div>
                      );
                    };
                    return renderProperty(key, value);
                  })}
                </>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Select a component to edit from the design</div>
              )}
            </div>
          </>
        )}

        {activeTab === 'Help' && (
          <div style={{ flex: 1, padding: '12px', overflowY: 'auto', background: '#1e1e1e', color: '#d4d4d4', fontSize: '12px' }}>
            {loadingInfo ? (
              <div style={{ color: '#888' }}>Loading documentation...</div>
            ) : selected ? (
              <div>
                {/* Summary Table */}
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>Summary:</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', background: '#252526', border: '1px solid #3c3c3c' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #3c3c3c' }}>
                      <th style={{ width: '80px', padding: '5px 8px', color: '#9cdcfe', textAlign: 'left', fontWeight: 'normal' }}>Class</th>
                      <td style={{ padding: '5px 8px', color: '#ce9178', fontFamily: 'monospace' }}>{compInfo?.class_name || selected.type}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #3c3c3c' }}>
                      <th style={{ padding: '5px 8px', color: '#9cdcfe', textAlign: 'left', fontWeight: 'normal' }}>Module</th>
                      <td style={{ padding: '5px 8px', color: '#4ec9b0', fontFamily: 'monospace' }}>{compInfo?.module_name || 'alpha_metal.qlibrary'}</td>
                    </tr>
                    <tr>
                      <th style={{ padding: '5px 8px', color: '#9cdcfe', textAlign: 'left', fontWeight: 'normal' }}>Path</th>
                      <td style={{ padding: '5px 8px', color: '#888888', fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{compInfo?.path || ''}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Official Image Preview */}
                <div style={{ background: '#ffffff', padding: '12px', borderRadius: '4px', textAlign: 'center', marginBottom: '16px', border: '1px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                    src={`/components/${compInfo?.image_name || (compInfo?.class_name ? compInfo.class_name + '.png' : 'RouteStraight.png')}`} 
                    alt={compInfo?.class_name} 
                    style={{ maxHeight: '36px', maxWidth: '100%', objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>

                {/* Class Docstring */}
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>Class docstring:</div>
                <pre style={{ 
                  background: '#181818', padding: '10px 12px', borderRadius: '4px', border: '1px solid #333', 
                  color: '#d4d4d4', fontSize: '11.5px', whiteSpace: 'pre-wrap', lineHeight: '1.5', fontFamily: 'monospace',
                  marginBottom: '16px'
                }}>
                  {compInfo?.class_doc || compInfo?.help || 'No docstring available.'}
                </pre>

                {/* Init Docstring */}
                {compInfo?.init_doc && (
                  <>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px' }}>Init docstring:</div>
                    <pre style={{ 
                      background: '#181818', padding: '10px 12px', borderRadius: '4px', border: '1px solid #333', 
                      color: '#d4d4d4', fontSize: '11.5px', whiteSpace: 'pre-wrap', lineHeight: '1.5', fontFamily: 'monospace' 
                    }}>
                      {compInfo.init_doc}
                    </pre>
                  </>
                )}
              </div>
            ) : (
              <div style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>Select a component to view documentation.</div>
            )}
          </div>
        )}

        {activeTab === 'Source' && (
          <div style={{ flex: 1, overflow: 'hidden', background: '#1e1e1e' }}>
            {loadingInfo ? (
              <div style={{ padding: '12px', color: '#888', fontSize: '11px' }}>Loading source...</div>
            ) : selected ? (
              <Editor
                height="100%"
                defaultLanguage="python"
                theme="vs-dark"
                value={compInfo?.source || '# No source available'}
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 11, wordWrap: 'on' }}
              />
            ) : (
              <div style={{ padding: '20px', color: '#888', textAlign: 'center', fontSize: '11px' }}>Select a component to view source code.</div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function VerticalTab({ label, active, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        writingMode: 'vertical-rl', 
        transform: 'rotate(180deg)', 
        padding: '10px 4px', 
        borderLeft: active ? '2px solid #007acc' : 'none',
        color: active ? '#ffffff' : '#9ca3af',
        background: active ? '#1e1e1e' : 'transparent',
        cursor: 'pointer',
        marginBottom: '5px'
      }}
    >
      {label}
    </div>
  );
}
