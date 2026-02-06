import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Send, 
  Loader2, 
  Sparkles, 
  Lightbulb, 
  Search, 
  Beaker,
  Target,
  AlertTriangle,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDrugAI, type DrugAIAction, type MolecularProperties } from '@/hooks/useDrugAI';
import type { DrugCandidate, ProteinTarget } from '@/lib/drugDiscovery/drugData';

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
    description: 'AI prediction of binding affinity',
  },
  { 
    label: 'Optimize', 
    icon: TrendingUp, 
    action: 'optimize',
    description: 'Suggest structural improvements',
  },
  { 
    label: 'Find Similar', 
    icon: Search, 
    action: 'search_similar',
    description: 'Search known drug databases',
  },
  { 
    label: 'Generate Ideas', 
    icon: Lightbulb, 
    action: 'generate_candidates',
    description: 'AI-generated novel candidates',
  },
];

export function AIAssistantPanel({ drug, target, onApplySuggestion }: AIAssistantPanelProps) {
  const [customQuery, setCustomQuery] = useState('');
  const { 
    isLoading, 
    lastResponse, 
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
      molecularProperties: getMolecularProperties(),
    });
  };

  const handleCustomQuery = async () => {
    if (!customQuery.trim()) return;
    
    const context = drug 
      ? `Regarding ${drug.name} (${drug.formula}): `
      : '';
    
    await predict('predict', {
      smiles: drug?.smiles,
      targetId: target?.id,
      molecularProperties: getMolecularProperties(),
      customQuery: context + customQuery,
    });
    
    setCustomQuery('');
  };

  const renderConfidenceBadge = (confidence?: string) => {
    if (!confidence) return null;
    const colors = {
      high: 'bg-green-500/20 text-green-400 border-green-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return (
      <Badge variant="outline" className={`text-[10px] ${colors[confidence as keyof typeof colors] || ''}`}>
        {confidence} confidence
      </Badge>
    );
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-secondary" />
            AI Drug Discovery Assistant
          </div>
          {lastResponse && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2"
              onClick={clearHistory}
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.action}
              variant="outline"
              size="sm"
              className="justify-start h-auto py-2 px-3"
              disabled={isLoading || (action.action === 'generate_candidates' && !target)}
              onClick={() => handleQuickAction(action.action)}
            >
              <action.icon className="w-3.5 h-3.5 mr-2 text-primary" />
              <div className="text-left">
                <div className="text-xs font-medium">{action.label}</div>
                <div className="text-[10px] text-muted-foreground">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>

        {/* Custom Query Input */}
        <div className="space-y-2">
          <Textarea
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Ask about drug properties, suggest modifications, predict toxicity..."
            className="min-h-[60px] text-xs resize-none"
          />
          <Button
            onClick={handleCustomQuery}
            disabled={isLoading || !customQuery.trim()}
            className="w-full"
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-2" />
                Ask AI Expert
              </>
            )}
          </Button>
        </div>

        {/* AI Response */}
        <AnimatePresence>
          {lastResponse && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="space-y-2">
                {/* Prediction Summary */}
                {lastResponse.predictions && Object.keys(lastResponse.predictions).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {lastResponse.predictions.drugLikenessScore !== undefined && (
                      <Badge variant="secondary" className="text-[10px]">
                        Drug-likeness: {lastResponse.predictions.drugLikenessScore}%
                      </Badge>
                    )}
                    {lastResponse.predictions.predictedKi !== undefined && (
                      <Badge variant="secondary" className="text-[10px]">
                        Predicted Ki: {lastResponse.predictions.predictedKi} nM
                      </Badge>
                    )}
                    {renderConfidenceBadge(lastResponse.predictions.confidence)}
                  </div>
                )}

                {/* Full Response */}
                <ScrollArea className="h-[200px]">
                  <div className="bg-muted/50 rounded-lg p-3 text-xs leading-relaxed whitespace-pre-wrap">
                    {lastResponse.response}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Context Info */}
        <div className="flex gap-2 text-[10px]">
          {drug && (
            <Badge variant="outline" className="text-[10px]">
              <Beaker className="w-2.5 h-2.5 mr-1" />
              {drug.name}
            </Badge>
          )}
          {target && (
            <Badge variant="outline" className="text-[10px]">
              <Target className="w-2.5 h-2.5 mr-1" />
              {target.name.split(' ')[0]}
            </Badge>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground">
          AI predictions based on ChEMBL, DrugBank, and PubChem data patterns. 
          Requires experimental validation.
        </p>
      </CardContent>
    </Card>
  );
}
