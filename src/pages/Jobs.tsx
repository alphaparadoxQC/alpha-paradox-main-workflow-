import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Cpu, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ChevronDown,
  ChevronRight,
  Trash2,
  RotateCcw,
  Filter,
  BarChart3,
  Zap,
  Calendar,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SimulationResult } from '@/types/quantum';

interface QuantumJob {
  id: string;
  user_id: string;
  circuit_id?: string;
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
  created_at: string;
}

type StatusFilter = 'all' | 'completed' | 'failed' | 'running' | 'queued';

const Jobs = () => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<QuantumJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [rerunningJobId, setRerunningJobId] = useState<string | null>(null);

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('quantum_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      
      setJobs((data || []).map(row => ({
        ...row,
        local_results: row.local_results as unknown as SimulationResult | undefined,
        hardware_results: row.hardware_results as unknown as { state: string; probability: number }[] | undefined,
      })) as QuantumJob[]);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      toast.error('Failed to load job history');
    } finally {
      setIsLoading(false);
    }
  }, [user, statusFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !isLoading) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  // Delete job
  const handleDelete = async (jobId: string) => {
    setDeletingJobId(jobId);
    try {
      const { error } = await supabase
        .from('quantum_jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
      
      setJobs(prev => prev.filter(j => j.id !== jobId));
      toast.success('Job deleted');
    } catch (err) {
      console.error('Failed to delete job:', err);
      toast.error('Failed to delete job');
    } finally {
      setDeletingJobId(null);
    }
  };

  // Re-run job
  const handleRerun = async (job: QuantumJob) => {
    if (!session?.access_token) {
      toast.error('Please sign in to re-run jobs');
      return;
    }

    setRerunningJobId(job.id);
    try {
      // Parse QASM to extract gates (simplified - in production you'd store gates separately)
      const { data, error } = await supabase.functions.invoke('ibm-quantum', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { 
          gates: job.local_results ? [] : [], // Would need to reconstruct from circuit_id
          qubitCount: job.qubit_count, 
          shots: job.shots,
          backendName: job.backend,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Submission failed');

      // Save new job
      const { error: dbError } = await supabase
        .from('quantum_jobs')
        .insert({
          user_id: user!.id,
          job_id: data.jobId,
          backend: data.backend,
          status: 'queued',
          qubit_count: job.qubit_count,
          shots: job.shots,
          qasm: data.qasm,
          local_results: job.local_results as any,
        });

      if (dbError) throw dbError;

      toast.success('Job re-submitted!', {
        description: `Job ID: ${data.jobId.slice(0, 8)}...`,
      });
      
      fetchJobs();
    } catch (err) {
      console.error('Failed to re-run job:', err);
      toast.error('Failed to re-run job', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setRerunningJobId(null);
    }
  };

  // Calculate stats
  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    running: jobs.filter(j => ['queued', 'running', 'submitting'].includes(j.status)).length,
    successRate: jobs.length > 0 
      ? (jobs.filter(j => j.status === 'completed').length / jobs.filter(j => ['completed', 'failed'].includes(j.status)).length * 100) || 0
      : 0,
  };

  const getStatusBadge = (status: QuantumJob['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      case 'running':
        return <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">Running</Badge>;
      case 'queued':
        return <Badge variant="default" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Queued</Badge>;
      case 'submitting':
        return <Badge variant="secondary">Submitting</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Builder
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-accent" />
              <h1 className="text-xl font-bold">IBM Quantum Job History</h1>
            </div>
          </div>
          
          <Button variant="outline" onClick={fetchJobs} disabled={isLoading}>
            <RotateCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-lg p-4 border border-border"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs">Total Jobs</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-lg p-4 border border-border"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs">Completed</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-lg p-4 border border-border"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs">In Progress</span>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.running}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-lg p-4 border border-border"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-xs">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-accent">
              {stats.successRate.toFixed(0)}%
            </p>
          </motion.div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter by status:</span>
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Jobs Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <Cpu className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No jobs found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Submit a circuit to IBM Quantum to see it here
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Backend</TableHead>
                  <TableHead>Qubits</TableHead>
                  <TableHead>Shots</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <>
                    <TableRow 
                      key={job.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                    >
                      <TableCell>
                        {expandedJobId === job.id ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatDate(job.submitted_at)}
                      </TableCell>
                      <TableCell className="font-medium">{job.backend}</TableCell>
                      <TableCell>{job.qubit_count}</TableCell>
                      <TableCell>{job.shots.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRerun(job)}
                            disabled={rerunningJobId === job.id}
                            title="Re-run job"
                          >
                            {rerunningJobId === job.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                disabled={deletingJobId === job.id}
                              >
                                {deletingJobId === job.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Job?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this job and its results.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(job.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Row */}
                    <AnimatePresence>
                      {expandedJobId === job.id && (
                        <TableRow key={`${job.id}-expanded`}>
                          <TableCell colSpan={7} className="bg-muted/30 p-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 space-y-4">
                                {/* Job Details */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Job ID:</span>
                                    <p className="font-mono text-xs mt-1">{job.job_id}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Submitted:</span>
                                    <p className="text-xs mt-1">{new Date(job.submitted_at).toLocaleString()}</p>
                                  </div>
                                  {job.started_at && (
                                    <div>
                                      <span className="text-muted-foreground">Started:</span>
                                      <p className="text-xs mt-1">{new Date(job.started_at).toLocaleString()}</p>
                                    </div>
                                  )}
                                  {job.completed_at && (
                                    <div>
                                      <span className="text-muted-foreground">Completed:</span>
                                      <p className="text-xs mt-1">{new Date(job.completed_at).toLocaleString()}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Error Message */}
                                {job.error_message && (
                                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-destructive mb-1">
                                      <XCircle className="w-4 h-4" />
                                      <span className="text-sm font-medium">Error</span>
                                    </div>
                                    <p className="text-xs text-destructive/80">{job.error_message}</p>
                                  </div>
                                )}

                                {/* Results Comparison */}
                                {job.status === 'completed' && job.hardware_results && (
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                      <Target className="w-4 h-4 text-accent" />
                                      Hardware Results
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                      {job.hardware_results.slice(0, 8).map((result) => (
                                        <div 
                                          key={result.state}
                                          className="bg-card rounded p-2 border border-border"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-mono text-xs">{result.state}</span>
                                            <span className="text-xs text-accent font-medium">
                                              {(result.probability * 100).toFixed(1)}%
                                            </span>
                                          </div>
                                          <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
                                            <div 
                                              className="h-full bg-accent rounded-full"
                                              style={{ width: `${result.probability * 100}%` }}
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* QASM Preview */}
                                {job.qasm && (
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium">OpenQASM Circuit</h4>
                                    <pre className="bg-background rounded p-3 text-xs font-mono overflow-x-auto max-h-32 border border-border">
                                      {job.qasm}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      )}
                    </AnimatePresence>
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
};

export default Jobs;
