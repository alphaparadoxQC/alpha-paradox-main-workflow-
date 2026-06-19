import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pill, Play, RotateCcw, Download, Atom, FlaskConical, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DrugViewer3D } from './DrugViewer3D';
import { LipinskiAnalysis } from './LipinskiAnalysis';
import { ADMETPanel } from './ADMETPanel';
import { DockingResults } from './DockingResults';
import { TargetSelector } from './TargetSelector';
import { AIAssistantPanel } from './AIAssistantPanel';
import { CustomMoleculeInput } from './CustomMoleculeInput';
import { ToxicityPanel } from './ToxicityPanel';
import { SelectivityProfiler } from './SelectivityProfiler';
import { BindingFreeEnergy } from './BindingFreeEnergy';
import { RunOnHardwareButton } from '@/components/shared/RunOnHardwareButton';
import { generateParameterizedAnsatz } from '@/lib/chemistry/vqeOptimizer';

import {
  DRUG_CANDIDATES,
  PROTEIN_TARGETS,
  getDrugById,
  getTargetById,
  calculateLipinski,
  predictADMET,
  simulateDocking,
  type DockingResult,
  type DrugCandidate,
} from '@/lib/drugDiscovery/drugData';
import { toast } from 'sonner';

interface DrugDiscoveryTabProps {
  onGenerateCircuit?: () => void;
}

