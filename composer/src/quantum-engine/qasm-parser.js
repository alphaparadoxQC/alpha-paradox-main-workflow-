/**
 * OpenQASM 2.0 Parser & Generator
 * Bidirectional: QASM text ↔ QuantumCircuit
 */

/**
 * Generate OpenQASM 2.0 code from a QuantumCircuit
 */
export function circuitToQASM(circuit) {
  const lines = [];
  lines.push('OPENQASM 2.0;');
  lines.push('include "qelib1.inc";');
  lines.push('');
  lines.push(`qreg q[${circuit.numQubits}];`);
  lines.push(`creg c[${circuit.numClbits}];`);
  lines.push('');

  const ops = circuit.sortedOperations;

  for (const op of ops) {
    const line = operationToQASM(op);
    if (line) lines.push(line);
  }

  return lines.join('\n');
}

export { 
  circuitToHardwareAssembly, 
  circuitToQiskitTranspiled, 
  circuitToOpenPulseSchedule 
} from './transpiled-engine.js';
import { circuitToHardwareAssembly } from './transpiled-engine.js';

/**
 * Generate transpiled hardware code — compiles to authentic Hardware Assembly (eQASM / Cleanroom Micro-Instruction Schedule).
 * Transpiled code targets physical transmons, CPW coupling buses, and microwave pulse timings (NOT OpenQASM).
 */
export function circuitToTranspiledQASM(circuit) {
  return circuitToHardwareAssembly(circuit);
}

/**
 * Decompose a single gate operation into native basis gates: { rz, sx, x, cx }
 * Uses standard decomposition identities from quantum computing.
 */
