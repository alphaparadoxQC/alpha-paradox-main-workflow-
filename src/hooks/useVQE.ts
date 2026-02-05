/**
 * VQE Optimization Hook
 * Provides state management for VQE optimization process
 */

import { useState, useCallback, useRef } from 'react';
import { MoleculeData } from '@/lib/chemistry/moleculeData';
import {
  VQEResult,
  VQEIteration,
  VQEConfig,
  getParameterCount,
  initializeParameters,
  runVQEOptimization,
  generateParameterizedAnsatz,
  calculateEnergy,
} from '@/lib/chemistry/vqeOptimizer';

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
  
  const [state, setState] = useState<VQEState>({
    isRunning: false,
    isPaused: false,
    currentIteration: 0,
    currentEnergy: null,
    parameters: initializeParameters(paramCount),
    iterations: [],
    result: null,
  });
  
  const abortRef = useRef(false);
  
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
    setState(s => {
      const newParams = [...s.parameters];
      newParams[index] = value;
      
      // Calculate energy with new parameters
      const gates = generateParameterizedAnsatz(molecule, newParams);
      const energy = calculateEnergy(gates, molecule.qubitsRequired, molecule);
      
      return {
        ...s,
        parameters: newParams,
        currentEnergy: energy,
      };
    });
  }, [molecule]);
  
  const runOptimization = useCallback(async (config?: Partial<VQEConfig>) => {
    abortRef.current = false;
    
    setState(s => ({
      ...s,
      isRunning: true,
      isPaused: false,
      iterations: [],
      result: null,
    }));
    
    try {
      const result = await runVQEOptimization(
        molecule,
        state.parameters,
        config,
        (iteration) => {
          if (abortRef.current) {
            throw new Error('Optimization aborted');
          }
          setState(s => ({
            ...s,
            currentIteration: iteration.iteration,
            currentEnergy: iteration.energy,
            parameters: iteration.parameters,
            iterations: [...s.iterations, iteration],
          }));
        }
      );
      
      setState(s => ({
        ...s,
        isRunning: false,
        result,
        parameters: result.finalParameters,
        currentEnergy: result.finalEnergy,
      }));
      
      return result;
    } catch (error) {
      setState(s => ({ ...s, isRunning: false }));
      throw error;
    }
  }, [molecule, state.parameters]);
  
  const stopOptimization = useCallback(() => {
    abortRef.current = true;
    setState(s => ({ ...s, isRunning: false }));
  }, []);
  
  const calculateCurrentEnergy = useCallback(() => {
    const gates = generateParameterizedAnsatz(molecule, state.parameters);
    const energy = calculateEnergy(gates, molecule.qubitsRequired, molecule);
    setState(s => ({ ...s, currentEnergy: energy }));
    return energy;
  }, [molecule, state.parameters]);
  
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
