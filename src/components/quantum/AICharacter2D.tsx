import { motion, useAnimationControls, Variants, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useMemo } from "react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type AICharacterState = "idle" | "thinking" | "talking" | "listening" | "speaking";

interface AICharacter2DProps {
  state?: AICharacterState;
  className?: string;
  /**
   * Base width in px — height scales automatically.
   * Full robot at size=100 is ~100px wide × ~120px tall.
   * Default: 100
   */
  size?: number;
  /** Compact mode: size=72, reduced glow. */
  compact?: boolean;
  /**
   * Minimal mode: ALL body animations off, no mouth, no rings.
   * Only eye blink remains. Perfect for in-message avatars.
   */
  minimal?: boolean;
  interactiveMode?: "default" | "mouse";
}

// ─────────────────────────────────────────────
// Robot-level Animation Variants
// ─────────────────────────────────────────────

// Shared easing curves
const EASE_SOFT   = [0.45, 0.05, 0.55, 0.95] as const;
const EASE_SPRING = [0.34, 1.56, 0.64, 1]   as const;

/** Whole-robot float — includes chest-rise breathing on idle */
const floatVariants: Variants = {
  idle: {
    y: [0, -6, 0],
    scale: [1, 1.025, 1],
    transition: { duration: 4.2, repeat: Infinity, ease: EASE_SOFT },
  },
  thinking: {
    y: [0, -3, 0],
    scale: 1,
    transition: { duration: 1.6, repeat: Infinity, ease: EASE_SOFT },
  },
  talking: {
    y: [0, -4, 0, -4, 0],
    scale: [1, 1.015, 1, 1.015, 1],
    transition: { duration: 0.68, repeat: Infinity, ease: EASE_SOFT },
  },
  listening: {
    y: [0, -4, 0],
    scale: [1, 1.015, 1],
    transition: { duration: 3.0, repeat: Infinity, ease: EASE_SOFT },
  },
  speaking: {
    y: [0, -5, 0],
    scale: [1, 1.01, 1],
    transition: { duration: 3.0, repeat: Infinity, ease: EASE_SOFT },
  },
};

/** Head state variants — soft curves; jitter layered separately */
const headVariants: Variants = {
  idle:      { rotate: 0, x: 0, y: 0,         transition: { duration: 0.6, ease: EASE_SPRING } },
  thinking:  { rotate: [-3, 3, -3, 3, 0],      transition: { duration: 0.6, repeat: Infinity, ease: EASE_SOFT } },
  talking:   { y: [0, -3, 0, -2, 0], rotate: [-1, 1, -1, 1, 0], transition: { duration: 0.42, repeat: Infinity, ease: EASE_SOFT } },
  listening: { rotate: [0, 1, 0, -1, 0], y: [0, -1, 0], transition: { duration: 3.5, repeat: Infinity, ease: EASE_SOFT } },
  speaking:  { y: [0, -1, 0], rotate: [0, 0.5, 0, -0.5, 0], transition: { duration: 2.8, repeat: Infinity, ease: EASE_SOFT } },
};

/** Left arm */
const leftArmVariants: Variants = {
  idle:      { rotate: [0, -7, 0],              transition: { duration: 3.6, repeat: Infinity, ease: EASE_SOFT } },
  thinking:  { rotate: 14,                       transition: { duration: 0.55, ease: EASE_SPRING } },
  talking:   { rotate: [-35, -5, -28, -5, -35], transition: { duration: 1.05, repeat: Infinity, ease: EASE_SOFT } },
  listening: { rotate: [0, -5, 0],              transition: { duration: 3.2, repeat: Infinity, ease: EASE_SOFT } },
  speaking:  { rotate: [0, -4, 0],              transition: { duration: 3.6, repeat: Infinity, ease: EASE_SOFT } },
};

