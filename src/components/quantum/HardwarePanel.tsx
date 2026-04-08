import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { useQuantumCloud, QuantumCloudBackend, QuantumJob } from '@/hooks/useQuantumCloud';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { BRANDING } from '@/config/branding';

interface HardwarePanelProps {
  globalBackend?: string;
}

export const HardwarePanel = ({ globalBackend }: HardwarePanelProps) => {
  const { gates, qubitCount, simulationResult, simulate } = useQuantumCircuitStore();
  const { user } = useAuth();
  const {
    currentJob,
    isSubmitting,
    submitJob,
    startPolling,
    stopPolling,
  } = useQuantumCloud();

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [shots, setShots] = useState(1024);

  // Start polling when job is submitted
  useEffect(() => {
    if (currentJob && ['queued', 'running', 'submitting'].includes(currentJob.status)) {
      startPolling(currentJob);
    }
    return () => stopPolling();
  }, [currentJob?.id, startPolling, stopPolling]);

  const handleRunClick = () => {
    if (!user) {
      toast.error(`Please sign in to run on ${BRANDING.hardwareServiceName}`);
      return;
    }
    if (gates.length === 0) {
      toast.error('Add gates to your circuit first');
      return;
    }
    if (!globalBackend || globalBackend === 'local') {
      toast.error('Select a hardware backend first (not Local Simulator)');
      return;
    }
    
    // Run local simulation first if not already done
    if (!simulationResult) {
      simulate();
    }
    
    setConfirmDialogOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setConfirmDialogOpen(false);
    
    const backendName = globalBackend && globalBackend !== 'local' 
      ? globalBackend 
      : undefined;
    console.log(`[HardwarePanel] Submitting with backend: ${backendName}`);
    const job = await submitJob(gates, qubitCount, simulationResult, backendName, shots);
    
    if (job) {
      startPolling(job);
    }
  };

  const getStatusIcon = () => {
    if (!currentJob) return null;
    switch (currentJob.status) {
      case 'submitting':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'queued':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'running':
        return <Zap className="w-4 h-4 animate-pulse text-primary" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusText = () => {
    if (!currentJob) return '';
    switch (currentJob.status) {
      case 'submitting':
        return 'Submitting...';
      case 'queued':
        return currentJob.queue_position 
          ? `Queued (#${currentJob.queue_position})`
          : 'Queued';
      case 'running':
        return 'Running';
      case 'completed':
        return 'Done';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  const isJobActive = currentJob && ['submitting', 'queued', 'running'].includes(currentJob.status);
  const isHardwareSelected = globalBackend && globalBackend !== 'local';

  return (
    <>
      {/* Run on Hardware Button - only show when a hardware backend is selected */}
      {isHardwareSelected && (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleRunClick}
            disabled={isSubmitting || !!isJobActive || gates.length === 0 || !user}
            size="default"
            className="relative overflow-hidden bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-primary-foreground shrink-0"
          >
            {isSubmitting || isJobActive ? (
              <>
                {getStatusIcon()}
                <span className="ml-1 text-xs">{getStatusText()}</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Run Hardware</span>
                <span className="sm:hidden">HW</span>
              </>
            )}
            
            {(isSubmitting || isJobActive) && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
          </Button>
        </motion.div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-accent" />
              Run on {BRANDING.hardwareServiceName}
            </DialogTitle>
            <DialogDescription>
              Submit your circuit to quantum hardware
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Qubits:</span>
                <span className="font-mono">{qubitCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gates:</span>
                <span className="font-mono">{gates.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shots:</span>
                <span className="font-mono">{shots}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Backend:</span>
                <span className="font-mono text-accent">{globalBackend}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/10 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
              <p>
                Jobs are queued and may take several minutes to complete. 
                Results will appear automatically when ready.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSubmit}
              className="bg-gradient-to-r from-accent to-primary"
            >
              <Zap className="w-4 h-4 mr-2" />
              Submit Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
