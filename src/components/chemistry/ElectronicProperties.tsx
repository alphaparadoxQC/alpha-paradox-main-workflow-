import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';

interface ElectronicPropertiesProps {
  /** HOMO eV (negative number) */
  homo?: number;
  /** LUMO eV */
  lumo?: number;
}

const DEFAULT_HOMO = -15.4;
const DEFAULT_LUMO = 4.8;

export function ElectronicProperties({ homo = DEFAULT_HOMO, lumo = DEFAULT_LUMO }: ElectronicPropertiesProps) {
  const gap = lumo - homo;
  const reactivity =
    gap > 6 ? { label: 'Low', desc: 'Stable — gap > 6 eV' }
    : gap >= 3 ? { label: 'Medium', desc: 'Moderate — 3–6 eV' }
    : { label: 'High', desc: 'Reactive — gap < 3 eV' };

  // Layout constants for SVG
  const W = 320, H = 180;
  const homoY = 130, lumoY = 50; // visual positions
  const lineX1 = 70, lineX2 = 220;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Electronic Properties
          </span>
          <Badge variant="secondary" className="text-[10px]">{reactivity.label} Reactivity</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {/* LUMO */}
          <line x1={lineX1} y1={lumoY} x2={lineX2} y2={lumoY} stroke="hsl(var(--accent))" strokeWidth={3} />
          <text x={lineX2 + 8} y={lumoY + 4} fontSize="11" fill="hsl(var(--foreground))">
            LUMO {lumo.toFixed(2)} eV
          </text>

          {/* HOMO */}
          <line x1={lineX1} y1={homoY} x2={lineX2} y2={homoY} stroke="hsl(var(--primary))" strokeWidth={3} />
          <text x={lineX2 + 8} y={homoY + 4} fontSize="11" fill="hsl(var(--foreground))">
            HOMO {homo.toFixed(2)} eV
          </text>

          {/* Two electron arrows on HOMO */}
          <g stroke="hsl(var(--primary))" strokeWidth={1.5} fill="hsl(var(--primary))">
            <line x1={lineX1 + 30} y1={homoY - 12} x2={lineX1 + 30} y2={homoY + 8} />
            <polygon points={`${lineX1 + 27},${homoY - 8} ${lineX1 + 33},${homoY - 8} ${lineX1 + 30},${homoY - 14}`} />
            <line x1={lineX1 + 50} y1={homoY - 8} x2={lineX1 + 50} y2={homoY + 12} />
            <polygon points={`${lineX1 + 47},${homoY + 8} ${lineX1 + 53},${homoY + 8} ${lineX1 + 50},${homoY + 14}`} />
          </g>

          {/* Gap arrow */}
          <line x1={lineX1 - 25} y1={lumoY} x2={lineX1 - 25} y2={homoY} stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} />
          <polygon points={`${lineX1 - 28},${lumoY + 6} ${lineX1 - 22},${lumoY + 6} ${lineX1 - 25},${lumoY}`} fill="hsl(var(--muted-foreground))" />
          <polygon points={`${lineX1 - 28},${homoY - 6} ${lineX1 - 22},${homoY - 6} ${lineX1 - 25},${homoY}`} fill="hsl(var(--muted-foreground))" />
          <text x={lineX1 - 60} y={(lumoY + homoY) / 2 + 4} fontSize="11" fill="hsl(var(--muted-foreground))">
            Δ {gap.toFixed(2)} eV
          </text>
        </svg>

        <p className="text-[10px] text-muted-foreground text-center">{reactivity.desc}</p>
      </CardContent>
    </Card>
  );
}
