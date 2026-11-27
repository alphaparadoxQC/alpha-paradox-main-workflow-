import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotebookStore from '../../stores/notebookStore';
import { useCircuitStore } from '../../stores/circuitStore';
import { useEdaStore } from '../../stores/edaStore';
import useAnalogStore from '../../stores/analogStore';
import { useBackendStore } from '../../stores/backendStore';
import CrossProductBridge, { ALPHA_METAL_CHIP_TEMPLATE } from '../../quantum-engine/cross-product-bridge';
import AlphaIR from '../../quantum-engine/alpha-ir';
import SettingsModal from './SettingsModal';
import ShareModal from './ShareModal';

/**
 * NotebookToolbar — Colab-style top bar with file management, kernel controls, and menus.
 */
export default function NotebookToolbar({ onToggleBg, showVideoBg, onOpenResources }) {
  const navigate = useNavigate();
  const {
    notebookName, setNotebookName,
    kernelStatus, addCell, runAll,
    interruptKernel, restartKernel, clearOutputs,
    toIpynb, fromIpynb, markSaved, dirty,
  } = useNotebookStore();

  const [activeMenu, setActiveMenu] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Close menus on click outside
  useEffect(() => {
    const handleClick = () => setActiveMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const toggleMenu = (e, menuName) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  // ── File Operations ──────────────────────────────────────────────────────
  const handleSaveIpynb = () => {
    const ipynb = toIpynb();
    const blob = new Blob([JSON.stringify(ipynb, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${notebookName.replace(/\\s+/g, '_')}.ipynb`;
    a.click();
    URL.revokeObjectURL(url);
    markSaved();
  };

  const handleExportPy = () => {
    const state = useNotebookStore.getState();
    const pyLines = state.cells
      .filter(c => c.type === 'code')
      .map(c => c.content)
      .join('\\n\\n');
    const blob = new Blob([pyLines], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${notebookName.replace(/\\s+/g, '_')}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenIpynb = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ipynb';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const notebook = JSON.parse(text);
        fromIpynb(notebook);
        setNotebookName(file.name.replace('.ipynb', ''));
      } catch (err) {
        console.error('Failed to parse notebook:', err);
      }
    };
    input.click();
  };

  const handleOpenAlphaProject = () => {
    AlphaIR.openProjectFile()
      .then((ir) => {
        AlphaIR.deserialize(
          ir,
          useCircuitStore.getState(),
          useAnalogStore.getState(),
          useNotebookStore.getState(),
          useBackendStore.getState(),
          useEdaStore.getState()
        );
        if (ir.metadata?.name) setNotebookName(ir.metadata.name);
      })
      .catch((err) => {
        console.error('[AlphaIR] Failed to load .alpha project in Notebook:', err);
      });
  };

  const handleSaveAlphaProject = () => {
    const irData = AlphaIR.serialize(
      useCircuitStore.getState(),
      useAnalogStore.getState(),
      useNotebookStore.getState(),
      useBackendStore.getState(),
      {},
      useEdaStore.getState()
    );
    AlphaIR.downloadProject(irData, notebookName || 'alpha-project');
  };

  const handleImportComposerCircuit = () => {
    const circuitState = useCircuitStore.getState();
    const circuit = circuitState.circuit;
    if (!circuit || circuit.operations.length === 0) {
      alert('Composer circuit is empty! Add gates in Composer first.');
      return;
    }
    CrossProductBridge.bridgeComposerToNotebook(null);
  };

  const handleSendChipToEda = () => {
    const state = useNotebookStore.getState();
    const cells = state.cells || [];
    
    // Find active cell or first cell with metal/chip code
    let targetCode = '';
    const activeCell = cells.find(c => c.id === state.activeCellId && c.type === 'code');
    if (activeCell && activeCell.content) {
      targetCode = activeCell.content;
    } else {
      const metalCell = cells.find(c =>
        c.type === 'code' && (
          c.content.includes('alpha_metal') ||
          c.content.includes('Transmon') ||
          c.content.includes('DesignPlanar') ||
          c.content.includes('RouteMeander') ||
          c.content.includes('QDesign')
        )
      );
      if (metalCell) targetCode = metalCell.content;
      else if (cells.length > 0 && cells[0].content) targetCode = cells[0].content;
    }

    if (!targetCode) {
      alert('No Python code found to synthesize into Silicon EDA.');
      return;
    }

    const res = CrossProductBridge.bridgeNotebookToEda(targetCode, navigate);
    if (!res.success && res.message) {
      alert(res.message);
    }
  };

  const handleInsertChipTemplate = () => {
    addCell('code', ALPHA_METAL_CHIP_TEMPLATE);
    setActiveMenu(null);
  };

  const kernelDot = {
    disconnected: { color: '#6b7280', label: 'Disconnected' },
    connecting: { color: '#8ab4f8', label: 'Connecting...' },
    idle: { color: '#10b981', label: 'Connected' },
    busy: { color: '#f59e0b', label: 'Busy' },
    restarting: { color: '#f59e0b', label: 'Restarting...' },
    error: { color: '#ef4444', label: 'Error' },
  }[kernelStatus] || { color: '#6b7280', label: 'Disconnected' };

  return (
    <div className="nb-toolbar">
      <div className="nb-toolbar-left">
        <div className="nb-toolbar-brand">
          <img src="/logo-2.jpg" alt="Logo" className="nb-toolbar-logo" />
          <span className="nb-toolbar-logo-text">Quantum Notebook</span>
        </div>

        <div className="nb-toolbar-main">
          <div className="nb-toolbar-file-row">
            <span className="nb-toolbar-icon-small" title="Quantum Drive">🔺</span>
            <input
              className="nb-toolbar-filename-input"
              value={notebookName}
              onChange={(e) => setNotebookName(e.target.value)}
            />
            {dirty && <span className="nb-toolbar__dirty" style={{ color: '#f59e0b', fontSize: '0.7rem' }}>●</span>}
            <span className="nb-toolbar-icon-small" title="Star">⭐</span>
            <span className="nb-toolbar-icon-small" title="Save to Cloud" onClick={handleSaveIpynb}>☁️</span>
          </div>
          
          <div className="nb-toolbar-menu-row">
            <div className="nb-toolbar-menu-item">
              <button className="nb-toolbar-menu-btn" onClick={(e) => toggleMenu(e, 'File')}>File</button>
              {activeMenu === 'File' && (
                <div className="nb-toolbar-dropdown">
                  <button className="nb-toolbar-dropdown-btn" onClick={handleOpenIpynb}>📂 Open notebook (.ipynb)</button>
                  <button className="nb-toolbar-dropdown-btn" onClick={handleOpenAlphaProject}>🌐 Open .alpha Project</button>
                  <button className="nb-toolbar-dropdown-btn" onClick={handleSaveIpynb}>💾 Download .ipynb</button>
                  <button className="nb-toolbar-dropdown-btn" onClick={handleSaveAlphaProject}>📦 Download .alpha Project</button>
                  <button className="nb-toolbar-dropdown-btn" onClick={handleExportPy}>📄 Download .py</button>
                </div>
              )}
            </div>
            
            <div className="nb-toolbar-menu-item">
              <button className="nb-toolbar-menu-btn" onClick={(e) => toggleMenu(e, 'Edit')}>Edit</button>
              {activeMenu === 'Edit' && (
                <div className="nb-toolbar-dropdown">
                  <button className="nb-toolbar-dropdown-btn" onClick={clearOutputs}>🧹 Clear all outputs</button>
                </div>
              )}
            </div>
            
            <div className="nb-toolbar-menu-item">
              <button className="nb-toolbar-menu-btn">View</button>
            </div>
            
            <div className="nb-toolbar-menu-item">
              <button className="nb-toolbar-menu-btn" onClick={(e) => toggleMenu(e, 'Insert')}>Insert</button>
              {activeMenu === 'Insert' && (
                <div className="nb-toolbar-dropdown">
                  <button className="nb-toolbar-dropdown-btn" onClick={() => addCell('code')}>+ Code cell</button>
                  <button className="nb-toolbar-dropdown-btn" onClick={() => addCell('markdown')}>+ Markdown cell</button>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                  <button className="nb-toolbar-dropdown-btn" onClick={handleInsertChipTemplate} style={{ color: '#38bdf8', fontWeight: 600 }}>
                    📐 + Quantum Chip Template (Alpha Metal)
                  </button>
                </div>
              )}
            </div>
            
            <div className="nb-toolbar-menu-item">
              <button className="nb-toolbar-menu-btn" onClick={(e) => toggleMenu(e, 'Runtime')}>Runtime</button>
              {activeMenu === 'Runtime' && (
                <div className="nb-toolbar-dropdown">
                  <button className="nb-toolbar-dropdown-btn" onClick={runAll}>▶▶ Run all</button>
                  <button className="nb-toolbar-dropdown-btn" onClick={interruptKernel}>⏹ Interrupt execution</button>
                  <button className="nb-toolbar-dropdown-btn" onClick={restartKernel}>🔄 Restart session</button>
                </div>
              )}
            </div>
            
            <div className="nb-toolbar-menu-item">
              <button className="nb-toolbar-menu-btn" onClick={(e) => toggleMenu(e, 'Tools')}>Tools</button>
              {activeMenu === 'Tools' && (
                <div className="nb-toolbar-dropdown">
                  <button className="nb-toolbar-dropdown-btn" onClick={handleImportComposerCircuit}>
                    ⚛️ Import Active Composer Circuit
                  </button>
                  <button className="nb-toolbar-dropdown-btn" onClick={() => navigate('/composer')}>
                    🚀 Open Composer Studio
                  </button>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                  <button className="nb-toolbar-dropdown-btn" onClick={handleInsertChipTemplate}>
                    📐 Insert Quantum Chip Template (Alpha Metal)
                  </button>
                  <button className="nb-toolbar-dropdown-btn" onClick={handleSendChipToEda}>
                    📐 Send Python Chip Code to Silicon EDA
                  </button>
                  <button className="nb-toolbar-dropdown-btn" onClick={() => navigate('/eda')}>
                    📐 Open Silicon EDA Layout Studio
                  </button>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                  {onToggleBg && (
                    <button className="nb-toolbar-dropdown-btn" onClick={onToggleBg}>
                      {showVideoBg ? '🖼️ Switch to Still Background' : '🎥 Switch to Video Background'}
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="nb-toolbar-menu-item">
              <button className="nb-toolbar-menu-btn">Help</button>
            </div>
          </div>
        </div>
      </div>

      <div className="nb-toolbar-right">
        {/* Quick Cross-Product Bridge Buttons */}
        <button
          onClick={handleImportComposerCircuit}
          title="Import active visual circuit from Composer into a new Python cell"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            color: '#c084fc',
            padding: '4px 9px',
            borderRadius: '4px',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>⚛️</span>
          <span>Import Circuit</span>
        </button>

        <button
          onClick={handleSendChipToEda}
          title="Synthesize Python Alpha Metal chip design into Silicon EDA visual canvas"
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#38bdf8',
            padding: '4px 9px',
            borderRadius: '4px',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>📐</span>
          <span>Send Chip to EDA</span>
        </button>

        {/* RAM / Disk indicator with dropdown */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
             onMouseEnter={() => document.getElementById('ram-disk-tooltip').style.display = 'block'}
             onMouseLeave={() => document.getElementById('ram-disk-tooltip').style.display = 'none'}
        >
          <div 
            className="nb-toolbar-ram-disk"
            onClick={(e) => toggleMenu(e, 'Resources')}
            style={{ 
              display: 'flex', alignItems: 'center', cursor: 'pointer',
              padding: '4px 8px', borderRadius: '4px', gap: '8px'
            }}
          >
            <span style={{ color: kernelDot.color, fontSize: '0.9rem' }}>✓</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6rem', color: '#9aa0a6' }}>
                <span>RAM</span>
                <div style={{ width: '12px', height: '4px', background: '#3c4043', borderRadius: '1px', overflow: 'hidden' }}>
                  <div style={{ width: '40%', height: '100%', background: '#10b981' }}></div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6rem', color: '#9aa0a6' }}>
                <span>Disk</span>
                <div style={{ width: '12px', height: '4px', background: '#3c4043', borderRadius: '1px', overflow: 'hidden' }}>
                  <div style={{ width: '25%', height: '100%', background: '#10b981' }}></div>
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#9aa0a6' }}>▼</span>
          </div>
          
          <div 
            id="ram-disk-tooltip"
            style={{
              display: 'none', position: 'absolute', top: '100%', right: '50%',
              background: '#e8eaed', color: '#202124', padding: '8px 12px',
              borderRadius: '4px', fontSize: '0.75rem', zIndex: 300,
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)', whiteSpace: 'nowrap',
              lineHeight: '1.4', marginTop: '10px'
            }}
          >
            Connected to<br/>
            Python 3 Google Compute Engine backend<br/>
            RAM: 1.05 GB/12.67 GB<br/>
            Disk: 20.34 GB/107.72 GB
          </div>

          {activeMenu === 'Resources' && (
            <div className="nb-toolbar-dropdown" style={{ right: 0, left: 'auto', minWidth: '240px', marginTop: '30px' }}>
              <button className="nb-toolbar-dropdown-btn">Connect to a hosted runtime</button>
              <button className="nb-toolbar-dropdown-btn">Change runtime type</button>
              <div style={{ height: '1px', background: '#3c4043', margin: '4px 0' }}></div>
              <button className="nb-toolbar-dropdown-btn">Connect to Google Cloud runtime</button>
              <button className="nb-toolbar-dropdown-btn">Connect via SSH</button>
              <button className="nb-toolbar-dropdown-btn">Connect to a local runtime</button>
              <div style={{ height: '1px', background: '#3c4043', margin: '4px 0' }}></div>
              <button 
                className="nb-toolbar-dropdown-btn" 
                onClick={() => { setActiveMenu(null); onOpenResources && onOpenResources(); }}
              >
                View resources
              </button>
              <button className="nb-toolbar-dropdown-btn">Manage sessions</button>
              <button className="nb-toolbar-dropdown-btn">Disconnect and delete runtime</button>
              <div style={{ height: '1px', background: '#3c4043', margin: '4px 0' }}></div>
              <button className="nb-toolbar-dropdown-btn">Show executed code history</button>
              <button className="nb-toolbar-dropdown-btn">Focus the last run cell</button>
            </div>
          )}
        </div>
        <button className="nb-toolbar-action-icon" title="Comments">💬</button>
        <button className="nb-toolbar-action-icon" title="Settings" onClick={() => setSettingsOpen(true)}>⚙️</button>
        <button className="nb-toolbar-share-btn" onClick={() => setShareOpen(true)}>👥 Share</button>
        <div className="nb-toolbar-profile">S</div>
      </div>

      {/* Modals */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        notebookName={notebookName}
      />
    </div>
  );
}
