/**
 * Qubit routing: insert SWAP gates when qubits aren't adjacent in coupling map
 * Uses a simple greedy nearest-neighbor approach with BFS pathfinding.
 */

import { DecomposedGate } from './decompose';
import { HardwareBackend } from './backends';

/**
 * BFS shortest path between two qubits on the coupling graph
 */
function bfsPath(from: number, to: number, couplingMap: [number, number][]): number[] | null {
  if (from === to) return [from];
  
  const adj = new Map<number, number[]>();
  for (const [a, b] of couplingMap) {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a)!.push(b);
  }
  
  const visited = new Set<number>([from]);
  const queue: { node: number; path: number[] }[] = [{ node: from, path: [from] }];
  
  while (queue.length > 0) {
    const { node, path } = queue.shift()!;
    for (const neighbor of adj.get(node) ?? []) {
      if (neighbor === to) return [...path, to];
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ node: neighbor, path: [...path, neighbor] });
      }
    }
  }
  
  return null; // unreachable
}

/**
 * Check if two qubits are directly connected
 */
function isConnected(q1: number, q2: number, couplingMap: [number, number][]): boolean {
  return couplingMap.some(([a, b]) => (a === q1 && b === q2) || (a === q2 && b === q1));
}

/**
 * Create SWAP gate decomposed into 3 CNOTs
 */
function createSwapGates(q1: number, q2: number): DecomposedGate[] {
  return [
    { type: 'CNOT', qubit: q2, controlQubit: q1, position: 0 },
    { type: 'CNOT', qubit: q1, controlQubit: q2, position: 0 },
    { type: 'CNOT', qubit: q2, controlQubit: q1, position: 0 },
  ];
}

export interface RoutingResult {
  gates: DecomposedGate[];
  swapCount: number;
  logicalToPhysical: Map<number, number>;
}

/**
 * Route a decomposed circuit onto a hardware backend
 * Inserts SWAP gates as needed for non-adjacent CNOT operations
 */
export function routeCircuit(
  gates: DecomposedGate[],
  backend: HardwareBackend
): RoutingResult {
  // Initial mapping: logical qubit i → physical qubit i
  const l2p = new Map<number, number>();
  const p2l = new Map<number, number>();
  
  // Collect all logical qubits used
  const usedQubits = new Set<number>();
  for (const g of gates) {
    usedQubits.add(g.qubit);
    if (g.controlQubit !== undefined) usedQubits.add(g.controlQubit);
  }
  
  // Check if circuit fits on backend
  if (usedQubits.size > backend.qubitCount) {
    // Return as-is if circuit doesn't fit
    return { gates: [...gates], swapCount: 0, logicalToPhysical: new Map() };
  }
  
  // Initialize trivial mapping
  for (const q of usedQubits) {
    l2p.set(q, q);
    p2l.set(q, q);
  }
  
  const routed: DecomposedGate[] = [];
  let swapCount = 0;
  
  for (const gate of gates) {
    if (gate.type === 'CNOT' && gate.controlQubit !== undefined) {
      const physCtrl = l2p.get(gate.controlQubit)!;
      const physTarget = l2p.get(gate.qubit)!;
      
      if (!isConnected(physCtrl, physTarget, backend.couplingMap)) {
        // Need to route: find path and insert SWAPs
        const path = bfsPath(physCtrl, physTarget, backend.couplingMap);
        
        if (path && path.length > 2) {
          // SWAP control qubit along the path until adjacent to target
          for (let i = 0; i < path.length - 2; i++) {
            const from = path[i];
            const to = path[i + 1];
            
            // Insert SWAP
            routed.push(...createSwapGates(from, to));
            swapCount++;
            
            // Update mappings
            const logFrom = p2l.get(from);
            const logTo = p2l.get(to);
            
            if (logFrom !== undefined) l2p.set(logFrom, to);
            if (logTo !== undefined) l2p.set(logTo, from);
            p2l.set(from, logTo!);
            p2l.set(to, logFrom!);
          }
        }
        
        // Now insert the CNOT with updated physical qubits
        routed.push({
          ...gate,
          controlQubit: l2p.get(gate.controlQubit)!,
          qubit: l2p.get(gate.qubit)!,
        });
      } else {
        routed.push({
          ...gate,
          controlQubit: physCtrl,
          qubit: physTarget,
        });
      }
    } else {
      // Single-qubit gate: just update physical qubit
      routed.push({
        ...gate,
        qubit: l2p.get(gate.qubit) ?? gate.qubit,
      });
    }
  }
  
  // Renumber positions
  routed.forEach((g, i) => { g.position = i; });
  
  return { gates: routed, swapCount, logicalToPhysical: l2p };
}
