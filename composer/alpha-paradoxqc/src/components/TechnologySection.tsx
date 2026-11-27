"use client";

import React, { useState, useEffect } from "react";

interface EcosystemFeature {
  title: string;
  shortText: string;
  extendedText: string;
  icon: (size?: number) => React.ReactNode;
}

const ecosystemFeatures: EcosystemFeature[] = [
  {
    title: "Powerful Circuit Builder",
    shortText:
      "Design quantum circuits intuitively with an interactive drag-and-drop interface.",
    extendedText:
      " Access a comprehensive library of quantum gates, construct complex circuit architectures, and visualize quantum operations with real-time simulation and state analysis.",
    icon: (size = 34) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line x1="4" y1="12" x2="36" y2="12" stroke="#6B21A8" strokeWidth="1.5" strokeOpacity="0.7" />
        <line x1="4" y1="20" x2="36" y2="20" stroke="#6B21A8" strokeWidth="1.5" strokeOpacity="0.7" />
        <line x1="4" y1="28" x2="36" y2="28" stroke="#6B21A8" strokeWidth="1.5" strokeOpacity="0.7" />
        <rect x="12" y="6" width="12" height="12" rx="2.5" fill="#230542" stroke="#FFFFFF" strokeWidth="1.5" />
        <text x="18" y="15" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
          H
        </text>
        <circle cx="28" cy="20" r="2.5" fill="#FFFFFF" />
        <line x1="28" y1="20" x2="28" y2="32" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="28" cy="28" r="4" stroke="#FFFFFF" strokeWidth="1.5" fill="#230542" />
        <line x1="28" y1="25" x2="28" y2="31" stroke="#FFFFFF" strokeWidth="1.2" />
        <line x1="25" y1="28" x2="31" y2="28" stroke="#FFFFFF" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    title: "Simulate on Accelerators",
    shortText:
      "Accelerate quantum simulation using high-performance computational resources.",
    extendedText:
      " Explore complex quantum circuits and computational problems with support for optimized execution environments, helping researchers investigate larger workloads and improve simulation efficiency.",
    icon: (size = 34) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="8" y="8" width="24" height="24" rx="4" stroke="#6B21A8" strokeWidth="1.5" fill="#230542" />
        <rect x="14" y="14" width="12" height="12" rx="2" stroke="#FFFFFF" strokeWidth="1.5" fill="#3B0A6B" />
        <line x1="14" y1="4" x2="14" y2="8" stroke="#6B21A8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="4" x2="20" y2="8" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="26" y1="4" x2="26" y2="8" stroke="#6B21A8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="32" x2="14" y2="36" stroke="#6B21A8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="20" y1="32" x2="20" y2="36" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="26" y1="32" x2="26" y2="36" stroke="#6B21A8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="4" y1="14" x2="8" y2="14" stroke="#6B21A8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="4" y1="20" x2="8" y2="20" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="4" y1="26" x2="8" y2="26" stroke="#6B21A8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="32" y1="14" x2="36" y2="14" stroke="#6B21A8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="32" y1="20" x2="36" y2="20" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="32" y1="26" x2="36" y2="26" stroke="#6B21A8" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="20" cy="20" r="2" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    title: "Run on Quantum Hardware",
    shortText:
      "Take quantum algorithms beyond simulation by executing compatible circuits on real quantum processing hardware.",
    extendedText:
      " Connect theoretical quantum models with physical quantum systems to explore quantum computation through practical hardware experiments.",
    icon: (size = 34) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="8" y="7" width="24" height="3" rx="1.5" fill="#6B21A8" />
        <rect x="11" y="14" width="18" height="2.5" rx="1.2" fill="#4C1D95" />
        <rect x="14" y="21" width="12" height="2" rx="1" fill="#FFFFFF" />
        <line x1="13" y1="10" x2="13" y2="14" stroke="#6B21A8" strokeWidth="1.2" />
        <line x1="27" y1="10" x2="27" y2="14" stroke="#6B21A8" strokeWidth="1.2" />
        <line x1="16" y1="16.5" x2="16" y2="21" stroke="#6B21A8" strokeWidth="1.2" />
        <line x1="24" y1="16.5" x2="24" y2="21" stroke="#6B21A8" strokeWidth="1.2" />
        <line x1="20" y1="23" x2="20" y2="27" stroke="#FFFFFF" strokeWidth="1.2" />
        <rect x="16" y="27" width="8" height="7" rx="1.5" fill="#230542" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="20" cy="30.5" r="1.5" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    title: "Algorithm Implementations",
    shortText:
      "Explore and implement a range of quantum algorithms through structured, ready-to-use implementations.",
    extendedText:
      " Experiment with established quantum computing methods, customize algorithm parameters, and transform mathematical concepts into executable quantum circuits.",
    icon: (size = 34) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="6" y="8" width="14" height="18" rx="2" fill="#230542" stroke="#6B21A8" strokeWidth="1.5" />
        <line x1="9" y1="13" x2="17" y2="13" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="9" y1="17" x2="15" y2="17" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="24" y="6" width="10" height="8" rx="1.5" fill="#3B0A6B" stroke="#6B21A8" strokeWidth="1.2" />
        <rect x="24" y="18" width="10" height="8" rx="1.5" fill="#3B0A6B" stroke="#FFFFFF" strokeWidth="1.2" />
        <path d="M20 12H24" stroke="#6B21A8" strokeWidth="1.2" />
        <path d="M20 20H22C23.1 20 24 19.1 24 18" stroke="#6B21A8" strokeWidth="1.2" />
        <path d="M29 14V18" stroke="#6B21A8" strokeWidth="1.2" strokeDasharray="1.5 1.5" />
        <circle cx="12" cy="30" r="4" stroke="#FFFFFF" strokeWidth="1.5" fill="#230542" />
        <path
          d="M12 24V26M12 34V36M6 30H8M16 30H18M7.8 25.8L9.2 27.2M14.8 32.8L16.2 34.2M7.8 34.2L9.2 32.8M14.8 27.2L16.2 25.8"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="30" r="1.5" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    title: "Integrated Transpiler",
    shortText:
      "Convert quantum circuits into hardware-compatible instructions through an integrated transpilation workflow.",
    extendedText:
      " Optimize circuit structures, map quantum operations to supported backend architectures, and translate quantum programs into executable formats such as OpenQASM.",
    icon: (size = 34) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="13" y="13" width="14" height="14" rx="3" stroke="#6B21A8" strokeWidth="1.5" fill="#230542" />
        <circle cx="20" cy="20" r="3" stroke="#FFFFFF" strokeWidth="1.5" fill="#230542" />
        <circle cx="20" cy="20" r="1" fill="#FFFFFF" />
        <path d="M20 5V13" stroke="#6B21A8" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="20" cy="5" r="1.5" fill="#FFFFFF" />
        <path d="M20 27V35" stroke="#6B21A8" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="20" cy="35" r="1.5" fill="#FFFFFF" />
        <path d="M5 20H13" stroke="#6B21A8" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="5" cy="20" r="1.5" fill="#FFFFFF" />
        <path d="M27 20H35" stroke="#6B21A8" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="35" cy="20" r="1.5" fill="#FFFFFF" />
        <path d="M9 9L14 14" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="8" cy="8" r="1.5" fill="#FFFFFF" />
        <path d="M31 9L26 14" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="32" cy="8" r="1.5" fill="#FFFFFF" />
        <path d="M9 31L14 26" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="8" cy="32" r="1.5" fill="#FFFFFF" />
        <path d="M31 31L26 26" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="32" cy="32" r="1.5" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    title: "Modular Libraries",
    shortText:
      "Access a flexible collection of quantum computing tools, operators, gates and computational modules.",
    extendedText:
      " Build sophisticated quantum applications by combining reusable components, simplifying development and supporting experimentation across different quantum computing domains.",
    icon: (size = 34) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="7" y="9" width="26" height="18" rx="2" stroke="#6B21A8" strokeWidth="1.5" fill="#230542" />
        <path d="M4 28H36C36.6 28 37 28.4 37 29V30C37 30.6 36.6 31 36 31H4C3.4 31 3 30.6 3 30V29C3 28.4 3.4 28 4 28Z" fill="#4C1D95" />
        <rect x="17" y="28" width="6" height="1.5" rx="0.5" fill="#FFFFFF" />
        <circle cx="14" cy="18" r="4.5" stroke="#FFFFFF" strokeWidth="1.2" fill="#230542" />
        <path d="M14 13.5V18H18.5" stroke="#FFFFFF" strokeWidth="1.2" />
        <path d="M21 21L24 16L27 19L30 14" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Quantum Notebook",
    shortText:
      "Explore quantum computing through an interactive programming environment designed for research and experimentation.",
    extendedText:
      " Write and execute Python code, implement quantum algorithms, document experiments, and analyse computational results within a unified notebook workspace.",
    icon: (size = 34) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="6" y="6" width="28" height="28" rx="3" stroke="#6B21A8" strokeWidth="1.5" fill="#230542" />
        <line x1="6" y1="13" x2="34" y2="13" stroke="#4C1D95" strokeWidth="1" />
        <circle cx="10" cy="9.5" r="1.5" fill="#FFFFFF" />
        <circle cx="14" cy="9.5" r="1.5" fill="#6B21A8" />
        <circle cx="18" cy="9.5" r="1.5" fill="#4C1D95" />
        <path d="M10 18L13 20L10 22" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="16" y1="20" x2="28" y2="20" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="10" y1="25" x2="22" y2="25" stroke="#6B21A8" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="10" y1="29" x2="25" y2="29" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Easy-to-Use EDA",
    shortText:
      "Design and visualize quantum processor architectures through an intuitive electronic design automation environment.",
    extendedText:
      " Work with qubit geometries, coupling structures and circuit layouts while managing component connectivity and preparing chip designs for further engineering analysis.",
    icon: (size = 34) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="6" y="6" width="28" height="28" rx="3" stroke="#6B21A8" strokeWidth="1.5" fill="#230542" />
        <rect x="10" y="10" width="6" height="6" rx="1" fill="#3B0A6B" stroke="#FFFFFF" strokeWidth="1.2" />
        <rect x="24" y="10" width="6" height="6" rx="1" fill="#3B0A6B" stroke="#FFFFFF" strokeWidth="1.2" />
        <rect x="10" y="24" width="6" height="6" rx="1" fill="#3B0A6B" stroke="#FFFFFF" strokeWidth="1.2" />
        <rect x="24" y="24" width="6" height="6" rx="1" fill="#3B0A6B" stroke="#FFFFFF" strokeWidth="1.2" />
        <path d="M16 13H24" stroke="#6B21A8" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M16 27H24" stroke="#6B21A8" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M13 16V24" stroke="#6B21A8" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M27 16V24" stroke="#6B21A8" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="20" cy="20" r="2" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    title: "Quantum Energy Calculator",
    shortText:
      "Investigate quantum energy systems through computational modelling and mathematical analysis.",
    extendedText:
      " Construct Hamiltonians, calculate energy eigenvalues, examine quantum states and visualize energy spectra to support research in quantum mechanics, molecular systems and computational physics.",
    icon: (size = 34) => (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line x1="8" y1="32" x2="34" y2="32" stroke="#6B21A8" strokeWidth="1.2" strokeOpacity="0.7" />
        <line x1="8" y1="32" x2="8" y2="8" stroke="#6B21A8" strokeWidth="1.2" strokeOpacity="0.7" />
        <line x1="12" y1="27" x2="32" y2="27" stroke="#4C1D95" strokeWidth="1.5" />
        <line x1="12" y1="19" x2="32" y2="19" stroke="#6B21A8" strokeWidth="1.5" />
        <line x1="12" y1="11" x2="32" y2="11" stroke="#FFFFFF" strokeWidth="1.5" />
        <path d="M22 27V12M22 12L19 15M22 12L25 15" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 24C15 20 17 28 20 24C23 20 25 28 28 24" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.8" strokeDasharray="1.5 1.5" />
      </svg>
    ),
  },
];

