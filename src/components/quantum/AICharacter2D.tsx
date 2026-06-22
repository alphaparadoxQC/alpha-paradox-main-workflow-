import { motion, useAnimationControls, Variants, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useMemo, useState } from "react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type AICharacterState = "idle" | "thinking" | "talking" | "listening" | "speaking";

interface AICharacter2DProps {
  state?: AICharacterState;
  className?: string;
  size?: number;
  compact?: boolean;
  minimal?: boolean;
  interactiveMode?: "default" | "mouse";
}

// ─────────────────────────────────────────────
// Animation Variants
// ─────────────────────────────────────────────

const EASE_SOFT = [0.45, 0.05, 0.55, 0.95] as const;

/** Floating breathing motion */
const floatVariants: Variants = {
  idle: {
    y: [0, -5, 0],
    scale: [1, 1.015, 1],
    transition: { duration: 4.0, repeat: Infinity, ease: EASE_SOFT },
  },
  thinking: {
    y: [0, -2, 0],
    scale: 1,
    transition: { duration: 1.5, repeat: Infinity, ease: EASE_SOFT },
  },
  talking: {
    y: [0, -3, 0, -3, 0],
    scale: [1, 1.01, 1, 1.01, 1],
    transition: { duration: 0.65, repeat: Infinity, ease: EASE_SOFT },
  },
  listening: {
    y: [0, -3, 0],
    scale: [1, 1.01, 1],
    transition: { duration: 2.8, repeat: Infinity, ease: EASE_SOFT },
  },
  speaking: {
    y: [0, -4, 0],
    scale: [1, 1.008, 1],
    transition: { duration: 2.8, repeat: Infinity, ease: EASE_SOFT },
  },
};

/** Left arm holding flask variants */
const flaskArmVariants: Variants = {
  idle: {
    y: [0, -2, 0],
    rotate: [0, -1, 0],
    transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
  },
  talking: {
    y: [0, -6, 2, -6, 0],
    rotate: [0, -4, 2, -4, 0],
    transition: { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
  },
  speaking: {
    y: [0, -5, 1.5, -5, 0],
    rotate: [0, -3, 1.5, -3, 0],
    transition: { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
  },
  listening: {
    y: [0, -1.5, 0],
    rotate: [0, -0.7, 0],
    transition: { duration: 3.0, repeat: Infinity, ease: "easeInOut" }
  },
  thinking: {
    y: [0, -1, 0],
    rotate: [0, -0.5, 0],
    transition: { duration: 2.0, repeat: Infinity, ease: "easeInOut" }
  }
};

/** Right arm holding clipboard variants */
const clipboardArmVariants: Variants = {
  idle: {
    y: [0, 1.5, 0],
    rotate: [0, 0.8, 0],
    transition: { duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }
  },
  talking: {
    y: [0, 2.5, -2, 2.5, 0],
    rotate: [0, 3, -2, 3, 0],
    transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.1 }
  },
  speaking: {
    y: [0, 2, -1.5, 2, 0],
    rotate: [0, 2, -1.5, 2, 0],
    transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.1 }
  },
  listening: {
    y: [0, 1.2, 0],
    rotate: [0, 0.6, 0],
    transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }
  },
  thinking: {
    y: [0, 0.5, 0],
    transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
  }
};

const hologramFlickerVariants: Variants = {
  idle: {
    opacity: [0.82, 0.78, 0.82, 0.85, 0.82],
    transition: { duration: 4, repeat: Infinity, ease: "linear" }
  },
  thinking: {
    opacity: [0.85, 0.7, 0.9, 0.65, 0.85],
    transition: { duration: 0.25, repeat: Infinity, ease: "linear" }
  },
  talking: {
    opacity: [0.88, 0.82, 0.88, 0.8, 0.88],
    transition: { duration: 0.15, repeat: Infinity, ease: "linear" }
  },
  listening: {
    opacity: [0.84, 0.8, 0.84, 0.86, 0.84],
    transition: { duration: 3, repeat: Infinity, ease: "linear" }
  },
  speaking: {
    opacity: [0.88, 0.82, 0.88],
    transition: { duration: 0.12, repeat: Infinity, ease: "linear" }
  }
};

