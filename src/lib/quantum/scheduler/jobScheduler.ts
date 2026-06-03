/**
 * ============================================================
 * QUANTUM JOB SCHEDULER
 * ============================================================
 * Manages quantum simulation workloads with:
 * - Priority queue (chemistry > circuits > visualization)
 * - Concurrency control (max parallel workers)
 * - Job lifecycle (queued → running → completed/failed)
 * - Progress tracking and cancellation
 * - Automatic backend selection (CPU/GPU/MPS)
 *
 * Inspired by Kubernetes-style job scheduling applied to
 * quantum workloads.
 * ============================================================
 */

// ─── Types ──────────────────────────────────────────────────

export type JobPriority = 'critical' | 'high' | 'normal' | 'low' | 'background';
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type JobBackend = 'cpu-statevector' | 'cpu-mps' | 'gpu-webgpu' | 'sparse' | 'auto';

export interface QuantumJob<T = any> {
  id: string;
  name: string;
  priority: JobPriority;
  status: JobStatus;
  backend: JobBackend;
  /** The async function to execute */
  execute: () => Promise<T>;
  /** Estimated resource cost (higher = more resources needed) */
  resourceCost: number;
  /** Creation timestamp */
  createdAt: number;
  /** Start timestamp */
  startedAt?: number;
  /** Completion timestamp */
  completedAt?: number;
  /** Result data */
  result?: T;
  /** Error message if failed */
  error?: string;
  /** Progress 0-1 */
  progress: number;
  /** Abort controller for cancellation */
  abortController: AbortController;
  /** Tags for filtering/grouping */
  tags: string[];
  /** Retry count */
  retries: number;
  maxRetries: number;
}

export interface SchedulerConfig {
  /** Maximum concurrent jobs */
  maxConcurrency: number;
  /** Maximum queue size before rejecting new jobs */
  maxQueueSize: number;
  /** Whether to auto-select backend based on qubit count */
  autoBackendSelection: boolean;
  /** Default priority for new jobs */
  defaultPriority: JobPriority;
  /** Maximum retries for failed jobs */
  maxRetries: number;
}

export interface SchedulerStats {
  totalJobs: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  averageExecutionTimeMs: number;
  throughputJobsPerSecond: number;
}

// ─── Priority Values ────────────────────────────────────────

const PRIORITY_VALUES: Record<JobPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
  background: 4,
};

// ─── Default Config ─────────────────────────────────────────

export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  maxConcurrency: navigator?.hardwareConcurrency
    ? Math.max(2, Math.floor(navigator.hardwareConcurrency * 0.75))
    : 4,
  maxQueueSize: 100,
  autoBackendSelection: true,
  defaultPriority: 'normal',
  maxRetries: 2,
};

// ─── Event System ───────────────────────────────────────────

type SchedulerEvent =
  | { type: 'job-queued'; job: QuantumJob }
  | { type: 'job-started'; job: QuantumJob }
  | { type: 'job-completed'; job: QuantumJob }
  | { type: 'job-failed'; job: QuantumJob }
  | { type: 'job-cancelled'; job: QuantumJob }
  | { type: 'job-progress'; job: QuantumJob; progress: number }
  | { type: 'queue-drained' };

type EventListener = (event: SchedulerEvent) => void;

// ─── Scheduler Class ────────────────────────────────────────

