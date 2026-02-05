import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Blocks, 
  Plus, 
  GripVertical, 
  Trash2, 
  ChevronDown,
  Play,
  Settings,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { GateType, GATE_INFO } from '@/types/quantum';
import { toast } from 'sonner';

interface FlowStep {
  id: string;
  type: 'gate' | 'repeat' | 'measure-all' | 'entangle-chain';
  gateType?: GateType;
  qubits: number[];
  repeatCount?: number;
  angle?: number;
}

const PRESET_PATTERNS = [
  { id: 'bell', name: 'Bell State', description: 'Create entangled pair' },
  { id: 'ghz', name: 'GHZ State', description: 'Multi-qubit entanglement' },
  { id: 'superposition', name: 'Full Superposition', description: 'Hadamard on all qubits' },
  { id: 'qft-prep', name: 'QFT Preparation', description: 'Prepare for quantum Fourier transform' },
];

export const VisualFlowBuilder = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const { setGates, setQubitCount, qubitCount, simulate } = useQuantumCircuitStore();

  const addStep = (type: FlowStep['type']) => {
    const newStep: FlowStep = {
      id: `step-${Date.now()}`,
      type,
      qubits: type === 'gate' ? [0] : [],
      gateType: type === 'gate' ? 'H' : undefined,
      repeatCount: type === 'repeat' ? 2 : undefined,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const updateStep = (id: string, updates: Partial<FlowStep>) => {
    setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const applyPreset = (presetId: string) => {
    let newSteps: FlowStep[] = [];
    
    switch (presetId) {
      case 'bell':
        newSteps = [
          { id: 's1', type: 'gate', gateType: 'H', qubits: [0] },
          { id: 's2', type: 'gate', gateType: 'CNOT', qubits: [0, 1] },
        ];
        break;
      case 'ghz':
        newSteps = [
          { id: 's1', type: 'gate', gateType: 'H', qubits: [0] },
          { id: 's2', type: 'entangle-chain', qubits: [] },
        ];
        break;
      case 'superposition':
        newSteps = [
          { id: 's1', type: 'gate', gateType: 'H', qubits: Array.from({ length: qubitCount }, (_, i) => i) },
        ];
        break;
      case 'qft-prep':
        newSteps = [
          { id: 's1', type: 'gate', gateType: 'X', qubits: [0] },
          { id: 's2', type: 'gate', gateType: 'H', qubits: Array.from({ length: qubitCount }, (_, i) => i) },
        ];
        break;
    }
    
    setSteps(newSteps);
    toast.success(`Loaded ${PRESET_PATTERNS.find(p => p.id === presetId)?.name} pattern`);
  };

  const buildAndApply = () => {
    const gates: any[] = [];
    let position = 0;
    
    for (const step of steps) {
      switch (step.type) {
        case 'gate':
          if (step.gateType === 'CNOT' || step.gateType === 'SWAP' || step.gateType === 'CZ') {
            gates.push({
              id: `gate-${Date.now()}-${position}`,
              type: step.gateType,
              qubit: step.qubits[0] || 0,
              targetQubit: step.qubits[1] || 1,
              position,
            });
          } else {
            for (const qubit of step.qubits) {
              gates.push({
                id: `gate-${Date.now()}-${position}-${qubit}`,
                type: step.gateType,
                qubit,
                position,
                ...(step.angle ? { angle: step.angle } : {}),
              });
            }
          }
          position++;
          break;
          
        case 'entangle-chain':
          for (let i = 0; i < qubitCount - 1; i++) {
            gates.push({
              id: `gate-${Date.now()}-${position}-${i}`,
              type: 'CNOT',
              qubit: i,
              targetQubit: i + 1,
              position,
            });
            position++;
          }
          break;
          
        case 'measure-all':
          for (let i = 0; i < qubitCount; i++) {
            gates.push({
              id: `gate-${Date.now()}-${position}-${i}`,
              type: 'M',
              qubit: i,
              position,
            });
          }
          position++;
          break;
          
        case 'repeat':
          // Duplicate previous steps
          break;
      }
    }
    
    setGates(gates);
    toast.success(`Built circuit with ${gates.length} gates`);
    setIsOpen(false);
  };

  const renderStepEditor = (step: FlowStep, index: number) => (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center gap-2 p-3 bg-card rounded-lg border border-border"
    >
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
        {index + 1}
      </div>
      
      {step.type === 'gate' && (
        <>
          <Select
            value={step.gateType}
            onValueChange={(v) => updateStep(step.id, { gateType: v as GateType })}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(GATE_INFO).map(([type, info]) => (
                <SelectItem key={type} value={type}>
                  {info.symbol} {info.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <span className="text-xs text-muted-foreground">on</span>
          
          <Input
            type="text"
            value={step.qubits.join(',')}
            onChange={(e) => {
              const qubits = e.target.value.split(',').map(Number).filter(n => !isNaN(n));
              updateStep(step.id, { qubits });
            }}
            placeholder="0,1"
            className="w-16 h-8 text-xs"
          />
        </>
      )}
      
      {step.type === 'entangle-chain' && (
        <span className="text-sm">CNOT chain (all qubits)</span>
      )}
      
      {step.type === 'measure-all' && (
        <span className="text-sm">Measure all qubits</span>
      )}
      
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 ml-auto"
        onClick={() => removeStep(step.id)}
      >
        <Trash2 className="w-3 h-3 text-destructive" />
      </Button>
    </motion.div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            className="border-accent/30 hover:border-accent/50"
          >
            <Blocks className="w-4 h-4 mr-2 text-accent" />
            Visual Flow
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Blocks className="w-5 h-5 text-accent" />
            Visual Flow Builder
          </DialogTitle>
          <DialogDescription>
            Build circuits by stacking operations visually
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Presets */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick Patterns</Label>
            <div className="flex flex-wrap gap-1">
              {PRESET_PATTERNS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Steps */}
          <ScrollArea className="h-[200px] pr-2">
            <div className="space-y-2">
              <AnimatePresence>
                {steps.map((step, index) => renderStepEditor(step, index))}
              </AnimatePresence>
              
              {steps.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Blocks className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No steps yet</p>
                  <p className="text-xs">Add operations below to build your circuit</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Add Step Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => addStep('gate')}>
              <Plus className="w-3 h-3 mr-1" /> Gate
            </Button>
            <Button variant="outline" size="sm" onClick={() => addStep('entangle-chain')}>
              <Plus className="w-3 h-3 mr-1" /> Entangle Chain
            </Button>
            <Button variant="outline" size="sm" onClick={() => addStep('measure-all')}>
              <Plus className="w-3 h-3 mr-1" /> Measure All
            </Button>
          </div>

          {/* Apply Button */}
          <Button 
            onClick={buildAndApply} 
            className="w-full"
            disabled={steps.length === 0}
          >
            <Play className="w-4 h-4 mr-2" />
            Build Circuit ({steps.length} steps)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