// ─────────────────────────────────────────────
// Main 2D Cartoon Scientist
// ─────────────────────────────────────────────
export default function AICharacter2D({
  state = "idle",
  className = "",
  size: sizeProp = 175,
  compact = false,
  minimal = false,
  interactiveMode = "default",
}: AICharacter2DProps) {
  const size = compact ? 72 : sizeProp;

  const resolvedState: AICharacterState = useMemo(() => {
    if (minimal || interactiveMode === "mouse") return "idle";
    return state;
  }, [state, minimal, interactiveMode]);

  const es: AICharacterState = resolvedState;
  const disableBody = minimal || interactiveMode === "mouse";
  const showPulseRing = resolvedState === "listening" && !minimal;

  // ── Blinking Animation State ──
  const [eyeOpen, setEyeOpen] = useState(true);
  useEffect(() => {
    let timer: any;
    const scheduleBlink = () => {
      const delay = 3500 + Math.random() * 3000;
      timer = setTimeout(() => {
        setEyeOpen(false);
        setTimeout(() => {
          setEyeOpen(true);
          scheduleBlink();
        }, 110);
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timer);
  }, []);

  // ── Speaking Animation State (Mouth movement) ──
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (state !== "talking" && state !== "speaking" && state !== "thinking") return;
    let animId: number;
    const tick = () => {
      setPhase((p) => (p + 0.2) % (Math.PI * 2));
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [state]);

  // ── Mouse-Tracking Interactive Pupil Offset ──
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 120, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 20 });
  const pupilX = useTransform(springX, [-1, 1], [-3.5, 3.5]);
  const pupilY = useTransform(springY, [-1, 1], [-2.5, 2.5]);

  useEffect(() => {
    if (interactiveMode !== "mouse") return;
    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mouseX.set((e.clientX - cx) / cx);
      mouseY.set((e.clientY - cy) / cy);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [interactiveMode, mouseX, mouseY]);

  // ── Animated Mouth ──
  const mouthElement = useMemo(() => {
    if (state === "talking" || state === "speaking") {
      const openAmount = 4 + Math.sin(phase * 2) * 2;
      return (
        <path
          d={`M 92,93 Q 100,${93 + openAmount} 108,93 Q 100,92 92,93`}
          fill="rgba(216, 27, 96, 0.6)"
          stroke="#1c1d24"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      );
    } else {
      return (
        <path
          d="M 94,93 Q 100,97 106,93"
          fill="none"
          stroke="#1c1d24"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      );
    }
  }, [state, phase]);

  // ── Animated Eyes ──
  const leftEye = useMemo(() => {
    if (eyeOpen) {
      return (
        <g>
          <ellipse cx="85" cy="72" rx="4.5" ry="6.5" fill="#1c1d24" />
          <circle cx="83.5" cy="69.5" r="1.5" fill="#ffffff" />
          <circle cx="86.5" cy="74.5" r="0.7" fill="#ffffff" />
        </g>
      );
    } else {
      return <path d="M 80,72 Q 85,76 90,72" fill="none" stroke="#1c1d24" strokeWidth="2.2" strokeLinecap="round" />;
    }
  }, [eyeOpen]);

  const rightEye = useMemo(() => {
    if (eyeOpen) {
      return (
        <g>
          <ellipse cx="115" cy="72" rx="4.5" ry="6.5" fill="#1c1d24" />
          <circle cx="113.5" cy="69.5" r="1.5" fill="#ffffff" />
          <circle cx="116.5" cy="74.5" r="0.7" fill="#ffffff" />
        </g>
      );
    } else {
      return <path d="M 110,72 Q 115,76 120,72" fill="none" stroke="#1c1d24" strokeWidth="2.2" strokeLinecap="round" />;
    }
  }, [eyeOpen]);

  return (
    <motion.div
      variants={minimal ? undefined : hologramFlickerVariants}
      animate={minimal ? undefined : es}
      className={className}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
      aria-label={`AI cartoon scientist – ${state}`}
      role="img"
    >
      {/* Dynamic CSS animations for flowing color cycling */}
      <style>{`
        @keyframes startColorCycle {
          0% { stop-color: #ff0055; }
          25% { stop-color: #ffaa00; }
          50% { stop-color: #ff00cc; }
          75% { stop-color: #9d00ff; }
          100% { stop-color: #ff0055; }
        }
        @keyframes endColorCycle {
          0% { stop-color: #9d00ff; }
          25% { stop-color: #ff0055; }
          50% { stop-color: #ffaa00; }
          75% { stop-color: #00ffcc; }
          100% { stop-color: #9d00ff; }
        }
        .chroma-start {
          animation: startColorCycle 8s infinite linear;
        }
        .chroma-end {
          animation: endColorCycle 8s infinite linear;
        }
      `}</style>

      {/* Pulse ring for speech input */}
      {showPulseRing && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: Math.round(size * 1.3),
            height: Math.round(size * 1.3),
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2.0, repeat: Infinity, ease: EASE_SOFT }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `2px solid rgba(255, 0, 127, 0.4)`,
              boxShadow: `0 0 8px 1px rgba(255, 0, 127, 0.15)`,
            }}
          />
        </div>
      )}

      {/* Float & Breathe Container */}
      <motion.div
        variants={disableBody ? undefined : floatVariants}
        animate={disableBody ? undefined : es}
        style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <svg
          width={size}
          height={(size * 240) / 200}
          viewBox="0 0 200 240"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: "visible", pointerEvents: "none" }}
        >
          <defs>
            <linearGradient id="strokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className="chroma-start" />
              <stop offset="100%" className="chroma-end" />
            </linearGradient>
          </defs>

          {/* ── Background bubbles near flask ── */}
          {!minimal && (
            <>
              <motion.circle cx="163" cy="58" r="1.5" fill="rgba(168, 85, 247, 0.7)" animate={{ y: [-3, 3, -3] }} transition={{ duration: 2, repeat: Infinity }} />
              <motion.circle cx="170" cy="53" r="1.0" fill="rgba(168, 85, 247, 0.7)" animate={{ y: [3, -3, 3] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }} />
            </>
          )}

          {/* ── Fluffy Hair (Back layer) ── */}
          <path
            d="M 64,55 C 50,55 52,65 56,70 C 48,72 46,82 54,85 C 50,90 54,100 62,96" 
            fill="rgba(240, 240, 240, 0.45)"
            stroke="#1c1d24"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 136,55 C 150,55 148,65 144,70 C 152,72 154,82 146,85 C 150,90 146,100 138,96" 
            fill="rgba(240, 240, 240, 0.45)"
            stroke="#1c1d24"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* ── Left Arm / Flask (Raised, Animated Hand Movement) ── */}
          <motion.g
            variants={disableBody ? undefined : flaskArmVariants}
            animate={disableBody ? undefined : es}
            style={{ originX: "132px", originY: "130px" }}
          >
            {/* Arm sleeve */}
            <path
              d="M 132,130 Q 150,115 160,88"
              fill="none"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="15"
              strokeLinecap="round"
            />
            <path
              d="M 132,130 Q 150,115 160,88"
              fill="none"
              stroke="#1c1d24"
              strokeWidth="2.2"
            />
            {/* Hand */}
            <circle cx="160" cy="85" r="6" fill="rgba(253, 218, 197, 0.5)" stroke="#1c1d24" strokeWidth="2.2" />

            {/* Science Flask */}
            <path
              d="M 158,74 L 166,74 L 166,80 L 175,98 L 150,98 L 158,80 Z"
              fill="rgba(255, 255, 255, 0.35)"
              stroke="#1c1d24"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M 152,91 L 173,91 L 175,97 L 150,97 Z"
              fill="rgba(168, 85, 247, 0.6)"
            />
          </motion.g>

          {/* ── Right Arm / Clipboard (Animated Hand Movement) ── */}
          <motion.g
            variants={disableBody ? undefined : clipboardArmVariants}
            animate={disableBody ? undefined : es}
            style={{ originX: "68px", originY: "130px" }}
          >
            {/* Arm sleeve */}
            <path
              d="M 68,130 Q 52,142 50,165"
              fill="none"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="15"
              strokeLinecap="round"
            />
            <path
              d="M 68,130 Q 52,142 50,165"
              fill="none"
              stroke="#1c1d24"
              strokeWidth="2.2"
            />
            {/* Hand */}
            <circle cx="50" cy="167" r="6" fill="rgba(253, 218, 197, 0.5)" stroke="#1c1d24" strokeWidth="2.2" />

            {/* Clipboard */}
            <g transform="rotate(-12 45 170)">
              <rect x="34" y="152" width="20" height="26" rx="2" fill="rgba(180, 110, 50, 0.5)" stroke="#1c1d24" strokeWidth="2" />
              <rect x="38" y="156" width="12" height="18" fill="rgba(245, 245, 245, 0.7)" />
              <line x1="41" y1="160" x2="47" y2="160" stroke="#1c1d24" strokeWidth="0.8" />
              <line x1="41" y1="164" x2="47" y2="164" stroke="#1c1d24" strokeWidth="0.8" />
              <line x1="41" y1="168" x2="45" y2="168" stroke="#1c1d24" strokeWidth="0.8" />
            </g>
          </motion.g>

          {/* ── Neck ── */}
          <path
            d="M 94,105 L 94,120 L 106,120 L 106,105 Z"
            fill="rgba(253, 218, 197, 0.5)"
            stroke="#1c1d24"
            strokeWidth="2.2"
          />

          {/* ── Blue Shirt & Red Tie ── */}
          <path
            d="M 90,118 L 110,118 L 107,135 L 93,135 Z"
            fill="rgba(100, 149, 237, 0.45)"
            stroke="#1c1d24"
            strokeWidth="2"
          />
          <path
            d="M 97,122 L 103,122 L 105,152 L 100,160 L 95,152 Z"
            fill="rgba(255, 65, 54, 0.55)"
            stroke="#1c1d24"
            strokeWidth="2"
          />

          {/* ── Torso / White Lab Coat ── */}
          <path
            d="M 68,125 C 68,125 75,185 75,185 L 125,185 C 125,185 132,125 132,125 Z"
            fill="rgba(255, 255, 255, 0.45)"
            stroke="#1c1d24"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M 68,125 L 94,145 L 86,185"
            fill="none"
            stroke="#1c1d24"
            strokeWidth="2.2"
          />
          <path
            d="M 132,125 L 106,145 L 114,185"
            fill="none"
            stroke="#1c1d24"
            strokeWidth="2.2"
          />

          {/* ── Belt ── */}
          <rect x="75" y="185" width="50" height="8" fill="rgba(160, 90, 44, 0.5)" stroke="#1c1d24" strokeWidth="2" />
          <rect x="95" y="183" width="10" height="12" fill="rgba(255, 215, 0, 0.6)" stroke="#1c1d24" strokeWidth="1.8" />

          {/* ── Trousers ── */}
          <path
            d="M 77,193 L 94,193 L 94,220 L 77,220 Z"
            fill="rgba(112, 128, 144, 0.45)"
            stroke="#1c1d24"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M 106,193 L 123,193 L 123,220 L 106,220 Z"
            fill="rgba(112, 128, 144, 0.45)"
            stroke="#1c1d24"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* ── Shoes ── */}
          <path
            d="M 73,220 C 73,220 70,230 77,230 L 96,230 C 96,230 96,220 96,220 Z"
            fill="rgba(43, 45, 66, 0.5)"
            stroke="#1c1d24"
            strokeWidth="2.2"
          />
          <path
            d="M 104,220 C 104,220 104,230 104,230 L 123,230 C 130,230 127,220 127,220 Z"
            fill="rgba(43, 45, 66, 0.5)"
            stroke="#1c1d24"
            strokeWidth="2.2"
          />

          {/* ── Head/Face Outline ── */}
          <path
            d="M 64,75 C 64,115 136,115 136,75 C 136,35 64,35 64,75 Z"
            fill="rgba(253, 218, 197, 0.5)"
            stroke="#1c1d24"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* ── Eyebrows ── */}
          <path d="M 80,63 Q 85,60 90,63" fill="none" stroke="#1c1d24" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 110,63 Q 115,60 120,63" fill="none" stroke="#1c1d24" strokeWidth="2.2" strokeLinecap="round" />

          {/* ── Eyes (Blinking + Pupil Tracking) ── */}
          <g>
            <motion.g style={{ x: pupilX, y: pupilY }}>
              {leftEye}
            </motion.g>
            <motion.g style={{ x: pupilX, y: pupilY }}>
              {rightEye}
            </motion.g>
          </g>

          {/* ── Spectacles (Glasses overlay) ── */}
          {!minimal && (
            <g>
              {/* Left Lens */}
              <circle
                cx="85"
                cy="72"
                r="11.5"
                fill="rgba(0, 229, 255, 0.05)"
                stroke="#1c1d24"
                strokeWidth="2"
              />
              {/* Right Lens */}
              <circle
                cx="115"
                cy="72"
                r="11.5"
                fill="rgba(0, 229, 255, 0.05)"
                stroke="#1c1d24"
                strokeWidth="2"
              />
              {/* Bridge */}
              <path
                d="M 96.5,72 L 103.5,72"
                stroke="#1c1d24"
                strokeWidth="2"
              />
            </g>
          )}

          {/* ── Mustache ── */}
          <path
            d="M 88,86 C 88,82 96,82 100,85 C 104,82 112,82 112,86 C 112,89 104,88 100,88 C 96,88 88,89 88,86 Z"
            fill="rgba(220, 220, 220, 0.6)"
            stroke="#1c1d24"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* ── Mouth (Animated speaking / talking) ── */}
          {!minimal && mouthElement}

          {/* ── Chromatic Overlay Frame ── */}
          {!minimal && (
            <path
              d="M 64,75 C 64,115 136,115 136,75 C 136,35 64,35 64,75 Z"
              fill="none"
              stroke="url(#strokeGrad)"
              strokeWidth="1.2"
              opacity="0.4"
            />
          )}
        </svg>
      </motion.div>
    </motion.div>
  );
}

