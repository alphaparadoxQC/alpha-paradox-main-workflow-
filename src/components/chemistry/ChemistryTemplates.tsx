import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FlaskConical, Atom, Zap, BookOpen, ChevronRight, 
  ExternalLink, Beaker, TrendingUp, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CHEMISTRY_TEMPLATES, ChemistryTemplate } from '@/lib/chemistry/chemistryTemplates';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { toast } from 'sonner';

interface ChemistryTemplatesProps {
  onTemplateLoad?: (template: ChemistryTemplate) => void;
}

const difficultyColors = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/30',
  intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/30',
};

const categoryIcons = {
  'ground-state': Atom,
  'dissociation': TrendingUp,
  'excited-state': Sparkles,
};

export function ChemistryTemplates({ onTemplateLoad }: ChemistryTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ChemistryTemplate | null>(null);
  const { setQubitCount, setGates, clearCircuit } = useQuantumCircuitStore();

  const handleLoadTemplate = (template: ChemistryTemplate) => {
    clearCircuit();
    setQubitCount(template.circuit.qubits);
    setGates(template.circuit.gates);
    
    toast.success(`Loaded ${template.name}`, {
      description: `${template.circuit.qubits} qubits, depth ${template.circuit.depth}`,
    });
    
    onTemplateLoad?.(template);
    setSelectedTemplate(null);
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Beaker className="w-4 h-4 text-primary" />
          Chemistry Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-64">
          <div className="space-y-2 pr-4">
            {CHEMISTRY_TEMPLATES.map((template) => {
              const CategoryIcon = categoryIcons[template.category];
              
              return (
                <Dialog key={template.id}>
                  <DialogTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-3 rounded-lg bg-background/50 border border-border hover:border-primary/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <CategoryIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-foreground">
                              {template.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {template.circuit.qubits} qubits • depth {template.circuit.depth}
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-[9px] ${difficultyColors[template.difficulty]}`}
                        >
                          {template.difficulty}
                        </Badge>
                      </div>
                    </motion.div>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FlaskConical className="w-5 h-5 text-primary" />
                        {template.name}
                      </DialogTitle>
                      <DialogDescription>{template.description}</DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 mt-4">
                      {/* Molecule Info */}
                      <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                        <div className="text-3xl font-mono text-primary">
                          {template.molecule.formula}
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">{template.molecule.name}</div>
                          <div className="text-muted-foreground text-xs">
                            {template.molecule.electrons} electrons • {template.molecule.atoms.length} atoms
                          </div>
                        </div>
                      </div>
                      
                      {/* Expected Results */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-primary" />
                          Expected Results
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 rounded bg-primary/10 border border-primary/20">
                            <div className="text-[10px] text-muted-foreground uppercase">
                              Ground State
                            </div>
                            <div className="text-sm font-mono font-semibold text-primary">
                              {template.expectedResults.groundStateEnergy} {template.expectedResults.energyUnit}
                            </div>
                          </div>
                          <div className="p-2 rounded bg-background/50">
                            <div className="text-[10px] text-muted-foreground uppercase">
                              Accuracy
                            </div>
                            <div className="text-sm font-mono">
                              {template.expectedResults.accuracy}
                            </div>
                          </div>
                          {template.expectedResults.bondOrder && (
                            <div className="p-2 rounded bg-background/50 col-span-2">
                              <div className="text-[10px] text-muted-foreground uppercase">
                                Bond Order
                              </div>
                              <div className="text-sm font-mono">
                                {template.expectedResults.bondOrder}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Explanation */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-primary" />
                          How It Works
                        </h4>
                        <ul className="space-y-2">
                          {template.explanation.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Learning Objectives */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Learning Objectives</h4>
                        <div className="flex flex-wrap gap-2">
                          {template.learningObjectives.map((obj, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">
                              {obj}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {/* References */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">References</h4>
                        <div className="space-y-1">
                          {template.references.map((ref, i) => (
                            <a
                              key={i}
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {ref.title}
                            </a>
                          ))}
                        </div>
                      </div>
                      
                      {/* Load Button */}
                      <Button 
                        onClick={() => handleLoadTemplate(template)}
                        className="w-full bg-gradient-to-r from-primary to-accent"
                      >
                        Load Circuit Template
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
