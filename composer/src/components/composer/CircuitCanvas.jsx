import { useRef, useState } from 'react';
import { useCircuitStore } from '../../stores/circuitStore';
import { getGate } from '../../quantum-engine/gates';
import GatePalette, { getGateUIParams } from './GatePalette';
import ManageRegistersModal from './ManageRegistersModal';
import EditGateModal from './EditGateModal';
import GateInfoModal from './GateInfoModal';
import GateExpandModal from './GateExpandModal';
import { useJobStore } from '../../stores/jobStore';

export default function CircuitCanvas({ liveResult, readOnly = false }) {
  const circuit = useCircuitStore(state => state.circuit);
  const addGate = useCircuitStore(state => state.addGate);
  const isDragging = useCircuitStore(state => state.isDragging);
  const selectedGateId = useCircuitStore(state => state.selectedGateId);
  const customEditMode = useCircuitStore(state => state.customEditMode);
  const { activeJobId, jobs } = useJobStore();
  const canvasRef = useRef(null);
  const [debugMode, setDebugMode] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [editModal, setEditModal] = useState(null);   // operation obj
  const [infoModal, setInfoModal] = useState(null);    // operation obj
  const [expandModal, setExpandModal] = useState(null); // operation obj
  const [copyToast, setCopyToast] = useState(false);

  const activeJob = jobs.find(j => j.id === activeJobId);
  const isRunning = activeJob && activeJob.status === 'running';

  const handleDrop = (e, targetQubit, targetTimeSlice) => {
    if (readOnly) return;
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    
    if (type === 'existing_gate') {
      const gateId = e.dataTransfer.getData('gateId');
      if (!gateId) return;
      const op = circuit.operations.find(o => o.id === gateId);
      if (!op) return;
      
      const offset = targetQubit - Math.min(...op.qubits);
      const newQubits = op.qubits.map(q => q + offset);
      
      if (Math.min(...newQubits) < 0 || Math.max(...newQubits) >= circuit.numQubits) {
        return; // out of bounds
      }
      
      useCircuitStore.getState().moveGate(gateId, newQubits, targetTimeSlice);
    } else {
      const gateName = e.dataTransfer.getData('gate');
      if (!gateName) return;

      const gateDef = getGate(gateName);
      if (!gateDef) return;

      if (gateDef.qubits === 1) {
        addGate(gateName, targetQubit, targetTimeSlice);
      } else if (gateDef.qubits === 2) {
        const q2 = targetQubit + 1 < circuit.numQubits ? targetQubit + 1 : targetQubit - 1;
        addGate(gateName, [targetQubit, q2], targetTimeSlice);
      } else if (gateDef.qubits === 3) {
        addGate(gateName, [targetQubit, (targetQubit + 1) % circuit.numQubits, (targetQubit + 2) % circuit.numQubits], targetTimeSlice);
      } else if (gateDef.qubits === 4) {
        addGate(gateName, [
          targetQubit, 
          (targetQubit + 1) % circuit.numQubits, 
          (targetQubit + 2) % circuit.numQubits,
          (targetQubit + 3) % circuit.numQubits
        ], targetTimeSlice);
      } else if (gateDef.qubits === 'all') {
        addGate(gateName, Array.from({length: circuit.numQubits}, (_, i) => i), targetTimeSlice);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Convert circuit to grid representation for rendering
  const grid = circuit.toGrid();
  const maxSlices = Math.max(10, circuit.depth + 2);

  return (
    <>
      {/* Canvas Sub-Toolbar */}
      {!readOnly && (
      <div className="canvas-toolbar">
        <div className="circuit-name-group">
          <div className="circuit-icon">{'< >'}</div>
          <input 
            className="circuit-name-input" 
            value={circuit.name} 
            readOnly 
          />
        </div>
        
        <button className="tb-btn" onClick={() => setShowManage(true)}>Manage</button>
        <div className="toolbar-divider" />
        
        <button 
          className="tb-btn" 
          onClick={() => useCircuitStore.getState().measureAll()}
          title="Measure all qubits (adds measure gates to all lines)"
          style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#93c5fd' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 17a8.5 8.5 0 0 1 17 0" />
            <line x1="12" y1="17" x2="16.5" y2="8.5" />
            <circle cx="12" cy="17" r="1.5" fill="currentColor" />
            <text x="17" y="10" fontSize="8" strokeWidth="0.4" fill="currentColor" fontWeight="bold" fontFamily="monospace">z</text>
          </svg>
          <span>Measure All</span>
        </button>
        <div className="toolbar-divider" />
        
        <button className="tb-btn" onClick={() => useCircuitStore.getState().undo()}>↶ Undo</button>
        <button className="tb-btn" onClick={() => useCircuitStore.getState().redo()}>↷ Redo</button>
        <div className="toolbar-divider" />
        
        <button className="tb-btn" onClick={() => useCircuitStore.getState().clearCircuit()}>Clear</button>
        
        <div className="toolbar-divider" />
        <div 
          className={`debug-toggle ${debugMode ? 'active' : ''}`} 
          onClick={() => setDebugMode(!debugMode)}
        >
          <span className="dot" />
          Debug
        </div>

        <button className="fullscreen-btn" title="Fullscreen">{'[  ]'}</button>
      </div>
      )}

      {/* Circuit Grid */}
      <div className={`circuit-canvas ${isDragging ? 'is-dragging' : ''}`} ref={canvasRef}>
        
        {customEditMode && (
          <div className="custom-edit-overlay">
            <div className="custom-edit-warning">
              ⚠️ Circuit generates only with QASM code. It is not available for editable scripts.
            </div>
          </div>
        )}

        {/* Debug Grid Overlay */}
        {debugMode && (
          <div className="debug-grid-overlay">
            {Array.from({ length: maxSlices }).map((_, i) => (
              <div key={i} className="grid-line-col"></div>
            ))}
          </div>
        )}

        {/* Debug Scrubber Thumb */}
        {debugMode && (
          <div className="scrubber-thumb">
            <div className="scrubber-line"></div>
          </div>
        )}

        {/* Cryostat Animation (Loading) */}
        {isRunning && (
          <div className="cryostat-overlay">
            {/* SVG approximation of the cryostat chandelier */}
            <svg className="cryostat-img" viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Simplified blue cryostat illustration */}
              <circle cx="100" cy="80" r="50" fill="#2563eb" fillOpacity="0.8"/>
              <path d="M50 80 L150 80 L140 180 L60 180 Z" fill="#3b82f6" fillOpacity="0.6"/>
              <circle cx="100" cy="180" r="40" fill="#60a5fa" fillOpacity="0.5"/>
              <path d="M60 180 L140 180 L120 280 L80 280 Z" fill="#93c5fd" fillOpacity="0.4"/>
              <circle cx="100" cy="280" r="20" fill="#bfdbfe" fillOpacity="0.5"/>
              {/* Some gear icons at bottom */}
              <circle cx="80" cy="330" r="15" stroke="#60a5fa" strokeWidth="4" strokeDasharray="4 4" fill="transparent"/>
              <circle cx="120" cy="310" r="15" stroke="#3b82f6" strokeWidth="4" strokeDasharray="4 4" fill="transparent"/>
            </svg>
          </div>
        )}

        <div className="grid-container">
          {/* Qubit Wires */}
          {circuit.qubitLabels.map((label, qIdx) => (
            <div key={`wire-q-${qIdx}`} className="wire-row">
              <div className="wire-label">
                {label}
              </div>
              
              <div className="wire-line-container">
                <div className="wire-line"></div>
                
                {/* Render gates for this qubit */}
                {Array.from({ length: maxSlices }).map((_, timeSlice) => {
                  const op = grid[qIdx] && grid[qIdx][timeSlice];
                  
                  return (
                    <div 
                      key={`cell-${qIdx}-${timeSlice}`} 
                      className="grid-cell"
                      style={{ zIndex: op && op.id === selectedGateId ? 50 : 2 }}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, qIdx, timeSlice)}
                    >
                      {op && op.qubits[op.qubits.length - 1] === qIdx && (
                        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div 
                            className="placed-gate" 
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation();
                              e.dataTransfer.setData('type', 'existing_gate');
                              e.dataTransfer.setData('gateId', op.id);
                              useCircuitStore.getState().setDragging(true);
                            }}
                            onDragEnd={(e) => {
                              e.stopPropagation();
                              useCircuitStore.getState().setDragging(false);
                            }}
                            onClick={(e) => { e.stopPropagation(); useCircuitStore.getState().selectGate(op.id); }}
                            style={{ background: getGateUIParams(op.gate).color, position: 'relative' }}
                          >
                            {getGateUIParams(op.gate).symbol}
                            
                            {/* Dashed line to classical register for MEASURE */}
                            {op.gate === 'MEASURE' && (
                              <div style={{
                                position: 'absolute',
                                left: '50%',
                                top: '36px', /* Starts right below the gate (which is 36px tall) */
                                width: '2px',
                                borderLeft: '2px dashed #9ca3af',
                                height: `${(circuit.numQubits - qIdx + (op.clbits && op.clbits.length > 0 ? op.clbits[0] : qIdx)) * 44 - 18}px`,
                                zIndex: -1,
                                marginLeft: '-1px'
                              }}>
                                {/* Arrowhead pointing down */}
                                <div style={{
                                  position: 'absolute',
                                  bottom: '-4px',
                                  left: '-3px',
                                  width: 0,
                                  height: 0,
                                  borderLeft: '4px solid transparent',
                                  borderRight: '4px solid transparent',
                                  borderTop: '6px solid #9ca3af'
                                }}></div>
                              </div>
                            )}
                          </div>
                          {op.id === selectedGateId && (
                            <>
                              <div style={{
                                position: 'absolute',
                                top: '-4px', left: '6px', right: '6px', bottom: op.gate === 'MEASURE' ? '-40px' : '-4px',
                                border: '1px solid #3b82f6',
                                pointerEvents: 'none',
                                zIndex: 10
                              }}></div>
                              <div className="gate-context-menu">
                                {/* Edit */}
                                <button
                                  className="gate-ctx-btn"
                                  title="Edit Gate"
                                  onClick={(e) => { e.stopPropagation(); console.log("Setting edit modal for", op); setEditModal(op); }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                                  </svg>
                                </button>
                                <div className="gate-ctx-divider" />
                                {/* Copy */}
                                <button
                                  className="gate-ctx-btn"
                                  title="Copy Gate (Ctrl+C)"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    useCircuitStore.getState().copyGate(op.id);
                                    setCopyToast(true);
                                    setTimeout(() => setCopyToast(false), 1200);
                                  }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                  </svg>
                                </button>
                                <div className="gate-ctx-divider" />
                                {/* Delete */}
                                <button
                                  className="gate-ctx-btn"
                                  title="Delete Gate"
                                  onClick={(e) => { e.stopPropagation(); useCircuitStore.getState().removeGate(op.id); }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    <line x1="10" y1="11" x2="10" y2="17"/>
                                    <line x1="14" y1="11" x2="14" y2="17"/>
                                  </svg>
                                </button>
                                <div className="gate-ctx-divider" />
                                {/* Expand Gate */}
                                <button
                                  className="gate-ctx-btn"
                                  title="Expand Gate (Ctrl+D)"
                                  onClick={(e) => { e.stopPropagation(); setExpandModal(op); }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                                    <text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor" stroke="none" fontWeight="bold">G</text>
                                  </svg>
                                </button>
                                <div className="gate-ctx-divider" />
                                {/* Information */}
                                <button
                                  className="gate-ctx-btn"
                                  title="Information (Ctrl+I)"
                                  onClick={(e) => { e.stopPropagation(); setInfoModal(op); }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="16" x2="12" y2="12"/>
                                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                                  </svg>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      {/* Render target indicator for multi-qubit gates (usually controls) */}
                      {op && op.qubits.length > 1 && op.qubits[op.qubits.length - 1] !== qIdx && op.qubits.includes(qIdx) && (
                        <div className="gate-target-node"></div>
                      )}
                      {/* Render vertical line connecting multi-qubit gates */}
                      {op && op.qubits.length > 1 && qIdx === Math.max(...op.qubits) && (
                        <div style={{
                          position: 'absolute',
                          bottom: '50%',
                          left: '50%',
                          width: '1px',
                          background: 'rgba(255,255,255,0.4)',
                          transform: 'translateX(-50%)',
                          zIndex: 5,
                          height: `${(Math.max(...op.qubits) - Math.min(...op.qubits)) * 44}px`
                        }}></div>
                      )}
                    </div>
                  );
                })}
                
                {/* Phase Disk at the end of the wire */}
                {(() => {
                  const bloch = liveResult?.blochCoordinates?.[qIdx];
                  const z = bloch?.z ?? 1; // default to |0> (+1)
                  const x = bloch?.x ?? 0;
                  const y = bloch?.y ?? 0;
                  
                  const prob1 = (1 - z) / 2;
                  const phaseRad = Math.atan2(y, x);
                  const phaseDeg = phaseRad * (180 / Math.PI);
                  
                  return (
                    <div 
                      className="phase-disk" 
                      title={`Probability of |1⟩: ${(prob1 * 100).toFixed(1)}%\nPhase: ${phaseDeg.toFixed(1)}°`}
                    >
                      <div className="phase-disk-fill" style={{ height: `${prob1 * 100}%` }}></div>
                      {prob1 > 0.01 && (
                        <div className="phase-disk-line" style={{ transform: `rotate(${-phaseDeg}deg)` }}></div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}

          {/* Classical Wires */}
          <div className="classical-divider"></div>
          {circuit.clbitLabels.map((label, cIdx) => (
            <div key={`wire-c-${cIdx}`} className="wire-row classical">
              <div className="wire-label">
                {label}
              </div>
              <div className="wire-line-container">
                <div className="wire-line double"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showManage && <ManageRegistersModal onClose={() => setShowManage(false)} />}
      {editModal && <EditGateModal operation={editModal} onClose={() => setEditModal(null)} />}
      {infoModal && <GateInfoModal operation={infoModal} onClose={() => setInfoModal(null)} />}
      {expandModal && <GateExpandModal operation={expandModal} onClose={() => setExpandModal(null)} />}
      
      {/* Copy Toast */}
      {copyToast && (
        <div className="copy-toast">Copied!</div>
      )}
    </>
  );
}
