import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QuantumGate, SimulationResult } from '@/types/quantum';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { BRANDING } from '@/config/branding';

export interface QuantumCloudBackend {
  name: string;
  numQubits: number;
  status: 'online' | 'offline' | 'maintenance';
  isSimulator: boolean;
  pendingJobs: number;
  maxShots: number;
}

export interface QuantumJob {
  id: string;
  user_id: string;
  job_id: string;
  backend: string;
  status: 'submitting' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  qubit_count: number;
  shots: number;
  qasm?: string;
  local_results?: SimulationResult;
  hardware_results?: { state: string; probability: number }[];
  queue_position?: number;
  submitted_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

/**
 * Hook for Quantum Cloud hardware integration
 * Renamed from useIBMQuantum to use white-label branding
 */
export function useQuantumCloud() {
  const { user, session } = useAuth();
  const [backends, setBackends] = useState<QuantumCloudBackend[]>([]);
  const [isLoadingBackends, setIsLoadingBackends] = useState(false);
  const [currentJob, setCurrentJob] = useState<QuantumJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch available backends
  const fetchBackends = useCallback(async () => {
    if (!session?.access_token) return;
    
    setIsLoadingBackends(true);
    try {
      const { data, error } = await supabase.functions.invoke('ibm-quantum-backends', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (data?.backends) {
        setBackends(data.backends);
      }
    } catch (err) {
      console.error('Failed to fetch backends:', err);
      toast.error(`Failed to load ${BRANDING.hardwareServiceName} backends`);
    } finally {
      setIsLoadingBackends(false);
    }
  }, [session?.access_token]);

  // Determine which edge function to call based on backend
  const getEdgeFunctionForBackend = (backendType?: string): string => {
    if (!backendType) return 'ibm-quantum';
    if (backendType === 'open-quantum') return 'open-quantum';
    if (backendType.startsWith('aws-braket')) return 'amazon-braket';
    if (backendType === 'ibm-quantum') return 'ibm-quantum';
    return 'ibm-quantum';
  };

  // Submit circuit to Quantum Cloud
  const submitJob = useCallback(async (
    gates: QuantumGate[],
    qubitCount: number,
    localResults: SimulationResult | null,
    backendName?: string,
    shots: number = 1024
  ): Promise<QuantumJob | null> => {
    if (!session?.access_token || !user) {
      toast.error(`Please sign in to run on ${BRANDING.hardwareServiceName}`);
      return null;
    }

    setIsSubmitting(true);
    try {
      const edgeFunction = getEdgeFunctionForBackend(backendName);
      console.log(`[QuantumCloud] Routing to edge function: ${edgeFunction} for backend: ${backendName}`);

      // Submit to the appropriate Quantum Cloud backend
      const { data, error } = await supabase.functions.invoke(edgeFunction, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { gates, qubitCount, shots, backendName },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Submission failed');

      // Save job to database
      const { data: jobData, error: dbError } = await supabase
        .from('quantum_jobs')
        .insert({
          user_id: user.id,
          job_id: data.jobId,
          backend: data.backend,
          status: 'queued',
          qubit_count: qubitCount,
          shots,
          qasm: data.qasm,
          local_results: localResults as any,
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
        local_results: localResults || undefined,
        submitted_at: jobData.submitted_at,
      };

      setCurrentJob(job);
      toast.success(`Job submitted to ${data.backend}`, {
        description: `Job ID: ${data.jobId.slice(0, 8)}...`,
      });

      return job;
    } catch (err) {
      console.error('Failed to submit job:', err);
      toast.error(`Failed to submit to ${BRANDING.hardwareServiceName}`, {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [session?.access_token, user]);

  // Poll for job status
  const pollJobStatus = useCallback(async (job: QuantumJob) => {
    if (!session?.access_token) return;

    try {
      const { data, error } = await supabase.functions.invoke('ibm-quantum-status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { jobId: job.job_id, qubitCount: job.qubit_count },
      });

      if (error) throw error;

      // Update job state
      const updatedJob: QuantumJob = {
        ...job,
        status: data.status,
        queue_position: data.queuePosition,
        started_at: data.startedAt,
        completed_at: data.completedAt,
        hardware_results: data.probabilities,
        error_message: data.errorMessage,
      };

      setCurrentJob(updatedJob);

      // Update database
      await supabase
        .from('quantum_jobs')
        .update({
          status: data.status,
          queue_position: data.queuePosition,
          started_at: data.startedAt,
          completed_at: data.completedAt,
          hardware_results: data.probabilities,
          error_message: data.errorMessage,
        })
        .eq('id', job.id);

      // Check if job is done
      if (['completed', 'failed', 'cancelled'].includes(data.status)) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

        if (data.status === 'completed') {
          toast.success(`${BRANDING.hardwareServiceName} job completed!`, {
            description: 'Hardware results are now available.',
          });
        } else if (data.status === 'failed') {
          toast.error('Job failed', {
            description: data.errorMessage || 'Unknown error',
          });
        }
      }

      return updatedJob;
    } catch (err) {
      console.error('Failed to poll job status:', err);
    }
  }, [session?.access_token]);

  // Start polling when job is active
  const startPolling = useCallback((job: QuantumJob) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // Poll immediately
    pollJobStatus(job);

    // Then poll every 5 seconds
    pollingRef.current = setInterval(() => {
      pollJobStatus(job);
    }, 5000);
  }, [pollJobStatus]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Fetch job history
  const fetchJobHistory = useCallback(async (): Promise<QuantumJob[]> => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('quantum_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Failed to fetch job history:', error);
      return [];
    }

    // Map database results to QuantumJob type
    return (data || []).map(row => ({
      id: row.id,
      user_id: row.user_id,
      job_id: row.job_id,
      backend: row.backend,
      status: row.status as QuantumJob['status'],
      qubit_count: row.qubit_count,
      shots: row.shots,
      qasm: row.qasm ?? undefined,
      local_results: (row.local_results as unknown) as SimulationResult | undefined,
      hardware_results: (row.hardware_results as unknown) as { state: string; probability: number }[] | undefined,
      queue_position: row.queue_position ?? undefined,
      submitted_at: row.submitted_at,
      started_at: row.started_at ?? undefined,
      completed_at: row.completed_at ?? undefined,
      error_message: row.error_message ?? undefined,
    }));
  }, [user]);

  return {
    backends,
    isLoadingBackends,
    fetchBackends,
    currentJob,
    setCurrentJob,
    isSubmitting,
    submitJob,
    startPolling,
    stopPolling,
    fetchJobHistory,
  };
}

// Re-export with old name for backwards compatibility
export const useIBMQuantum = useQuantumCloud;
export type IBMBackend = QuantumCloudBackend;
