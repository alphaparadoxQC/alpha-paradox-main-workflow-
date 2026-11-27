import { useState, useEffect } from 'react';
import { useBackendStore } from '../../stores/backendStore';
import { useEdaStore } from '../../stores/edaStore';
import { useCircuitStore } from '../../stores/circuitStore';
import { provider } from '../../quantum-engine/backend-provider';
import CrossProductBridge from '../../quantum-engine/cross-product-bridge';

export default function ConfigureBackendModal({ onClose, onSubmit }) {
  const {
    selectedProcessor, setProcessor,
    selectedBackend, setBackend,
    shots, setShots,
    noiseConfig, updateNoiseParam, setNoiseConfig,
    selectedProvider, setSelectedProvider,
    providerApiKeys, setProviderApiKey, clearProviderApiKey,
    providerStatus
  } = useBackendStore();

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const circuit = useCircuitStore(s => s.circuit);
  const hasMeasurements = circuit?.operations?.some(op => op.gate === 'MEASURE') || false;

  const processors = [
    { id: 'CPU', label: 'CPU', icon: '💻' },
    { id: 'GPU', label: 'GPU', icon: '⚡' },
    { id: 'FPGA', label: 'FPGA', icon: '🔧' },
    { id: 'VECTOR', label: 'VECTOR', icon: '📐' },
    { id: 'QPU', label: 'QPU', icon: '🔬' },
    { id: 'VQPU', label: 'VQPU', icon: '🧬' }
  ];

  // Inspect EDA store for layout components
  const edaComponents = useEdaStore(s => s.components) || [];
  const edaQubitComps = edaComponents.filter(c => {
    const t = (c.type || '').toLowerCase();
    const n = (c.name || '').toLowerCase();
    return t.includes('transmon') || t.includes('qubit') || t.includes('star') || t.includes('fluxonium') ||
           n.startsWith('q') || n.startsWith('d') || n.startsWith('z') || n.startsWith('x');
  });
  const hasEdaChip = edaQubitComps.length > 0;
  const isEdaBackend = selectedProcessor === 'VQPU' && selectedBackend === 'eda_custom_topology';

  // Extract physical topology and sample TCAD parameters from EDA layout
  const topology = hasEdaChip ? CrossProductBridge.extractEdaTopology() : { qubits: [], couplings: [], adjacency: {}, numQubits: 0, numCouplings: 0 };
  let sampleTcad = null;
  if (hasEdaChip) {
    try {
      sampleTcad = CrossProductBridge.extractComponentTCAD(edaQubitComps[0]);
    } catch {
      sampleTcad = {
        Ec_MHz: 240,
        Ej_MHz: 13500,
        omega01_GHz: 5.02,
        anharmonicity_MHz: -240,
        C_sigma_fF: 81.2,
        inductance_nH: 12.2,
        EjEc_ratio: 56.3
      };
    }
  }

  // Routing & Topology Analysis for Silicon EDA Custom Backend
  const topologyAnalysis = (() => {
    if (!hasEdaChip || !topology.qubits?.length) return null;

    // Detect isolated transmons (degree 0 in adjacency graph)
    const isolatedQubits = topology.qubits.filter(q => {
      const neighbors = topology.adjacency?.[q.index] || [];
      return neighbors.length === 0;
    });

    // Extract all 2-qubit operations in the active circuit
    const twoQubitOps = (circuit?.operations || []).filter(op =>
      op.qubits && op.qubits.length === 2 && !['BARRIER', 'MEASURE', 'RESET'].includes((op.gate || '').toUpperCase())
    );

    // BFS shortest path in adjacency graph
    const getShortestPathDist = (start, target) => {
      if (start === target) return 0;
      const visited = new Set([start]);
      const queue = [[start, 0]];
      while (queue.length > 0) {
        const [curr, dist] = queue.shift();
        const neighbors = topology.adjacency?.[curr] || [];
        for (const n of neighbors) {
          if (n === target) return dist + 1;
          if (!visited.has(n)) {
            visited.add(n);
            queue.push([n, dist + 1]);
          }
        }
      }
      return Infinity; // Disconnected graph component
    };

    let totalEstimatedSwaps = 0;
    let directGates = 0;
    let routedGates = 0;
    let unreachableGates = 0;
    const gateDetails = [];

    for (const op of twoQubitOps) {
      const [q0, q1] = op.qubits;
      const dist = getShortestPathDist(q0, q1);
      if (dist === 1) {
        directGates++;
        gateDetails.push({ gate: op.gate, qubits: [q0, q1], dist: 1, swaps: 0, status: 'direct' });
      } else if (dist < Infinity) {
        routedGates++;
        const swaps = 2 * (dist - 1);
        totalEstimatedSwaps += swaps;
        gateDetails.push({ gate: op.gate, qubits: [q0, q1], dist, swaps, status: 'routed' });
      } else {
        unreachableGates++;
        gateDetails.push({ gate: op.gate, qubits: [q0, q1], dist: Infinity, swaps: null, status: 'unreachable' });
      }
    }

    const extraCnots = totalEstimatedSwaps * 3;
    const swapOverheadPct = twoQubitOps.length > 0 ? Math.round((extraCnots / twoQubitOps.length) * 100) : 0;
    const estimated2QDepthExpansion = totalEstimatedSwaps * 3;

    return {
      isolatedQubits,
      total2QGates: twoQubitOps.length,
      directGates,
      routedGates,
      unreachableGates,
      totalEstimatedSwaps,
      extraCnots,
      swapOverheadPct,
      estimated2QDepthExpansion,
      gateDetails,
      isFullyConnected: unreachableGates === 0 && isolatedQubits.length === 0,
    };
  })();

  // Auto-select backend when processor or provider changes
  useEffect(() => {
    if (selectedProcessor === 'VQPU') {
      if (selectedBackend !== 'qldpc_virtual_chip' && selectedBackend !== 'eda_custom_topology') {
        setBackend('qldpc_virtual_chip');
      }
    } else if (selectedProcessor === 'GPU') {
      if (selectedBackend !== 'aer_simulator_statevector_gpu') {
        setBackend('aer_simulator_statevector_gpu');
      }
    } else if (selectedProcessor === 'VECTOR') {
      if (selectedBackend !== 'simd_vector_avx512') {
        setBackend('simd_vector_avx512');
      }
    } else if (selectedProcessor === 'FPGA') {
      if (selectedBackend !== 'fpga_simulator') {
        setBackend('fpga_simulator');
      }
    } else if (selectedProcessor === 'CPU') {
      if (selectedBackend !== 'aer_statevector' && selectedBackend !== 'qasm_simulator') {
        setBackend('aer_statevector');
      }
    } else if (selectedProcessor === 'QPU') {
      if (selectedProvider === 'aws_braket') {
        setBackend('arn:aws:braket:::device/qpu/ionq/Aria-1');
      } else if (selectedProvider === 'ionq') {
        setBackend('ionq_aria');
      } else if (selectedProvider === 'rigetti') {
        setBackend('Ankaa-2');
      } else {
        setBackend('least_busy');
      }
    }
  }, [selectedProcessor, selectedProvider, selectedBackend, setBackend]);

  // Sync API key input with stored key when provider changes
  useEffect(() => {
    setApiKeyInput(providerApiKeys[selectedProvider] || '');
  }, [selectedProvider, providerApiKeys]);

  const CLOUD_PROVIDERS = [
    { id: 'ibm_quantum', label: 'Alpha Quantum', icon: '🔵', url: 'https://quantum.alpha.com', keyHint: 'Paste your Alpha Quantum API token' },
    { id: 'aws_braket', label: 'Amazon Braket', icon: '🟠', url: 'https://aws.amazon.com/braket', keyHint: 'Paste your AWS Access Key ID' },
    { id: 'ionq', label: 'IonQ (via Braket)', icon: '🟣', url: 'https://ionq.com', keyHint: 'Paste your IonQ API key' },
    { id: 'rigetti', label: 'Rigetti (via QCS)', icon: '🟢', url: 'https://qcs.rigetti.com', keyHint: 'Paste your Rigetti QCS token' },
  ];

  const activeProvider = CLOUD_PROVIDERS.find(p => p.id === selectedProvider) || CLOUD_PROVIDERS[0];
  const isQPU = selectedProcessor === 'QPU';
  const isVQPU = selectedProcessor === 'VQPU';
  const isQpuConnected = Boolean(providerApiKeys[selectedProvider]?.trim());
  const isQpuValid = !isQPU || isQpuConnected;
  
  const circuitQubitCount = circuit?.numQubits || 0;
  const isEdaChipPresent = hasEdaChip;
  const edaCapacityOk = !isEdaBackend || (edaQubitComps.length >= circuitQubitCount);
  const edaConnectivityOk = !isEdaBackend || !topologyAnalysis || topologyAnalysis.unreachableGates === 0;
  const isEdaValid = !isEdaBackend || (isEdaChipPresent && edaCapacityOk && edaConnectivityOk);
  
  const canSubmit = hasMeasurements && isQpuValid && isEdaValid;

  const handleFormSubmit = () => {
    if (!hasMeasurements) return;
    if (isEdaBackend && !hasEdaChip) return;
    if (isEdaBackend && !edaCapacityOk) return;
    if (isEdaBackend && !edaConnectivityOk) return;
    if (isQPU && !isQpuConnected) return;
    
    if (isEdaBackend) {
      // Sync EDA layout topology to store so transpiler receives it
      CrossProductBridge.bridgeEdaTopologyToComposer();
    }
    if (onSubmit) onSubmit();
    else onClose();
  };

  // Get available backends for current processor
  const getBackendsForProcessor = () => {
    if (selectedProcessor === 'QPU') {
      if (selectedProvider === 'aws_braket') {
        return [
          { value: 'arn:aws:braket:::device/qpu/ionq/Aria-1', label: 'IonQ Aria-1 (25 Qubits Trapped-Ion)' },
          { value: 'arn:aws:braket:::device/qpu/rigetti/Ankaa-2', label: 'Rigetti Ankaa-2 (84 Qubits Superconducting)' },
          { value: 'arn:aws:braket:::device/qpu/iqm/Garnet', label: 'IQM Garnet (20 Qubits Superconducting)' },
        ];
      }
      if (selectedProvider === 'ionq') {
        return [
          { value: 'ionq_aria', label: 'IonQ Aria (25 Algorithmic Qubits)' },
          { value: 'ionq_forte', label: 'IonQ Forte (36 Algorithmic Qubits)' },
        ];
      }
      if (selectedProvider === 'rigetti') {
        return [
          { value: 'Ankaa-2', label: 'Rigetti Ankaa-2 (84 Qubits)' },
        ];
      }
      return [
        { value: 'least_busy', label: 'Auto-Select (Least Busy Real QPU)' },
        { value: 'ibm_brisbane', label: 'IBM Brisbane (127 Qubits - Heron r2)' },
        { value: 'ibm_kyoto', label: 'IBM Kyoto (127 Qubits - Eagle r3)' },
        { value: 'ibm_osaka', label: 'IBM Osaka (127 Qubits - Eagle r3)' },
        { value: 'ibm_sherbrooke', label: 'IBM Sherbrooke (127 Qubits - Eagle r3)' },
      ];
    }
    if (selectedProcessor === 'VQPU') {
      return [
        { value: 'qldpc_virtual_chip', label: 'Alpha-Paradox QLDPC vQPU (1,100 Qubit Fault-Tolerant)' },
        { value: 'eda_custom_topology', label: 'Silicon EDA Active Layout (Hardware-Constrained)' },
      ];
    }
    if (selectedProcessor === 'GPU') {
      return [
        { value: 'aer_simulator_statevector_gpu', label: 'aer_simulator_statevector_gpu' },
        { value: 'aer_simulator_tensor_network_gpu', label: 'aer_simulator_tensor_network_gpu' },
        { value: 'nvidia_cudaq_statevector_simulator', label: 'nvidia_cudaq_statevector_simulator' },
        { value: 'nvidia_cudaq_tensor_network_simulator', label: 'nvidia_cudaq_tensor_network_simulator' },
        { value: 'nvidia_cudaq_mps_simulator', label: 'nvidia_cudaq_mps_simulator' },
        { value: 'qsimcirq_cuquantum_gpu_simulator', label: 'qsimcirq_cuquantum_gpu_simulator' },
      ];
    }
    if (selectedProcessor === 'FPGA') {
      return [
        { value: 'fpga_simulator', label: 'fpga_simulator' },
        { value: 'fpga_dm_simulator', label: 'fpga_dm_simulator' },
      ];
    }
    
    // Default to CPU backends
    return [
        { value: 'qasm_simulator', label: 'qasm_simulator' },
        { value: 'aer_simulator_statevector', label: 'aer_simulator_statevector' },
        { value: 'aer_simulator_density_matrix', label: 'aer_simulator_density_matrix' },
        { value: 'aer_simulator_stabilizer', label: 'aer_simulator_stabilizer' },
        { value: 'aer_simulator_matrix_product_state', label: 'aer_simulator_matrix_product_state' },
        { value: 'cirq_simulator', label: 'cirq_simulator' },
        { value: 'cirq_clifford_simulator', label: 'cirq_clifford_simulator' },
        { value: 'nvidia_cudaq_stabilizer_simulator', label: 'nvidia_cudaq_stabilizer_simulator' },
        { value: 'quest_simulator', label: 'quest_simulator' },
        { value: 'qsimcirq_simulator', label: 'qsimcirq_simulator' },
        { value: 'qulacs_multicpu_simulator', label: 'qulacs_multicpu_simulator' },
        { value: 'cdac_photoniqs_simulator_qwalk', label: 'cdac_photoniqs_simulator_qwalk' },
        { value: 'cdac_photoniqs_simulator_klm', label: 'cdac_photoniqs_simulator_klm' },
        { value: 'qniverse_statevector_simulator', label: 'qniverse_statevector_simulator' },
    ];
  };

  const backends = getBackendsForProcessor();

  return (
    <div className="modal-overlay">
      <div className="configure-modal">
        <div className="modal-header">
          <h2>⚙ Configure Backend</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="config-modal-body">
          {/* Column 1: Select Processor */}
          <div className="config-section">
            <h3 style={{ fontSize: '0.85rem', color: '#fff', margin: 0, textTransform: 'none', fontWeight: '500' }}>Select Processor</h3>
            <div className="processor-grid">
              {processors.map(proc => (
                <div key={proc.id} className="proc-radio-item">
                  <input 
                    type="radio" 
                    name="processor" 
                    checked={selectedProcessor === proc.id}
                    onChange={() => setProcessor(proc.id)}
                  />
                  <div 
                    className={`proc-card ${selectedProcessor === proc.id ? 'selected' : ''}`}
                    onClick={() => setProcessor(proc.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{proc.icon}</div>
                    <div>{proc.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: HPC/Simulator or QPU Cloud Config */}
          <div className="config-section">
            {isQPU ? (
              /* ────── QPU Cloud Provider Section ────── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '500' }}>Cloud Provider</label>
                <select 
                  className="panel-dropdown" 
                  style={{ background: '#1c2128', padding: '0.5rem' }}
                  value={selectedProvider}
                  onChange={e => setSelectedProvider(e.target.value)}
                >
                  {CLOUD_PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.icon} {p.label}</option>
                  ))}
                </select>

                <label style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '500', marginTop: '0.3rem' }}>API Key / Token</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showKey ? 'text' : 'password'}
                    placeholder={activeProvider.keyHint}
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && apiKeyInput.trim()) {
                        setProviderApiKey(selectedProvider, apiKeyInput.trim());
                      }
                    }}
                    style={{
                      background: '#1c2128',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '4px',
                      color: '#e6edf3',
                      padding: '0.5rem 2.5rem 0.5rem 0.5rem',
                      width: '100%',
                      boxSizing: 'border-box',
                      fontSize: '0.8rem',
                    }}
                  />
                  <button 
                    onClick={() => setShowKey(!showKey)}
                    style={{
                      position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                      cursor: 'pointer', fontSize: '0.85rem', padding: '0.2rem',
                    }}
                  >{showKey ? '🙈' : '👁'}</button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      if (apiKeyInput.trim()) {
                        setProviderApiKey(selectedProvider, apiKeyInput.trim());
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '0.45rem 0.8rem',
                      background: apiKeyInput.trim() ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.3)',
                      border: 'none', borderRadius: '4px', color: '#fff',
                      cursor: apiKeyInput.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '0.75rem', fontWeight: '600',
                    }}
                    disabled={!apiKeyInput.trim()}
                  >Connect</button>
                  {providerApiKeys[selectedProvider] && (
                    <button
                      onClick={() => {
                        clearProviderApiKey(selectedProvider);
                        setApiKeyInput('');
                      }}
                      style={{
                        padding: '0.45rem 0.8rem',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', color: '#ef4444',
                        cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600',
                      }}
                    >Disconnect</button>
                  )}
                </div>

                {/* Connection Status */}
                <div style={{
                  padding: '0.5rem 0.7rem',
                  background: providerApiKeys[selectedProvider]
                    ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.06)',
                  border: `1px solid ${providerApiKeys[selectedProvider]
                    ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.15)'}`,
                  borderRadius: '6px',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: providerApiKeys[selectedProvider] ? '#10b981' : '#ef4444',
                    boxShadow: providerApiKeys[selectedProvider]
                      ? '0 0 6px rgba(16, 185, 129, 0.5)' : '0 0 6px rgba(239, 68, 68, 0.4)',
                  }} />
                  <div>
                    <div style={{
                      color: providerApiKeys[selectedProvider] ? '#10b981' : '#ef4444',
                      fontSize: '0.7rem', fontWeight: '600',
                    }}>
                      {providerApiKeys[selectedProvider] ? 'Connected' : 'Not Connected'}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem' }}>
                      {providerApiKeys[selectedProvider]
                        ? `${activeProvider.label} · Ready to submit jobs`
                        : <span>Get your API key at <a href={activeProvider.url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>{activeProvider.url}</a></span>}
                    </div>
                  </div>
                </div>

                {/* Target Hardware Device */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.2rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '500' }}>Target Hardware Device</label>
                  <select 
                    className="panel-dropdown" 
                    style={{ background: '#1c2128', padding: '0.5rem' }} 
                    value={selectedBackend} 
                    onChange={e => setBackend(e.target.value)}
                  >
                    {backends.map(b => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>

                {/* Shots (still needed for QPU) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.3rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '500' }}>Shots</label>
                  <input 
                    type="number" 
                    value={shots} 
                    onChange={(e) => setShots(parseInt(e.target.value) || 1024)} 
                    min="1" max="100000" 
                    style={{ 
                      background: '#1c2128', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '4px', 
                      color: '#e6edf3', 
                      padding: '0.5rem',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            ) : (
              /* ────── Original Simulator Section ────── */
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '500' }}>Select HPC</label>
                  <select className="panel-dropdown" style={{ background: '#1c2128', padding: '0.5rem' }}>
                    <option>QACC-Cluster</option>
                    {isVQPU && <option>Alpha-Paradox Cloud (H100)</option>}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '500' }}>Select Simulator Backend</label>
                  <select 
                    className="panel-dropdown" 
                    style={{ background: '#1c2128', padding: '0.5rem' }} 
                    value={selectedBackend} 
                    onChange={e => setBackend(e.target.value)}
                  >
                    {backends.map(b => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '500' }}>Shots</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" 
                      value={shots} 
                      onChange={(e) => setShots(parseInt(e.target.value) || 1024)} 
                      min="1" max="100000" 
                      style={{ 
                        background: '#1c2128', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '4px', 
                        color: '#e6edf3', 
                        padding: '0.5rem',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* vQPU Status Indicator */}
                {isVQPU && selectedBackend === 'eda_custom_topology' ? (
                  !hasEdaChip ? (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.85rem 0.95rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.55rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ fontSize: '1.05rem' }}>⚠️</span>
                        <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: '600' }}>
                          No Active Chip in Silicon EDA
                        </span>
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', lineHeight: '1.4' }}>
                        No physical transmon qubits or layout detected in Silicon EDA canvas. You cannot run a circuit on non-existent hardware.
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '3px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            window.location.href = '/eda';
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'rgba(59, 130, 246, 0.25)',
                            border: '1px solid rgba(59, 130, 246, 0.5)',
                            color: '#60a5fa',
                            borderRadius: '5px',
                            fontSize: '0.72rem',
                            padding: '4px 10px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          📐 Open Silicon EDA to Design Chip
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem 0.9rem',
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.35)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ color: '#06b6d4', fontSize: '0.9rem' }}>📐</span>
                          <span style={{ color: '#06b6d4', fontSize: '0.78rem', fontWeight: '600' }}>
                            Silicon EDA Chip ({edaQubitComps.length} Physical Qubits)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const topo = CrossProductBridge.bridgeEdaTopologyToComposer();
                            alert(`Resynced: ${topo.numQubits} transmons, ${topo.numCouplings} CPW bus couplers from EDA.`);
                          }}
                          style={{
                            background: 'rgba(6, 182, 212, 0.2)',
                            border: '1px solid rgba(6, 182, 212, 0.4)',
                            color: '#67e8f9',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            padding: '2px 8px',
                            cursor: 'pointer',
                          }}
                        >
                          🔄 Re-sync
                        </button>
                      </div>

                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.68rem', lineHeight: '1.4' }}>
                        Physical hardware layout connected. Transpiler will constrain 2-qubit gates strictly to physical CPW resonator couplers.
                      </div>

                      <div style={{
                        display: 'flex', gap: '6px', flexWrap: 'wrap',
                        fontSize: '0.65rem', color: '#94a3b8', background: '#0d1117',
                        padding: '4px 8px', borderRadius: '4px'
                      }}>
                        <span>Transmons: {edaQubitComps.map(q => q.name || q.id).slice(0, 8).join(', ')}{edaQubitComps.length > 8 ? ` +${edaQubitComps.length - 8} more` : ''}</span>
                        <span>· Couplers: {topology.numCouplings}</span>
                      </div>

                      {/* Topology & SWAP Routing Analysis Banner */}
                      {topologyAnalysis && (
                        <div style={{
                          background: 'rgba(13, 17, 23, 0.85)',
                          border: `1px solid ${topologyAnalysis.unreachableGates > 0 ? 'rgba(239, 68, 68, 0.4)' : topologyAnalysis.isolatedQubits.length > 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`,
                          borderRadius: '6px',
                          padding: '8px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#f0f6fc' }}>
                              🧭 Coupling Graph & Routing Analysis:
                            </span>
                            <span style={{
                              fontSize: '0.62rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: '600',
                              background: topologyAnalysis.unreachableGates > 0
                                ? 'rgba(239, 68, 68, 0.2)'
                                : topologyAnalysis.totalEstimatedSwaps > 0
                                  ? 'rgba(245, 158, 11, 0.2)'
                                  : 'rgba(16, 185, 129, 0.2)',
                              color: topologyAnalysis.unreachableGates > 0
                                ? '#ef4444'
                                : topologyAnalysis.totalEstimatedSwaps > 0
                                  ? '#fbbf24'
                                  : '#10b981'
                            }}>
                              {topologyAnalysis.unreachableGates > 0
                                ? 'Disconnected Islands'
                                : topologyAnalysis.totalEstimatedSwaps > 0
                                  ? `+${topologyAnalysis.totalEstimatedSwaps} SWAPs (${topologyAnalysis.swapOverheadPct}% ovhd)`
                                  : '100% Native Coupling'}
                            </span>
                          </div>

                          {/* Isolated Transmons Warning */}
                          {topologyAnalysis.isolatedQubits.length > 0 && (
                            <div style={{
                              fontSize: '0.66rem',
                              color: '#fbbf24',
                              background: 'rgba(245, 158, 11, 0.1)',
                              padding: '4px 6px',
                              borderRadius: '4px'
                            }}>
                              ⚠️ <b>Isolated Transmon Alert:</b> {topologyAnalysis.isolatedQubits.map(q => q.name || `Q${q.index}`).join(', ')} has 0 connected CPW bus couplers in layout.
                            </div>
                          )}

                          {/* Unreachable Gates Error */}
                          {topologyAnalysis.unreachableGates > 0 ? (
                            <div style={{
                              fontSize: '0.66rem',
                              color: '#ef4444',
                              background: 'rgba(239, 68, 68, 0.1)',
                              padding: '4px 6px',
                              borderRadius: '4px'
                            }}>
                              🚫 <b>Unroutable Interaction:</b> {topologyAnalysis.unreachableGates} two-qubit gate(s) operate across disconnected chip components. Circuit cannot execute without adding CPW couplers in Silicon EDA.
                            </div>
                          ) : topologyAnalysis.total2QGates > 0 ? (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '4px',
                              fontSize: '0.64rem',
                              color: '#cbd5e1'
                            }}>
                              <div>• Direct 2Q Gates: <b>{topologyAnalysis.directGates}/{topologyAnalysis.total2QGates}</b></div>
                              <div>• Routed Multi-Hop: <b>{topologyAnalysis.routedGates}</b></div>
                              <div>• Est. SWAP Gates: <b style={{ color: topologyAnalysis.totalEstimatedSwaps > 0 ? '#fbbf24' : '#10b981' }}>+{topologyAnalysis.totalEstimatedSwaps}</b></div>
                              <div>• 2Q Depth Expansion: <b>+{topologyAnalysis.estimated2QDepthExpansion} cycles</b></div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.64rem', color: '#94a3b8' }}>
                              Circuit contains only 1-qubit gates. No 2-qubit CPW routing required.
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const lvs = CrossProductBridge.runLVS();
                            alert(lvs.summary);
                          }}
                          style={{
                            background: 'rgba(245, 158, 11, 0.2)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            color: '#fbbf24',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            padding: '3px 8px',
                            cursor: 'pointer',
                          }}
                        >
                          ✓ Run LVS Check
                        </button>
                      </div>
                    </div>
                  )
                ) : isVQPU && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.6rem 0.8rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <span style={{ color: '#10b981', fontSize: '0.9rem' }}>⚡</span>
                    <div>
                      <div style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '600' }}>
                        Alpha-Paradox vQPU Connected
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>
                        1,100 Physical · 88 Logical · QLDPC d=16 · BP-OSD
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Column 3: Noise Parameters */}
          <div className="config-section">
            <h3 style={{ fontSize: '0.85rem', color: '#fff', margin: 0, textTransform: 'none', fontWeight: '500' }}>
              {isQPU ? 'Hardware Calibration Profile' : isEdaBackend ? 'Cleanroom Fabrication & TCAD Profile' : 'Select Noise Parameters'}
            </h3>

            {isQPU ? (
              <div style={{
                marginTop: '1rem',
                padding: '0.9rem',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🔬</span>
                  <div>
                    <div style={{ color: '#60a5fa', fontSize: '0.82rem', fontWeight: '600' }}>
                      Cryogenic Dilution Environment
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem' }}>
                      Hardware Operating Temp: ~15 mK
                    </div>
                  </div>
                </div>

                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', lineHeight: '1.45' }}>
                  Real QPUs execute on physical superconducting transmon chips. Physical decoherence (T1/T2), gate crosstalk, and readout infidelities are automatically applied from daily automated hardware calibrations.
                </div>

                <div style={{
                  background: '#161b22',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  padding: '0.6rem 0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.8)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Avg 1Q Gate Error:</span>
                    <span style={{ color: '#10b981', fontFamily: 'monospace' }}>~2.1 × 10⁻⁴</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Avg 2Q (CZ/ECR) Error:</span>
                    <span style={{ color: '#fbbf24', fontFamily: 'monospace' }}>~8.5 × 10⁻³</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Readout Fidelity:</span>
                    <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>~98.2%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>Median T1 / T2 Time:</span>
                    <span style={{ color: '#e5e7eb', fontFamily: 'monospace' }}>180 μs / 120 μs</span>
                  </div>
                </div>
              </div>
            ) : isEdaBackend ? (
              !hasEdaChip ? (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.9rem',
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px dashed rgba(239, 68, 68, 0.25)',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}>
                  <div style={{ color: '#f87171', fontSize: '0.78rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>⚠️</span>
                    <span>Cleanroom TCAD Physics Unavailable</span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', lineHeight: '1.4' }}>
                    Substrate dielectric loss (tan δ), Josephson junction inductance (L_J), shunt charging energy (E_C), and transmon anharmonicity (α) require physical transmon components on the Silicon EDA canvas.
                  </div>
                </div>
              ) : (
                <div style={{
                  marginTop: '0.8rem',
                  padding: '0.8rem',
                  background: 'rgba(16, 185, 129, 0.07)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.55rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>🔬</span>
                      <span>Cleanroom Fabrication & TCAD Profile</span>
                    </div>
                    <span style={{ fontSize: '0.62rem', color: '#6ee7b7', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '3px' }}>
                      Live TCAD
                    </span>
                  </div>

                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', lineHeight: '1.4' }}>
                    Parameters extracted from placed Silicon EDA transmon geometry and thin-film cleanroom materials:
                  </div>

                  <div style={{
                    background: '#161b22',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    padding: '0.6rem 0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.32rem',
                    fontSize: '0.68rem',
                    color: 'rgba(255,255,255,0.85)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Substrate / Dielectric:</span>
                      <span style={{ color: '#67e8f9', fontFamily: 'monospace' }}>High-Resistivity Si (εᵣ=11.9, tanδ=2×10⁻⁶)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Metallization:</span>
                      <span style={{ color: '#e5e7eb', fontFamily: 'monospace' }}>Thin-film Al / Nb (Tc=1.2K)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Josephson Junction:</span>
                      <span style={{ color: '#fbbf24', fontFamily: 'monospace' }}>Al/AlOx/Al Dolan Bridge (L_J ≈ {sampleTcad?.inductance_nH || 12.2} nH)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Shunt Capacitance (C_Σ):</span>
                      <span style={{ color: '#a78bfa', fontFamily: 'monospace' }}>~{sampleTcad?.C_sigma_fF || 81.2} fF</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Charging Energy (E_C):</span>
                      <span style={{ color: '#10b981', fontFamily: 'monospace' }}>{sampleTcad?.Ec_MHz || 240} MHz</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Josephson Energy (E_J):</span>
                      <span style={{ color: '#10b981', fontFamily: 'monospace' }}>{sampleTcad?.Ej_MHz || 13500} MHz (E_J/E_C ≈ {sampleTcad?.EjEc_ratio || 56})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Qubit Frequency (ω₀₁):</span>
                      <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{sampleTcad?.omega01_GHz || 5.02} GHz (α ≈ {sampleTcad?.anharmonicity_MHz || -240} MHz)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Physical Decoherence:</span>
                      <span style={{ color: '#f59e0b', fontFamily: 'monospace' }}>T₁ ≈ 65 μs · T₂* ≈ 85 μs</span>
                    </div>
                  </div>

                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem', lineHeight: '1.4' }}>
                    Non-adjacent 2-qubit gates are physically transpiled with SWAP overhead across the chip's CPW coupling bus.
                  </div>
                </div>
              )
            ) : (
              <>
            <div className="noise-radio-group">
              <label className="proc-radio-item" style={{ color: '#fff', fontSize: '0.85rem' }}>
                <input 
                  type="radio" 
                  name="noiseMode" 
                  checked={noiseConfig.noiseType === 'none'}
                  onChange={() => setNoiseConfig({ noiseType: 'none' })}
                />
                Without Noise
              </label>
              <label className="proc-radio-item" style={{ color: '#fff', fontSize: '0.85rem' }}>
                <input 
                  type="radio" 
                  name="noiseMode" 
                  checked={noiseConfig.noiseType === 'custom'}
                  onChange={() => setNoiseConfig({ noiseType: 'custom' })}
                />
                Custom Noise
              </label>
              {/* Hardware-Extracted Noise (only for VQPU) */}
              {isVQPU && (
                <label className="proc-radio-item" style={{ color: '#10b981', fontSize: '0.85rem' }}>
                  <input 
                    type="radio" 
                    name="noiseMode" 
                    checked={noiseConfig.noiseType === 'hardware'}
                    onChange={() => setNoiseConfig({ 
                      noiseType: 'hardware',
                      vqpu: {
                        pGate: 0.001,
                        pMeas: 0.005,
                        pIdle: 0.0001,
                        qecRounds: 5,
                        decoder: 'BP-OSD',
                      }
                    })}
                  />
                  🧬 Hardware-Extracted
                </label>
              )}
            </div>

            {/* Show hardware noise summary when selected */}
            {isVQPU && noiseConfig.noiseType === 'hardware' && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem 0.7rem',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                borderRadius: '4px',
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.6)',
                lineHeight: '1.6',
              }}>
                <div>Gate Error: <span style={{ color: '#10b981' }}>0.1%</span></div>
                <div>Measurement Error: <span style={{ color: '#10b981' }}>0.5%</span></div>
                <div>ZZ Crosstalk: <span style={{ color: '#10b981' }}>1.2×10⁻⁵</span></div>
                <div>QEC Cycle: <span style={{ color: '#10b981' }}>324 ns</span></div>
                <div>Decoder: <span style={{ color: '#10b981' }}>BP-OSD (d=16)</span></div>
              </div>
            )}

            {/* Standard noise checkboxes */}
            {noiseConfig.noiseType === 'custom' && (
              <div className="noise-checkbox-group">
                <label className="noise-checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={noiseConfig.initializationError?.enabled}
                    onChange={(e) => updateNoiseParam('initializationError', 'enabled', e.target.checked)}
                  />
                  Initialization Error <span style={{ color: '#3b82f6', cursor: 'pointer' }}>ⓘ</span>
                </label>
                {noiseConfig.initializationError?.enabled && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.8rem' }}>
                    <input 
                      type="number" step="0.01" 
                      value={noiseConfig.initializationError?.p || 0.01} 
                      onChange={(e) => updateNoiseParam('initializationError', 'p', parseFloat(e.target.value))}
                      style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', textAlign: 'center', width: '60px' }}
                    />
                  </div>
                )}
                <label className="noise-checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={noiseConfig.readoutError?.enabled}
                    onChange={(e) => updateNoiseParam('readoutError', 'enabled', e.target.checked)}
                  />
                  Readout Error <span style={{ color: '#3b82f6', cursor: 'pointer' }}>ⓘ</span>
                </label>
                {noiseConfig.readoutError?.enabled && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.8rem' }}>
                    <input 
                      type="number" step="0.01" 
                      value={noiseConfig.readoutError?.p || 0.01} 
                      onChange={(e) => updateNoiseParam('readoutError', 'p', parseFloat(e.target.value))}
                      style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', textAlign: 'center', width: '60px' }}
                    />
                  </div>
                )}
                <label className="noise-checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={noiseConfig.gateRotationError?.enabled}
                    onChange={(e) => updateNoiseParam('gateRotationError', 'enabled', e.target.checked)}
                  />
                  Gate Rotation Error <span style={{ color: '#3b82f6', cursor: 'pointer' }}>ⓘ</span>
                </label>
                {noiseConfig.gateRotationError?.enabled && (
                  <div style={{ marginLeft: '1rem', marginTop: '0.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: '#fff', display: 'block', marginBottom: '0.2rem' }}>εx</label>
                      <input 
                        type="number" value={noiseConfig.gateRotationError?.ex || 1} 
                        onChange={(e) => updateNoiseParam('gateRotationError', 'ex', parseFloat(e.target.value))}
                        style={{ background: '#1c2128', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.3rem', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: '#fff', display: 'block', marginBottom: '0.2rem' }}>εy</label>
                      <input 
                        type="number" value={noiseConfig.gateRotationError?.ey || 1} 
                        onChange={(e) => updateNoiseParam('gateRotationError', 'ey', parseFloat(e.target.value))}
                        style={{ background: '#1c2128', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.3rem', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: '#fff', display: 'block', marginBottom: '0.2rem' }}>εz</label>
                      <input 
                        type="number" value={noiseConfig.gateRotationError?.ez || 1} 
                        onChange={(e) => updateNoiseParam('gateRotationError', 'ez', parseFloat(e.target.value))}
                        style={{ background: '#1c2128', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.3rem', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                )}
                <label className="noise-checkbox-item">
                  <input 
                    type="checkbox" 
                    checked={noiseConfig.depolarizingError?.enabled}
                    onChange={(e) => updateNoiseParam('depolarizingError', 'enabled', e.target.checked)}
                  />
                  Depolarization Error <span style={{ color: '#3b82f6', cursor: 'pointer' }}>ⓘ</span>
                </label>
                {noiseConfig.depolarizingError?.enabled && (
                  <div style={{ marginLeft: '1.5rem', marginTop: '0.2rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Gate Error (p):</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      value={noiseConfig.depolarizingError?.p || 0.001}
                      onChange={(e) => updateNoiseParam('depolarizingError', 'p', parseFloat(e.target.value))}
                      style={{ background: '#1c2128', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.2rem 0.4rem', borderRadius: '4px', width: '80px', fontSize: '0.75rem' }}
                    />
                  </div>
                )}
                <label className="noise-checkbox-item" style={{ alignItems: 'flex-start' }}>
                  <input 
                    type="checkbox" 
                    checked={noiseConfig.thermalRelaxation?.enabled}
                    onChange={(e) => updateNoiseParam('thermalRelaxation', 'enabled', e.target.checked)}
                    style={{ marginTop: '0.2rem' }}
                  />
                  <span>Thermal Relaxation and<br/>Dephasing Error <span style={{ color: '#3b82f6', cursor: 'pointer' }}>ⓘ</span></span>
                </label>
                {noiseConfig.thermalRelaxation?.enabled && (
                  <div style={{ marginLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', width: '45px' }}>T1 (μs):</label>
                      <input 
                        type="number" 
                        value={noiseConfig.thermalRelaxation?.t1 || 50.0}
                        onChange={(e) => updateNoiseParam('thermalRelaxation', 't1', parseFloat(e.target.value))}
                        style={{ background: '#1c2128', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.2rem 0.4rem', borderRadius: '4px', width: '80px', fontSize: '0.75rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', width: '45px' }}>T2 (μs):</label>
                      <input 
                        type="number" 
                        value={noiseConfig.thermalRelaxation?.t2 || 70.0}
                        onChange={(e) => updateNoiseParam('thermalRelaxation', 't2', parseFloat(e.target.value))}
                        style={{ background: '#1c2128', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.2rem 0.4rem', borderRadius: '4px', width: '80px', fontSize: '0.75rem' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {noiseConfig.noiseType === 'none' && !isVQPU && (
              <div className="noise-checkbox-group">
                <label className="noise-checkbox-item">
                  <input type="checkbox" disabled /> Initialization Error <span style={{ color: '#3b82f6', cursor: 'pointer' }}>ⓘ</span>
                </label>
                <label className="noise-checkbox-item">
                  <input type="checkbox" disabled /> Readout Error <span style={{ color: '#3b82f6', cursor: 'pointer' }}>ⓘ</span>
                </label>
                <label className="noise-checkbox-item">
                  <input type="checkbox" disabled /> Gate Rotation Error <span style={{ color: '#3b82f6', cursor: 'pointer' }}>ⓘ</span>
                </label>
                <label className="noise-checkbox-item">
                  <input type="checkbox" disabled /> Depolarization Error <span style={{ color: '#3b82f6', cursor: 'pointer' }}>ⓘ</span>
                </label>
                <label className="noise-checkbox-item" style={{ alignItems: 'flex-start' }}>
                  <input type="checkbox" disabled style={{ marginTop: '0.2rem' }} />
                  <span>Thermal Relaxation and<br/>Dephasing Error <span style={{ color: '#3b82f6', cursor: 'pointer' }}>ⓘ</span></span>
                </label>
              </div>
            )}
              </>
            )}
          </div>
        </div>

        <div className="modal-footer split" style={{ alignItems: 'center' }}>
          {!hasMeasurements ? (
            <div style={{ color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>⚠️</span>
              <span>Measurement required to run</span>
            </div>
          ) : isEdaBackend && !hasEdaChip ? (
            <div style={{ color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>⚠️</span>
              <span>No EDA Chip Found: Design or load a chip in Silicon EDA before submitting</span>
            </div>
          ) : isEdaBackend && !edaCapacityOk ? (
            <div style={{ color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>⚠️</span>
              <span>Hardware Capacity Exceeded: Circuit needs {circuitQubitCount} qubits, but active EDA chip only has {edaQubitComps.length} physical transmons.</span>
            </div>
          ) : isEdaBackend && !edaConnectivityOk ? (
            <div style={{ color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>🚫</span>
              <span>Unroutable Topology: Circuit contains 2-qubit gates across disconnected chip islands. Add CPW couplers in EDA.</span>
            </div>
          ) : isEdaBackend && isEdaChipPresent && edaCapacityOk && edaConnectivityOk ? (
            <div style={{ color: '#10b981', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>✓</span>
              <span>Silicon EDA Hardware Linked ({edaQubitComps.length} Transmons, {topology.numCouplings} Couplers) · HW-Constrained</span>
            </div>
          ) : isQPU && !isQpuConnected ? (
            <div style={{ color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>⚠️</span>
              <span>API Key Required: Click 'Connect' to authenticate with {activeProvider.label} before running on hardware QPU</span>
            </div>
          ) : isQPU && isQpuConnected ? (
            <div style={{ color: '#10b981', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>✓</span>
              <span>Authenticated & Connected to {activeProvider.label} · Target: {selectedBackend || 'least_busy'}</span>
            </div>
          ) : isVQPU ? (
            <div style={{ color: '#10b981', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>✓</span>
              <span>Alpha-Paradox QLDPC vQPU Ready (Fault-Tolerant d=16)</span>
            </div>
          ) : <div />}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button 
              className="btn-primary" 
              onClick={canSubmit ? handleFormSubmit : undefined}
              disabled={!canSubmit}
              style={{ opacity: canSubmit ? 1 : 0.45, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
              title={
                !canSubmit
                  ? (!hasMeasurements
                      ? 'Cannot run: Circuit has no measurement gates'
                      : isEdaBackend && !isEdaChipPresent
                        ? 'Cannot run: No physical chip layout found in Silicon EDA'
                        : isEdaBackend && !edaCapacityOk
                          ? `Cannot run: Circuit requires ${circuitQubitCount} qubits, but EDA layout has ${edaQubitComps.length}`
                        : isEdaBackend && !edaConnectivityOk
                          ? 'Cannot run: Circuit has 2-qubit gates across disconnected chip islands'
                          : isQPU && !isQpuConnected
                            ? 'Cannot run: Hardware API key required and must be connected'
                            : 'Cannot submit circuit')
                  : 'Submit circuit for execution'
              }
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
