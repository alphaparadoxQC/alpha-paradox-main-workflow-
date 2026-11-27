"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

const TOTAL_FRAMES = 299;
const FRAME_PREFIX = "/frames/ezgif-frame-";

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
  const animationFrameIdRef = useRef<number | null>(null);

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
        }
      }

      // Progressively load all 299 frames
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
  const renderFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

      // Scale to fit comfortably within the viewport
      if (canvasRatio > imgRatio) {
        // Desktop / wide screens: fit to height with breathing space
        drawH = displayHeight * 0.90;
        drawW = drawH * imgRatio;
      } else {
        // Mobile / narrow screens: fit to width with margins
        drawW = displayWidth * 0.92;
        drawH = drawW / imgRatio;
      }

      // Ensure the hardware is locked dead center of the viewport
      const drawX = (displayWidth - drawW) / 2;
      const drawY = (displayHeight - drawH) / 2;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);


    }

    ctx.restore();
  }, []);

  // Smooth lerp render loop
  useEffect(() => {
    const loop = () => {
      const diff = targetFrameRef.current - currentFrameRef.current;
      if (Math.abs(diff) > 0.05) {
        // Easing interpolation for buttery smoothness
        currentFrameRef.current += diff * 0.22;
        const targetRender = Math.max(
          1,
          Math.min(TOTAL_FRAMES, Math.round(currentFrameRef.current))
        );
        renderFrame(targetRender);
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

      // Target frame mapping from 1 to 299
      const targetFrame = Math.max(
        1,
        Math.min(TOTAL_FRAMES, Math.round(progress * (TOTAL_FRAMES - 1)) + 1)
      );
      targetFrameRef.current = targetFrame;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", () => {
      renderFrame(Math.round(currentFrameRef.current));
      handleScroll();
    });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [renderFrame]);

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
            <span className="font-mono tracking-wider">Initializing Quantum Stream {loadProgress}%</span>
          </div>
        )}

        {/* Scroll Progress Bar at the Top */}
        <div className="fixed top-14 left-0 right-0 h-[2px] bg-white/[0.04] z-40 pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-royal-amethyst via-[#7B1FA2] to-electric-cyan transition-all duration-75 shadow-[0_0_8px_#00E5FF]"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>






      </div>

    </div>
  );
};