function decomposeToNative(op) {
  const q = op.qubits;

  switch (op.gate) {
    // Already native
    case 'X': return [`x q[${q[0]}];`];
    case 'SX': return [`sx q[${q[0]}];`];
    case 'RZ': return [`rz(${formatParam(op.params?.theta || 0)}) q[${q[0]}];`];
    case 'CX': return [`cx q[${q[0]}],q[${q[1]}];`];

    // H = rz(pi) · sx · rz(pi)  (up to global phase)
    case 'H': return [
      `rz(pi/2) q[${q[0]}];`,
      `sx q[${q[0]}];`,
      `rz(pi/2) q[${q[0]}];`,
    ];

    // Y = rz(pi) · x
    case 'Y': return [
      `rz(pi) q[${q[0]}];`,
      `x q[${q[0]}];`,
    ];

    // Z = rz(pi)
    case 'Z': return [`rz(pi) q[${q[0]}];`];

    // S = rz(pi/2)
    case 'S': return [`rz(pi/2) q[${q[0]}];`];
    case 'SDG': return [`rz(-pi/2) q[${q[0]}];`];

    // T = rz(pi/4)
    case 'T': return [`rz(pi/4) q[${q[0]}];`];
    case 'TDG': return [`rz(-pi/4) q[${q[0]}];`];

    // RX(θ) = rz(-pi/2) · sx · rz(pi/2)  (for θ=pi/2), general: rz(-pi/2) · rz(θ) · sx · rz(pi/2)
    case 'RX': {
      const theta = op.params?.theta || 0;
      return [
        `rz(pi/2) q[${q[0]}];`,
        `sx q[${q[0]}];`,
        `rz(${formatParam(theta)}) q[${q[0]}];`,
        `sx q[${q[0]}];`,
        `rz(pi/2) q[${q[0]}];`,
      ];
    }

    // RY(θ) = sx · rz(θ) · sdg(sx)  → decompose further
    case 'RY': {
      const theta = op.params?.theta || 0;
      return [
        `rz(pi/2) q[${q[0]}];`,
        `sx q[${q[0]}];`,
        `rz(${formatParam(theta)}) q[${q[0]}];`,
        `sx q[${q[0]}];`,
        `rz(-pi/2) q[${q[0]}];`,
      ];
    }

    // P(λ) = rz(λ)  (Phase gate is equivalent to RZ up to global phase)
    case 'P': return [`rz(${formatParam(op.params?.lambda || 0)}) q[${q[0]}];`];

    // I (identity) — no-op in transpiled output
    case 'I': return [`// id q[${q[0]}]; (optimized away)`];

    // CY = (rz(-pi/2) on target) · cx · (rz(pi/2) on target)
    case 'CY': return [
      `rz(-pi/2) q[${q[1]}];`,
      `cx q[${q[0]}],q[${q[1]}];`,
      `rz(pi/2) q[${q[1]}];`,
    ];

    // CZ = (H on target) · cx · (H on target)
    case 'CZ': return [
      `rz(pi/2) q[${q[1]}];`,
      `sx q[${q[1]}];`,
      `rz(pi/2) q[${q[1]}];`,
      `cx q[${q[0]}],q[${q[1]}];`,
      `rz(pi/2) q[${q[1]}];`,
      `sx q[${q[1]}];`,
      `rz(pi/2) q[${q[1]}];`,
    ];

    // SWAP = cx · cx(reversed) · cx
    case 'SWAP': return [
      `cx q[${q[0]}],q[${q[1]}];`,
      `cx q[${q[1]}],q[${q[0]}];`,
      `cx q[${q[0]}],q[${q[1]}];`,
    ];

    // CCX (Toffoli) — standard decomposition into 6 CX + single-qubit gates
    case 'CCX': return [
      `rz(pi/2) q[${q[2]}];`,
      `sx q[${q[2]}];`,
      `rz(pi/2) q[${q[2]}];`,
      `cx q[${q[1]}],q[${q[2]}];`,
      `rz(-pi/4) q[${q[2]}];`,
      `cx q[${q[0]}],q[${q[2]}];`,
      `rz(pi/4) q[${q[2]}];`,
      `cx q[${q[1]}],q[${q[2]}];`,
      `rz(-pi/4) q[${q[2]}];`,
      `cx q[${q[0]}],q[${q[2]}];`,
      `rz(pi/4) q[${q[1]}];`,
      `rz(pi/4) q[${q[2]}];`,
      `rz(pi/2) q[${q[2]}];`,
      `sx q[${q[2]}];`,
      `rz(pi/2) q[${q[2]}];`,
      `cx q[${q[0]}],q[${q[1]}];`,
      `rz(pi/4) q[${q[0]}];`,
      `rz(-pi/4) q[${q[1]}];`,
      `cx q[${q[0]}],q[${q[1]}];`,
    ];

    // Measurement and barrier pass through
    case 'MEASURE': return [`measure q[${q[0]}] -> c[${op.clbits[0] ?? q[0]}];`];
    case 'BARRIER':
      if (q.length === 1) return [`barrier q[${q[0]}];`];
      return [`barrier ${q.map(qi => `q[${qi}]`).join(',')};`];
    case 'RESET': return [`reset q[${q[0]}];`];

    default: return [`// unknown gate: ${op.gate}`];
  }
}

