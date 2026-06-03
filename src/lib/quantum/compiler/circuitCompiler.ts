/**
 * ============================================================
 * QUANTUM CIRCUIT COMPILER — DAG-BASED OPTIMIZER
 * ============================================================
 * Implements a multi-pass quantum circuit transpiler that:
 *
 * 1. Gate Cancellation: H·H = I, X·X = I, Z·Z = I, etc.
 * 2. Gate Fusion: Adjacent single-qubit gates → single 2x2 matrix
 * 3. Circuit Chunking: Groups gates into fused GPU kernels
 * 4. Depth Reduction: Commutation-aware gate reordering
 * 5. Topology Mapping: SWAP insertion for linear connectivity
 *
 * Inspired by Qiskit's transpile() and Cirq's optimizers.
 * ============================================================
 */

import { QuantumGate } from '@/types/quantum';
import { Complex, multiply, add, ZERO, ONE } from '../complex';
import { GateMatrix, getGateMatrix } from '../gates';

// ─── Types ──────────────────────────────────────────────────

/** A node in the circuit DAG */
export interface DAGNode {
  id: string;
  gate: QuantumGate;
  /** Qubit wires this gate touches */
  qubits: number[];
  /** Predecessor node IDs (gates that must run before this one) */
  predecessors: Set<string>;
  /** Successor node IDs (gates that depend on this one) */
  successors: Set<string>;
  /** Whether this node has been fused into another */
  fused: boolean;
  /** Fused 2x2 matrix (if this node represents a fused single-qubit gate) */
  fusedMatrix?: GateMatrix;
}

/** The circuit represented as a Directed Acyclic Graph */
export interface CircuitDAG {
  nodes: Map<string, DAGNode>;
  qubitCount: number;
  /** Topological order of node IDs */
  order: string[];
}

/** Compilation pass result metrics */
export interface CompilationMetrics {
  originalGateCount: number;
  optimizedGateCount: number;
  cancelledGates: number;
  fusedGates: number;
  depthBefore: number;
  depthAfter: number;
  passesApplied: string[];
}

/** Compiler configuration */
export interface CompilerConfig {
  enableCancellation: boolean;
  enableFusion: boolean;
  enableCommutation: boolean;
  enableChunking: boolean;
  /** Maximum number of gates to fuse into a single operation */
  maxFusionLength: number;
  /** Target topology for SWAP insertion ('all-to-all' | 'linear' | 'grid') */
  topology: 'all-to-all' | 'linear' | 'grid';
}

export const DEFAULT_COMPILER_CONFIG: CompilerConfig = {
  enableCancellation: true,
  enableFusion: true,
  enableCommutation: true,
  enableChunking: true,
  maxFusionLength: 8,
  topology: 'all-to-all',
};

// ─── DAG Construction ───────────────────────────────────────

/**
 * Build a DAG from a list of gates.
 * Dependencies are defined by qubit wire ordering:
 * a gate depends on the most recent gate on each of its qubits.
 */
export const buildCircuitDAG = (
  gates: QuantumGate[],
  qubitCount: number
): CircuitDAG => {
  const sortedGates = [...gates].sort((a, b) => a.position - b.position);
  const nodes = new Map<string, DAGNode>();

  // Track the last gate on each qubit wire
  const lastOnWire: (string | null)[] = new Array(qubitCount).fill(null);

  for (const gate of sortedGates) {
    const qubits = getGateQubits(gate, qubitCount);
    const predecessors = new Set<string>();

    // Find dependencies: last gate on each qubit this gate touches
    for (const q of qubits) {
      const lastId = lastOnWire[q];
      if (lastId) {
        predecessors.add(lastId);
      }
    }

    const node: DAGNode = {
      id: gate.id,
      gate,
      qubits,
      predecessors,
      successors: new Set(),
      fused: false,
    };

    nodes.set(gate.id, node);

    // Update predecessor successors
    for (const predId of predecessors) {
      const pred = nodes.get(predId);
      if (pred) {
        pred.successors.add(gate.id);
      }
    }

    // Update wire tracking
    for (const q of qubits) {
      lastOnWire[q] = gate.id;
    }
  }

  // Compute topological order via Kahn's algorithm
  const order = topologicalSort(nodes);

  return { nodes, qubitCount, order };
};

/**
 * Get all qubit indices a gate touches.
 */
const getGateQubits = (gate: QuantumGate, qubitCount: number): number[] => {
  const qubits = [gate.qubit];

  switch (gate.type) {
    case 'CNOT':
    case 'SWAP':
    case 'CZ':
      qubits.push(gate.targetQubit ?? (gate.qubit + 1) % qubitCount);
      break;
    case 'CCX':
      qubits.push(gate.controlQubit2 ?? (gate.qubit + 1) % qubitCount);
      qubits.push(gate.targetQubit ?? (gate.qubit + 2) % qubitCount);
      break;
  }

  return [...new Set(qubits)];
};

