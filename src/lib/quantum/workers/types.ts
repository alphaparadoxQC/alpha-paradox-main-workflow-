 /**
  * ============================================================
  * WEB WORKER MESSAGE TYPES
  * ============================================================
  * Type definitions for communication between main thread
  * and simulation worker.
  * ============================================================
  */
 
 import { QuantumGate } from '@/types/quantum';
 
 export interface SimulationRequest {
   type: 'simulate';
   gates: QuantumGate[];
   qubitCount: number;
   useMPS: boolean;
   mpsConfig?: {
     maxBondDimension: number;
     truncationThreshold: number;
   };
 }
 
 export interface SimulationResponse {
   type: 'result';
   probabilities: { state: string; probability: number }[];
   blochVectors: { x: number; y: number; z: number }[];
   isEntangled: boolean;
   entangledPairs: [number, number][];
   amplitudes: { state: string; re: number; im: number; magnitude: number; phase: number }[];
   circuitDepth: number;
   hasMeasurement: boolean;
   maxBondDimension?: number;
   executionTimeMs: number;
 }
 
 export interface SimulationError {
   type: 'error';
   message: string;
 }
 
 export interface SimulationProgress {
   type: 'progress';
   percent: number;
   message: string;
 }
 
 export type WorkerMessage = SimulationRequest;
 export type WorkerResponse = SimulationResponse | SimulationError | SimulationProgress;