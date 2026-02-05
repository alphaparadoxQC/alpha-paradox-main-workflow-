import { Activity, Droplets, Flame, Trash2, AlertOctagon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { ADMETProfile } from '@/lib/drugDiscovery/drugData';

interface ADMETPanelProps {
  profile: ADMETProfile;
}

const ADMET_ICONS = {
  absorption: Droplets,
  distribution: Activity,
  metabolism: Flame,
  excretion: Trash2,
  toxicity: AlertOctagon,
};

const ADMET_COLORS: Record<string, string> = {
  absorption: 'text-blue-400',
  distribution: 'text-purple-400',
  metabolism: 'text-orange-400',
  excretion: 'text-green-400',
  toxicity: 'text-red-400',
};

export function ADMETPanel({ profile }: ADMETPanelProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getOverallLabel = (score: number) => {
    if (score >= 75) return { label: 'Excellent', variant: 'default' as const };
    if (score >= 60) return { label: 'Good', variant: 'secondary' as const };
    if (score >= 40) return { label: 'Moderate', variant: 'outline' as const };
    return { label: 'Poor', variant: 'destructive' as const };
  };

  const overall = getOverallLabel(profile.overallScore);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            ADMET Profile
          </div>
          <Badge variant={overall.variant} className="text-xs">
            {overall.label} ({profile.overallScore.toFixed(0)}%)
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {(['absorption', 'distribution', 'metabolism', 'excretion', 'toxicity'] as const).map((key) => {
          const data = profile[key];
          const Icon = ADMET_ICONS[key];
          const colorClass = ADMET_COLORS[key];

          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
                  <span className="text-xs font-medium capitalize">{key}</span>
                </div>
                <span className={`text-xs font-medium ${
                  data.score >= 70 ? 'text-green-400' : 
                  data.score >= 40 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {data.label}
                </span>
              </div>
              <Progress 
                value={data.score} 
                className="h-1.5"
              />
              <p className="text-[10px] text-muted-foreground">{data.description}</p>
            </div>
          );
        })}

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            ADMET predictions are based on molecular descriptors and may require experimental validation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