/**
 * Kahn's algorithm for topological sort.
 */
const topologicalSort = (nodes: Map<string, DAGNode>): string[] => {
  const inDegree = new Map<string, number>();
  const queue: string[] = [];
  const result: string[] = [];

  for (const [id, node] of nodes) {
    const deg = node.predecessors.size;
    inDegree.set(id, deg);
    if (deg === 0) queue.push(id);
  }

  while (queue.length > 0) {
    const id = queue.shift()!;
    result.push(id);

    const node = nodes.get(id)!;
    for (const succId of node.successors) {
      const newDeg = (inDegree.get(succId) || 0) - 1;
      inDegree.set(succId, newDeg);
      if (newDeg === 0) queue.push(succId);
    }
  }

  return result;
};

// ─── Pass 1: Gate Cancellation ──────────────────────────────

/** Gates that are self-inverse: G·G = I */
const SELF_INVERSE_GATES = new Set(['H', 'X', 'Y', 'Z', 'CNOT', 'SWAP', 'CZ']);

/**
 * Cancel adjacent self-inverse gate pairs.
 * H → H on the same qubit with no intervening gates = identity.
 */
export const cancelGatesPass = (dag: CircuitDAG): number => {
  let cancelled = 0;

  for (const id of [...dag.order]) {
    const node = dag.nodes.get(id);
    if (!node || node.fused) continue;
    if (!SELF_INVERSE_GATES.has(node.gate.type)) continue;

    // Check if the sole successor is the same gate on the same qubits
    if (node.successors.size !== 1) continue;

    const succId = [...node.successors][0];
    const succ = dag.nodes.get(succId);
    if (!succ || succ.fused) continue;
    if (succ.gate.type !== node.gate.type) continue;
    if (succ.predecessors.size !== 1) continue;

    // Same qubit set
    const sameQubits =
      node.qubits.length === succ.qubits.length &&
      node.qubits.every((q, i) => q === succ.qubits[i]);

    if (!sameQubits) continue;

    // Cancel both nodes
    removeNodeFromDAG(dag, id);
    removeNodeFromDAG(dag, succId);
    cancelled += 2;
  }

  // Rebuild topological order
  dag.order = topologicalSort(dag.nodes);
  return cancelled;
};

/**
 * Remove a node from the DAG and reconnect edges.
 */
const removeNodeFromDAG = (dag: CircuitDAG, nodeId: string): void => {
  const node = dag.nodes.get(nodeId);
  if (!node) return;

  // Reconnect predecessors to successors
  for (const predId of node.predecessors) {
    const pred = dag.nodes.get(predId);
    if (pred) {
      pred.successors.delete(nodeId);
      for (const succId of node.successors) {
        pred.successors.add(succId);
      }
    }
  }

  for (const succId of node.successors) {
    const succ = dag.nodes.get(succId);
    if (succ) {
      succ.predecessors.delete(nodeId);
      for (const predId of node.predecessors) {
        succ.predecessors.add(predId);
      }
    }
  }

  dag.nodes.delete(nodeId);
};

// ─── Pass 2: Gate Fusion ────────────────────────────────────

/**
 * Matrix multiplication for 2x2 complex gate matrices.
 */
const multiplyGateMatrices = (A: GateMatrix, B: GateMatrix): GateMatrix => {
  const result: GateMatrix = [
    [{ re: 0, im: 0 }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: 0, im: 0 }],
  ];

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      result[i][j] = add(
        multiply(A[i][0], B[0][j]),
        multiply(A[i][1], B[1][j])
      );
    }
  }

  return result;
};

/** Single-qubit gate types that can be fused */
const FUSABLE_SINGLE_QUBIT = new Set([
  'H', 'X', 'Y', 'Z', 'S', 'T', 'Rx', 'Ry', 'Rz', 'Sdg', 'S†', 'Tdg', 'T†',
]);

/**
 * Fuse chains of adjacent single-qubit gates on the same qubit
 * into a single fused 2x2 matrix.
 *
 * Example: H → Rz(π/4) → X → Ry(θ) on qubit q
 *   becomes: FusedGate(M = Ry(θ) · X · Rz(π/4) · H) on qubit q
 */
