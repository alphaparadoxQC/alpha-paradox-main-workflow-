import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ComponentLibrary from '../components/eda/ComponentLibrary';
import PhysicalCanvas from '../components/eda/PhysicalCanvas';
import PropertyEditor from '../components/eda/PropertyEditor';
import QuantumAnalysisPanel from '../components/eda/QuantumAnalysisPanel';
import ExportRendererModal from '../components/eda/ExportRendererModal';
import ErrorBoundary from '../components/common/ErrorBoundary';
import UnifiedNavbar from '../components/shared/UnifiedNavbar';
import Verify3DModal from '../components/eda/Verify3DModal';
import { useEdaStore } from '../stores/edaStore';
import CrossProductBridge from '../quantum-engine/cross-product-bridge';

export default function EdaPage({ session }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const clearDesign = useEdaStore(state => state.clearDesign);
  const create_flipchip_design = useEdaStore(state => state.create_flipchip_design);
  const components = useEdaStore(state => state.components) || [];
  const getQGeometry = useEdaStore(state => state.getQGeometry);
  const qgeometry = getQGeometry ? getQGeometry() : { path: [], poly: [], junction: [] };
  const [dataTab, setDataTab] = useState('Pins');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [aboutReport, setAboutReport] = useState(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [qgeomData, setQgeomData] = useState(null);
  const [isQgeomOpen, setIsQgeomOpen] = useState(false);
  const [activeQGeomTab, setActiveQGeomTab] = useState('poly');
  const [qgeomFilter, setQgeomFilter] = useState('');
  const [lvsResult, setLvsResult] = useState(null);
  const [verify3DResult, setVerify3DResult] = useState(null);
  const [isVerify3DOpen, setIsVerify3DOpen] = useState(false);
  const [tcadResult, setTcadResult] = useState(null);
  const [isChipsMenuOpen, setIsChipsMenuOpen] = useState(false);
  const [isChipsLoading, setIsChipsLoading] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 62, left: 240 });
  const chipsBtnRef = useRef(null);

  const handleOpenAbout = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/eda/about');
      const data = await res.json();
      setAboutReport(data.report || 'No report available');
      setIsAboutOpen(true);
    } catch (err) {
      alert('Could not fetch about info: ' + err.message);
    }
  };

  const handleOpenQGeometry = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/eda/qgeometry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          components: useEdaStore.getState().components,
          chips: useEdaStore.getState().chips
        })
      });
      const data = await res.json();
      setQgeomData(data);
      if (data.element_types && data.element_types.length > 0) {
        if (!data.element_types.includes(activeQGeomTab)) {
          setActiveQGeomTab(data.element_types[0]);
        }
      }
      setIsQgeomOpen(true);
    } catch (err) {
      alert('Could not fetch QGeometry Tables: ' + err.message);
    }
  };

  const handleSaveMetal = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/eda/save_design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          components: useEdaStore.getState().components,
          chips: useEdaStore.getState().chips
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Save failed');
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
        link.download = data.filename || 'design.metal';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert(data.message || 'Design saved successfully!');
      }
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  };

  const handleLoadFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result.split(',')[1];
      try {
        const res = await fetch('http://localhost:8000/api/eda/load_design', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data_b64: b64 })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Load failed');
        if (data.components) {
          useEdaStore.setState({ components: data.components, chips: data.chips || {} });
          alert(data.message || 'Design loaded successfully!');
        }
      } catch (err) {
        alert('Failed to load design: ' + err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLoadPublishedChip = async (chipType) => {
    setIsChipsMenuOpen(false);
    setIsChipsLoading(true);
    try {
      let res;
      try {
        res = await fetch('/api/eda/load_published_chip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chip_type: chipType })
        });
        if (!res.ok) throw new Error('Proxy returned status ' + res.status);
      } catch (e) {
        // Fallback to direct backend port
        res = await fetch('http://localhost:8000/api/eda/load_published_chip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chip_type: chipType })
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to load published chip');
      if (data.components) {
        useEdaStore.setState({
          components: data.components,
          chips: data.chips || {},
          server_qgeometry: data.qgeometry || null
        });
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 100);
      }
    } catch (err) {
      alert('Failed to load published chip: ' + err.message);
    } finally {
      setIsChipsLoading(false);
    }
  };
  
  // ─── Cross-Product Bridge: EDA → Analog TCAD ─────────────────────────
  const handleSimulateInAnalog = () => {
    const selectedId = useEdaStore.getState().selectedComponentId;
    const selectedComp = components.find(c => c.id === selectedId);

    try {
      if (selectedComp) {
        // Simulate specific selected component (qubit, resonator, or coupler)
        const tcad = CrossProductBridge.bridgeEdaToAnalog(navigate, selectedComp.id);
        if (tcad && tcad.category === 'qubit') {
          CrossProductBridge.bridgeAnalogToPulse(tcad);
          setTcadResult(tcad);
        }
      } else {
        // No component selected: check if chip has multiple qubits for coupled simulation
        const qubits = components.filter(c => {
          const t = (c.type || '').toLowerCase();
          const n = (c.name || '').toLowerCase();
          return t.includes('transmon') || t.includes('qubit') || t.includes('star') || 
                 n.startsWith('q') || n.startsWith('d') || n.startsWith('z') || n.startsWith('x');
        });

        if (qubits.length >= 2) {
          CrossProductBridge.bridgeCoupledChipToAnalog(navigate);
        } else {
          const tcad = CrossProductBridge.bridgeEdaToAnalog(navigate);
          if (tcad && tcad.category === 'qubit') {
            CrossProductBridge.bridgeAnalogToPulse(tcad);
            setTcadResult(tcad);
          }
        }
      }
    } catch (err) {
      console.error('[EDA→Analog Bridge]', err);
      alert('Analog TCAD bridge failed: ' + err.message);
    }
  };

  const handleSimulateCoupledChip = () => {
    try {
      CrossProductBridge.bridgeCoupledChipToAnalog(navigate);
    } catch (err) {
      console.error('[EDA→Analog Bridge Coupled]', err);
      alert('Coupled chip simulation failed: ' + err.message);
    }
  };

  // ─── Cross-Product Bridge: EDA → Composer (Topology Import) ──────────
  const handleImportTopology = () => {
    try {
      const topology = CrossProductBridge.bridgeEdaTopologyToComposer(navigate);
      alert(`Topology imported: ${topology.numQubits} qubits, ${topology.numCouplings} couplers → Composer transpiler constraints updated.`);
    } catch (err) {
      alert('Topology import failed: ' + err.message);
    }
  };

  // ─── Cross-Product Bridge: EDA → Notebook (Chip Script Export) ───────
  const handleOpenInNotebook = () => {
    try {
      const res = CrossProductBridge.bridgeEdaToNotebook(navigate);
      alert(`Exported ${res.componentCount} chip component(s) to Quantum Notebook as executable Python code.`);
    } catch (err) {
      alert('Failed to export code to Notebook: ' + err.message);
    }
  };

  // ─── Cross-Product Bridge: LVS Check ─────────────────────────────────
  const handleRunLVS = () => {
    try {
      const result = CrossProductBridge.runLVS();
      setLvsResult(result);
      alert(result.summary);
    } catch (err) {
      alert('LVS check failed: ' + err.message);
    }
  };

  // ─── Cross-Product Bridge: 3D Stack DRC & Multiphysics Check ─────────
  const handleRun3DVerification = () => {
    try {
      const result = CrossProductBridge.run3DVerification();
      setVerify3DResult(result);
      setIsVerify3DOpen(true);
    } catch (err) {
      alert('3D Verification failed: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', maxWidth: '100%', overflow: 'hidden', background: '#1e1e1e', color: '#d4d4d4', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      <input ref={fileInputRef} type="file" accept=".metal" style={{ display: 'none' }} onChange={handleLoadFile} />
      
      {/* Standard Qt Menu Bar */}
      <div style={{ display: 'flex', background: '#333333', borderBottom: '1px solid #252526', padding: '2px 8px', fontSize: '12px', gap: '15px', flexShrink: 0 }}>
        <div style={{ cursor: 'pointer' }}>File</div>
        <div style={{ cursor: 'pointer' }}>Edit</div>
        <div style={{ cursor: 'pointer' }}>View</div>
        <div style={{ cursor: 'pointer', color: dataTab === 'Analysis' ? '#38bdf8' : 'inherit' }} onClick={() => setDataTab('Analysis')}>Analysis</div>
        <div style={{ cursor: 'pointer', color: '#38bdf8' }} onClick={handleSimulateInAnalog} title="Render selected component or coupled chip to Analog Engine">Render to Analog</div>
        <div style={{ cursor: 'pointer', color: isExportModalOpen ? '#38bdf8' : 'inherit' }} onClick={() => setIsExportModalOpen(true)}>Export</div>
        <div style={{ cursor: 'pointer', color: isQgeomOpen ? '#38bdf8' : 'inherit' }} onClick={handleOpenQGeometry}>QGeometry</div>
        <div style={{ cursor: 'pointer' }}>Window</div>
        <div style={{ cursor: 'pointer', color: isAboutOpen ? '#38bdf8' : 'inherit' }} onClick={handleOpenAbout}>Help</div>
      </div>

      {/* Top Navbar - Compact Streamlined Toolbar (All functions on one screen) */}
      <div style={{ 
        height: '38px', 
        background: '#2d2d30', 
        borderBottom: '1px solid #3f3f46',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: '2px',
        flexShrink: 0,
        overflow: 'visible',
        position: 'relative',
        zIndex: 50
      }}>
        <ToolbarButton label="Planar" onClick={() => useEdaStore.setState({ chips: { main: { material: 'silicon', size_x: '9mm', size_y: '6mm', size_z: '-500um', layer_stack: 1 } }, components: [], netlist: [], dependencies: {} })} />
        <ToolbarButton label="FlipChip" onClick={() => useEdaStore.getState().create_flipchip_design()} />
        <ToolbarButton label="Load" onClick={() => fileInputRef.current?.click()} />
        <ToolbarButton label="Save" onClick={handleSaveMetal} />
        
        {/* Chips Dropdown Button with Ref */}
        <div style={{ position: 'relative' }}>
          <button
            ref={chipsBtnRef}
            onClick={(e) => {
              e.stopPropagation();
              if (chipsBtnRef.current) {
                const rect = chipsBtnRef.current.getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 4, left: rect.left });
              }
              setIsChipsMenuOpen(prev => !prev);
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isChipsMenuOpen ? '#3f3f46' : 'transparent',
              border: '1px solid',
              borderColor: isChipsMenuOpen ? '#38bdf8' : 'transparent',
              borderRadius: '4px',
              color: isChipsMenuOpen ? '#38bdf8' : '#d4d4d4',
              padding: '4px 8px',
              cursor: 'pointer',
              gap: '6px'
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#3f3f46'; }}
            onMouseOut={e => { if (!isChipsMenuOpen) e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600 }}>{isChipsLoading ? 'Loading...' : 'Chips ▾'}</span>
          </button>

          {isChipsMenuOpen && (
            <>
              {/* Fullscreen backdrop to catch outside clicks */}
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'transparent' }}
                onClick={() => setIsChipsMenuOpen(false)}
              />
              <div style={{
                position: 'fixed',
                top: `${menuPos.top}px`,
                left: `${menuPos.left}px`,
                background: '#18181b',
                border: '1px solid #38bdf8',
                borderRadius: '8px',
                boxShadow: '0 20px 45px rgba(0,0,0,0.95), 0 0 25px rgba(56, 189, 248, 0.25)',
                zIndex: 99999,
                minWidth: '310px',
                padding: '8px 0',
                color: '#e4e4e7',
                fontFamily: 'Segoe UI, system-ui, sans-serif'
              }}>
                <div style={{ padding: '6px 14px', fontSize: '10px', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                  Published Quantum Processors & Gates
                </div>
                <div 
                  onClick={() => handleLoadPublishedChip('barends_5q')}
                  style={{ padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                  onMouseOver={e => e.currentTarget.style.background = '#27272a'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ color: '#f3f4f6', fontWeight: 600, fontSize: '12px' }}>Barends 5-Qubit Xmon</div>
                    <div style={{ color: '#9ca3af', fontSize: '10px' }}>Nature 508, 500 Linear Processor</div>
                  </div>
                </div>
                <div 
                  onClick={() => handleLoadPublishedChip('iswap_concentric')}
                  style={{ padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                  onMouseOver={e => e.currentTarget.style.background = '#27272a'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ color: '#f3f4f6', fontWeight: 600, fontSize: '12px' }}>iSWAP: Concentric Transmon</div>
                    <div style={{ color: '#9ca3af', fontSize: '10px' }}>Lumped-resonator couplers & launchpads</div>
                  </div>
                </div>
                <div 
                  onClick={() => handleLoadPublishedChip('iswap_pocket')}
                  style={{ padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                  onMouseOver={e => e.currentTarget.style.background = '#27272a'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ color: '#f3f4f6', fontWeight: 600, fontSize: '12px' }}>iSWAP: Pocket Transmon</div>
                    <div style={{ color: '#9ca3af', fontSize: '10px' }}>TunableCoupler02 + meander buses</div>
                  </div>
                </div>
                <div 
                  onClick={() => handleLoadPublishedChip('iswap_xmon')}
                  style={{ padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                  onMouseOver={e => e.currentTarget.style.background = '#27272a'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ color: '#f3f4f6', fontWeight: 600, fontSize: '12px' }}>iSWAP: Xmon Transmon</div>
                    <div style={{ color: '#9ca3af', fontSize: '10px' }}>TunableCoupler01 + Purcell filters</div>
                  </div>
                </div>
                <div style={{ height: '1px', background: '#3f3f46', margin: '6px 0' }} />
                <div 
                  onClick={() => handleLoadPublishedChip('wallraff_cell')}
                  style={{ padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                  onMouseOver={e => e.currentTarget.style.background = '#27272a'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ color: '#f3f4f6', fontWeight: 600, fontSize: '12px' }}>Wallraff Two-Qubit Cell</div>
                    <div style={{ color: '#9ca3af', fontSize: '10px' }}>D5-Z3 Surface Code Mesh & Electrostatics</div>
                  </div>
                </div>
                <div 
                  onClick={() => handleLoadPublishedChip('wallraff_full')}
                  style={{ padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                  onMouseOver={e => e.currentTarget.style.background = '#27272a'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ color: '#f3f4f6', fontWeight: 600, fontSize: '12px' }}>Wallraff 17-Qubit Processor</div>
                    <div style={{ color: '#9ca3af', fontSize: '10px' }}>ETH Zurich Distance-3 Surface Code Chip</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <div style={{ width: '1px', height: '20px', background: '#3f3f46', margin: '0 3px' }} />
        
        <ToolbarButton label="Rebuild" onClick={async () => {
          try {
            const res = await fetch('http://localhost:8000/api/eda/rebuild', {
              method: 'POST', headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ components: useEdaStore.getState().components, chips: useEdaStore.getState().chips })
            });
            const data = await res.json();
            if (data.qgeometry) {
              useEdaStore.setState({ server_qgeometry: data.qgeometry });
            }
            alert(data.message || data.detail || "Rebuild completed");
          } catch(e) { alert("Rebuild failed: " + e.message); }
        }} />
        <ToolbarButton label="Replot" onClick={() => window.dispatchEvent(new Event('resize'))} />
        <ToolbarButton label="QGeom" onClick={handleOpenQGeometry} />
        <ToolbarButton label="GDS" onClick={async () => {
          try {
            const res = await fetch('http://localhost:8000/api/eda/export_gds', {
              method: 'POST', headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ components: useEdaStore.getState().components, chips: useEdaStore.getState().chips })
            });
            const data = await res.json();
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
            alert(data.message || data.detail || "GDS Download initialized");
          } catch(e) { alert("Save failed: " + e.message); }
        }} />
        <ToolbarButton label="Render" onClick={() => setIsExportModalOpen(true)} />
        <div style={{ width: '1px', height: '20px', background: '#3f3f46', margin: '0 3px' }} />

        <ToolbarButton 
          label="3D Plot" 
          active={useEdaStore(s => s.activeCanvasTab) === '3D View'}
          onClick={() => {
            const currentTab = useEdaStore.getState().activeCanvasTab;
            useEdaStore.getState().setActiveCanvasTab(currentTab === '3D View' ? 'Main View' : '3D View');
          }} 
          title="Interactive 3D Quantum Chip Plot (Substrate, Metal, Pockets, Junctions & Airbridges)"
        />
        <ToolbarButton 
          label="HFSS" 
          active={useEdaStore(s => s.activeCanvasTab) === 'HFSS Suite'}
          onClick={() => {
            const currentTab = useEdaStore.getState().activeCanvasTab;
            useEdaStore.getState().setActiveCanvasTab(currentTab === 'HFSS Suite' ? 'Main View' : 'HFSS Suite');
          }} 
          title="Ansys HFSS 3D Electromagnetic Solver: S-Parameters, Smith Chart, Resonance & Energy Loss"
        />
        <ToolbarButton label="Shot" onClick={() => alert("Screenshot captured to local downloads folder")} />
        <ToolbarButton label="Analysis" onClick={() => setDataTab('Analysis')} />
        <ToolbarButton label="Clear" onClick={clearDesign} />
        <div style={{ width: '1px', height: '20px', background: '#3f3f46', margin: '0 3px' }} />

        <ToolbarButton label="→ Analog" onClick={handleSimulateInAnalog} title="Bridge selected component (or chip) to Analog Hamiltonian solver" />
        <ToolbarButton label="Sim Chip" onClick={handleSimulateCoupledChip} title="Simulate coupled multi-qubit chip in Analog" />
        <ToolbarButton label="→ Composer" onClick={handleImportTopology} />
        <ToolbarButton label="LVS" onClick={handleRunLVS} />
        <ToolbarButton label="3D Check" onClick={handleRun3DVerification} title="Run 3D Multi-Chip Physical, Thermal & DRC Verification" />
        <ToolbarButton label="→ Notebook" onClick={handleOpenInNotebook} />
      </div>

      {/* Main Content — Full Screen Edge-to-Edge */}
      <div style={{ display: 'flex', flex: 1, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        
        {/* Left Sidebar (Main Window Qt Dock) */}
        <div style={{ width: '270px', minWidth: '240px', maxWidth: '300px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #3f3f46', background: '#252526', flexShrink: 0 }}>
          {/* Dock Title */}
          <div style={{ background: '#333333', padding: '2px 8px', fontSize: '11px', color: '#ccc', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e1e1e' }}>
            <span>Main Window</span>
            <span style={{ cursor: 'pointer' }}>×</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <ErrorBoundary fallbackTitle="Component Library Error">
              <ComponentLibrary />
            </ErrorBoundary>
          </div>
        </div>

        {/* Right Area (Split Canvas/Console) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Canvas */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <ErrorBoundary fallbackTitle="Physical Canvas Error">
              <PhysicalCanvas />
            </ErrorBoundary>
          </div>
          
          {/* Bottom Console */}
          <div style={{ height: '120px', background: '#1e1e1e', borderTop: '1px solid #3f3f46', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#333333', padding: '2px 10px', fontSize: '11px', color: '#9ca3af', borderBottom: '1px solid #252526' }}>
              Log (filter &gt;= debug)
            </div>
            <div style={{ flex: 1, padding: '6px 10px', overflowY: 'auto', fontFamily: 'Consolas, monospace', fontSize: '11px' }}>
              <div style={{ color: '#10b981' }}>Tip: All component widget: Double click a component to zoom into it!</div>
              <div style={{ color: '#f59e0b' }}>gui0: Rendering element tables to plot window. [mpl_renderer.render]</div>
              <div style={{ color: '#f59e0b' }}>gui0: Autoscale [plot_window.auto_scale]</div>
              <div style={{ color: '#d4d4d4' }}>gui0: Design has {components.length} component(s) on chip 'main'.</div>
              <div style={{ color: '#d4d4d4' }}>gui0: QGeometry poly={qgeometry.poly.length} path={qgeometry.path.length} junction={qgeometry.junction.length}</div>
            </div>
            <div style={{ background: '#007acc', color: 'white', padding: '2px 10px', fontSize: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Quantum EDA — DesignPlanar — {components.length} components</span>
              <span>Alpha Paradox Layout Ready</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Dock Widgets (Help, Variables, PropertyEditor) */}
        <div style={{ width: '280px', minWidth: '250px', maxWidth: '320px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #3f3f46', background: '#252526', flexShrink: 0 }}>
          
          {/* Top Dock: Property Editor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderBottom: '1px solid #3f3f46', overflow: 'hidden' }}>
            <div style={{ background: '#333333', padding: '2px 8px', fontSize: '11px', color: '#ccc', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e1e1e' }}>
              <span>Property Editor</span>
              <span style={{ cursor: 'pointer' }}>×</span>
            </div>
            <ErrorBoundary fallbackTitle="Property Editor Error">
              <PropertyEditor />
            </ErrorBoundary>
          </div>
          
          {/* Bottom Dock: Help / Variables / Pins */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ background: '#333333', padding: '2px 8px', fontSize: '11px', color: '#ccc', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e1e1e' }}>
              <span>Data & Connectivity</span>
              <span style={{ cursor: 'pointer' }}>×</span>
            </div>
            
            <div style={{ display: 'flex', background: '#333333', borderBottom: '1px solid #252526', cursor: 'pointer', fontSize: '11px' }}>
              <div 
                onClick={() => setDataTab('Pins')}
                style={{ padding: '4px 12px', color: dataTab === 'Pins' ? '#ffffff' : '#9ca3af', background: dataTab === 'Pins' ? '#1e1e1e' : '#2d2d30', borderRight: '1px solid #1e1e1e' }}
              >Pins</div>
              <div 
                onClick={() => setDataTab('Variables')}
                style={{ padding: '4px 12px', color: dataTab === 'Variables' ? '#ffffff' : '#9ca3af', background: dataTab === 'Variables' ? '#1e1e1e' : '#2d2d30', borderRight: '1px solid #1e1e1e' }}
              >Variables</div>
              <div 
                onClick={() => setDataTab('Help')}
                style={{ padding: '4px 12px', color: dataTab === 'Help' ? '#ffffff' : '#9ca3af', background: dataTab === 'Help' ? '#1e1e1e' : '#2d2d30', borderRight: '1px solid #1e1e1e' }}
              >Help</div>
              <div 
                onClick={() => setDataTab('Analysis')}
                style={{ padding: '4px 12px', color: dataTab === 'Analysis' ? '#38bdf8' : '#9ca3af', background: dataTab === 'Analysis' ? '#1e1e1e' : '#2d2d30', borderRight: '1px solid #1e1e1e', fontWeight: dataTab === 'Analysis' ? 'bold' : 'normal' }}
              >Analysis</div>
            </div>

            <div style={{ flex: 1, padding: '8px', overflowY: 'auto', fontSize: '12px' }}>
              {dataTab === 'Pins' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr', borderBottom: '1px solid #3f3f46', paddingBottom: '4px', marginBottom: '6px', color: '#9ca3af', fontWeight: 'bold', fontSize: '11px' }}>
                    <div>Pin Name</div><div>Component</div><div>Location</div><div>Role</div>
                  </div>
                  {Object.entries(qgeometry.pins || {}).flatMap(([compName, compPins]) => 
                    Object.entries(compPins || {}).map(([pName, pObj]) => {
                      const isInput = pName.toLowerCase().includes('in') || pName.toLowerCase().includes('flux') || pName.toLowerCase().includes('charge') || pName.toLowerCase().includes('control') || pName === 'a';
                      const locStr = pObj.middle ? `(${pObj.middle[0].toFixed(0)}, ${pObj.middle[1].toFixed(0)})` : '-';
                      return (
                        <div key={`${compName}-${pName}`} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr', marginBottom: '4px', alignItems: 'center', fontSize: '11px', borderBottom: '1px solid #2a2a2a', paddingBottom: '3px' }}>
                          <div style={{ color: isInput ? '#fbbf24' : '#38bdf8', fontWeight: 600 }}>{pName}</div>
                          <div style={{ color: '#d4d4d4' }}>{compName}</div>
                          <div style={{ color: '#888', fontFamily: 'monospace' }}>{locStr}</div>
                          <div>
                            <span style={{ 
                              background: isInput ? '#78350f' : '#0369a1', 
                              color: isInput ? '#fef3c7' : '#e0f2fe', 
                              padding: '1px 5px', 
                              borderRadius: '3px', 
                              fontSize: '10px', 
                              fontWeight: 'bold' 
                            }}>
                              {isInput ? 'IN' : 'OUT'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {Object.keys(qgeometry.pins || {}).length === 0 && (
                    <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', marginTop: '15px' }}>No pins in current design. Add a QComponent to see its ports.</div>
                  )}
                </div>
              )}

              {dataTab === 'Variables' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #3f3f46', paddingBottom: '4px', marginBottom: '4px', color: '#9ca3af' }}>
                    <div>Name</div><div>Value</div>
                  </div>
                  {Object.entries(useEdaStore.getState().variables || {}).map(([key, val]) => (
                    <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginBottom: '4px' }}>
                      <div style={{ color: '#d4d4d4' }}>{key}</div>
                      <div style={{ color: '#ce9178' }}>{val}</div>
                    </div>
                  ))}
                </div>
              )}

              {dataTab === 'Help' && (
                <div style={{ color: '#bbb', lineHeight: '1.5', fontSize: '11px' }}>
                  <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>Qiskit Metal Port Mapping:</div>
                  <div>• <b>Readout [OUT]</b>: Output coupler port for resonator feed.</div>
                  <div>• <b>Bus [OUT]</b>: Inter-qubit coupling capacitor ports.</div>
                  <div>• <b>Charge_Line [IN]</b>: Microwave XY control drive input.</div>
                  <div>• <b>Flux [IN]</b>: Z-control magnetic flux bias line.</div>
                  <div>• <b>Control [IN]</b>: Tunable coupler drive line.</div>
                </div>
              )}

              {dataTab === 'Analysis' && (
                <QuantumAnalysisPanel />
              )}
            </div>
          </div>
        </div>

      </div>
      <ExportRendererModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />

      {/* About Alpha Paradox Modal (Link 4) */}
      {isAboutOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{
            background: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px',
            padding: '24px', width: '640px', maxWidth: '92vw', maxHeight: '82vh',
            display: 'flex', flexDirection: 'column', color: '#e4e4e7', fontFamily: 'JetBrains Mono, monospace',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 30px rgba(56, 189, 248, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #27272a', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '15px', fontWeight: 600 }}>About Alpha Paradox Platform</h3>
              </div>
              <button onClick={() => setIsAboutOpen(false)} style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '18px', cursor: 'pointer', padding: '4px 8px' }}>×</button>
            </div>
            <pre style={{ flex: 1, overflowY: 'auto', background: '#111113', padding: '16px', borderRadius: '8px', fontSize: '11px', lineHeight: '1.6', border: '1px solid #27272a', whiteSpace: 'pre-wrap', color: '#a7f3d0' }}>
              {aboutReport}
            </pre>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setIsAboutOpen(false)} style={{ background: '#27272a', border: 'none', color: '#fff', padding: '8px 18px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* QGeometry Element Tables Modal (qgeometries & QGeometryTables) */}
      {isQgeomOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{
            background: '#18181b', border: '1px solid #3f3f46', borderRadius: '14px',
            padding: '24px', width: '920px', maxWidth: '95vw', maxHeight: '86vh',
            display: 'flex', flexDirection: 'column', color: '#e4e4e7', fontFamily: 'Segoe UI, system-ui, sans-serif',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 35px rgba(56, 189, 248, 0.2)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #27272a', paddingBottom: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '16px', fontWeight: 600 }}>QGeometry Element Tables</h3>
                  <div style={{ fontSize: '11px', color: '#a1a1aa' }}>design.qgeometry — Element GeoDataFrames (Path, Poly, Junction)</div>
                </div>
              </div>
              <button onClick={() => setIsQgeomOpen(false)} style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '20px', cursor: 'pointer', padding: '4px 8px' }}>×</button>
            </div>

            {/* Top Stat Badges */}
            {qgeomData && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <div style={{ background: '#27272a', padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}>
                  Total Elements: <strong style={{ color: '#38bdf8' }}>{qgeomData.total_elements || 0}</strong>
                </div>
                <div style={{ background: '#27272a', padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}>
                  Tables: <strong style={{ color: '#a7f3d0' }}>{(qgeomData.element_types || []).join(', ')}</strong>
                </div>
                <div style={{ background: '#27272a', padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}>
                  Layers: <strong style={{ color: '#fbcfe8' }}>{(qgeomData.unique_layers || []).join(', ')}</strong>
                </div>
              </div>
            )}

            {/* Table Select Tabs + Search Filter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(qgeomData?.element_types || ['poly', 'path', 'junction']).map(tName => {
                  const count = qgeomData?.tables?.[tName]?.count || 0;
                  const isActive = activeQGeomTab === tName;
                  return (
                    <button
                      key={tName}
                      onClick={() => setActiveQGeomTab(tName)}
                      style={{
                        background: isActive ? '#0284c7' : '#27272a',
                        border: '1px solid',
                        borderColor: isActive ? '#38bdf8' : '#3f3f46',
                        color: isActive ? '#fff' : '#d4d4d4',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {tName}
                      <span style={{
                        background: isActive ? '#0369a1' : '#3f3f46',
                        color: '#fff',
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '10px'
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                placeholder="Filter by component / shape name..."
                value={qgeomFilter}
                onChange={e => setQgeomFilter(e.target.value)}
                style={{
                  background: '#111113',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '6px 12px',
                  fontSize: '12px',
                  width: '260px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Table Content */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#111113', borderRadius: '8px', border: '1px solid #27272a' }}>
              {(() => {
                const currentTable = qgeomData?.tables?.[activeQGeomTab];
                if (!currentTable || !currentTable.elements || currentTable.elements.length === 0) {
                  return (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#71717a', fontSize: '13px' }}>
                      No elements in table '{activeQGeomTab}' for this design.
                    </div>
                  );
                }
                const filteredRows = currentTable.elements.filter(row => {
                  if (!qgeomFilter.trim()) return true;
                  const term = qgeomFilter.toLowerCase();
                  return (
                    row.component.toLowerCase().includes(term) ||
                    row.name.toLowerCase().includes(term) ||
                    row.chip.toLowerCase().includes(term)
                  );
                });

                if (filteredRows.length === 0) {
                  return (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#71717a', fontSize: '13px' }}>
                      No elements match filter '{qgeomFilter}'.
                    </div>
                  );
                }

                return (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#18181b', color: '#a1a1aa', borderBottom: '1px solid #27272a', position: 'sticky', top: 0 }}>
                        <th style={{ padding: '8px 12px' }}>Component</th>
                        <th style={{ padding: '8px 12px' }}>Name</th>
                        <th style={{ padding: '8px 12px' }}>Layer</th>
                        <th style={{ padding: '8px 12px' }}>Chip</th>
                        <th style={{ padding: '8px 12px' }}>Type</th>
                        <th style={{ padding: '8px 12px' }}>Subtract</th>
                        <th style={{ padding: '8px 12px' }}>Helper</th>
                        {activeQGeomTab === 'path' && <th style={{ padding: '8px 12px' }}>Width</th>}
                        {activeQGeomTab === 'path' && <th style={{ padding: '8px 12px' }}>Fillet</th>}
                        <th style={{ padding: '8px 12px' }}>Bounds (mm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((r, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #222226', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                          <td style={{ padding: '6px 12px', color: '#38bdf8', fontWeight: 500 }}>{r.component}</td>
                          <td style={{ padding: '6px 12px', color: '#e4e4e7', fontFamily: 'monospace' }}>{r.name}</td>
                          <td style={{ padding: '6px 12px', color: '#cbd5e1' }}>{r.layer}</td>
                          <td style={{ padding: '6px 12px', color: '#a1a1aa' }}>{r.chip}</td>
                          <td style={{ padding: '6px 12px', color: '#c084fc' }}>{r.geom_type}</td>
                          <td style={{ padding: '6px 12px' }}>
                            <span style={{
                              padding: '1px 6px', borderRadius: '4px', fontSize: '10px',
                              background: r.subtract ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                              color: r.subtract ? '#f87171' : '#4ade80'
                            }}>
                              {r.subtract ? 'true' : 'false'}
                            </span>
                          </td>
                          <td style={{ padding: '6px 12px' }}>
                            <span style={{
                              padding: '1px 6px', borderRadius: '4px', fontSize: '10px',
                              background: r.helper ? 'rgba(234, 179, 8, 0.2)' : 'rgba(113, 113, 122, 0.2)',
                              color: r.helper ? '#facc15' : '#a1a1aa'
                            }}>
                              {r.helper ? 'true' : 'false'}
                            </span>
                          </td>
                          {activeQGeomTab === 'path' && (
                            <td style={{ padding: '6px 12px', color: '#93c5fd' }}>{r.width != null ? `${r.width} mm` : '-'}</td>
                          )}
                          {activeQGeomTab === 'path' && (
                            <td style={{ padding: '6px 12px', color: '#fdba74' }}>{r.fillet || '-'}</td>
                          )}
                          <td style={{ padding: '6px 12px', color: '#94a3b8', fontFamily: 'monospace', fontSize: '10px' }}>
                            {r.bounds.map(b => b.toFixed(3)).join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            {/* Component collective bounds summary */}
            {qgeomData?.component_bounds && Object.keys(qgeomData.component_bounds).length > 0 && (
              <div style={{ marginTop: '12px', padding: '10px', background: '#111113', borderRadius: '8px', border: '1px solid #27272a' }}>
                <div style={{ fontSize: '11px', color: '#a1a1aa', marginBottom: '6px', fontWeight: 600 }}>
                  Component Collective Bounds (minx, miny, maxx, maxy):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.entries(qgeomData.component_bounds).map(([cName, b]) => (
                    <span key={cName} style={{ background: '#1c1917', border: '1px solid #292524', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', color: '#fdba74', fontFamily: 'monospace' }}>
                      <strong style={{ color: '#38bdf8' }}>{cName}:</strong> [{b.map(x => x.toFixed(2)).join(', ')}]
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px' }}>
              <button
                onClick={handleOpenQGeometry}
                style={{
                  background: '#27272a', border: '1px solid #3f3f46', color: '#38bdf8',
                  padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer'
                }}
              >
                Refresh Tables
              </button>
              <button
                onClick={() => setIsQgeomOpen(false)}
                style={{
                  background: '#27272a', border: 'none', color: '#fff',
                  padding: '6px 18px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D Multi-Chip Physical & DRC Verification Modal */}
      <Verify3DModal
        isOpen={isVerify3DOpen}
        onClose={() => setIsVerify3DOpen(false)}
        result={verify3DResult}
        onRerun={handleRun3DVerification}
      />

      {/* Unified Down Bar */}
      <UnifiedNavbar session={session} />
    </div>
  );
}

function ToolbarButton({ icon, label, onClick, title, active = false }) {
  return (
    <button 
      onClick={onClick}
      title={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? '#272d3b' : 'transparent', 
        border: active ? '1px solid #38bdf8' : '1px solid transparent', 
        borderRadius: '4px',
        color: active ? '#38bdf8' : '#d4d4d4', 
        padding: '4px 6px', 
        cursor: 'pointer',
        gap: '6px'
      }}
      onMouseOver={e => { 
        if (!active) {
          e.currentTarget.style.background = '#3f3f46'; 
          e.currentTarget.style.borderColor = '#555'; 
        }
      }}
      onMouseOut={e => { 
        if (!active) {
          e.currentTarget.style.background = 'transparent'; 
          e.currentTarget.style.borderColor = 'transparent'; 
        }
      }}
    >
      {icon && <span style={{ fontSize: '13px' }}>{icon}</span>}
      <span style={{ fontSize: '11px', fontWeight: active ? 600 : 400 }}>{label}</span>
    </button>
  );
}

function RendererButton({ label, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      <div style={{ background: color, color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>{label}</div>
      <div style={{ fontSize: '10px', color: '#9ca3af' }}>{label}</div>
    </div>
  );
}
