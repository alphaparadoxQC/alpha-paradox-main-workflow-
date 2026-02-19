/**
 * Circuit optimization passes:
 * 1. Cancel adjacent inverse gates
 * 2. Merge consecutive Rz rotations on the same qubit
 * 3. Remove identity Rz(0) gates
 */

import { DecomposedGate } from './decompose';

/**
 * Normalize angle to [-π, π]
 */
function normalizeAngle(angle: number): number {
  let a = angle % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

/**
 * Check if two gates are inverses of each other
 */
function areInverses(a: DecomposedGate, b: DecomposedGate): boolean {
  if (a.qubit !== b.qubit) return false;
  
  // SX · SX · SX · SX = I (but we check pairs: can't easily cancel SX)
  // Two Rz gates with opposite angles
  if (a.type === 'Rz' && b.type === 'Rz') {
    const sum = normalizeAngle((a.angle ?? 0) + (b.angle ?? 0));
    return Math.abs(sum) < 1e-10;
  }
  
  // Two identical CNOTs cancel
  if (a.type === 'CNOT' && b.type === 'CNOT' &&
      a.controlQubit === b.controlQubit) {
    return true;
  }
  
  return false;
}

/**
 * Pass 1: Cancel adjacent inverse gates
 */
function cancelInverses(gates: DecomposedGate[]): DecomposedGate[] {
  const result: DecomposedGate[] = [];
  let i = 0;
  
  while (i < gates.length) {
    if (i + 1 < gates.length && areInverses(gates[i], gates[i + 1])) {
      i += 2; // Skip both gates
    } else {
      result.push(gates[i]);
      i++;
    }
  }
  
  return result;
}

/**
 * Pass 2: Merge consecutive Rz gates on the same qubit
 */
function mergeRotations(gates: DecomposedGate[]): DecomposedGate[] {
  const result: DecomposedGate[] = [];
  let i = 0;
  
  while (i < gates.length) {
    if (gates[i].type === 'Rz') {
      let mergedAngle = gates[i].angle ?? 0;
      const qubit = gates[i].qubit;
      let j = i + 1;
      
      // Merge consecutive Rz on same qubit
      while (j < gates.length && gates[j].type === 'Rz' && gates[j].qubit === qubit) {
        mergedAngle += gates[j].angle ?? 0;
        j++;
      }
      
      mergedAngle = normalizeAngle(mergedAngle);
      
      // Only keep if non-zero
      if (Math.abs(mergedAngle) > 1e-10) {
        result.push({ ...gates[i], angle: mergedAngle });
      }
      
      i = j;
    } else {
      result.push(gates[i]);
      i++;
    }
  }
  
  return result;
}

/**
 * Pass 3: Remove identity gates (Rz(0))
 */
function removeIdentities(gates: DecomposedGate[]): DecomposedGate[] {
  return gates.filter(g => {
    if (g.type === 'Rz' && Math.abs(g.angle ?? 0) < 1e-10) return false;
    return true;
  });
}

/**
 * Run all optimization passes
 */
export function optimizeCircuit(gates: DecomposedGate[]): DecomposedGate[] {
  let optimized = [...gates];
  
  // Run multiple iterations until stable
  for (let iter = 0; iter < 3; iter++) {
    const before = optimized.length;
    optimized = cancelInverses(optimized);
    optimized = mergeRotations(optimized);
    optimized = removeIdentities(optimized);
    if (optimized.length === before) break;
  }
  
  // Renumber positions
  optimized.forEach((g, i) => { g.position = i; });
  
  return optimized;
}
