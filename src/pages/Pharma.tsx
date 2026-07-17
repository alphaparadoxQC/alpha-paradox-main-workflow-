import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pill, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { DrugDiscoveryTab } from '@/components/drugDiscovery/DrugDiscoveryTab';
import { SEO } from '@/components/shared/SEO';

const Pharma = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      sessionStorage.setItem('returnUrl', '/pharma');
      navigate('/auth', { replace: true, state: { returnTo: '/pharma' } });
    }
  }, [user, loading, navigate]);


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO 
        title="Quantum Drug Simulation — ADMET & Molecular Docking | Alpha ParadoxQC"
        description="Evaluate drug candidates with Lipinski rule validation, ADMET profiling, and quantum-corrected binding energy calculations."
        canonical="/pharma"
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "SoftwareApplication",
              "name": "Alpha ParadoxQC Quantum Drug Simulation",
              "applicationCategory": "ScienceApplication",
              "operatingSystem": "Web"
            },
            {
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is Quantum Drug Simulation?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Quantum Drug Simulation is a research platform under development by Alpha ParadoxQC to support computational drug discovery through molecular simulation and advanced computational techniques."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Why are you building this platform?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Drug discovery is a complex and time-consuming process. Our goal is to provide computational tools that can assist researchers in evaluating molecular interactions during the early stages of research."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Who is this platform designed for?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The platform is intended for pharmaceutical researchers, biotechnology companies, universities, research laboratories, healthcare innovators, and computational scientists."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Does it develop medicines automatically?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The platform is designed to support computational research. It does not create medicines or replace laboratory experiments, clinical trials, or regulatory review."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What types of research can it support?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The platform is intended to assist with molecular interaction analysis, candidate evaluation, computational screening, and early-stage drug discovery workflows."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can it reduce drug discovery time?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Computational tools may help researchers prioritize promising candidates more efficiently. Actual research timelines depend on many scientific, experimental, and regulatory factors."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is artificial intelligence part of the platform?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "AI-assisted capabilities may be incorporated where appropriate to support data analysis and research workflows. Feature availability will depend on future product releases."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can universities and research institutes use it?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The platform is being developed to support academic research as well as industrial research programs."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is patient data required?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The platform is intended for computational research. Any future handling of sensitive data would be subject to applicable privacy, security, and regulatory requirements."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How can researchers stay informed about the project?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Visitors can follow Alpha ParadoxQC through our website, technical blog, and official announcements for product updates, research news, and collaboration opportunities."
                  }
                }
              ]
            }
          ]
        }}
      />
      {/* Page Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/builder" aria-label="Back to builder">
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Builder</span>
              </Link>
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Pill className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
                  Pharma & Drug Discovery
                </h1>
                <p className="text-xs text-muted-foreground truncate">
                  Quantum-enhanced docking, ADMET & Lipinski analysis
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Structured content area */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto w-full px-2 sm:px-4 py-4">
          <div className="rounded-xl border border-border bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
            <DrugDiscoveryTab />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Pharma;
