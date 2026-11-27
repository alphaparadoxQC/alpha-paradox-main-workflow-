import React, { useState } from 'react';
import '../../styles/neural-schema.css';

export const NODES_DATA = {
  notebook: {
    id: 'notebook',
    title: 'Notebook Engine',
    subtitle: 'Python SDK, VQE, QAOA',
    layer: 'Cognitive & Logical Layer',
    description: 'Jupyter Python SDK environment executing variational quantum algorithms (VQE, QAOA), quantum chemistry Hamiltonians, and statevector diagnostics.',
    mathSpecs: ['|ψ(θ)⟩ = U(θ)|0⟩', '⟨H⟩ = ⟨ψ(θ)|H|ψ(θ)⟩', '∇_θ ⟨H⟩ via Parameter-Shift'],
    metrics: [{ label: 'Max Qubits', val: '1,100' }, { label: 'Runtime', val: 'Python 3.10 / C++' }]
  },
  composer: {
    id: 'composer',
    title: 'Composer Engine',
    subtitle: 'Gate DAG, Bloch Spheres, QASM',
    layer: 'Cognitive & Logical Layer',
    description: 'Visual quantum circuit composer with directed acyclic graph (DAG) gate routing, live Bloch sphere state vector projection, and OpenQASM 3.0 export.',
    mathSpecs: ['DAG G = (V, E_time)', 'ρ_out = U ρ_in U†', 'Tr[ρ] = 1, ρ ≥ 0'],
    metrics: [{ label: 'Gate Library', val: '32 Gates' }, { label: 'IR', val: 'OpenQASM 3.0' }]
  },
  hub: {
    id: 'hub',
    title: 'Cross-Product Bridge Router',
    subtitle: 'Event Bus, LVS Engine, State Sync',
    layer: 'Central Neuromorphic Synaptic Hub',
    description: 'High-speed cross-product event bus maintaining synchronized bi-directional state between logical gate DAGs, physical silicon layout, and pulse waveforms.',
    mathSpecs: ['LVS: G_schematic ≅ G_layout', 'Latency: < 2.5 ms', 'Cross-Domain Bus'],
    metrics: [{ label: 'Bandwidth', val: '10 Gbps' }, { label: 'State Sync', val: 'Real-time' }]
  },
  schrodinger: {
    id: 'schrodinger',
    title: 'Analog Schrödinger Engine',
    subtitle: 'TISE/TDSE, Potential Wells, H-Matrix',
    layer: 'Physical TCAD & Full-Wave EM Layer',
    description: 'Numerical eigensolver computing stationary and time-dependent Schrödinger solutions in multi-well Josephson potentials for exact charge-flux dispersion.',
    mathSpecs: ['H = 4E_C(n - n_g)^2 - E_J cos(φ)', 'iℏ ∂ψ/∂t = H(t)ψ', 'E_n, |ψ_n⟩ via FEM'],
    metrics: [{ label: 'Levels Solved', val: 'N = 6' }, { label: 'Dispersion Err', val: '< 10^-5' }]
  },
  eda: {
    id: 'eda',
    title: 'Silicon EDA 2D/3D Engine',
    subtitle: 'Sub-Micron Layout, GDSII, WKT',
    layer: 'Physical TCAD & Full-Wave EM Layer',
    description: 'Superconducting quantum EDA engine generating sub-micron CPW transmission lines, transmon capacitor pockets, airbridges, and multi-die flip-chip packages.',
    mathSpecs: ['GDSII Stream Format', 'WKT Polygons / Paths', 'Flip-Chip Die Alignment'],
    metrics: [{ label: 'Precision', val: '1 nm' }, { label: 'Layers', val: 'Multi-Die 3D' }]
  },
  pulse: {
    id: 'pulse',
    title: 'Microwave Pulse Engine',
    subtitle: 'DRAG Envelopes, Waveform Synthesis',
    layer: 'Physical TCAD & Full-Wave EM Layer',
    description: 'Derivative Removal by Adiabatic Gate (DRAG) microwave pulse synthesis eliminating qubit state leakage into transmon non-computational |2⟩ states.',
    mathSpecs: ['Ω(t) = s(t) + i (-ṡ(t) / α)', 'Phase: θ(t) = ∫ Δ(τ) dτ', 'Sample Rate: 2.4 GSa/s'],
    metrics: [{ label: 'Gate Fidelity', val: '> 99.95%' }, { label: 'Envelope', val: 'Cos / Gaussian' }]
  },
  hfss: {
    id: 'hfss',
    title: 'HFSS 3D EM Solver',
    subtitle: 'S-Parameters, Smith Chart, EPR Loss',
    layer: 'Physical TCAD & Full-Wave EM Layer',
    description: 'Full-wave finite-element Maxwell solver extracting multi-port S-parameters, quality factors, and Energy Participation Ratio (EPR) dielectric TLS loss.',
    mathSpecs: ['∇ × (μ_r^-1 ∇ × E) - k_0^2 ε_r E = 0', 'p_m = E_participation / E_total', 'Q_internal = 1 / Σ p_i tan δ_i'],
    metrics: [{ label: 'EPR Precision', val: '0.01%' }, { label: 'Mesh', val: 'Conformal Tetrahedral' }]
  },
  vqpu: {
    id: 'vqpu',
    title: 'vQPU Hardware Emulator',
    subtitle: '1100 Physical Transmons, Noise Channels',
    layer: 'Hardware Execution & Decoder Layer',
    description: 'Full-scale physical transmon emulator modeling 1,100 superconducting qubits with Lindblad master equation decoherence, 1/f flux noise, and cross-talk.',
    mathSpecs: ['dρ/dt = -i[H, ρ] + Σ_k (L_k ρ L_k† - 1/2 {L_k† L_k, ρ})', 'T1 / T2 Relaxation', 'Readout Frequencies: 6-8 GHz'],
    metrics: [{ label: 'Physical Qubits', val: '1,100' }, { label: 'Noise Channels', val: 'Amplitude + Phase' }]
  },
  qldpc: {
    id: 'qldpc',
    title: 'QLDPC Decoder Engine',
    subtitle: 'Bivariate Bicycle Codes, BP-OSD, d=16',
    layer: 'Hardware Execution & Decoder Layer',
    description: 'Fault-tolerant Quantum Low-Density Parity-Check (QLDPC) decoder executing belief propagation with ordered statistics decoding (BP-OSD) at distance d=16.',
    mathSpecs: ['H_X · H_Z^T = 0 mod 2', 'Syndrome: s = H_X · e', 'Threshold: p_th = 0.85%'],
    metrics: [{ label: 'Code Distance', val: 'd = 16' }, { label: 'Decoding Latency', val: '< 1.2 μs' }]
  }
};

