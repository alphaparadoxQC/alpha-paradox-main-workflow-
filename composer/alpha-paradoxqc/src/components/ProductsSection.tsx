"use client";

import React from "react";
import Image from "next/image";

export const ProductsSection: React.FC = () => {
  const notebookUrl = process.env.NEXT_PUBLIC_NOTEBOOK_URL || "/home";

  return (
    <section
      id="products"
      className="relative z-20 w-full min-h-screen h-screen bg-[#050505] flex items-center justify-center overflow-hidden border-t border-[#3B0A6B]/25 scroll-mt-14"
    >
      {/* Ambient atmospheric purple glow matching the smoke in the artwork */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute right-[5%] sm:right-[15%] top-1/2 -translate-y-1/2 w-[55vw] h-[55vw] max-w-[800px] max-h-[800px] bg-[#3B0A6B]/30 rounded-full blur-[160px]" />
        <div className="absolute left-[10%] top-1/2 -translate-y-1/2 w-[35vw] h-[35vw] max-w-[500px] max-h-[500px] bg-[#00E5FF]/8 rounded-full blur-[140px]" />
      </div>

      {/* Full-screen responsive artwork with same-window launch button */}
      <div className="relative w-full h-full max-w-[1920px] max-h-[1080px] flex items-center justify-center p-4 sm:p-8 md:p-12">
        <a
          href={notebookUrl}
          className="relative w-full h-full block group cursor-pointer"
          title="Open The Alpha Book Quantum Notebook Dashboard"
        >
          <Image
            src="/images/alpha-book.jpg"
            alt="Start Your Quantum Journey With ALPHA BOOK"
            fill
            className="object-contain object-center drop-shadow-[0_0_60px_rgba(59,10,107,0.45)] transition-transform duration-500 group-hover:scale-[1.01]"
            priority
          />

          {/* Floating Action Badge to Launch Dashboard in Same Window */}
          <div className="absolute bottom-8 right-8 sm:bottom-12 sm:right-12 z-30">
            <div className="inline-flex items-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-[#9333ea] via-[#7B1FA2] to-[#3b0a6b] text-white font-semibold text-xs sm:text-sm tracking-wider uppercase border border-white/20 shadow-[0_0_30px_rgba(147,51,234,0.55)] group-hover:shadow-[0_0_45px_rgba(0,229,255,0.7)] group-hover:border-[#00e5ff]/60 transition-all duration-300 group-hover:scale-[1.04]">
              <span>Open The Alpha Book Dashboard</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#00e5ff] transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </a>
      </div>
    </section>
  );
};
