import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Zap, Globe, Atom, ArrowRight, Play, Layers, 
  Sparkles, GitFork, Cloud, Keyboard, ChevronDown,
  GraduationCap, Building2, ArrowLeft, X, FlaskConical, Pill
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { BRANDING } from '@/config/branding';
import { QuantumAssistant } from '@/components/quantum/QuantumAssistant';


// Animated particle field
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; hue: number; alpha: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        hue: [185, 265, 175, 330][Math.floor(Math.random() * 4)],
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.strokeStyle = `hsla(${particles[i].hue}, 80%, 60%, ${(1 - dist / 150) * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${p.alpha})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${p.alpha * 0.1})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}

const FEATURES = [
  {
    icon: <Layers className="w-6 h-6" />,
    title: 'Visual Circuit Builder',
    description: 'Drag-and-drop quantum gates onto qubit wires. See state evolution in real time.',
    color: 'from-primary to-primary/50',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Real QPU Access',
    description: 'Run circuits on IBM, IonQ, and Rigetti hardware via qBraid — free credits included.',
    color: 'from-secondary to-secondary/50',
  },
  {
    icon: <Atom className="w-6 h-6" />,
    title: 'Chemistry Simulations',
    description: 'VQE optimizer for molecular ground-state energy. Visualize electron configurations.',
    color: 'from-accent to-accent/50',
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'AI Assistant',
    description: 'Describe circuits in natural language. AI generates optimized quantum programs.',
    color: 'from-quantum-pink to-quantum-pink/50',
  },
  {
    icon: <GitFork className="w-6 h-6" />,
    title: 'Community Gallery',
    description: 'Share circuits, fork others\' work, and learn from the quantum community.',
    color: 'from-quantum-green to-quantum-green/50',
  },
  {
    icon: <Cloud className="w-6 h-6" />,
    title: 'Multi-Backend',
    description: 'Switch between local simulation, cloud simulators, and real quantum hardware.',
    color: 'from-quantum-orange to-quantum-orange/50',
  },
];

const STATS = [
  { value: '6+', label: 'Backends' },
  { value: '20+', label: 'Gate Types' },
  { value: '15', label: 'Max Qubits' },
  { value: 'Free', label: 'QPU Credits' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [activeProductTab, setActiveProductTab] = useState<'category' | 'education' | 'industry'>('category');

  const handleLaunch = () => {
    setIsProductsOpen(true);
    setActiveProductTab('category');
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex flex-col items-center justify-center px-4"
      >
        <ParticleField />
        
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(199_89%_48%_/_0.08)_0%,_transparent_70%)]" />

        {/* Nav */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/60 backdrop-blur-xl border-b border-border/50"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center"
            >
              <Cpu className="w-4 h-4 text-background" />
            </motion.div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              {BRANDING.platformName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-foreground hover:bg-accent/40"
              onClick={() => {
                setIsProductsOpen(true);
                setActiveProductTab('category');
              }}
            >
              Products <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/gallery">Gallery</Link>
            </Button>
            {user ? (
              <Button size="sm" onClick={() => navigate('/builder')}>
                Open Builder <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            )}
          </div>
        </motion.nav>

        {/* Hero content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              v2.0 — Now with real QPU access
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-5xl sm:text-7xl font-black leading-tight tracking-tight mt-6"
          >
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Quantum Computing
            </span>
            <br />
            <span className="text-foreground">
              in Your Browser
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-lg sm:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed"
          >
            Build, simulate, and run quantum circuits on real hardware.
            From drag-and-drop design to IonQ & Rigetti QPUs — no PhD required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          >
            <Button
              size="lg"
              onClick={handleLaunch}
              className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg shadow-primary/20"
            >
              <Play className="w-5 h-5 mr-2" />
              Launch Platforms
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/gallery')}
              className="text-lg px-8 py-6 border-border/50"
            >
              <Globe className="w-5 h-5 mr-2" />
              Explore Gallery
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 max-w-xl mx-auto"
          >
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl font-black text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-muted-foreground">Scroll to explore</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Features */}
      <section className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Everything You Need
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              A complete quantum computing workbench — from education to real research.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <div className="text-background">{f.icon}</div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_hsl(265_89%_60%_/_0.06)_0%,_transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center relative z-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Ready to explore the quantum realm?
          </h2>
          <p className="text-muted-foreground mt-4">
            Start building circuits in seconds. No installation, no credit card.
          </p>
          <Button
            size="lg"
            onClick={handleLaunch}
            className="mt-8 text-lg px-10 py-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          >
            Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 {BRANDING.platformName}. Built with ❤️ for quantum computing.</span>
          <div className="flex items-center gap-1">
            <Keyboard className="w-3 h-3" />
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">?</kbd> in the builder for shortcuts</span>
          </div>
        </div>
      </footer>

      {/* Products Modal Overlay */}
      <AnimatePresence>
        {isProductsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto"
            onClick={() => setIsProductsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-5xl bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-8 w-8 rounded-full border border-border bg-background/50 hover:bg-accent text-muted-foreground hover:text-foreground z-10"
                onClick={() => setIsProductsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Header */}
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

              {/* Main Content Area */}
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
                      {/* Education Category Card */}
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
                          <span>Explore 3 educational simulators</span>
                          <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20">Ready to simulate</span>
                        </div>
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-primary/30" />
                      </div>

                      {/* Industrial Use Category Card */}
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
                      className="grid md:grid-cols-3 gap-6 py-4"
                    >
                      {/* Quantum Simulator */}
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
                              navigate('/builder');
                            }}
                          >
                            Launch Builder
                          </Button>
                        </div>
                      </div>

                      {/* Chemistry Simulator */}
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
                              navigate('/chemistry');
                            }}
                          >
                            Launch Chemistry
                          </Button>
                        </div>
                      </div>

                      {/* Drug Simulator */}
                      <div className="group rounded-2xl border border-border/80 bg-sidebar/35 overflow-hidden flex flex-col hover:border-quantum-pink/50 transition-all duration-300 hover:shadow-lg">
                        <div className="h-44 overflow-hidden relative border-b border-border bg-black/45">
                          <img
                            src="/drug_simulator.png"
                            alt="Drug Simulator"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded bg-quantum-pink/20 backdrop-blur-md border border-quantum-pink/30 text-[10px] font-bold text-quantum-pink">
                            <Pill className="w-3.5 h-3.5" />
                            Pharma
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-lg text-foreground group-hover:text-quantum-pink transition-colors">
                              Pharma Workspace
                            </h4>
                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                              Quantum-driven pharmaceutical workspace for docking, ADMET toxicity prediction, and Lipinski rule-of-five validation.
                            </p>
                          </div>
                          <Button
                            className="w-full mt-6 bg-quantum-pink text-white hover:bg-quantum-pink/95 text-xs font-semibold"
                            onClick={() => {
                              setIsProductsOpen(false);
                              navigate('/pharma');
                            }}
                          >
                            Launch Pharma
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

