"use client";

import React from "react";
import Image from "next/image";

export const ProductsSection: React.FC = () => {
  return (
    <section
      id="products"
      className="relative z-20 w-full min-h-screen h-screen bg-[#050505] flex items-center justify-center overflow-hidden border-t border-[#3B0A6B]/25"
    >
      {/* Ambient atmospheric purple glow matching the smoke in the artwork */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute right-[5%] sm:right-[15%] top-1/2 -translate-y-1/2 w-[55vw] h-[55vw] max-w-[800px] max-h-[800px] bg-[#3B0A6B]/30 rounded-full blur-[160px]" />
        <div className="absolute left-[10%] top-1/2 -translate-y-1/2 w-[35vw] h-[35vw] max-w-[500px] max-h-[500px] bg-[#00E5FF]/8 rounded-full blur-[140px]" />
      </div>

      {/* Full-screen responsive artwork */}
      <div className="relative w-full h-full max-w-[1920px] max-h-[1080px] flex items-center justify-center p-4 sm:p-8 md:p-12">
        <div className="relative w-full h-full">
          <Image
            src="/images/alpha-book.jpg"
            alt="Start Your Quantum Journey With ALPHA BOOK"
            fill
            className="object-contain object-center drop-shadow-[0_0_60px_rgba(59,10,107,0.45)]"
            priority
          />
        </div>
      </div>
    </section>
  );
};