/**
 * TypewriterDescription Component
 * Displays 2-3 lines initially ending with "See more...".
 * On cursor hover, streams in the remaining text letter-by-letter continuing the line.
 */
const TypewriterDescription: React.FC<{
  shortText: string;
  extendedText: string;
  isHovered: boolean;
}> = ({ shortText, extendedText, isHovered }) => {
  const [typedChars, setTypedChars] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isHovered) {
      setTypedChars(0);
      timer = setInterval(() => {
        setTypedChars((prev) => {
          if (prev < extendedText.length) {
            return prev + 1;
          }
          if (timer) clearInterval(timer);
          return prev;
        });
      }, 10); // Swift, crisp letter-by-letter cadence (10ms per char)
    } else {
      setTypedChars(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isHovered, extendedText]);

  return (
    <p className="text-xs sm:text-[12px] text-white font-medium leading-relaxed font-sans">
      <span>{shortText}</span>
      {!isHovered ? (
        <span className="text-white font-bold ml-1.5 inline-block cursor-pointer hover:underline">
          See more...
        </span>
      ) : (
        <span className="text-white">
          {extendedText.slice(0, typedChars)}
          {typedChars < extendedText.length && (
            <span className="inline-block w-1.5 h-3 bg-white ml-0.5 animate-pulse align-middle" />
          )}
        </span>
      )}
    </p>
  );
};