/** Right arm — mirror with phase offset */
const rightArmVariants: Variants = {
  idle:      { rotate: [0, 7, 0],              transition: { duration: 3.6, repeat: Infinity, ease: EASE_SOFT, delay: 0.45 } },
  thinking:  { rotate: -14,                    transition: { duration: 0.55, ease: EASE_SPRING } },
  talking:   { rotate: [35, 5, 28, 5, 35],    transition: { duration: 1.05, repeat: Infinity, ease: EASE_SOFT, delay: 0.32 } },
  listening: { rotate: [0, 5, 0],              transition: { duration: 3.2, repeat: Infinity, ease: EASE_SOFT, delay: 0.45 } },
  speaking:  { rotate: [0, 4, 0],              transition: { duration: 3.6, repeat: Infinity, ease: EASE_SOFT, delay: 0.45 } },
};

/** Chest core light */
const coreLightVariants: Variants = {
  idle:      { opacity: [0.32, 0.62, 0.32], scale: [1, 1.08, 1],        transition: { duration: 4.0, repeat: Infinity, ease: EASE_SOFT } },
  thinking:  { opacity: [1, 0.06, 1],       scale: [1, 1.28, 1],        transition: { duration: 0.52, repeat: Infinity, ease: EASE_SOFT } },
  talking:   { opacity: 1,                  scale: [1, 1.5, 1, 1.3, 1], transition: { duration: 0.48, repeat: Infinity, ease: EASE_SOFT } },
  listening: { opacity: [0.4, 0.7, 0.4],    scale: [1, 1.1, 1],         transition: { duration: 2.8, repeat: Infinity, ease: EASE_SOFT } },
  speaking:  { opacity: 1,                  scale: [1, 1.5, 1, 1.3, 1], transition: { duration: 0.48, repeat: Infinity, ease: EASE_SOFT } },
};

/** Head orb glow */
const headGlowVariants: Variants = {
  idle: {
    boxShadow: "0 0 8px 2px rgba(0,229,255,0.12), 0 0 18px 4px rgba(0,180,255,0.06)",
    transition: { duration: 0.8, ease: EASE_SOFT },
  },
  thinking: {
    boxShadow: [
      "0 0 10px 3px rgba(160,80,255,0.32), 0 0 22px 6px rgba(100,0,255,0.16)",
      "0 0 22px 8px rgba(160,80,255,0.64), 0 0 48px 16px rgba(100,0,255,0.30)",
      "0 0 10px 3px rgba(160,80,255,0.32), 0 0 22px 6px rgba(100,0,255,0.16)",
    ],
    transition: { duration: 1.3, repeat: Infinity, ease: EASE_SOFT },
  },
  talking: {
    boxShadow: [
      "0 0 12px 4px rgba(0,255,180,0.38), 0 0 26px 8px rgba(0,200,120,0.18)",
      "0 0 26px 10px rgba(0,255,180,0.70), 0 0 56px 20px rgba(0,200,120,0.36)",
      "0 0 12px 4px rgba(0,255,180,0.38), 0 0 26px 8px rgba(0,200,120,0.18)",
    ],
    transition: { duration: 0.50, repeat: Infinity, ease: EASE_SOFT },
  },
  listening: {
    boxShadow: [
      "0 0 10px 3px rgba(0,229,255,0.25), 0 0 22px 6px rgba(0,180,255,0.12)",
      "0 0 18px 6px rgba(0,229,255,0.45), 0 0 36px 12px rgba(0,180,255,0.22)",
      "0 0 10px 3px rgba(0,229,255,0.25), 0 0 22px 6px rgba(0,180,255,0.12)",
    ],
    transition: { duration: 2.4, repeat: Infinity, ease: EASE_SOFT },
  },
  speaking: {
    boxShadow: [
      "0 0 16px 6px rgba(0,255,180,0.50), 0 0 32px 12px rgba(0,200,120,0.25)",
      "0 0 32px 14px rgba(0,255,180,0.85), 0 0 64px 24px rgba(0,200,120,0.45)",
      "0 0 16px 6px rgba(0,255,180,0.50), 0 0 32px 12px rgba(0,200,120,0.25)",
    ],
    transition: { duration: 0.50, repeat: Infinity, ease: EASE_SOFT },
  },
};

/**
 * Eye iris glow flicker — layered over blink scaleY.
 * Simulates subtle energy fluctuation inside the eye.
 */
