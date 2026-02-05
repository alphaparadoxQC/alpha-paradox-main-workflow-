import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Atom, Zap, FlaskConical, Sparkles, Info, Play } from 'lucide-react';
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
import { MOLECULES, getMoleculeById, MoleculeData } from '@/lib/chemistry/moleculeData';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { toast } from 'sonner';

interface ChemistryTabProps {
  onGenerateCircuit?: () => void;
}

export function ChemistryTab({ onGenerateCircuit }: ChemistryTabProps) {
  const [selectedMoleculeId, setSelectedMoleculeId] = useState<string>('h2');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { setQubitCount, addGate, clearCircuit } = useQuantumCircuitStore();
  
  const molecule = getMoleculeById(selectedMoleculeId) || MOLECULES[0];

  const generateGateId = () => `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const generateVQECircuit = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      // Clear existing circuit
      clearCircuit();
      
      // Set qubit count based on molecule
      setQubitCount(molecule.qubitsRequired);
      
      // Generate a VQE ansatz circuit
      // This is a simplified UCCSD-inspired ansatz
      const qubits = molecule.qubitsRequired;
      const depth = molecule.vqeDepth;
      
      // Initial Hartree-Fock state preparation (put electrons in lowest orbitals)
      const occupiedOrbitals = Math.floor(molecule.electrons / 2);
      for (let i = 0; i < occupiedOrbitals && i < qubits; i++) {
        addGate({
          id: generateGateId(),
          type: 'X',
          qubit: i,
          position: 0,
        });
      }
      
      // Variational layers
      for (let layer = 0; layer < depth; layer++) {
        const pos = layer * 3 + 1;
        
        // Ry rotations on each qubit
        for (let q = 0; q < qubits; q++) {
          addGate({
            id: generateGateId(),
            type: 'Ry',
            qubit: q,
            position: pos,
            angle: Math.PI / 4, // Initial parameter
          });
        }
        
        // Entangling layer with CNOT ladder
        for (let q = 0; q < qubits - 1; q++) {
          addGate({
            id: generateGateId(),
            type: 'CNOT',
            qubit: q + 1,
            controlQubit: q,
            position: pos + 1,
          });
        }
        
        // Rz rotations
        for (let q = 0; q < qubits; q++) {
          addGate({
            id: generateGateId(),
            type: 'Rz',
            qubit: q,
            position: pos + 2,
            angle: Math.PI / 3,
          });
        }
      }
      
      toast.success(`VQE circuit generated for ${molecule.formula}`, {
        description: `${qubits} qubits, depth ${depth * 3 + 1}`,
      });
      
      onGenerateCircuit?.();
    } catch (error) {
      toast.error('Failed to generate circuit');
    } finally {
      setIsGenerating(false);
    }
  }, [molecule, clearCircuit, setQubitCount, addGate, onGenerateCircuit]);

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FlaskConical className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Quantum Chemistry</h2>
            <p className="text-xs text-muted-foreground">
              Simulate molecular ground states with VQE
            </p>
          </div>
        </div>
      </div>
      
      {/* Molecule Selector */}
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Atom className="w-4 h-4 text-primary" />
            Select Molecule
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Select value={selectedMoleculeId} onValueChange={setSelectedMoleculeId}>
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
          
          {/* Bond angles display */}
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
              label="Ground State Energy" 
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
      
      {/* Molecular Orbital Diagram */}
      <MolecularOrbitalDiagram 
        orbitals={molecule.orbitals} 
        moleculeName={molecule.name} 
      />
      
      <Separator />
      
      {/* Generate VQE Circuit Button */}
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={generateVQECircuit}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
          size="lg"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⚛</span>
              Generating...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Generate VQE Circuit
            </span>
          )}
        </Button>
      </motion.div>
      
      <p className="text-[10px] text-muted-foreground text-center">
        Generates a variational quantum eigensolver circuit for ground state estimation
      </p>
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
