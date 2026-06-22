import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wand2, 
  CircuitBoard, 
  MessageSquare, 
  Sparkles, 
  ArrowRight,
  Loader2,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { QuantumGate } from '@/types/quantum';
import { generateCircuitFromPrompt } from '@/lib/huggingFaceService';

const EXAMPLE_PROMPTS = [
  "Create a Bell state with 2 qubits",
  "Build a GHZ state with 3 qubits",
  "Make a circuit that implements Grover's search on 4 qubits",
  "Create random superposition on all qubits",
  "Apply a Hadamard followed by CNOT gates in a chain",
];

const parseAngle = (val: any): number | undefined => {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'number') return val;
  const str = String(val).toLowerCase().trim();
  if (str === 'pi') return Math.PI;
  if (str === 'pi/2' || str === 'pi / 2' || str === '0.5pi' || str === '0.5 * pi') return Math.PI / 2;
  if (str === 'pi/4' || str === 'pi / 4' || str === '0.25pi' || str === '0.25 * pi') return Math.PI / 4;
  if (str === 'pi/8' || str === 'pi / 8' || str === '0.125pi' || str === '0.125 * pi') return Math.PI / 8;
  const num = parseFloat(str);
  return isNaN(num) ? undefined : num;
};

export const NaturalLanguageBuilder = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const {
    gates,
    setGates,
    setQubitCount,
    addGate,
    clearCircuit,
    incrementQubits,
    decrementQubits,
    undo,
    redo,
    simulate
  } = useQuantumCircuitStore();
  const { session } = useAuth();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setGeneratedCode(null);

    try {
      const responseData = await generateCircuitFromPrompt(prompt);
      
      setGeneratedCode(JSON.stringify(responseData, null, 2));

      if (responseData.type === 'command') {
        const cmd = responseData.commandData;
        if (!cmd) throw new Error('Command data is missing');

        switch (cmd.action) {
          case 'CLEAR_CIRCUIT':
            clearCircuit();
            toast.success('Circuit cleared!');
            break;
          case 'INCREMENT_QUBITS':
            incrementQubits();
            toast.success('Added a qubit!');
            break;
          case 'DECREMENT_QUBITS':
            decrementQubits();
            toast.success('Removed a qubit!');
            break;
          case 'UNDO':
            undo();
            toast.success('Undone last change!');
            break;
          case 'REDO':
            redo();
            toast.success('Redone change!');
            break;
          case 'SIMULATE':
            simulate();
            toast.success('Simulation run triggered!');
            break;
          case 'ADD_GATE': {
            const params = cmd.params;
            if (!params || !params.type) {
              throw new Error('Gate type parameter missing for ADD_GATE');
            }
            const gateType = params.type;
            if (gateType === 'CNOT' || gateType === 'cx') {
              const control = parseInt(params.control ?? params.qubit ?? '0');
              const target = parseInt(params.target ?? '1');
              const maxPos = gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 1 : 0;
              addGate({
                id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'CNOT',
                qubit: control,
                position: maxPos,
                controlQubit: control,
                targetQubit: target,
              });
              toast.success(`CNOT gate added (control: ${control}, target: ${target})`);
            } else {
              const q = parseInt(params.qubit ?? '0');
              const maxPos = gates.length > 0 ? Math.max(...gates.map(g => g.position)) + 1 : 0;
              addGate({
                id: `gate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: gateType as any,
                qubit: q,
                position: maxPos,
                ...(['Rx', 'Ry', 'Rz', 'P'].includes(gateType) ? { angle: Math.PI / 2 } : {}),
              });
              toast.success(`${gateType} gate added to qubit ${q}`);
            }
            break;
          }
          default:
            throw new Error(`Unknown command action: ${cmd.action}`);
        }
      } else {
        const circuitData = responseData.circuitData;
        if (!circuitData || !circuitData.gates || !Array.isArray(circuitData.gates)) {
          throw new Error('Circuit data or gates array is missing');
        }

        // Transform to our gate format
        const newGates: QuantumGate[] = circuitData.gates.map((g: any, i: number) => ({
          id: `gate-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          type: g.type,
          qubit: g.qubit,
          position: g.position,
          ...(g.targetQubit !== undefined ? { targetQubit: g.targetQubit } : {}),
          ...(g.controlQubit2 !== undefined ? { controlQubit2: g.controlQubit2 } : {}),
          ...(g.angle !== undefined ? { angle: parseAngle(g.angle) } : {}),
        }));

        const qubitCount = circuitData.qubitCount || Math.max(...newGates.map((g: QuantumGate) => Math.max(g.qubit, g.targetQubit || 0))) + 1;
        setQubitCount(Math.max(2, Math.min(qubitCount, 15)));
        setGates(newGates);
        
        toast.success('Circuit generated!', {
          description: `Created ${newGates.length} gates on ${qubitCount} qubits`,
        });
      }
      
    } catch (err) {
      console.error('Generation error:', err);
      toast.error('Failed to parse or execute', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(true);
          }}
        >
          <Wand2 className="w-4 h-4 text-secondary" />
          Natural Language
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary" />
            Natural Language Circuit Builder
          </DialogTitle>
          <DialogDescription>
            Describe your quantum circuit in plain English and I'll build it for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the quantum circuit you want to build..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Example Prompts */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Try these examples:</p>
            <div className="flex flex-wrap gap-1">
              {EXAMPLE_PROMPTS.slice(0, 3).map((example) => (
                <button
                  key={example}
                  onClick={() => setPrompt(example)}
                  className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors truncate max-w-[200px]"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            className="w-full"
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <CircuitBoard className="w-4 h-4 mr-2" />
                Generate Circuit
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          {/* Generated Code Preview */}
          <AnimatePresence>
            {generatedCode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Generated Circuit:</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-6 px-2"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-accent" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <pre className="bg-muted rounded-lg p-3 text-xs overflow-auto max-h-[200px]">
                  {generatedCode}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
