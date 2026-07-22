import { motion } from 'framer-motion';
import {
  BrainCircuit, HeartPulse, Pill, CloudSun, TrainFront, Sigma, Factory,
} from 'lucide-react';
import GridGlowBackground from './GridGlowBackground';

const PROJECTS = [
  { icon: BrainCircuit, title: 'Quantum AI', body: 'Hybrid models that fuse quantum sampling with classical machine learning.' },
  { icon: HeartPulse, title: 'Healthcare', body: 'Simulation tools for diagnostics, treatment modeling, and biological systems.' },
  { icon: Pill, title: 'Drug Discovery', body: 'Faster molecular screening and reaction modeling for pharmaceutical research.' },
  { icon: CloudSun, title: 'Climate Simulation', body: 'Modeling atmospheric and ecological systems at higher fidelity.' },
  { icon: TrainFront, title: 'Smart Transportation', body: 'Quantum-inspired routing and scheduling for large-scale transit networks.' },
  { icon: Sigma, title: 'Scientific Computing', body: 'General-purpose quantum simulation infrastructure for research teams.' },
  { icon: Factory, title: 'Industrial Optimization', body: 'Resource allocation and process optimization across complex operations.' },
];

export default function Research() {
  return (
    <section id="research" className="section research-section">
      <GridGlowBackground glow="top-right" />

      <div className="section-inner">
        <span className="eyebrow reveal">Research &amp; Innovation</span>
        <h2 className="section-title reveal">Where we're pointing the simulator next.</h2>

        <div className="research-grid">
          {PROJECTS.map((p, i) => (
            <motion.div
              className="research-card glass reveal"
              key={p.title}
              style={{ transitionDelay: `${(i % 4) * 80}ms` }}
              whileHover={{ y: -8, borderColor: 'rgba(76,233,255,0.5)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <p.icon className="research-icon" size={24} strokeWidth={1.6} />
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
