import { motion } from 'framer-motion';
import { 
  Cpu, 
  Monitor, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { QuantumJob } from '@/hooks/useIBMQuantum';
import { SimulationResult } from '@/types/quantum';

interface HardwareResultsProps {
  job: QuantumJob;
}

export const HardwareResults = ({ job }: HardwareResultsProps) => {
  const localResults = job.local_results?.probabilities || [];
  const hardwareResults = job.hardware_results || [];

  // Merge results for comparison
  const allStates = new Set([
    ...localResults.map(r => r.state),
    ...hardwareResults.map(r => r.state),
  ]);

  const comparisonData = Array.from(allStates).map(state => {
    const local = localResults.find(r => r.state === state)?.probability || 0;
    const hardware = hardwareResults.find(r => r.state === state)?.probability || 0;
    const diff = hardware - local;
    
    return { state, local, hardware, diff };
  }).sort((a, b) => b.hardware - a.hardware);

  const getTrendIcon = (diff: number) => {
    if (Math.abs(diff) < 0.01) {
      return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
    if (diff > 0) {
      return <TrendingUp className="w-3 h-3 text-green-500" />;
    }
    return <TrendingDown className="w-3 h-3 text-red-500" />;
  };

  const getDiffColor = (diff: number) => {
    if (Math.abs(diff) < 0.01) return 'text-muted-foreground';
    if (diff > 0) return 'text-green-500';
    return 'text-red-500';
  };

  // Calculate fidelity (simple overlap measure)
  const fidelity = comparisonData.reduce((sum, item) => {
    return sum + Math.sqrt(item.local * item.hardware);
  }, 0) * 100;

  if (job.status !== 'completed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg p-4 border border-accent/30"
      >
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-5 h-5 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">IBM Quantum Job</h3>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Backend:</span>
            <span className="font-mono">{job.backend}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className="flex items-center gap-2">
              {job.status === 'queued' && (
                <>
                  <Clock className="w-3 h-3 text-yellow-500" />
                  <span className="text-yellow-500">
                    Queued{job.queue_position ? ` (#${job.queue_position})` : ''}
                  </span>
                </>
              )}
              {job.status === 'running' && (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Cpu className="w-3 h-3 text-primary" />
                  </motion.div>
                  <span className="text-primary">Running</span>
                </>
              )}
              {job.status === 'failed' && (
                <>
                  <AlertCircle className="w-3 h-3 text-red-500" />
                  <span className="text-red-500">Failed</span>
                </>
              )}
            </span>
          </div>
          {job.error_message && (
            <div className="mt-2 p-2 bg-red-500/10 rounded text-xs text-red-500">
              {job.error_message}
            </div>
          )}
        </div>
        
        {/* Progress animation */}
        {['queued', 'running'].includes(job.status) && (
          <div className="mt-4">
            <motion.div
              className="h-1 bg-muted rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-accent to-primary"
                animate={{ 
                  x: ['-100%', '100%'],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                style={{ width: '50%' }}
              />
            </motion.div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Polling for results every 5 seconds...
            </p>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg p-4 border border-green-500/30"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <h3 className="text-sm font-semibold text-foreground">Hardware Results</h3>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{job.backend}</span>
      </div>

      {/* Fidelity Metric */}
      <div className="bg-muted rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Fidelity (vs. simulation)</span>
          <span className={`text-lg font-bold ${fidelity > 90 ? 'text-green-500' : fidelity > 70 ? 'text-yellow-500' : 'text-red-500'}`}>
            {fidelity.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 bg-background rounded-full mt-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${fidelity}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full rounded-full ${fidelity > 90 ? 'bg-green-500' : fidelity > 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
          />
        </div>
      </div>

      {/* Comparison Header */}
      <div className="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground mb-2 px-2">
        <span>State</span>
        <span className="flex items-center gap-1">
          <Monitor className="w-3 h-3" /> Local
        </span>
        <span className="flex items-center gap-1">
          <Cpu className="w-3 h-3" /> Hardware
        </span>
        <span>Diff</span>
      </div>

      {/* Comparison Rows */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {comparisonData.slice(0, 8).map((item, index) => (
          <motion.div
            key={item.state}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="grid grid-cols-4 gap-2 text-xs bg-muted/50 rounded p-2 items-center"
          >
            <span className="font-mono text-foreground">{item.state}</span>
            
            {/* Local bar */}
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${item.local * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground w-10 text-right">
                {(item.local * 100).toFixed(1)}%
              </span>
            </div>
            
            {/* Hardware bar */}
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${item.hardware * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground w-10 text-right">
                {(item.hardware * 100).toFixed(1)}%
              </span>
            </div>
            
            {/* Difference */}
            <div className={`flex items-center gap-1 ${getDiffColor(item.diff)}`}>
              {getTrendIcon(item.diff)}
              <span className="text-[10px]">
                {item.diff >= 0 ? '+' : ''}{(item.diff * 100).toFixed(1)}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Job Metadata */}
      <div className="mt-4 pt-3 border-t border-border text-[10px] text-muted-foreground space-y-1">
        <div className="flex justify-between">
          <span>Shots:</span>
          <span className="font-mono">{job.shots}</span>
        </div>
        <div className="flex justify-between">
          <span>Completed:</span>
          <span>{job.completed_at ? new Date(job.completed_at).toLocaleString() : '-'}</span>
        </div>
      </div>
    </motion.div>
  );
};
