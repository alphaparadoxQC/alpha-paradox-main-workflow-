import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  ChevronDown, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import { useIBMQuantum, IBMBackend, QuantumJob } from '@/hooks/useIBMQuantum';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const HardwarePanel = () => {
  const { gates, qubitCount, simulationResult, simulate } = useQuantumCircuitStore();
  const { user } = useAuth();
  const {
    backends,
    isLoadingBackends,
    fetchBackends,
    currentJob,
    isSubmitting,
    submitJob,
    startPolling,
    stopPolling,
  } = useIBMQuantum();

  const [selectedBackend, setSelectedBackend] = useState<string>('auto');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [shots, setShots] = useState(1024);

  // Fetch backends on mount
  useEffect(() => {
    if (user) {
      fetchBackends();
    }
  }, [user, fetchBackends]);

  // Start polling when job is submitted
  useEffect(() => {
    if (currentJob && ['queued', 'running', 'submitting'].includes(currentJob.status)) {
      startPolling(currentJob);
    }
    return () => stopPolling();
  }, [currentJob?.id, startPolling, stopPolling]);

  const handleRunClick = () => {
    if (!user) {
      toast.error('Please sign in to run on IBM Quantum');
      return;
    }
    if (gates.length === 0) {
      toast.error('Add gates to your circuit first');
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
    
    const backendName = selectedBackend === 'auto' ? undefined : selectedBackend;
    const job = await submitJob(gates, qubitCount, simulationResult, backendName, shots);
    
    if (job) {
      startPolling(job);
    }
  };

  const getSelectedBackendInfo = (): IBMBackend | null => {
    if (selectedBackend === 'auto') {
      const online = backends.filter(b => b.status === 'online');
      return online.sort((a, b) => a.pendingJobs - b.pendingJobs)[0] || null;
    }
    return backends.find(b => b.name === selectedBackend) || null;
  };

  const estimatedWaitTime = () => {
    const backend = getSelectedBackendInfo();
    if (!backend) return 'Unknown';
    const minutes = Math.max(1, Math.ceil(backend.pendingJobs * 0.5));
    if (minutes < 60) return `~${minutes} min`;
    return `~${Math.ceil(minutes / 60)} hr`;
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
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (!currentJob) return '';
    switch (currentJob.status) {
      case 'submitting':
        return 'Submitting...';
      case 'queued':
        return currentJob.queue_position 
          ? `Queued (Position ${currentJob.queue_position})`
          : 'Queued';
      case 'running':
        return 'Running on hardware';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  const isJobActive = currentJob && ['submitting', 'queued', 'running'].includes(currentJob.status);

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Backend Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="border-accent/30 hover:border-accent/50 min-w-[140px]"
              disabled={isLoadingBackends || isJobActive}
            >
              {isLoadingBackends ? (
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              ) : (
                <Cpu className="w-3 h-3 mr-2 text-accent" />
              )}
              <span className="truncate text-xs">
                {selectedBackend === 'auto' ? 'Auto (Least Busy)' : selectedBackend}
              </span>
              <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="text-xs flex items-center justify-between">
              <span>IBM Quantum Backends</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={(e) => {
                  e.preventDefault();
                  fetchBackends();
                }}
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingBackends ? 'animate-spin' : ''}`} />
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={() => setSelectedBackend('auto')}
              className="flex items-center justify-between"
            >
              <span>Auto (Least Busy)</span>
              {selectedBackend === 'auto' && (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              )}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {backends.length === 0 && !isLoadingBackends && (
              <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                No backends available
              </div>
            )}
            
            {backends.map((backend) => (
              <DropdownMenuItem
                key={backend.name}
                onClick={() => setSelectedBackend(backend.name)}
                className="flex flex-col items-start py-2"
                disabled={backend.status !== 'online' || backend.numQubits < qubitCount}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium text-xs">{backend.name}</span>
                  <div className="flex items-center gap-2">
                    {backend.status === 'online' ? (
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                    )}
                    {selectedBackend === backend.name && (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                  <span>{backend.numQubits} qubits</span>
                  <span>•</span>
                  <span>{backend.pendingJobs} jobs queued</span>
                  {backend.isSimulator && (
                    <>
                      <span>•</span>
                      <span className="text-yellow-500">Simulator</span>
                    </>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Run Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleRunClick}
            disabled={isSubmitting || isJobActive || gates.length === 0 || !user}
            className="relative overflow-hidden bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-primary-foreground"
          >
            {isSubmitting || isJobActive ? (
              <>
                {getStatusIcon()}
                <span className="ml-2 text-xs">{getStatusText()}</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4 mr-2" />
                Run on IBM
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
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-accent" />
              Run on IBM Quantum
            </DialogTitle>
            <DialogDescription>
              Submit your circuit to a real quantum computer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Circuit Info */}
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
            </div>

            {/* Backend Info */}
            <div className="bg-card rounded-lg p-3 border border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Backend:</span>
                <span className="font-medium">
                  {selectedBackend === 'auto' 
                    ? getSelectedBackendInfo()?.name || 'Selecting...'
                    : selectedBackend}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Est. Wait Time:</span>
                <span className="font-medium text-yellow-500">{estimatedWaitTime()}</span>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-yellow-500/10 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
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