function operationToQASM(op) {
  const qubits = op.qubits;

  switch (op.gate) {
    case 'H': return `h q[${qubits[0]}];`;
    case 'X': return `x q[${qubits[0]}];`;
    case 'Y': return `y q[${qubits[0]}];`;
    case 'Z': return `z q[${qubits[0]}];`;
    case 'S': return `s q[${qubits[0]}];`;
    case 'SDG': return `sdg q[${qubits[0]}];`;
    case 'T': return `t q[${qubits[0]}];`;
    case 'TDG': return `tdg q[${qubits[0]}];`;
    case 'SX': return `sx q[${qubits[0]}];`;
    case 'I': return `id q[${qubits[0]}];`;

    case 'RX': return `rx(${formatParam(op.params.theta)}) q[${qubits[0]}];`;
    case 'RY': return `ry(${formatParam(op.params.theta)}) q[${qubits[0]}];`;
    case 'RZ': return `rz(${formatParam(op.params.theta)}) q[${qubits[0]}];`;
    case 'P': return `p(${formatParam(op.params.lambda)}) q[${qubits[0]}];`;
    case 'U': return `u(${formatParam(op.params.theta)},${formatParam(op.params.phi)},${formatParam(op.params.lambda)}) q[${qubits[0]}];`;

    case 'CX': return `cx q[${qubits[0]}],q[${qubits[1]}];`;
    case 'CY': return `cy q[${qubits[0]}],q[${qubits[1]}];`;
    case 'CZ': return `cz q[${qubits[0]}],q[${qubits[1]}];`;
    case 'SWAP': return `swap q[${qubits[0]}],q[${qubits[1]}];`;
    case 'CP': return `cp(${formatParam(op.params.theta)}) q[${qubits[0]}],q[${qubits[1]}];`;
    case 'CRZ': return `crz(${formatParam(op.params.theta)}) q[${qubits[0]}],q[${qubits[1]}];`;

    case 'CCX': return `ccx q[${qubits[0]}],q[${qubits[1]}],q[${qubits[2]}];`;
    case 'CSWAP': return `cswap q[${qubits[0]}],q[${qubits[1]}],q[${qubits[2]}];`;

    case 'MEASURE': return `measure q[${qubits[0]}] -> c[${op.clbits[0] ?? qubits[0]}];`;
    case 'BARRIER':
      if (qubits.length === 1) return `barrier q[${qubits[0]}];`;
      return `barrier ${qubits.map(q => `q[${q}]`).join(',')};`;
    case 'RESET': return `reset q[${qubits[0]}];`;

    default: return `// unknown gate: ${op.gate}`;
  }
}

function formatParam(value) {
  if (value === undefined || value === null) return '0';
  // Check for common fractions of pi
  const piRatio = value / Math.PI;
  if (Math.abs(piRatio - 1) < 1e-10) return 'pi';
  if (Math.abs(piRatio + 1) < 1e-10) return '-pi';
  if (Math.abs(piRatio - 0.5) < 1e-10) return 'pi/2';
  if (Math.abs(piRatio - 0.25) < 1e-10) return 'pi/4';
  if (Math.abs(piRatio + 0.5) < 1e-10) return '-pi/2';
  if (Math.abs(piRatio + 0.25) < 1e-10) return '-pi/4';
  return value.toFixed(6).replace(/\.?0+$/, '');
}

/**
 * Generate executable Python code from a QuantumCircuit
 */
export function circuitToPython(circuit) {
  const lines = [];
  lines.push('from alpha import QuantumCircuit, QuantumRegister, ClassicalRegister');
  lines.push('from qiskit_aer import Aer');
  lines.push('import numpy as np');
  lines.push('');
  lines.push("backend = Aer.get_backend('qasm_simulator')");
  lines.push('');
  lines.push('shots = 1024');
  lines.push('');
  lines.push('qc = QuantumCircuit()');
  lines.push('');
  lines.push(`q = QuantumRegister(${circuit.numQubits}, 'q')`);
  lines.push(`c = ClassicalRegister(${circuit.numClbits}, 'c')`);
  lines.push('');
  lines.push('qc.add_register(q)');
  lines.push('qc.add_register(c)');
  lines.push('');

  const ops = circuit.sortedOperations;
  for (const op of ops) {
    const line = operationToPython(op);
    if (line) lines.push(line);
  }

  return lines.join('\n');
}

