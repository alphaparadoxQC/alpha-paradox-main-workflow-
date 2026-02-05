import { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceDot, Area, ComposedChart 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { MoleculeData } from '@/lib/chemistry/moleculeData';

interface PotentialEnergySurfaceProps {
  molecule: MoleculeData;
  currentEnergy: number | null;
}

// Morse potential parameters for different molecules
const MORSE_PARAMS: Record<string, { De: number; a: number; re: number }> = {
  h2: { De: 0.1745, a: 1.94, re: 0.74 },
  lih: { De: 0.092, a: 1.05, re: 1.60 },
  h2o: { De: 0.185, a: 2.29, re: 0.96 },
  beh2: { De: 0.135, a: 1.52, re: 1.33 },
  nh3: { De: 0.165, a: 2.12, re: 1.01 },
};

export function PotentialEnergySurface({ molecule, currentEnergy }: PotentialEnergySurfaceProps) {
  // Generate potential energy curve using Morse potential
  const curveData = useMemo(() => {
    const params = MORSE_PARAMS[molecule.id] || MORSE_PARAMS.h2;
    const { De, a, re } = params;
    const baseEnergy = molecule.expectedGroundStateEnergy;
    
    const points = [];
    for (let r = 0.4; r <= 4.0; r += 0.05) {
      // Morse potential: V(r) = De * (1 - e^(-a(r-re)))^2
      const x = r - re;
      const morse = De * Math.pow(1 - Math.exp(-a * x), 2);
      const energy = baseEnergy + morse;
      
      points.push({
        bondLength: r,
        energy: energy,
        // Highlight equilibrium region
        isEquilibrium: Math.abs(r - re) < 0.1,
      });
    }
    
    return points;
  }, [molecule]);
  
  const equilibriumPoint = useMemo(() => {
    const params = MORSE_PARAMS[molecule.id] || MORSE_PARAMS.h2;
    return {
      bondLength: params.re,
      energy: molecule.expectedGroundStateEnergy,
    };
  }, [molecule]);
  
  const yDomain = useMemo(() => {
    const energies = curveData.map(d => d.energy);
    const min = Math.min(...energies);
    const max = Math.min(Math.max(...energies), min + 0.5); // Cap at dissociation
    return [min - 0.02, max];
  }, [curveData]);
  
  const primaryBond = molecule.bonds[0];
  const bondLabel = primaryBond 
    ? `${molecule.atoms[primaryBond.atom1Index].symbol}-${molecule.atoms[primaryBond.atom2Index].symbol}`
    : 'Bond';

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Potential Energy Surface
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {bondLabel} stretch
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={curveData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="bondLength"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                label={{ 
                  value: 'Bond Length (Å)', 
                  position: 'insideBottom', 
                  offset: -5, 
                  fontSize: 10, 
                  fill: 'hsl(var(--muted-foreground))' 
                }}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <YAxis
                domain={yDomain}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(v) => v.toFixed(2)}
                label={{ 
                  value: 'E (Ha)', 
                  angle: -90, 
                  position: 'insideLeft',
                  fontSize: 10,
                  fill: 'hsl(var(--muted-foreground))'
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => [
                  `${value.toFixed(4)} Ha`,
                  'Energy'
                ]}
                labelFormatter={(label) => `r = ${Number(label).toFixed(2)} Å`}
              />
              <Area
                type="monotone"
                dataKey="energy"
                stroke="none"
                fill="url(#energyGradient)"
              />
              <Line
                type="monotone"
                dataKey="energy"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
              {/* Equilibrium point */}
              <ReferenceDot
                x={equilibriumPoint.bondLength}
                y={equilibriumPoint.energy}
                r={6}
                fill="hsl(var(--accent))"
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
              {/* Current VQE result */}
              {currentEnergy !== null && (
                <ReferenceDot
                  x={equilibriumPoint.bondLength}
                  y={currentEnergy}
                  r={5}
                  fill="hsl(var(--primary))"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-4 mt-2 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-muted-foreground">Equilibrium</span>
          </div>
          {currentEnergy !== null && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">VQE Result</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-primary" />
            <span className="text-muted-foreground">Morse Potential</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
