/**
 * ============================================================
 * DISTRIBUTED WORKER POOL
 * ============================================================
 * Manages a pool of Web Workers for parallel quantum simulation.
 * Supports:
 * - Multi-worker state vector partitioning
 * - Load balancing across available CPU cores
 * - Worker lifecycle management (spawn, recycle, terminate)
 * - Task queuing with priority
 *
 * Architecture:
 * - For state-vector simulation, each worker handles a partition
 *   of the Hilbert space (range of basis state indices).
 * - For MPS simulation, different qubits' contractions can be
 *   distributed to different workers.
 * - Results are gathered and merged in the main thread.
 * ============================================================
 */

import { QuantumGate } from '@/types/quantum';
import { BitOrder } from '../bitOrder';

// ─── Types ──────────────────────────────────────────────────

export interface WorkerTask {
  id: string;
  type: 'simulate' | 'mps-contract' | 'benchmark' | 'vqe-gradient';
  payload: any;
  priority: number; // lower = higher priority
  createdAt: number;
}

export interface WorkerResult {
  taskId: string;
  success: boolean;
  data?: any;
  error?: string;
  executionTimeMs: number;
  workerId: number;
}

export interface PoolConfig {
  /** Number of workers to maintain. Defaults to navigator.hardwareConcurrency - 1 */
  workerCount: number;
  /** Maximum tasks to queue before rejecting */
  maxQueueSize: number;
  /** Worker script URL */
  workerUrl?: string;
  /** Whether to use shared memory (SharedArrayBuffer) if available */
  useSharedMemory: boolean;
}

export interface PoolStats {
  workerCount: number;
  activeWorkers: number;
  idleWorkers: number;
  queuedTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskTimeMs: number;
}

// ─── Worker Wrapper ─────────────────────────────────────────

interface ManagedWorker {
  id: number;
  worker: Worker;
  busy: boolean;
  currentTaskId: string | null;
  tasksCompleted: number;
  totalExecutionTimeMs: number;
}

// ─── Partition Helpers ──────────────────────────────────────

/**
 * Partition a state vector range across N workers.
 * Returns array of [startIndex, endIndex] pairs (inclusive).
 */
export const partitionStateSpace = (
  numStates: number,
  numWorkers: number
): [number, number][] => {
  const partitions: [number, number][] = [];
  const chunkSize = Math.ceil(numStates / numWorkers);

  for (let w = 0; w < numWorkers; w++) {
    const start = w * chunkSize;
    const end = Math.min(start + chunkSize - 1, numStates - 1);
    if (start <= end) {
      partitions.push([start, end]);
    }
  }

  return partitions;
};

/**
 * Merge probability results from multiple workers.
 * Combines and de-duplicates, summing probabilities for same states.
 */
export const mergeWorkerProbabilities = (
  results: { state: string; probability: number }[][]
): { state: string; probability: number }[] => {
  const merged = new Map<string, number>();

  for (const workerResult of results) {
    for (const { state, probability } of workerResult) {
      merged.set(state, (merged.get(state) || 0) + probability);
    }
  }

  return Array.from(merged.entries())
    .map(([state, probability]) => ({ state, probability }))
    .sort((a, b) => b.probability - a.probability);
};

/**
 * Merge Bloch vectors from multiple workers by averaging.
 */
export const mergeWorkerBlochVectors = (
  results: { x: number; y: number; z: number }[][],
  qubitCount: number
): { x: number; y: number; z: number }[] => {
  // Each worker should provide the same Bloch vectors;
  // we take the first valid result for each qubit
  const merged: { x: number; y: number; z: number }[] = [];

  for (let q = 0; q < qubitCount; q++) {
    let found = false;
    for (const workerVectors of results) {
      if (workerVectors[q]) {
        merged.push(workerVectors[q]);
        found = true;
        break;
      }
    }
    if (!found) {
      merged.push({ x: 0, y: 0, z: 1 }); // Default |0⟩
    }
  }

  return merged;
};

// ─── Worker Pool Class ──────────────────────────────────────

export class DistributedWorkerPool {
  private workers: ManagedWorker[] = [];
  private taskQueue: WorkerTask[] = [];
  private pendingCallbacks: Map<string, {
    resolve: (result: WorkerResult) => void;
    reject: (error: Error) => void;
  }> = new Map();
  private config: PoolConfig;
  private completedCount = 0;
  private failedCount = 0;
  private taskCounter = 0;

  constructor(config: Partial<PoolConfig> = {}) {
    const defaultWorkerCount = typeof navigator !== 'undefined'
      ? Math.max(2, (navigator.hardwareConcurrency || 4) - 1)
      : 2;

    this.config = {
      workerCount: config.workerCount ?? defaultWorkerCount,
      maxQueueSize: config.maxQueueSize ?? 50,
      useSharedMemory: config.useSharedMemory ?? false,
      ...config,
    };
  }

  /**
   * Initialize the worker pool.
   * Creates worker threads and sets up message handlers.
   */
  async initialize(): Promise<void> {
    for (let i = 0; i < this.config.workerCount; i++) {
      try {
        // Create worker from the existing quantum worker module
        const worker = new Worker(
          new URL('../workers/quantumWorker.ts', import.meta.url),
          { type: 'module' }
        );

        const managedWorker: ManagedWorker = {
          id: i,
          worker,
          busy: false,
          currentTaskId: null,
          tasksCompleted: 0,
          totalExecutionTimeMs: 0,
        };

        worker.onmessage = (event: MessageEvent) => {
          this.handleWorkerMessage(managedWorker, event.data);
        };

        worker.onerror = (error: ErrorEvent) => {
          this.handleWorkerError(managedWorker, error);
        };

        this.workers.push(managedWorker);
      } catch (error) {
        console.warn(`[WorkerPool] Failed to create worker ${i}:`, error);
      }
    }

    console.log(`[WorkerPool] Initialized with ${this.workers.length} workers`);
  }

