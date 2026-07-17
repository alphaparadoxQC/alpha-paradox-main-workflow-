import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/useAuth';
import { SEO } from '@/components/shared/SEO';

const FEATURES = [
  "Protein–ligand interaction analysis",
  "Molecular docking support",
  "Candidate molecule evaluation",
  "Binding affinity estimation",
  "Molecular visualization",
  "Research workflow integration",
  "Computational screening support"
];

const FAQS = [
  {
    q: "What is Quantum Drug Simulation?",
    a: "Quantum Drug Simulation is a research platform under development by Alpha ParadoxQC to support computational drug discovery through molecular simulation and advanced computational techniques."
  },
  {
    q: "Why are you building this platform?",
    a: "Drug discovery is a complex and time-consuming process. Our goal is to provide computational tools that can assist researchers in evaluating molecular interactions during the early stages of research."
  },
  {
    q: "Who is this platform designed for?",
    a: "The platform is intended for pharmaceutical researchers, biotechnology companies, universities, research laboratories, healthcare innovators, and computational scientists."
  },
  {
    q: "Does it develop medicines automatically?",
    a: "No. The platform is designed to support computational research. It does not create medicines or replace laboratory experiments, clinical trials, or regulatory review."
  },
  {
    q: "What types of research can it support?",
    a: "The platform is intended to assist with molecular interaction analysis, candidate evaluation, computational screening, and early-stage drug discovery workflows."
  },
  {
    q: "Can it reduce drug discovery time?",
    a: "Computational tools may help researchers prioritize promising candidates more efficiently. Actual research timelines depend on many scientific, experimental, and regulatory factors."
  },
  {
    q: "Is artificial intelligence part of the platform?",
    a: "AI-assisted capabilities may be incorporated where appropriate to support data analysis and research workflows. Feature availability will depend on future product releases."
  },
  {
    q: "Can universities and research institutes use it?",
    a: "Yes. The platform is being developed to support academic research as well as industrial research programs."
  },
  {
    q: "Is patient data required?",
    a: "The platform is intended for computational research. Any future handling of sensitive data would be subject to applicable privacy, security, and regulatory requirements."
  },
  {
    q: "How can researchers stay informed about the project?",
    a: "Visitors can follow Alpha ParadoxQC through our website, technical blog, and official announcements for product updates, research news, and collaboration opportunities."
  }
];

const BLOG_IDEAS = [
  "The Future of Drug Discovery",
  "Quantum Computing in Pharmaceutical Research",
  "From Molecules to Medicines",
  "Computational Drug Discovery Explained",
  "Challenges in Modern Drug Development"
];

export default function DrugSimulationLanding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEO 
        title="Quantum Drug Simulation | Alpha ParadoxQC"
        description="Exploring computational approaches for next-generation drug discovery."
        canonical="/products/drug-simulation"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Alpha ParadoxQC Quantum Drug Simulation",
          "applicationCategory": "DeveloperApplication",
          "operatingSystem": "Web",
          "description": "An advanced research platform to support computational drug discovery using quantum computing techniques."
        }}
      />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/60 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3">
          <Link to="/">
            <img
              src="/logo.png"
              alt="Alpha Paradox Logo"
              className="h-8 w-auto object-contain hover:opacity-80 transition-opacity cursor-pointer"
            />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">Home</Link>
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
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(330_89%_48%_/_0.15)_0%,_transparent_70%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl font-black mb-6"
          >
            Quantum Drug Simulation
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground mb-10"
          >
            Exploring computational approaches for next-generation drug discovery.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button size="lg" className="text-lg px-8 py-6 bg-quantum-pink text-white hover:bg-quantum-pink/90" onClick={() => navigate('/pharma')}>
              <Pill className="w-5 h-5 mr-2" />
              Launch Drug Simulation
            </Button>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-24 space-y-24">
        
        {/* What is it & Why We Built It */}
        <section className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-quantum-pink">What is it?</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Quantum Drug Simulation is an advanced research platform being developed by Alpha ParadoxQC to
              support computational drug discovery using quantum computing techniques and molecular simulation
              methods. The platform is intended to help researchers investigate molecular interactions, evaluate
              potential drug candidates, and improve early-stage computational analysis in pharmaceutical research.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The platform is designed as a research and computational tool. It does not replace laboratory
              experiments, clinical studies, or regulatory evaluation.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4 text-primary">Why We Built It</h2>
            <p className="text-muted-foreground leading-relaxed">
              Drug discovery is often a lengthy and resource-intensive process. We are developing Quantum Drug
              Simulation to provide researchers with computational tools that can assist in evaluating molecular
              interactions during the early stages of research. By complementing existing scientific workflows, the
              platform aims to support more informed decision-making before laboratory validation.
            </p>
          </div>
        </section>

        {/* Features */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">What does it do?</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => (
              <div key={i} className="p-6 border border-border/50 rounded-xl bg-card hover:border-quantum-pink/50 transition-colors flex flex-col items-center text-center">
                <CheckCircle2 className="w-8 h-8 text-quantum-pink mb-4" />
                <span className="font-medium text-foreground/90">{feature}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem value={`item-${i}`} key={i}>
                <AccordionTrigger className="text-left font-medium text-lg">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Blog Ideas / Learn More */}
        <section className="p-8 border border-border/50 rounded-2xl bg-card">
          <h2 className="text-2xl font-bold mb-6">Explore the Knowledge Center</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {BLOG_IDEAS.map((idea, i) => (
              <div key={i} className="flex items-center gap-3 text-muted-foreground hover:text-quantum-pink transition-colors cursor-pointer p-3 rounded-lg hover:bg-quantum-pink/5">
                <div className="w-2 h-2 rounded-full bg-quantum-pink" />
                <span className="font-medium">{idea}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
