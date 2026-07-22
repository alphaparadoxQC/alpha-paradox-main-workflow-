import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, X, GraduationCap, Building2,
  Atom, FlaskConical, Pill, Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QuantumAssistant } from '@/components/quantum/QuantumAssistant';
import { SEO } from '@/components/shared/SEO';

import Navbar from '@/components/landing/Navbar';
import CircuitTrace from '@/components/landing/CircuitTrace';
import Hero from '@/components/landing/Hero';
import WhyWeBuild from '@/components/landing/WhyWeBuild';
import QuantumSimulator from '@/components/landing/QuantumSimulator';
import ChemistrySimulator from '@/components/landing/ChemistrySimulator';
import LogisticsSimulator from '@/components/landing/LogisticsSimulator';
import Vision from '@/components/landing/Vision';
import Research from '@/components/landing/Research';
import Footer from '@/components/landing/Footer';
import useScrollReveal from '@/hooks/useScrollReveal';

import '@/styles/landing.css';

export default function Landing() {
  const navigate = useNavigate();
  useScrollReveal();

  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [activeProductTab, setActiveProductTab] = useState<'category' | 'education' | 'industry'>('category');

  const handleOpenProducts = () => {
    setIsProductsOpen(true);
    setActiveProductTab('category');
  };

  // Keep the design's "lock to top on load" behavior from the standalone project.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="qc-landing">
      <SEO
        title="Alpha ParadoxQC — Visual Quantum Circuit Builder, Chemistry & Drug Simulation"
        description="Design quantum circuits, run VQE chemistry simulations, and evaluate drug candidates — no SDK setup required. Free browser-based quantum computing platform."
        canonical="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Alpha ParadoxQC Private Limited",
          "url": "https://alphaparadoxqc.com",
          "logo": "https://alphaparadoxqc.com/logo.png",
          "foundingDate": "2026-07-04",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "3/1, West Kamarthuba Road, Habra",
            "addressRegion": "West Bengal",
            "postalCode": "743263",
            "addressCountry": "IN"
          },
          "email": "quantum@alphaparadoxqc.com",
          "founder": {
            "@type": "Person",
            "name": "Sourojit Mondal"
          }
        }}
      />

      <Navbar onOpenProducts={handleOpenProducts} />
      <CircuitTrace />

      <main>
        <Hero />
        <WhyWeBuild />
        <QuantumSimulator />
        <ChemistrySimulator />
        <LogisticsSimulator />
        <Vision />
        <Research />
      </main>

      <Footer />

      {/* Products Modal — same functionality as the previous landing page,
          restyled to sit on top of the new design. */}
      <AnimatePresence>
        {isProductsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
            onClick={() => setIsProductsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-5xl bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-8 w-8 rounded-full border border-border bg-background/50 hover:bg-accent text-muted-foreground hover:text-foreground z-10"
                onClick={() => setIsProductsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>

              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2">
                    <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                      Our Platforms
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select a platform category to launch your workspace
                  </p>
                </div>
                {activeProductTab !== 'category' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mr-10 text-xs text-muted-foreground hover:text-foreground gap-1 border border-border/50 bg-background/25"
                    onClick={() => setActiveProductTab('category')}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Categories
                  </Button>
                )}
              </div>

              <ScrollArea className="flex-1 pr-1">
                <AnimatePresence mode="wait">
                  {activeProductTab === 'category' && (
                    <motion.div
                      key="categories"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="grid md:grid-cols-2 gap-6 py-4"
                    >
                      <div
                        className="group relative p-6 sm:p-8 rounded-2xl border border-border/80 bg-gradient-to-br from-sidebar-accent/10 to-sidebar/20 hover:border-primary/50 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-primary/5"
                        onClick={() => setActiveProductTab('education')}
                      >
                        <div>
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/20">
                            <GraduationCap className="w-7 h-7 text-background" />
                          </div>
                          <h3 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                            Educational Suites
                            <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Simulate and learn quantum systems, molecular structures, and pharmaceutical design. Access high-fidelity local or cloud backends.
                          </p>
                        </div>
                        <div className="mt-8 flex items-center justify-between text-xs font-semibold text-primary">
                          <span>Explore 2 educational simulators</span>
                          <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20">Ready to simulate</span>
                        </div>
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-primary/30" />
                      </div>

                      <div
                        className="group relative p-6 sm:p-8 rounded-2xl border border-border/80 bg-gradient-to-br from-sidebar-accent/10 to-sidebar/20 hover:border-secondary/50 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:shadow-secondary/5"
                        onClick={() => setActiveProductTab('industry')}
                      >
                        <div>
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-secondary/20">
                            <Building2 className="w-7 h-7 text-background" />
                          </div>
                          <h3 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                            Industrial Solutions
                            <ArrowRight className="w-4 h-4 text-secondary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Scale workloads up to 100+ qubits using high-performance tensor network contraction and execute tasks across multi-cloud QPU providers.
                          </p>
                        </div>
                        <div className="mt-8 flex items-center justify-between text-xs font-semibold text-secondary">
                          <span>Enterprise access and integration</span>
                          <span className="px-2 py-0.5 rounded bg-secondary/10 border border-secondary/20">Under development</span>
                        </div>
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-secondary/30" />
                      </div>
                    </motion.div>
                  )}

                  {activeProductTab === 'education' && (
                    <motion.div
                      key="education"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 py-4"
                    >
                      <div className="group rounded-2xl border border-border/80 bg-sidebar/35 overflow-hidden flex flex-col hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                        <div className="h-44 overflow-hidden relative border-b border-border bg-black/45">
                          <img
                            src="/quantum_simulator.png"
                            alt="Quantum Simulator"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/20 backdrop-blur-md border border-primary/30 text-[10px] font-bold text-primary">
                            <Atom className="w-3.5 h-3.5" />
                            Simulator
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                              Quantum Simulator
                            </h4>
                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                              Drag-and-drop quantum circuit builder with real-time state vector, density matrix, and MPS simulation.
                            </p>
                          </div>
                          <Button
                            className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold"
                            onClick={() => {
                              setIsProductsOpen(false);
                              navigate('/products/circuit-builder');
                            }}
                          >
                            Explore Simulator
                          </Button>
                        </div>
                      </div>

                      <div className="group rounded-2xl border border-border/80 bg-sidebar/35 overflow-hidden flex flex-col hover:border-accent/50 transition-all duration-300 hover:shadow-lg">
                        <div className="h-44 overflow-hidden relative border-b border-border bg-black/45">
                          <img
                            src="/chemistry_simulator.png"
                            alt="Chemistry Simulator"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-accent/20 backdrop-blur-md border border-accent/30 text-[10px] font-bold text-accent">
                            <FlaskConical className="w-3.5 h-3.5" />
                            Chemistry
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-lg text-foreground group-hover:text-accent transition-colors">
                              Chemistry Workbench
                            </h4>
                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                              Variational Quantum Eigensolver (VQE) and UCCSD ansatz optimizer for molecular ground-state energy calculations.
                            </p>
                          </div>
                          <Button
                            className="w-full mt-6 bg-accent text-accent-foreground hover:bg-accent/95 text-xs font-semibold"
                            onClick={() => {
                              setIsProductsOpen(false);
                              navigate('/products/chemistry-simulation');
                            }}
                          >
                            Explore Chemistry
                          </Button>
                        </div>
                      </div>

                      {/* Schematic Designer */}
                      <div className="group rounded-2xl border border-border/80 bg-sidebar/35 overflow-hidden flex flex-col hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg">
                        <div className="h-44 overflow-hidden relative border-b border-border bg-black/45">
                          <div className="w-full h-full bg-[#0a0f19] flex items-center justify-center text-purple-500/40 font-mono text-xs select-none">
                            <Cpu className="w-12 h-12 text-purple-500/20 animate-pulse" />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-500/20 backdrop-blur-md border border-purple-500/30 text-[10px] font-bold text-purple-400">
                            <Cpu className="w-3.5 h-3.5" />
                            Schematic
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-lg text-foreground group-hover:text-purple-400 transition-colors">
                              Schematic Designer
                            </h4>
                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                              AI-powered natural language electronic circuit builder, command execution engine, and SPICE layout exporter.
                            </p>
                          </div>
                          <Button
                            className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
                            onClick={() => {
                              setIsProductsOpen(false);
                              navigate('/circuits');
                            }}
                          >
                            Launch Circuits
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeProductTab === 'industry' && (
                    <motion.div
                      key="industry"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="py-12 px-6 flex flex-col items-center justify-center text-center max-w-md mx-auto"
                    >
                      <div className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center text-secondary mb-6 border border-secondary/20 animate-pulse">
                        <Building2 className="w-8 h-8" />
                      </div>
                      <h4 className="text-xl font-bold text-foreground">
                        Industrial Solutions
                      </h4>
                      <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                        We don't have active industrial products on the platform yet. Our enterprise tensor solvers and multi-QPU compilation pipelines are currently under development.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-8 border-border hover:bg-accent text-xs font-semibold"
                        onClick={() => setActiveProductTab('category')}
                      >
                        Return to Categories
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <QuantumAssistant />
    </div>
  );
}
