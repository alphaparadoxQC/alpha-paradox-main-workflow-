/**
 * ============================================================
 * QUANTUM SIMULATION WEB WORKER — Hybrid GPU/CPU
 * ============================================================
 * Offloads quantum circuit simulation to a background thread.
 * Handles task payloads from the DistributedWorkerPool.
 * ============================================================
 */

import { simulateCircuitEnhanced, EnhancedSimulationOptions } from '../simulator';
import { calculateEnergy, generateParameterizedAnsatz } from '@/lib/chemistry/vqeOptimizer';
import { QuantumGate } from '@/types/quantum';
import { BitOrder } from '../bitOrder';

export interface WorkerTaskPayload {
  taskId: string;
  gates?: QuantumGate[];
  qubitCount?: number;
  bitOrder?: BitOrder;
  options?: EnhancedSimulationOptions;
  
  // For VQE Gradient
  paramIndex?: number;
  step?: number;
  molecule?: any;
  parameters?: number[];
}

self.addEventListener('message', async (event: MessageEvent) => {
  const data = event.data;
  
  // Support both legacy direct simulate and new task-based dispatch
  const isTaskFormat = !!data.taskId;
  const taskId = data.taskId;
  const type = data.type || 'simulate'; // Default for legacy

  try {
    const startTime = performance.now();
    let resultData: any;

    if (type === 'simulate') {
      const { gates, qubitCount, bitOrder, options } = data;
      
      // Timeout protection: abort after 60 seconds to prevent infinite loading
      const timeoutMs = qubitCount > 20 ? 120000 : 60000;
      const simPromise = simulateCircuitEnhanced(gates, qubitCount, {
        bitOrder: bitOrder || 'MSB',
        ...(options || {})
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Simulation timed out after ${timeoutMs / 1000}s for ${qubitCount} qubits. Try reducing qubit count.`)), timeoutMs)
      );
      
      const simResult = await Promise.race([simPromise, timeoutPromise]);
      
      resultData = {
        probabilities: simResult.probabilities,
        blochVectors: simResult.blochVectors,
        stateVector: simResult.stateVector,
        isEntangled: simResult.isEntangled,
        entangledPairs: simResult.entangledPairs,
        amplitudes: simResult.amplitudes,
        circuitDepth: simResult.circuitDepth,
        hasMeasurement: simResult.hasMeasurement,
        displays: simResult.displays,
        gpuAccelerated: simResult.gpuAccelerated,
        compilationMetrics: simResult.compilationMetrics,
        backend: simResult.backend,
        noiseModelName: simResult.noiseModelName,
        sparsity: simResult.sparsity
      };
    } else if (type === 'vqe-gradient') {
      const { molecule, parameters, paramIndex, step, bitOrder } = data;
      
      // Calculate numerical gradient for one parameter
      const paramsPlus = [...parameters];
      const paramsMinus = [...parameters];
      
      paramsPlus[paramIndex] += step;
      paramsMinus[paramIndex] -= step;
      
      const gatesPlus = generateParameterizedAnsatz(molecule, paramsPlus);
      const gatesMinus = generateParameterizedAnsatz(molecule, paramsMinus);
      
      const [resultPlus, resultMinus] = await Promise.all([
        calculateEnergy(gatesPlus, molecule.qubitsRequired, molecule, bitOrder || 'MSB'),
        calculateEnergy(gatesMinus, molecule.qubitsRequired, molecule, bitOrder || 'MSB')
      ]);
      
      const gradient = (resultPlus.energy - resultMinus.energy) / (2 * step);
      
      resultData = { gradient, paramIndex };
    } else {
      throw new Error(`Unknown task type: ${type}`);
    }

    const endTime = performance.now();

    self.postMessage({
      taskId,
      success: true,
      executionTimeMs: endTime - startTime,
      result: resultData
    });
    
  } catch (error) {
    self.postMessage({
      taskId,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});
