/**
 * Gate decomposition to native gate set {Rz, SX, CNOT}
 * 
 * SX = √X, so X = SX·SX, H ≈ Rz(π)·SX·Rz(π), etc.
 */

import { QuantumGate } from '@/types/quantum';

export interface DecomposedGate {
  type: 'Rz' | 'SX' | 'CNOT';
  qubit: number;
  position: number;
  controlQubit?: number;
  angle?: number; // only for Rz
  originalGateId?: string;
}

let posCounter = 0;

const rz = (qubit: number, angle: number, origId?: string): DecomposedGate => ({
  type: 'Rz', qubit, position: posCounter++, angle, originalGateId: origId,
});

const sx = (qubit: number, origId?: string): DecomposedGate => ({
  type: 'SX', qubit, position: posCounter++, originalGateId: origId,
});

const cnot = (control: number, target: number, origId?: string): DecomposedGate => ({
  type: 'CNOT', qubit: target, controlQubit: control, position: posCounter++, originalGateId: origId,
});

/**
 * Decompose a single gate into native {Rz, SX, CNOT} gates
 */
export function decomposeGate(gate: QuantumGate): DecomposedGate[] {
  const q = gate.qubit;
  const id = gate.id;
  const angle = gate.angle ?? Math.PI / 2;

  switch (gate.type) {
    // Already native
    case 'Rz':
      return [rz(q, gate.angle ?? Math.PI / 2, id)];

    // SX is native
    // X = SX · SX
    case 'X':
      return [sx(q, id), sx(q, id)];

    // H = Rz(π) · SX · Rz(π)
    case 'H':
      return [rz(q, Math.PI, id), sx(q, id), rz(q, Math.PI, id)];

    // Y = SX · SX · Rz(π)  (= X · Rz(π) up to global phase)
    case 'Y':
      return [sx(q, id), sx(q, id), rz(q, Math.PI, id)];

    // Z = Rz(π)
    case 'Z':
      return [rz(q, Math.PI, id)];

    // S = Rz(π/2)
    case 'S':
      return [rz(q, Math.PI / 2, id)];

    // T = Rz(π/4)
    case 'T':
      return [rz(q, Math.PI / 4, id)];

    // Rx(θ) = Rz(-π/2) · SX · Rz(π/2 + θ) · SX · Rz(-π)  (simplified)
    // More practical: Rz(π/2) · SX · Rz(θ + π) · SX · Rz(π/2)  
    // Simplest valid: H·Rz(θ)·H but H itself needs decomposing.
    // Use: Rz(-π/2)·SX·Rz(π-θ)·SX·Rz(-π/2)
    case 'Rx':
      return [
        rz(q, -Math.PI / 2, id),
        sx(q, id),
        rz(q, Math.PI - angle, id),
        sx(q, id),
        rz(q, -Math.PI / 2, id),
      ];

    // Ry(θ) = SX · Rz(θ) · SX† = SX · Rz(θ) · Rz(π) · SX · Rz(π)
    // Simpler: Rz(π/2) · SX · Rz(θ + π) · SX · Rz(-π/2)  
    case 'Ry':
      return [
        rz(q, Math.PI / 2, id),
        sx(q, id),
        rz(q, angle + Math.PI, id),
        sx(q, id),
        rz(q, -Math.PI / 2, id),
      ];

    // CNOT is native
    case 'CNOT': {
      const ctrl = gate.controlQubit ?? (q > 0 ? q - 1 : q + 1);
      return [cnot(ctrl, q, id)];
    }

    // CZ = (I⊗H) · CNOT · (I⊗H)
    case 'CZ': {
      const ctrl = gate.controlQubit ?? (q > 0 ? q - 1 : q + 1);
      return [
        // H on target
        rz(q, Math.PI, id), sx(q, id), rz(q, Math.PI, id),
        cnot(ctrl, q, id),
        rz(q, Math.PI, id), sx(q, id), rz(q, Math.PI, id),
      ];
    }

    // SWAP = 3 CNOTs
    case 'SWAP': {
      const target = gate.targetQubit ?? (q > 0 ? q - 1 : q + 1);
      return [
        cnot(q, target, id),
        cnot(target, q, id),
        cnot(q, target, id),
      ];
    }

    // CCX (Toffoli) decomposition (standard 6-CNOT decomposition)
    case 'CCX': {
      const ctrl1 = gate.controlQubit ?? (q > 0 ? q - 1 : q + 1);
      const ctrl2 = gate.controlQubit2 ?? (ctrl1 > 0 ? ctrl1 - 1 : ctrl1 + 2);
      return [
        // Simplified Toffoli decomposition
        rz(q, Math.PI, id), sx(q, id), rz(q, Math.PI, id), // H target
        cnot(ctrl2, q, id),
        rz(q, -Math.PI / 4, id), // Tdg
        cnot(ctrl1, q, id),
        rz(q, Math.PI / 4, id), // T
        cnot(ctrl2, q, id),
        rz(q, -Math.PI / 4, id), // Tdg
        cnot(ctrl1, q, id),
        rz(ctrl2, Math.PI / 4, id), // T on ctrl2
        rz(q, Math.PI / 4, id), // T on target
        rz(q, Math.PI, id), sx(q, id), rz(q, Math.PI, id), // H target
        cnot(ctrl1, ctrl2, id),
        rz(ctrl1, Math.PI / 4, id), // T
        rz(ctrl2, -Math.PI / 4, id), // Tdg
        cnot(ctrl1, ctrl2, id),
      ];
    }

    // Measurement - pass through (not a unitary gate)
    case 'M':
      return [];

    // Default: treat unknown gates as identity (skip)
    default:
      return [rz(q, 0, id)]; // identity Rz(0)
  }
}

/**
 * Decompose an entire circuit
 */
export function decomposeCircuit(gates: QuantumGate[]): DecomposedGate[] {
  posCounter = 0;
  const result: DecomposedGate[] = [];
  
  // Sort gates by position first
  const sorted = [...gates].sort((a, b) => a.position - b.position);
  
  for (const gate of sorted) {
    result.push(...decomposeGate(gate));
  }
  
  // Re-number positions sequentially
  result.forEach((g, i) => { g.position = i; });
  
  return result;
}
