"use client";

import React, { useState } from "react";

interface NodeData {
  id: string;
  title: string;
  subtitle: string;
  layer: string;
  description: string;
  mathSpecs?: string[];
  metrics?: { label: string; val: string }[];
}

interface SynapseData {
  id: string;
  name: string;
  source: string;
  target: string;
  tensor: string;
  description: string;
}

const NODES_DATA: Record<string, NodeData> = {
  notebook: {
    id: "notebook",
    title: "Notebook Engine",
    subtitle: "Python SDK, VQE, QAOA",
    layer: "Cognitive & Logical Layer",
    description: "Jupyter Python SDK environment executing variational quantum algorithms (VQE, QAOA), quantum chemistry Hamiltonians, and statevector diagnostics.",
    mathSpecs: ["|ψ(θ)⟩ = U(θ)|0⟩", "⟨H⟩ = ⟨ψ(θ)|H|ψ(θ)⟩", "∇_θ ⟨H⟩ via Parameter-Shift"],
    metrics: [{ label: "Max Qubits", val: "1,100" }, { label: "Runtime", val: "Python 3.10 / C++" }]
  },
  composer: {
    id: "composer",
    title: "Composer Engine",
    subtitle: "Gate DAG, Bloch Spheres, QASM",
    layer: "Cognitive & Logical Layer",
    description: "Visual quantum circuit composer with directed acyclic graph (DAG) gate routing, live Bloch sphere state vector projection, and OpenQASM 3.0 export.",
    mathSpecs: ["DAG G = (V, E_time)", "ρ_out = U ρ_in U†", "Tr[ρ] = 1, ρ ≥ 0"],
    metrics: [{ label: "Gate Library", val: "32 Gates" }, { label: "IR", val: "OpenQASM 3.0" }]
  },
  hub: {
    id: "hub",
    title: "Cross-Product Bridge Router",
    subtitle: "Event Bus, LVS Engine, State Sync",
    layer: "Central Neuromorphic Synaptic Hub",
    description: "High-speed cross-product event bus maintaining synchronized bi-directional state between logical gate DAGs, physical silicon layout, and pulse waveforms.",
    mathSpecs: ["LVS: G_schematic ≅ G_layout", "Latency: < 2.5 ms", "Cross-Domain Bus"],
    metrics: [{ label: "Bandwidth", val: "10 Gbps" }, { label: "State Sync", val: "Real-time" }]
  },
  schrodinger: {
    id: "schrodinger",
    title: "Analog Schrödinger Engine",
    subtitle: "TISE/TDSE, Potential Wells, H-Matrix",
    layer: "Physical TCAD & Full-Wave EM Layer",
    description: "Numerical eigensolver computing stationary and time-dependent Schrödinger solutions in multi-well Josephson potentials for exact charge-flux dispersion.",
    mathSpecs: ["H = 4E_C(n - n_g)^2 - E_J cos(φ)", "iℏ ∂ψ/∂t = H(t)ψ", "E_n, |ψ_n⟩ via FEM"],
    metrics: [{ label: "Levels Solved", val: "N = 6" }, { label: "Dispersion Err", val: "< 10^-5" }]
  },
  eda: {
    id: "eda",
    title: "Silicon EDA 2D/3D Engine",
    subtitle: "Sub-Micron Layout, GDSII, WKT",
    layer: "Physical TCAD & Full-Wave EM Layer",
    description: "Superconducting quantum EDA engine generating sub-micron CPW transmission lines, transmon capacitor pockets, airbridges, and multi-die flip-chip packages.",
    mathSpecs: ["GDSII Stream Format", "WKT Polygons / Paths", "Flip-Chip Die Alignment"],
    metrics: [{ label: "Precision", val: "1 nm" }, { label: "Layers", val: "Multi-Die 3D" }]
  },
  pulse: {
    id: "pulse",
    title: "Microwave Pulse Engine",
    subtitle: "DRAG Envelopes, Waveform Synthesis",
    layer: "Physical TCAD & Full-Wave EM Layer",
    description: "Derivative Removal by Adiabatic Gate (DRAG) microwave pulse synthesis eliminating qubit state leakage into transmon non-computational |2⟩ states.",
    mathSpecs: ["Ω(t) = s(t) + i (-ṡ(t) / α)", "Phase: θ(t) = ∫ Δ(τ) dτ", "Sample Rate: 2.4 GSa/s"],
    metrics: [{ label: "Gate Fidelity", val: "> 99.95%" }, { label: "Envelope", val: "Cos / Gaussian" }]
  },
  hfss: {
    id: "hfss",
    title: "HFSS 3D EM Solver",
    subtitle: "S-Parameters, Smith Chart, EPR Loss",
    layer: "Physical TCAD & Full-Wave EM Layer",
    description: "Full-wave finite-element Maxwell solver extracting multi-port S-parameters, quality factors, and Energy Participation Ratio (EPR) dielectric TLS loss.",
    mathSpecs: ["∇ × (μ_r^-1 ∇ × E) - k_0^2 ε_r E = 0", "p_m = E_participation / E_total", "Q_internal = 1 / Σ p_i tan δ_i"],
    metrics: [{ label: "EPR Precision", val: "0.01%" }, { label: "Mesh", val: "Conformal Tetrahedral" }]
  },
  vqpu: {
    id: "vqpu",
    title: "vQPU Hardware Emulator",
    subtitle: "1100 Physical Transmons, Noise Channels",
    layer: "Hardware Execution & Decoder Layer",
    description: "Full-scale physical transmon emulator modeling 1,100 superconducting qubits with Lindblad master equation decoherence, 1/f flux noise, and cross-talk.",
    mathSpecs: ["dρ/dt = -i[H, ρ] + Σ_k (L_k ρ L_k† - 1/2 {L_k† L_k, ρ})", "T1 / T2 Relaxation", "Readout Frequencies: 6-8 GHz"],
    metrics: [{ label: "Physical Qubits", val: "1,100" }, { label: "Noise Channels", val: "Amplitude + Phase" }]
  },
  qldpc: {
    id: "qldpc",
    title: "QLDPC Decoder Engine",
    subtitle: "Bivariate Bicycle Codes, BP-OSD, d=16",
    layer: "Hardware Execution & Decoder Layer",
    description: "Fault-tolerant Quantum Low-Density Parity-Check (QLDPC) decoder executing belief propagation with ordered statistics decoding (BP-OSD) at distance d=16.",
    mathSpecs: ["H_X · H_Z^T = 0 mod 2", "Syndrome: s = H_X · e", "Threshold: p_th = 0.85%"],
    metrics: [{ label: "Code Distance", val: "d = 16" }, { label: "Decoding Latency", val: "< 1.2 μs" }]
  }
};

