import { Target, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProteinTarget } from '@/lib/drugDiscovery/drugData';

interface TargetSelectorProps {
  targets: ProteinTarget[];
  selectedTarget: ProteinTarget;
  onSelectTarget: (targetId: string) => void;
  disabled?: boolean;
}

export function TargetSelector({
  targets,
  selectedTarget,
  onSelectTarget,
  disabled,
}: TargetSelectorProps) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Protein Target
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <Select value={selectedTarget.id} onValueChange={onSelectTarget} disabled={disabled}>
          <SelectTrigger className="w-full bg-background/50">
            <SelectValue placeholder="Select a target" />
          </SelectTrigger>
          <SelectContent>
            {targets.map((target) => (
              <SelectItem key={target.id} value={target.id}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{target.name}</span>
                  <span className="text-muted-foreground text-xs">({target.pdbId})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Disease Area</span>
            <Badge variant="outline" className="text-[10px]">
              {selectedTarget.diseaseArea}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Organism</span>
            <span className="font-mono text-foreground">{selectedTarget.organism}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">PDB ID</span>
            <a
              href={`https://www.rcsb.org/structure/${selectedTarget.pdbId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              {selectedTarget.pdbId}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{selectedTarget.description}</p>

        <div className="pt-2 border-t border-border">
          <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Binding Site Residues
          </h4>
          <div className="flex flex-wrap gap-1">
            {selectedTarget.bindingSite.residues.map((residue, i) => (
              <span
                key={i}
                className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded"
              >
                {residue}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
