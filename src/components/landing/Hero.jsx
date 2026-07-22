import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import VideoBackground from './VideoBackground';

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.14, delayChildren: 0.25 },
  },
};

const item = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 0.84, 0.44, 1] } },
};

export default function Hero() {
  return (
    <section id="top" className="section hero-section">
      <VideoBackground src="/landing/videos/hero-quantum-core.mp4" poster="/landing/posters/hero-quantum-core.jpg" overlay="dark" />

      <motion.div
        className="section-inner hero-inner"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.span className="eyebrow" variants={item}>
          Alpha Paradox QC &mdash; Research Lab
        </motion.span>

        <motion.h1 className="hero-title" variants={item}>
          The Future Runs on
          <br />
          <span className="text-gradient">Quantum Intelligence</span>
        </motion.h1>

        <motion.p className="hero-sub" variants={item}>
          Building next-generation Quantum Simulators, Logistics Intelligence,
          Chemistry Simulation, and AI-powered Research Platforms.
        </motion.p>

        <motion.div className="hero-cta" variants={item}>
          <a href="#simulator" className="btn btn-primary">
            Explore Technology <ArrowRight className="icon" />
          </a>
          <Link to="/gallery" className="btn btn-ghost">
            <PlayCircle className="icon" /> Watch Demo
          </Link>
        </motion.div>
      </motion.div>

      <motion.a
        href="#why"
        className="scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        aria-label="Scroll to next section"
      >
        <span>Scroll</span>
        <ChevronDown size={16} />
      </motion.a>
    </section>
  );
}