const eyeGlowFlickerVariants: Variants = {
  idle:      { opacity: [1, 0.78, 0.94, 0.72, 1], transition: { duration: 6.5, repeat: Infinity, ease: EASE_SOFT } },
  thinking:  { opacity: [1, 0.58, 1, 0.68, 1],    transition: { duration: 1.8, repeat: Infinity, ease: EASE_SOFT } },
  talking:   { opacity: [1, 0.84, 1],              transition: { duration: 0.56, repeat: Infinity, ease: EASE_SOFT } },
  listening: { opacity: [1, 0.85, 0.95, 0.80, 1],  transition: { duration: 4.0, repeat: Infinity, ease: EASE_SOFT } },
  speaking:  { opacity: [1, 0.84, 1],              transition: { duration: 0.56, repeat: Infinity, ease: EASE_SOFT } },
};

// ─────────────────────────────────────────────
// Helper: derive accent colours from state
// ─────────────────────────────────────────────
function accentFrom(s: AICharacterState) {
  switch (s) {
    case "thinking":  return "#a855f7";
    case "talking":   return "#00ffb2";
    case "speaking":  return "#00ffb2";
    case "listening": return "#00e5ff";
    default:          return "#00e5ff";
  }
}
function accentDimFrom(s: AICharacterState) {
  switch (s) {
    case "thinking":  return "rgba(168,85,247,0.25)";
    case "talking":   return "rgba(0,255,178,0.25)";
    case "speaking":  return "rgba(0,255,178,0.30)";
    case "listening": return "rgba(0,229,255,0.25)";
    default:          return "rgba(0,229,255,0.25)";
  }
}

// ─────────────────────────────────────────────
// Eye Component
// ─────────────────────────────────────────────
function Eye({ state, eyeSize, pupilX, pupilY }: { state: AICharacterState; eyeSize: number; pupilX?: any; pupilY?: any }) {
  const blinkControls = useAnimationControls();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const blink = async () => {
      if (cancelled) return;
      await blinkControls.start({ scaleY: 0.06, transition: { duration: 0.06, ease: "easeIn" } });
      if (cancelled) return;
      // Slight overshoot on reopen for lifelike feel
      await blinkControls.start({ scaleY: 1, transition: { duration: 0.13, ease: [0.34, 1.56, 0.64, 1] } });
    };

    const scheduleNext = () => {
      if (cancelled) return;
      const delay =
        state === "thinking" ? 2600 + Math.random() * 400 :
        state === "talking"  ? 4000 + Math.random() * 1000 :
        5500 + Math.random() * 3000;

      timerRef.current = setTimeout(async () => {
        await blink();
        scheduleNext();
      }, delay);
    };

    blinkControls.start({ scaleY: 1 });
    scheduleNext();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state, blinkControls]);

  const eyeColor  = state === "thinking" ? "#bf80ff" : state === "talking" ? "#00ffb2" : "#00e5ff";
  const glowColor = state === "thinking" ? "rgba(160,80,255,0.7)" : state === "talking" ? "rgba(0,255,178,0.7)" : "rgba(0,229,255,0.7)";
  const spread    = Math.round(eyeSize * 0.5);
  const soft      = Math.ceil(eyeSize * 0.15);

  // Outer wrapper = glow flicker (opacity); inner = blink (scaleY)
  return (
    <motion.div
      variants={eyeGlowFlickerVariants}
      animate={state}
      style={{ position: "relative", width: eyeSize, height: eyeSize, flexShrink: 0 }}
    >
      <motion.div
        animate={blinkControls}
        style={{
          width: "100%", height: "100%",
          borderRadius: "50%",
          background: `radial-gradient(circle at 38% 38%, #ffffff 0%, ${eyeColor} 45%, #001020 100%)`,
          boxShadow: `0 0 ${spread}px ${soft}px ${glowColor}, 0 0 ${spread * 2}px ${soft * 2}px ${glowColor}35`,
          transformOrigin: "center",
          x: pupilX,
          y: pupilY,
        }}
      />
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Mouth Component
// ─────────────────────────────────────────────
function Mouth({ state, width }: { state: AICharacterState; width: number }) {
  const base = Math.max(1.5, width * 0.1);
  const color = state === "thinking" ? "#bf80ff" : state === "talking" ? "#00ffb2" : "#00e5ff";

  const mouthVariants: Variants = {
    idle:     { height: base, scaleY: 1,             transition: { duration: 0.4 } },
    thinking: { height: base, scaleY: [1, 0.35, 1],  transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } },
    talking:  {
      height: [base, base * 3, base, base * 2.2, base, base * 3.5, base],
      borderRadius: ["2px", "3px", "2px", "3px", "2px", "3px", "2px"],
      transition: { duration: 0.44, repeat: Infinity, ease: "easeInOut" },
    },
    speaking: {
      height: [base, base * 2.5, base, base * 2, base, base * 3, base],
      borderRadius: ["2px", "3px", "2px", "3px", "2px", "3px", "2px"],
      transition: { duration: 0.52, repeat: Infinity, ease: "easeInOut" },
    },
  };

  return (
    <motion.div
      variants={mouthVariants} animate={state} initial="idle"
      style={{ width, background: color, borderRadius: 2, boxShadow: `0 0 ${Math.ceil(width * 0.25)}px 1px ${color}80` }}
    />
  );
}

