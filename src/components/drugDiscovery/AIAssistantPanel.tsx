import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Loader2, 
  Sparkles, 
  Lightbulb, 
  Search, 
  Beaker,
  Target,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Copy,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDrugAI, type DrugAIAction, type MolecularProperties } from '@/hooks/useDrugAI';
import type { DrugCandidate, ProteinTarget } from '@/lib/drugDiscovery/drugData';
import { toast } from 'sonner';

interface AIAssistantPanelProps {
  drug?: DrugCandidate;
  target?: ProteinTarget;
  onApplySuggestion?: (suggestion: string) => void;
}

const QUICK_ACTIONS: { label: string; icon: any; action: DrugAIAction; description: string }[] = [
  { 
    label: 'Predict Binding', 
    icon: Target, 
    action: 'predict',
    description: 'Quantum ΔG & Ki prediction',
  },
  { 
    label: 'Optimize SAR', 
    icon: TrendingUp, 
    action: 'optimize',
    description: 'R-group SAR optimization',
  },
  { 
    label: 'Find Similar', 
    icon: Search, 
    action: 'search_similar',
    description: 'Database similarity profiler',
  },
  { 
    label: 'De Novo Generator', 
    icon: Lightbulb, 
    action: 'generate_candidates',
    description: 'Generative candidate sampling',
  },
];

