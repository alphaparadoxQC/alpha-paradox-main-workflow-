import { motion } from 'framer-motion';
import { Play, Square, RotateCcw, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoleculeData } from '@/lib/chemistry/moleculeData';
import { getParameterLabels } from '@/lib/chemistry/vqeOptimizer';

interface VQEControlsProps {
  molecule: MoleculeData;
  parameters: number[];
  isRunning: boolean;
  onParameterChange: (index: number, value: number) => void;
  onRunOptimization: () => void;
  onStopOptimization: () => void;
  onResetParameters: () => void;
}

export function VQEControls({
  molecule,
  parameters,
  isRunning,
  onParameterChange,
  onRunOptimization,
  onStopOptimization,
  onResetParameters,
}: VQEControlsProps) {
  const labels = getParameterLabels(molecule);
  const shouldCompactDuringRun = isRunning && parameters.length > 80;
  
  // Group parameters by layer
  const qubits = molecule.qubitsRequired;
  const depth = molecule.vqeDepth;
  
  const layers: { label: string; params: { index: number; label: string; value: number }[] }[] = [];
  let paramIndex = 0;
  
  for (let layer = 0; layer < depth; layer++) {
    const layerParams: { index: number; label: string; value: number }[] = [];
    
    // Ry parameters
    for (let q = 0; q < qubits; q++) {
      layerParams.push({
        index: paramIndex,
        label: `θ${paramIndex + 1} (Q${q})`,
        value: parameters[paramIndex] ?? 0,
      });
      paramIndex++;
    }
    
    // Rz parameters
    for (let q = 0; q < qubits; q++) {
      layerParams.push({
        index: paramIndex,
        label: `φ${paramIndex + 1} (Q${q})`,
        value: parameters[paramIndex] ?? 0,
      });
      paramIndex++;
    }
    
    layers.push({
      label: `Layer ${layer + 1}`,
      params: layerParams,
    });
  }
  
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" />
            VQE Parameters
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {parameters.length} params
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Control Buttons */}
        <div className="flex gap-2">
          {isRunning ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={onStopOptimization}
              className="flex-1"
            >
              <Square className="w-3 h-3 mr-1" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onRunOptimization}
              className="flex-1 bg-gradient-to-r from-primary to-accent"
            >
              <Play className="w-3 h-3 mr-1" />
              Optimize
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onResetParameters}
            disabled={isRunning}
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
        
        {/* Parameter Sliders */}
        <ScrollArea className="h-48">
          <div className="space-y-4 pr-4">
            {shouldCompactDuringRun ? (
              <div className="rounded-lg border border-border bg-background/30 p-3 text-xs text-muted-foreground">
                Live parameter sliders are paused during heavy optimization to keep UI responsive.
                Optimization still runs with full parameter updates in the solver.
              </div>
            ) : (
              layers.map((layer, layerIdx) => (
                <div key={layerIdx} className="space-y-2">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {layer.label}
                  </div>
                  {layer.params.map((param) => (
                    <div key={param.index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {param.label}
                        </span>
                        <span className="text-[10px] text-foreground font-mono">
                          {param.value.toFixed(3)}
                        </span>
                      </div>
                      <Slider
                        value={[param.value]}
                        onValueChange={([v]) => onParameterChange(param.index, v)}
                        min={-Math.PI}
                        max={Math.PI}
                        step={0.01}
                        disabled={isRunning}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