export class QuantumJobScheduler {
  private config: SchedulerConfig;
  private queue: QuantumJob[] = [];
  private running: Map<string, QuantumJob> = new Map();
  private completed: Map<string, QuantumJob> = new Map();
  private listeners: Set<EventListener> = new Set();
  private isProcessing = false;
  private executionTimes: number[] = [];
  private jobCounter = 0;

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = { ...DEFAULT_SCHEDULER_CONFIG, ...config };
  }

  // ─── Job Submission ─────────────────────────────────────

  /**
   * Submit a new job to the scheduler.
   * Returns the job ID for tracking.
   */
  submit<T>(
    name: string,
    execute: () => Promise<T>,
    options: {
      priority?: JobPriority;
      backend?: JobBackend;
      tags?: string[];
      resourceCost?: number;
    } = {}
  ): string {
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error(`Queue full (${this.config.maxQueueSize} jobs). Cannot accept new jobs.`);
    }

    const id = `qjob-${Date.now()}-${++this.jobCounter}`;

    const job: QuantumJob<T> = {
      id,
      name,
      priority: options.priority || this.config.defaultPriority,
      status: 'queued',
      backend: options.backend || 'auto',
      execute,
      resourceCost: options.resourceCost || 1,
      createdAt: Date.now(),
      progress: 0,
      abortController: new AbortController(),
      tags: options.tags || [],
      retries: 0,
      maxRetries: this.config.maxRetries,
    };

    this.queue.push(job);
    this.sortQueue();
    this.emit({ type: 'job-queued', job });
    this.processQueue();

    return id;
  }

  /**
   * Submit a VQE optimization job (high priority).
   */
  submitVQE<T>(name: string, execute: () => Promise<T>): string {
    return this.submit(name, execute, {
      priority: 'high',
      tags: ['vqe', 'chemistry'],
      resourceCost: 5,
    });
  }

  /**
   * Submit a circuit simulation job (normal priority).
   */
  submitSimulation<T>(
    name: string,
    execute: () => Promise<T>,
    qubitCount: number
  ): string {
    const backend = this.selectBackend(qubitCount);
    return this.submit(name, execute, {
      priority: 'normal',
      backend,
      tags: ['simulation'],
      resourceCost: Math.ceil(qubitCount / 10),
    });
  }

  /**
   * Submit a benchmarking job (low priority).
   */
  submitBenchmark<T>(name: string, execute: () => Promise<T>): string {
    return this.submit(name, execute, {
      priority: 'low',
      tags: ['benchmark'],
      resourceCost: 3,
    });
  }

  // ─── Backend Selection ──────────────────────────────────

  private selectBackend(qubitCount: number): JobBackend {
    if (!this.config.autoBackendSelection) return 'auto';

    if (qubitCount <= 15) return 'cpu-statevector';
    if (qubitCount <= 28) return 'gpu-webgpu';
    return 'cpu-mps';
  }

  // ─── Queue Processing ──────────────────────────────────

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // Sort by priority first, then by creation time (FIFO within same priority)
      const priDiff = PRIORITY_VALUES[a.priority] - PRIORITY_VALUES[b.priority];
      if (priDiff !== 0) return priDiff;
      return a.createdAt - b.createdAt;
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0 && this.running.size < this.config.maxConcurrency) {
        const job = this.queue.shift()!;
        this.runJob(job);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async runJob(job: QuantumJob): Promise<void> {
    job.status = 'running';
    job.startedAt = Date.now();
    this.running.set(job.id, job);
    this.emit({ type: 'job-started', job });

    try {
      // Check for cancellation
      if (job.abortController.signal.aborted) {
        throw new Error('Job cancelled');
      }

      const result = await job.execute();
      job.result = result;
      job.status = 'completed';
      job.progress = 1;
      job.completedAt = Date.now();

      const execTime = job.completedAt - job.startedAt!;
      this.executionTimes.push(execTime);

      this.emit({ type: 'job-completed', job });
    } catch (error: any) {
      if (job.abortController.signal.aborted) {
        job.status = 'cancelled';
        this.emit({ type: 'job-cancelled', job });
      } else if (job.retries < job.maxRetries) {
        // Retry the job
        job.retries++;
        job.status = 'queued';
        this.queue.push(job);
        this.sortQueue();
        this.emit({ type: 'job-queued', job });
      } else {
        job.status = 'failed';
        job.error = error?.message || 'Unknown error';
        job.completedAt = Date.now();
        this.emit({ type: 'job-failed', job });
      }
    } finally {
      this.running.delete(job.id);
      this.completed.set(job.id, job);

      // Process next job in queue
      this.processQueue();

      if (this.queue.length === 0 && this.running.size === 0) {
        this.emit({ type: 'queue-drained' });
      }
    }
  }

  // ─── Job Control ────────────────────────────────────────

  /**
   * Cancel a running or queued job.
   */
  cancel(jobId: string): boolean {
    // Check running jobs
    const running = this.running.get(jobId);
    if (running) {
      running.abortController.abort();
      running.status = 'cancelled';
      return true;
    }

    // Check queue
    const queueIdx = this.queue.findIndex(j => j.id === jobId);
    if (queueIdx >= 0) {
      const job = this.queue.splice(queueIdx, 1)[0];
      job.status = 'cancelled';
      job.completedAt = Date.now();
      this.completed.set(job.id, job);
      this.emit({ type: 'job-cancelled', job });
      return true;
    }

    return false;
  }

  /**
   * Cancel all jobs.
   */
  cancelAll(): void {
    // Cancel running
    for (const job of this.running.values()) {
      job.abortController.abort();
    }

    // Cancel queued
    for (const job of this.queue) {
      job.status = 'cancelled';
      job.completedAt = Date.now();
      this.completed.set(job.id, job);
    }
    this.queue = [];
  }

  /**
   * Update job progress (0-1).
   */
  updateProgress(jobId: string, progress: number): void {
    const job = this.running.get(jobId);
    if (job) {
      job.progress = Math.min(1, Math.max(0, progress));
      this.emit({ type: 'job-progress', job, progress: job.progress });
    }
  }

  // ─── Queries ────────────────────────────────────────────

  /**
   * Get a job by ID.
   */
  getJob(jobId: string): QuantumJob | undefined {
    return this.running.get(jobId)
      || this.queue.find(j => j.id === jobId)
      || this.completed.get(jobId);
  }

  /**
   * Get all jobs with a given status.
   */
  getJobsByStatus(status: JobStatus): QuantumJob[] {
    const results: QuantumJob[] = [];

    if (status === 'queued') return [...this.queue];
    if (status === 'running') return [...this.running.values()];

    for (const job of this.completed.values()) {
      if (job.status === status) results.push(job);
    }
    return results;
  }

  /**
   * Get scheduler statistics.
   */
  getStats(): SchedulerStats {
    let completed = 0, failed = 0, cancelled = 0;
    for (const job of this.completed.values()) {
      if (job.status === 'completed') completed++;
      else if (job.status === 'failed') failed++;
      else if (job.status === 'cancelled') cancelled++;
    }

    const avgTime = this.executionTimes.length > 0
      ? this.executionTimes.reduce((a, b) => a + b, 0) / this.executionTimes.length
      : 0;

    const totalTime = this.executionTimes.reduce((a, b) => a + b, 0);
    const throughput = totalTime > 0
      ? (this.executionTimes.length / totalTime) * 1000
      : 0;

    return {
      totalJobs: this.queue.length + this.running.size + this.completed.size,
      queued: this.queue.length,
      running: this.running.size,
      completed,
      failed,
      cancelled,
      averageExecutionTimeMs: avgTime,
      throughputJobsPerSecond: throughput,
    };
  }

  // ─── Event System ───────────────────────────────────────

  on(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: SchedulerEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Don't let listener errors crash the scheduler
      }
    }
  }

  // ─── Cleanup ────────────────────────────────────────────

  /**
   * Clear completed/failed jobs older than maxAgeMs.
   */
  purge(maxAgeMs: number = 60_000): number {
    const cutoff = Date.now() - maxAgeMs;
    let purged = 0;

    for (const [id, job] of this.completed) {
      if ((job.completedAt || 0) < cutoff) {
        this.completed.delete(id);
        purged++;
      }
    }

    return purged;
  }

  /**
   * Destroy the scheduler and cancel all jobs.
   */
  destroy(): void {
    this.cancelAll();
    this.listeners.clear();
    this.completed.clear();
    this.executionTimes = [];
  }
}

// ─── Singleton Instance ─────────────────────────────────────

let _schedulerInstance: QuantumJobScheduler | null = null;

/**
 * Get the global quantum job scheduler instance.
 */
export const getScheduler = (): QuantumJobScheduler => {
  if (!_schedulerInstance) {
    _schedulerInstance = new QuantumJobScheduler();
  }
  return _schedulerInstance;
};
