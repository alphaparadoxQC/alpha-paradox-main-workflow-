import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Atom, FlaskConical, Sparkles, Info } from 'lucide-react';
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
import { MoleculeViewer3D } from './MoleculeViewer3D';
import { MolecularOrbitalDiagram } from './MolecularOrbitalDiagram';
import { VQEControls } from './VQEControls';
import { VQEProgressChart } from './VQEProgressChart';
import { VQEResults } from './VQEResults';
import { ChemistryResults } from './ChemistryResults';
import { ChemistryTemplates } from './ChemistryTemplates';
import { MOLECULES, getMoleculeById } from '@/lib/chemistry/moleculeData';
import { useVQE } from '@/hooks/useVQE';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { generateParameterizedAnsatz } from '@/lib/chemistry/vqeOptimizer';
import { toast } from 'sonner';

interface ChemistryTabProps {
  onGenerateCircuit?: () => void;
}

export function ChemistryTab({ onGenerateCircuit }: ChemistryTabProps) {
  const [selectedMoleculeId, setSelectedMoleculeId] = useState<string>('h2');
  
  const molecule = getMoleculeById(selectedMoleculeId) || MOLECULES[0];
  const vqe = useVQE(molecule);
  
  const { setQubitCount, setGates, clearCircuit } = useQuantumCircuitStore();
  
  // Reset VQE when molecule changes
  useEffect(() => {
    vqe.resetParameters();
  }, [selectedMoleculeId]);

  const handleRunOptimization = useCallback(async () => {
    try {
      const result = await vqe.runOptimization({
        maxIterations: 50,
        learningRate: 0.3,
        convergenceThreshold: 1e-4,
      });
      
      // Generate and load the final circuit
      const finalGates = generateParameterizedAnsatz(molecule, result.finalParameters);
      clearCircuit();
      setQubitCount(molecule.qubitsRequired);
      setGates(finalGates);
      
      toast.success(`VQE completed for ${molecule.formula}`, {
        description: `Energy: ${result.finalEnergy.toFixed(4)} Ha (${result.totalIterations} iterations)`,
      });
      
      onGenerateCircuit?.();
    } catch (error) {
      if ((error as Error).message !== 'Optimization aborted') {
        toast.error('VQE optimization failed');
      }
    }
  }, [vqe, molecule, clearCircuit, setQubitCount, setGates, onGenerateCircuit]);

  const handleParameterChange = useCallback((index: number, value: number) => {
    vqe.setParameter(index, value);
    
    // Update circuit preview
    const gates = generateParameterizedAnsatz(molecule, vqe.parameters);
    clearCircuit();
    setQubitCount(molecule.qubitsRequired);
    setGates(gates);
  }, [vqe, molecule, clearCircuit, setQubitCount, setGates]);

  return (
    <div className="h-full flex flex-col gap-3 p-3 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FlaskConical className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Quantum Chemistry</h2>
            <p className="text-[10px] text-muted-foreground">
              VQE ground state simulation
            </p>
          </div>
        </div>
      </div>
      
      {/* Chemistry Templates */}
      <ChemistryTemplates onTemplateLoad={(template) => {
        setSelectedMoleculeId(template.molecule.id);
        onGenerateCircuit?.();
      }} />
      
      <Separator />
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Atom className="w-4 h-4 text-primary" />
            Select Molecule
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Select 
            value={selectedMoleculeId} 
            onValueChange={setSelectedMoleculeId}
            disabled={vqe.isRunning}
          >
            <SelectTrigger className="w-full bg-background/50">
              <SelectValue placeholder="Choose a molecule" />
            </SelectTrigger>
            <SelectContent>
              {MOLECULES.map((mol) => (
                <SelectItem key={mol.id} value={mol.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-primary">{mol.formula}</span>
                    <span className="text-muted-foreground">- {mol.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      {/* 3D Molecule Viewer */}
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              3D Structure
            </div>
            <Badge variant="secondary" className="text-[10px]">
              Drag to rotate
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <MoleculeViewer3D molecule={molecule} />
          
          {molecule.angles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {molecule.angles.map((angle, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  ∠{molecule.atoms[angle.atoms[0]].symbol}-
                  {molecule.atoms[angle.atoms[1]].symbol}-
                  {molecule.atoms[angle.atoms[2]].symbol}: {angle.value}°
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Molecular Info Panel */}
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            Molecular Properties
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3">
            <InfoItem 
              label="Atoms" 
              value={molecule.atoms.length.toString()} 
              subValue={molecule.atoms.map(a => a.symbol).join(', ')}
            />
            <InfoItem 
              label="Electrons" 
              value={molecule.electrons.toString()} 
            />
            <InfoItem 
              label="Target Energy" 
              value={`${molecule.expectedGroundStateEnergy.toFixed(3)} Ha`} 
              highlight
            />
            <InfoItem 
              label="Qubits Required" 
              value={molecule.qubitsRequired.toString()} 
            />
          </div>
        </CardContent>
      </Card>
      
      <Separator />
      
      {/* VQE Controls */}
      <VQEControls
        molecule={molecule}
        parameters={vqe.parameters}
        isRunning={vqe.isRunning}
        onParameterChange={handleParameterChange}
        onRunOptimization={handleRunOptimization}
        onStopOptimization={vqe.stopOptimization}
        onResetParameters={vqe.resetParameters}
      />
      
      {/* VQE Progress Chart */}
      <VQEProgressChart
        iterations={vqe.iterations}
        targetEnergy={molecule.expectedGroundStateEnergy}
        currentEnergy={vqe.currentEnergy}
        moleculeName={molecule.name}
      />
      
      {/* VQE Results */}
      <VQEResults
        result={vqe.result}
        molecule={molecule}
        isRunning={vqe.isRunning}
        currentIteration={vqe.currentIteration}
        maxIterations={50}
      />
      
      <Separator />
      
      {/* Comprehensive Chemistry Results */}
      <ChemistryResults
        molecule={molecule}
        vqeResult={vqe.result}
        currentEnergy={vqe.currentEnergy}
      />
      
      {/* Molecular Orbital Diagram */}
      <MolecularOrbitalDiagram 
        orbitals={molecule.orbitals} 
        moleculeName={molecule.name} 
      />
    </div>
  );
}

function InfoItem({ 
  label, 
  value, 
  subValue,
  highlight 
}: { 
  label: string; 
  value: string; 
  subValue?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-2 rounded-lg ${highlight ? 'bg-primary/10 border border-primary/20' : 'bg-background/30'}`}>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-semibold ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </div>
      {subValue && (
        <div className="text-[10px] text-muted-foreground">{subValue}</div>
      )}
    </div>
  );
}