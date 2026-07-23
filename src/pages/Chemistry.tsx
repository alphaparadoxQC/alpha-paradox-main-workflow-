import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FlaskConical, Loader2, Atom as AtomIcon, Sparkles, Info, Zap, Server, FileJson, Play, Cpu, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';

// Existing components
import { ChemistryTab } from '@/components/chemistry/ChemistryTab';
import { PeriodicTable } from '@/components/chemistry/PeriodicTable';
import { CustomMoleculeLibrary } from '@/components/chemistry/CustomMoleculeLibrary';
import { MoleculeViewer3D } from '@/components/chemistry/MoleculeViewer3D';
import { VQEControls } from '@/components/chemistry/VQEControls';
import { VQEProgressChart } from '@/components/chemistry/VQEProgressChart';
import { VQEResults } from '@/components/chemistry/VQEResults';
import { ElectronicProperties } from '@/components/chemistry/ElectronicProperties';
import { DFTPanel } from '@/components/chemistry/DFTPanel';
import { DrugDiscoveryTab } from '@/components/drugDiscovery/DrugDiscoveryTab';

import { buildCustomMolecule } from '@/lib/chemistry/customMolecule';
import { useVQE } from '@/hooks/useVQE';
import { generateParameterizedAnsatz } from '@/lib/chemistry/vqeOptimizer';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { toast } from 'sonner';
import { MOLECULES } from '@/lib/chemistry/moleculeData';
import { getElementBySymbol } from '@/lib/chemistry/periodicTable';

// New components
import { BackendStatusPanel } from '@/components/chemistry/BackendStatusPanel';
import { MoleculeInput } from '@/components/chemistry/MoleculeInput';
import { ResultJSONViewer } from '@/components/chemistry/ResultJSONViewer';
import { QuantumMappingPanel } from '@/components/chemistry/QuantumMappingPanel';
import { ChemistryAPI, MoleculeResponse, ClassicalResponse } from '@/lib/chemistry/apiClient';
import { SEO } from '@/components/shared/SEO';

