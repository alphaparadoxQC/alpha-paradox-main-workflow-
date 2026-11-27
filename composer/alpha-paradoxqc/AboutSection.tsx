"use client";

import React, { useState } from "react";

export const AboutSection: React.FC = () => {
  const [activeSchemaView, setActiveSchemaView] = useState<"all" | "part1" | "part2">("all");

  return (
    <section
      id="about"
      className="relative z-20 bg-[#050505] text-white py-28 sm:py-36 px-6 sm:px-12 lg:px-20 overflow-hidden border-t border-[#3B0A6B]/25 scroll-mt-14"
    >
      {/* Ambient background glows matching Royal Amethyst & Electric Cyan theme */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Volumetric Royal Amethyst Bloom */}
        <div className="absolute -top-32 left-1/4 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-[#3B0A6B]/20 rounded-full blur-[160px]" />
        {/* Electric Cyan Accent Bloom */}
        <div className="absolute -bottom-32 right-1/4 w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] bg-[#00E5FF]/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-14">
        {/* Section Top Header & Badge: ALPHA NEURAL SCHEMA */}
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-[#3B0A6B]/40 backdrop-blur-md shadow-[0_0_20px_rgba(59,10,107,0.3)]">
            <span className="w-1.5 h-1.5 rounded-full bg-electric-cyan shadow-[0_0_8px_#00E5FF] animate-pulse" />
            <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-white/80">
              SYSTEM ARCHITECTURE // FULL-STACK SPECIFICATION
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            Alpha Neural Schema
          </h2>

          <p className="text-sm sm:text-base text-white/70 max-w-3xl font-light font-sans leading-relaxed">
            Unified full-stack quantum topology spanning cognitive layer gate graph translation, central neuromorphic synaptic routing, conformal TCAD multi-physics extraction, and fault-tolerant vQPU decoder execution.
          </p>
        </div>

        {/* Alpha Neural Schema Interactive Specification Viewer */}
        <div className="relative p-4 sm:p-8 rounded-3xl bg-[#08080a]/90 border border-white/[0.08] backdrop-blur-xl shadow-[0_16px_50px_rgba(0,0,0,0.8)] space-y-6">
          {/* Controls Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div className="flex items-center space-x-3">
              <span className="w-2 h-2 rounded-full bg-electric-cyan animate-pulse shadow-[0_0_8px_#00E5FF]" />
              <span className="text-xs font-mono text-white/80 tracking-wider uppercase">
                {activeSchemaView === "all"
                  ? "FULL STACK SPECIFICATION (LAYERS 1 & 2)"
                  : activeSchemaView === "part1"
                  ? "PART 1: COGNITIVE & TCAD LAYERS (ULLA10)"
                  : "PART 2: HARDWARE EXECUTION & DECODER (ULLA12)"}
              </span>
            </div>

            {/* Segmented View Toggles */}
            <div className="flex items-center space-x-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveSchemaView("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  activeSchemaView === "all"
                    ? "bg-[#3B0A6B] text-white border border-[#00E5FF]/40 shadow-[0_0_12px_rgba(0,229,255,0.2)]"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                Full Stack
              </button>
              <button
                type="button"
                onClick={() => setActiveSchemaView("part1")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  activeSchemaView === "part1"
                    ? "bg-[#3B0A6B] text-white border border-[#00E5FF]/40 shadow-[0_0_12px_rgba(0,229,255,0.2)]"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                Part 1 (ulla10)
              </button>
              <button
                type="button"
                onClick={() => setActiveSchemaView("part2")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  activeSchemaView === "part2"
                    ? "bg-[#3B0A6B] text-white border border-[#00E5FF]/40 shadow-[0_0_12px_rgba(0,229,255,0.2)]"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                Part 2 (ulla12)
              </button>
            </div>
          </div>

          {/* Schematic Diagram Canvases */}
          <div className="space-y-6">
            {(activeSchemaView === "all" || activeSchemaView === "part1") && (
              <div className="relative group rounded-2xl overflow-hidden border border-white/[0.06] bg-black/60">
                <div className="absolute top-3 left-4 z-10 px-2.5 py-1 rounded-md bg-black/75 border border-white/10 text-[10px] font-mono text-white/80">
                  LAYER 01 // COGNITIVE, SYNAPTIC HUB & PHYSICAL TCAD
                </div>
                <img
                  src="/images/ulla10.jpeg"
                  alt="Alpha Neural Schema - Cognitive and Physical TCAD Layer (ulla10)"
                  className="w-full h-auto object-contain select-none"
                  loading="lazy"
                />
              </div>
            )}

            {activeSchemaView === "all" && (
              <div className="flex items-center justify-center space-x-3 py-2 text-xs font-mono text-electric-cyan/70">
                <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#00E5FF]/40" />
                <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.06]">
                  ▼ SYNAPSE W_9 / W_10 INTERCONNECT ▼
                </span>
                <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#00E5FF]/40" />
              </div>
            )}

            {(activeSchemaView === "all" || activeSchemaView === "part2") && (
              <div className="relative group rounded-2xl overflow-hidden border border-white/[0.06] bg-black/60">
                <div className="absolute top-3 left-4 z-10 px-2.5 py-1 rounded-md bg-black/75 border border-white/10 text-[10px] font-mono text-white/80">
                  LAYER 02 // HARDWARE EXECUTION & FAULT-TOLERANT QLDPC DECODER
                </div>
                <img
                  src="/images/ulla12.jpeg"
                  alt="Alpha Neural Schema - Hardware Execution and Decoder Layer (ulla12)"
                  className="w-full h-auto object-contain select-none"
                  loading="lazy"
                />
              </div>
            )}
          </div>

          {/* Schema Legend / Technical Specs Bar */}
          <div className="pt-4 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="space-y-1">
              <span className="text-white/40 uppercase text-[10px]">Logical Synapses</span>
              <p className="text-white font-semibold">W_1 to W_12</p>
            </div>
            <div className="space-y-1">
              <span className="text-white/40 uppercase text-[10px]">Physics Engines</span>
              <p className="text-electric-cyan font-semibold">Schrödinger + HFSS 3D</p>
            </div>
            <div className="space-y-1">
              <span className="text-white/40 uppercase text-[10px]">Target QPU</span>
              <p className="text-white font-semibold">1,100 Transmons</p>
            </div>
            <div className="space-y-1">
              <span className="text-white/40 uppercase text-[10px]">Error Correction</span>
              <p className="text-[#C77DFF] font-semibold">QLDPC Bivariate (d=16)</p>
            </div>
          </div>
        </div>

        {/* Mission & Vision Section (Reference Style) */}
        <div className="relative py-10 sm:py-16 space-y-20 sm:space-y-28 text-center max-w-5xl mx-auto">
          {/* Mission */}
          <div className="space-y-6 sm:space-y-8">
            <h3 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white">
              Mission
            </h3>
            <p className="text-base sm:text-lg md:text-xl text-white/80 leading-relaxed font-sans font-light max-w-4xl mx-auto">
              To engineer and deploy application-first computational systems that harness the optimal convergence of Artificial Intelligence, Quantum Computing, and High-Performance Computing. We build full-stack quantum hardware, scalable hybrid cloud infrastructure, advanced optimization engines, and AI-native scientific platforms — enabling breakthroughs in drug discovery, materials engineering, energy systems, mobility, manufacturing, and large-scale decision intelligence. Our mission is to convert frontier computational science into reliable, production-grade technologies that deliver measurable industrial advantage.
            </p>
          </div>

          {/* Vision */}
          <div className="space-y-6 sm:space-y-8">
            <h3 className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white">
              Vision
            </h3>
            <p className="text-base sm:text-lg md:text-xl text-white/80 leading-relaxed font-sans font-light max-w-4xl mx-auto">
              To lead the world in integrated Quantum-AI-HPC infrastructure — establishing next-generation computational platforms that redefine how complex scientific and industrial problems are solved at scale. We envision a future where hybrid intelligent compute systems become foundational to innovation, competitiveness, and national technological leadership.
            </p>
          </div>
        </div>

        {/* Connecting Innovation Across India */}
        <div className="relative py-12 sm:py-20 space-y-8 text-center max-w-6xl mx-auto">
          <div className="space-y-4 max-w-4xl mx-auto">
            <h3 className="text-3xl sm:text-5xl md:text-6xl font-medium tracking-tight text-white leading-tight">
              Connecting Innovation Across India
            </h3>
          </div>

          {/* Clean Map graphic with Kolkata, West Bengal location point */}
          <div className="relative w-full max-w-5xl mx-auto pt-6 flex justify-center items-center">
            {/* Ambient subtle atmospheric glows */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[35vw] h-[35vw] max-w-[500px] max-h-[500px] bg-[#00E5FF]/8 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[550px] max-h-[550px] bg-[#3B0A6B]/20 rounded-full blur-[150px] pointer-events-none" />

            <div className="relative w-full">
              <img
                src="/images/world-map.svg"
                alt="Connecting Innovation Across India"
                className="w-full h-auto object-contain opacity-90 drop-shadow-[0_0_40px_rgba(255,255,255,0.05)]"
                loading="lazy"
              />

              {/* Wine-Purple Location Point: Kolkata, West Bengal (India) */}
              <div
                className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-auto select-none transition-transform duration-300 hover:scale-110 z-10"
                style={{ left: '71.2%', top: '60.1%' }}
              >
                {/* Badge Card */}
                <div className="bg-[#72164e] text-white font-semibold text-xs sm:text-sm px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl shadow-[0_4px_20px_rgba(114,22,78,0.55)] border border-white/20 whitespace-nowrap tracking-wide">
                  Kolkata, IN
                </div>

                {/* Downward Pointer / Beak */}
                <div className="w-0 h-0 border-l-[5px] sm:border-l-[6px] border-l-transparent border-r-[5px] sm:border-r-[6px] border-r-transparent border-t-[6px] sm:border-t-[7px] border-t-[#72164e] -mt-[1px]" />

                {/* Pin Icon and Pulse Anchor */}
                <div className="mt-1 flex flex-col items-center relative">
                  <svg
                    width="14"
                    height="18"
                    viewBox="0 0 14 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M7 0C3.134 0 0 3.134 0 7C0 11.8 7 18 7 18C7 18 14 11.8 14 7C14 3.134 10.866 0 7 0ZM7 9.5C5.619 9.5 4.5 8.381 4.5 7C4.5 5.619 5.619 4.5 7 4.5C8.381 4.5 9.5 5.619 9.5 7C9.5 8.381 8.381 9.5 7 9.5Z"
                      fill="#72164e"
                    />
                  </svg>
                  {/* Subtle pulsing anchor dot at the tip of the pin */}
                  <span className="absolute -bottom-1 w-2.5 h-2.5 rounded-full bg-[#72164e] opacity-75 animate-ping pointer-events-none" />
                  <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-[#72164e] pointer-events-none shadow-[0_0_10px_#72164e]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Core Strategic Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Pillar 1 */}
          <div className="group p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-[#3B0A6B]/60 hover:bg-white/[0.04] transition-all duration-300 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-electric-cyan">01</span>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                SOFTWARE
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white tracking-wide">
              Innovative Software
            </h3>
            <p className="text-xs text-white/60 leading-relaxed font-sans">
              Developing application-layer quantum algorithms, compilers, and SDKs to accelerate quantum deployment for real-world industry breakthroughs.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="group p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-[#3B0A6B]/60 hover:bg-white/[0.04] transition-all duration-300 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#C77DFF]">02</span>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                SIMULATION
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white tracking-wide">
              Scientific Simulation
            </h3>
            <p className="text-xs text-white/60 leading-relaxed font-sans">
              High-precision Hamiltonian modeling, noise-channel physics, and multi-qubit system simulation engineered to bridge theory and empirical hardware.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="group p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-electric-cyan/60 hover:bg-white/[0.04] transition-all duration-300 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-electric-cyan">03</span>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                HARDWARE
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white tracking-wide">
              Quantum Hardware Research
            </h3>
            <p className="text-xs text-white/60 leading-relaxed font-sans">
              Advancing cryogenic thermal staging, microwave electronics, and superconducting qubit architectures engineered for zero-noise coherence.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

