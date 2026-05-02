import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import type { DrugCandidate } from '@/lib/drugDiscovery/drugData';

interface SelectivityProfilerProps {
  drug: DrugCandidate;
}

interface TargetEntry {
  name: string;
  dG: number; // kcal/mol
  note?: string;
  primary?: boolean;
}

const PROFILES: Record<string, TargetEntry[]> = {
  aspirin: [
    { name: 'COX-2', dG: -7.4, note: 'Primary Target', primary: true },
    { name: 'COX-1', dG: -7.1, note: 'Off-target: GI risk' },
    { name: 'Thrombin', dG: -4.2 },
    { name: 'EGFR Kinase', dG: -3.8 },
    { name: 'hERG Channel', dG: -2.1, note: 'Cardiac safety ✓' },
    { name: 'Carbonic Anhydrase', dG: -5.3 },
  ],
  ibuprofen: [
    { name: 'COX-1', dG: -8.0, note: 'Primary Target', primary: true },
    { name: 'COX-2', dG: -7.8 },
    { name: 'Thrombin', dG: -4.5 },
    { name: 'EGFR Kinase', dG: -3.6 },
    { name: 'hERG Channel', dG: -3.0 },
    { name: 'Carbonic Anhydrase', dG: -4.9 },
  ],
};

function defaultProfile(drug: DrugCandidate): TargetEntry[] {
  const base = -5 - drug.logP * 0.4;
  return [
    { name: 'Primary Target', dG: base - 2, note: 'Primary Target', primary: true },
    { name: 'Off-target A', dG: base - 0.6 },
    { name: 'Off-target B', dG: base + 0.5 },
    { name: 'Off-target C', dG: base + 1.4 },
    { name: 'hERG Channel', dG: base + 2.5, note: 'Cardiac safety check' },
    { name: 'Carbonic Anhydrase', dG: base + 0.9 },
  ];
}

export function SelectivityProfiler({ drug }: SelectivityProfilerProps) {
  const targets = PROFILES[drug.id] ?? defaultProfile(drug);
  const primary = targets.find((t) => t.primary) ?? targets[0];
  const offTargets = targets.filter((t) => !t.primary);
  const strongestOff = offTargets.reduce((best, t) => (t.dG < best.dG ? t : best), offTargets[0]);

  // Selectivity Index using magnitudes (more negative = stronger binding)
  const SI = Math.abs(primary.dG) / Math.max(0.01, Math.abs(strongestOff.dG));
  const verdict =
    SI > 10 ? { label: 'Highly Selective', cls: 'bg-green-500/20 text-green-500 border border-green-500/40' }
    : SI >= 2 ? { label: 'Moderately Selective', cls: 'bg-amber-500/20 text-amber-500 border border-amber-500/40' }
    : { label: 'Low Selectivity — off-target risk', cls: '' };

  // Bar scaling
  const maxMag = Math.max(...targets.map((t) => Math.abs(t.dG)));

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Multi-Target Selectivity Profile
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Binding affinity across multiple protein targets
        </p>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="space-y-1.5">
          {targets.map((t) => {
            const pct = (Math.abs(t.dG) / maxMag) * 100;
            return (
              <div key={t.name} className="space-y-0.5">
                <div className="flex justify-between items-center text-xs">
                  <span className={`flex items-center gap-2 ${t.primary ? 'font-semibold text-primary' : 'text-foreground'}`}>
                    {t.name}
                    {t.note && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">{t.note}</Badge>
                    )}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {t.dG.toFixed(2)} kcal/mol
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${t.primary ? 'bg-primary' : 'bg-quantum-purple/70'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Selectivity Index</div>
            <div className="text-lg font-mono font-bold text-primary">{SI.toFixed(2)}×</div>
          </div>
          <div className="p-2 rounded-lg bg-background/30 flex items-center justify-center">
            <Badge className={`text-xs ${verdict.cls}`} variant={SI > 10 ? 'default' : SI >= 2 ? 'secondary' : 'destructive'}>
              {verdict.label}
            </Badge>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          SI = |primary affinity| / |strongest off-target affinity|
        </p>
      </CardContent>
    </Card>
  );
}
