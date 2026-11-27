import React from "react";
import { Link } from "react-router-dom";

export const ProductsSection = () => {
  return (
    <section
      id="products"
      className="relative z-20 w-full min-h-screen bg-[#050505] flex flex-col items-center justify-center overflow-hidden border-t border-[#3B0A6B]/25 py-20 px-4 sm:px-8"
    >
      {/* Ambient atmospheric purple glow matching the smoke in the artwork */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute right-[5%] sm:right-[15%] top-1/2 -translate-y-1/2 w-[55vw] h-[55vw] max-w-[800px] max-h-[800px] bg-[#3B0A6B]/30 rounded-full blur-[160px]" />
        <div className="absolute left-[10%] top-1/2 -translate-y-1/2 w-[35vw] h-[35vw] max-w-[500px] max-h-[500px] bg-[#00E5FF]/8 rounded-full blur-[140px]" />
      </div>

      {/* Section Header */}
      <div className="relative z-10 max-w-5xl mx-auto text-center mb-8 space-y-3">
        <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-[#3B0A6B]/40 backdrop-blur-md shadow-[0_0_20px_rgba(59,10,107,0.3)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] animate-pulse" />
          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-white/80">
            SOFTWARE SOLUTIONS &amp; PRODUCTS
          </span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
          Next-Generation Quantum Intelligence Suite
        </h2>
        <p className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto font-light">
          From industrial Hamiltonian ground-state VQE solvers to high-density QLDPC silicon chips, explore our cloud and hardware tools.
        </p>
      </div>

      {/* Full-screen responsive artwork */}
      <div className="relative w-full max-w-[1200px] flex items-center justify-center p-2 sm:p-4">
        <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(59,10,107,0.45)] bg-[#08080a]">
          <img
            src="/alpha-book.jpg"
            alt="Start Your Quantum Journey With ALPHA BOOK"
            className="w-full h-auto object-contain object-center filter brightness-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/alpha-paradox-logo.jpg";
            }}
          />
        </div>
      </div>

      {/* Direct Interactive Launch Cards */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl w-full mt-12">
        <Link
          to="/composer"
          className="group p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#00E5FF]/40 backdrop-blur-md transition-all hover:-translate-y-1 shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B0A6B] to-[#00E5FF]/40 flex items-center justify-center text-white font-mono text-sm mb-3">
            QC
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-[#00E5FF] transition-colors">
            Quantum Composer
          </h3>
          <p className="text-xs text-white/60 mt-1 line-clamp-2">
            Visual multi-qubit circuit builder with statevector, density matrix, and QASM export.
          </p>
          <div className="mt-3 text-[11px] font-mono text-[#00E5FF] flex items-center space-x-1">
            <span>Launch Composer</span>
            <span>&rarr;</span>
          </div>
        </Link>

        <Link
          to="/labs"
          className="group p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#00E5FF]/40 backdrop-blur-md transition-all hover:-translate-y-1 shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B1FA2] to-[#00E5FF]/40 flex items-center justify-center text-white font-mono text-sm mb-3">
            DL
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-[#00E5FF] transition-colors">
            6 Quantum Domain Labs
          </h3>
          <p className="text-xs text-white/60 mt-1 line-clamp-2">
            Chemistry VQE, QML, QAOA Optimization, Surface Codes, Cryptography, and Finance.
          </p>
          <div className="mt-3 text-[11px] font-mono text-[#00E5FF] flex items-center space-x-1">
            <span>Explore Labs</span>
            <span>&rarr;</span>
          </div>
        </Link>

        <Link
          to="/eda"
          className="group p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#00E5FF]/40 backdrop-blur-md transition-all hover:-translate-y-1 shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B0A6B] to-[#7B1FA2] flex items-center justify-center text-white font-mono text-sm mb-3">
            EDA
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-[#00E5FF] transition-colors">
            Semiconductor EDA Studio
          </h3>
          <p className="text-xs text-white/60 mt-1 line-clamp-2">
            Multi-layer GDSII chip design, DRC verification, and electromagnetic simulations.
          </p>
          <div className="mt-3 text-[11px] font-mono text-[#00E5FF] flex items-center space-x-1">
            <span>Open EDA Studio</span>
            <span>&rarr;</span>
          </div>
        </Link>

        <Link
          to="/lab"
          className="group p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#00E5FF]/40 backdrop-blur-md transition-all hover:-translate-y-1 shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A3A44] to-[#00E5FF]/40 flex items-center justify-center text-white font-mono text-sm mb-3">
            NB
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-[#00E5FF] transition-colors">
            Quantum Notebook
          </h3>
          <p className="text-xs text-white/60 mt-1 line-clamp-2">
            Interactive Jupyter-style runtime for hybrid quantum-classical algorithms and execution.
          </p>
          <div className="mt-3 text-[11px] font-mono text-[#00E5FF] flex items-center space-x-1">
            <span>Open Notebook</span>
            <span>&rarr;</span>
          </div>
        </Link>
      </div>
    </section>
  );
};
export default ProductsSection;