function operationToPython(op) {
  const q = op.qubits;
  switch (op.gate) {
    case 'H': return `qc.h(q[${q[0]}])`;
    case 'X': return `qc.x(q[${q[0]}])`;
    case 'Y': return `qc.y(q[${q[0]}])`;
    case 'Z': return `qc.z(q[${q[0]}])`;
    case 'S': return `qc.s(q[${q[0]}])`;
    case 'SDG': return `qc.sdg(q[${q[0]}])`;
    case 'T': return `qc.t(q[${q[0]}])`;
    case 'TDG': return `qc.tdg(q[${q[0]}])`;
    case 'SX': return `qc.sx(q[${q[0]}])`;

    case 'RX': return `qc.rx(${op.params.theta}, q[${q[0]}])`;
    case 'RY': return `qc.ry(${op.params.theta}, q[${q[0]}])`;
    case 'RZ': return `qc.rz(${op.params.theta}, q[${q[0]}])`;
    case 'P': return `qc.p(${op.params.lambda}, q[${q[0]}])`;
    case 'U': return `qc.u(${op.params.theta}, ${op.params.phi}, ${op.params.lambda}, q[${q[0]}])`;

    case 'CX': return `qc.cx(q[${q[0]}], q[${q[1]}])`;
    case 'CY': return `qc.cy(q[${q[0]}], q[${q[1]}])`;
    case 'CZ': return `qc.cz(q[${q[0]}], q[${q[1]}])`;
    case 'SWAP': return `qc.swap(q[${q[0]}], q[${q[1]}])`;
    case 'CP': return `qc.cp(${op.params.theta}, q[${q[0]}], q[${q[1]}])`;

    case 'CCX': return `qc.ccx(q[${q[0]}], q[${q[1]}], q[${q[2]}])`;
    case 'CSWAP': return `qc.cswap(q[${q[0]}], q[${q[1]}], q[${q[2]}])`;

    case 'MEASURE': return `qc.measure(q[${q[0]}], c[${op.clbits[0] ?? q[0]}])`;
    case 'BARRIER': return `qc.barrier(${q.map(i => `q[${i}]`).join(', ')})`;
    case 'RESET': return `qc.reset(q[${q[0]}])`;

    default: return `# unknown: ${op.gate}`;
  }
}

import { QuantumCircuit } from './circuit.js';

/**
 * Parse OpenQASM 2.0 text into a QuantumCircuit (simplified parser)
 */
export function qasmToCircuit(qasmText) {

  const lines = qasmText.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));

  let numQubits = 5, numClbits = 3;

  // First pass: extract register sizes
  for (const line of lines) {
    const qregMatch = line.match(/qreg\s+\w+\[(\d+)\]/);
    if (qregMatch) numQubits = parseInt(qregMatch[1]);
    const cregMatch = line.match(/creg\s+\w+\[(\d+)\]/);
    if (cregMatch) numClbits = parseInt(cregMatch[1]);
  }

  const qc = new QuantumCircuit(numQubits, numClbits);

  // Second pass: parse gates
  for (const line of lines) {
    if (line.startsWith('OPENQASM') || line.startsWith('include') ||
        line.startsWith('qreg') || line.startsWith('creg')) continue;

    parseGateLine(qc, line);
  }

  return qc;
}

function parseGateLine(qc, line) {
  // Match: gate_name(params) qubit_args;
  const match = line.match(/^(\w+)(?:\(([^)]*)\))?\s+(.+);$/);
  if (!match) return;

  const [, gateName, paramsStr, argsStr] = match;
  const params = paramsStr ? paramsStr.split(',').map(p => {
    p = p.trim();
    if (p === 'pi') return Math.PI;
    if (p === '-pi') return -Math.PI;
    if (p === 'pi/2') return Math.PI / 2;
    if (p === 'pi/4') return Math.PI / 4;
    return parseFloat(p);
  }) : [];

  const qubits = [];
  const clbits = [];
  const argParts = argsStr.split(/->/).map(s => s.trim());

  // Parse qubit args
  const qmatches = argParts[0].matchAll(/\w+\[(\d+)\]/g);
  for (const m of qmatches) qubits.push(parseInt(m[1]));

  // Parse classical args (after ->)
  if (argParts[1]) {
    const cmatches = argParts[1].matchAll(/\w+\[(\d+)\]/g);
    for (const m of cmatches) clbits.push(parseInt(m[1]));
  }

  const gateMap = {
    h: 'H', x: 'X', y: 'Y', z: 'Z', s: 'S', sdg: 'SDG',
    t: 'T', tdg: 'TDG', sx: 'SX', id: 'I',
    cx: 'CX', cy: 'CY', cz: 'CZ', swap: 'SWAP',
    ccx: 'CCX', cswap: 'CSWAP',
    rx: 'RX', ry: 'RY', rz: 'RZ', p: 'P', u: 'U',
    cp: 'CP', crz: 'CRZ',
    measure: 'MEASURE', barrier: 'BARRIER', reset: 'RESET'
  };

  const internalName = gateMap[gateName.toLowerCase()];
  if (!internalName) return;

  const paramObj = {};
  switch (internalName) {
    case 'RX': case 'RY': case 'RZ': paramObj.theta = params[0]; break;
    case 'P': paramObj.lambda = params[0]; break;
    case 'U': paramObj.theta = params[0]; paramObj.phi = params[1]; paramObj.lambda = params[2]; break;
    case 'CP': case 'CRZ': paramObj.theta = params[0]; break;
  }

  qc.addGate(internalName, qubits.length === 1 ? qubits[0] : qubits, paramObj, clbits.length > 0 ? clbits : []);
}