const SYNAPSES_DATA: SynapseData[] = [
  { id: "w1", name: "Synapse W_1", source: "Notebook", target: "Central Hub", tensor: "Code Gen / Python Parsing", description: "Transpiles Python VQE/QAOA algorithms into intermediate quantum representations." },
  { id: "w2", name: "Synapse W_2", source: "Composer", target: "Central Hub", tensor: "QASM Import / Alpha-IR Export", description: "Serializes visual gate circuits into standardized Alpha-IR and QASM payloads." },
  { id: "w3", name: "Synapse W_3", source: "Central Hub", target: "Analog Engine", tensor: "Conformal TCAD Extraction [C_Σ, E_J, E_C]", description: "Extracts capacitance matrices, Josephson energies, and charging energies." },
  { id: "w4", name: "Synapse W_4", source: "Analog Engine", target: "Pulse Engine", tensor: "Anharmonicity [α, ω_01] Calibration", description: "Feeds transmon anharmonicity and 01 transition frequencies into DRAG envelope calculators." },
  { id: "w5", name: "Synapse W_5", source: "Central Hub", target: "Silicon EDA", tensor: "Geometric WKT / Layer Stack / 3D Stacking", description: "Transmits geometric geometries, wafer stack parameters, and 3D flip-chip bump coordinates." },
  { id: "w6", name: "Synapse W_6", source: "Silicon EDA", target: "HFSS Solver", tensor: "Maxwell Field Singularity & EPR Loss", description: "Provides physical conductor edges and dielectric boundaries for full-wave meshing." },
  { id: "w7", name: "Synapse W_7", source: "Central Hub", target: "Cognitive Layer", tensor: "Physical Coupling Adjacency Mask G=(V,E)", description: "Feedback line passing physical QPU connectivity graph constraints back to algorithms." },
  { id: "w8", name: "Synapse W_8", source: "Central Hub", target: "HFSS Solver", tensor: "LVS Layout-vs-Schematic Rule Checks", description: "Validates layout connectivity against schematic netlists before electromagnetic solve." },
  { id: "w9", name: "Synapse W_9", source: "Pulse Engine", target: "vQPU Emulator", tensor: "Calibrated Pulse Schedules [I(t), Q(t)]", description: "Streams sub-nanosecond I/Q microwave waveforms to physical transmon drive lines." },
  { id: "w10", name: "Synapse W_10", source: "Central Hub", target: "vQPU Emulator", tensor: "Native Basis Transpilation [RZ, SX, X, CZ]", description: "Decomposes arbitrary unitary operations into target processor native Clifford+T gate basis." },
  { id: "w11", name: "Synapse W_11", source: "vQPU Emulator", target: "QLDPC Decoder", tensor: "Syndrome Extraction & BP-OSD Correction", description: "Pumps stabilizer measurement syndromes into real-time belief propagation decoding." },
  { id: "w12", name: "Synapse W_12", source: "QLDPC Decoder", target: "Central Hub", tensor: "Logical Density Matrices & Error Rates", description: "Closes the feedback loop by returning decoded logical state fidelity and error budgets." }
];