const Chemistry = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Python Backend State
  const [parsedMolecule, setParsedMolecule] = useState<MoleculeResponse | null>(null);
  const [classicalResult, setClassicalResult] = useState<ClassicalResponse | null>(null);
  const [quantumResult, setQuantumResult] = useState<any | null>(null);
  const [runningHf, setRunningHf] = useState(false);

  // Existing VQE State
  const [selectedAtoms, setSelectedAtoms] = useState<string[]>(['H', 'H']);

  // Guest & local development access enabled for Chemistry & Pharma Workbench
  useEffect(() => {
    // Session tracking preserved
  }, []);


  const customMolecule = useMemo(
    () => buildCustomMolecule(selectedAtoms) ?? MOLECULES[0],
    [selectedAtoms]
  );

  const { homo, lumo } = useMemo(() => {
    const elements = customMolecule.atoms.map(a => getElementBySymbol(a.symbol)).filter(e => e && e.electronegativity);
    const avgEn = elements.length > 0 
      ? elements.reduce((sum, e) => sum + (e!.electronegativity || 0), 0) / elements.length 
      : 2.5;
    const h = -10 - (avgEn * 1.5);
    const l = h + Math.max(1.5, 12 - (customMolecule.electrons * 0.1));
    return { homo: h, lumo: l };
  }, [customMolecule]);

  const vqe = useVQE(customMolecule);
  const { setQubitCount, setGates, clearCircuit } = useQuantumCircuitStore();

  useEffect(() => {
    vqe.resetParameters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customMolecule.id]);

  const handleAdd = useCallback((sym: string) => {
    setSelectedAtoms(prev => (prev.length >= 200 ? prev : [...prev, sym]));
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
      const isHeavyMolecule = customMolecule.qubitsRequired >= 12;
      const result = await vqe.runOptimization({
        maxIterations: isHeavyMolecule ? 18 : 40,
        learningRate: isHeavyMolecule ? 0.18 : 0.3,
        convergenceThreshold: 1e-4,
        maxGradientUpdatesPerIteration: isHeavyMolecule ? 16 : 24,
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

  const handleRunHF = async () => {
    if (!parsedMolecule) return;
    setRunningHf(true);
    setClassicalResult(null);
    try {
      const res = await ChemistryAPI.runHF(parsedMolecule.molecule.smiles, "sto-3g");
      setClassicalResult(res);
      toast.success('Hartree-Fock calculation complete!');
    } catch (err: any) {
      toast.error('HF Calculation Failed', { description: err.message });
    } finally {
      setRunningHf(false);
    }
  };

  const [generatingCircuit, setGeneratingCircuit] = useState(false);

  const handleMoleculeParsed = (mol: MoleculeResponse) => {
    setParsedMolecule(mol);
    setClassicalResult(null);
    setQuantumResult(null);
  };

  const handleGenerateChemistryCircuit = async () => {
    if (!parsedMolecule) return;
    setGeneratingCircuit(true);
    try {
      const data = await ChemistryAPI.generateChemistryCircuit({
        molecule: parsedMolecule.molecule.smiles,
        input_type: "smiles",
        basis_set: "STO-3G",
        charge: parsedMolecule.molecule.charge,
        multiplicity: parsedMolecule.molecule.multiplicity,
        mapping: "jordan_wigner",
        ansatz: "UCCSD",
        algorithm: "VQE",
        optimizer: "COBYLA",
        shots: 1024,
      });
      toast.success("Circuit generated successfully!");
      navigate(`/chemistry/circuit-builder?circuit_id=${data.circuit_id}`);
    } catch (err: any) {
      toast.error("Circuit Generation Failed", { description: err.message });
    } finally {
      setGeneratingCircuit(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO 
        title="Quantum Chemistry Simulation — VQE Molecular Modeling | Alpha ParadoxQC"
        description="Run Variational Quantum Eigensolver simulations, Hartree-Fock calculations, and molecular orbital mapping directly in your browser."
        canonical="/chemistry"
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "SoftwareApplication",
              "name": "Alpha ParadoxQC Quantum Chemistry Simulation",
              "applicationCategory": "ScienceApplication",
              "operatingSystem": "Web"
            },
            {
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is Quantum Chemistry Simulation?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Alpha ParadoxQC Quantum Chemistry Simulation platform is being developed to help researchers study molecular systems using advanced computational methods inspired by quantum computing and computational chemistry. It aims to support scientific research, education, and innovation."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Why is Alpha ParadoxQC developing this platform?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Many molecular simulations are computationally intensive and can require significant resources. We are building this platform to provide researchers with tools that support more efficient computational studies and accelerate scientific exploration."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Who can use this platform?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The platform is intended for researchers, universities, pharmaceutical companies, chemical industries, material scientists, educators, and students interested in computational chemistry."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What problems does it aim to solve?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "It is designed to support molecular modeling, electronic structure analysis, reaction studies, and materials research by providing computational tools that complement existing scientific workflows."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can it replace laboratory experiments?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The platform is intended to complement laboratory research by assisting with computational analysis. Experimental validation remains essential."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What types of molecules can be studied?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The exact capabilities will depend on the released version. Supported molecular systems and simulation methods will be documented as the platform develops."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is programming experience required?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The platform is being designed with usability in mind, offering tools for both experienced researchers and users with limited programming experience."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can universities use this platform?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Supporting education and academic research is one of the objectives of the platform."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Will cloud-based simulations be available?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Deployment options and computational infrastructure will be announced as development progresses."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How can organizations collaborate with Alpha ParadoxQC?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Organizations interested in research partnerships, pilot projects, or technology collaborations can contact our team through the official website."
                  }
                }
              ]
            }
          ]
        }}
      />
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/" aria-label="Back to home">
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <FlaskConical className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
                  Chemistry Workbench
                </h1>
                <p className="text-xs text-muted-foreground truncate">
                  Advanced quantum chemistry simulation platform
                </p>
              </div>
            </div>
          </div>
          
          {/* Direct link to the specialized Chemistry Circuit Builder */}
          <div className="flex items-center">
            <Button variant="outline" className="bg-primary/5 border-primary/20 hover:bg-primary/10" asChild>
              <Link to="/chemistry/circuit-builder">
                <Cpu className="w-4 h-4 mr-2 text-primary" />
                <span className="font-medium">Open Circuit Builder</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-7xl mx-auto w-full px-2 sm:px-4 py-4 space-y-4">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full md:w-auto mb-6">
              <TabsTrigger value="dashboard" className="text-xs gap-1">
                <Server className="w-3.5 h-3.5" /> Platform Dashboard
              </TabsTrigger>
              <TabsTrigger value="builder" className="text-xs gap-1">
                <AtomIcon className="w-3.5 h-3.5" /> Quantum VQE
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs gap-1">
                <FlaskConical className="w-3.5 h-3.5" /> Molecules
              </TabsTrigger>
              <TabsTrigger value="dft" className="text-xs gap-1">
                <Zap className="w-3.5 h-3.5" /> DFT
              </TabsTrigger>
              <TabsTrigger value="library" className="text-xs gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Templates
              </TabsTrigger>
              <TabsTrigger value="pharma" className="text-xs gap-1 text-quantum-pink data-[state=active]:text-quantum-pink">
                <Pill className="w-3.5 h-3.5" /> Pharma
              </TabsTrigger>
            </TabsList>

            {/* DASHBOARD TAB (Phase 1 Integration) */}
            <TabsContent value="dashboard" className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <MoleculeInput onMoleculeParsed={handleMoleculeParsed} />
                  
                  {parsedMolecule && (
                    <Card className="bg-card/50 backdrop-blur-sm border-border animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <CardHeader className="py-4 border-b border-border/50">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FlaskConical className="w-4 h-4 text-primary" />
                          Parsed Molecule Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Stat label="Formula" value={parsedMolecule.molecule.formula} />
                        <Stat label="Weight" value={`${parsedMolecule.descriptors.molecular_weight.toFixed(2)} g/mol`} />
                        <Stat label="Atoms" value={parsedMolecule.molecule.atoms.length.toString()} />
                        <Stat label="Charge" value={parsedMolecule.molecule.charge.toString()} />
                        <Stat label="LogP" value={parsedMolecule.descriptors.logp.toFixed(2)} />
                        <Stat label="TPSA" value={parsedMolecule.descriptors.tpsa.toFixed(2)} />
                      </CardContent>
                    </Card>
                  )}

                  {parsedMolecule && (
                    <Card className="bg-card/50 backdrop-blur-sm border-border animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                      <CardHeader className="py-4 border-b border-border/50">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-accent" />
                            Classical Chemistry (PySCF)
                          </span>
                        </CardTitle>
                        <CardDescription>Run ab initio Hartree-Fock to calculate reference ground-state energy.</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="text-xs text-muted-foreground">
                          Basis set: <span className="font-mono text-foreground px-2 py-1 bg-muted rounded">STO-3G</span>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button onClick={handleRunHF} disabled={runningHf} variant="outline" className="flex-1 sm:flex-none gap-2">
                            {runningHf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            Calculate HF Energy
                          </Button>
                          <Button onClick={handleGenerateChemistryCircuit} disabled={generatingCircuit} className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 gap-2">
                            {generatingCircuit ? <Loader2 className="w-4 h-4 animate-spin" /> : <AtomIcon className="w-4 h-4" />}
                            Generate Chemistry Circuit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {parsedMolecule && classicalResult && (
                    <QuantumMappingPanel 
                      smiles={parsedMolecule.molecule.smiles} 
                      onHamiltonianGenerated={setQuantumResult} 
                    />
                  )}
                </div>

                <div className="space-y-6 flex flex-col min-h-[500px]">
                  {(classicalResult || quantumResult) && (
                    <div className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
                      <ResultJSONViewer data={{
                        job_id: `job_${Math.random().toString(36).substring(2, 9)}`,
                        status: 'completed',
                        mode: 'research',
                        molecule: parsedMolecule?.molecule,
                        descriptors: parsedMolecule?.descriptors,
                        classical_result: classicalResult,
                        quantum_result: quantumResult
                      }} />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Existing Builder/Quantum VQE Tab */}
            <TabsContent value="builder" className="space-y-4">
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

                <ElectronicProperties homo={homo} lumo={lumo} />

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

            {/* DFT */}
            <TabsContent value="dft" className="mt-4">
              <DFTPanel molecule={customMolecule} />
            </TabsContent>

            {/* TEMPLATES */}
            <TabsContent value="library" className="mt-4">
              <div className="rounded-xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
                <ChemistryTab />
              </div>
            </TabsContent>

            {/* PHARMA / DRUG SIMULATOR */}
            <TabsContent value="pharma" className="mt-4">
              <div className="rounded-xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
                <DrugDiscoveryTab />
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