// ─────────────────────────────────────────────
// Head — circular face orb
// ─────────────────────────────────────────────
function Head({ es, headSize, minimal, pupilX, pupilY }: {
  es: AICharacterState; headSize: number; minimal: boolean; pupilX?: any; pupilY?: any;
}) {
  const eyeSize = Math.max(4, Math.round(headSize * 0.15));
  const eyeGap  = Math.max(4, Math.round(headSize * 0.20));
  const faceGap = Math.max(2, Math.round(headSize * 0.10));
  const mouthW  = Math.max(6, Math.round(headSize * 0.33));
  const accent  = accentFrom(es);
  const dim     = accentDimFrom(es);

  return (
    <motion.div
      variants={minimal ? undefined : headGlowVariants}
      animate={minimal ? undefined : es}
      style={{
        width: headSize, height: headSize,
        borderRadius: "50%",
        background: `radial-gradient(circle at 34% 30%, rgba(255,255,255,0.09) 0%, rgba(0,40,80,0.92) 52%, rgba(0,10,30,0.98) 100%)`,
        border: `1.5px solid ${accent}70`,
        position: "relative",
        overflow: "hidden",
        boxShadow: minimal ? `0 0 6px 1px ${accent}15` : undefined,
        flexShrink: 0,
      }}
    >
      {/* Inner colour glow */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: `radial-gradient(circle at 50% 42%, ${dim} 0%, transparent 65%)`,
      }} />
      {/* Scanlines */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden", pointerEvents: "none",
        background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,255,0.018) 3px, rgba(0,255,255,0.018) 4px)",
        zIndex: 2,
      }} />
      {/* Specular */}
      <div style={{
        position: "absolute", top: "10%", left: "16%", width: "28%", height: "16%",
        borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,255,255,0.16) 0%, transparent 80%)",
        transform: "rotate(-20deg)", zIndex: 3, pointerEvents: "none",
      }} />
      {/* Face */}
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: faceGap, zIndex: 5,
      }}>
        <div style={{ display: "flex", gap: eyeGap, alignItems: "center" }}>
          <Eye state={minimal ? "idle" : es} eyeSize={eyeSize} pupilX={pupilX} pupilY={pupilY} />
          <Eye state={minimal ? "idle" : es} eyeSize={eyeSize} pupilX={pupilX} pupilY={pupilY} />
        </div>
        {!minimal && <Mouth state={es} width={mouthW} />}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Arm — left or right with shoulder joint