export function circuitToCirq(circuit) {
  const lines = [];
  lines.push('import cirq');
  lines.push('import numpy as np');
  lines.push('from functools import reduce');
  lines.push('');
  lines.push(`q = [cirq.NamedQubit('q' + str(i)) for i in range(${circuit.numQubits})]`);
  lines.push('');
  lines.push('circuit = cirq.Circuit(');

  const ops = circuit.sortedOperations;
  for (const op of ops) {
    const q = op.qubits;
    switch (op.gate) {
      case 'H': lines.push(`    cirq.H(q[${q[0]}]),`); break;
      case 'X': lines.push(`    cirq.X(q[${q[0]}]),`); break;
      case 'Y': lines.push(`    cirq.Y(q[${q[0]}]),`); break;
      case 'Z': lines.push(`    cirq.Z(q[${q[0]}]),`); break;
      case 'S': lines.push(`    cirq.S(q[${q[0]}]),`); break;
      case 'T': lines.push(`    cirq.T(q[${q[0]}]),`); break;
      case 'CX': lines.push(`    cirq.CNOT(q[${q[0]}], q[${q[1]}]),`); break;
      case 'CZ': lines.push(`    cirq.CZ(q[${q[0]}], q[${q[1]}]),`); break;
      case 'SWAP': lines.push(`    cirq.SWAP(q[${q[0]}], q[${q[1]}]),`); break;
      case 'MEASURE': lines.push(`    cirq.measure(q[${q[0]}], key='q${op.clbits[0] ?? q[0]}'),`); break;
      default: lines.push(`    # cirq.${op.gate}(...),`); break;
    }
  }
  lines.push(')');
  lines.push('');
  lines.push('simulator = cirq.Simulator()');
  lines.push('result = simulator.run(circuit, repetitions=1024)');
  lines.push(`result_dict = dict(result.multi_measurement_histogram(keys=['q'+str(i) for i in range(${circuit.numQubits})]))`);
  return lines.join('\n');
}

export function circuitToCudaQ(circuit) {
  const lines = [];
  lines.push('import cudaq');
  lines.push('');
  lines.push('@cudaq.kernel');
  lines.push('def kernel():');
  lines.push(`    q = cudaq.qvector(${circuit.numQubits})`);
  const ops = circuit.sortedOperations;
  for (const op of ops) {
    const q = op.qubits;
    const gate = op.gate.toLowerCase();
    switch (op.gate) {
      case 'H': case 'X': case 'Y': case 'Z': case 'S': case 'T':
        lines.push(`    ${gate}(q[${q[0]}])`); break;
      case 'CX': lines.push(`    x.ctrl(q[${q[0]}], q[${q[1]}])`); break;
      case 'CZ': lines.push(`    z.ctrl(q[${q[0]}], q[${q[1]}])`); break;
      case 'MEASURE': lines.push(`    mz(q[${q[0]}])`); break;
      default: lines.push(`    # ${gate}(q[...])`); break;
    }
  }
  return lines.join('\n');
}

