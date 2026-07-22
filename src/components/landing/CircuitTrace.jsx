import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

/**
 * Signature element: a vertical circuit trace pinned to the edge of the
 * viewport. It fills with light as the visitor scrolls, echoing the
 * gate/trace motif from the hero video — the page is "powering on"
 * one qubit gate at a time as you descend through it.
 */
export default function CircuitTrace() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 60, damping: 20, mass: 0.4 });

  const nodes = [0.04, 0.18, 0.32, 0.46, 0.6, 0.74, 0.88, 0.98];

  return (
    <div className="circuit-trace" aria-hidden="true">
      <svg width="2" height="100%" viewBox="0 0 2 1000" preserveAspectRatio="none">
        <line x1="1" y1="0" x2="1" y2="1000" stroke="rgba(140,170,220,0.14)" strokeWidth="1" />
      </svg>
      <motion.div className="circuit-trace-fill" style={{ scaleY: progress }} />
      {nodes.map((n, i) => (
        <CircuitNode key={i} pos={n} progress={progress} />
      ))}
    </div>
  );
}

function CircuitNode({ pos, progress }) {
  const opacity = useTransform(progress, [Math.max(pos - 0.03, 0), pos], [0.25, 1]);
  const scale = useTransform(progress, [Math.max(pos - 0.03, 0), pos], [0.6, 1]);
  return (
    <motion.span
      className="circuit-node"
      style={{
        top: `${pos * 100}%`,
        opacity,
        scale,
      }}
    />
  );
}