// ─────────────────────────────────────────────
function Arm({ side, es, armW, armH, minimal }: {
  side: "left" | "right";
  es: AICharacterState;
  armW: number; armH: number;
  minimal: boolean;
}) {
  const accent    = accentFrom(es);
  const variants  = side === "left" ? leftArmVariants : rightArmVariants;
  const origin    = side === "left" ? "top center" : "top center";
  const shoulder  = Math.round(armW * 1.15);

  return (
    <motion.div
      variants={minimal ? undefined : variants}
      animate={minimal ? undefined : es}
      style={{
        transformOrigin: origin,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Shoulder joint sphere */}
      <div style={{
        width: shoulder, height: shoulder,
        borderRadius: "50%",
        background: `radial-gradient(circle at 40% 36%, rgba(0,229,255,0.20) 0%, rgba(0,40,80,0.90) 100%)`,
        border: `1px solid ${accent}60`,
        boxShadow: `0 0 5px 1px ${accent}25`,
        flexShrink: 0,
      }} />
      {/* Arm body */}
      <div style={{
        width: armW,
        height: armH,
        borderRadius: Math.round(armW * 0.45),
        background: `linear-gradient(180deg, rgba(0,40,80,0.96) 0%, rgba(0,18,45,0.99) 100%)`,
        border: `1px solid ${accent}45`,
        boxShadow: `0 0 6px 1px ${accent}20, inset 0 0 5px rgba(0,229,255,0.06)`,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Inner ridge line */}
        <div style={{
          position: "absolute",
          top: "18%", bottom: "18%",
          left: "50%", width: 1,
          background: `${accent}35`,
          transform: "translateX(-50%)",
        }} />
        {/* Small elbow detail dot */}
        <div style={{
          position: "absolute",
          top: "55%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: Math.max(2, Math.round(armW * 0.3)),
          height: Math.max(2, Math.round(armW * 0.3)),
          borderRadius: "50%",
          background: accent,
          opacity: 0.5,
        }} />
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Core Chest Light
// ─────────────────────────────────────────────
function CoreLight({ es, coreSize, minimal }: {
  es: AICharacterState; coreSize: number; minimal: boolean;
}) {
  const accent = accentFrom(es);
  return (
    <motion.div
      variants={minimal ? undefined : coreLightVariants}
      animate={minimal ? undefined : es}
      style={{
        width: coreSize, height: coreSize,
        borderRadius: "50%",
        background: `radial-gradient(circle, #ffffff 0%, ${accent} 45%, ${accent}40 80%, transparent 100%)`,
        boxShadow: minimal
          ? `0 0 4px 1px ${accent}35`
          : `0 0 10px 4px ${accent}55, 0 0 20px 8px ${accent}20`,
        flexShrink: 0,
      }}
    />
  );
}

// ─────────────────────────────────────────────
// Torso
// ─────────────────────────────────────────────
function Torso({ es, torsoW, torsoH, coreSize, u, minimal }: {
  es: AICharacterState; torsoW: number; torsoH: number;
  coreSize: number; u: number; minimal: boolean;
}) {
  const accent = accentFrom(es);
  const r      = Math.round(8 * u);

  return (
    <div style={{
      width: torsoW, height: torsoH,
      borderRadius: r,
      background: `linear-gradient(155deg, rgba(0,45,85,0.96) 0%, rgba(0,18,45,0.99) 100%)`,
      border: `1.5px solid ${accent}50`,
      boxShadow: minimal
        ? `0 0 6px 1px ${accent}12`
        : `0 0 14px 3px ${accent}18, inset 0 0 12px rgba(0,229,255,0.04)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      flexShrink: 0,
    }}>
      {/* Scanlines */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,255,255,0.012) 4px, rgba(0,255,255,0.012) 5px)",
      }} />
      {/* Upper chest accent line */}
      <div style={{
        position: "absolute", top: "22%", left: "18%", right: "18%",
        height: 1, background: `${accent}28`, borderRadius: 1,
      }} />
      {/* Core light — centrepiece */}
      <CoreLight es={es} coreSize={coreSize} minimal={minimal} />
      {/* Lower chest accent line */}
      <div style={{
        position: "absolute", bottom: "20%", left: "18%", right: "18%",
        height: 1, background: `${accent}18`, borderRadius: 1,
      }} />
      {/* Corner rivets */}
      {[["14%","14%"],["14%","auto"],["auto","14%"],["auto","auto"]].map(([t,b],i) => (
        <div key={i} style={{
          position: "absolute",
          top: t !== "auto" ? t : undefined,
          bottom: b !== "auto" ? b : undefined,
          left: i % 2 === 0 ? "12%" : undefined,
          right: i % 2 === 1 ? "12%" : undefined,
          width: Math.max(2, Math.round(3 * u)),
          height: Math.max(2, Math.round(3 * u)),
          borderRadius: "50%",
          background: `${accent}50`,
        }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Neck connector
// ─────────────────────────────────────────────
function Neck({ accent, neckW, neckH }: { accent: string; neckW: number; neckH: number }) {
  return (
    <div style={{
      width: neckW, height: neckH,
      background: `linear-gradient(180deg, ${accent}28 0%, ${accent}10 100%)`,
      border: `1px solid ${accent}35`,
      borderTop: "none",
      borderBottomLeftRadius: 3,
      borderBottomRightRadius: 3,
      flexShrink: 0,
    }} />
  );
}

// ─────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// Listening Pulse Ring — rendered around character
// ─────────────────────────────────────────────
function ListeningPulseRing({ size, accent }: { size: number; accent: string }) {
  const ringSize = Math.round(size * 1.35);
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: ringSize,
        height: ringSize,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {/* Ring 1 — main pulse */}
      <motion.div
        animate={{
          scale: [1, 1.35, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{ duration: 2.0, repeat: Infinity, ease: EASE_SOFT }}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `2px solid ${accent}`,
          boxShadow: `0 0 12px 2px ${accent}40`,
        }}
      />
      {/* Ring 2 — delayed secondary pulse */}
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{ duration: 2.0, repeat: Infinity, ease: EASE_SOFT, delay: 0.6 }}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `1.5px solid ${accent}80`,
        }}
      />
      {/* Ring 3 — subtle outer ring */}
      <motion.div
        animate={{
          scale: [1, 1.7, 1],
          opacity: [0.15, 0, 0.15],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: EASE_SOFT, delay: 1.0 }}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `1px solid ${accent}50`,
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────
export default function AICharacter2D({
  state    = "idle",
  className = "",
  size: sizeProp = 100,
  compact  = false,
  minimal  = false,
  interactiveMode = "default",
}: AICharacter2DProps) {
  const size = compact ? 72 : sizeProp;
  const u    = size / 100;
  // Map "speaking" → "talking" and "listening" → "listening" for internal animation dispatch
  const resolvedState: AICharacterState = useMemo(() => {
    if (minimal || interactiveMode === "mouse") return "idle";
    return state;
  }, [state, minimal, interactiveMode]);
  // For sub-components: speaking keeps its own animations now (no remapping to talking)
  const es: AICharacterState = resolvedState;
  const disableBody = minimal || interactiveMode === "mouse";
  const showPulseRing = resolvedState === "listening" && !minimal;

  // ── Imperative animation controls ─────────────────────────
  const jitterControls    = useAnimationControls(); // random micro head jitter
  const attentionControls = useAnimationControls(); // state transition nod
  const prevStateRef      = useRef<AICharacterState>("idle");

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 25 });
  const pupilX = useTransform(springX, [-1, 1], [-4, 4]);
  const pupilY = useTransform(springY, [-1, 1], [-3, 3]);

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

  // ── Random micro head jitter (idle only, every 5–8s) ──────
  useEffect(() => {
    if (disableBody || es !== "idle") return;
    let cancelled = false;

    const jitter = async () => {
      if (cancelled) return;
      const dx = (Math.random() - 0.5) * 3;   // ±1.5px
      const dy = (Math.random() - 0.5) * 1.5; // ±0.75px
      await jitterControls.start({ x: dx, y: dy, transition: { duration: 0.16, ease: [0.34, 1.56, 0.64, 1] } });
      if (cancelled) return;
      await jitterControls.start({ x: 0, y: 0,   transition: { duration: 0.32, ease: EASE_SOFT } });
    };

    const schedule = () => {
      if (cancelled) return;
      const delay = 5000 + Math.random() * 3000;
      setTimeout(async () => { await jitter(); schedule(); }, delay);
    };

    const initId = setTimeout(schedule, 1800);
    return () => { cancelled = true; clearTimeout(initId); };
  }, [es, minimal, jitterControls]);

  // ── Attention behaviour on state transitions ──────────────
  useEffect(() => {
    if (disableBody) return;
    const prev = prevStateRef.current;
    prevStateRef.current = es;

    if (es === "talking") {
      // Message arrived → quick upward nod
      const nod = async () => {
        await attentionControls.start({ y: -4, rotate: -2, transition: { duration: 0.18, ease: "easeOut" } });
        await attentionControls.start({ y:  2, rotate:  1, transition: { duration: 0.14, ease: "easeIn"  } });
        await attentionControls.start({ y:  0, rotate:  0, transition: { duration: 0.24, ease: EASE_SPRING } });
      };
      nod();
    } else if (es === "speaking") {
      // Speaking → gentle nod (no aggressive head bob)
      const nod = async () => {
        await attentionControls.start({ y: -2, rotate: -1, transition: { duration: 0.22, ease: "easeOut" } });
        await attentionControls.start({ y:  0, rotate:  0, transition: { duration: 0.30, ease: EASE_SPRING } });
      };
      nod();
    } else if (es === "thinking" && prev === "idle") {
      // User sent message → slight curious head tilt
      const tilt = async () => {
        await attentionControls.start({ rotate:  4, transition: { duration: 0.25, ease: EASE_SOFT   } });
        await attentionControls.start({ rotate:  0, transition: { duration: 0.50, ease: EASE_SPRING } });
      };
      tilt();
    }
  }, [es, minimal, attentionControls]);

  // Derived dimensions
  const headSize = Math.round(54 * u);
  const neckW    = Math.round(14 * u);
  const neckH    = Math.round(7  * u);
  const torsoW   = Math.round(52 * u);
  const torsoH   = Math.round(42 * u);
  const armW     = Math.round(12 * u);
  const armH     = Math.round(30 * u);
  const armGap   = Math.round(3  * u);
  const coreSize = Math.round(9  * u);
  const accent   = accentFrom(es);

  return (
    <div
      className={className}
      style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", position: "relative" }}
      aria-label={`AI robot – ${state}`}
      role="img"
    >
      {/* Listening pulse ring — rendered behind robot */}
      {showPulseRing && <ListeningPulseRing size={size} accent={accentFrom(resolvedState)} />}
      {/* ── Whole robot float + breathing scale ── */}
      <motion.div
        variants={disableBody ? undefined : floatVariants}
        animate={disableBody ? undefined : es}
        style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        {/*
         * Head has 3 stacked motion layers:
         *  1. headVariants      – state-driven shake / nod (declarative)
         *  2. attentionControls – transition nod / tilt (imperative)
         *  3. jitterControls    – random micro-jitter  (imperative)
         */}
        <motion.div variants={disableBody ? undefined : headVariants} animate={disableBody ? undefined : es}>
          <motion.div animate={disableBody ? undefined : attentionControls}>
            <motion.div animate={disableBody ? undefined : jitterControls}>
              <Head 
                es={es} 
                headSize={headSize} 
                minimal={minimal} 
                pupilX={interactiveMode === "mouse" ? pupilX : undefined}
                pupilY={interactiveMode === "mouse" ? pupilY : undefined}
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ── Neck ── */}
        <Neck accent={accent} neckW={neckW} neckH={neckH} />

        {/* ── Body row: Left Arm + Torso + Right Arm ── */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: armGap }}>
          <Arm side="left"  es={es} armW={armW} armH={armH} minimal={disableBody} />
          <Torso es={es} torsoW={torsoW} torsoH={torsoH} coreSize={coreSize} u={u} minimal={disableBody} />
          <Arm side="right" es={es} armW={armW} armH={armH} minimal={disableBody} />
        </div>
      </motion.div>
    </div>
  );
}
