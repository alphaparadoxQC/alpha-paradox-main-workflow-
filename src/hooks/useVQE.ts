/**
 * VQE Optimization Hook — Web Worker Edition
 * Runs the entire optimization loop in a background thread
 * so the UI stays at 60fps during gradient calculations.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { MoleculeData } from '@/lib/chemistry/moleculeData';
import {
  VQEResult,
  VQEIteration,
  VQEConfig,
  getParameterCount,
  initializeParameters,
  generateParameterizedAnsatz,
  calculateEnergy,
} from '@/lib/chemistry/vqeOptimizer';
import { useQuantumCircuitStore } from '@/store/quantumCircuitStore';
import VQEWorker from '@/lib/chemistry/workers/vqeWorker?worker';

export interface VQEState {
  isRunning: boolean;
  isPaused: boolean;
  currentIteration: number;
  currentEnergy: number | null;
  parameters: number[];
  iterations: VQEIteration[];
  result: VQEResult | null;
}

export const useVQE = (molecule: MoleculeData) => {
  const paramCount = getParameterCount(molecule);
  const isHeavyOptimization = molecule.qubitsRequired >= 12 || paramCount >= 120;
  const bitOrder = useQuantumCircuitStore((state) => state.bitOrder);
  
  const [state, setState] = useState<VQEState>({
    isRunning: false,
    isPaused: false,
    currentIteration: 0,
    currentEnergy: null,
    parameters: initializeParameters(paramCount),
    iterations: [],
    result: null,
  });
  
  const workerRef = useRef<Worker | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  
  // Clean up worker on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  const resetParameters = useCallback(() => {
    const newParams = initializeParameters(paramCount);
    setState(s => ({
      ...s,
      parameters: newParams,
      iterations: [],
      result: null,
      currentIteration: 0,
      currentEnergy: null,
    }));
    return newParams;
  }, [paramCount]);
  
  const setParameter = useCallback((index: number, value: number) => {
    // 1. Instantly update the slider value in the UI so dragging feels smooth
    setState(s => {
      const newParams = [...s.parameters];
      newParams[index] = value;
      return { ...s, parameters: newParams };
    });

    // 2. Debounce the heavy quantum math (state vector calculation)
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      setState(s => {
        // Calculate energy with current parameters
        const gates = generateParameterizedAnsatz(molecule, s.parameters);
        const evalResult = calculateEnergy(gates, molecule.qubitsRequired, molecule, bitOrder);
        return { ...s, currentEnergy: evalResult.energy };
      });
    }, 150); // 150ms debounce
  }, [bitOrder, molecule]);
  
  const runOptimization = useCallback(async (config?: Partial<VQEConfig>) => {
    // Terminate any previous worker
    workerRef.current?.terminate();
    
    setState(s => ({
      ...s,
      isRunning: true,
      isPaused: false,
      iterations: [],
      result: null,
    }));
    
    // For heavy atoms, only repaint the UI every 10 iterations to prevent lockup
    const uiUpdateStride = isHeavyOptimization ? 10 : 1;
    const maxChartPoints = isHeavyOptimization ? 80 : 240;
    
    return new Promise<VQEResult>((resolve, reject) => {
      const worker = new VQEWorker();
      workerRef.current = worker;
      
      worker.onmessage = (event) => {
        const msg = event.data;
        
        switch (msg.type) {
          case 'iteration': {
            const iteration: VQEIteration = msg.data;
            const shouldRefreshUi = iteration.iteration % uiUpdateStride === 0;
            if (!shouldRefreshUi) return;
            
            setState(s => ({
              ...s,
              currentIteration: iteration.iteration,
              currentEnergy: iteration.energy,
              // Avoid repainting hundreds of sliders on every heavy iteration.
              parameters: isHeavyOptimization ? s.parameters : iteration.parameters,
              iterations: [...s.iterations, iteration].slice(-maxChartPoints),
            }));
            break;
          }
          
          case 'complete': {
            const result: VQEResult = msg.result;
            setState(s => ({
              ...s,
              isRunning: false,
              result,
              parameters: result.finalParameters,
              currentEnergy: result.finalEnergy,
            }));
            worker.terminate();
            workerRef.current = null;
            resolve(result);
            break;
          }
          
          case 'aborted': {
            setState(s => ({ ...s, isRunning: false }));
            worker.terminate();
            workerRef.current = null;
            reject(new Error('Optimization aborted'));
            break;
          }
          
          case 'error': {
            setState(s => ({ ...s, isRunning: false }));
            worker.terminate();
            workerRef.current = null;
            reject(new Error(msg.message));
            break;
          }
        }
      };
      
      worker.onerror = (error) => {
        setState(s => ({ ...s, isRunning: false }));
        worker.terminate();
        workerRef.current = null;
        reject(new Error(error.message));
      };
      
      // Start the optimization in the worker
      worker.postMessage({
        type: 'start',
        molecule,
        parameters: state.parameters,
        config: config || {},
        bitOrder,
      });
    });
  }, [bitOrder, isHeavyOptimization, molecule, state.parameters]);
  
  const stopOptimization = useCallback(() => {
    // Send abort message and terminate the worker
    workerRef.current?.postMessage({ type: 'abort' });
    // Give it a moment then force terminate
    setTimeout(() => {
      workerRef.current?.terminate();
      workerRef.current = null;
    }, 100);
    setState(s => ({ ...s, isRunning: false }));
  }, []);
  
  const calculateCurrentEnergy = useCallback(() => {
    const gates = generateParameterizedAnsatz(molecule, state.parameters);
    const evalResult = calculateEnergy(gates, molecule.qubitsRequired, molecule, bitOrder);
    setState(s => ({ ...s, currentEnergy: evalResult.energy }));
    return evalResult.energy;
  }, [bitOrder, molecule, state.parameters]);
  
  return {
    ...state,
    parameterCount: paramCount,
    resetParameters,
    setParameter,
    runOptimization,
    stopOptimization,
    calculateCurrentEnergy,
  };
};
