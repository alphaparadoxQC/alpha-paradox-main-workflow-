"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

const TOTAL_FRAMES = 299;
const FRAME_PREFIX = "/frames/ezgif-frame-";

interface HardwareMilestone {
  step: string;
  side: "right" | "left";
  range: [number, number];
  title: string;
  subtitle: string;
}

const MILESTONES: HardwareMilestone[] = [
  {
    step: "01",
    side: "right",
    range: [0.0, 0.15],
    title: "Full-Stack Quantum Co-Design Platform",
    subtitle:
      "Alpha Notebook and Composer unify high-level algorithmic circuits with physical cryogenic transmon physics, co-designing QPU topology and multi-qubit Hamiltonian matrices before fabrication.",
  },
  {
    step: "02",
    side: "left",
    range: [0.15, 0.4],
    title: "Silicon EDA to Cleanroom GDSII Tapeout",
    subtitle:
      "Our Silicon EDA 2D/3D Engine translates schematic qubits into sub-micron lithography masks, generating DRC/LVS-verified GDSII layouts for Dolan Josephson junctions and coplanar waveguide resonators.",
  },
  {
    step: "03",
    side: "right",
    range: [0.4, 0.65],
    title: "Microwave Pulse Synthesis & AWG Control",
    subtitle:
      "The Microwave Pulse Engine compiles abstract gate operations into sub-nanosecond DRAG envelopes I(t) and Q(t), directly driving Arbitrary Waveform Generators to suppress state leakage into non-computational manifolds.",
  },
  {
    step: "04",
    side: "left",
    range: [0.65, 0.85],
    title: "Cryogenic Interconnect & 3D Packaging",
    subtitle:
      "Our 3D EM Solver computes high-frequency S-parameters and return loss (S11 < -25 dB) across superconducting coaxial feedlines, preserving microwave phase coherence from 300 K racks down to the 10 mK mixing chamber.",
  },
  {
    step: "05",
    side: "right",
    range: [0.85, 1.0],
    title: "Autonomous Real-Time QLDPC Decoder",
    subtitle:
      "The QLDPC Decoder Engine closes the hardware loop, extracting physical syndrome measurements and executing sub-microsecond BP-OSD correction on Bivariate Bicycle codes (d=16) within physical coherence windows.",
  },
];

