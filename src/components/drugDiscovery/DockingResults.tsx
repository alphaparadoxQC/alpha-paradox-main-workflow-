import { Zap, Link2, Droplet, Atom } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { DockingResult, DrugCandidate, ProteinTarget } from '@/lib/drugDiscovery/drugData';

interface DockingResultsProps {
  result: DockingResult;
  drug: DrugCandidate;
  target: ProteinTarget;
}

export function DockingResults({ result, drug, target }: DockingResultsProps) {
  const affinityLabel = getAffinityLabel(result.bindingAffinity);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Docking Results
          </div>
          <Badge variant={affinityLabel.variant} className="text-xs">
            {affinityLabel.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="text-2xl font-bold text-primary">
            {result.bindingEnergy.toFixed(2)} kcal/mol
          </div>
          <div className="text-xs text-muted-foreground">Binding Free Energy</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatBox
            label="Binding Affinity (Ki)"
            value={formatAffinity(result.bindingAffinity)}
            icon={<Atom className="w-3.5 h-3.5" />}
          />
          <StatBox
            label="Pose Score"
            value={`${result.poseScore.toFixed(1)}%`}
            icon={<Link2 className="w-3.5 h-3.5" />}
          />
          <StatBox
            label="H-Bonds"
            value={result.hBonds.toString()}
            icon={<Droplet className="w-3.5 h-3.5" />}
          />
          <StatBox
            label="Interactions"
            value={result.interactionCount.toString()}
            icon={<Zap className="w-3.5 h-3.5" />}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Quantum Enhancement</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-background/50">
              <div className="text-muted-foreground">VQE Energy</div>
              <div className="font-mono text-primary">{result.vqeEnergy?.toFixed(3)} kcal/mol</div>
            </div>
            <div className="p-2 rounded bg-background/50">
              <div className="text-muted-foreground">Quantum Correction</div>
              <div className="font-mono text-accent">
                {result.quantumCorrection !== undefined && result.quantumCorrection >= 0 ? '+' : ''}
                {result.quantumCorrection?.toFixed(3)} kcal/mol
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">Binding Site Interactions</h4>
          <div className="flex flex-wrap gap-1">
            {target.bindingSite.keyInteractions.map((interaction, i) => (
              <Badge key={i} variant="outline" className="text-[10px]">
                {interaction}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {target.bindingSite.residues.map((residue, i) => (
              <span key={i} className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1 rounded">
                {residue}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-2 rounded-lg bg-background/30 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
        {icon}
        <span className="text-[10px]">{label}</span>
      </div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function formatAffinity(ki: number): string {
  if (ki < 1) return `${(ki * 1000).toFixed(0)} pM`;
  if (ki < 1000) return `${ki.toFixed(1)} nM`;
  return `${(ki / 1000).toFixed(2)} μM`;
}

function getAffinityLabel(ki: number): { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' } {
  if (ki < 10) return { label: 'Excellent', variant: 'default' };
  if (ki < 100) return { label: 'Good', variant: 'secondary' };
  if (ki < 1000) return { label: 'Moderate', variant: 'outline' };
  return { label: 'Weak', variant: 'destructive' };
}
