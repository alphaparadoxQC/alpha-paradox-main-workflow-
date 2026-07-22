import { motion } from 'framer-motion';
import { Microscope, Route, Unlock, Wrench } from 'lucide-react';
import GridGlowBackground from './GridGlowBackground';

const PILLARS = [
  {
    icon: Microscope,
    title: 'Accelerate scientific discovery',
    body: 'Compress years of simulation into hours, so researchers spend their time on hypotheses, not on waiting for compute.',
  },
  {
    icon: Route,
    title: 'Solve optimization problems',
    body: 'Tackle combinatorial problems that grow too complex for classical solvers, from routing to resource allocation.',
  },
  {
    icon: Unlock,
    title: 'Make quantum computing accessible',
    body: 'Wrap quantum-grade simulation in interfaces scientists and engineers can use without a physics PhD.',
  },
  {
    icon: Wrench,
    title: 'Build practical quantum solutions',
    body: 'Ship software that solves real industrial problems today, on hardware that exists, not hardware that might.',
  },
];

const STATS = [
  { label: 'State space', value: 'Exponential', detail: 'vs. linear classical scaling' },
  { label: 'Simulation core', value: 'Real-time', detail: 'gate-level feedback' },
  { label: 'Deployment', value: 'Cloud-native', detail: 'research to production' },
];

export default function WhyWeBuild() {
  return (
    <section id="why" className="section why-section">
      <GridGlowBackground glow="top-left" />

      <div className="section-inner">
        <span className="eyebrow reveal">Why We Build</span>
        <h2 className="section-title reveal">
          Classical computing is hitting a wall science can't wait for.
        </h2>
        <p className="section-lede reveal">
          Molecular interactions, logistics networks, and optimization landscapes
          grow exponentially complex — far faster than classical hardware can keep up.
          Alpha Paradox builds the simulation and intelligence layer that lets
          researchers and engineers work at that scale today.
        </p>

        <div className="pillar-grid">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              className="pillar-card glass reveal"
              style={{ transitionDelay: `${i * 90}ms` }}
              whileHover={{ y: -6 }}
            >
              <p.icon className="pillar-icon" size={26} strokeWidth={1.6} />
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </motion.div>
          ))}
        </div>

        <div className="stat-row reveal">
          {STATS.map((s) => (
            <div className="stat-item" key={s.label}>
              <span className="mono-tag">{s.label}</span>
              <span className="stat-value">{s.value}</span>
              <span className="stat-detail">{s.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
