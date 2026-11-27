import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useJobStore } from '../stores/jobStore';
import { useBackendStore } from '../stores/backendStore';
import { useCircuitStore } from '../stores/circuitStore';
import { 
  circuitToHardwareAssembly, 
  circuitToQiskitTranspiled, 
  circuitToOpenPulseSchedule 
} from '../quantum-engine/transpiled-engine';
import ProbabilityChart from '../components/composer/ProbabilityChart';
import CircuitCanvas from '../components/composer/CircuitCanvas';
import AIChatPanel from '../components/shared/AIChatPanel';
import UnifiedNavbar from '../components/shared/UnifiedNavbar';
import useAIChatStore from '../stores/aiChatStore';
import '../styles/composer.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ResultsPage({ session }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get('job');

  const { jobs, activeJobId } = useJobStore();
  const backendStore = useBackendStore();
  const circuit = useCircuitStore(state => state.circuit);

  // Find the active job (from URL param or latest active job)
  const job = jobIdParam
    ? jobs.find(j => j.id === jobIdParam)
    : jobs.find(j => j.id === activeJobId) || jobs[jobs.length - 1];

  // If it's a VQPU job, the result is nested under qldpc_virtual_chip or eda_custom_topology.
  // Otherwise, it might be under the specific backend name, or we just grab the first available result.
  let result = null;
  if (job?.results) {
    if (job.results.qldpc_virtual_chip) {
      result = job.results.qldpc_virtual_chip.result;
    } else if (job.results.eda_custom_topology) {
      result = job.results.eda_custom_topology.result;
    } else {
      const firstBackend = Object.keys(job.results)[0];
      if (firstBackend) result = job.results[firstBackend].result;
    }
  }
  const metadata = result?.metadata || {};
  const encoding = metadata.encoding || {};
  const chipInfo = metadata.chip || {};
  const counts = result?.counts || {};
  const probabilities = result?.probabilities || {};

  const [activeTab, setActiveTab] = useState(job?.status === 'failed' ? 'error' : 'output');
  const [chartType, setChartType] = useState('histogram');
  const [activeCodeTab, setActiveCodeTab] = useState('qasm');
  const [transpiledFormat, setTranspiledFormat] = useState('assembly'); // 'assembly' | 'qiskit' | 'pulse'

  useEffect(() => {
    if (job?.status === 'failed') {
      setActiveTab('error');
    }
  }, [job?.status]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Status timeline steps
  const getStatusSteps = () => {
    if (!job) return [];
    const steps = [
      { label: 'Created', time: job.timestamp ? new Date(job.timestamp).toLocaleString() : '', done: true },
      { label: 'In queue', time: '', done: ['queued', 'running', 'completed', 'submitting'].includes(job.status) },
      { label: 'Running', time: metadata.executionTime ? `usage: ${(metadata.executionTime / 1000).toFixed(6)}` : '', done: ['running', 'completed'].includes(job.status) },
      { label: 'Completed', time: '', done: job.status === 'completed' },
    ];
    if (job.status === 'failed') {
      steps.push({ label: 'Failed', time: '', done: true, error: true });
    }
    return steps;
  };

  const statusSteps = getStatusSteps();

  // Build the output JSON
  const outputJson = job?.status === 'completed' ? JSON.stringify({
    probability: counts,
    shots: metadata.shots || backendStore.shots,
    encoding: encoding,
    chip: chipInfo,
  }, null, 2) : null;

  // Build QASM from current circuit
  const qasmCode = circuit ? buildQASM(circuit) : '';

  return (
    <div style={{
      backgroundColor: '#0a0e17',
      height: '100vh',
      width: '100vw',
      maxWidth: '100%',
      color: '#e6edf3',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      {/* Top Header / Breadcrumb Bar */}
      <div style={{
        padding: '0.65rem 1.75rem',
        background: 'rgba(13, 17, 23, 0.98)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        zIndex: 10,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/composer')}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94a3b8',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          >
            <span>←</span>
            <span>Composer Studio</span>
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Execution Telemetry /</span>
            <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#f1f5f9' }}>
              {job?.circuitName || 'Quantum Execution'}
            </span>
            {job && (
              <span style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: '600',
                background: job.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: job.status === 'completed' ? '#34d399' : '#fbbf24',
                border: `1px solid ${job.status === 'completed' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              }}>
                {job.status?.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => {
              if (outputJson) {
                navigator.clipboard.writeText(outputJson);
                alert('Output JSON copied to clipboard!');
              }
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '0.76rem',
              cursor: 'pointer',
            }}
          >
            📋 Copy JSON
          </button>
          <button
            onClick={() => {
              navigate('/composer');
            }}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              border: 'none',
              color: '#ffffff',
              padding: '5px 12px',
              borderRadius: '4px',
              fontSize: '0.76rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
            }}
          >
            <span>⚡</span>
            <span>Run New Job</span>
          </button>
        </div>
      </div>

      {/* Main Content Area — Full Screen & Scrollable */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        width: '100%',
        boxSizing: 'border-box',
        padding: '1.25rem 2rem 2rem 2rem',
      }}>
        {!job ? (
          /* No Job State — show chip info and prompt */
          <NoJobView navigate={navigate} />
        ) : (
          /* Job Details View — Qniverse style */
          <>
            {/* Top Section: Job Info + Status Timeline */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
              {/* Left: Job Metadata */}
              <div style={{
                background: '#161b22', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', padding: '1.2rem 1.5rem',
              }}>
                <MetaRow label="Circuit ID" value={job.id.replace('vqpu-', '').replace('job-', '')} />
                <MetaRow label="Circuit Name" value={job.circuitName || 'Untitled'} />
                <MetaRow label="Resource" value={job.processor === 'VQPU' ? "Alpha-Paradox vQPU (Cloud GPU)" : `Local ${job.processor}`} />
                <MetaRow label="Backend" value={metadata.backend || (encoding.decoder ? `qldpc_bp_osd (${encoding.decoder})` : 'qldpc_virtual_chip')} />
                <MetaRow label="Status" value={job.status?.toUpperCase()} highlight={job.status === 'completed' ? '#10b981' : job.status === 'failed' ? '#ef4444' : '#eab308'} />
                <MetaRow label="Noise Used" value={metadata.noiseModel ? (metadata.noiseModel.decoder ? 'Yes (Hardware-Extracted)' : 'Yes') : 'No'} />
              </div>

              {/* Right: Status Timeline */}
              <div style={{
                background: '#161b22', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', padding: '1.2rem 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <StatusTimeline steps={statusSteps} />
              </div>
            </div>

            {/* Hardware Profile Bar (Differentiated per Processor Architecture) */}
            {metadata.backend === 'eda_custom_topology' || metadata.topology ? (
              <div style={{
                background: '#161b22', border: '1px solid rgba(6, 182, 212, 0.35)',
                borderRadius: '8px', padding: '0.8rem 1.5rem', marginBottom: '1.5rem',
                display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center',
              }}>
                <ChipBadge label="Physical Transmons" value={metadata.topology?.num_qubits || encoding.total_chip_physical || 0} highlight />
                <ChipBadge label="CPW Resonator Couplers" value={metadata.topology?.num_couplings || 0} />
                <ChipBadge label="Substrate" value={chipInfo?.cleanroom?.substrate ? 'High-Resistivity Si' : 'Silicon (εr=11.9)'} />
                <ChipBadge label="Josephson Junction" value={chipInfo?.cleanroom?.junction ? 'Al/AlOx/Al' : 'Dolan Bridge'} />
                <ChipBadge label="Routing Mode" value="CouplingMap HW SWAP" />
                <ChipBadge label="Decoherence" value="T₁=65μs · T₂*=85μs" />
                <ChipBadge label="Cleanroom Yield" value="85% (Class 100)" />
              </div>
            ) : encoding.code_type ? (
              <div style={{
                background: '#161b22', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', padding: '0.8rem 1.5rem', marginBottom: '1.5rem',
                display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center',
              }}>
                <ChipBadge label="Physical Qubits" value={encoding.total_chip_physical || 1625} />
                <ChipBadge label="Logical Qubits" value={encoding.total_chip_logical || 130} />
                <ChipBadge label="Code Distance" value={`d=${encoding.code_distance || 16}`} />
                <ChipBadge label="Code Type" value={encoding.code_type || 'QLDPC'} />
                <ChipBadge label="Decoder" value={encoding.decoder || 'BP-OSD'} />
                <ChipBadge label="QEC Rounds" value={encoding.qec_rounds || 5} />
                <ChipBadge label="Logical Error Rate" value={encoding.p_logical ? encoding.p_logical.toExponential(3) : '—'} highlight />
              </div>
            ) : null}

            {/* Bottom Section: Results */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Left: Histogram */}
              <div style={{
                background: '#161b22', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', overflow: 'hidden',
                display: 'flex', flexDirection: 'column'
              }}>
                <div style={{
                  padding: '0.7rem 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value)}
                    style={{
                      background: '#1c2128', border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '4px', color: '#e6edf3', padding: '0.3rem 0.5rem', fontSize: '0.8rem',
                    }}
                  >
                    <option value="histogram">Histogram</option>
                    <option value="probability">Probability Distribution</option>
                  </select>
                  <div style={{ flex: 1 }} />
                  <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1rem' }}>⋮</button>
                </div>
                <div style={{ padding: '1rem', flex: 1, minHeight: '300px' }}>
                  {job.status === 'completed' && Object.keys(probabilities).length > 0 ? (
                    <ProbabilityChart probabilities={probabilities} />
                  ) : job.status === 'completed' && Object.keys(counts).length > 0 ? (
                    <ProbabilityChart probabilities={countsToProbs(counts, metadata.shots || 1024)} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>
                      {job.status === 'failed' ? '❌ Simulation failed' :
                       job.status === 'completed' ? 'No measurement data' :
                       `⏳ ${job.progressMessage || 'Waiting for results...'}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Output / Error JSON */}
              <div style={{
                background: '#161b22', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', overflow: 'hidden',
              }}>
                <div style={{
                  padding: '0.7rem 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <TabButton active={activeTab === 'output'} onClick={() => setActiveTab('output')}>Output</TabButton>
                  <TabButton active={activeTab === 'error'} onClick={() => setActiveTab('error')} isError>Error</TabButton>
                  <div style={{ flex: 1 }} />
                  <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1rem' }}>⋮</button>
                </div>
                <div style={{ padding: '1rem', maxHeight: '350px', overflow: 'auto' }}>
                  {activeTab === 'output' ? (
                    outputJson ? (
                      <pre style={{
                        margin: 0, fontSize: '0.78rem', color: '#e6edf3', fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap', lineHeight: '1.5',
                      }}>
                        {outputJson}
                      </pre>
                    ) : job.status === 'failed' ? (
                      <div style={{ color: '#ef4444', fontSize: '0.8rem', lineHeight: '1.6' }}>
                        <div style={{ fontWeight: '700', marginBottom: '6px' }}>❌ Execution Failed</div>
                        <div style={{
                          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: '6px', padding: '0.8rem', fontFamily: 'monospace', fontSize: '0.75rem',
                          color: '#fca5a5', whiteSpace: 'pre-wrap'
                        }}>
                          {job.error || 'The quantum simulation encountered an unexpected runtime error.'}
                        </div>
                      </div>
                    ) : (
                      <pre style={{
                        margin: 0, fontSize: '0.78rem', color: '#e6edf3', fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap', lineHeight: '1.5',
                      }}>
                        {job.status === 'completed' ? '{ }' : 'Waiting for output...'}
                      </pre>
                    )
                  ) : (
                    <pre style={{ margin: 0, fontSize: '0.78rem', color: '#ef4444', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      {job.error || 'No errors'}
                    </pre>
                  )}
                </div>
              </div>
            </div>

            {/* QASM Section */}
            <div style={{
              background: '#161b22', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', overflow: 'hidden', marginTop: '1.5rem',
            }}>
              <div style={{
                padding: '0.7rem 1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <TabButton active={activeCodeTab === 'circuit'} onClick={() => setActiveCodeTab('circuit')}>Circuit</TabButton>
                <TabButton active={activeCodeTab === 'qasm'} onClick={() => setActiveCodeTab('qasm')}>QASM</TabButton>
                <TabButton active={activeCodeTab === 'transpiled'} onClick={() => setActiveCodeTab('transpiled')}>Transpiled Code</TabButton>
                
                {activeCodeTab === 'transpiled' && (
                  <div style={{ display: 'flex', gap: '6px', marginLeft: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginRight: '2px' }}>Target ISA:</span>
                    <button
                      onClick={() => setTranspiledFormat('assembly')}
                      style={{
                        background: transpiledFormat === 'assembly' ? '#2563eb' : '#21262d',
                        color: transpiledFormat === 'assembly' ? '#fff' : 'rgba(255,255,255,0.7)',
                        border: '1px solid ' + (transpiledFormat === 'assembly' ? '#3b82f6' : 'rgba(255,255,255,0.15)'),
                        borderRadius: '4px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer'
                      }}
                      title="Micro-instruction hardware assembly with nanosecond timestamps, physical transmon registers, and calibrated microwave pulses"
                    >
                      Hardware Assembly (eQASM)
                    </button>
                    <button
                      onClick={() => setTranspiledFormat('qiskit')}
                      style={{
                        background: transpiledFormat === 'qiskit' ? '#2563eb' : '#21262d',
                        color: transpiledFormat === 'qiskit' ? '#fff' : 'rgba(255,255,255,0.7)',
                        border: '1px solid ' + (transpiledFormat === 'qiskit' ? '#3b82f6' : 'rgba(255,255,255,0.15)'),
                        borderRadius: '4px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer'
                      }}
                      title="Executable Qiskit Python code with physical coupling map and layout"
                    >
                      Qiskit Python
                    </button>
                    <button
                      onClick={() => setTranspiledFormat('pulse')}
                      style={{
                        background: transpiledFormat === 'pulse' ? '#2563eb' : '#21262d',
                        color: transpiledFormat === 'pulse' ? '#fff' : 'rgba(255,255,255,0.7)',
                        border: '1px solid ' + (transpiledFormat === 'pulse' ? '#3b82f6' : 'rgba(255,255,255,0.15)'),
                        borderRadius: '4px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer'
                      }}
                      title="Microwave pulse waveform sequence (Qiskit Pulse API)"
                    >
                      OpenPulse Schedule
                    </button>
                  </div>
                )}
                <div style={{ flex: 1 }} />
                <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1rem' }}>⋮</button>
              </div>
              <div style={{ padding: activeCodeTab === 'circuit' ? 0 : '1rem', maxHeight: activeCodeTab === 'circuit' ? 'none' : '280px', overflow: 'auto' }}>
                {activeCodeTab === 'circuit' ? (
                  <div style={{ height: '300px' }}>
                    <CircuitCanvas readOnly={true} />
                  </div>
                ) : (
                  <pre style={{
                    margin: 0, fontSize: '0.78rem', color: '#e6edf3', fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap', lineHeight: '1.6',
                  }}>
                    {activeCodeTab === 'qasm' ? (qasmCode || '// No circuit loaded')
                     : (
                        transpiledFormat === 'assembly'
                          ? ((encoding.transpiled_assembly && !encoding.transpiled_assembly.includes('OPENQASM') && !encoding.transpiled_assembly.includes('include "qelib1.inc"'))
                              ? encoding.transpiled_assembly
                              : circuitToHardwareAssembly(circuit, metadata.topology || backendStore.noiseConfig?.customTopology, chipInfo))
                          : transpiledFormat === 'qiskit'
                            ? (encoding.transpiled_python || circuitToQiskitTranspiled(circuit, metadata.topology || backendStore.noiseConfig?.customTopology))
                            : (encoding.transpiled_pulse || circuitToOpenPulseSchedule(circuit))
                     )}
                  </pre>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Unified Down Bar */}
      <UnifiedNavbar session={session} />

      {/* AI Chat */}
      <AIChatPanel />
      <button className="chat-bubble-ai" onClick={() => useAIChatStore.getState().toggleChat()}>
        <img src="/logo-2.jpg" alt="Alpha AI" className="chat-bubble-logo" />
      </button>
    </div>
  );
}

/* ─── Sub Components ─────────────────────────────────────────────────────── */

function NoJobView({ navigate }) {
  return (
    <div style={{ textAlign: 'center', paddingTop: '6rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🧬</div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.5rem', color: '#e6edf3' }}>
        Alpha-Paradox Virtual QPU
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
        1,100-qubit Superconducting Transmon · QLDPC Error Correction · BP-OSD Decoding
      </p>
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap',
        margin: '2rem auto', maxWidth: '700px',
      }}>
        <MiniSpec label="Physical" value="1,100" />
        <MiniSpec label="Logical" value="88" />
        <MiniSpec label="Distance" value="d=16" />
        <MiniSpec label="QEC Cycle" value="324 ns" />
        <MiniSpec label="Decoder" value="BP-OSD" />
      </div>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', marginTop: '2rem' }}>
        Open the Composer, select <strong>VQPU</strong> as processor, configure noise, and click <strong>Run</strong>.
      </p>
      <button
        onClick={() => navigate('/composer')}
        style={{
          marginTop: '1rem', background: '#2563eb', color: 'white', border: 'none',
          padding: '0.6rem 1.5rem', borderRadius: '6px', cursor: 'pointer',
          fontSize: '0.9rem', fontWeight: '600',
        }}
      >
        Open Composer →
      </button>
    </div>
  );
}

function MiniSpec({ label, value }) {
  return (
    <div style={{
      background: '#161b22', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '6px', padding: '0.8rem 1.2rem', minWidth: '100px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#e6edf3' }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>{label}</div>
    </div>
  );
}

function MetaRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{label}:</span>
      <span style={{ fontSize: '0.82rem', color: highlight || '#e6edf3', fontWeight: '500', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

function ChipBadge({ label, value, highlight }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>{label}</div>
      <div style={{ fontSize: '0.82rem', fontWeight: '600', color: highlight ? '#10b981' : '#e6edf3' }}>{value}</div>
    </div>
  );
}

function StatusTimeline({ steps }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          {/* Timeline line + circle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '20px' }}>
            <div style={{
              width: '16px', height: '16px', borderRadius: '50%',
              background: step.error ? '#ef4444' : step.done ? '#10b981' : '#30363d',
              border: `2px solid ${step.error ? '#ef4444' : step.done ? '#10b981' : '#484f58'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6rem', color: 'white',
            }}>
              {step.done && !step.error && '✓'}
              {step.error && '✕'}
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: '2px', height: '24px',
                background: steps[i + 1]?.done ? '#10b981' : '#30363d',
              }} />
            )}
          </div>
          {/* Label + time */}
          <div style={{ paddingBottom: i < steps.length - 1 ? '0.5rem' : 0 }}>
            <div style={{ fontSize: '0.82rem', color: step.done ? '#e6edf3' : 'rgba(255,255,255,0.4)', fontWeight: step.done ? '600' : '400' }}>
              {step.label}
            </div>
            {step.time && (
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)' }}>{step.time}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TabButton({ active, onClick, children, isError }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? (isError ? '#ef4444' : '#2563eb') : 'transparent',
        color: active ? 'white' : 'rgba(255,255,255,0.6)',
        border: active ? 'none' : '1px solid rgba(255,255,255,0.15)',
        padding: '0.25rem 0.7rem', borderRadius: '4px', cursor: 'pointer',
        fontSize: '0.78rem', fontWeight: '600',
      }}
    >
      {children}
    </button>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function countsToProbs(counts, totalShots) {
  const probs = {};
  const total = Object.values(counts).reduce((sum, c) => sum + c, 0) || totalShots;
  for (const [key, val] of Object.entries(counts)) {
    probs[key] = val / total;
  }
  return probs;
}

function buildQASM(circuit) {
  if (!circuit || !circuit.operations || circuit.operations.length === 0) return '';
  const lines = [
    'OPENQASM 2.0;',
    'include "qelib1.inc";',
    `qreg q[${circuit.numQubits}];`,
    `creg c[${circuit.numClbits || 1}];`,
  ];
  for (const op of circuit.operations) {
    const gate = op.gate?.toLowerCase();
    if (!gate) continue;
    if (gate === 'measure') {
      const q = op.qubits?.[0] ?? 0;
      const c = op.clbits?.[0] ?? q;
      lines.push(`measure q[${q}] -> c[${c}];`);
    } else if (gate === 'barrier') {
      const qs = op.qubits?.map(q => `q[${q}]`).join(', ') || '';
      lines.push(`barrier ${qs};`);
    } else if (gate === 'cx' || gate === 'cnot') {
      lines.push(`cx q[${op.qubits[0]}], q[${op.qubits[1]}];`);
    } else if (gate === 'cz') {
      lines.push(`cz q[${op.qubits[0]}], q[${op.qubits[1]}];`);
    } else if (gate === 'swap') {
      lines.push(`swap q[${op.qubits[0]}], q[${op.qubits[1]}];`);
    } else if (gate === 'ccx') {
      lines.push(`ccx q[${op.qubits[0]}], q[${op.qubits[1]}], q[${op.qubits[2]}];`);
    } else if (op.params && op.params.length > 0) {
      lines.push(`${gate}(${op.params.join(',')}) q[${op.qubits[0]}];`);
    } else {
      lines.push(`${gate} q[${op.qubits[0]}];`);
    }
  }
  return lines.join('\n');
}

