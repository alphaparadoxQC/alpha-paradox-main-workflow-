 /**
  * ============================================================
  * SIMULATOR WORKER HOOK (ENHANCED)
  * ============================================================
  * React hook for running quantum simulation with the full
  * enhanced pipeline:
  * 1. Circuit compilation (gate fusion, cancellation)
  * 2. Automatic backend selection (CPU/GPU/MPS/Sparse)
  * 3. Noise model application
  * 4. Enriched result output with compiler metrics
  *
  * Provides automatic fallback to main thread for small circuits.
  * ============================================================
  */
 
 import { useState, useCallback, useRef } from 'react';
 import { QuantumGate, SimulationResult } from '@/types/quantum';
 import {
   simulateCircuit as simulateSync,
   simulateCircuitEnhanced,
   EnhancedSimulationOptions,
   SimulationOutput,
 } from '@/lib/quantum/simulator';
 import { CompilationMetrics, CompilerConfig, DEFAULT_COMPILER_CONFIG } from '@/lib/quantum/compiler';
 import { NoiseModel, IDEAL_NOISE_MODEL, getNoiseModelPresets } from '@/lib/quantum/noise';
 import { BitOrder } from '@/lib/quantum/bitOrder';
 
 interface UseSimulatorWorkerOptions {
   // Use worker for circuits with this many qubits or more
   workerThreshold?: number;
   // Use MPS for circuits with this many qubits or more
   mpsThreshold?: number;
   // Enable circuit compilation
   compilerEnabled?: boolean;
   // Compiler configuration
   compilerConfig?: CompilerConfig;
   // Noise model to apply
   noiseModel?: NoiseModel;
   // Bit ordering
   bitOrder?: BitOrder;
 }
 
 interface SimulationState {
   isSimulating: boolean;
   result: SimulationResult | null;
   executionTimeMs: number | null;
   usedMPS: boolean;
   maxBondDimension: number | null;
   /** Compiler optimization metrics */
   compilationMetrics: CompilationMetrics | null;
   /** Which backend was used */
   backend: string | null;
   /** Noise model name if applied */
   noiseModelName: string | null;
   /** Sparsity ratio (for sparse backend) */
   sparsity: number | null;
   /** GPU acceleration flag */
   gpuAccelerated: boolean;
 }
 
 export const useSimulatorWorker = (options: UseSimulatorWorkerOptions = {}) => {
   const {
     workerThreshold = 8,
     mpsThreshold = 12,
     compilerEnabled = true,
     compilerConfig = DEFAULT_COMPILER_CONFIG,
     noiseModel = IDEAL_NOISE_MODEL,
     bitOrder = 'MSB',
   } = options;
   
   const [state, setState] = useState<SimulationState>({
     isSimulating: false,
     result: null,
     executionTimeMs: null,
     usedMPS: false,
     maxBondDimension: null,
     compilationMetrics: null,
     backend: null,
     noiseModelName: null,
     sparsity: null,
     gpuAccelerated: false,
   });
   
   const abortRef = useRef(false);
   
   const simulate = useCallback(async (
     gates: QuantumGate[],
     qubitCount: number
   ): Promise<SimulationResult> => {
     abortRef.current = false;
     setState(s => ({ ...s, isSimulating: true }));
     
     try {
       let enhancedResult: SimulationOutput;
       let executionTimeMs = 0;
       
       // Use Web Worker pool for circuits >= threshold
       if (qubitCount >= workerThreshold) {
         // We must import getWorkerPool dynamically or it must be available
         const { getWorkerPool } = await import('@/lib/quantum/workers/workerPool');
         const pool = await getWorkerPool();
         
         const workerResult = await pool.submit('simulate', {
           gates,
           qubitCount,
           bitOrder,
           options: {
             compilerEnabled,
             compilerConfig,
             noiseModel,
           }
         });
         
         enhancedResult = workerResult.data;
         executionTimeMs = workerResult.executionTimeMs;
       } else {
         // Run synchronously for small circuits to avoid worker overhead
         const startTime = performance.now();
         enhancedResult = await simulateCircuitEnhanced(
           gates,
           qubitCount,
           {
             compilerEnabled,
             compilerConfig,
             noiseModel,
             bitOrder,
           }
         );
         executionTimeMs = performance.now() - startTime;
       }
       
       if (abortRef.current) {
         throw new Error('Simulation aborted');
       }
       
       const simulationResult: SimulationResult = {
         probabilities: enhancedResult.probabilities,
         blochVectors: enhancedResult.blochVectors,
         isEntangled: enhancedResult.isEntangled,
         entangledPairs: enhancedResult.entangledPairs,
         amplitudes: enhancedResult.amplitudes,
         circuitDepth: enhancedResult.circuitDepth,
         hasMeasurement: enhancedResult.hasMeasurement,
         displays: enhancedResult.displays,
       };
       
       setState({
         isSimulating: false,
         result: simulationResult,
         executionTimeMs,
         usedMPS: qubitCount >= mpsThreshold,
         maxBondDimension: null,
         compilationMetrics: enhancedResult.compilationMetrics || null,
         backend: enhancedResult.backend || null,
         noiseModelName: enhancedResult.noiseModelName || null,
         sparsity: enhancedResult.sparsity ?? null,
         gpuAccelerated: enhancedResult.gpuAccelerated || false,
       });
       
       return simulationResult;
     } catch (error) {
       setState(s => ({ ...s, isSimulating: false }));
       throw error;
     }
   }, [workerThreshold, mpsThreshold, compilerEnabled, compilerConfig, noiseModel, bitOrder]);
   
   const abort = useCallback(() => {
     abortRef.current = true;
   }, []);
   
   return {
     ...state,
     simulate,
     abort,
     /** Available noise model presets */
     noiseModelPresets: getNoiseModelPresets(),
   };
 };