  /**
   * Submit a task to the worker pool.
   * Returns a promise that resolves when the task completes.
   */
  submit(
    type: WorkerTask['type'],
    payload: any,
    priority: number = 5
  ): Promise<WorkerResult> {
    if (this.taskQueue.length >= this.config.maxQueueSize) {
      return Promise.reject(new Error('Worker pool queue is full'));
    }

    const taskId = `wt-${Date.now()}-${++this.taskCounter}`;
    const task: WorkerTask = {
      id: taskId,
      type,
      payload,
      priority,
      createdAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      this.pendingCallbacks.set(taskId, { resolve, reject });
      this.taskQueue.push(task);
      this.taskQueue.sort((a, b) => a.priority - b.priority);
      this.dispatchNext();
    });
  }

  /**
   * Submit a quantum circuit simulation.
   */
  async submitSimulation(
    gates: QuantumGate[],
    qubitCount: number,
    bitOrder: BitOrder = 'MSB'
  ): Promise<WorkerResult> {
    return this.submit('simulate', { gates, qubitCount, bitOrder }, 3);
  }

  /**
   * Submit a VQE gradient computation (low priority).
   */
  async submitGradient(
    gates: QuantumGate[],
    qubitCount: number,
    paramIndex: number,
    step: number
  ): Promise<WorkerResult> {
    return this.submit('vqe-gradient', { gates, qubitCount, paramIndex, step }, 7);
  }

  // ─── Internal Dispatch ──────────────────────────────────

  private dispatchNext(): void {
    if (this.taskQueue.length === 0) return;

    const idleWorker = this.workers.find(w => !w.busy);
    if (!idleWorker) return;

    const task = this.taskQueue.shift()!;
    idleWorker.busy = true;
    idleWorker.currentTaskId = task.id;

    idleWorker.worker.postMessage({
      taskId: task.id,
      ...task.payload,
    });
  }

  private handleWorkerMessage(worker: ManagedWorker, data: any): void {
    const taskId = worker.currentTaskId;
    if (!taskId) return;

    const callback = this.pendingCallbacks.get(taskId);
    if (!callback) return;

    worker.busy = false;
    worker.currentTaskId = null;
    worker.tasksCompleted++;

    const executionTimeMs = data.executionTimeMs || 0;
    worker.totalExecutionTimeMs += executionTimeMs;

    this.pendingCallbacks.delete(taskId);

    if (data.success === false) {
      this.failedCount++;
      callback.reject(new Error(data.error || 'Worker task failed'));
    } else {
      this.completedCount++;
      callback.resolve({
        taskId,
        success: true,
        data: data.result || data,
        executionTimeMs,
        workerId: worker.id,
      });
    }

    // Dispatch next task from queue
    this.dispatchNext();
  }

  private handleWorkerError(worker: ManagedWorker, error: ErrorEvent): void {
    const taskId = worker.currentTaskId;
    if (taskId) {
      const callback = this.pendingCallbacks.get(taskId);
      if (callback) {
        this.pendingCallbacks.delete(taskId);
        this.failedCount++;
        callback.reject(new Error(error.message));
      }
    }

    worker.busy = false;
    worker.currentTaskId = null;

    // Dispatch next task
    this.dispatchNext();
  }

  // ─── Stats & Control ────────────────────────────────────

  getStats(): PoolStats {
    const activeWorkers = this.workers.filter(w => w.busy).length;
    const totalTime = this.workers.reduce((s, w) => s + w.totalExecutionTimeMs, 0);
    const totalTasks = this.workers.reduce((s, w) => s + w.tasksCompleted, 0);

    return {
      workerCount: this.workers.length,
      activeWorkers,
      idleWorkers: this.workers.length - activeWorkers,
      queuedTasks: this.taskQueue.length,
      completedTasks: this.completedCount,
      failedTasks: this.failedCount,
      averageTaskTimeMs: totalTasks > 0 ? totalTime / totalTasks : 0,
    };
  }

  /**
   * Cancel all pending tasks.
   */
  cancelAll(): void {
    for (const [taskId, callback] of this.pendingCallbacks) {
      callback.reject(new Error('Task cancelled'));
    }
    this.pendingCallbacks.clear();
    this.taskQueue = [];
  }

  /**
   * Terminate all workers and clean up.
   */
  destroy(): void {
    this.cancelAll();
    for (const managedWorker of this.workers) {
      managedWorker.worker.terminate();
    }
    this.workers = [];
  }

  /**
   * Get the number of available idle workers.
   */
  get idleCount(): number {
    return this.workers.filter(w => !w.busy).length;
  }

  /**
   * Check if SharedArrayBuffer is available for zero-copy communication.
   */
  static isSharedMemoryAvailable(): boolean {
    return typeof SharedArrayBuffer !== 'undefined';
  }
}

// ─── Singleton ──────────────────────────────────────────────

let _poolInstance: DistributedWorkerPool | null = null;

/**
 * Get the global worker pool instance.
 * Auto-initializes on first call.
 */
export const getWorkerPool = async (): Promise<DistributedWorkerPool> => {
  if (!_poolInstance) {
    _poolInstance = new DistributedWorkerPool();
    await _poolInstance.initialize();
  }
  return _poolInstance;
};
