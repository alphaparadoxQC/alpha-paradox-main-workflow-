import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, Target } from 'lucide-react';
import { VQEIteration } from '@/lib/chemistry/vqeOptimizer';

interface VQEProgressChartProps {
  iterations: VQEIteration[];
  targetEnergy: number;
  currentEnergy: number | null;
  moleculeName: string;
}

export function VQEProgressChart({
  iterations,
  targetEnergy,
  currentEnergy,
  moleculeName,
}: VQEProgressChartProps) {
  const chartData = useMemo(() => 
    iterations.map(it => ({
      iteration: it.iteration + 1,
      energy: it.energy,
    })),
    [iterations]
  );
  
  const minEnergy = useMemo(() => 
    iterations.length > 0 
      ? Math.min(...iterations.map(it => it.energy))
      : null,
    [iterations]
  );
  
  const yDomain = useMemo(() => {
    if (chartData.length === 0) {
      return [targetEnergy - 0.5, targetEnergy + 0.5];
    }
    const energies = chartData.map(d => d.energy);
    const min = Math.min(...energies, targetEnergy);
    const max = Math.max(...energies, targetEnergy);
    const padding = (max - min) * 0.1 || 0.2;
    return [min - padding, max + padding];
  }, [chartData, targetEnergy]);
  
  const accuracy = useMemo(() => {
    if (minEnergy === null) return null;
    const error = Math.abs(minEnergy - targetEnergy);
    return error < 0.001 ? 99.9 : Math.max(0, (1 - error / Math.abs(targetEnergy)) * 100);
  }, [minEnergy, targetEnergy]);
  
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-primary" />
            Optimization Progress
          </div>
          <div className="flex gap-2">
            {iterations.length > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {iterations.length} iterations
              </Badge>
            )}
            {accuracy !== null && (
              <Badge 
                variant={accuracy > 95 ? "default" : "secondary"} 
                className="text-[10px]"
              >
                {accuracy.toFixed(1)}% accurate
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-48">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Run optimization to see progress
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="iteration" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  label={{ value: 'Iteration', position: 'insideBottom', offset: -5, fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  domain={yDomain}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(v) => v.toFixed(2)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(4)} Ha`, 'Energy']}
                  labelFormatter={(label) => `Iteration ${label}`}
                />
                <ReferenceLine 
                  y={targetEnergy} 
                  stroke="hsl(var(--accent))"
                  strokeDasharray="5 5"
                  label={{ 
                    value: `Target: ${targetEnergy.toFixed(3)} Ha`,
                    position: 'right',
                    fontSize: 9,
                    fill: 'hsl(var(--accent))'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="energy"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Energy Display */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="p-2 rounded-lg bg-background/50">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3 h-3" />
              Target Energy (FCI)
            </div>
            <div className="text-sm font-mono font-semibold text-accent">
              {targetEnergy.toFixed(6)} Ha
            </div>
          </div>
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Current Energy
            </div>
            <div className="text-sm font-mono font-semibold text-primary">
              {currentEnergy !== null ? `${currentEnergy.toFixed(6)} Ha` : '—'}
            </div>
          </div>
        </div>
        {currentEnergy !== null && (
          <div className="mt-2 p-2 rounded-lg bg-background/30 border border-border">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                ΔE (Current − Target)
              </span>
              <span className={`text-xs font-mono font-bold ${
                Math.abs(currentEnergy - targetEnergy) < 0.01 ? 'text-green-500' :
                Math.abs(currentEnergy - targetEnergy) < 0.05 ? 'text-yellow-500' :
                'text-red-400'
              }`}>
                {(currentEnergy - targetEnergy) >= 0 ? '+' : ''}{((currentEnergy - targetEnergy) * 1000).toFixed(2)} mHa
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
