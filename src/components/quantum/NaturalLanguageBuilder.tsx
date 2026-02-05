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

const EXAMPLE_PROMPTS = [
  "Create a Bell state with 2 qubits",
  "Build a GHZ state with 3 qubits",
  "Make a circuit that implements Grover's search on 4 qubits",
  "Create random superposition on all qubits",
  "Apply a Hadamard followed by CNOT gates in a chain",
];

export const NaturalLanguageBuilder = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { setGates, setQubitCount } = useQuantumCircuitStore();
  const { session } = useAuth();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setGeneratedCode(null);

    try {
      const { data, error } = await supabase.functions.invoke('quantum-assistant', {
        body: {
          message: `You are a quantum circuit generator. Convert this natural language description into a JSON array of quantum gates. 
          
The user wants: "${prompt}"

Respond ONLY with a valid JSON object in this exact format:
{
  "qubitCount": <number>,
  "gates": [
    {"type": "<gate type>", "qubit": <number>, "position": <number>, "targetQubit": <optional number>}
  ]
}

Valid gate types: H, X, Y, Z, S, T, CNOT, SWAP, CZ, CCX, M, Rx, Ry, Rz
For CNOT/CZ, use "qubit" for control and "targetQubit" for target.
For CCX, also include "controlQubit2".
Position is the column (0-indexed, left to right).
Qubit is the row (0-indexed, top to bottom).

Only respond with the JSON, no explanation.`,
          conversationHistory: [],
        },
        headers: session?.access_token 
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

      if (error) throw error;

      const responseText = data.response;
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse circuit from response');
      }

      const circuitData = JSON.parse(jsonMatch[0]);
      
      if (!circuitData.gates || !Array.isArray(circuitData.gates)) {
        throw new Error('Invalid circuit format');
      }

      // Transform to our gate format
      const gates: QuantumGate[] = circuitData.gates.map((g: any, i: number) => ({
        id: `gate-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        type: g.type,
        qubit: g.qubit,
        position: g.position,
        ...(g.targetQubit !== undefined ? { targetQubit: g.targetQubit } : {}),
        ...(g.controlQubit2 !== undefined ? { controlQubit2: g.controlQubit2 } : {}),
        ...(g.angle !== undefined ? { angle: g.angle } : {}),
      }));

      setGeneratedCode(JSON.stringify(circuitData, null, 2));
      
      // Apply to circuit
      const qubitCount = circuitData.qubitCount || Math.max(...gates.map((g: QuantumGate) => Math.max(g.qubit, g.targetQubit || 0))) + 1;
      setQubitCount(Math.max(2, Math.min(qubitCount, 15)));
      setGates(gates);
      
      toast.success('Circuit generated!', {
        description: `Created ${gates.length} gates on ${qubitCount} qubits`,
      });
      
    } catch (err) {
      console.error('Generation error:', err);
      toast.error('Failed to generate circuit', {
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
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            className="border-secondary/30 hover:border-secondary/50"
          >
            <Wand2 className="w-4 h-4 mr-2 text-secondary" />
            Natural Language
          </Button>
        </motion.div>
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