export const SYNAPSES_DATA = [
  { id: 'w1', name: 'Synapse W_1', source: 'Notebook', target: 'Central Hub', tensor: 'Code Gen / Python Parsing', description: 'Transpiles Python VQE/QAOA algorithms into intermediate quantum representations.' },
  { id: 'w2', name: 'Synapse W_2', source: 'Composer', target: 'Central Hub', tensor: 'QASM Import / Alpha-IR Export', description: 'Serializes visual gate circuits into standardized Alpha-IR and QASM payloads.' },
  { id: 'w3', name: 'Synapse W_3', source: 'Central Hub', target: 'Analog Engine', tensor: 'Conformal TCAD Extraction [C_Σ, E_J, E_C]', description: 'Extracts capacitance matrices, Josephson energies, and charging energies.' },
  { id: 'w4', name: 'Synapse W_4', source: 'Analog Engine', target: 'Pulse Engine', tensor: 'Anharmonicity [α, ω_01] Calibration', description: 'Feeds transmon anharmonicity and 01 transition frequencies into DRAG envelope calculators.' },
  { id: 'w5', name: 'Synapse W_5', source: 'Central Hub', target: 'Silicon EDA', tensor: 'Geometric WKT / Layer Stack / 3D Stacking', description: 'Transmits geometric geometries, wafer stack parameters, and 3D flip-chip bump coordinates.' },
  { id: 'w6', name: 'Synapse W_6', source: 'Silicon EDA', target: 'HFSS Solver', tensor: 'Maxwell Field Singularity & EPR Loss', description: 'Provides physical conductor edges and dielectric boundaries for full-wave meshing.' },
  { id: 'w7', name: 'Synapse W_7', source: 'Central Hub', target: 'Cognitive Layer', tensor: 'Physical Coupling Adjacency Mask G=(V,E)', description: 'Feedback line passing physical QPU connectivity graph constraints back to algorithms.' },
  { id: 'w8', name: 'Synapse W_8', source: 'Central Hub', target: 'HFSS Solver', tensor: 'LVS Layout-vs-Schematic Rule Checks', description: 'Validates layout connectivity against schematic netlists before electromagnetic solve.' },
  { id: 'w9', name: 'Synapse W_9', source: 'Pulse Engine', target: 'vQPU Emulator', tensor: 'Calibrated Pulse Schedules [I(t), Q(t)]', description: 'Streams sub-nanosecond I/Q microwave waveforms to physical transmon drive lines.' },
  { id: 'w10', name: 'Synapse W_10', source: 'Central Hub', target: 'vQPU Emulator', tensor: 'Native Basis Transpilation [RZ, SX, X, CZ]', description: 'Decomposes arbitrary unitary operations into target processor native Clifford+T gate basis.' },
  { id: 'w11', name: 'Synapse W_11', source: 'vQPU Emulator', target: 'QLDPC Decoder', tensor: 'Syndrome Extraction & BP-OSD Correction', description: 'Pumps stabilizer measurement syndromes into real-time belief propagation decoding.' },
  { id: 'w12', name: 'Synapse W_12', source: 'QLDPC Decoder', target: 'Central Hub', tensor: 'Logical Density Matrices & Error Rates', description: 'Closes the feedback loop by returning decoded logical state fidelity and error budgets.' }
];

