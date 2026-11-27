import React, { useState, useMemo } from 'react';
import {
  PERIODIC_TABLE,
  PERIODIC_MAP,
  buildCustomMolecule
} from '../../../quantum-engine/labs/chemistry-engine';

export default function PeriodicTableWorkbench({
  isOpen,
  onClose,
  onSynthesizeAndRun,
  currentMolecule
}) {
  const [selectedElement, setSelectedElement] = useState(PERIODIC_MAP.C || PERIODIC_TABLE[0]);
  const [atomInventory, setAtomInventory] = useState([
    { element: 'H', count: 2 },
    { element: 'O', count: 1 }
  ]);
  const [geometry, setGeometry] = useState('auto');
  const [charge, setCharge] = useState(0);

  // Group elements by period for the visual periodic table grid
  const period1 = PERIODIC_TABLE.filter(e => e.period === 1);
  const period2 = PERIODIC_TABLE.filter(e => e.period === 2);
  const period3 = PERIODIC_TABLE.filter(e => e.period === 3);
  const period4 = PERIODIC_TABLE.filter(e => e.period === 4);

  // Add element to inventory
  const handleAddElement = (elem) => {
    setAtomInventory(prev => {
      const existing = prev.find(item => item.element === elem.symbol);
      if (existing) {
        return prev.map(item =>
          item.element === elem.symbol ? { ...item, count: item.count + 1 } : item
        );
      }
      return [...prev, { element: elem.symbol, count: 1 }];
    });
  };

  const handleUpdateCount = (symbol, delta) => {
    setAtomInventory(prev => {
      return prev
        .map(item => {
          if (item.element === symbol) {
            const newCount = item.count + delta;
            return newCount > 0 ? { ...item, count: newCount } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const handleRemoveElement = (symbol) => {
    setAtomInventory(prev => prev.filter(item => item.element !== symbol));
  };

  const handleClear = () => {
    setAtomInventory([]);
  };

  // Student Presets
  const studentPresets = [
    { name: 'H₂ (Hydrogen)', atoms: [{ element: 'H', count: 2 }], geom: 'auto' },
    { name: 'LiH (Lithium Hydride)', atoms: [{ element: 'Li', count: 1 }, { element: 'H', count: 1 }], geom: 'auto' },
    { name: 'HF (Hydrogen Fluoride)', atoms: [{ element: 'H', count: 1 }, { element: 'F', count: 1 }], geom: 'auto' },
    { name: 'CO (Carbon Monoxide)', atoms: [{ element: 'C', count: 1 }, { element: 'O', count: 1 }], geom: 'auto' },
    { name: 'N₂ (Dinitrogen)', atoms: [{ element: 'N', count: 2 }], geom: 'auto' },
    { name: 'BeH₂ (Beryllium Dihydride)', atoms: [{ element: 'Be', count: 1 }, { element: 'H', count: 2 }], geom: 'linear' },
    { name: 'H₂O (Water)', atoms: [{ element: 'H', count: 2 }, { element: 'O', count: 1 }], geom: 'bent' },
    { name: 'NH₃ (Ammonia)', atoms: [{ element: 'N', count: 1 }, { element: 'H', count: 3 }], geom: 'auto' },
    { name: 'CH₄ (Methane)', atoms: [{ element: 'C', count: 1 }, { element: 'H', count: 4 }], geom: 'tetrahedral' },
    { name: 'CO₂ (Carbon Dioxide)', atoms: [{ element: 'C', count: 1 }, { element: 'O', count: 2 }], geom: 'linear' },
    { name: 'HCl (Hydrochloric)', atoms: [{ element: 'H', count: 1 }, { element: 'Cl', count: 1 }], geom: 'auto' },
    { name: 'Li₂ (Dilithium)', atoms: [{ element: 'Li', count: 2 }], geom: 'auto' }
  ];

  const handleLoadPreset = (preset) => {
    setAtomInventory(preset.atoms);
    setGeometry(preset.geom);
    setCharge(0);
  };

  // Live preview molecule synthesized in real-time
  const previewMolecule = useMemo(() => {
    if (atomInventory.length === 0) return null;
    return buildCustomMolecule({
      atoms: atomInventory,
      charge,
      geometry
    });
  }, [atomInventory, charge, geometry]);

  const handleSynthesizeAndRun = () => {
    if (!previewMolecule) return;
    if (typeof onSynthesizeAndRun === 'function') {
      onSynthesizeAndRun(previewMolecule);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="periodic-workbench-modal" onClick={onClose}>
      <div className="periodic-workbench-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="periodic-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.25rem' }}>🔬</span>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--lab-text-primary)' }}>
                Interactive Periodic Table & Molecular Assembly Studio
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--lab-text-muted)' }}>
                Select elements to build any molecule and simulate its quantum electronic ground state with VQE
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lab-action-btn"
            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
          >
            ✕ Close
          </button>
        </div>

        {/* Main Content Grid: Periodic Table Left, Inspector & Molecule Workbench Right */}
        <div className="periodic-content-grid">
          {/* Left Column: Periodic Table Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Quick Presets Bar */}
            <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '6px', border: '1px solid var(--lab-border)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--lab-text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--lab-font-mono)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>⚡ Quick Student Presets</span>
                <span style={{ color: 'var(--lab-cyan)' }}>1-Click Load</span>
              </div>
              <div className="preset-chip-list">
                {studentPresets.map((p, idx) => (
                  <button
                    key={idx}
                    className="preset-chip-btn"
                    onClick={() => handleLoadPreset(p)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Periodic Table Visual Grid */}
            <div className="pt-table-grid">
              {/* Period 1 */}
              <div className="pt-row">
                <span className="pt-row-label">P1</span>
                {/* H */}
                {renderElementCell(period1[0], selectedElement, setSelectedElement, handleAddElement)}
                {/* Gap 16 columns */}
                <div className="pt-gap" />
                {/* He */}
                {renderElementCell(period1[1], selectedElement, setSelectedElement, handleAddElement)}
              </div>

              {/* Period 2 */}
              <div className="pt-row">
                <span className="pt-row-label">P2</span>
                {/* Li, Be */}
                {renderElementCell(period2[0], selectedElement, setSelectedElement, handleAddElement)}
                {renderElementCell(period2[1], selectedElement, setSelectedElement, handleAddElement)}
                {/* Gap 10 columns */}
                <div className="pt-gap" />
                {/* B, C, N, O, F, Ne */}
                {period2.slice(2).map(elem =>
                  renderElementCell(elem, selectedElement, setSelectedElement, handleAddElement)
                )}
              </div>

              {/* Period 3 */}
              <div className="pt-row">
                <span className="pt-row-label">P3</span>
                {/* Na, Mg */}
                {renderElementCell(period3[0], selectedElement, setSelectedElement, handleAddElement)}
                {renderElementCell(period3[1], selectedElement, setSelectedElement, handleAddElement)}
                {/* Gap 10 columns */}
                <div className="pt-gap" />
                {/* Al, Si, P, S, Cl, Ar */}
                {period3.slice(2).map(elem =>
                  renderElementCell(elem, selectedElement, setSelectedElement, handleAddElement)
                )}
              </div>

              {/* Period 4 */}
              <div className="pt-row">
                <span className="pt-row-label">P4</span>
                {/* K, Ca */}
                {renderElementCell(period4[0], selectedElement, setSelectedElement, handleAddElement)}
                {renderElementCell(period4[1], selectedElement, setSelectedElement, handleAddElement)}
                <div className="pt-gap" style={{ display: 'flex', alignItems: 'center', paddingLeft: '12px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--lab-text-muted)', fontFamily: 'var(--lab-font-mono)' }}>
                    Early Main Group & Transition Metals (Z=1 to 20 STO-3G Active Basis)
                  </span>
                </div>
              </div>
            </div>

            {/* Element Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.66rem', color: 'var(--lab-text-secondary)', background: 'var(--lab-bg-subpanel)', padding: '8px 12px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} />
                <span>Alkali Metal</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }} />
                <span>Alkaline Earth</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24' }} />
                <span>Metalloid</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }} />
                <span>Nonmetal</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2dd4bf' }} />
                <span>Halogen</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4' }} />
                <span>Noble Gas</span>
              </div>
            </div>
          </div>

          {/* Right Column: Element Inspector & Custom Molecule Assembly Workbench */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Element Inspector Card */}
            {selectedElement && (
              <div className="pt-inspector">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '1.6rem', fontWeight: '800', color: selectedElement.color }}>
                        {selectedElement.symbol}
                      </span>
                      <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--lab-text-primary)' }}>
                        {selectedElement.name}
                      </span>
                    </div>
                    <span className="pt-detail-badge" style={{ background: `${selectedElement.color}22`, color: selectedElement.color, border: `1px solid ${selectedElement.color}44` }}>
                      {selectedElement.category} · {selectedElement.state}
                    </span>
                  </div>
                  <button
                    className="lab-action-btn primary"
                    onClick={() => handleAddElement(selectedElement)}
                    style={{ padding: '6px 12px', fontSize: '0.74rem' }}
                  >
                    + Add Atom
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div className="pt-prop-row">
                    <span className="pt-prop-label">Atomic Number (Z)</span>
                    <span className="pt-prop-val">{selectedElement.z}</span>
                  </div>
                  <div className="pt-prop-row">
                    <span className="pt-prop-label">Atomic Mass</span>
                    <span className="pt-prop-val">{selectedElement.atomicMass} u</span>
                  </div>
                  <div className="pt-prop-row">
                    <span className="pt-prop-label">Electron Configuration</span>
                    <span className="pt-prop-val" style={{ color: 'var(--lab-cyan)' }}>{selectedElement.electronConfig}</span>
                  </div>
                  <div className="pt-prop-row">
                    <span className="pt-prop-label">Valence Electrons</span>
                    <span className="pt-prop-val">{selectedElement.valenceElectrons} e⁻</span>
                  </div>
                  <div className="pt-prop-row">
                    <span className="pt-prop-label">Electronegativity (Pauling)</span>
                    <span className="pt-prop-val">{selectedElement.electronegativity || 'N/A'}</span>
                  </div>
                  <div className="pt-prop-row">
                    <span className="pt-prop-label">Covalent Radius</span>
                    <span className="pt-prop-val">{selectedElement.covalentRadius} Å</span>
                  </div>
                  <div className="pt-prop-row">
                    <span className="pt-prop-label">Ground State Energy</span>
                    <span className="pt-prop-val">{selectedElement.groundStateEnergy_Ha} Ha</span>
                  </div>
                </div>
              </div>
            )}

            {/* Molecule Assembly Workbench */}
            <div className="molecule-assembly-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--lab-text-primary)', textTransform: 'uppercase', fontFamily: 'var(--lab-font-mono)' }}>
                  ⚗️ Molecule Assembly
                </span>
                {atomInventory.length > 0 && (
                  <button
                    onClick={handleClear}
                    style={{ background: 'transparent', border: 'none', color: 'var(--lab-text-muted)', fontSize: '0.68rem', cursor: 'pointer' }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Atoms Inventory Chips */}
              <div className="atom-inventory-list">
                {atomInventory.length === 0 ? (
                  <span style={{ fontSize: '0.72rem', color: 'var(--lab-text-muted)', fontStyle: 'italic' }}>
                    Click elements above to add atoms to your molecule...
                  </span>
                ) : (
                  atomInventory.map((item, idx) => {
                    const elData = PERIODIC_MAP[item.element] || PERIODIC_MAP.H;
                    return (
                      <div key={idx} className="atom-chip">
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: elData.color }} />
                        <span style={{ fontWeight: '700', fontFamily: 'var(--lab-font-mono)' }}>{item.element}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '4px' }}>
                          <button
                            className="atom-chip-btn"
                            onClick={() => handleUpdateCount(item.element, -1)}
                          >
                            -
                          </button>
                          <span style={{ fontFamily: 'var(--lab-font-mono)', minWidth: '14px', textAlign: 'center' }}>
                            {item.count}
                          </span>
                          <button
                            className="atom-chip-btn"
                            onClick={() => handleUpdateCount(item.element, 1)}
                          >
                            +
                          </button>
                          <button
                            className="atom-chip-btn delete"
                            onClick={() => handleRemoveElement(item.element)}
                            style={{ marginLeft: '4px' }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Geometry & Charge Settings */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="lab-form-group">
                  <label className="lab-label" style={{ fontSize: '0.7rem' }}>Geometry</label>
                  <select
                    className="lab-select"
                    value={geometry}
                    onChange={(e) => setGeometry(e.target.value)}
                    style={{ fontSize: '0.74rem', padding: '4px 6px' }}
                  >
                    <option value="auto">Auto (VSEPR)</option>
                    <option value="linear">Linear (180°)</option>
                    <option value="bent">Bent (104.5°)</option>
                    <option value="trigonal">Trigonal Planar</option>
                    <option value="tetrahedral">Tetrahedral</option>
                  </select>
                </div>

                <div className="lab-form-group">
                  <label className="lab-label" style={{ fontSize: '0.7rem' }}>Charge</label>
                  <select
                    className="lab-select"
                    value={charge}
                    onChange={(e) => setCharge(Number(e.target.value))}
                    style={{ fontSize: '0.74rem', padding: '4px 6px' }}
                  >
                    <option value={0}>Neutral (0)</option>
                    <option value={1}>Cation (+1)</option>
                    <option value={-1}>Anion (-1)</option>
                  </select>
                </div>
              </div>

              {/* Live Preview Telemetry */}
              {previewMolecule && (
                <div style={{ background: 'var(--lab-bg-input)', padding: '10px', borderRadius: '4px', border: '1px solid var(--lab-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--lab-text-secondary)' }}>Synthesized Formula:</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: '800', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
                      {previewMolecule.formula}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.68rem' }}>
                    <div style={{ background: 'var(--lab-bg-panel)', padding: '4px 6px', borderRadius: '3px' }}>
                      <span style={{ color: 'var(--lab-text-secondary)' }}>Electrons: </span>
                      <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-text-primary)' }}>{previewMolecule.electronCount} e⁻</span>
                    </div>
                    <div style={{ background: 'var(--lab-bg-panel)', padding: '4px 6px', borderRadius: '3px' }}>
                      <span style={{ color: 'var(--lab-text-secondary)' }}>Active Qubits: </span>
                      <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>{previewMolecule.taperedQubits} Q</span>
                    </div>
                    <div style={{ background: 'var(--lab-bg-panel)', padding: '4px 6px', borderRadius: '3px' }}>
                      <span style={{ color: 'var(--lab-text-secondary)' }}>Active Space: </span>
                      <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-amber)' }}>CAS({previewMolecule.activeElectrons},{Math.ceil(previewMolecule.taperedQubits / 2)})</span>
                    </div>
                    <div style={{ background: 'var(--lab-bg-panel)', padding: '4px 6px', borderRadius: '3px' }}>
                      <span style={{ color: 'var(--lab-text-secondary)' }}>Eq. Length Rₑ: </span>
                      <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>{previewMolecule.eqBondLength} Å</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button: Synthesize & Run VQE Simulation */}
              <button
                className="lab-action-btn primary"
                disabled={!previewMolecule}
                onClick={handleSynthesizeAndRun}
                style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.82rem', marginTop: '4px' }}
              >
                <span>▶ Synthesize & Run VQE Simulation</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper to render each element cell in the periodic grid ─────────────────
function renderElementCell(elem, selected, onSelect, onAdd) {
  if (!elem) return null;
  const isSelected = selected && selected.symbol === elem.symbol;

  return (
    <div
      key={elem.symbol}
      className={`pt-cell ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(elem)}
      onDoubleClick={() => onAdd(elem)}
      title={`${elem.name} (Z=${elem.z}) - Click to inspect, double-click to add`}
    >
      <span className="pt-cell-z">{elem.z}</span>
      <span className="pt-cell-sym" style={{ color: elem.color }}>
        {elem.symbol}
      </span>
      <span className="pt-cell-mass">{elem.atomicMass}</span>
      <span className="pt-cell-cat-dot" style={{ background: elem.color }} />
    </div>
  );
}