export function DrugDiscoveryTab({ onGenerateCircuit }: DrugDiscoveryTabProps) {
  const [selectedDrugId, setSelectedDrugId] = useState<string>('aspirin');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('cox2');
  const [dockingResult, setDockingResult] = useState<DockingResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [customDrugs, setCustomDrugs] = useState<DrugCandidate[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ai');

  const allDrugs = [...DRUG_CANDIDATES, ...customDrugs];
  const drug = getDrugById(selectedDrugId) || customDrugs.find(d => d.id === selectedDrugId) || allDrugs[0];
  const target = getTargetById(selectedTargetId) || PROTEIN_TARGETS[0];
  const lipinskiResult = calculateLipinski(drug);
  const admetProfile = predictADMET(drug);

  useEffect(() => {
    if (window.assistantContext) {
      window.assistantContext.currentPage = 'drug-discovery';
      window.assistantContext.pageData = {
        'Molecule selected': drug.name,
        'Active protein target': target.name,
        'Prediction data': dockingResult ? 'Available' : 'None',
        'Current tab': activeTab,
      };
    }
  }, [drug.name, target.name, dockingResult, activeTab]);

  const handleAddCustomDrug = useCallback((newDrug: DrugCandidate) => {
    setCustomDrugs(prev => [...prev, newDrug]);
    setSelectedDrugId(newDrug.id);
  }, []);

  const handleRunDocking = useCallback(async () => {
    setIsRunning(true);
    setDockingResult(null);

    // Simulate docking calculation with delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = simulateDocking(drug, target);
    setDockingResult(result);
    setIsRunning(false);

    toast.success(`Docking completed for ${drug.name}`, {
      description: `Binding energy: ${result.bindingEnergy.toFixed(2)} kcal/mol`,
    });

    onGenerateCircuit?.();
  }, [drug, target, onGenerateCircuit]);

  const handleReset = useCallback(() => {
    setDockingResult(null);
  }, []);

  const handleExportResults = useCallback(() => {
    if (!dockingResult) return;

    const data = {
      drug: drug.name,
      formula: drug.formula,
      target: target.name,
      pdbId: target.pdbId,
      bindingEnergy: dockingResult.bindingEnergy,
      bindingAffinity: dockingResult.bindingAffinity,
      lipinski: lipinskiResult,
      admet: admetProfile,
      interactions: {
        hBonds: dockingResult.hBonds,
        hydrophobic: dockingResult.hydrophobicContacts,
        total: dockingResult.interactionCount,
      },
      quantumCorrection: dockingResult.quantumCorrection,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `docking_${drug.id}_${target.id}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Results exported');
  }, [drug, target, dockingResult, lipinskiResult, admetProfile]);

  return (
    <div className="h-full flex flex-col gap-3 p-3 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Pill className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Drug Discovery</h2>
            <p className="text-[10px] text-muted-foreground">
              Molecular docking with quantum enhancement
            </p>
          </div>
        </div>
        {dockingResult && (
          <Button variant="outline" size="sm" onClick={handleExportResults}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        )}
      </div>

      <Separator />

      {/* Drug Selection */}
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" />
            Select Drug Candidate
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <Select
            value={selectedDrugId}
            onValueChange={setSelectedDrugId}
            disabled={isRunning}
          >
            <SelectTrigger className="w-full bg-background/50">
              <SelectValue placeholder="Choose a drug" />
            </SelectTrigger>
            <SelectContent>
              {customDrugs.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs text-muted-foreground font-medium">Custom Compounds</div>
                  {customDrugs.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      <div className="flex items-center gap-2">
                        <Brain className="w-3 h-3 text-secondary" />
                        <span className="font-mono text-primary">{d.formula}</span>
                        <span className="text-muted-foreground">- {d.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs text-muted-foreground font-medium mt-2">Known Compounds</div>
                </>
              )}
              {DRUG_CANDIDATES.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-primary">{d.formula}</span>
                    <span className="text-muted-foreground">- {d.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Custom Molecule Input */}
          <CustomMoleculeInput onAddMolecule={handleAddCustomDrug} />
        </CardContent>
      </Card>

      {/* 3D Drug Viewer */}
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Atom className="w-4 h-4 text-accent" />
              3D Structure: {drug.name}
            </div>
            <Badge variant="secondary" className="text-[10px]">
              MW: {drug.molecularWeight.toFixed(1)} Da
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DrugViewer3D drug={drug} showLabels />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-background/30">
              <div className="text-[10px] text-muted-foreground">LogP</div>
              <div className="text-sm font-semibold text-foreground">{drug.logP.toFixed(2)}</div>
            </div>
            <div className="p-2 rounded bg-background/30">
              <div className="text-[10px] text-muted-foreground">PSA</div>
              <div className="text-sm font-semibold text-foreground">{drug.polarSurfaceArea.toFixed(0)} Å²</div>
            </div>
            <div className="p-2 rounded bg-background/30">
              <div className="text-[10px] text-muted-foreground">Rotatable</div>
              <div className="text-sm font-semibold text-foreground">{drug.rotableBonds}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Target Selection */}
      <TargetSelector
        targets={PROTEIN_TARGETS}
        selectedTarget={target}
        onSelectTarget={setSelectedTargetId}
        disabled={isRunning}
      />

      <Separator />

      {/* Run Docking Button */}
      <div className="flex gap-2">
        <Button
          onClick={handleRunDocking}
          disabled={isRunning}
          className="flex-1"
        >
          {isRunning ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Atom className="w-4 h-4 mr-2" />
              </motion.div>
              Running VQE Docking...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Run Molecular Docking
            </>
          )}
        </Button>
        {dockingResult && (
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Run Docking Circuit on Hardware */}
      {dockingResult && (
        <RunOnHardwareButton
          gates={(() => {
            // Generate a small VQE-style circuit representing the docking interaction
            const mockMolecule = {
              id: drug.id,
              name: drug.name,
              formula: drug.formula,
              atoms: [],
              bonds: [],
              angles: [],
              electrons: Math.min(drug.atoms.length, 4),
              expectedGroundStateEnergy: dockingResult.bindingEnergy / 627.509, // kcal/mol → Hartree
              orbitals: [],
              qubitsRequired: 4,
              vqeDepth: 2,
            };
            return generateParameterizedAnsatz(mockMolecule, [
              dockingResult.bindingEnergy * 0.1,
              dockingResult.poseScore * 0.01,
              dockingResult.electrostaticScore * 0.5,
              dockingResult.hBonds * 0.2,
              dockingResult.bindingEnergy * -0.05,
              dockingResult.hydrophobicContacts * 0.15,
              dockingResult.poseScore * -0.02,
              dockingResult.electrostaticScore * -0.3,
              dockingResult.bindingEnergy * 0.08,
              dockingResult.hBonds * -0.1,
              dockingResult.poseScore * 0.03,
              dockingResult.hydrophobicContacts * -0.2,
              dockingResult.bindingEnergy * -0.03,
              dockingResult.electrostaticScore * 0.2,
              dockingResult.hBonds * 0.15,
              dockingResult.poseScore * -0.01,
            ]);
          })()}
          qubitCount={4}
          localResults={null}
          contextLabel="Docking Circuit"
        />
      )}

      {/* Results Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ai">
            <Brain className="w-3 h-3 mr-1" />
            AI Predict
          </TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="admet">ADMET</TabsTrigger>
          <TabsTrigger value="toxicity">Toxicity</TabsTrigger>
          <TabsTrigger value="docking" disabled={!dockingResult}>
            Docking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="mt-4">
          <AIAssistantPanel drug={drug} target={target} />
        </TabsContent>

        <TabsContent value="analysis" className="mt-4">
          <LipinskiAnalysis result={lipinskiResult} drugName={drug.name} />
        </TabsContent>

        <TabsContent value="admet" className="mt-4">
          <ADMETPanel profile={admetProfile} />
        </TabsContent>

        <TabsContent value="toxicity" className="mt-4">
          <ToxicityPanel drug={drug} />
        </TabsContent>

        <TabsContent value="docking" className="mt-4 space-y-3">
          {dockingResult && (
            <>
              <DockingResults result={dockingResult} drug={drug} target={target} />
              <BindingFreeEnergy drug={drug} target={target} result={dockingResult} />
              <SelectivityProfiler drug={drug} />
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Learn More */}
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Learn More</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2 text-xs">
          <a
            href="https://en.wikipedia.org/wiki/Molecular_docking"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-primary hover:underline"
          >
            → Molecular Docking Overview
          </a>
          <a
            href="https://en.wikipedia.org/wiki/Lipinski%27s_rule_of_five"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-primary hover:underline"
          >
            → Lipinski's Rule of Five
          </a>
          <a
            href="https://en.wikipedia.org/wiki/ADME"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-primary hover:underline"
          >
            → ADMET Properties
          </a>
          <a
            href="https://www.nature.com/articles/s41586-021-03819-2"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-primary hover:underline"
          >
            → AI in Drug Discovery (Nature)
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