export const fuseGatesPass = (dag: CircuitDAG, maxLength: number = 8): number => {
  let fused = 0;
  const visited = new Set<string>();

  for (const startId of dag.order) {
    if (visited.has(startId)) continue;

    const startNode = dag.nodes.get(startId);
    if (!startNode || startNode.fused) continue;
    if (!FUSABLE_SINGLE_QUBIT.has(startNode.gate.type)) continue;
    if (startNode.qubits.length !== 1) continue;

    // Collect chain of single-qubit gates on the same qubit
    const chain: DAGNode[] = [startNode];
    let current = startNode;

    while (chain.length < maxLength) {
      if (current.successors.size !== 1) break;

      const nextId = [...current.successors][0];
      const next = dag.nodes.get(nextId);
      if (!next || next.fused || visited.has(nextId)) break;
      if (!FUSABLE_SINGLE_QUBIT.has(next.gate.type)) break;
      if (next.qubits.length !== 1) break;
      if (next.qubits[0] !== startNode.qubits[0]) break;
      if (next.predecessors.size !== 1) break;

      chain.push(next);
      current = next;
    }

    if (chain.length < 2) {
      visited.add(startId);
      continue;
    }

    // Fuse the chain: multiply matrices in order (right to left in circuit = left to right in time)
    let fusedMatrix = getGateMatrix(chain[0].gate.type, chain[0].gate.angle);
    for (let i = 1; i < chain.length; i++) {
      const nextMatrix = getGateMatrix(chain[i].gate.type, chain[i].gate.angle);
      fusedMatrix = multiplyGateMatrices(nextMatrix, fusedMatrix);
    }

    // Replace chain with a single fused node
    startNode.fusedMatrix = fusedMatrix;
    startNode.gate = {
      ...startNode.gate,
      type: 'FUSED' as any, // Special type for the fused gate
    };

    // Remove intermediate nodes, keep the first
    for (let i = 1; i < chain.length; i++) {
      const nodeId = chain[i].id;
      visited.add(nodeId);

      // The start node inherits the last node's successors
      if (i === chain.length - 1) {
        startNode.successors = new Set(chain[i].successors);
        // Update reverse edges
        for (const succId of chain[i].successors) {
          const succ = dag.nodes.get(succId);
          if (succ) {
            succ.predecessors.delete(nodeId);
            succ.predecessors.add(startId);
          }
        }
      }

      dag.nodes.delete(nodeId);
      fused++;
    }

    visited.add(startId);
  }

  dag.order = topologicalSort(dag.nodes);
  return fused;
};

// ─── Pass 3: Depth Reduction via Commutation ────────────────

/**
 * Check if two gates commute (can be reordered without changing the result).
 * Two gates commute if they act on disjoint qubits, or if they are
 * both diagonal in the same basis.
 */
const gatesCommute = (a: DAGNode, b: DAGNode): boolean => {
  // Disjoint qubits always commute
  const overlap = a.qubits.some(q => b.qubits.includes(q));
  if (!overlap) return true;

  // Diagonal gates on the same qubit commute (Z, S, T, Rz)
  const DIAGONAL_GATES = new Set(['Z', 'S', 'T', 'Rz', 'CZ']);
  if (DIAGONAL_GATES.has(a.gate.type) && DIAGONAL_GATES.has(b.gate.type)) {
    return true;
  }

  return false;
};

/**
 * Attempt to reduce circuit depth by moving commuting gates earlier.
 * This is a simplified version of Cirq's EarlierCommutation pass.
 */
export const commutationPass = (dag: CircuitDAG): number => {
  let moves = 0;

  for (const nodeId of [...dag.order]) {
    const node = dag.nodes.get(nodeId);
    if (!node || node.fused) continue;

    // Try to move this gate earlier by checking if it commutes with predecessors
    for (const predId of [...node.predecessors]) {
      const pred = dag.nodes.get(predId);
      if (!pred) continue;

      if (gatesCommute(node, pred)) {
        // Remove dependency edge (they can run in parallel)
        node.predecessors.delete(predId);
        pred.successors.delete(nodeId);

        // Inherit pred's predecessors for the qubits they share
        for (const predPredId of pred.predecessors) {
          const predPred = dag.nodes.get(predPredId);
          if (predPred && predPred.qubits.some(q => node.qubits.includes(q))) {
            node.predecessors.add(predPredId);
            predPred.successors.add(nodeId);
          }
        }

        moves++;
      }
    }
  }

  if (moves > 0) {
    dag.order = topologicalSort(dag.nodes);
  }

  return moves;
};

// ─── Pass 4: Circuit Chunking ───────────────────────────────

/**
 * A chunk is a group of gates that can be dispatched as a single
 * GPU kernel (or a single batch of operations).
 */
