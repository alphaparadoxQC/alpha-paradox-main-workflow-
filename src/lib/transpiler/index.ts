/**
 * Transpiler pipeline: decompose → route → optimize → export QASM
 */

export { HARDWARE_BACKENDS, type HardwareBackend } from './backends';
export { decomposeCircuit, decomposeGate, type DecomposedGate } from './decompose';
export { routeCircuit, type RoutingResult } from './routing';
export { optimizeCircuit } from './optimize';
export { toOpenQASM, validateQASM, type QASMValidationResult } from './qasm';

import { QuantumGate } from '@/types/quantum';
import { HardwareBackend } from './backends';
import { decomposeCircuit, DecomposedGate } from './decompose';
import { routeCircuit } from './routing';
import { optimizeCircuit } from './optimize';
import { toOpenQASM, validateQASM, QASMValidationResult } from './qasm';

export interface TranspilationResult {
  // Original circuit info
  originalGateCount: number;
  originalDepth: number;
  
  // After decomposition
  decomposed: DecomposedGate[];
  decomposedGateCount: number;
  
  // After routing
  routed: DecomposedGate[];
  routedGateCount: number;
  swapCount: number;
  
  // After optimization
  optimized: DecomposedGate[];
  optimizedGateCount: number;
  optimizedDepth: number;
  
  // Metrics
  cnotCount: number;
  singleQubitCount: number;
  
  // QASM
  qasm: string;
  qasmValidation: QASMValidationResult;
  
  // Timing
  transpileTimeMs: number;
}

/**
 * Run the full transpilation pipeline
 */
export function transpileCircuit(
  gates: QuantumGate[],
  qubitCount: number,
  backend: HardwareBackend
): TranspilationResult {
  const start = performance.now();
  
  // Original metrics
  const originalGateCount = gates.length;
  const originalDepth = gates.length > 0
    ? Math.max(...gates.map(g => g.position)) + 1
    : 0;
  
  // Step 1: Decompose to native gate set
  const decomposed = decomposeCircuit(gates);
  
  // Step 2: Route onto hardware topology
  const routing = routeCircuit(decomposed, backend);
  
  // Step 3: Optimize
  const optimized = optimizeCircuit(routing.gates);
  
  // Calculate metrics
  const cnotCount = optimized.filter(g => g.type === 'CNOT').length;
  const singleQubitCount = optimized.filter(g => g.type !== 'CNOT').length;
  const optimizedDepth = optimized.length > 0
    ? Math.max(...optimized.map(g => g.position)) + 1
    : 0;
  
  // Step 4: Generate QASM
  const effectiveQubits = Math.max(qubitCount, backend.qubitCount);
  const qasm = toOpenQASM(optimized, effectiveQubits, 
    `Transpiled for ${backend.name} by Alpha ParadoxQC`);
  
  // Step 5: Validate
  const qasmValidation = validateQASM(qasm);
  
  const end = performance.now();
  
  return {
    originalGateCount,
    originalDepth,
    decomposed,
    decomposedGateCount: decomposed.length,
    routed: routing.gates,
    routedGateCount: routing.gates.length,
    swapCount: routing.swapCount,
    optimized,
    optimizedGateCount: optimized.length,
    optimizedDepth,
    cnotCount,
    singleQubitCount,
    qasm,
    qasmValidation,
    transpileTimeMs: end - start,
  };
}
