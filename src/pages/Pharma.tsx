import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pill, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { DrugDiscoveryTab } from '@/components/drugDiscovery/DrugDiscoveryTab';

const Pharma = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      sessionStorage.setItem('returnUrl', '/pharma');
      navigate('/auth', { replace: true, state: { returnTo: '/pharma' } });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    document.title = 'Pharma & Drug Discovery — Quantum Workspace';
    const desc = 'Quantum-enhanced molecular docking, ADMET, and Lipinski analysis for pharmaceutical research.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);
  }, []);

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