export const AlphaNeuralSchema: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string>("hub");
  const [hoveredSynapse, setHoveredSynapse] = useState<string | null>(null);
  const [hoveredPreview, setHoveredPreview] = useState<string | null>(null);
  const [layerFilter, setLayerFilter] = useState<"all" | "cognitive" | "physical" | "hardware">("all");

  return (
    <div className="w-full space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-electric-cyan animate-pulse shadow-[0_0_10px_#00E5FF]" />
          <span className="text-xs font-mono text-white/90 uppercase tracking-widest font-semibold">
            Alpha Full-Stack Neural Schema // Product Interconnect
          </span>
        </div>

        {/* Layer Filters */}
        <div className="flex items-center space-x-1.5 bg-black/60 p-1 rounded-xl border border-white/[0.08]">
          {[
            { id: "all", label: "Full Stack (W1-W12)" },
            { id: "cognitive", label: "Cognitive Layer" },
            { id: "physical", label: "Physical TCAD" },
            { id: "hardware", label: "Hardware vQPU" }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLayerFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                layerFilter === tab.id
                  ? "bg-[#3B0A6B] text-white border border-[#00E5FF]/40 shadow-[0_0_14px_rgba(0,229,255,0.25)] font-semibold"
                  : "text-white/60 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Neural Schema Canvas - Borderless Seamless Surface */}
      <div className="relative w-full overflow-hidden bg-transparent">
        {/* Vector Neural Architecture Graph */}
        <div className="relative w-full overflow-x-auto overflow-y-hidden">
          <svg
            viewBox="0 0 1060 1220"
            className="w-full h-auto min-w-[760px] select-none block"
          >
            <defs>
              {/* Arrow Marker Definitions */}
              <marker id="arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 2 L 7 5 L 0 8 z" fill="#00e5ff" />
              </marker>
              <marker id="arrow-violet" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 2 L 7 5 L 0 8 z" fill="#c084fc" />
              </marker>
              <marker id="arrow-white" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 2 L 7 5 L 0 8 z" fill="#94a3b8" />
              </marker>

              {/* Glowing Gradients */}
              <linearGradient id="grad-node-active" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2e1065" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#170d30" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="grad-node-default" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#12151c" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#0b0e14" stopOpacity="0.98" />
              </linearGradient>

              {/* Deep Neutral Shadow (No colored glow) */}
              <filter id="shadow-preview-neutral" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000000" floodOpacity="0.85" />
                <feDropShadow dx="0" dy="24" stdDeviation="30" floodColor="#000000" floodOpacity="0.95" />
              </filter>
            </defs>

            {/* CONTAINER 1: Cognitive & Logical Layer (User Input & Gate Graphs) */}
            <g opacity={layerFilter === "all" || layerFilter === "cognitive" ? 1 : 0.25} className="transition-opacity duration-300">
              <rect
                x="180"
                y="30"
                width="690"
                height="145"
                rx="4"
                fill="rgba(255, 255, 255, 0.01)"
                stroke="#27272a"
                strokeWidth="1"
              />
              <text x="525" y="50" textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="500">
                Cognitive &amp; Logical Layer (User Input &amp; Gate Graphs)
              </text>

              {/* Notebook Engine Card */}
              <g
                onClick={() => setSelectedNode("notebook")}
                onMouseEnter={() => setHoveredPreview("notebook")}
                onMouseLeave={() => setHoveredPreview(null)}
                className="cursor-pointer group"
                transform="translate(205, 65)"
              >
                <rect
                  width="295"
                  height="88"
                  rx="4"
                  fill={selectedNode === "notebook" ? "url(#grad-node-active)" : "url(#grad-node-default)"}
                  stroke={selectedNode === "notebook" ? "#00E5FF" : "#2d3340"}
                  strokeWidth={selectedNode === "notebook" ? "1.5" : "1"}
                  filter={selectedNode === "notebook" ? "drop-shadow(0 0 10px rgba(0,229,255,0.35))" : "none"}
                />
                <text x="147" y="38" textAnchor="middle" fill="#ffffff" fontSize="12.5" fontWeight="600" fontFamily="system-ui, -apple-system, sans-serif">
                  Notebook Engine
                </text>
                <text x="147" y="60" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="system-ui, -apple-system, sans-serif">
                  Python SDK, VQE, QAOA
                </text>
              </g>

              {/* Composer Engine Card */}
              <g
                onClick={() => setSelectedNode("composer")}
                onMouseEnter={() => setHoveredPreview("composer")}
                onMouseLeave={() => setHoveredPreview(null)}
                className="cursor-pointer group"
                transform="translate(545, 65)"
              >
                <rect
                  width="295"
                  height="88"
                  rx="4"
                  fill={selectedNode === "composer" ? "url(#grad-node-active)" : "url(#grad-node-default)"}
                  stroke={selectedNode === "composer" ? "#00E5FF" : "#2d3340"}
                  strokeWidth={selectedNode === "composer" ? "1.5" : "1"}
                  filter={selectedNode === "composer" ? "drop-shadow(0 0 10px rgba(0,229,255,0.35))" : "none"}
                />
                <text x="147" y="38" textAnchor="middle" fill="#ffffff" fontSize="12.5" fontWeight="600" fontFamily="system-ui, -apple-system, sans-serif">
                  Composer Engine
                </text>
                <text x="147" y="60" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="system-ui, -apple-system, sans-serif">
                  Gate DAG, Bloch Spheres, QASM
                </text>
              </g>
            </g>

            {/* SYNAPSE W_1: Notebook -> Hub */}
            <g onMouseEnter={() => setHoveredSynapse("w1")} onMouseLeave={() => setHoveredSynapse(null)}>
              <path
                d="M 352 153 L 352 230 L 430 230 L 430 290"
                fill="none"
                stroke={hoveredSynapse === "w1" ? "#00e5ff" : "#4b5563"}
                strokeWidth="1.2"
                markerEnd="url(#arrow-cyan)"
              />
              <rect x="245" y="220" width="215" height="20" rx="3" fill="#0d1117" stroke="#374151" strokeWidth="1" />
              <text x="352" y="234" textAnchor="middle" fill="#e2e8f0" fontSize="9.5" fontFamily="system-ui, -apple-system, sans-serif">
                Synapse W_1: Code Gen / Python Parsing
              </text>
            </g>

            {/* SYNAPSE W_2: Composer -> Hub */}
            <g onMouseEnter={() => setHoveredSynapse("w2")} onMouseLeave={() => setHoveredSynapse(null)}>
              <path
                d="M 692 153 L 692 230 L 620 230 L 620 290"
                fill="none"
                stroke={hoveredSynapse === "w2" ? "#00e5ff" : "#4b5563"}
                strokeWidth="1.2"
                markerEnd="url(#arrow-cyan)"
              />
              <rect x="585" y="220" width="215" height="20" rx="3" fill="#0d1117" stroke="#374151" strokeWidth="1" />
              <text x="692" y="234" textAnchor="middle" fill="#e2e8f0" fontSize="9.5" fontFamily="system-ui, -apple-system, sans-serif">
                Synapse W_2: QASM Import / Alpha-IR Export
              </text>
            </g>

            {/* CONTAINER 2: Central Neuromorphic Synaptic Hub */}
            <g className="transition-opacity duration-300">
              <rect
                x="260"
                y="265"
                width="530"
                height="125"
                rx="4"
                fill="rgba(255, 255, 255, 0.01)"
                stroke="#27272a"
                strokeWidth="1"
              />
              <text x="525" y="285" textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="500">
                Central Neuromorphic Synaptic Hub (cross-product-bridge.js)
              </text>

              {/* Cross-Product Bridge Router Card */}
              <g
                onClick={() => setSelectedNode("hub")}
                onMouseEnter={() => setHoveredPreview("hub")}
                onMouseLeave={() => setHoveredPreview(null)}
                className="cursor-pointer group"
                transform="translate(295, 298)"
              >
                <rect
                  width="460"
                  height="76"
                  rx="4"
                  fill={selectedNode === "hub" ? "url(#grad-node-active)" : "url(#grad-node-default)"}
                  stroke={selectedNode === "hub" ? "#00E5FF" : "#2d3340"}
                  strokeWidth={selectedNode === "hub" ? "1.5" : "1"}
                  filter={selectedNode === "hub" ? "drop-shadow(0 0 12px rgba(0,229,255,0.35))" : "none"}
                />
                <text x="230" y="32" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="600" fontFamily="system-ui, -apple-system, sans-serif">
                  Cross-Product Bridge Router
                </text>
                <text x="230" y="54" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="system-ui, -apple-system, sans-serif">
                  Event Bus, LVS Engine, State Sync
                </text>
              </g>
            </g>

            {/* SYNAPSE W_7: Feedback to Cognitive Layer */}
            <g onMouseEnter={() => setHoveredSynapse("w7")} onMouseLeave={() => setHoveredSynapse(null)}>
              <path
                d="M 295 336 L 90 336 L 90 109 L 205 109"
                fill="none"
                stroke={hoveredSynapse === "w7" ? "#c084fc" : "#6b7280"}
                strokeWidth="1.2"
                strokeDasharray="4 2"
                markerEnd="url(#arrow-violet)"
              />
              <rect x="25" y="380" width="225" height="20" rx="3" fill="#0d1117" stroke="#4b5563" strokeWidth="1" />
              <text x="137" y="394" textAnchor="middle" fill="#c084fc" fontSize="9.5" fontFamily="system-ui, -apple-system, sans-serif">
                Synapse W_7: Physical Coupling Adjacency Mask G=(V,E)
              </text>
            </g>

            {/* SYNAPSE W_10: Native Basis Transpilation Bypass to Hardware */}
            <g onMouseEnter={() => setHoveredSynapse("w10")} onMouseLeave={() => setHoveredSynapse(null)}>
              <path
                d="M 755 336 L 970 336 L 970 845 L 775 845"
                fill="none"
                stroke={hoveredSynapse === "w10" ? "#00e5ff" : "#4b5563"}
                strokeWidth="1.2"
                markerEnd="url(#arrow-cyan)"
              />
              <rect x="740" y="795" width="230" height="20" rx="3" fill="#0d1117" stroke="#374151" strokeWidth="1" />
              <text x="855" y="809" textAnchor="middle" fill="#e2e8f0" fontSize="9.5" fontFamily="system-ui, -apple-system, sans-serif">
                Synapse W_10: Native Basis Transpilation [RZ, SX, X, CZ]
              </text>
            </g>

            {/* SYNAPSES W_3, W_5, W_8: Central Hub down to Physical Layer */}
            {/* Synapse W_3: Hub -> Analog Schrödinger */}
            <g onMouseEnter={() => setHoveredSynapse("w3")} onMouseLeave={() => setHoveredSynapse(null)}>
              <path
                d="M 410 374 L 410 445 L 330 445 L 330 520"
                fill="none"
                stroke={hoveredSynapse === "w3" ? "#00e5ff" : "#4b5563"}
                strokeWidth="1.2"
                markerEnd="url(#arrow-cyan)"
              />
              <rect x="40" y="435" width="250" height="20" rx="3" fill="#0d1117" stroke="#374151" strokeWidth="1" />
              <text x="165" y="449" textAnchor="middle" fill="#e2e8f0" fontSize="9.5" fontFamily="system-ui, -apple-system, sans-serif">
                Synapse W_3: Conformal TCAD Extraction [C_Σ, E_J, E_C]
              </text>
            </g>

            {/* Synapse W_5: Hub -> Silicon EDA */}
            <g onMouseEnter={() => setHoveredSynapse("w5")} onMouseLeave={() => setHoveredSynapse(null)}>
              <path
                d="M 525 374 L 525 520"
                fill="none"
                stroke={hoveredSynapse === "w5" ? "#00e5ff" : "#4b5563"}
                strokeWidth="1.2"
                markerEnd="url(#arrow-cyan)"
              />
              <rect x="315" y="435" width="265" height="20" rx="3" fill="#0d1117" stroke="#374151" strokeWidth="1" />
              <text x="447" y="449" textAnchor="middle" fill="#e2e8f0" fontSize="9.5" fontFamily="system-ui, -apple-system, sans-serif">
                Synapse W_5: Geometric WKT / Layer Stack / 3D Stacking
              </text>
            </g>

            {/* Synapse W_8: Hub -> HFSS Rule Checks */}
            <g onMouseEnter={() => setHoveredSynapse("w8")} onMouseLeave={() => setHoveredSynapse(null)}>
              <path
                d="M 640 374 L 640 445 L 720 445 L 720 520"
                fill="none"
                stroke={hoveredSynapse === "w8" ? "#00e5ff" : "#4b5563"}
                strokeWidth="1.2"
                markerEnd="url(#arrow-cyan)"
              />
              <rect x="605" y="435" width="245" height="20" rx="3" fill="#0d1117" stroke="#374151" strokeWidth="1" />
              <text x="727" y="449" textAnchor="middle" fill="#e2e8f0" fontSize="9.5" fontFamily="system-ui, -apple-system, sans-serif">
                Synapse W_8: LVS Layout-vs-Schematic Rule Checks
              </text>
            </g>

            {/* CONTAINER 3: Physical TCAD & Full-Wave EM Layer (Physics & Geometry) */}
            <g opacity={layerFilter === "all" || layerFilter === "physical" ? 1 : 0.25} className="transition-opacity duration-300">
              <rect
                x="120"
                y="495"
                width="810"
                height="305"
                rx="4"
                fill="rgba(255, 255, 255, 0.01)"
                stroke="#27272a"
                strokeWidth="1"
              />
              <text x="525" y="515" textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="500">
                Physical TCAD &amp; Full-Wave EM Layer (Physics &amp; Geometry)
              </text>

              {/* Row 1 Left: Analog Schrödinger Engine */}
              <g
                onClick={() => setSelectedNode("schrodinger")}
                onMouseEnter={() => setHoveredPreview("schrodinger")}
                onMouseLeave={() => setHoveredPreview(null)}
                className="cursor-pointer group"
                transform="translate(150, 532)"
              >
                <rect
                  width="360"
                  height="76"
                  rx="4"
                  fill={selectedNode === "schrodinger" ? "url(#grad-node-active)" : "url(#grad-node-default)"}
                  stroke={selectedNode === "schrodinger" ? "#00E5FF" : "#2d3340"}
                  strokeWidth={selectedNode === "schrodinger" ? "1.5" : "1"}
                  filter={selectedNode === "schrodinger" ? "drop-shadow(0 0 10px rgba(0,229,255,0.35))" : "none"}
                />
                <text x="180" y="32" textAnchor="middle" fill="#ffffff" fontSize="12.5" fontWeight="600" fontFamily="system-ui, -apple-system, sans-serif">
                  Analog Schrödinger Engine
                </text>
                <text x="180" y="54" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="system-ui, -apple-system, sans-serif">
                  TISE/TDSE, Potential Wells, H-Matrix
                </text>
              </g>

              {/* Row 1 Right: Silicon EDA 2D/3D Engine */}
              <g
                onClick={() => setSelectedNode("eda")}
                onMouseEnter={() => setHoveredPreview("eda")}
                onMouseLeave={() => setHoveredPreview(null)}
                className="cursor-pointer group"
                transform="translate(540, 532)"
              >
                <rect
                  width="360"
                  height="76"
                  rx="4"
                  fill={selectedNode === "eda" ? "url(#grad-node-active)" : "url(#grad-node-default)"}
                  stroke={selectedNode === "eda" ? "#00E5FF" : "#2d3340"}
                  strokeWidth={selectedNode === "eda" ? "1.5" : "1"}
                  filter={selectedNode === "eda" ? "drop-shadow(0 0 10px rgba(0,229,255,0.35))" : "none"}
                />
                <text x="180" y="32" textAnchor="middle" fill="#ffffff" fontSize="12.5" fontWeight="600" fontFamily="system-ui, -apple-system, sans-serif">
                  Silicon EDA 2D/3D Engine
                </text>
                <text x="180" y="54" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="system-ui, -apple-system, sans-serif">
                  Sub-Micron Layout, GDSII, WKT
                </text>
              </g>

              {/* Synapse W_4: Schrödinger -> Microwave Pulse */}
              <g onMouseEnter={() => setHoveredSynapse("w4")} onMouseLeave={() => setHoveredSynapse(null)}>
                <path
                  d="M 330 608 L 330 695"
                  fill="none"
                  stroke={hoveredSynapse === "w4" ? "#00e5ff" : "#4b5563"}
                  strokeWidth="1.2"
                  markerEnd="url(#arrow-cyan)"
                />
                <rect x="205" y="642" width="250" height="20" rx="3" fill="#0d1117" stroke="#374151" strokeWidth="1" />
                <text x="330" y="656" textAnchor="middle" fill="#e2e8f0" fontSize="9.5" fontFamily="system-ui, -apple-system, sans-serif">
                  Synapse W_4: Anharmonicity [α, ω_01] Calibration
                </text>
              </g>

              {/* Synapse W_6: Silicon EDA -> HFSS Solver */}
              <g onMouseEnter={() => setHoveredSynapse("w6")} onMouseLeave={() => setHoveredSynapse(null)}>
                <path
                  d="M 720 608 L 720 695"
                  fill="none"
                  stroke={hoveredSynapse === "w6" ? "#00e5ff" : "#4b5563"}
                  strokeWidth="1.2"
                  markerEnd="url(#arrow-cyan)"
                />
                <rect x="590" y="642" width="260" height="20" rx="3" fill="#0d1117" stroke="#374151" strokeWidth="1" />
                <text x="720" y="656" textAnchor="middle" fill="#e2e8f0" fontSize="9.5" fontFamily="system-ui, -apple-system, sans-serif">
                  Synapse W_6: Maxwell Field Singularity &amp; EPR Loss
                </text>
              </g>

              {/* Row 2 Left: Microwave Pulse Engine */}
              <g
                onClick={() => setSelectedNode("pulse")}
                className="cursor-pointer group"
                transform="translate(150, 700)"
              >
                <rect
                  width="360"
                  height="76"
                  rx="4"
                  fill={selectedNode === "pulse" ? "url(#grad-node-active)" : "url(#grad-node-default)"}
                  stroke={selectedNode === "pulse" ? "#00E5FF" : "#2d3340"}
                  strokeWidth={selectedNode === "pulse" ? "1.5" : "1"}
                  filter={selectedNode === "pulse" ? "drop-shadow(0 0 10px rgba(0,229,255,0.35))" : "none"}
                />
                <text x="180" y="32" textAnchor="middle" fill="#ffffff" fontSize="12.5" fontWeight="600" fontFamily="system-ui, -apple-system, sans-serif">
                  Microwave Pulse Engine
                </text>
                <text x="180" y="54" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="system-ui, -apple-system, sans-serif">
                  DRAG Envelopes, Waveform Synthesis
                </text>
              </g>

              {/* Row 2 Right: HFSS 3D EM Solver */}
              <g
                onClick={() => setSelectedNode("hfss")}
                onMouseEnter={() => setHoveredPreview("hfss")}
                onMouseLeave={() => setHoveredPreview(null)}
                className="cursor-pointer group"
                transform="translate(540, 700)"
              >
                <rect
                  width="360"
                  height="76"
                  rx="4"
                  fill={selectedNode === "hfss" ? "url(#grad-node-active)" : "url(#grad-node-default)"}
                  stroke={selectedNode === "hfss" ? "#00E5FF" : "#2d3340"}
                  strokeWidth={selectedNode === "hfss" ? "1.5" : "1"}
                  filter={selectedNode === "hfss" ? "drop-shadow(0 0 10px rgba(0,229,255,0.35))" : "none"}
                />
                <text x="180" y="32" textAnchor="middle" fill="#ffffff" fontSize="12.5" fontWeight="600" fontFamily="system-ui, -apple-system, sans-serif">
                  HFSS 3D EM Solver
                </text>
                <text x="180" y="54" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="system-ui, -apple-system, sans-serif">
                  S-Parameters, Smith Chart, EPR Loss
                </text>
              </g>
            </g>

            {/* SYNAPSE W_9: Pulse Engine down to Hardware vQPU */}
            <g onMouseEnter={() => setHoveredSynapse("w9")} onMouseLeave={() => setHoveredSynapse(null)}>
              <path
                d="M 330 776 L 330 855 L 405 855"
                fill="none"
                stroke={hoveredSynapse === "w9" ? "#00e5ff" : "#4b5563"}
                strokeWidth="1.2"
                markerEnd="url(#arrow-cyan)"
              />
              <rect x="185" y="845" width="250" height="20" rx="3" fill="#0d1117" stroke="#374151" strokeWidth="1" />
              <text x="310" y="859" textAnchor="middle" fill="#e2e8f0" fontSize="9.5" fontFamily="system-ui, -apple-system, sans-serif">
                Synapse W_9: Calibrated Pulse Schedules [I(t), Q(t)]
              </text>
            </g>

            {/* CONTAINER 4: Hardware Execution & Decoder Layer (Fault-Tolerant vQPU) */}
            <g opacity={layerFilter === "all" || layerFilter === "hardware" ? 1 : 0.25} className="transition-opacity duration-300">
              <rect
                x="370"
                y="815"
                width="430"
                height="285"
                rx="4"
                fill="rgba(255, 255, 255, 0.01)"
                stroke="#27272a"
                strokeWidth="1"
              />
              <text x="585" y="835" textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="500">
                Hardware Execution &amp; Decoder Layer (Fault-Tolerant vQPU)
              </text>

              {/* vQPU Hardware Emulator Card */}
              <g
                onClick={() => setSelectedNode("vqpu")}
                className="cursor-pointer group"
                transform="translate(405, 852)"
              >
                <rect
                  width="360"
                  height="76"
                  rx="4"
                  fill={selectedNode === "vqpu" ? "url(#grad-node-active)" : "url(#grad-node-default)"}
                  stroke={selectedNode === "vqpu" ? "#00E5FF" : "#2d3340"}
                  strokeWidth={selectedNode === "vqpu" ? "1.5" : "1"}
                  filter={selectedNode === "vqpu" ? "drop-shadow(0 0 10px rgba(0,229,255,0.35))" : "none"}
                />
                <text x="180" y="32" textAnchor="middle" fill="#ffffff" fontSize="12.5" fontWeight="600" fontFamily="system-ui, -apple-system, sans-serif">
                  vQPU Hardware Emulator
                </text>
                <text x="180" y="54" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="system-ui, -apple-system, sans-serif">
                  1100 Physical Transmons, Noise Channels
                </text>
              </g>

              {/* Synapse W_11: vQPU -> QLDPC Decoder */}
              <g onMouseEnter={() => setHoveredSynapse("w11")} onMouseLeave={() => setHoveredSynapse(null)}>
                <path
                  d="M 585 928 L 585 990"
                  fill="none"
                  stroke={hoveredSynapse === "w11" ? "#00e5ff" : "#4b5563"}
                  strokeWidth="1.2"
                  markerEnd="url(#arrow-cyan)"
                />
                <rect x="420" y="950" width="330" height="20" rx="3" fill="#0d1117" stroke="#374151" strokeWidth="1" />
                <text x="585" y="964" textAnchor="middle" fill="#e2e8f0" fontSize="9.5" fontFamily="system-ui, -apple-system, sans-serif">
                  Synapse W_11: Syndrome Extraction &amp; BP-OSD Correction
                </text>
              </g>

              {/* QLDPC Decoder Engine Card */}
              <g
                onClick={() => setSelectedNode("qldpc")}
                className="cursor-pointer group"
                transform="translate(405, 998)"
              >
                <rect
                  width="360"
                  height="76"
                  rx="4"
                  fill={selectedNode === "qldpc" ? "url(#grad-node-active)" : "url(#grad-node-default)"}
                  stroke={selectedNode === "qldpc" ? "#00E5FF" : "#2d3340"}
                  strokeWidth={selectedNode === "qldpc" ? "1.5" : "1"}
                  filter={selectedNode === "qldpc" ? "drop-shadow(0 0 10px rgba(0,229,255,0.35))" : "none"}
                />
                <text x="180" y="32" textAnchor="middle" fill="#ffffff" fontSize="12.5" fontWeight="600" fontFamily="system-ui, -apple-system, sans-serif">
                  QLDPC Decoder Engine
                </text>
                <text x="180" y="54" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="system-ui, -apple-system, sans-serif">
                  Bivariate Bicycle Codes, BP-OSD, d=16
                </text>
              </g>
            </g>

            {/* SYNAPSE W_12: Feedback from QLDPC Decoder back into System */}
            <g onMouseEnter={() => setHoveredSynapse("w12")} onMouseLeave={() => setHoveredSynapse(null)}>
              <path
                d="M 585 1074 L 585 1145 L 1020 1145 L 1020 336 L 755 336"
                fill="none"
                stroke={hoveredSynapse === "w12" ? "#c084fc" : "#6b7280"}
                strokeWidth="1.2"
                strokeDasharray="4 2"
                markerEnd="url(#arrow-violet)"
              />
              <rect x="740" y="1135" width="270" height="20" rx="3" fill="#0d1117" stroke="#4b5563" strokeWidth="1" />
              <text x="875" y="1149" textAnchor="middle" fill="#c084fc" fontSize="9.5" fontFamily="system-ui, -apple-system, sans-serif">
                Synapse W_12: Logical Density Matrices &amp; Error Rates
              </text>
            </g>

            {/* ========================================================================= */}
            {/* HOVER PREVIEWS FOR THE 5 USER-SPECIFIED PRODUCTS                          */}
            {/* 1. Notebook (shows small picture on LEFT)                                 */}
            {/* 2. Composer (shows small picture on RIGHT)                                */}
            {/* 3. Bridge (shows bridge picture below bridge router)                      */}
            {/* 4. Analog (shows picture on LEFT)                                         */}
            {/* 5. EDA (shows picture on RIGHT)                                           */}
            {/* ========================================================================= */}

            {/* 1. NOTEBOOK PREVIEW (LEFT SIDE - FULLY VISIBLE, NEUTRAL BORDER) */}
            <g
              className="pointer-events-none"
              opacity={hoveredPreview === "notebook" ? 1 : 0}
              transform={`translate(${hoveredPreview === "notebook" ? 10 : -6}, 14)`}
              style={{ transition: "opacity 0.22s ease, transform 0.22s ease" }}
            >
              <rect
                width="340"
                height="226"
                rx="8"
                fill="#0b0e14"
                stroke="#27272a"
                strokeWidth="1"
                filter="url(#shadow-preview-neutral)"
              />
              <rect x="8" y="8" width="150" height="17" rx="3" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="0.8" />
              <text x="83" y="20" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace" fontWeight="bold">
                QUANTUM NOTEBOOK
              </text>
              <g transform="translate(8, 33)">
                <image
                  href="/previews/preview-notebook.jpg"
                  width="324"
                  height="184"
                  preserveAspectRatio="none"
                />
                <rect width="324" height="184" rx="4" fill="none" stroke="#27272a" strokeWidth="1" />
              </g>
            </g>

            {/* 2. COMPOSER PREVIEW (RIGHT SIDE - FULLY VISIBLE, NEUTRAL BORDER) */}
            <g
              className="pointer-events-none"
              opacity={hoveredPreview === "composer" ? 1 : 0}
              transform={`translate(${hoveredPreview === "composer" ? 705 : 720}, 14)`}
              style={{ transition: "opacity 0.22s ease, transform 0.22s ease" }}
            >
              <rect
                width="340"
                height="226"
                rx="8"
                fill="#0b0e14"
                stroke="#27272a"
                strokeWidth="1"
                filter="url(#shadow-preview-neutral)"
              />
              <rect x="8" y="8" width="150" height="17" rx="3" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="0.8" />
              <text x="83" y="20" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace" fontWeight="bold">
                QUANTUM COMPOSER
              </text>
              <g transform="translate(8, 33)">
                <image
                  href="/previews/preview-composer.jpg"
                  width="324"
                  height="184"
                  preserveAspectRatio="none"
                />
                <rect width="324" height="184" rx="4" fill="none" stroke="#27272a" strokeWidth="1" />
              </g>
            </g>

            {/* 3. BRIDGE PREVIEW (BELOW BRIDGE ROUTER - FULLY VISIBLE, NEUTRAL BORDER) */}
            <g
              className="pointer-events-none"
              opacity={hoveredPreview === "hub" ? 1 : 0}
              transform={`translate(240, ${hoveredPreview === "hub" ? 392 : 382})`}
              style={{ transition: "opacity 0.22s ease, transform 0.22s ease" }}
            >
              <rect
                width="580"
                height="78"
                rx="8"
                fill="#0b0e14"
                stroke="#27272a"
                strokeWidth="1"
                filter="url(#shadow-preview-neutral)"
              />
              <rect x="8" y="6" width="190" height="16" rx="3" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="0.8" />
              <text x="103" y="18" textAnchor="middle" fill="#e2e8f0" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                CROSS-PRODUCT BRIDGE ROUTER
              </text>
              <g transform="translate(8, 28)">
                <image
                  href="/previews/preview-bridge.png"
                  width="564"
                  height="42"
                  preserveAspectRatio="none"
                />
                <rect width="564" height="42" rx="4" fill="none" stroke="#27272a" strokeWidth="1" />
              </g>
            </g>

            {/* 4. ANALOG SCHRODINGER PREVIEW (LEFT SIDE - FULLY VISIBLE, NEUTRAL BORDER) */}
            <g
              className="pointer-events-none"
              opacity={hoveredPreview === "schrodinger" ? 1 : 0}
              transform={`translate(${hoveredPreview === "schrodinger" ? 10 : -6}, 470)`}
              style={{ transition: "opacity 0.22s ease, transform 0.22s ease" }}
            >
              <rect
                width="340"
                height="226"
                rx="8"
                fill="#0b0e14"
                stroke="#27272a"
                strokeWidth="1"
                filter="url(#shadow-preview-neutral)"
              />
              <rect x="8" y="8" width="180" height="17" rx="3" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="0.8" />
              <text x="98" y="20" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace" fontWeight="bold">
                ANALOG SCHRODINGER ENGINE
              </text>
              <g transform="translate(8, 33)">
                <image
                  href="/previews/preview-analog.jpg"
                  width="324"
                  height="184"
                  preserveAspectRatio="none"
                />
                <rect width="324" height="184" rx="4" fill="none" stroke="#27272a" strokeWidth="1" />
              </g>
            </g>

            {/* 5. SILICON EDA PREVIEW (RIGHT SIDE - FULLY VISIBLE, NEUTRAL BORDER) */}
            <g
              className="pointer-events-none"
              opacity={hoveredPreview === "eda" ? 1 : 0}
              transform={`translate(${hoveredPreview === "eda" ? 705 : 720}, 470)`}
              style={{ transition: "opacity 0.22s ease, transform 0.22s ease" }}
            >
              <rect
                width="340"
                height="226"
                rx="8"
                fill="#0b0e14"
                stroke="#27272a"
                strokeWidth="1"
                filter="url(#shadow-preview-neutral)"
              />
              <rect x="8" y="8" width="165" height="17" rx="3" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="0.8" />
              <text x="90" y="20" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace" fontWeight="bold">
                SILICON EDA 2D/3D ENGINE
              </text>
              <g transform="translate(8, 33)">
                <image
                  href="/previews/preview-eda.jpg"
                  width="324"
                  height="184"
                  preserveAspectRatio="none"
                />
                <rect width="324" height="184" rx="4" fill="none" stroke="#27272a" strokeWidth="1" />
              </g>
            </g>

            {/* 6. HFSS 3D EM SOLVER PREVIEW (RIGHT SIDE - FULLY VISIBLE, NEUTRAL BORDER) */}
            <g
              className="pointer-events-none"
              opacity={hoveredPreview === "hfss" ? 1 : 0}
              transform={`translate(${hoveredPreview === "hfss" ? 705 : 720}, 650)`}
              style={{ transition: "opacity 0.22s ease, transform 0.22s ease" }}
            >
              <rect
                width="340"
                height="226"
                rx="8"
                fill="#0b0e14"
                stroke="#27272a"
                strokeWidth="1"
                filter="url(#shadow-preview-neutral)"
              />
              <rect x="8" y="8" width="165" height="17" rx="3" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="0.8" />
              <text x="90" y="20" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace" fontWeight="bold">
                HFSS 3D EM SOLVER
              </text>
              <g transform="translate(8, 33)">
                <image
                  href="/previews/preview-hfss.jpg"
                  width="324"
                  height="184"
                  preserveAspectRatio="none"
                />
                <rect width="324" height="184" rx="4" fill="none" stroke="#27272a" strokeWidth="1" />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

