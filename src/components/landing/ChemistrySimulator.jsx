import { useState } from 'react';
import { ArrowRight, X, FlaskConical } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import VideoBackground from './VideoBackground';

const TOPICS = [
  'Molecular Interactions',
  'Chemical Reactions',
  'Drug Discovery',
  'Material Science',
  'Quantum Chemistry',
  'Computational Research',
];

export default function ChemistrySimulator() {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <section id="chemistry" className="section chemistry-section">
      <VideoBackground
        src="/landing/videos/chemistry-molecule.mp4"
        poster="/landing/posters/chemistry-molecule.jpg"
        overlay="left"
      />

      <div className="section-inner">
        <div className="side-panel reveal">
          <span className="eyebrow">Quantum Chemistry Simulator</span>
          <h2 className="section-title">
            Simulate matter at the level it actually behaves.
          </h2>
          <p className="section-lede">
            From molecular interactions to full chemical reactions, Alpha Paradox
            models matter at quantum resolution &mdash; giving drug discovery and
            material science teams a faster path from hypothesis to result.
          </p>

          <div className="chip-row">
            {TOPICS.map((t) => (
              <span className="chip" key={t}>{t}</span>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: 38 }}
            onClick={() => setInfoOpen(true)}
          >
            Learn More <ArrowRight className="icon" />
          </button>
        </div>
      </div>

      {/* Read-only details panel — informational only, no launch/open action,
          so visitors can understand the product without being asked to sign
          in or start a workspace. */}
      <AnimatePresence>
        {infoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={() => setInfoOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-lg bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close"
                className="absolute top-4 right-4 h-8 w-8 rounded-full border border-border bg-background/50 hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center"
                onClick={() => setInfoOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center mb-5 shadow-lg shadow-accent/20">
                <FlaskConical className="w-6 h-6 text-background" />
              </div>

              <h3 className="text-2xl font-bold text-foreground mb-3">
                Quantum Chemistry Simulator
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                From molecular interactions to full chemical reactions, Alpha Paradox
                models matter at quantum resolution — giving drug discovery and
                material science teams a faster path from hypothesis to result.
              </p>

              <div className="flex flex-wrap gap-2 mt-6">
                {TOPICS.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-medium px-2.5 py-1 rounded-full border border-accent/25 bg-accent/10 text-accent"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