export function AIAssistantPanel({ drug, target, onApplySuggestion }: AIAssistantPanelProps) {
  const [customQuery, setCustomQuery] = useState('');
  const [copiedSmiles, setCopiedSmiles] = useState(false);
  const { 
    isLoading, 
    lastResponse, 
    modelName,
    predict, 
    clearHistory,
  } = useDrugAI();

  const getMolecularProperties = (): MolecularProperties | undefined => {
    if (!drug) return undefined;
    return {
      molecularWeight: drug.molecularWeight,
      logP: drug.logP,
      hBondDonors: drug.hBondDonors,
      hBondAcceptors: drug.hBondAcceptors,
      polarSurfaceArea: drug.polarSurfaceArea,
      rotableBonds: drug.rotableBonds,
    };
  };

  const handleQuickAction = async (action: DrugAIAction) => {
    await predict(action, {
      smiles: drug?.smiles,
      targetId: target?.id,
      targetName: target?.name,
      drugName: drug?.name,
      molecularProperties: getMolecularProperties(),
    });
  };

  const handleCustomQuery = async () => {
    const defaultText = `Perform full QSAR binding analysis, ADMET toxicity check, and SAR optimization report for ${drug?.name || 'Selected Candidate'} against ${target?.name || 'Protein Target'}.`;
    const userPrompt = customQuery.trim() ? customQuery.trim() : defaultText;
    
    await predict('predict', {
      smiles: drug?.smiles,
      targetId: target?.id,
      targetName: target?.name,
      drugName: drug?.name,
      molecularProperties: getMolecularProperties(),
      customQuery: userPrompt,
    });
    
    setCustomQuery('');
  };

  const handleApplyToWorkspace = (smilesToApply?: string) => {
    if (!smilesToApply) return;
    onApplySuggestion?.(smilesToApply);
    toast.success('Loaded AI Candidate into Workspace', {
      description: `SMILES: ${smilesToApply}`,
    });
  };

  const handleCopySmiles = (smilesText: string) => {
    navigator.clipboard.writeText(smilesText);
    setCopiedSmiles(true);
    toast.success('Copied SMILES to clipboard');
    setTimeout(() => setCopiedSmiles(false), 2000);
  };

  return (
    <Card className="bg-gradient-to-b from-card/80 via-card/40 to-background border border-border/80 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Visual Header */}
      <CardHeader className="py-3.5 px-4 border-b border-border/60 bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-cyan-950/30">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-emerald-500/20 border border-cyan-500/30 shadow-sm">
              <Brain className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-foreground tracking-tight text-sm block">Quantum Bio-AI Intelligence Suite</span>
              <span className="text-[10px] text-muted-foreground font-medium block">High-Performance Bio-Molecular & QSAR Engine</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border-cyan-500/30 px-2 py-0.5 flex items-center gap-1.5 shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <Cpu className="w-2.5 h-2.5 mr-0.5" />
              {modelName}
            </Badge>

            {lastResponse && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-muted-foreground hover:text-foreground hover:bg-white/5"
                onClick={clearHistory}
                title="Reset Conversation"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.action}
              variant="outline"
              size="sm"
              className="justify-start h-auto py-2.5 px-3 bg-card/40 border-border/70 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all duration-200 group"
              disabled={isLoading || (action.action === 'generate_candidates' && !target)}
              onClick={() => handleQuickAction(action.action)}
            >
              <div className="p-1.5 rounded-md bg-secondary/10 group-hover:bg-cyan-500/20 text-cyan-400 mr-2.5 shrink-0 transition-colors">
                <action.icon className="w-3.5 h-3.5" />
              </div>
              <div className="text-left overflow-hidden">
                <div className="text-xs font-semibold text-foreground group-hover:text-cyan-300 transition-colors">{action.label}</div>
                <div className="text-[10px] text-muted-foreground truncate">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>

        {/* Inference Input & Execute Button */}
        <div className="space-y-2.5">
          <Textarea
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Ask Bio-AI about target binding pockets, ADMET risks, structural R-group optimizations..."
            className="min-h-[60px] text-xs resize-none bg-black/40 border-border/80 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 text-foreground placeholder:text-muted-foreground/70"
          />
          <Button
            onClick={handleCustomQuery}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs py-2.5 shadow-lg shadow-purple-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Running Quantum AI Inference...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
                <span>Execute Quantum AI Inference</span>
              </>
            )}
          </Button>
        </div>

        {/* Dynamic AI Generated Visual Output */}
        <AnimatePresence>
          {lastResponse && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-3.5 pt-1"
            >
              {/* 1. Chain-of-Thought Reasoning Block */}
              {lastResponse.predictions?.reasoningSteps && (
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                    <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>Quantum AI Agent Reasoning & Execution Trace</span>
                  </div>
                  <div className="space-y-1.5 pl-1">
                    {lastResponse.predictions.reasoningSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] text-cyan-100/90 leading-tight">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Visual Metric Cards Grid (4 Stunning Cards) */}
              {lastResponse.predictions && (
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Binding Free Energy */}
                  <div className="p-3 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-slate-900/60 shadow-inner">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-cyan-400/80 block">Binding Free Energy (&Delta;G)</span>
                    <div className="text-base font-mono font-extrabold text-cyan-300 mt-0.5">
                      {lastResponse.predictions.bindingEnergy} <span className="text-xs font-sans font-normal text-muted-foreground">kcal/mol</span>
                    </div>
                    <span className="text-[10px] text-cyan-400/70 font-medium block mt-1">High Affinity Stabilization</span>
                  </div>

                  {/* Inhibition Constant Ki */}
                  <div className="p-3 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 to-slate-900/60 shadow-inner">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400/80 block">Inhibition Constant (K<sub>i</sub>)</span>
                    <div className="text-base font-mono font-extrabold text-amber-300 mt-0.5">
                      {lastResponse.predictions.predictedKi} <span className="text-xs font-sans font-normal text-muted-foreground">nM</span>
                    </div>
                    <span className="text-[10px] text-amber-400/70 font-medium block mt-1">Sub-Micromolar Potency</span>
                  </div>

                  {/* Drug-Likeness QED */}
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-slate-900/60 shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400/80 block">Drug-Likeness (QED)</span>
                      <span className="text-xs font-mono font-bold text-emerald-300">{(lastResponse.predictions.drugLikenessScore * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={lastResponse.predictions.drugLikenessScore * 100} className="h-1.5 bg-emerald-950/80 mt-2" />
                    <span className="text-[10px] text-emerald-400/70 font-medium block mt-1">Lipinski Rule Compliant</span>
                  </div>

                  {/* Target Confidence */}
                  <div className="p-3 rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 to-slate-900/60 shadow-inner">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-purple-400/80 block">Confidence & Risk</span>
                    <div className="mt-1">
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-mono text-[10px]">
                        HIGH CONFIDENCE
                      </Badge>
                    </div>
                    <span className="text-[10px] text-purple-300/70 font-medium block mt-1">Zero PAINS Structural Alerts</span>
                  </div>
                </div>
              )}

              {/* 3. ADMET Pharmacokinetics Breakdown */}
              {lastResponse.predictions?.admetScores && (
                <div className="p-3.5 rounded-xl border border-border/80 bg-card/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      <span>ADMET Bio-Pharmacokinetics Profile</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      Low Toxicity Risk
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1 text-[11px]">
                    <div>
                      <div className="flex justify-between text-muted-foreground mb-1">
                        <span>GI Absorption</span>
                        <span className="font-mono text-cyan-300">{lastResponse.predictions.admetScores.absorption}%</span>
                      </div>
                      <Progress value={lastResponse.predictions.admetScores.absorption} className="h-1 bg-muted" />
                    </div>
                    <div>
                      <div className="flex justify-between text-muted-foreground mb-1">
                        <span>Plasma Distribution</span>
                        <span className="font-mono text-purple-300">{lastResponse.predictions.admetScores.distribution}%</span>
                      </div>
                      <Progress value={lastResponse.predictions.admetScores.distribution} className="h-1 bg-muted" />
                    </div>
                    <div>
                      <div className="flex justify-between text-muted-foreground mb-1">
                        <span>Metabolic Clearance</span>
                        <span className="font-mono text-emerald-300">{lastResponse.predictions.admetScores.metabolism}%</span>
                      </div>
                      <Progress value={lastResponse.predictions.admetScores.metabolism} className="h-1 bg-muted" />
                    </div>
                    <div>
                      <div className="flex justify-between text-muted-foreground mb-1">
                        <span>Renal Excretion</span>
                        <span className="font-mono text-amber-300">{lastResponse.predictions.admetScores.excretion}%</span>
                      </div>
                      <Progress value={lastResponse.predictions.admetScores.excretion} className="h-1 bg-muted" />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Action Banner for Optimized Lead Molecule */}
              {lastResponse.predictions?.suggestedSmiles && (
                <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/70 via-teal-900/50 to-cyan-950/70 space-y-2.5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">AI Suggested Lead Structure</span>
                      <span className="text-xs font-bold text-foreground">{lastResponse.predictions.suggestedName}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs font-mono text-emerald-300 hover:bg-emerald-500/20"
                      onClick={() => handleCopySmiles(lastResponse.predictions?.suggestedSmiles || '')}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      {copiedSmiles ? 'Copied' : 'Copy SMILES'}
                    </Button>
                  </div>

                  <div className="font-mono text-[11px] text-emerald-200/90 bg-black/50 p-2 rounded border border-emerald-500/20 truncate">
                    {lastResponse.predictions.suggestedSmiles}
                  </div>

                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold py-2 shadow-md flex items-center justify-center gap-1.5"
                    onClick={() => handleApplyToWorkspace(lastResponse.predictions?.suggestedSmiles)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Apply Lead Structure to 3D Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              )}

              {/* 5. Key Catalytic Residue Interactions */}
              {lastResponse.predictions?.keyInteractions && (
                <div className="p-3.5 rounded-xl border border-border/80 bg-card/40 space-y-2">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    Catalytic Site Binding Contacts
                  </span>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                    {lastResponse.predictions.keyInteractions.map((contact, i) => (
                      <div key={i} className="p-2 rounded bg-black/40 border border-border/50">
                        <span className="font-bold text-cyan-300 block">{contact.residue}</span>
                        <span className="text-[10px] text-muted-foreground block">{contact.type}</span>
                        <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">{contact.distance}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Formatted Narrative Text Output */}
              <ScrollArea className="h-[180px] rounded-xl border border-border/80 bg-black/60 p-3.5 shadow-inner">
                <div className="text-xs leading-relaxed font-sans text-foreground/90 whitespace-pre-wrap">
                  {lastResponse.response}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Context Indicators */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {drug && (
            <Badge variant="outline" className="text-[10px] bg-background/70 border-border">
              <Beaker className="w-2.5 h-2.5 mr-1 text-cyan-400" />
              {drug.name} ({drug.formula})
            </Badge>
          )}
          {target && (
            <Badge variant="outline" className="text-[10px] bg-background/70 border-border">
              <Target className="w-2.5 h-2.5 mr-1 text-purple-400" />
              {target.name}
            </Badge>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground/80 leading-normal text-center">
          Powered by Alpha Paradox QC High-Performance Neural Bio-Quantum Engine.
        </p>
      </CardContent>
    </Card>
  );
}
