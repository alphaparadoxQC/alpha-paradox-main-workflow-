import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/useAuth';
import { SEO } from '@/components/shared/SEO';

const FEATURES = [
  "Molecular simulations",
  "Electronic structure calculations",
  "Reaction pathway analysis",
  "Material discovery support",
  "Computational chemistry workflows",
  "Research visualization",
  "Scientific data analysis"
];

const FAQS = [
  {
    q: "What is Quantum Chemistry Simulation?",
    a: "The Alpha ParadoxQC Quantum Chemistry Simulation platform is being developed to help researchers study molecular systems using advanced computational methods inspired by quantum computing and computational chemistry. It aims to support scientific research, education, and innovation."
  },
  {
    q: "Why is Alpha ParadoxQC developing this platform?",
    a: "Many molecular simulations are computationally intensive and can require significant resources. We are building this platform to provide researchers with tools that support more efficient computational studies and accelerate scientific exploration."
  },
  {
    q: "Who can use this platform?",
    a: "The platform is intended for researchers, universities, pharmaceutical companies, chemical industries, material scientists, educators, and students interested in computational chemistry."
  },
  {
    q: "What problems does it aim to solve?",
    a: "It is designed to support molecular modeling, electronic structure analysis, reaction studies, and materials research by providing computational tools that complement existing scientific workflows."
  },
  {
    q: "Can it replace laboratory experiments?",
    a: "No. The platform is intended to complement laboratory research by assisting with computational analysis. Experimental validation remains essential."
  },
  {
    q: "What types of molecules can be studied?",
    a: "The exact capabilities will depend on the released version. Supported molecular systems and simulation methods will be documented as the platform develops."
  },
  {
    q: "Is programming experience required?",
    a: "The platform is being designed with usability in mind, offering tools for both experienced researchers and users with limited programming experience."
  },
  {
    q: "Can universities use this platform?",
    a: "Yes. Supporting education and academic research is one of the objectives of the platform."
  },
  {
    q: "Will cloud-based simulations be available?",
    a: "Deployment options and computational infrastructure will be announced as development progresses."
  },
  {
    q: "How can organizations collaborate with Alpha ParadoxQC?",
    a: "Organizations interested in research partnerships, pilot projects, or technology collaborations can contact our team through the official website."
  }
];

const BLOG_IDEAS = [
  "Understanding Quantum Chemistry",
  "Why Molecular Simulation Matters",
  "Applications of Quantum Computing in Chemistry",
  "Computational Chemistry Explained",
  "Future of Scientific Discovery with Quantum Computing"
];

export default function ChemistrySimulationLanding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEO 
        title="Quantum Chemistry Simulation | Alpha ParadoxQC"
        description="Accelerating molecular research through advanced quantum simulation technologies."
        canonical="/products/chemistry-simulation"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Alpha ParadoxQC Quantum Chemistry Simulation",
          "applicationCategory": "DeveloperApplication",
          "operatingSystem": "Web",
          "description": "A computational platform to assist researchers in studying molecular systems using quantum computing techniques."
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(175_89%_48%_/_0.15)_0%,_transparent_70%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl font-black mb-6"
          >
            Quantum Chemistry Simulation
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground mb-10"
          >
            Accelerating molecular research through advanced quantum simulation technologies.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button size="lg" className="text-lg px-8 py-6 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate('/chemistry')}>
              <FlaskConical className="w-5 h-5 mr-2" />
              Launch Chemistry
            </Button>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-24 space-y-24">
        
        {/* What is it & Why We Built It */}
        <section className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-accent">What is it?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Quantum Chemistry Simulation is a computational platform under development by Alpha ParadoxQC to
              assist researchers in studying molecular systems using quantum computing techniques and advanced
              simulation methods. The platform aims to support investigations into molecular properties, chemical
              interactions, and computational chemistry workflows while reducing reliance on traditional trial-and-error
              approaches.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4 text-primary">Why We Built It</h2>
            <p className="text-muted-foreground leading-relaxed">
              Many scientific and pharmaceutical challenges involve molecular systems that are computationally
              demanding to model with classical approaches alone. We are developing this platform to provide
              researchers with tools that can support more efficient exploration of molecular behavior, accelerate
              computational studies, and contribute to research in chemistry and materials science.
            </p>
          </div>
        </section>

        {/* Features */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">What does it do?</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => (
              <div key={i} className="p-6 border border-border/50 rounded-xl bg-card hover:border-accent/50 transition-colors flex flex-col items-center text-center">
                <CheckCircle2 className="w-8 h-8 text-accent mb-4" />
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
              <div key={i} className="flex items-center gap-3 text-muted-foreground hover:text-accent transition-colors cursor-pointer p-3 rounded-lg hover:bg-accent/5">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="font-medium">{idea}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