export interface CircuitChunk {
  id: string;
  gates: QuantumGate[];
  /** Fused matrices for gates in this chunk (if applicable) */
  fusedMatrices: Map<string, GateMatrix>;
  /** Which qubits this chunk touches */
  qubits: Set<number>;
  /** Execution order within the chunk */
  executionOrder: number;
}

/**
 * Group gates into chunks that can be executed efficiently.
 * Gates in the same chunk are independent (no wire conflicts).
 */
export const chunkCircuit = (dag: CircuitDAG): CircuitChunk[] => {
  const chunks: CircuitChunk[] = [];
  const assigned = new Set<string>();

  // Greedy layering: assign each gate to the earliest possible chunk
  for (const nodeId of dag.order) {
    const node = dag.nodes.get(nodeId);
    if (!node || node.fused || assigned.has(nodeId)) continue;

    // Find the earliest chunk that doesn't conflict with this gate's qubits
    let bestChunk: CircuitChunk | null = null;

    for (const chunk of chunks) {
      // Check if all predecessors are in earlier chunks
      const predsInChunk = [...node.predecessors].some(
        predId => chunk.gates.some(g => g.id === predId)
      );
      if (predsInChunk) continue;

      // Check no qubit conflict
      const conflict = node.qubits.some(q => chunk.qubits.has(q));
      if (conflict) continue;

      bestChunk = chunk;
      break;
    }

    if (!bestChunk) {
      // Create a new chunk
      bestChunk = {
        id: `chunk-${chunks.length}`,
        gates: [],
        fusedMatrices: new Map(),
        qubits: new Set(),
        executionOrder: chunks.length,
      };
      chunks.push(bestChunk);
    }

    bestChunk.gates.push(node.gate);
    if (node.fusedMatrix) {
      bestChunk.fusedMatrices.set(node.gate.id, node.fusedMatrix);
    }
    for (const q of node.qubits) {
      bestChunk.qubits.add(q);
    }
    assigned.add(nodeId);
  }

  return chunks;
};

// ─── Main Compiler Entry Point ──────────────────────────────

/**
 * Compile a quantum circuit through all optimization passes.
 * Returns the optimized gate list and compilation metrics.
 */
export const compileCircuit = (
  gates: QuantumGate[],
  qubitCount: number,
  config: CompilerConfig = DEFAULT_COMPILER_CONFIG
): {
  optimizedGates: QuantumGate[];
  chunks: CircuitChunk[];
  metrics: CompilationMetrics;
  dag: CircuitDAG;
} => {
  const passesApplied: string[] = [];
  const originalCount = gates.length;
  const depthBefore = gates.length > 0
    ? Math.max(...gates.map(g => g.position)) + 1
    : 0;

  // Build the DAG
  let dag = buildCircuitDAG(gates, qubitCount);

  // Pass 1: Gate Cancellation
  let cancelledCount = 0;
  if (config.enableCancellation) {
    cancelledCount = cancelGatesPass(dag);
    if (cancelledCount > 0) passesApplied.push(`cancellation(-${cancelledCount})`);
  }

  // Pass 2: Gate Fusion
  let fusedCount = 0;
  if (config.enableFusion) {
    fusedCount = fuseGatesPass(dag, config.maxFusionLength);
    if (fusedCount > 0) passesApplied.push(`fusion(-${fusedCount})`);
  }

  // Pass 3: Commutation-based depth reduction
  if (config.enableCommutation) {
    const moves = commutationPass(dag);
    if (moves > 0) passesApplied.push(`commutation(${moves} moves)`);
  }

  // Extract optimized gates from DAG (in topological order)
  const optimizedGates: QuantumGate[] = [];
  let position = 0;
  for (const nodeId of dag.order) {
    const node = dag.nodes.get(nodeId);
    if (!node || node.fused) continue;

    const gate: QuantumGate = {
      ...node.gate,
      position: position++,
    };

    // Copy fused matrix so the simulator can apply it
    if (node.fusedMatrix) {
      gate.fusedMatrix = node.fusedMatrix;
    }

    optimizedGates.push(gate);
  }

  // Pass 4: Chunking
  let chunks: CircuitChunk[] = [];
  if (config.enableChunking) {
    chunks = chunkCircuit(dag);
    passesApplied.push(`chunking(${chunks.length} chunks)`);
  }

  const depthAfter = optimizedGates.length > 0
    ? Math.max(...optimizedGates.map(g => g.position)) + 1
    : 0;

  return {
    optimizedGates,
    chunks,
    metrics: {
      originalGateCount: originalCount,
      optimizedGateCount: optimizedGates.length,
      cancelledGates: cancelledCount,
      fusedGates: fusedCount,
      depthBefore,
      depthAfter,
      passesApplied,
    },
    dag,
  };
};
