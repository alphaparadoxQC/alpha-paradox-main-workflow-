import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ComposerNavbar from '../components/composer/ComposerNavbar';
import GatePalette from '../components/composer/GatePalette';
import CircuitCanvas from '../components/composer/CircuitCanvas';
import QASMPanel from '../components/composer/QASMPanel';
import JobsPanel from '../components/composer/JobsPanel';
import GateVisualizer from '../components/composer/GateVisualizer';
import QSphere from '../components/composer/QSphere';
import ProbabilityChart from '../components/composer/ProbabilityChart';
import StateVectorChart from '../components/composer/StateVectorChart';
import MultiChipResults from '../components/composer/MultiChipResults';
import ConfigureBackendModal from '../components/composer/ConfigureBackendModal';
import { useCircuitStore } from '../stores/circuitStore';
import { useJobStore } from '../stores/jobStore';
import { useBackendStore } from '../stores/backendStore';
import useAnalogStore from '../stores/analogStore';
import useNotebookStore from '../stores/notebookStore';
import { provider } from '../quantum-engine/backend-provider';
import AlphaIR from '../quantum-engine/alpha-ir';
import AlgorithmsModal from '../components/composer/AlgorithmsModal';
import AIChatPanel from '../components/shared/AIChatPanel';
import PulsePanel from '../components/composer/PulsePanel';
import PhysicalHamiltonianView from '../components/composer/PhysicalHamiltonianView';
import UnifiedNavbar from '../components/shared/UnifiedNavbar';
import useAIChatStore from '../stores/aiChatStore';
import { useEdaStore } from '../stores/edaStore';
import CrossProductBridge from '../quantum-engine/cross-product-bridge';
import '../styles/composer.css';

import CustomDropdown from '../components/composer/CustomDropdown';

