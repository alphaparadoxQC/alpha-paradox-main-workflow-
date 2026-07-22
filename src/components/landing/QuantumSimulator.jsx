import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import GridGlowBackground from './GridGlowBackground';
import QuantumCircuitArt from './QuantumCircuitArt';

const FEATURES = [
  'Quantum Circuit Simulation',
  'Gate-Level Visualization',
  'Qubit State Analysis',
  'Research & Education',
  'Algorithm Testing',
  'Real-time Simulation',
];

export default function QuantumSimulator() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  return (
    <section id="simulator" className="section simulator-section">
      <GridGlowBackground glow="center" />

      <div className="section-inner two-col">
        <div className="reveal">
          <span className="eyebrow">Quantum Simulator</span>
          <h2 className="section-title">
            Watch every qubit, every gate, every state &mdash; as it happens.
          </h2>
          <p className="section-lede" style={{ marginBottom: 36 }}>
            A full-fidelity simulation environment for designing, running, and
            inspecting quantum circuits, built for researchers, educators, and
            algorithm developers.
          </p>

          <ul className="feature-list">
            {FEATURES.map((f) => (
              <li key={f}>
                <Check size={16} className="feature-check" />
                {f}
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: 40 }}
            disabled={loading}
            // Label always stays "Explore Simulator" — only where it goes
            // depends on auth: signed-in users land straight in the
            // builder, everyone else is sent to sign in first.
            onClick={() => navigate(user ? '/builder' : '/auth')}
          >
            Explore Simulator <ArrowRight className="icon" />
          </button>
        </div>

        <motion.div
          className="reveal"
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.16, 0.84, 0.44, 1] }}
        >
          <QuantumCircuitArt />
        </motion.div>
      </div>
    </section>
  );
}