export const QuantumScrollytelling: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Frame loading state
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);


  // References for render loop
  const imagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const currentFrameRef = useRef<number>(1);
  const targetFrameRef = useRef<number>(1);
  const currentShiftRatioRef = useRef<number>(-1);
  const targetShiftRatioRef = useRef<number>(-1);
  const animationFrameIdRef = useRef<number | null>(null);

  // Helper to calculate target hardware horizontal glide ratio (-1 = left, +1 = right)
  const getHardwareTargetShift = useCallback((p: number): number => {
    const buffer = 0.035;
    if (p <= 0.15 - buffer) return -1;
    if (p < 0.15 + buffer) {
      const t = (p - (0.15 - buffer)) / (2 * buffer);
      return -1 + 2 * t;
    }
    if (p <= 0.4 - buffer) return 1;
    if (p < 0.4 + buffer) {
      const t = (p - (0.4 - buffer)) / (2 * buffer);
      return 1 - 2 * t;
    }
    if (p <= 0.65 - buffer) return -1;
    if (p < 0.65 + buffer) {
      const t = (p - (0.65 - buffer)) / (2 * buffer);
      return -1 + 2 * t;
    }
    if (p <= 0.85 - buffer) return 1;
    if (p < 0.85 + buffer) {
      const t = (p - (0.85 - buffer)) / (2 * buffer);
      return 1 - 2 * t;
    }
    return -1;
  }, []);

  // Helper to get image path for a frame (1 to 299)
  const getFramePath = useCallback((frameIndex: number) => {
    const padded = String(frameIndex).padStart(3, "0");
    return `${FRAME_PREFIX}${padded}.jpg`;
  }, []);

  // Preload initial frames and then stream remaining
  useEffect(() => {
    let isMounted = true;
    let loadedCount = 0;

    // Load first frame immediately
    const firstImg = new Image();
    firstImg.src = getFramePath(1);
    firstImg.onload = () => {
      if (!isMounted) return;
      imagesRef.current.set(1, firstImg);
      loadedCount++;
      setLoadProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
      setIsLoaded(true);
      renderFrame(1);
    };
    firstImg.onerror = () => {
      if (!isMounted) return;
      setIsLoaded(true);
    };

    // Preload all frames progressively
    const preloadFrames = async () => {
      // Prioritize key milestone frames first
      const priorityFrames = [
        1, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225,
        240, 255, 270, 285, 299,
      ];

      for (const idx of priorityFrames) {
        if (!imagesRef.current.has(idx)) {
          const img = new Image();
          img.src = getFramePath(idx);
          img.onload = () => {
            if (!isMounted) return;
            imagesRef.current.set(idx, img);
            loadedCount++;
            setLoadProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
          };
          img.onerror = () => {
            if (!isMounted) return;
            loadedCount++;
            setLoadProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
          };
        }
      }

      // Progressively load all frames
      for (let i = 1; i <= TOTAL_FRAMES; i++) {
        if (!imagesRef.current.has(i)) {
          const img = new Image();
          img.src = getFramePath(i);
          img.onload = () => {
            if (!isMounted) return;
            imagesRef.current.set(i, img);
            loadedCount++;
            setLoadProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
          };
          img.onerror = () => {
            if (!isMounted) return;
            loadedCount++;
            setLoadProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
          };
          // Small delay every batch to keep main thread completely unblocked
          if (i % 25 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
        }
      }
    };

    preloadFrames();

    return () => {
      isMounted = false;
    };
  }, [getFramePath]);

  // Render a specific frame onto the canvas with seamless background
  const renderFrame = useCallback((frameIndex: number, shiftRatioOverride?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use current or overridden shift ratio
    const shiftRatio =
      shiftRatioOverride !== undefined
        ? shiftRatioOverride
        : currentShiftRatioRef.current;

    // Find requested frame or nearest loaded fallback
    let img = imagesRef.current.get(frameIndex);
    if (!img) {
      // Look for closest cached frame
      let closestFrame = 1;
      let minDiff = Infinity;
      imagesRef.current.forEach((_, key) => {
        const diff = Math.abs(key - frameIndex);
        if (diff < minDiff) {
          minDiff = diff;
          closestFrame = key;
        }
      });
      img = imagesRef.current.get(closestFrame);
    }

    // Set canvas dimensions according to display and DPR
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (
      canvas.width !== displayWidth * dpr ||
      canvas.height !== displayHeight * dpr
    ) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Keep the canvas transparent so CSS atmosphere shows through the
    // JPEG's black studio backdrop via mix-blend-mode: lighten.
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
      // Calculate aspect ratio containment
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = displayWidth / displayHeight;

      let drawW: number;
      let drawH: number;

      // Scale to fit comfortably within the viewport with ample breathing room
      if (canvasRatio > imgRatio) {
        // Desktop / wide screens: fit to height with clear margin
        drawH = displayHeight * 0.80;
        drawW = drawH * imgRatio;
      } else {
        // Mobile / narrow screens: fit to width with margins
        drawW = displayWidth * 0.88;
        drawH = drawW / imgRatio;
      }

      // Horizontal offset: glide opposite to text location so hardware never overlaps text
      const isDesktop = displayWidth >= 1024;
      const isTablet = displayWidth >= 768 && displayWidth < 1024;
      const maxShift = isDesktop
        ? displayWidth * 0.16
        : isTablet
        ? displayWidth * 0.09
        : 0;
      const shiftX = shiftRatio * maxShift;

      const drawX = (displayWidth - drawW) / 2 + shiftX;
      const drawY = (displayHeight - drawH) / 2;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }

    ctx.restore();
  }, []);

  // Smooth lerp render loop for both frame rotation and horizontal position glide
  useEffect(() => {
    const loop = () => {
      const frameDiff = targetFrameRef.current - currentFrameRef.current;
      const shiftDiff = targetShiftRatioRef.current - currentShiftRatioRef.current;

      let shouldRender = false;

      if (Math.abs(frameDiff) > 0.05) {
        currentFrameRef.current += frameDiff * 0.22;
        shouldRender = true;
      }
      if (Math.abs(shiftDiff) > 0.005) {
        currentShiftRatioRef.current += shiftDiff * 0.15;
        shouldRender = true;
      }

      if (shouldRender) {
        const targetRender = Math.max(
          1,
          Math.min(TOTAL_FRAMES, Math.round(currentFrameRef.current))
        );
        renderFrame(targetRender, currentShiftRatioRef.current);
      }
      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [renderFrame]);

  // Scroll listener tracking progress through the container
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;

      // Calculate progress from 0 (top of section) to 1 (bottom of section)
      const scrolledPastTop = -rect.top;
      const totalScrollable = containerHeight - viewportHeight;

      if (totalScrollable <= 0) return;

      const progress = Math.max(0, Math.min(1, scrolledPastTop / totalScrollable));
      setScrollProgress(progress);

      // Update target horizontal shift for hardware positioning
      targetShiftRatioRef.current = getHardwareTargetShift(progress);

      // Target frame mapping from 1 to 299
      const targetFrame = Math.max(
        1,
        Math.min(TOTAL_FRAMES, Math.round(progress * (TOTAL_FRAMES - 1)) + 1)
      );
      targetFrameRef.current = targetFrame;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", () => {
      renderFrame(Math.round(currentFrameRef.current), currentShiftRatioRef.current);
      handleScroll();
    });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [renderFrame, getHardwareTargetShift]);

  // Calculate cross-fade opacity for each milestone stage
  const calculateStageOpacity = useCallback(
    (start: number, end: number, isFirst: boolean, isLast: boolean): number => {
      const buffer = 0.025; // 2.5% crossfade window

      if (!isFirst && scrollProgress < start - buffer) return 0;
      if (!isLast && scrollProgress > end + buffer) return 0;

      if (isFirst && scrollProgress <= start + buffer) return 1;
      if (isLast && scrollProgress >= end - buffer) return 1;

      if (!isFirst && scrollProgress < start + buffer) {
        return Math.max(
          0,
          Math.min(1, (scrollProgress - (start - buffer)) / (2 * buffer))
        );
      }
      if (!isLast && scrollProgress > end - buffer) {
        return Math.max(
          0,
          Math.min(1, (end + buffer - scrollProgress) / (2 * buffer))
        );
      }

      return 1;
    },
    [scrollProgress]
  );

  return (
    <div
      ref={containerRef}
      id="quantum-hardware"
      className="relative w-full text-white"
      style={{
        height: "450vh",
        background:
          "radial-gradient(ellipse 80% 70% at 18% 48%, rgba(8, 52, 62, 0.55) 0%, transparent 62%), radial-gradient(ellipse 75% 80% at 88% 42%, rgba(59, 10, 107, 0.48) 0%, transparent 58%), radial-gradient(ellipse 50% 50% at 50% 58%, rgba(123, 31, 162, 0.16) 0%, transparent 55%), #050505",
      }}
    >
      {/* Sticky Fullscreen Canvas Viewport: Locked to viewport while scrolling */}
      <div
        className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center"
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
          zIndex: 1,
          background:
            "radial-gradient(ellipse 80% 70% at 18% 48%, rgba(8, 52, 62, 0.55) 0%, transparent 62%), radial-gradient(ellipse 75% 80% at 88% 42%, rgba(59, 10, 107, 0.48) 0%, transparent 58%), radial-gradient(ellipse 50% 50% at 50% 58%, rgba(123, 31, 162, 0.16) 0%, transparent 55%), #050505",
        }}
      >
        {/* Ambient background — same teal-left / amethyst-right field as the site */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[48%] left-[16%] -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] bg-[#0A3A44]/45 rounded-full blur-[140px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[85vw] max-w-[1100px] max-h-[1100px] bg-[#3B0A6B]/28 rounded-full blur-[160px] animate-pulse-glow" />
          <div className="absolute top-[38%] left-[82%] -translate-x-1/2 -translate-y-1/2 w-[55vw] h-[55vw] max-w-[720px] max-h-[720px] bg-[#3B0A6B]/40 rounded-full blur-[150px]" />
          <div className="absolute top-[32%] left-[22%] -translate-x-1/2 -translate-y-1/2 w-[48vw] h-[48vw] max-w-[620px] max-h-[620px] bg-[#00E5FF]/14 rounded-full blur-[140px]" />
          <div className="absolute top-[68%] left-[45%] -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-[#7B1FA2]/20 rounded-full blur-[120px]" />
        </div>

        {/* Hardware frames: lighten drops the JPEG black into the site atmosphere */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block z-[1]"
          style={{ mixBlendMode: "lighten" }}
        />

        {/* Loading Overlay (minimal luxury pill) */}
        {!isLoaded && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-3 px-4 py-2 rounded-full bg-[#050505]/80 backdrop-blur-md border border-[#3B0A6B]/40 text-xs text-white/80 shadow-[0_0_20px_rgba(59,10,107,0.4)]">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-electric-cyan border-t-transparent animate-spin" />
            <span className="font-mono tracking-wider">
              Initializing Quantum Stream {loadProgress}%
            </span>
          </div>
        )}

        {/* Scroll Progress Bar at the Top */}
        <div className="fixed top-14 left-0 right-0 h-[2px] bg-white/[0.04] z-40 pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-royal-amethyst via-[#7B1FA2] to-electric-cyan transition-all duration-75 shadow-[0_0_8px_#00E5FF]"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>

        {/* Floating Alternating Typography Overlays: Tilted and Pushed Cleanly to Outer Edges */}
        {MILESTONES.map((milestone, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === MILESTONES.length - 1;
          const opacity = calculateStageOpacity(
            milestone.range[0],
            milestone.range[1],
            isFirst,
            isLast
          );
          if (opacity <= 0.001) return null;

          const isRight = milestone.side === "right";
          // Subtle vertical slide during entry/exit
          const translateY =
            (1 - opacity) * (scrollProgress < milestone.range[0] ? 16 : -16);

          return (
            <div
              key={milestone.step}
              className={`absolute z-20 pointer-events-none transition-all duration-150 ${
                isRight
                  ? "right-4 sm:right-8 md:right-12 lg:right-16 xl:right-24 top-1/2 -translate-y-1/2 max-w-sm sm:max-w-md md:max-w-[440px] lg:max-w-[480px] text-right flex flex-col items-end"
                  : "left-4 sm:left-8 md:left-12 lg:left-16 xl:left-24 top-1/2 -translate-y-1/2 max-w-sm sm:max-w-md md:max-w-[440px] lg:max-w-[480px] text-left flex flex-col items-start"
              }`}
              style={{
                opacity,
                transform: `perspective(1000px) rotateY(${
                  isRight ? -4 : 4
                }deg) translateY(calc(-50% + ${translateY}px))`,
                transformOrigin: isRight ? "right center" : "left center",
              }}
            >
              <h2
                className="text-4xl sm:text-5xl md:text-6xl lg:text-[62px] font-bold font-cursive tracking-normal leading-[1.2]"
                style={{
                  fontFamily:
                    "'Dancing Script', 'Caveat', 'Snell Roundhand', 'Brush Script MT', 'Apple Chancery', cursive",
                  background:
                    "linear-gradient(95deg, #4F75FF 0%, #9B51E0 50%, #EC4899 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {milestone.title}
              </h2>
              <p
                className={`mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-zinc-300 font-normal leading-relaxed ${
                  isRight ? "ml-auto" : "mr-auto"
                } max-w-md`}
              >
                {milestone.subtitle}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
