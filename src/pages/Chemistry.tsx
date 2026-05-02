import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FlaskConical, Loader2, Atom as AtomIcon, Sparkles, Info, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { ChemistryTab } from '@/components/chemistry/ChemistryTab';
import { PeriodicTable } from '@/components/chemistry/PeriodicTable';
import { CustomMoleculeLibrary } from '@/components/chemistry/CustomMoleculeLibrary';
import { MoleculeViewer3D } from '@/components/chemistry/MoleculeViewer3D';
import { VQEControls } from '@/components/chemistry/VQEControls';
import { VQEProgressChart } from '@/components/chemistry/VQEProgressChart';
import { VQEResults } from '@/components/chemistry/VQEResults';
import { ElectronicProperties } from '@/components/chemistry/ElectronicProperties';
import { DFTPanel } from '@/components/chemistry/DFTPanel';
import { buildCustomMolecule } from '@/lib/chemistry/customMolecule';
import { useVQE } from '@/hooks/useVQE';
import { generateParameterizedAnsatz } from '@/lib/chemistry/vqeOptimizer';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { toast } from 'sonner';
import { MOLECULES } from '@/lib/chemistry/moleculeData';

const Chemistry = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [selectedAtoms, setSelectedAtoms] = useState<string[]>(['H', 'H']);

  useEffect(() => {
    if (!loading && !user) {
      sessionStorage.setItem('returnUrl', '/chemistry');
      navigate('/auth', { replace: true, state: { returnTo: '/chemistry' } });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    document.title = 'Quantum Chemistry — Periodic Table & VQE';
    const desc = 'Interactive periodic table — pick any atoms, build custom molecules, and run quantum VQE simulations.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);
  }, []);

  const customMolecule = useMemo(
    () => buildCustomMolecule(selectedAtoms) ?? MOLECULES[0],
    [selectedAtoms]
  );

  const vqe = useVQE(customMolecule);
  const { setQubitCount, setGates, clearCircuit } = useQuantumCircuitStore();

  useEffect(() => {
    vqe.resetParameters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customMolecule.id]);

  const handleAdd = useCallback((sym: string) => {
    setSelectedAtoms(prev => (prev.length >= 8 ? prev : [...prev, sym]));
  }, []);

  const handleRemoveAt = useCallback((index: number) => {
    setSelectedAtoms(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleClear = useCallback(() => setSelectedAtoms([]), []);

  const handleSimulate = useCallback(async () => {
    if (selectedAtoms.length === 0) {
      toast.error('Pick at least one atom from the periodic table');
      return;
    }
    try {
      const result = await vqe.runOptimization({
        maxIterations: 40,
        learningRate: 0.3,
        convergenceThreshold: 1e-4,
      });
      const finalGates = generateParameterizedAnsatz(customMolecule, result.finalParameters);
      clearCircuit();
      setQubitCount(customMolecule.qubitsRequired);
      setGates(finalGates);
      toast.success(`Simulation complete for ${customMolecule.formula}`, {
        description: `Energy: ${result.finalEnergy.toFixed(4)} Ha`,
      });
    } catch (e) {
      if ((e as Error).message !== 'Optimization aborted') {
        toast.error('Simulation failed');
      }
    }
  }, [vqe, customMolecule, selectedAtoms.length, clearCircuit, setQubitCount, setGates]);

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
      {/* Header */}
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
                <FlaskConical className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
                  Quantum Chemistry
                </h1>
                <p className="text-xs text-muted-foreground truncate">
                  Interactive periodic table & VQE simulations
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-7xl mx-auto w-full px-2 sm:px-4 py-4 space-y-4">
          <Tabs defaultValue="builder" className="w-full">
            <TabsList className="grid grid-cols-4 w-full sm:w-[680px]">
              <TabsTrigger value="builder" className="text-xs gap-1">
                <AtomIcon className="w-3.5 h-3.5" /> Periodic Table
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs gap-1">
                <FlaskConical className="w-3.5 h-3.5" /> Custom Molecules
              </TabsTrigger>
              <TabsTrigger value="dft" className="text-xs gap-1">
                <Zap className="w-3.5 h-3.5" /> DFT
              </TabsTrigger>
              <TabsTrigger value="library" className="text-xs gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Templates
              </TabsTrigger>
            </TabsList>

            {/* CUSTOM BUILDER */}
            <TabsContent value="builder" className="mt-4 space-y-4">
              <PeriodicTable
                selected={selectedAtoms}
                onAdd={handleAdd}
                onRemoveAt={handleRemoveAt}
                onClear={handleClear}
                onSimulate={handleSimulate}
                canSimulate={selectedAtoms.length > 0 && !vqe.isRunning}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-card/50 backdrop-blur-sm border-border">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-accent" />
                        3D Structure — <span className="font-mono text-primary">{customMolecule.formula}</span>
                      </span>
                      <Badge variant="secondary" className="text-[10px]">Drag to rotate</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <MoleculeViewer3D molecule={customMolecule} />
                  </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm border-border">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      Properties
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 grid grid-cols-2 gap-3">
                    <Stat label="Atoms" value={customMolecule.atoms.length.toString()} sub={customMolecule.atoms.map(a => a.symbol).join(', ')} />
                    <Stat label="Electrons" value={customMolecule.electrons.toString()} />
                    <Stat label="Qubits" value={customMolecule.qubitsRequired.toString()} />
                    <Stat label="Est. Energy" value={`${customMolecule.expectedGroundStateEnergy.toFixed(2)} Ha`} highlight />
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <VQEControls
                  molecule={customMolecule}
                  parameters={vqe.parameters}
                  isRunning={vqe.isRunning}
                  onParameterChange={(i, v) => vqe.setParameter(i, v)}
                  onRunOptimization={handleSimulate}
                  onStopOptimization={vqe.stopOptimization}
                  onResetParameters={vqe.resetParameters}
                />
                <VQEProgressChart
                  iterations={vqe.iterations}
                  targetEnergy={customMolecule.expectedGroundStateEnergy}
                  currentEnergy={vqe.currentEnergy}
                  moleculeName={customMolecule.name}
                />
              </div>

              <VQEResults
                result={vqe.result}
                molecule={customMolecule}
                isRunning={vqe.isRunning}
                currentIteration={vqe.currentIteration}
                maxIterations={40}
              />
            </TabsContent>

            {/* CUSTOM MOLECULES LIBRARY */}
            <TabsContent value="custom" className="mt-4">
              <CustomMoleculeLibrary />
            </TabsContent>

            {/* TEMPLATES */}
            <TabsContent value="library" className="mt-4">
              <div className="rounded-xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
                <ChemistryTab />
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
};

function Stat({
  label, value, sub, highlight,
}: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`p-2 rounded-lg ${highlight ? 'bg-primary/10 border border-primary/20' : 'bg-background/30'}`}>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-semibold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground truncate">{sub}</div>}
    </div>
  );
}

export default Chemistry;
