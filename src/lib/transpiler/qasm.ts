/**
 * OpenQASM 2.0 export and validation
 */

import { DecomposedGate } from './decompose';

/**
 * Generate OpenQASM 2.0 string from decomposed circuit
 */
export function toOpenQASM(
  gates: DecomposedGate[],
  qubitCount: number,
  comment?: string
): string {
  const lines: string[] = [
    'OPENQASM 2.0;',
    'include "qelib1.inc";',
    '',
  ];
  
  if (comment) {
    lines.push(`// ${comment}`);
  }
  
  lines.push(`qreg q[${qubitCount}];`);
  lines.push(`creg c[${qubitCount}];`);
  lines.push('');
  
  for (const gate of gates) {
    switch (gate.type) {
      case 'Rz':
        lines.push(`rz(${formatAngle(gate.angle ?? 0)}) q[${gate.qubit}];`);
        break;
      case 'SX':
        lines.push(`sx q[${gate.qubit}];`);
        break;
      case 'CNOT':
        lines.push(`cx q[${gate.controlQubit ?? 0}],q[${gate.qubit}];`);
        break;
    }
  }
  
  // Add measurements at the end
  lines.push('');
  for (let i = 0; i < qubitCount; i++) {
    lines.push(`measure q[${i}] -> c[${i}];`);
  }
  
  lines.push('');
  return lines.join('\n');
}

function formatAngle(angle: number): string {
  // Check for common multiples of π
  const ratio = angle / Math.PI;
  if (Math.abs(ratio - 1) < 1e-10) return 'pi';
  if (Math.abs(ratio + 1) < 1e-10) return '-pi';
  if (Math.abs(ratio - 0.5) < 1e-10) return 'pi/2';
  if (Math.abs(ratio + 0.5) < 1e-10) return '-pi/2';
  if (Math.abs(ratio - 0.25) < 1e-10) return 'pi/4';
  if (Math.abs(ratio + 0.25) < 1e-10) return '-pi/4';
  return angle.toFixed(8);
}

export interface QASMValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate OpenQASM 2.0 syntax
 */
export function validateQASM(qasm: string): QASMValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lines = qasm.split('\n');
  
  // Check header
  if (!lines[0]?.trim().startsWith('OPENQASM 2.0')) {
    errors.push('Missing OPENQASM 2.0 header');
  }
  
  // Check for include
  const hasInclude = lines.some(l => l.trim().startsWith('include'));
  if (!hasInclude) {
    warnings.push('Missing include "qelib1.inc" statement');
  }
  
  // Check for qreg
  const qregMatch = qasm.match(/qreg\s+(\w+)\[(\d+)\]/);
  if (!qregMatch) {
    errors.push('Missing qreg declaration');
  }
  
  // Check for creg
  const cregMatch = qasm.match(/creg\s+(\w+)\[(\d+)\]/);
  if (!cregMatch) {
    warnings.push('Missing creg declaration');
  }
  
  // Validate gate statements
  const gatePattern = /^(rz|sx|cx|measure)\b/;
  const validLine = /^(OPENQASM|include|qreg|creg|rz|sx|cx|x|h|s|t|measure|barrier|\/\/|\s*$)/;
  
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed && !validLine.test(trimmed)) {
      // Not necessarily an error for qelib1 gates
      if (!trimmed.endsWith(';') && !trimmed.startsWith('//') && trimmed.length > 0) {
        warnings.push(`Line ${i + 1}: Possible syntax issue: "${trimmed}"`);
      }
    }
    
    // Check qubit indices
    const qubitRefs = [...trimmed.matchAll(/q\[(\d+)\]/g)];
    if (qregMatch) {
      const maxQubit = parseInt(qregMatch[2]);
      for (const ref of qubitRefs) {
        if (parseInt(ref[1]) >= maxQubit) {
          errors.push(`Line ${i + 1}: Qubit index ${ref[1]} exceeds qreg size ${maxQubit}`);
        }
      }
    }
  }
  
  return { valid: errors.length === 0, errors, warnings };
}