export function circuitToQulacs(circuit) {
  const lines = [];
  lines.push('import qulacs');
  lines.push('from qulacs import QuantumCircuit, QuantumState');
  lines.push('from qulacs.gate import *');
  lines.push('from collections import Counter');
  lines.push('from mpi4py import MPI');
  lines.push('import numpy as np');
  lines.push('import json');
  lines.push('');
  lines.push('mpicomm = MPI.COMM_WORLD');
  lines.push('mpirank = mpicomm.Get_rank()');
  lines.push('mpisize = mpicomm.Get_size()');
  lines.push('globalqubits = int(np.log2(mpisize))');
  lines.push('');
  lines.push(`nqubits = ${circuit.numQubits}`);
  lines.push(`state = QuantumState(nqubits)`);
  lines.push(`state.set_zero_state()`);
  lines.push('');
  lines.push(`circuit = QuantumCircuit(nqubits)`);
  const ops = circuit.sortedOperations;
  for (const op of ops) {
    const q = op.qubits;
    const gate = op.gate;
    switch (op.gate) {
      case 'H': lines.push(`circuit.add_H_gate(${q[0]})`); break;
      case 'X': lines.push(`circuit.add_X_gate(${q[0]})`); break;
      case 'Y': lines.push(`circuit.add_Y_gate(${q[0]})`); break;
      case 'Z': lines.push(`circuit.add_Z_gate(${q[0]})`); break;
      case 'S': lines.push(`circuit.add_S_gate(${q[0]})`); break;
      case 'T': lines.push(`circuit.add_T_gate(${q[0]})`); break;
      case 'CX': lines.push(`circuit.add_CNOT_gate(${q[0]}, ${q[1]})`); break;
      case 'CZ': lines.push(`circuit.add_CZ_gate(${q[0]}, ${q[1]})`); break;
      case 'SWAP': lines.push(`circuit.add_SWAP_gate(${q[0]}, ${q[1]})`); break;
      case 'MEASURE': lines.push(`# Measurement not natively added to circuit in Qulacs`); break;
      default: lines.push(`# circuit.add_${gate}_gate(...)`); break;
    }
  }
  lines.push('');
  lines.push('circuit.update_quantum_state(state)');
  return lines.join('\n');
}

export function circuitToQuEst(circuit) {
  const lines = [];
  lines.push('#include <stdio.h>');
  lines.push('#include <stdlib.h>');
  lines.push('#include <math.h>');
  lines.push('#include "QuEST.h"');
  lines.push('');
  lines.push('#ifndef pi');
  lines.push('#define pi 3.14159265');
  lines.push('#endif');
  lines.push('');
  lines.push('int main(int argc, char *argv[]) {');
  lines.push('    QuESTEnv env = createQuESTEnv();');
  lines.push(`    int numQubits = ${circuit.numQubits};`);
  lines.push('    Qureg qubits = createQureg(numQubits, env);');
  lines.push(`    int measured[${circuit.numQubits}];`);
  lines.push('    initZeroState(qubits);');
  lines.push('');
  
  const ops = circuit.sortedOperations;
  for (const op of ops) {
    const q = op.qubits;
    const gate = op.gate;
    switch (op.gate) {
      case 'H': lines.push(`    hadamard(qubits, ${q[0]});`); break;
      case 'X': lines.push(`    pauliX(qubits, ${q[0]});`); break;
      case 'Y': lines.push(`    pauliY(qubits, ${q[0]});`); break;
      case 'Z': lines.push(`    pauliZ(qubits, ${q[0]});`); break;
      case 'S': lines.push(`    sGate(qubits, ${q[0]});`); break;
      case 'T': lines.push(`    tGate(qubits, ${q[0]});`); break;
      case 'CX': lines.push(`    controlledNot(qubits, ${q[0]}, ${q[1]});`); break;
      case 'MEASURE': lines.push(`    // measure(qubits, ${q[0]});`); break;
      default: lines.push(`    // ${gate}(qubits, ...);`); break;
    }
  }
  lines.push('    destroyQureg(qubits, env);');
  lines.push('    destroyQuESTEnv(env);');
  lines.push('    return 0;');
  lines.push('}');
  return lines.join('\n');
}
