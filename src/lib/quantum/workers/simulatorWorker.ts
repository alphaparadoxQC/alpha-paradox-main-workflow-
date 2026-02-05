 /**
  * ============================================================
  * QUANTUM SIMULATION WEB WORKER
  * ============================================================
  * Offloads quantum circuit simulation to a background thread
  * for non-blocking UI performance.
  * ============================================================
  */
 
 import { Complex, ZERO, ONE, magnitudeSquared, multiply, add, scale } from '../complex';
 import { getGateMatrix, applyGateToQubit } from '../gates';
 import { QuantumGate } from '@/types/quantum';
 
 // Worker-local state vector simulation (copied from simulator.ts for worker isolation)
 interface StateVector {
   amplitudes: Complex[];
   qubitCount: number;
 }
 
 const initializeState = (qubitCount: number): StateVector => {
   const numStates = Math.pow(2, qubitCount);
   const amplitudes: Complex[] = new Array(numStates).fill(null).map(() => ({ ...ZERO }));
   amplitudes[0] = { ...ONE };
   return { amplitudes, qubitCount };
 };
 
 const applySingleQubitGate = (
   state: StateVector,
   gateType: string,
   targetQubit: number,
   angle?: number
 ): StateVector => {
   const { amplitudes, qubitCount } = state;
   const numStates = amplitudes.length;
   const gate = getGateMatrix(gateType, angle);
   const newAmplitudes: Complex[] = new Array(numStates).fill(null).map(() => ({ ...ZERO }));
   
   for (let i = 0; i < numStates; i++) {
     const bitPosition = qubitCount - 1 - targetQubit;
     const targetBit = (i >> bitPosition) & 1;
     const partnerIndex = i ^ (1 << bitPosition);
     if (i > partnerIndex) continue;
     
     const state0Index = targetBit === 0 ? i : partnerIndex;
     const state1Index = targetBit === 0 ? partnerIndex : i;
     
     const alpha = amplitudes[state0Index];
     const beta = amplitudes[state1Index];
     const [newAlpha, newBeta] = applyGateToQubit(gate, [alpha, beta]);
     
     newAmplitudes[state0Index] = newAlpha;
     newAmplitudes[state1Index] = newBeta;
   }
   
   return { amplitudes: newAmplitudes, qubitCount };
 };
 
 const applyCNOT = (state: StateVector, control: number, target: number): StateVector => {
   const { amplitudes, qubitCount } = state;
   const newAmplitudes = [...amplitudes.map(a => ({ ...a }))];
   const controlBitPos = qubitCount - 1 - control;
   const targetBitPos = qubitCount - 1 - target;
   
   for (let i = 0; i < amplitudes.length; i++) {
     const controlBit = (i >> controlBitPos) & 1;
     if (controlBit === 1) {
       const flippedIndex = i ^ (1 << targetBitPos);
       if (i < flippedIndex) {
         const temp = newAmplitudes[i];
         newAmplitudes[i] = newAmplitudes[flippedIndex];
         newAmplitudes[flippedIndex] = temp;
       }
     }
   }
   return { amplitudes: newAmplitudes, qubitCount };
 };
 
 const applySWAP = (state: StateVector, q1: number, q2: number): StateVector => {
   const { amplitudes, qubitCount } = state;
   const newAmplitudes = [...amplitudes.map(a => ({ ...a }))];
   const bit1Pos = qubitCount - 1 - q1;
   const bit2Pos = qubitCount - 1 - q2;
   
   for (let i = 0; i < amplitudes.length; i++) {
     const bit1 = (i >> bit1Pos) & 1;
     const bit2 = (i >> bit2Pos) & 1;
     if (bit1 !== bit2) {
       const swappedIndex = i ^ (1 << bit1Pos) ^ (1 << bit2Pos);
       if (i < swappedIndex) {
         const temp = newAmplitudes[i];
         newAmplitudes[i] = newAmplitudes[swappedIndex];
         newAmplitudes[swappedIndex] = temp;
       }
     }
   }
   return { amplitudes: newAmplitudes, qubitCount };
 };
 
 const applyCZ = (state: StateVector, control: number, target: number): StateVector => {
   const { amplitudes, qubitCount } = state;
   const newAmplitudes = amplitudes.map(a => ({ ...a }));
   const controlBitPos = qubitCount - 1 - control;
   const targetBitPos = qubitCount - 1 - target;
   
   for (let i = 0; i < amplitudes.length; i++) {
     const controlBit = (i >> controlBitPos) & 1;
     const targetBit = (i >> targetBitPos) & 1;
     if (controlBit === 1 && targetBit === 1) {
       newAmplitudes[i] = { re: -amplitudes[i].re, im: -amplitudes[i].im };
     }
   }
   return { amplitudes: newAmplitudes, qubitCount };
 };
 
 const applyToffoli = (state: StateVector, c1: number, c2: number, target: number): StateVector => {
   const { amplitudes, qubitCount } = state;
   const newAmplitudes = amplitudes.map(a => ({ ...a }));
   const c1BitPos = qubitCount - 1 - c1;
   const c2BitPos = qubitCount - 1 - c2;
   const targetBitPos = qubitCount - 1 - target;
   
   for (let i = 0; i < amplitudes.length; i++) {
     const c1Bit = (i >> c1BitPos) & 1;
     const c2Bit = (i >> c2BitPos) & 1;
     if (c1Bit === 1 && c2Bit === 1) {
       const flippedIndex = i ^ (1 << targetBitPos);
       if (i < flippedIndex) {
         const temp = newAmplitudes[i];
         newAmplitudes[i] = newAmplitudes[flippedIndex];
         newAmplitudes[flippedIndex] = temp;
       }
     }
   }
   return { amplitudes: newAmplitudes, qubitCount };
 };
 
 // Simulation runner
 export const runSimulation = (gates: QuantumGate[], qubitCount: number) => {
   const startTime = performance.now();
   let state = initializeState(qubitCount);
   const sortedGates = [...gates].sort((a, b) => a.position - b.position);
   
   for (const gate of sortedGates) {
     switch (gate.type) {
       case 'H': case 'X': case 'Y': case 'Z': case 'S': case 'T':
         state = applySingleQubitGate(state, gate.type, gate.qubit);
         break;
       case 'Rx': case 'Ry': case 'Rz':
         state = applySingleQubitGate(state, gate.type, gate.qubit, gate.angle);
         break;
       case 'CNOT':
         state = applyCNOT(state, gate.qubit, gate.targetQubit ?? (gate.qubit + 1) % qubitCount);
         break;
       case 'SWAP':
         state = applySWAP(state, gate.qubit, gate.targetQubit ?? (gate.qubit + 1) % qubitCount);
         break;
       case 'CZ':
         state = applyCZ(state, gate.qubit, gate.targetQubit ?? (gate.qubit + 1) % qubitCount);
         break;
       case 'CCX':
         const c2 = gate.controlQubit2 ?? (gate.qubit + 1) % qubitCount;
         const t = gate.targetQubit ?? (gate.qubit + 2) % qubitCount;
         state = applyToffoli(state, gate.qubit, c2, t);
         break;
     }
   }
   
   const endTime = performance.now();
   return { state, executionTimeMs: endTime - startTime };
 };