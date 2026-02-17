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
import { useQuantumCloud, QuantumCloudBackend, QuantumJob } from '@/hooks/useQuantumCloud';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { BRANDING } from '@/config/branding';
import { BackendType } from './BackendSelector';
import { supabase } from '@/integrations/supabase/client';

interface HardwarePanelProps {
  selectedBackendType?: BackendType;
}

export const HardwarePanel = ({ selectedBackendType = 'local' }: HardwarePanelProps) => {
  const { gates, qubitCount, simulationResult, simulate } = useQuantumCircuitStore();
  const { user, session } = useAuth();
  const {
    backends,
    isLoadingBackends,
    fetchBackends,
    currentJob,
    setCurrentJob,
    isSubmitting,
    submitJob,
    startPolling,
    stopPolling,
  } = useQuantumCloud();

  const [selectedBackend, setSelectedBackend] = useState<string>('auto');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [shots, setShots] = useState(1024);
  const [isSubmittingAws, setIsSubmittingAws] = useState(false);

  const isAwsBackend = selectedBackendType?.startsWith('aws-braket');

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
      toast.error(`Please sign in to run on ${BRANDING.hardwareServiceName}`);
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
    
    if (isAwsBackend) {
      await submitAwsBraketJob();
    } else {
      const backendName = selectedBackend === 'auto' ? undefined : selectedBackend;
      const job = await submitJob(gates, qubitCount, simulationResult, backendName, shots);
      if (job) {
        startPolling(job);
      }
    }
  };

  const getDeviceArn = (): string | undefined => {
    const deviceMap: Record<string, string> = {
      'aws-braket-sv1': 'arn:aws:braket:::device/quantum-simulator/amazon/sv1',
      'aws-braket-rigetti': 'arn:aws:braket:us-west-1::device/qpu/rigetti/Aspen-M-3',
      'aws-braket-ionq': 'arn:aws:braket:us-east-1::device/qpu/ionq/Aria-1',
    };
    return selectedBackendType ? deviceMap[selectedBackendType] : undefined;
  };

  const submitAwsBraketJob = async () => {
    if (!session?.access_token || !user) {
      toast.error('Please sign in to run on AWS Braket');
      return;
    }

    setIsSubmittingAws(true);
    try {
      const { data, error } = await supabase.functions.invoke('amazon-braket', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { gates, qubitCount, shots, deviceArn: getDeviceArn() },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Submission failed');

      // Save job to database
      const { data: jobData, error: dbError } = await supabase
        .from('quantum_jobs')
        .insert({
          user_id: user.id,
          job_id: data.taskArn,
          backend: data.device,
          status: 'queued',
          qubit_count: qubitCount,
          shots,
          qasm: data.qasm,
          local_results: simulationResult as any,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const job: QuantumJob = {
        id: jobData.id,
        user_id: jobData.user_id,
        job_id: jobData.job_id,
        backend: jobData.backend,
        status: 'queued',
        qubit_count: jobData.qubit_count,
        shots: jobData.shots,
        qasm: jobData.qasm,
        local_results: simulationResult || undefined,
        submitted_at: jobData.submitted_at,
      };

      setCurrentJob(job);
      toast.success(`Job submitted to AWS Braket`, {
        description: `Task: ${data.taskArn.split('/').pop()?.slice(0, 8)}...`,
      });
    } catch (err) {
      console.error('Failed to submit AWS Braket job:', err);
      toast.error('Failed to submit to AWS Braket', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsSubmittingAws(false);
    }
  };

  const getSelectedBackendInfo = (): QuantumCloudBackend | null => {
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
              <span>{BRANDING.hardwareServiceName} Backends</span>
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
                      <span className="w-2 h-2 rounded-full bg-accent" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-destructive" />
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
                      <span className="text-secondary">Simulator</span>
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
            disabled={isSubmitting || isSubmittingAws || isJobActive || gates.length === 0 || !user}
            className="relative overflow-hidden bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-primary-foreground"
          >
            {isSubmitting || isSubmittingAws || isJobActive ? (
              <>
                {getStatusIcon()}
                <span className="ml-2 text-xs">{getStatusText()}</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4 mr-2" />
                Run on Cloud
              </>
            )}
            
            {(isSubmitting || isSubmittingAws || isJobActive) && (
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
              Run on {BRANDING.hardwareServiceName}
            </DialogTitle>
            <DialogDescription>
              Submit your circuit to quantum hardware
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
                <span className="font-medium text-secondary">{estimatedWaitTime()}</span>
              </div>
            </div>

            {/* Warning */}
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
