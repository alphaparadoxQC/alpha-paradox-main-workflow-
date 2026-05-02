import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Zap, Target, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { VQEResult } from '@/lib/chemistry/vqeOptimizer';
import { MoleculeData } from '@/lib/chemistry/moleculeData';

interface VQEResultsProps {
  result: VQEResult | null;
  molecule: MoleculeData;
  isRunning: boolean;
  currentIteration: number;
  maxIterations: number;
}

export function VQEResults({
  result,
  molecule,
  isRunning,
  currentIteration,
  maxIterations,
}: VQEResultsProps) {
  const accuracy = result 
    ? Math.max(0, (1 - result.energyError / Math.abs(molecule.expectedGroundStateEnergy)) * 100)
    : null;
  
  const isGoodAccuracy = accuracy !== null && accuracy > 95;
  const isAcceptableAccuracy = accuracy !== null && accuracy > 80;
  
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            VQE Results
          </div>
          {result && (() => {
            const suspicious =
              result.finalEnergy < molecule.expectedGroundStateEnergy - 0.5;
            if (suspicious) {
              return (
                <Badge variant="destructive" className="text-[10px]">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Warning: Check Parameters
                  </span>
                </Badge>
              );
            }
            return (
              <Badge
                variant={result.converged ? 'default' : 'secondary'}
                className={`text-[10px] ${!result.converged ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40 hover:bg-amber-500/30' : ''}`}
              >
                {result.converged ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Converged
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Max Iterations
                  </span>
                )}
              </Badge>
            );
          })()}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {isRunning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Optimizing...</span>
              <span>{currentIteration + 1} / {maxIterations}</span>
            </div>
            <Progress value={(currentIteration / maxIterations) * 100} className="h-2" />
          </motion.div>
        )}
        
        {result && !isRunning && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Final Energy */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                Computed Ground State Energy
              </div>
              <div className="text-xl font-mono font-bold text-primary">
                {result.finalEnergy.toFixed(6)} Ha
              </div>
            </div>
            
            {/* Comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded-lg bg-background/50">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Known Value
                </div>
                <div className="text-sm font-mono font-semibold text-foreground">
                  {molecule.expectedGroundStateEnergy.toFixed(6)} Ha
                </div>
              </div>
              <div className="p-2 rounded-lg bg-background/50">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Error
                </div>
                <div className={`text-sm font-mono font-semibold ${
                  result.energyError < 0.01 ? 'text-green-500' : 
                  result.energyError < 0.05 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  ±{result.energyError.toFixed(6)} Ha
                </div>
              </div>
            </div>
            
            {/* Accuracy Meter */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Accuracy
                </span>
                <span className={`text-xs font-semibold ${
                  isGoodAccuracy ? 'text-green-500' : 
                  isAcceptableAccuracy ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {accuracy?.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={accuracy ?? 0} 
                className={`h-2 ${
                  isGoodAccuracy ? '[&>div]:bg-green-500' : 
                  isAcceptableAccuracy ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'
                }`} 
              />
            </div>
            
            {/* Statistics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between p-2 bg-background/30 rounded">
                <span className="text-muted-foreground">Iterations</span>
                <span className="font-mono">{result.totalIterations}</span>
              </div>
              <div className="flex justify-between p-2 bg-background/30 rounded">
                <span className="text-muted-foreground">Parameters</span>
                <span className="font-mono">{result.finalParameters.length}</span>
              </div>
            </div>
            
            {/* Accuracy Warning */}
            {!isAcceptableAccuracy && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-[10px] text-destructive">
                  Low accuracy. Try adjusting initial parameters or increasing iterations.
                </p>
              </div>
            )}
          </motion.div>
        )}
        
        {!result && !isRunning && (
          <div className="text-center text-muted-foreground text-sm py-4">
            Run optimization to compute ground state energy
          </div>
        )}
      </CardContent>
    </Card>
  );
}
