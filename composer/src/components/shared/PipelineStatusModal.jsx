import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CrossProductBridge from '../../quantum-engine/cross-product-bridge';
import AlphaIR from '../../quantum-engine/alpha-ir';
import { useCircuitStore } from '../../stores/circuitStore';
import { useEdaStore } from '../../stores/edaStore';
import useAnalogStore from '../../stores/analogStore';
import useNotebookStore from '../../stores/notebookStore';
import { useBackendStore } from '../../stores/backendStore';
import { pulseEngine } from '../../quantum-engine/pulse-engine';

export default function PipelineStatusModal({ onClose }) {
  const navigate = useNavigate();
  const [pipelineStatus, setPipelineStatus] = useState(CrossProductBridge.getPipelineStatus());
  const [lvsResult, setLvsResult] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Refresh status
  const refresh = () => {
    setPipelineStatus(CrossProductBridge.getPipelineStatus());
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleRunLVS = () => {
    const result = CrossProductBridge.runLVS();
    setLvsResult(result);
    setFeedbackMsg(result.summary);
  };

  const handleExportProject = () => {
    const irData = AlphaIR.serialize(
      useCircuitStore.getState(),
      useAnalogStore.getState(),
      useNotebookStore.getState(),
      useBackendStore.getState(),
      {},
      useEdaStore.getState()
    );
    AlphaIR.downloadProject(irData, 'alpha-interconnected-project');
    setFeedbackMsg('Project exported (.alpha v2.0 with Silicon EDA Layout)');
  };

  const handleEdaToAnalog = () => {
    const res = CrossProductBridge.bridgeEdaToAnalog(null);
    refresh();
    if (res) {
      setFeedbackMsg(`TCAD Extracted: Ec = ${res.Ec_MHz} MHz, Ej = ${res.Ej_MHz} MHz, ω₀₁ = ${res.omega01_GHz} GHz loaded into Analog Solver.`);
    } else {
      setFeedbackMsg('No transmon component found in EDA to extract.');
    }
  };

  const handleAnalogToPulse = () => {
    const edaComp = useEdaStore.getState().components?.find(c => c.type && c.type.includes('transmon'));
    if (!edaComp) {
      setFeedbackMsg('No transmon in EDA to calibrate from.');
      return;
    }
    const tcad = CrossProductBridge.extractTransmonTCAD(edaComp);
    CrossProductBridge.bridgeAnalogToPulse(tcad);
    refresh();
    setFeedbackMsg(`Pulse Engine Calibrated: ω₀₁ = ${tcad.omega01_GHz} GHz, α = ${tcad.anharmonicity_MHz} MHz, singleQubit = ${pulseEngine.gateTimes.singleQubit}ns.`);
  };

  const handleImportTopology = () => {
    const topo = CrossProductBridge.bridgeEdaTopologyToComposer();
    refresh();
    setFeedbackMsg(`EDA Topology Imported: ${topo.numQubits} qubits, ${topo.numCouplings} couplers routed to execution backend.`);
  };

  const handlePushToNotebook = () => {
    const res = CrossProductBridge.bridgeComposerToNotebook(null);
    refresh();
    setFeedbackMsg(`Pushed ${res.cellCount}th code cell to Notebook with Qiskit / AlphaIR runtime.`);
  };

  const handleEdaToNotebook = () => {
    const res = CrossProductBridge.bridgeEdaToNotebook(null);
    refresh();
    setFeedbackMsg(`Exported ${res.componentCount} EDA components to Notebook Python code cell.`);
  };

  const handleNotebookToEda = () => {
    const state = useNotebookStore.getState();
    const cells = state.cells || [];
    const metalCell = cells.find(c =>
      c.type === 'code' && (
        c.content.includes('alpha_metal') ||
        c.content.includes('Transmon') ||
        c.content.includes('DesignPlanar') ||
        c.content.includes('RouteMeander')
      )
    ) || cells.find(c => c.type === 'code' && c.content);

    if (!metalCell) {
      setFeedbackMsg('No Python chip code found in Notebook.');
      return;
    }

    const res = CrossProductBridge.bridgeNotebookToEda(metalCell.content, null);
    refresh();
    setFeedbackMsg(`Synthesized ${res.count} component(s) from Notebook code into Silicon EDA canvas.`);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="pipeline-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0d1117',
          border: '1px solid #30363d',
          borderRadius: '12px',
          width: '780px',
          maxWidth: '92vw',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(59, 130, 246, 0.15)',
          overflow: 'hidden',
          fontFamily: "'Inter', sans-serif",
          color: '#e6edf3',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #30363d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(13, 17, 23, 0.95)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f0f6fc' }}>
                Alpha Paradox Unified Cross-Product Ecosystem
              </div>
              <div style={{ fontSize: '0.75rem', color: '#8b949e' }}>
                Seamless bidirectional data bridges across Notebook, Composer, Analog, EDA, and vQPU
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8b949e',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Feedback Message Bar */}
        {feedbackMsg && (
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '0.5rem 1.5rem',
              fontSize: '0.78rem',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{feedbackMsg}</span>
            <button
              onClick={() => setFeedbackMsg(null)}
              style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        )}

        {/* Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Ecosystem Product Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.75rem',
            }}
          >
            {/* 1. Notebook */}
            <div
              style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '8px',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: 600 }}>LAYER 1</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Notebook</div>
              <div style={{ fontSize: '0.7rem', color: '#8b949e' }}>
                {pipelineStatus.notebook.cellCount} cells
              </div>
              <div style={{ fontSize: '0.65rem', color: '#10b981', marginTop: 'auto' }}>
                ● {pipelineStatus.notebook.kernelStatus || 'idle'}
              </div>
            </div>

            {/* 2. Composer */}
            <div
              style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '8px',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.65rem', color: '#8b5cf6', fontWeight: 600 }}>LAYER 2</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Composer</div>
              <div style={{ fontSize: '0.7rem', color: '#8b949e' }}>
                {pipelineStatus.composer.gateCount} gates ({pipelineStatus.composer.numQubits}Q)
              </div>
              <div style={{ fontSize: '0.65rem', color: '#c084fc', marginTop: 'auto' }}>
                OpenQASM 2.0
              </div>
            </div>

            {/* 3. Analog Physics */}
            <div
              style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '8px',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 600 }}>LAYER 3</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Analog</div>
              <div style={{ fontSize: '0.7rem', color: '#8b949e' }}>
                {pipelineStatus.analog.nodeCount} nodes
              </div>
              <div style={{ fontSize: '0.65rem', color: pipelineStatus.analog.tcadBridged ? '#10b981' : '#f59e0b', marginTop: 'auto' }}>
                {pipelineStatus.analog.tcadBridged ? 'TCAD Synced' : 'TISE Solver'}
              </div>
            </div>

            {/* 4. Silicon EDA */}
            <div
              style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '8px',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.65rem', color: '#06b6d4', fontWeight: 600 }}>LAYER 4</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Silicon EDA</div>
              <div style={{ fontSize: '0.7rem', color: '#8b949e' }}>
                {pipelineStatus.eda.componentCount} parts
              </div>
              <div style={{ fontSize: '0.65rem', color: '#38bdf8', marginTop: 'auto' }}>
                GDSII / Metal
              </div>
            </div>

            {/* 5. Hardware vQPU */}
            <div
              style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '8px',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>LAYER 5</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>vQPU Exec</div>
              <div style={{ fontSize: '0.7rem', color: '#8b949e' }}>
                {pipelineStatus.vqpu.backend === 'eda_custom_topology' ? 'EDA Layout' : '1.1k QLDPC'}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#34d399', marginTop: 'auto' }}>
                BP-OSD Ready
              </div>
            </div>
          </div>

          {/* Bridges Section */}
          <div
            style={{
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: '8px',
              padding: '1rem',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: '#f0f6fc' }}>
              Active Cross-Product Bridges
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Bridge 1: EDA → Analog TCAD */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.8rem',
                  background: '#0d1117',
                  borderRadius: '6px',
                  border: '1px solid #21262d',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#38bdf8' }}>
                    1. Silicon EDA → Analog TCAD Extraction
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#8b949e' }}>
                    Extracts pad capacitance, charging energy (Ec), Josephson energy (Ej), and ω₀₁ from physical silicon dimensions.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={handleEdaToAnalog}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Extract & Load
                  </button>
                </div>
              </div>

              {/* Bridge 2: Analog → Pulse Synthesis */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.8rem',
                  background: '#0d1117',
                  borderRadius: '6px',
                  border: '1px solid #21262d',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#c084fc' }}>
                    2. Analog → Pulse Engine Microwave Calibration
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#8b949e' }}>
                    Pipes anharmonicity and qubit frequency directly into I/Q continuous microwave envelope generator.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={handleAnalogToPulse}
                    style={{
                      background: 'rgba(192, 132, 252, 0.15)',
                      border: '1px solid rgba(192, 132, 252, 0.3)',
                      color: '#c084fc',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Calibrate Pulses
                  </button>
                </div>
              </div>

              {/* Bridge 3: Composer → Notebook */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.8rem',
                  background: '#0d1117',
                  borderRadius: '6px',
                  border: '1px solid #21262d',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#60a5fa' }}>
                    3. Composer → Notebook Code Cell Injection
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#8b949e' }}>
                    Injects visual canvas gates as executable Python code with full Qiskit / AlphaIR runtime.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={handlePushToNotebook}
                    style={{
                      background: 'rgba(96, 165, 250, 0.15)',
                      border: '1px solid rgba(96, 165, 250, 0.3)',
                      color: '#60a5fa',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Push to Notebook
                  </button>
                </div>
              </div>

              {/* Bridge 4: EDA → Composer Topology & LVS */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.8rem',
                  background: '#0d1117',
                  borderRadius: '6px',
                  border: '1px solid #21262d',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#34d399' }}>
                    4. Silicon EDA → Topology Routing & LVS Verification
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#8b949e' }}>
                    Imports hardware coupler connectivity into the transpiler and verifies Layout-vs-Schematic consistency.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={handleImportTopology}
                    style={{
                      background: 'rgba(52, 211, 153, 0.15)',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      color: '#34d399',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Import Topology
                  </button>
                  <button
                    onClick={handleRunLVS}
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#fbbf24',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Run LVS
                  </button>
                </div>
              </div>

              {/* Bridge 5: Notebook ↔ Silicon EDA */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.8rem',
                  background: '#0d1117',
                  borderRadius: '6px',
                  border: '1px solid #21262d',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#06b6d4' }}>
                    5. Notebook → Silicon EDA (Code-to-Chip & Chip-to-Code)
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#8b949e' }}>
                    Auto-generates runnable Alpha Metal Python scripts from EDA layouts, and synthesizes Python chip design code back into visual layout components.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={handleEdaToNotebook}
                    style={{
                      background: 'rgba(6, 182, 212, 0.15)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      color: '#06b6d4',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    EDA → Notebook
                  </button>
                  <button
                    onClick={handleNotebookToEda}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Notebook → EDA
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* LVS Result Details (if executed) */}
          {lvsResult && (
            <div
              style={{
                background: lvsResult.passed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${lvsResult.passed ? '#10b981' : '#ef4444'}`,
                borderRadius: '8px',
                padding: '1rem',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', color: lvsResult.passed ? '#34d399' : '#f87171' }}>
                {lvsResult.summary}
              </div>
              {lvsResult.errors.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {lvsResult.errors.map((err, i) => (
                    <div key={i} style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
                      [Error] {err.message}
                    </div>
                  ))}
                </div>
              )}
              {lvsResult.warnings.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  {lvsResult.warnings.map((warn, i) => (
                    <div key={i} style={{ fontSize: '0.72rem', color: '#fde047' }}>
                      [Warning] {warn.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #30363d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(13, 17, 23, 0.95)',
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#8b949e' }}>
            AlphaIR Schema v2.0.0 · Multi-Product Unified Project
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleExportProject}
              style={{
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                border: 'none',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Export .alpha Project
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#21262d',
                border: '1px solid #30363d',
                color: '#c9d1d9',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
