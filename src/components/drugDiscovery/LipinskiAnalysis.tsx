import { Check, X, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { LipinskiResult } from '@/lib/drugDiscovery/drugData';

interface LipinskiAnalysisProps {
  result: LipinskiResult;
  drugName: string;
}

export function LipinskiAnalysis({ result, drugName }: LipinskiAnalysisProps) {
  const passColor = result.passes ? 'text-green-400' : 'text-red-400';
  const passIcon = result.passes ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-primary" />
            Lipinski's Rule of Five
          </div>
          <Badge variant={result.passes ? 'default' : 'destructive'} className="text-xs">
            {result.violations} violation{result.violations !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className={`flex items-center gap-2 ${passColor}`}>
          {passIcon}
          <span className="font-medium">
            {result.passes ? 'Drug-like profile' : 'Poor drug-likeness'}
          </span>
        </div>

        <div className="space-y-2">
          <RuleItem
            label="Molecular Weight"
            value={result.rules.molecularWeight.value.toFixed(1)}
            unit="Da"
            limit={result.rules.molecularWeight.limit}
            passes={result.rules.molecularWeight.passes}
            progress={(result.rules.molecularWeight.value / 500) * 100}
          />
          <RuleItem
            label="LogP"
            value={result.rules.logP.value.toFixed(2)}
            limit={result.rules.logP.limit}
            passes={result.rules.logP.passes}
            progress={(result.rules.logP.value / 5) * 100}
          />
          <RuleItem
            label="H-Bond Donors"
            value={result.rules.hBondDonors.value.toString()}
            limit={result.rules.hBondDonors.limit}
            passes={result.rules.hBondDonors.passes}
            progress={(result.rules.hBondDonors.value / 5) * 100}
          />
          <RuleItem
            label="H-Bond Acceptors"
            value={result.rules.hBondAcceptors.value.toString()}
            limit={result.rules.hBondAcceptors.limit}
            passes={result.rules.hBondAcceptors.passes}
            progress={(result.rules.hBondAcceptors.value / 10) * 100}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {result.passes
            ? `${drugName} has favorable oral bioavailability characteristics.`
            : `${drugName} may have limited oral absorption due to ${result.violations} Lipinski violation(s).`}
        </p>
      </CardContent>
    </Card>
  );
}

function RuleItem({
  label,
  value,
  unit,
  limit,
  passes,
  progress,
}: {
  label: string;
  value: string;
  unit?: string;
  limit: string;
  passes: boolean;
  progress: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className={passes ? 'text-green-400' : 'text-red-400'}>
            {value}
            {unit && ` ${unit}`}
          </span>
          <span className="text-muted-foreground">({limit})</span>
          {passes ? (
            <Check className="w-3 h-3 text-green-400" />
          ) : (
            <X className="w-3 h-3 text-red-400" />
          )}
        </div>
      </div>
      <Progress 
        value={Math.min(progress, 100)} 
        className="h-1.5"
      />
    </div>
  );
}