export default function AlphaNeuralSchema() {
  const [selectedNode, setSelectedNode] = useState('hub');
  const [hoveredSynapse, setHoveredSynapse] = useState(null);
  const [layerFilter, setLayerFilter] = useState('all');

  const currentNode = NODES_DATA[selectedNode] || NODES_DATA.hub;

  return (
    <div className="neural-schema-container">
      {/* Top Filter Bar */}
      <div className="neural-filter-bar">
        <div className="neural-title-badge">
          <span className="neural-status-dot" />
          <span>Alpha Full-Stack Neural Schema // Product Interconnect</span>
        </div>

        {/* Layer Filters */}
        <div className="neural-filter-group">
          {[
            { id: 'all', label: 'Full Stack (W1-W12)' },
            { id: 'cognitive', label: 'Cognitive Layer' },
            { id: 'physical', label: 'Physical TCAD' },
            { id: 'hardware', label: 'Hardware vQPU' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLayerFilter(tab.id)}
              className={`neural-filter-btn ${layerFilter === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Neural Schema Canvas */}
      <div className="neural-canvas-card">
        <div className="neural-grid-backdrop" />

        <div className="neural-svg-scroll">
          <svg
            viewBox="0 0 1060 1340"
            className="neural-svg-graph"
            style={{ filter: 'drop-shadow(0 0 24px rgba(0,0,0,0.6))' }}
          >
            <defs>
              <marker id="ns-arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#00E5FF" />
              </marker>
              <marker id="ns-arrow-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
              </marker>
              <marker id="ns-arrow-white" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#94a3b8" />
              </marker>

              <linearGradient id="ns-grad-active" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#082f49" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0c1929" stopOpacity="0.98" />
              </linearGradient>
              <linearGradient id="ns-grad-default" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#161b22" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#0d1117" stopOpacity="0.98" />
              </linearGradient>
            </defs>

            {/* CONTAINER 1: Cognitive & Logical Layer */}
            <g opacity={layerFilter === 'all' || layerFilter === 'cognitive' ? 1 : 0.25} style={{ transition: 'opacity 0.25s ease' }}>
              <rect
                x="180"
                y="30"
                width="690"
                height="150"
                rx="10"
                fill="rgba(255, 255, 255, 0.015)"
                stroke="#374151"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              <text x="200" y="54" fill="#94a3b8" fontSize="12" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                Cognitive & Logical Layer (User Input & Gate Graphs)
              </text>

              {/* Notebook Engine */}
              <g
                onClick={() => setSelectedNode('notebook')}
                style={{ cursor: 'pointer' }}
                transform="translate(210, 68)"
              >
                <rect
                  width="290"
                  height="92"
                  rx="8"
                  fill={selectedNode === 'notebook' ? 'url(#ns-grad-active)' : 'url(#ns-grad-default)'}
                  stroke={selectedNode === 'notebook' ? '#00E5FF' : '#374151'}
                  strokeWidth={selectedNode === 'notebook' ? '2' : '1.2'}
                  filter={selectedNode === 'notebook' ? 'drop-shadow(0 0 12px rgba(0,229,255,0.4))' : 'none'}
                />
                <text x="145" y="40" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="bold">
                  Notebook Engine
                </text>
                <text x="145" y="64" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="JetBrains Mono, monospace">
                  Python SDK, VQE, QAOA
                </text>
              </g>

              {/* Composer Engine */}
              <g
                onClick={() => setSelectedNode('composer')}
                style={{ cursor: 'pointer' }}
                transform="translate(550, 68)"
              >
                <rect
                  width="290"
                  height="92"
                  rx="8"
                  fill={selectedNode === 'composer' ? 'url(#ns-grad-active)' : 'url(#ns-grad-default)'}
                  stroke={selectedNode === 'composer' ? '#00E5FF' : '#374151'}
                  strokeWidth={selectedNode === 'composer' ? '2' : '1.2'}
                  filter={selectedNode === 'composer' ? 'drop-shadow(0 0 12px rgba(0,229,255,0.4))' : 'none'}
                />
                <text x="145" y="40" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="bold">
                  Composer Engine
                </text>
                <text x="145" y="64" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="JetBrains Mono, monospace">
                  Gate DAG, Bloch Spheres, QASM
                </text>
              </g>
            </g>

            {/* SYNAPSES W_1 & W_2 */}
            <g onMouseEnter={() => setHoveredSynapse('w1')} onMouseLeave={() => setHoveredSynapse(null)}>
              <path
                d="M 355 160 L 355 240 L 430 240 L 430 300"
                fill="none"
                stroke={hoveredSynapse === 'w1' ? '#00E5FF' : '#4b5563'}
                strokeWidth={hoveredSynapse === 'w1' ? '2.5' : '1.8'}
                markerEnd="url(#ns-arrow-cyan)"
              />
              <rect x="235" y="228" width="240" height="24" rx="4" fill="#0d1117" stroke={hoveredSynapse === 'w1' ? '#00E5FF' : '#374151'} strokeWidth="1" />
              <text x="355" y="244" textAnchor="middle" fill={hoveredSynapse === 'w1' ? '#00E5FF' : '#e2e8f0'} fontSize="10.5" fontFamily="JetBrains Mono, monospace">
                Synapse W_1: Code Gen / Python Parsing
              </text>
            </g>

            <g onMouseEnter={() => setHoveredSynapse('w2')} onMouseLeave={() => setHoveredSynapse(null)}>
              <path
                d="M 695 160 L 695 240 L 620 240 L 620 300"
                fill="none"
                stroke={hoveredSynapse === 'w2' ? '#00E5FF' : '#4b5563'}
                strokeWidth={hoveredSynapse === 'w2' ? '2.5' : '1.8'}
                markerEnd="url(#ns-arrow-cyan)"
              />
              <rect x="580" y="228" width="245" height="24" rx="4" fill="#0d1117" stroke={hoveredSynapse === 'w2' ? '#00E5FF' : '#374151'} strokeWidth="1" />
              <text x="702" y="244" textAnchor="middle" fill={hoveredSynapse === 'w2' ? '#00E5FF' : '#e2e8f0'} fontSize="10.5" fontFamily="JetBrains Mono, monospace">
                Synapse W_2: QASM Import / Alpha-IR Export
              </text>
            </g>

            {/* CONTAINER 2: Central Neuromorphic Synaptic Hub */}
            <g>
              <rect
                x="260"
                y="275"
                width="530"
                height="130"
                rx="10"
                fill="rgba(255, 255, 255, 0.015)"
                stroke="#374151"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              <text x="280" y="297" fill="#94a3b8" fontSize="12" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                Central Neuromorphic Synaptic Hub (cross-product-bridge.js)
              </text>

              {/* Cross-Product Bridge Router */}
              <g
                onClick={() => setSelectedNode('hub')}
                style={{ cursor: 'pointer' }}
                transform="translate(300, 310)"
              >
                <rect
                  width="450"
                  height="78"
                  rx="8"
                  fill={selectedNode === 'hub' ? 'url(#ns-grad-active)' : 'url(#ns-grad-default)'}
                  stroke={selectedNode === 'hub' ? '#00E5FF' : '#374151'}
                  strokeWidth={selectedNode === 'hub' ? '2' : '1.2'}
                  filter={selectedNode === 'hub' ? 'drop-shadow(0 0 14px rgba(0,229,255,0.4))' : 'none'}
                />
                <text x="225" y="34" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="bold">
                  Cross-Product Bridge Router
                </text>
                <text x="225" y="58" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="JetBrains Mono, monospace">
                  Event Bus, LVS Engine, State Sync
                </text>
              </g>
            </g>

            {/* SYNAPSE W_7 */}
            <g onMouseEnter={() => setHoveredSynapse('w7')} onMouseLeave={() => setHoveredSynapse(null)}>
              <path
                d="M 300 350 L 90 350 L 90 114 L 205 114"
                fill="none"
                stroke={hoveredSynapse === 'w7' ? '#10b981' : '#6b7280'}
                strokeWidth={hoveredSynapse === 'w7' ? '2.5' : '1.8'}
                strokeDasharray="4 2"
                markerEnd="url(#ns-arrow-emerald)"
              />
              <rect x="15" y="390" width="235" height="24" rx="4" fill="#0d1117" stroke={hoveredSynapse === 'w7' ? '#10b981' : '#4b5563'} strokeWidth="1" />
              <text x="132" y="406" textAnchor="middle" fill={hoveredSynapse === 'w7' ? '#10b981' : '#a7f3d0'} fontSize="10" fontFamily="JetBrains Mono, monospace">
                Synapse W_7: Coupling Mask G=(V,E)
              </text>
            </g>

            {/* SYNAPSE W_10 */}
            <g onMouseEnter={() => setHoveredSynapse('w10')} onMouseLeave={() => setHoveredSynapse(null)}>
              <path
                d="M 750 350 L 970 350 L 970 855 L 775 855"
                fill="none"
                stroke={hoveredSynapse === 'w10' ? '#00E5FF' : '#4b5563'}
                strokeWidth={hoveredSynapse === 'w10' ? '2.5' : '1.8'}
                markerEnd="url(#ns-arrow-cyan)"
              />
              <rect x="730" y="810" width="230" height="24" rx="4" fill="#0d1117" stroke={hoveredSynapse === 'w10' ? '#00E5FF' : '#374151'} strokeWidth="1" />
              <text x="845" y="826" textAnchor="middle" fill={hoveredSynapse === 'w10' ? '#00E5FF' : '#e2e8f0'} fontSize="10" fontFamily="JetBrains Mono, monospace">
                Synapse W_10: Native Basis [RZ,SX,CZ]
              </text>
            </g>

            {/* SYNAPSES W_3, W_5, W_8 */}
            <g onMouseEnter={() => setHoveredSynapse('w3')} onMouseLeave={() => setHoveredSynapse(null)}>
              <path
                d="M 410 388 L 410 460 L 330 460 L 330 535"
                fill="none"
                stroke={hoveredSynapse === 'w3' ? '#00E5FF' : '#4b5563'}
                strokeWidth={hoveredSynapse === 'w3' ? '2.5' : '1.8'}
                markerEnd="url(#ns-arrow-cyan)"
              />
              <rect x="35" y="450" width="265" height="24" rx="4" fill="#0d1117" stroke={hoveredSynapse === 'w3' ? '#00E5FF' : '#374151'} strokeWidth="1" />
              <text x="167" y="466" textAnchor="middle" fill={hoveredSynapse === 'w3' ? '#00E5FF' : '#e2e8f0'} fontSize="10" fontFamily="JetBrains Mono, monospace">
                Synapse W_3: Conformal TCAD [C_Σ,E_J,E_C]
              </text>
            </g>

            <g onMouseEnter={() => setHoveredSynapse('w5')} onMouseLeave={() => setHoveredSynapse(null)}>
              <path
                d="M 525 388 L 525 535"
                fill="none"
                stroke={hoveredSynapse === 'w5' ? '#00E5FF' : '#4b5563'}
                strokeWidth={hoveredSynapse === 'w5' ? '2.5' : '1.8'}
                markerEnd="url(#ns-arrow-cyan)"
              />
              <rect x="315" y="450" width="275" height="24" rx="4" fill="#0d1117" stroke={hoveredSynapse === 'w5' ? '#00E5FF' : '#374151'} strokeWidth="1" />
              <text x="452" y="466" textAnchor="middle" fill={hoveredSynapse === 'w5' ? '#00E5FF' : '#e2e8f0'} fontSize="10" fontFamily="JetBrains Mono, monospace">
                Synapse W_5: Geometric WKT / 3D Stacking
              </text>
            </g>

            <g onMouseEnter={() => setHoveredSynapse('w8')} onMouseLeave={() => setHoveredSynapse(null)}>
              <path
                d="M 640 388 L 640 460 L 720 460 L 720 535"
                fill="none"
                stroke={hoveredSynapse === 'w8' ? '#00E5FF' : '#4b5563'}
                strokeWidth={hoveredSynapse === 'w8' ? '2.5' : '1.8'}
                markerEnd="url(#ns-arrow-cyan)"
              />
              <rect x="605" y="450" width="255" height="24" rx="4" fill="#0d1117" stroke={hoveredSynapse === 'w8' ? '#00E5FF' : '#374151'} strokeWidth="1" />
              <text x="732" y="466" textAnchor="middle" fill={hoveredSynapse === 'w8' ? '#00E5FF' : '#e2e8f0'} fontSize="10" fontFamily="JetBrains Mono, monospace">
                Synapse W_8: LVS Layout Rule Checks
              </text>
            </g>

            {/* CONTAINER 3: Physical TCAD & Full-Wave EM Layer */}
            <g opacity={layerFilter === 'all' || layerFilter === 'physical' ? 1 : 0.25} style={{ transition: 'opacity 0.25s ease' }}>
              <rect
                x="120"
                y="515"
                width="810"
                height="305"
                rx="10"
                fill="rgba(255, 255, 255, 0.015)"
                stroke="#374151"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              <text x="140" y="538" fill="#94a3b8" fontSize="12" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                Physical TCAD & Full-Wave EM Layer (Physics & Geometry)
              </text>

              {/* Schrödinger */}
              <g
                onClick={() => setSelectedNode('schrodinger')}
                style={{ cursor: 'pointer' }}
                transform="translate(150, 555)"
              >
                <rect
                  width="360"
                  height="80"
                  rx="8"
                  fill={selectedNode === 'schrodinger' ? 'url(#ns-grad-active)' : 'url(#ns-grad-default)'}
                  stroke={selectedNode === 'schrodinger' ? '#00E5FF' : '#374151'}
                  strokeWidth={selectedNode === 'schrodinger' ? '2' : '1.2'}
                  filter={selectedNode === 'schrodinger' ? 'drop-shadow(0 0 12px rgba(0,229,255,0.4))' : 'none'}
                />
                <text x="180" y="34" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="bold">
                  Analog Schrödinger Engine
                </text>
                <text x="180" y="58" textAnchor="middle" fill="#94a3b8" fontSize="11.5" fontFamily="JetBrains Mono, monospace">
                  TISE/TDSE, Potential Wells, H-Matrix
                </text>
              </g>

              {/* Silicon EDA */}
              <g
                onClick={() => setSelectedNode('eda')}
                style={{ cursor: 'pointer' }}
                transform="translate(540, 555)"
              >
                <rect
                  width="360"
                  height="80"
                  rx="8"
                  fill={selectedNode === 'eda' ? 'url(#ns-grad-active)' : 'url(#ns-grad-default)'}
                  stroke={selectedNode === 'eda' ? '#00E5FF' : '#374151'}
                  strokeWidth={selectedNode === 'eda' ? '2' : '1.2'}
                  filter={selectedNode === 'eda' ? 'drop-shadow(0 0 12px rgba(0,229,255,0.4))' : 'none'}
                />
                <text x="180" y="34" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="bold">
                  Silicon EDA 2D/3D Engine
                </text>
                <text x="180" y="58" textAnchor="middle" fill="#94a3b8" fontSize="11.5" fontFamily="JetBrains Mono, monospace">
                  Sub-Micron Layout, GDSII, WKT
                </text>
              </g>

              {/* Synapse W_4 */}
              <g onMouseEnter={() => setHoveredSynapse('w4')} onMouseLeave={() => setHoveredSynapse(null)}>
                <path
                  d="M 330 635 L 330 715"
                  fill="none"
                  stroke={hoveredSynapse === 'w4' ? '#00E5FF' : '#4b5563'}
                  strokeWidth={hoveredSynapse === 'w4' ? '2.5' : '1.8'}
                  markerEnd="url(#ns-arrow-cyan)"
                />
                <rect x="205" y="663" width="250" height="22" rx="4" fill="#0d1117" stroke={hoveredSynapse === 'w4' ? '#00E5FF' : '#374151'} strokeWidth="1" />
                <text x="330" y="678" textAnchor="middle" fill={hoveredSynapse === 'w4' ? '#00E5FF' : '#e2e8f0'} fontSize="10" fontFamily="JetBrains Mono, monospace">
                  Synapse W_4: Anharmonicity [α, ω_01] Calibration
                </text>
              </g>

              {/* Synapse W_6 */}
              <g onMouseEnter={() => setHoveredSynapse('w6')} onMouseLeave={() => setHoveredSynapse(null)}>
                <path
                  d="M 720 635 L 720 715"
                  fill="none"
                  stroke={hoveredSynapse === 'w6' ? '#00E5FF' : '#4b5563'}
                  strokeWidth={hoveredSynapse === 'w6' ? '2.5' : '1.8'}
                  markerEnd="url(#ns-arrow-cyan)"
                />
                <rect x="590" y="663" width="260" height="22" rx="4" fill="#0d1117" stroke={hoveredSynapse === 'w6' ? '#00E5FF' : '#374151'} strokeWidth="1" />
                <text x="720" y="678" textAnchor="middle" fill={hoveredSynapse === 'w6' ? '#00E5FF' : '#e2e8f0'} fontSize="10" fontFamily="JetBrains Mono, monospace">
                  Synapse W_6: Maxwell Field Singularity & EPR Loss
                </text>
              </g>

              {/* Pulse Engine */}
              <g
                onClick={() => setSelectedNode('pulse')}
                style={{ cursor: 'pointer' }}
                transform="translate(150, 720)"
              >
                <rect
                  width="360"
                  height="80"
                  rx="8"
                  fill={selectedNode === 'pulse' ? 'url(#ns-grad-active)' : 'url(#ns-grad-default)'}
                  stroke={selectedNode === 'pulse' ? '#00E5FF' : '#374151'}
                  strokeWidth={selectedNode === 'pulse' ? '2' : '1.2'}
                  filter={selectedNode === 'pulse' ? 'drop-shadow(0 0 12px rgba(0,229,255,0.4))' : 'none'}
                />
                <text x="180" y="34" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="bold">
                  Microwave Pulse Engine
                </text>
                <text x="180" y="58" textAnchor="middle" fill="#94a3b8" fontSize="11.5" fontFamily="JetBrains Mono, monospace">
                  DRAG Envelopes, Waveform Synthesis
                </text>
              </g>

              {/* HFSS Solver */}
              <g
                onClick={() => setSelectedNode('hfss')}
                style={{ cursor: 'pointer' }}
                transform="translate(540, 720)"
              >
                <rect
                  width="360"
                  height="80"
                  rx="8"
                  fill={selectedNode === 'hfss' ? 'url(#ns-grad-active)' : 'url(#ns-grad-default)'}
                  stroke={selectedNode === 'hfss' ? '#00E5FF' : '#374151'}
                  strokeWidth={selectedNode === 'hfss' ? '2' : '1.2'}
                  filter={selectedNode === 'hfss' ? 'drop-shadow(0 0 12px rgba(0,229,255,0.4))' : 'none'}
                />
                <text x="180" y="34" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="bold">
                  HFSS 3D EM Solver
                </text>
                <text x="180" y="58" textAnchor="middle" fill="#94a3b8" fontSize="11.5" fontFamily="JetBrains Mono, monospace">
                  S-Parameters, Smith Chart, EPR Loss
                </text>
              </g>
            </g>

            {/* SYNAPSE W_9 */}
            <g onMouseEnter={() => setHoveredSynapse('w9')} onMouseLeave={() => setHoveredSynapse(null)}>
              <path
                d="M 330 800 L 330 900 L 405 900"
                fill="none"
                stroke={hoveredSynapse === 'w9' ? '#00E5FF' : '#4b5563'}
                strokeWidth={hoveredSynapse === 'w9' ? '2.5' : '1.8'}
                markerEnd="url(#ns-arrow-cyan)"
              />
              <rect x="190" y="855" width="250" height="24" rx="4" fill="#0d1117" stroke={hoveredSynapse === 'w9' ? '#00E5FF' : '#374151'} strokeWidth="1" />
              <text x="315" y="871" textAnchor="middle" fill={hoveredSynapse === 'w9' ? '#00E5FF' : '#e2e8f0'} fontSize="10" fontFamily="JetBrains Mono, monospace">
                Synapse W_9: Calibrated Pulse Schedules [I(t),Q(t)]
              </text>
            </g>

            {/* CONTAINER 4: Hardware Execution & Decoder Layer */}
            <g opacity={layerFilter === 'all' || layerFilter === 'hardware' ? 1 : 0.25} style={{ transition: 'opacity 0.25s ease' }}>
              <rect
                x="370"
                y="850"
                width="430"
                height="300"
                rx="10"
                fill="rgba(255, 255, 255, 0.015)"
                stroke="#374151"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              <text x="390" y="874" fill="#94a3b8" fontSize="12" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                Hardware Execution & Decoder Layer (Fault-Tolerant vQPU)
              </text>

              {/* vQPU */}
              <g
                onClick={() => setSelectedNode('vqpu')}
                style={{ cursor: 'pointer' }}
                transform="translate(405, 895)"
              >
                <rect
                  width="360"
                  height="80"
                  rx="8"
                  fill={selectedNode === 'vqpu' ? 'url(#ns-grad-active)' : 'url(#ns-grad-default)'}
                  stroke={selectedNode === 'vqpu' ? '#00E5FF' : '#374151'}
                  strokeWidth={selectedNode === 'vqpu' ? '2' : '1.2'}
                  filter={selectedNode === 'vqpu' ? 'drop-shadow(0 0 12px rgba(0,229,255,0.4))' : 'none'}
                />
                <text x="180" y="34" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="bold">
                  vQPU Hardware Emulator
                </text>
                <text x="180" y="58" textAnchor="middle" fill="#94a3b8" fontSize="11.5" fontFamily="JetBrains Mono, monospace">
                  1100 Physical Transmons, Noise Channels
                </text>
              </g>

              {/* Synapse W_11 */}
              <g onMouseEnter={() => setHoveredSynapse('w11')} onMouseLeave={() => setHoveredSynapse(null)}>
                <path
                  d="M 585 975 L 585 1030"
                  fill="none"
                  stroke={hoveredSynapse === 'w11' ? '#00E5FF' : '#4b5563'}
                  strokeWidth={hoveredSynapse === 'w11' ? '2.5' : '1.8'}
                  markerEnd="url(#ns-arrow-cyan)"
                />
                <rect x="420" y="990" width="330" height="22" rx="4" fill="#0d1117" stroke={hoveredSynapse === 'w11' ? '#00E5FF' : '#374151'} strokeWidth="1" />
                <text x="585" y="1005" textAnchor="middle" fill={hoveredSynapse === 'w11' ? '#00E5FF' : '#e2e8f0'} fontSize="10" fontFamily="JetBrains Mono, monospace">
                  Synapse W_11: Syndrome Extraction & BP-OSD Correction
                </text>
              </g>

              {/* QLDPC */}
              <g
                onClick={() => setSelectedNode('qldpc')}
                style={{ cursor: 'pointer' }}
                transform="translate(405, 1035)"
              >
                <rect
                  width="360"
                  height="80"
                  rx="8"
                  fill={selectedNode === 'qldpc' ? 'url(#ns-grad-active)' : 'url(#ns-grad-default)'}
                  stroke={selectedNode === 'qldpc' ? '#00E5FF' : '#374151'}
                  strokeWidth={selectedNode === 'qldpc' ? '2' : '1.2'}
                  filter={selectedNode === 'qldpc' ? 'drop-shadow(0 0 12px rgba(0,229,255,0.4))' : 'none'}
                />
                <text x="180" y="34" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="bold">
                  QLDPC Decoder Engine
                </text>
                <text x="180" y="58" textAnchor="middle" fill="#94a3b8" fontSize="11.5" fontFamily="JetBrains Mono, monospace">
                  Bivariate Bicycle Codes, BP-OSD, d=16
                </text>
              </g>
            </g>

            {/* SYNAPSE W_12 */}
            <g onMouseEnter={() => setHoveredSynapse('w12')} onMouseLeave={() => setHoveredSynapse(null)}>
              <path
                d="M 585 1115 L 585 1200 L 1020 1200 L 1020 380 L 795 380"
                fill="none"
                stroke={hoveredSynapse === 'w12' ? '#10b981' : '#6b7280'}
                strokeWidth={hoveredSynapse === 'w12' ? '2.5' : '1.8'}
                strokeDasharray="4 2"
                markerEnd="url(#ns-arrow-emerald)"
              />
              <rect x="740" y="1185" width="270" height="24" rx="4" fill="#0d1117" stroke={hoveredSynapse === 'w12' ? '#10b981' : '#4b5563'} strokeWidth="1" />
              <text x="875" y="1201" textAnchor="middle" fill={hoveredSynapse === 'w12' ? '#10b981' : '#a7f3d0'} fontSize="10" fontFamily="JetBrains Mono, monospace">
                Synapse W_12: Logical Density Matrices & Error Rates
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Selected Engine Node Deep-Dive Inspector Panel */}
      <div className="neural-inspector-card">
        <div className="neural-inspector-header">
          <span className="neural-inspector-layer">{currentNode.layer} // INSPECTOR</span>
          <div className="neural-inspector-title-row">
            <h4 className="neural-inspector-title">{currentNode.title}</h4>
            <span className="neural-inspector-subtitle">{currentNode.subtitle}</span>
          </div>
        </div>

        <p className="neural-inspector-desc">{currentNode.description}</p>

        {currentNode.mathSpecs && (
          <div className="neural-specs-row">
            <span className="neural-section-label">Active Governing Physics & Operators:</span>
            <div className="neural-math-tags">
              {currentNode.mathSpecs.map((spec, i) => (
                <div key={i} className="neural-math-tag">
                  {spec}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="neural-specs-row" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.6rem' }}>
          <span className="neural-section-label">Synaptic Tensor Flow Matrix (Click or hover graph to inspect):</span>
          <div className="neural-synapse-grid">
            {SYNAPSES_DATA.map((syn) => (
              <div
                key={syn.id}
                onMouseEnter={() => setHoveredSynapse(syn.id)}
                onMouseLeave={() => setHoveredSynapse(null)}
                className={`neural-synapse-cell ${hoveredSynapse === syn.id ? 'active' : ''}`}
              >
                <div className="neural-synapse-top">
                  <span>{syn.name}</span>
                  <span style={{ color: '#8b949e' }}>{syn.source} → {syn.target}</span>
                </div>
                <div className="neural-synapse-tensor" title={syn.tensor}>
                  {syn.tensor}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

