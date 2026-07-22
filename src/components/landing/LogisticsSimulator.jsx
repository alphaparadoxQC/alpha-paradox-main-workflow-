import { ArrowRight } from 'lucide-react';
import VideoBackground from './VideoBackground';

const TOPICS = [
  'Indian Railways',
  'Route Optimization',
  'Scheduling',
  'Resource Allocation',
  'Supply Chain Intelligence',
  'Congestion Prediction',
];

export default function LogisticsSimulator() {
  return (
    <section id="logistics" className="section logistics-section">
      <VideoBackground
        src="/landing/videos/logistics-rail.mp4"
        poster="/landing/posters/logistics-rail.jpg"
        overlay="right"
      />

      <div className="section-inner">
        <div className="side-panel side-panel-right reveal">
          <span className="eyebrow">Quantum Logistics Simulator</span>
          <h2 className="section-title">
            Networks move smarter when routing thinks ahead.
          </h2>
          <p className="section-lede">
            Optimizing railway logistics, scheduling, routing, freight movement,
            and operational efficiency with AI and quantum-inspired optimization
            &mdash; built for networks at national scale.
          </p>

          <div className="chip-row">
            {TOPICS.map((t) => (
              <span className="chip" key={t}>{t}</span>
            ))}
          </div>

          <a href="#vision" className="btn btn-primary" style={{ marginTop: 38 }}>
            View Platform <ArrowRight className="icon" />
          </a>
        </div>
      </div>
    </section>
  );
}