export default function ComposerPage({ session }) {
  const navigate = useNavigate();
  const [showConfig, setShowConfig] = useState(false);
  const [resultMode, setResultMode] = useState('probability');
  const [inspectorMode, setInspectorMode] = useState('H');
  const [isLSB, setIsLSB] = useState(false);
  const [showProbability, setShowProbability] = useState(true);
  const [showGateMatrix, setShowGateMatrix] = useState(true);
  const [showLatestJobs, setShowLatestJobs] = useState(true);
  const [showPulsePanel, setShowPulsePanel] = useState(false);
  const [jobsPanelMode, setJobsPanelMode] = useState('jobs');
  const [activeModal, setActiveModal] = useState(null);
  const [showAlgorithms, setShowAlgorithms] = useState(false);

  const selectedGateId = useCircuitStore(state => state.selectedGateId);
  const circuit = useCircuitStore(state => state.circuit);
  const clearCircuit = useCircuitStore(state => state.clearCircuit);
  const selectedProcessor = useBackendStore(state => state.selectedProcessor);
  
  const { jobs, activeJobId, runActiveCircuit } = useJobStore();
  const activeJob = jobs.find(j => j.id === activeJobId);

  // Run handler: verify measurement exists before opening configure modal
  const handleRun = () => {
    if (circuit.operations.length === 0) {
      setActiveModal('Cannot run an empty circuit. Add some gates first.');
      return;
    }
    const hasMeasurements = circuit.operations.some(op => op.gate === 'MEASURE');
    if (!hasMeasurements) {
      setActiveModal('no-measurement');
      return;
    }
    setActiveModal('configure');
  };

  const [liveResult, setLiveResult] = useState(null);

  // Sync inspector dropdown with selected gate if available
  useEffect(() => {
    const op = circuit.operations.find(op => op.id === selectedGateId);
    if (op) setInspectorMode(op.gate);
  }, [selectedGateId, circuit.operations]);

  // Run live simulation on every circuit change for the charts
  useEffect(() => {
    if (circuit.operations.length === 0) {
      setLiveResult(null);
      return;
    }
    try {
      const backendName = circuit.numQubits > 15 ? 'aer_tensor_network' : 'aer_statevector';
      const backend = provider.getBackend(backendName);
      const result = backend.run(circuit, { shots: 1024 });
      setLiveResult(result);
    } catch (err) {
      console.error('Live simulation failed:', err);
    }
  }, [circuit, circuit.operations.length]);

  const activeProbabilities = liveResult?.probabilities || null;
  const activeStatevector = liveResult?.statevector || null;

  const globalSphereData = useMemo(() => {
    if (!activeStatevector) return {};
    const n = circuit.numQubits;
    const data = {};
    activeStatevector.forEach((c, idx) => {
      const bs = idx.toString(2).padStart(n, '0');
      const mag = Math.sqrt(c.re * c.re + c.im * c.im);
      if (mag > 1e-5) {
        let phaseRad = Math.atan2(c.im, c.re);
        let phaseDeg = (phaseRad * 180) / Math.PI;
        if (phaseDeg < 0) phaseDeg += 360;
        data[bs] = { amp: mag, phaseDeg: phaseDeg };
      }
    });
    return data;
  }, [activeStatevector, circuit.numQubits]);

  const resultOptions = [
    { label: 'Probability Distribution', value: 'probability' },
    { label: 'State Vector', value: 'statevector' }
  ];

  const gateOptions = [
    { label: 'Hadamard gate', value: 'H' },
    { label: 'Identity gate', value: 'I' },
    { label: 'Pauli-X gate', value: 'X' },
    { label: 'Pauli-Y gate', value: 'Y' },
    { label: 'Pauli-Z gate', value: 'Z' },
    { label: 'Phase(S) gate', value: 'S' },
    { label: 'Phase(T) gate', value: 'T' }
  ];

  // If a gate is selected that's not in the small list, add it dynamically
  if (!gateOptions.find(o => o.value === inspectorMode)) {
    gateOptions.push({ label: `${inspectorMode} gate`, value: inspectorMode });
  }

  const username = session?.user?.email?.split('@')[0] || 'fj brhgbi';

  return (
    <div className="composer-page">
      <ComposerNavbar 
        user={session?.user} 
        onRun={handleRun} 
        onConfigure={() => setShowConfig(true)} 
        panels={{ showProbability, showGateMatrix, showLatestJobs, showPulsePanel, jobsPanelMode }}
        onTogglePanel={(panel) => {
          if (panel === 'probability') setShowProbability(p => !p);
          if (panel === 'gateMatrix') setShowGateMatrix(p => !p);
          if (panel === 'latestJobs') setShowLatestJobs(p => !p);
          if (panel === 'pulsePanel') setShowPulsePanel(p => !p);
          if (panel === 'hamiltonian') {
            setShowLatestJobs(true);
            setJobsPanelMode(prev => prev === 'hamiltonian' ? 'jobs' : 'hamiltonian');
          }
        }}
        onFileAction={(action) => {
          if (action === 'new') clearCircuit();
          else if (action === 'open-algorithms') setShowAlgorithms(true);
          else if (action === 'save-project') {
            const irData = AlphaIR.serialize(
              useCircuitStore.getState(),
              useAnalogStore.getState(),
              useNotebookStore.getState(),
              useBackendStore.getState(),
              {},
              useEdaStore.getState()
            );
            AlphaIR.downloadProject(irData, irData.metadata.name || 'alpha-project');
          }
          else if (action === 'open-project') {
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
              })
              .catch((err) => {
                console.error('[AlphaIR] Failed to load project:', err);
                setActiveModal(`Error loading project: ${err.message}`);
              });
          }
          else if (action === 'open-in-notebook') {
            CrossProductBridge.bridgeComposerToNotebook(navigate);
          }
          else if (action === 'import-eda-topology') {
            const topo = CrossProductBridge.bridgeEdaTopologyToComposer();
            setActiveModal(`🔗 Imported EDA Topology: ${topo.numQubits} physical qubits and ${topo.numCouplings} couplers imported from Silicon layout into the execution engine.`);
          }
          else if (action === 'run-lvs') {
            const result = CrossProductBridge.runLVS();
            setActiveModal(result.summary);
          }
          else setActiveModal(`File: ${action} is not yet implemented.`);
        }}
        onHelpAction={(action) => {
          setActiveModal(`Help: ${action}`);
        }}
      />
      
      
      <div className="palette-section">
        <GatePalette />
      </div>

      <div className="composer-layout">
        <div className="middle-section">
          <div className="canvas-panel">
            <CircuitCanvas liveResult={liveResult} />
          </div>
          <div className="qasm-panel">
            <QASMPanel />
          </div>
        </div>

        <div className="bottom-dashboard">
          {showProbability && (
            <div className="dashboard-panel results-panel">
              <div className="dash-panel-header">
                <CustomDropdown 
                  options={resultOptions} 
                  value={resultMode} 
                  onChange={setResultMode} 
                />
                <div style={{ flex: 1 }} />
                <button 
                  className="panel-icon-btn" 
                  title="Toggle bit ordering convention"
                  onClick={() => setIsLSB(!isLSB)}
                  style={{
                    fontSize: '0.75rem', 
                    fontWeight: 'bold', 
                    padding: '0 8px', 
                    width: 'auto',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    background: isLSB ? '#2563eb' : 'transparent',
                    color: isLSB ? 'white' : 'rgba(255,255,255,0.7)',
                    marginRight: '8px'
                  }}
                >
                  {isLSB ? 'LSB' : 'MSB'}
                </button>
                <button className="panel-icon-btn" title="Info">ⓘ</button>
                <button className="panel-icon-btn" title="More">⋮</button>
              </div>
              <div className="dash-panel-body">
                {resultMode === 'probability' ? (
                  <ProbabilityChart probabilities={activeProbabilities} isLSB={isLSB} />
                ) : (
                  <StateVectorChart statevector={activeStatevector} isLSB={isLSB} />
                )}
              </div>
            </div>
          )}

          {showGateMatrix && (
            <div className="dashboard-panel viz-panel">
              <div className="dash-panel-header">
                <CustomDropdown 
                  options={gateOptions} 
                  value={inspectorMode} 
                  onChange={setInspectorMode} 
                />
                <div style={{ flex: 1 }} />
                <button className="panel-icon-btn" title="Info">ⓘ</button>
                <button className="panel-icon-btn" title="More">⋮</button>
              </div>
              <div className="dash-panel-body">
                <GateVisualizer gateName={inspectorMode} />
              </div>
            </div>
          )}

          {showLatestJobs && (
            <div className="dashboard-panel jobs-panel-container">
              <div className="dash-panel-header">
                <CustomDropdown 
                  options={[
                    { label: 'Latest Jobs', value: 'jobs' },
                    { label: 'Physical Hamiltonian', value: 'hamiltonian' },
                    { label: 'Q-Sphere', value: 'qsphere' },
                    { label: 'Microwave Pulse Drive', value: 'pulses' }
                  ]}
                  value={jobsPanelMode}
                  onChange={setJobsPanelMode}
                />
                <div style={{ flex: 1 }} />
                <button 
                  className="panel-icon-btn" 
                  title={jobsPanelMode === 'hamiltonian' ? 'Switch to Latest Jobs' : 'Switch to Physical Hamiltonian'}
                  onClick={() => setJobsPanelMode(prev => prev === 'hamiltonian' ? 'jobs' : 'hamiltonian')}
                  style={{
                    color: jobsPanelMode === 'hamiltonian' ? '#38bdf8' : undefined,
                    fontWeight: jobsPanelMode === 'hamiltonian' ? 'bold' : undefined,
                    fontSize: '11px',
                    marginRight: '4px'
                  }}
                >
                  Ĥ
                </button>
                <button className="panel-icon-btn" title="More">⋮</button>
              </div>
              <div 
                className="dash-panel-body" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  width: '100%',
                  height: '100%',
                  alignItems: jobsPanelMode === 'qsphere' ? 'center' : 'stretch', 
                  justifyContent: jobsPanelMode === 'qsphere' ? 'center' : 'flex-start',
                  overflow: 'hidden'
                }}
              >
                {jobsPanelMode === 'jobs' && <JobsPanel />}
                {jobsPanelMode === 'hamiltonian' && <PhysicalHamiltonianView />}
                {jobsPanelMode === 'qsphere' && (
                  <QSphere 
                    data={globalSphereData} 
                    numQubits={circuit.numQubits} 
                    isLSB={isLSB} 
                    radius={75}
                  />
                )}
                {jobsPanelMode === 'pulses' && <PulsePanel />}
              </div>
            </div>
          )}

          {showPulsePanel && (
            <div className="dashboard-panel pulse-panel-container">
              <PulsePanel />
            </div>
          )}
        </div>
      </div>

      {/* Unified Down Bar */}
      <UnifiedNavbar session={session} />

      {activeModal === 'configure' && (
        <ConfigureBackendModal 
          onClose={() => setActiveModal(null)}
          onSubmit={async () => {
            setActiveModal(null);
            await runActiveCircuit();
            navigate('/results');
          }}
        />
      )}

      {activeModal === 'no-measurement' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#161b22', padding: '1.75rem', borderRadius: '10px', maxWidth: '440px', width: '90%', border: '1px solid rgba(239, 68, 68, 0.4)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '6px 10px', color: '#f87171', fontSize: '1.2rem' }}>
                ⚠️
              </div>
              <div>
                <h3 style={{ color: '#fff', margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Measurement Required</h3>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Execution blocked</span>
              </div>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.86rem', lineHeight: '1.5', margin: '0 0 1.25rem 0' }}>
              Execution cannot proceed because there are no <strong>Measurement</strong> gates on any qubit. Quantum circuits must measure qubits to collapse the wavefunction into classical bits.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setActiveModal(null)} 
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Close
              </button>
              <button 
                onClick={() => {
                  useCircuitStore.getState().measureAll();
                  setActiveModal(null);
                }} 
                style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                + Measure All & Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      {activeModal && activeModal !== 'configure' && activeModal !== 'no-measurement' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#1c2128', padding: '2rem', borderRadius: '8px', minWidth: '300px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ color: 'white', marginTop: 0, marginBottom: '1rem' }}>Information</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{activeModal}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setActiveModal(null)} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Algorithms Modal */}
      {showAlgorithms && (
        <AlgorithmsModal onClose={() => setShowAlgorithms(false)} />
      )}

      {/* AI Chat */}
      <AIChatPanel />
      <button className="chat-bubble-ai" onClick={() => useAIChatStore.getState().toggleChat()}>
        <img src="/logo-2.jpg" alt="Alpha AI" className="chat-bubble-logo" />
      </button>
    </div>
  );
}
