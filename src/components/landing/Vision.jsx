import { motion } from 'framer-motion';
import GridGlowBackground from './GridGlowBackground';

const ROADMAP = [
  {
    n: '01',
    title: 'Foundation',
    body: 'Core simulators for quantum circuits, chemistry, and logistics — built, tested, and put in front of real researchers.',
  },
  {
    n: '02',
    title: 'Scale',
    body: 'A multi-tenant cloud platform with expanded qubit capacity and APIs that plug straight into existing research pipelines.',
  },
  {
    n: '03',
    title: 'Industry Integration',
    body: 'Deep partnerships across rail networks, pharmaceutical research, and manufacturing operations.',
  },
  {
    n: '04',
    title: 'Quantum-Native Future',
    body: 'Hybrid classical-quantum execution as hardware matures, with Alpha Paradox software ready on day one.',
  },
];

export default function Vision() {
  return (
    <section id="vision" className="section vision-section">
      <GridGlowBackground glow="bottom-right" />

      <div className="section-inner">
        <span className="eyebrow reveal">Engineering Tomorrow</span>
        <h2 className="section-title reveal" style={{ maxWidth: 760 }}>
          A long-term bet on practical quantum software.
        </h2>
        <p className="section-lede reveal" style={{ marginBottom: 60 }}>
          Alpha Paradox is building toward a future where quantum simulation,
          scientific computing, and AI-powered optimization are standard
          infrastructure &mdash; not research curiosities.
        </p>

        <div className="roadmap">
          <div className="roadmap-line" />
          {ROADMAP.map((r, i) => (
            <motion.div
              className="roadmap-item reveal"
              key={r.n}
              style={{ transitionDelay: `${i * 110}ms` }}
            >
              <span className="roadmap-n">{r.n}</span>
              <h3>{r.title}</h3>
              <p>{r.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
