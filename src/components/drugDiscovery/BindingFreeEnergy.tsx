import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import type { DrugCandidate, ProteinTarget, DockingResult } from '@/lib/drugDiscovery/drugData';

interface BindingFreeEnergyProps {
  drug: DrugCandidate;
  target: ProteinTarget;
  result: DockingResult;
}

interface Profile { dG: number; dH: number; mTdS: number }

const PROFILES: Record<string, Profile> = {
  aspirin: { dG: -7.4, dH: -9.1, mTdS: 1.7 },
  ibuprofen: { dG: -8.1, dH: -9.4, mTdS: 1.3 },
  paracetamol: { dG: -6.5, dH: -8.0, mTdS: 1.5 },
  warfarin: { dG: -9.2, dH: -10.8, mTdS: 1.6 },
  caffeine: { dG: -5.8, dH: -7.0, mTdS: 1.2 },
};

function classifyDg(dG: number): { label: string; tone: 'good' | 'warn' | 'bad' } {
  if (dG < -10) return { label: 'Excellent binder', tone: 'good' };
  if (dG <= -8) return { label: 'Strong binder', tone: 'good' };
  if (dG <= -6) return { label: 'Moderate binder', tone: 'warn' };
  if (dG <= -4) return { label: 'Weak binder', tone: 'warn' };
  return { label: 'Poor binder', tone: 'bad' };
}

export function BindingFreeEnergy({ drug, result }: BindingFreeEnergyProps) {
  const profile: Profile =
    PROFILES[drug.id] ?? (() => {
      // Compute thermodynamic decomposition from molecular properties
      // ΔG = ΔH - TΔS (Gibbs free energy)
      // Approximate ΔH from binding energy + hydrogen bond contribution
      const hBondContrib = (drug.hBondDonors + drug.hBondAcceptors) * 0.3;
      const hydrophobicContrib = drug.logP * 0.25;
      const sizeEntropy = Math.log(drug.molecularWeight / 100) * 0.8;
      const dG = result.bindingEnergy;
      const dH = dG - sizeEntropy - hydrophobicContrib + hBondContrib;
      const mTdS = dH - dG; // -TΔS = ΔH - ΔG
      return { dG, dH, mTdS };
    })();

  const cls = classifyDg(profile.dG);

  // Stacked bar visualization — total magnitude
  const totalMag = Math.abs(profile.dH) + Math.abs(profile.mTdS);
  const dHpct = (Math.abs(profile.dH) / totalMag) * 100;
  const mTdSpct = (Math.abs(profile.mTdS) / totalMag) * 100;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Binding Free Energy
          </div>
          <Badge
            variant={cls.tone === 'good' ? 'default' : cls.tone === 'warn' ? 'secondary' : 'destructive'}
            className={`text-xs ${
              cls.tone === 'good' ? 'bg-green-500/20 text-green-500 border border-green-500/40' :
              cls.tone === 'warn' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40' : ''
            }`}
          >
            {cls.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="text-2xl font-bold text-primary">
            ΔG = {profile.dG.toFixed(2)} kcal/mol
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Gibbs Free Energy — pharmaceutical standard metric
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
            <span>Enthalpy / Entropy Breakdown</span>
            <span className="font-mono normal-case">
              ΔH {profile.dH.toFixed(2)} • -TΔS {profile.mTdS >= 0 ? '+' : ''}{profile.mTdS.toFixed(2)}
            </span>
          </div>
          <div className="h-3 w-full rounded-full overflow-hidden flex bg-muted">
            <div
              className="bg-green-500/70 h-full"
              style={{ width: `${dHpct}%` }}
              title={`ΔH ${profile.dH.toFixed(2)} kcal/mol`}
            />
            <div
              className="bg-amber-500/70 h-full"
              style={{ width: `${mTdSpct}%` }}
              title={`-TΔS ${profile.mTdS.toFixed(2)} kcal/mol`}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>ΔH (favorable)</span>
            <span>-TΔS (entropic cost)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