export const TechnologySection: React.FC = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeMobileIdx, setActiveMobileIdx] = useState<number>(0);
  const [mobileExpanded, setMobileExpanded] = useState<boolean>(false);

  // Auto-cycle active point on mobile if user doesn't interact
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveMobileIdx((prev) => (prev + 1) % ecosystemFeatures.length);
      setMobileExpanded(false);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const totalPoints = ecosystemFeatures.length;
  const angleStep = (2 * Math.PI) / totalPoints;
  const desktopRadius = 370; // orbital radius for desktop view in px

  return (
    <section
      id="technology"
      className="relative z-20 bg-[#050505] text-white py-24 sm:py-32 px-4 sm:px-8 lg:px-12 overflow-hidden border-t border-[#3B0A6B]/25 scroll-mt-14"
    >
      {/* Ambient background glows matching Royal Amethyst & Electric Cyan theme */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Volumetric Royal Amethyst Bloom */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] bg-[#3B0A6B]/15 rounded-full blur-[180px]" />
        {/* Electric Cyan Accent Bloom */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] bg-[#00E5FF]/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-12 sm:space-y-16">
        {/* Section Headline */}
        <div className="text-center space-y-3">
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-white leading-tight">
            Ultimate Quantum Ecosystem
          </h2>
          <p className="text-xs sm:text-sm font-mono text-white/40 tracking-[0.2em] uppercase">
            CIRCULAR INTEGRATED ARCHITECTURE // 9 CORE PILLARS
          </p>
        </div>

        {/* ============================================================== */}
        {/* DESKTOP VIEW: Full Circular Structure with Hollow Center       */}
        {/* ============================================================== */}
        <div className="hidden lg:block relative w-full max-w-[1020px] h-[920px] mx-auto select-none">
          {/* Keyframe animation for organic zero-gravity floating motion */}
          <style>{`
            @keyframes floatingItem {
              0%, 100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(-8px);
              }
            }
          `}</style>

          {/* Center Ring & Text in White Bold Letters: Alpha Ecosystem */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[310px] h-[310px] sm:w-[340px] sm:h-[340px] rounded-full border border-white/25 flex items-center justify-center text-center pointer-events-none select-none z-10">
            {/* Subtle inner concentric ring accent */}
            <div className="absolute inset-2.5 rounded-full border border-dashed border-white/10 pointer-events-none" />
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white font-sans whitespace-nowrap px-4">
              Alpha Ecosystem
            </h3>
          </div>

          {/* ============================================================== */}
          {/* 9 ECOSYSTEM POINTS FLOATING CIRCULARLY                         */}
          {/* ============================================================== */}
          {ecosystemFeatures.map((item, idx) => {
            const angle = idx * angleStep - Math.PI / 2;
            const x = Math.cos(angle);
            const y = Math.sin(angle);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  left: `calc(50% + ${Math.round(x * desktopRadius)}px)`,
                  top: `calc(50% + ${Math.round(y * desktopRadius)}px)`,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-[235px] p-2 transition-all duration-300 text-center flex flex-col items-center cursor-pointer select-none ${
                  isHovered ? "scale-105 z-30" : "z-10"
                }`}
              >
                {/* Floating Bobbing Wrapper */}
                <div
                  style={{
                    animation: isHovered
                      ? "none"
                      : `floatingItem 6s ease-in-out infinite ${(
                          idx * 0.65
                        ).toFixed(2)}s`,
                  }}
                  className="flex flex-col items-center text-center w-full transition-transform duration-300"
                >
                  {/* Top Floating Icon (No Glow) */}
                  <div
                    className={`mb-2.5 flex items-center justify-center transition-transform duration-300 ${
                      isHovered ? "scale-110" : ""
                    }`}
                  >
                    {item.icon(34)}
                  </div>

                  {/* Title (Clean Solid White, No Glow) */}
                  <h3 className="text-sm sm:text-[15px] font-bold tracking-tight mb-2 leading-snug text-white">
                    {item.title}
                  </h3>

                  {/* Interactive Short Description + Letter-by-Letter Popup on Hover */}
                  <TypewriterDescription
                    shortText={item.shortText}
                    extendedText={item.extendedText}
                    isHovered={isHovered}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* MOBILE & TABLET VIEW: Responsive Circular Orbit with Hollow    */}
        {/* Center Dial + Active Pillar Card Display                       */}
        {/* ============================================================== */}
        <div className="block lg:hidden space-y-8 max-w-md mx-auto">
          {/* Circular Interactive Dial with Hollow Center */}
          <div className="relative w-[310px] h-[310px] sm:w-[350px] sm:h-[350px] mx-auto select-none flex items-center justify-center">
            {/* Center Ring & Text: Alpha Ecosystem */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[140px] rounded-full border border-white/25 flex items-center justify-center text-center pointer-events-none select-none z-10">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-white font-sans whitespace-nowrap px-2">
                Alpha Ecosystem
              </span>
            </div>

            {/* 9 Interactive Orbital Nodes Around the Hollow Center */}
            {ecosystemFeatures.map((item, idx) => {
              const angle = idx * angleStep - Math.PI / 2;
              const mobileRadius = 125; // in px
              const x = Math.cos(angle) * mobileRadius;
              const y = Math.sin(angle) * mobileRadius;
              const isActive = activeMobileIdx === idx;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveMobileIdx(idx);
                    setMobileExpanded(false);
                  }}
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? "bg-[#3B0A6B] border-2 border-electric-cyan shadow-[0_0_20px_#00E5FF] scale-110 z-20"
                      : "bg-[#0a0a0f] border border-[#3B0A6B]/50 hover:border-white/40 z-10"
                  }`}
                  aria-label={item.title}
                >
                  {item.icon(20)}
                </button>
              );
            })}
          </div>

          {/* Active Feature Detail Card on Mobile (Floating) */}
          <div className="p-6 space-y-4 text-center select-none animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-xs font-mono text-electric-cyan font-bold">
                0{activeMobileIdx + 1} / 09
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">
                TAP TO EXPLORE ORBIT
              </span>
            </div>

            <div className="w-14 h-14 mx-auto flex items-center justify-center">
              {ecosystemFeatures[activeMobileIdx].icon(36)}
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight">
              {ecosystemFeatures[activeMobileIdx].title}
            </h3>

            {/* Mobile Typewriter Description */}
            <div
              onClick={() => setMobileExpanded((prev) => !prev)}
              className="cursor-pointer"
            >
              <TypewriterDescription
                shortText={ecosystemFeatures[activeMobileIdx].shortText}
                extendedText={ecosystemFeatures[activeMobileIdx].extendedText}
                isHovered={mobileExpanded}
              />
            </div>

            {/* Stepper Controls */}
            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => {
                  setActiveMobileIdx(
                    (prev) => (prev - 1 + totalPoints) % totalPoints
                  );
                  setMobileExpanded(false);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-white/80 hover:text-electric-cyan hover:border-electric-cyan transition-colors"
              >
                ← PREV
              </button>
              <div className="flex space-x-1">
                {ecosystemFeatures.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveMobileIdx(i);
                      setMobileExpanded(false);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      activeMobileIdx === i
                        ? "bg-electric-cyan w-4"
                        : "bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  setActiveMobileIdx((prev) => (prev + 1) % totalPoints);
                  setMobileExpanded(false);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-white/80 hover:text-electric-cyan hover:border-electric-cyan transition-colors"
              >
                NEXT →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
