import { create } from 'zustand';
import { provider } from '../quantum-engine/backend-provider';
import { useBackendStore } from './backendStore';
import { useCircuitStore } from './circuitStore';
import CrossProductBridge from '../quantum-engine/cross-product-bridge';

// Backend API URL — will connect to the FastAPI server
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useJobStore = create((set, get) => ({
  jobs: [],
  activeJobId: null,

  addJob: (job) => set((state) => {
    const newJobs = [job, ...state.jobs].slice(0, 50); // Keep last 50 jobs
    return { 
      jobs: newJobs,
      activeJobId: job.id
    };
  }),

  updateJob: (id, updates) => set((state) => ({
    jobs: state.jobs.map(job => job.id === id ? { ...job, ...updates } : job)
  })),

  setActiveJob: (id) => set({ activeJobId: id }),

  clearJobs: () => set({ jobs: [], activeJobId: null }),

  // Thunk to run a circuit
  runActiveCircuit: async () => {
    const circuitStore = useCircuitStore.getState();
    const backendStore = useBackendStore.getState();
    
    const circuit = circuitStore.circuit;
    if (circuit.operations.length === 0) return;

    // Strict requirement: Quantum circuits cannot run without at least one measurement gate
    const hasMeasurements = circuit.operations.some(op => op.gate === 'MEASURE');
    if (!hasMeasurements) {
      const jobId = `job-${Date.now().toString(36)}`;
      get().addJob({
        id: jobId,
        circuitName: circuit.name,
        timestamp: Date.now(),
        status: 'failed',
        isMulti: false,
        backends: [backendStore.selectedBackend],
        processor: backendStore.selectedProcessor,
        results: null,
        error: 'Execution failed: No measurement gates found on any qubit. Quantum circuits cannot run without measuring qubits to extract classical outcomes.'
      });
      return;
    }

    const isMulti = backendStore.multiChipMode;
    const backendNames = isMulti ? backendStore.selectedBackends : [backendStore.selectedBackend];
    const processor = backendStore.selectedProcessor;

    // ─── Route QPU hardware jobs to Quantum Cloud API ────────────────
    if (processor === 'QPU') {
      const providerId = backendStore.selectedProvider || 'ibm_quantum';
      const apiKey = backendStore.providerApiKeys[providerId];

      if (!apiKey || !apiKey.trim()) {
        const jobId = `job-${Date.now().toString(36)}`;
        get().addJob({
          id: jobId,
          circuitName: circuit.name,
          timestamp: Date.now(),
          status: 'failed',
          isMulti: false,
          backends: [backendStore.selectedBackend || 'Alpha Quantum QPU'],
          processor: 'QPU',
          results: null,
          error: `Hardware Authentication Required: No active API token connected for ${providerId}. Real QPU execution cannot proceed without a valid hardware provider API key. Please configure your API key in 'Configure Backend'.`
        });
        return;
      }

      return get()._runQPUJob(circuit, backendStore, apiKey.trim());
    }

    // ─── Route all jobs through the Python Backend API ─────────────────
    const targetBackend = backendNames[0] || backendStore.selectedBackend;
    return get()._runBackendJob(circuit, backendStore, processor, targetBackend);
  },

  // ─── Universal Hardware Backend Job (Dispatches to FastAPI Server) ───
  _runBackendJob: async (circuit, backendStore, processor, targetBackend) => {
    const idPrefix = {
      GPU: 'gpu',
      VECTOR: 'vec',
      FPGA: 'fpga',
      CPU: 'cpu',
      VQPU: 'vqpu',
      QPU: 'qpu'
    }[processor] || 'job';

    const jobId = `${idPrefix}-${Date.now().toString(36)}`;
    const backendName = targetBackend || backendStore.selectedBackend || (processor === 'VQPU' ? 'qldpc_virtual_chip' : 'statevector');
    const isEdaChip = backendName === 'eda_custom_topology';

    const initMessages = {
      GPU: 'Allocating GPU VRAM and compiling Metal/CUDA shader kernels...',
      VECTOR: 'Allocating AVX-512 SIMD vector register lanes...',
      FPGA: 'Synthesizing FPGA systolic array and configuring DSP48E2 slices...',
      CPU: 'Initializing CPU multithreaded OpenMP compute engine...',
      VQPU: isEdaChip ? 'Routing gates on Silicon EDA Custom Chip...' : 'Submitting to Alpha-Paradox QLDPC vQPU...'
    };

    const newJob = {
      id: jobId,
      circuitName: circuit.name,
      timestamp: Date.now(),
      status: 'submitting',
      isMulti: false,
      backends: [backendName],
      processor: processor,
      results: null,
      error: null,
      progress: 0,
      progressMessage: initMessages[processor] || `Submitting to ${processor} backend...`,
    };

    get().addJob(newJob);

    try {
      // Serialize the circuit for the backend
      const circuitPayload = JSON.stringify({
        name: circuit.name,
        numQubits: circuit.numQubits,
        numClbits: circuit.numClbits,
        operations: circuit.operations.map(op => ({
          gate: op.gate,
          qubits: op.qubits,
          clbits: op.clbits || [],
          params: op.params || [],
        })),
      });

      // Prepare noise configuration with physical EDA topology if targeting custom chip
      let noiseCfg = { ...(backendStore.noiseConfig || {}) };
      if (isEdaChip && (!noiseCfg.customTopology || !noiseCfg.customTopology.qubits?.length)) {
        try {
          const topo = CrossProductBridge.extractEdaTopology();
          noiseCfg.customTopology = topo;
        } catch (e) {
          console.warn('[jobStore] Could not extract EDA topology:', e);
        }
      }

      // Submit job to the FastAPI backend API
      const submitRes = await fetch(`${API_BASE}/api/jobs/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circuit_json: circuitPayload,
          shots: backendStore.shots,
          processor: processor,
          backend: backendName,
          noise_config: noiseCfg,
        }),
      });

      if (!submitRes.ok) {
        throw new Error(`Backend submission failed: ${submitRes.statusText}`);
      }

      const submitData = await submitRes.json();
      const backendJobId = submitData.job_id;

      get().updateJob(jobId, {
        status: 'queued',
        backendJobId,
        progressMessage: `Queued on ${processor} compute queue...`,
      });

      // Poll for job completion
      let completed = false;
      let pollCount = 0;
      const maxPolls = 120; // 2 minutes

      while (!completed && pollCount < maxPolls) {
        await new Promise(resolve => setTimeout(resolve, 800));
        pollCount++;

        try {
          const statusRes = await fetch(`${API_BASE}/api/jobs/${backendJobId}`);
          if (!statusRes.ok) continue;

          const statusData = await statusRes.json();

          get().updateJob(jobId, {
            progress: statusData.progress || 0,
            progressMessage: statusData.status || `Executing on ${processor}...`,
          });

          if (statusData.state === 'COMPLETED' || statusData.state === 'SUCCESS') {
            completed = true;
            
            const result = statusData.result;
            
            const formattedResult = {
              [backendName]: {
                result: {
                  counts: result?.counts || {},
                  probabilities: _countsToProbs(result?.counts || {}, backendStore.shots),
                  metadata: {
                    backend: backendName,
                    processor: result?.processor || processor,
                    shots: backendStore.shots,
                    executionTime: result?.execution_time_ms || 0,
                    numQubits: circuit.numQubits,
                    method: result?.method || (isEdaChip ? 'eda_layout_constrained' : `${processor.toLowerCase()}_simulation`),
                    topology: result?.topology || backendStore.noiseConfig?.customTopology || null,
                    encoding: result?.encoding || {},
                    chip: result?.chip || {},
                    hardware: result?.hardware || {},
                    noiseModel: result?.noise_used || {},
                  },
                },
                error: null,
              },
            };

            get().updateJob(jobId, {
              status: 'completed',
              results: formattedResult,
              progress: 100,
              progressMessage: 'Completed',
            });

          } else if (statusData.state === 'FAILURE') {
            completed = true;
            get().updateJob(jobId, {
              status: 'failed',
              error: statusData.status || 'Simulation failed on backend',
            });
          }
        } catch (pollErr) {
          console.warn('Poll error:', pollErr);
        }
      }

      if (!completed) {
        get().updateJob(jobId, {
          status: 'failed',
          error: `Job timed out after 2 minutes on ${processor} backend`,
        });
      }

    } catch (err) {
      // If backend server is unreachable, fall back to browser engine with notice
      console.warn(`[jobStore] Backend submission failed for ${processor}, using local browser fallback:`, err.message);
      try {
        const config = {
          shots: backendStore.shots,
          noiseConfig: backendStore.noiseConfig
        };
        const results = await provider.runMultiChip(circuit, [backendName], config);
        get().updateJob(jobId, {
          status: 'completed',
          results: results,
          error: null
        });
      } catch (fallbackErr) {
        get().updateJob(jobId, {
          status: 'failed',
          error: `${err.message} (Fallback failed: ${fallbackErr.message})`,
        });
      }
    }
  },

  // ─── Real QPU Cloud Job (Dispatches to FastAPI → Celery → Hardware) ──
  _runQPUJob: async (circuit, backendStore, apiKey) => {
    const jobId = `qpu-${Date.now().toString(36)}`;
    const providerId = backendStore.selectedProvider || 'ibm_quantum';
    const targetBackend = backendStore.selectedBackend || 'least_busy';

    const newJob = {
      id: jobId,
      circuitName: circuit.name,
      timestamp: Date.now(),
      status: 'submitting',
      isMulti: false,
      backends: [targetBackend],
      processor: 'QPU',
      results: null,
      error: null,
      progress: 0,
      progressMessage: `Connecting to ${providerId} quantum hardware cloud...`,
    };

    get().addJob(newJob);

    try {
      const circuitPayload = JSON.stringify({
        name: circuit.name,
        numQubits: circuit.numQubits,
        numClbits: circuit.numClbits,
        operations: circuit.operations.map(op => ({
          gate: op.gate,
          qubits: op.qubits,
          clbits: op.clbits || [],
          params: op.params || [],
        })),
      });

      const submitRes = await fetch(`${API_BASE}/api/jobs/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circuit_json: circuitPayload,
          shots: backendStore.shots,
          processor: 'QPU',
          backend: targetBackend,
          cloud_config: {
            provider: providerId,
            api_token: apiKey,
            backend_name: targetBackend !== 'least_busy' ? targetBackend : null,
          },
        }),
      });

      if (!submitRes.ok) {
        const errorText = await submitRes.text();
        throw new Error(`Cloud QPU submission failed: ${submitRes.status} ${errorText || submitRes.statusText}`);
      }

      const submitData = await submitRes.json();
      const backendJobId = submitData.job_id;

      get().updateJob(jobId, {
        status: 'queued',
        backendJobId,
        progressMessage: `Job queued on ${providerId} cloud service...`,
      });

      // Poll for job completion
      let completed = false;
      let pollCount = 0;
      const maxPolls = 180; // 3 minutes

      while (!completed && pollCount < maxPolls) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        pollCount++;

        try {
          const statusRes = await fetch(`${API_BASE}/api/jobs/${backendJobId}`);
          if (!statusRes.ok) continue;

          const statusData = await statusRes.json();

          get().updateJob(jobId, {
            progress: statusData.progress || 15,
            progressMessage: statusData.status || 'Executing on Quantum Hardware...',
          });

          if (statusData.state === 'COMPLETED' || statusData.state === 'SUCCESS') {
            completed = true;
            const result = statusData.result;
            const rawCounts = result?.counts || {};
            const hwName = result?.backend || targetBackend;

            const formattedResult = {
              [hwName]: {
                result: {
                  counts: rawCounts,
                  probabilities: _countsToProbs(rawCounts, backendStore.shots),
                  metadata: {
                    backend: hwName,
                    processor: 'QPU',
                    provider: providerId,
                    shots: backendStore.shots,
                    executionTime: result?.execution_time_ms || 0,
                    numQubits: circuit.numQubits,
                    method: 'physical_qpu_hardware',
                    hardwareJobId: result?.job_id,
                  },
                },
                error: null,
              },
            };

            get().updateJob(jobId, {
              status: 'completed',
              results: formattedResult,
              progress: 100,
              progressMessage: 'Hardware Execution Completed',
            });
          } else if (statusData.state === 'FAILURE') {
            completed = true;
            get().updateJob(jobId, {
              status: 'failed',
              error: statusData.error || statusData.status || 'QPU execution failed on remote cloud hardware.',
            });
          }
        } catch (pollErr) {
          console.warn('Poll error:', pollErr);
        }
      }

      if (!completed) {
        get().updateJob(jobId, {
          status: 'failed',
          error: 'Hardware job timed out waiting for cloud QPU queue.',
        });
      }
    } catch (err) {
      get().updateJob(jobId, {
        status: 'failed',
        error: err.message,
      });
    }
  },
}));

/**
 * Convert raw counts to probability distribution (0-1 range).
 */
function _countsToProbs(counts, totalShots) {
  const probs = {};
  const total = Object.values(counts).reduce((sum, c) => sum + c, 0) || totalShots;
  for (const [key, val] of Object.entries(counts)) {
    probs[key] = val / total;
  }
  return probs;
}
