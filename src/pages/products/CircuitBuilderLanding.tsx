import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ChevronDown, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/useAuth';
import { SEO } from '@/components/shared/SEO';

const FEATURES = [
  "Visual quantum circuit design",
  "Drag-and-drop gate placement",
  "Quantum algorithm prototyping",
  "Circuit simulation",
  "Circuit visualization",
  "Educational workflows",
  "Research experimentation",
  "Export capabilities (where supported)"
];

const FAQS = [
  {
    q: "What is the Quantum Circuit Builder?",
    a: "The Alpha ParadoxQC Quantum Circuit Builder is a visual platform designed to simplify the creation, visualization, and exploration of quantum circuits. It aims to help students, researchers, educators, and developers design quantum algorithms through an intuitive interface."
  },
  {
    q: "Who is this platform designed for?",
    a: "The platform is intended for a wide range of users, including students, researchers, educators, developers, startups, and organizations interested in quantum computing."
  },
  {
    q: "Why did Alpha ParadoxQC build this platform?",
    a: "Quantum programming can be difficult for newcomers. Our goal is to reduce the learning curve by providing tools that make quantum circuit design more accessible while supporting experimentation and research."
  },
  {
    q: "Do I need programming experience?",
    a: "The platform is being designed to support users with different experience levels. Visual tools can help beginners, while more advanced capabilities may be available for experienced developers."
  },
  {
    q: "Can I design my own quantum circuits?",
    a: "Yes. The platform is intended to let users create and modify quantum circuits for learning, experimentation, and algorithm development."
  },
  {
    q: "Can I simulate my circuits?",
    a: "The platform is planned to include simulation capabilities so users can study circuit behavior before running experiments on quantum hardware, where supported."
  },
  {
    q: "Which quantum gates will be available?",
    a: "The platform is expected to support commonly used quantum gates such as Pauli gates, Hadamard, Phase, Rotation, CNOT, SWAP, Toffoli, and measurement operations. The exact feature set will depend on the released version."
  },
  {
    q: "Can I export my circuit?",
    a: "Export options are planned to support interoperability with selected quantum development workflows. Available formats will be documented as features are released."
  },
  {
    q: "Is the platform suitable for education?",
    a: "Yes. One of our objectives is to provide an environment that supports teaching, learning, and practical exploration of quantum computing concepts."
  },
  {
    q: "Is this a cloud-based platform?",
    a: "Deployment options will depend on the product release. Details about supported environments will be announced as development progresses."
  },
  {
    q: "How can I request a demonstration?",
    a: "You can contact the Alpha ParadoxQC team through our website to learn about demonstrations, collaborations, or early access opportunities when available."
  },
  {
    q: "Where can I learn more?",
    a: "Our documentation, tutorials, technical blogs, and knowledge center will provide guides, updates, and educational resources as the platform evolves."
  }
];

const BLOG_IDEAS = [
  "What Is a Quantum Circuit?",
  "Beginner's Guide to Quantum Gates",
  "How Quantum Algorithms Solve Complex Problems",
  "Common Mistakes in Quantum Circuit Design",
  "Future of Visual Quantum Programming"
];

export default function CircuitBuilderLanding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEO 
        title="Quantum Circuit Builder | Alpha ParadoxQC"
        description="Design, visualize, and explore quantum circuits through an intuitive development platform by Alpha ParadoxQC."
        canonical="/products/circuit-builder"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Alpha ParadoxQC Quantum Circuit Builder",
          "applicationCategory": "DeveloperApplication",
          "operatingSystem": "Web",
          "description": "A visual quantum development platform designed to simplify the process of creating, testing, and understanding quantum circuits."
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(199_89%_48%_/_0.15)_0%,_transparent_70%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl font-black mb-6"
          >
            Quantum Circuit Builder
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground mb-10"
          >
            Design, visualize, and explore quantum circuits through an intuitive development platform.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90" onClick={() => navigate('/builder')}>
              <Rocket className="w-5 h-5 mr-2" />
              Launch Builder
            </Button>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-24 space-y-24">
        
        {/* What is it & Why We Built It */}
        <section className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-primary">What is it?</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The Alpha ParadoxQC Quantum Circuit Builder is a visual quantum development platform designed to
              simplify the process of creating, testing, and understanding quantum circuits. Whether users are
              beginning their quantum computing journey or developing advanced algorithms, the platform provides an
              interactive environment for circuit design, experimentation, and learning.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By reducing the complexity of traditional quantum programming, the platform enables researchers,
              educators, students, and developers to focus on algorithm design rather than software complexity.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4 text-secondary">Why We Built It</h2>
            <p className="text-muted-foreground leading-relaxed">
              Quantum computing remains difficult to access because many development environments require
              extensive programming knowledge. We are building the Quantum Circuit Builder to make quantum circuit
              design more approachable, accelerate experimentation, and support education, research, and
              innovation. Our objective is to lower the barrier to entry while providing a scalable environment for
              advanced users.
            </p>
          </div>
        </section>

        {/* Features */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">What does it do?</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => (
              <div key={i} className="p-6 border border-border/50 rounded-xl bg-card hover:border-primary/50 transition-colors flex flex-col items-center text-center">
                <CheckCircle2 className="w-8 h-8 text-primary mb-4" />
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
              <div key={i} className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors cursor-pointer p-3 rounded-lg hover:bg-primary/5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-medium">{idea}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
