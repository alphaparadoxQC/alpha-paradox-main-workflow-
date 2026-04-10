import { useState } from 'react';
import { Cpu, Zap, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuantumCloud } from '@/hooks/useQuantumCloud';
import { useAuth } from '@/hooks/useAuth';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { QuantumGate, SimulationResult } from '@/types/quantum';
import { toast } from 'sonner';

interface RunOnHardwareButtonProps {
  /** Current VQE circuit gates */
  gates: QuantumGate[];
  /** Number of qubits in the circuit */
  qubitCount: number;
  /** Local simulation results to compare against */
  localResults: SimulationResult | null;
  /** Label for the context (e.g. "VQE Circuit", "Docking Circuit") */
  contextLabel?: string;
  /** Whether the circuit is ready to run */
  disabled?: boolean;
}

export function RunOnHardwareButton({
  gates,
  qubitCount,
  localResults,
  contextLabel = 'Circuit',
  disabled = false,
}: RunOnHardwareButtonProps) {
  const { user } = useAuth();
  const { submitJob, isSubmitting, currentJob, startPolling } = useQuantumCloud();
  const [submitted, setSubmitted] = useState(false);

  const handleRunOnHardware = async () => {
    if (!user) {
      toast.error('Please sign in to run on quantum hardware');
      return;
    }
    if (gates.length === 0) {
      toast.error('No circuit to submit — run VQE optimization first');
      return;
    }

    const job = await submitJob(gates, qubitCount, localResults, 'open-quantum', 1024);
    if (job) {
      setSubmitted(true);
      startPolling(job);
    }
  };

  const isRunning = currentJob && ['queued', 'running', 'submitting'].includes(currentJob.status);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary" />
          Run on Quantum Hardware
          <Badge variant="outline" className="text-[10px] ml-auto">
            Open Quantum
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <p className="text-[10px] text-muted-foreground">
          Submit your {contextLabel} to real quantum hardware (IonQ, Rigetti, IQM) 
          via Open Quantum for hardware-accurate results.
        </p>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Zap className="w-3 h-3" />
          <span>{gates.length} gates • {qubitCount} qubits • 1024 shots</span>
        </div>

        {isRunning && currentJob && (
          <div className="p-2 rounded bg-primary/5 border border-primary/10 text-[10px]">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              <span className="text-foreground font-medium">
                {currentJob.status === 'queued' ? 'In queue' : 'Running'} on {currentJob.backend}
              </span>
            </div>
            <span className="text-muted-foreground">
              Job: {currentJob.job_id.slice(0, 8)}…
            </span>
          </div>
        )}

        {currentJob?.status === 'completed' && (
          <div className="p-2 rounded bg-accent/10 border border-accent/20 text-[10px]">
            <span className="text-accent font-medium">✓ Hardware results available</span>
            <a href="/jobs" className="flex items-center gap-1 text-primary hover:underline mt-1">
              View results <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <Button
          onClick={handleRunOnHardware}
          disabled={disabled || isSubmitting || isRunning || gates.length === 0}
          size="sm"
          className="w-full"
          variant={submitted ? 'outline' : 'default'}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting…
            </>
          ) : isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running on Hardware…
            </>
          ) : (
            <>
              <Cpu className="w-4 h-4 mr-2" />
              Run on QPU
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
