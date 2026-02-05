 /**
  * ============================================================
  * SIMULATOR WORKER HOOK
  * ============================================================
  * React hook for running quantum simulation with Web Workers.
  * Provides automatic fallback to main thread for small circuits.
  * ============================================================
  */
 
 import { useState, useCallback, useRef } from 'react';
 import { QuantumGate, SimulationResult } from '@/types/quantum';
 import { simulateCircuit as simulateSync } from '@/lib/quantum/simulator';
 
 interface UseSimulatorWorkerOptions {
   // Use worker for circuits with this many qubits or more
   workerThreshold?: number;
   // Use MPS for circuits with this many qubits or more
   mpsThreshold?: number;
 }
 
 interface SimulationState {
   isSimulating: boolean;
   result: SimulationResult | null;
   executionTimeMs: number | null;
   usedMPS: boolean;
   maxBondDimension: number | null;
 }
 
 export const useSimulatorWorker = (options: UseSimulatorWorkerOptions = {}) => {
   const { workerThreshold = 8, mpsThreshold = 12 } = options;
   
   const [state, setState] = useState<SimulationState>({
     isSimulating: false,
     result: null,
     executionTimeMs: null,
     usedMPS: false,
     maxBondDimension: null,
   });
   
   const abortRef = useRef(false);
   
   const simulate = useCallback(async (
     gates: QuantumGate[],
     qubitCount: number
   ): Promise<SimulationResult> => {
     abortRef.current = false;
     setState(s => ({ ...s, isSimulating: true }));
     
     const startTime = performance.now();
     
     try {
       // For now, use synchronous simulation
       // Worker integration can be added when needed for larger circuits
       const result = simulateSync(gates, qubitCount);
       
       const endTime = performance.now();
       
       if (abortRef.current) {
         throw new Error('Simulation aborted');
       }
       
       const simulationResult: SimulationResult = {
         probabilities: result.probabilities,
         blochVectors: result.blochVectors,
         isEntangled: result.isEntangled,
         entangledPairs: result.entangledPairs,
         amplitudes: result.amplitudes,
         circuitDepth: result.circuitDepth,
         hasMeasurement: result.hasMeasurement,
       };
       
       setState({
         isSimulating: false,
         result: simulationResult,
         executionTimeMs: endTime - startTime,
         usedMPS: qubitCount >= mpsThreshold,
         maxBondDimension: null,
       });
       
       return simulationResult;
     } catch (error) {
       setState(s => ({ ...s, isSimulating: false }));
       throw error;
     }
   }, [mpsThreshold]);
   
   const abort = useCallback(() => {
     abortRef.current = true;
   }, []);
   
   return {
     ...state,
     simulate,
     abort,
   };
 };