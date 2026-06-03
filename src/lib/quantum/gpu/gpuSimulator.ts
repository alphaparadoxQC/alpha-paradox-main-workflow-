/**
 * ============================================================
 * GPU State-Vector Quantum Circuit Simulator
 * ============================================================
 * Implements quantum gate operations as WebGPU compute shaders.
 * Each gate is a dispatch of parallel GPU threads, where each
 * thread updates one amplitude pair.
 *
 * Architecture:
 * - Two state buffers (ping-pong): stateA ↔ stateB
 * - One uniform buffer for gate matrix + parameters
 * - Compute pipelines for: single-qubit, CNOT, SWAP, CZ, Toffoli
 * - Probability + Bloch vector readback after simulation
 * ============================================================
 */

import { WebGPUDriver } from './webgpuDriver';
import { QuantumGate } from '@/types/quantum';
import { getGateMatrix } from '../gates';
import { BitOrder, formatBasisStateLabel, getBitPosition } from '../bitOrder';
import { Complex } from '../complex';

// ─── WGSL Shader Code (inline) ──────────────────────────────

const QUANTUM_SHADER_CODE = /* wgsl */`
// Complex number helpers — stored as vec2<f32>(re, im)
fn cmul(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
    return vec2<f32>(
        a.x * b.x - a.y * b.y,
        a.x * b.y + a.y * b.x
    );
}

fn cadd(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
    return a + b;
}

struct Uniforms {
    // Gate matrix (2×2 complex = 8 floats)
    g00_re: f32, g00_im: f32,
    g01_re: f32, g01_im: f32,
    g10_re: f32, g10_im: f32,
    g11_re: f32, g11_im: f32,
    // Parameters
    target_qubit: u32,
    qubit_count: u32,
    num_states: u32,
    // For two-qubit gates
    control_qubit: u32,
    // For Toffoli
    control2_qubit: u32,
    _pad1: u32,
    _pad2: u32,
    _pad3: u32,
};

@group(0) @binding(0) var<storage, read> state_in: array<vec2<f32>>;
@group(0) @binding(1) var<storage, read_write> state_out: array<vec2<f32>>;
@group(0) @binding(2) var<uniform> u: Uniforms;

// ─── Single-Qubit Gate ──────────────────────────────
@compute @workgroup_size(256)
fn apply_single_qubit_gate(@builtin(global_invocation_id) id: vec3<u32>) {
    let index = id.x;
    if (index >= u.num_states) { return; }

    let bit_pos = u.target_qubit;
    let partner = index ^ (1u << bit_pos);

    // Only process each pair once
    if (index > partner) {
        return;
    }

    let g00 = vec2<f32>(u.g00_re, u.g00_im);
    let g01 = vec2<f32>(u.g01_re, u.g01_im);
    let g10 = vec2<f32>(u.g10_re, u.g10_im);
    let g11 = vec2<f32>(u.g11_re, u.g11_im);

    // Determine which is |0⟩ and |1⟩
    let target_bit = (index >> bit_pos) & 1u;
    var idx0: u32;
    var idx1: u32;
    if (target_bit == 0u) {
        idx0 = index;
        idx1 = partner;
    } else {
        idx0 = partner;
        idx1 = index;
    }

    let alpha = state_in[idx0];
    let beta = state_in[idx1];

    state_out[idx0] = cadd(cmul(g00, alpha), cmul(g01, beta));
    state_out[idx1] = cadd(cmul(g10, alpha), cmul(g11, beta));
}

// ─── CNOT Gate ──────────────────────────────────────
@compute @workgroup_size(256)
fn apply_cnot(@builtin(global_invocation_id) id: vec3<u32>) {
    let index = id.x;
    if (index >= u.num_states) { return; }

    let control_pos = u.control_qubit;
    let target_pos = u.target_qubit;

    let control_bit = (index >> control_pos) & 1u;

    if (control_bit == 1u) {
        let flipped = index ^ (1u << target_pos);
        if (index < flipped) {
            state_out[index] = state_in[flipped];
            state_out[flipped] = state_in[index];
        } else {
            // Already handled by partner thread
            return;
        }
    } else {
        state_out[index] = state_in[index];
    }
}

// ─── SWAP Gate ──────────────────────────────────────
@compute @workgroup_size(256)
fn apply_swap(@builtin(global_invocation_id) id: vec3<u32>) {
    let index = id.x;
    if (index >= u.num_states) { return; }

    let bit1_pos = u.control_qubit;
    let bit2_pos = u.target_qubit;

    let bit1 = (index >> bit1_pos) & 1u;
    let bit2 = (index >> bit2_pos) & 1u;

    if (bit1 != bit2) {
        let swapped = index ^ (1u << bit1_pos) ^ (1u << bit2_pos);
        if (index < swapped) {
            state_out[index] = state_in[swapped];
            state_out[swapped] = state_in[index];
        } else {
            return;
        }
    } else {
        state_out[index] = state_in[index];
    }
}

// ─── CZ Gate ────────────────────────────────────────
@compute @workgroup_size(256)
fn apply_cz(@builtin(global_invocation_id) id: vec3<u32>) {
    let index = id.x;
    if (index >= u.num_states) { return; }

    let control_pos = u.control_qubit;
    let target_pos = u.target_qubit;

    let control_bit = (index >> control_pos) & 1u;
    let target_bit = (index >> target_pos) & 1u;

    if (control_bit == 1u && target_bit == 1u) {
        // Negate amplitude: multiply by -1
        state_out[index] = vec2<f32>(-state_in[index].x, -state_in[index].y);
    } else {
        state_out[index] = state_in[index];
    }
}

// ─── Toffoli (CCX) Gate ─────────────────────────────
@compute @workgroup_size(256)
fn apply_toffoli(@builtin(global_invocation_id) id: vec3<u32>) {
    let index = id.x;
    if (index >= u.num_states) { return; }

    let c1_pos = u.control_qubit;
    let c2_pos = u.control2_qubit;
    let target_pos = u.target_qubit;

    let c1_bit = (index >> c1_pos) & 1u;
    let c2_bit = (index >> c2_pos) & 1u;

    if (c1_bit == 1u && c2_bit == 1u) {
        let flipped = index ^ (1u << target_pos);
        if (index < flipped) {
            state_out[index] = state_in[flipped];
            state_out[flipped] = state_in[index];
        } else {
            return;
        }
    } else {
        state_out[index] = state_in[index];
    }
}

// ─── Copy (identity pass for unhandled gates) ───────
@compute @workgroup_size(256)
fn copy_state(@builtin(global_invocation_id) id: vec3<u32>) {
    let index = id.x;
    if (index >= u.num_states) { return; }
    state_out[index] = state_in[index];
}
`;

// ─── GPU Simulator Class ────────────────────────────────────

interface GPUPipelines {
  singleQubit: GPUComputePipeline;
  cnot: GPUComputePipeline;
  swap: GPUComputePipeline;
  cz: GPUComputePipeline;
  toffoli: GPUComputePipeline;
  copy: GPUComputePipeline;
}

export class GPUStateVectorSimulator {
  private driver: WebGPUDriver;
  private pipelines: GPUPipelines | null = null;
  private bindGroupLayout: GPUBindGroupLayout | null = null;

  constructor() {
    this.driver = WebGPUDriver.getInstance();
  }

  /**
   * Initialize pipelines (idempotent — only compiles once)
   */
  async init(): Promise<boolean> {
    const ready = await this.driver.initialize();
    if (!ready) return false;
    if (this.pipelines) return true;

    const device = this.driver.getDevice()!;
    const shaderModule = this.driver.createShaderModule(QUANTUM_SHADER_CODE, 'quantum-shaders');

    // Shared bind group layout for all pipelines
    this.bindGroupLayout = device.createBindGroupLayout({
      label: 'quantum-bind-group-layout',
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    });

    const pipelineLayout = device.createPipelineLayout({
      label: 'quantum-pipeline-layout',
      bindGroupLayouts: [this.bindGroupLayout],
    });

    const createPipeline = (entryPoint: string): GPUComputePipeline =>
      device.createComputePipeline({
        label: `pipeline-${entryPoint}`,
        layout: pipelineLayout,
        compute: { module: shaderModule, entryPoint },
      });

    this.pipelines = {
      singleQubit: createPipeline('apply_single_qubit_gate'),
      cnot: createPipeline('apply_cnot'),
      swap: createPipeline('apply_swap'),
      cz: createPipeline('apply_cz'),
      toffoli: createPipeline('apply_toffoli'),
      copy: createPipeline('copy_state'),
    };

    return true;
  }

  /**
   * Run a full quantum circuit simulation on the GPU.
   */
  async simulate(
    gates: QuantumGate[],
    qubitCount: number,
    bitOrder: BitOrder = 'MSB'
  ): Promise<{
    probabilities: { state: string; probability: number }[];
    blochVectors: { x: number; y: number; z: number }[];
    stateVector: { amplitudes: Complex[]; qubitCount: number };
    amplitudes: { state: string; re: number; im: number; magnitude: number; phase: number }[];
    circuitDepth: number;
  }> {
    if (!this.pipelines || !this.bindGroupLayout) {
      throw new Error('GPU simulator not initialized');
    }

    const device = this.driver.getDevice()!;
    const numStates = Math.pow(2, qubitCount);
    const bufferSize = numStates * 2 * 4; // 2 floats per complex, 4 bytes per float

    // Create ping-pong state buffers
    const stateA = this.driver.createStateBuffer(qubitCount, 'state-A');
    const stateB = this.driver.createStateBuffer(qubitCount, 'state-B');
    const uniformBuffer = this.driver.createUniformBuffer();

    // Initialize |00...0⟩: amplitude[0] = (1, 0), rest = (0, 0)
    const initData = new Float32Array(numStates * 2);
    initData[0] = 1.0; // Re(amplitude[0]) = 1
    initData[1] = 0.0; // Im(amplitude[0]) = 0
    this.driver.writeBuffer(stateA, initData);

    // Clear stateB
    const zeroData = new Float32Array(numStates * 2);
    this.driver.writeBuffer(stateB, zeroData);

    // Track which buffer is "current"
    let currentIsA = true;
    const workgroupCount = Math.ceil(numStates / 256);

    // Sort gates by position
    const sortedGates = [...gates].sort((a, b) => a.position - b.position);

    // Apply each gate
    for (const gate of sortedGates) {
      if (gate.type === 'M' || gate.type === 'DISPLAY') continue;

      const inBuffer = currentIsA ? stateA : stateB;
      const outBuffer = currentIsA ? stateB : stateA;

      // Select pipeline and write uniforms
      let pipeline: GPUComputePipeline;
      const uniformData = new Float32Array(16); // 64 bytes

      switch (gate.type) {
        case 'H':
        case 'X':
        case 'Y':
        case 'Z':
        case 'S':
        case 'T':
        case 'Sdg':
        case 'S†':
        case 'Tdg':
        case 'T†':
        case 'SX':
        case 'SXdg':
        case 'SX†':
        case 'Rx':
        case 'Ry':
        case 'Rz': {
          pipeline = this.pipelines.singleQubit;
          const matrix = getGateMatrix(gate.type, gate.angle);
          uniformData[0] = matrix[0][0].re; uniformData[1] = matrix[0][0].im;
          uniformData[2] = matrix[0][1].re; uniformData[3] = matrix[0][1].im;
          uniformData[4] = matrix[1][0].re; uniformData[5] = matrix[1][0].im;
          uniformData[6] = matrix[1][1].re; uniformData[7] = matrix[1][1].im;
          const bitPos = getBitPosition(qubitCount, gate.qubit, bitOrder);
          uniformData[8] = bitPos;  // target_qubit (as float, read as u32 in shader)
          uniformData[9] = qubitCount;
          uniformData[10] = numStates;
          break;
        }
        case 'FUSED': {
          if (gate.fusedMatrix) {
            pipeline = this.pipelines.singleQubit;
            const fm = gate.fusedMatrix;
            uniformData[0] = fm[0][0].re; uniformData[1] = fm[0][0].im;
            uniformData[2] = fm[0][1].re; uniformData[3] = fm[0][1].im;
            uniformData[4] = fm[1][0].re; uniformData[5] = fm[1][0].im;
            uniformData[6] = fm[1][1].re; uniformData[7] = fm[1][1].im;
            const fusedBitPos = getBitPosition(qubitCount, gate.qubit, bitOrder);
            uniformData[8] = fusedBitPos;
            uniformData[9] = qubitCount;
            uniformData[10] = numStates;
          } else {
            pipeline = this.pipelines.copy;
            uniformData[10] = numStates;
          }
          break;
        }
        case 'CNOT': {
          pipeline = this.pipelines.cnot;
          const controlPos = getBitPosition(qubitCount, gate.qubit, bitOrder);
          const targetPos = getBitPosition(qubitCount, gate.targetQubit ?? (gate.qubit + 1) % qubitCount, bitOrder);
          uniformData[8] = targetPos;   // target_qubit
          uniformData[9] = qubitCount;
          uniformData[10] = numStates;
          uniformData[11] = controlPos;  // control_qubit
          break;
        }
        case 'SWAP': {
          pipeline = this.pipelines.swap;
          const q1Pos = getBitPosition(qubitCount, gate.qubit, bitOrder);
          const q2Pos = getBitPosition(qubitCount, gate.targetQubit ?? (gate.qubit + 1) % qubitCount, bitOrder);
          uniformData[8] = q2Pos;      // target_qubit
          uniformData[9] = qubitCount;
          uniformData[10] = numStates;
          uniformData[11] = q1Pos;     // control_qubit (used as bit1)
          break;
        }
        case 'CZ': {
          pipeline = this.pipelines.cz;
          const czControlPos = getBitPosition(qubitCount, gate.qubit, bitOrder);
          const czTargetPos = getBitPosition(qubitCount, gate.targetQubit ?? (gate.qubit + 1) % qubitCount, bitOrder);
          uniformData[8] = czTargetPos;
          uniformData[9] = qubitCount;
          uniformData[10] = numStates;
          uniformData[11] = czControlPos;
          break;
        }
        case 'CCX': {
          pipeline = this.pipelines.toffoli;
          const c1Pos = getBitPosition(qubitCount, gate.qubit, bitOrder);
          const c2Pos = getBitPosition(qubitCount, gate.controlQubit2 ?? (gate.qubit + 1) % qubitCount, bitOrder);
          const tPos = getBitPosition(qubitCount, gate.targetQubit ?? (gate.qubit + 2) % qubitCount, bitOrder);
          uniformData[8] = tPos;
          uniformData[9] = qubitCount;
          uniformData[10] = numStates;
          uniformData[11] = c1Pos;
          uniformData[12] = c2Pos;
          break;
        }
        default:
          pipeline = this.pipelines.copy;
          uniformData[10] = numStates;
          break;
      }

      // Write uniforms as u32 view for integer fields
      const uniformU32 = new Uint32Array(uniformData.buffer);
      uniformU32[8] = Math.round(uniformData[8]);
      uniformU32[9] = Math.round(uniformData[9]);
      uniformU32[10] = Math.round(uniformData[10]);
      uniformU32[11] = Math.round(uniformData[11]);
      uniformU32[12] = Math.round(uniformData[12]);

      this.driver.writeBuffer(uniformBuffer, uniformData);

      // Create bind group
      const bindGroup = device.createBindGroup({
        label: `bind-group-${gate.type}`,
        layout: this.bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: inBuffer } },
          { binding: 1, resource: { buffer: outBuffer } },
          { binding: 2, resource: { buffer: uniformBuffer } },
        ],
      });

      // Dispatch compute
      const encoder = device.createCommandEncoder();
      const pass = encoder.beginComputePass();
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.dispatchWorkgroups(workgroupCount);
      pass.end();
      device.queue.submit([encoder.finish()]);

      currentIsA = !currentIsA;
    }

    // ─── Read back results ────────────────────────────────
    const resultBuffer = currentIsA ? stateA : stateB;
    const rawData = await this.driver.readBuffer(resultBuffer, bufferSize);

    // Build probabilities
    const probMap: { state: string; probability: number }[] = [];
    const amplitudeInfo: { state: string; re: number; im: number; magnitude: number; phase: number }[] = [];
    const stateAmplitudes: Complex[] = [];

    for (let i = 0; i < numStates; i++) {
      const re = rawData[i * 2];
      const im = rawData[i * 2 + 1];
      const prob = re * re + im * im;
      stateAmplitudes.push({ re, im });

      if (prob > 1e-10) {
        const state = formatBasisStateLabel(i, qubitCount);
        probMap.push({ state, probability: prob });
        amplitudeInfo.push({
          state,
          re, im,
          magnitude: Math.sqrt(prob),
          phase: Math.atan2(im, re),
        });
      }
    }

    // Sort by probability and take top 1000
    probMap.sort((a, b) => b.probability - a.probability);
    amplitudeInfo.sort((a, b) => (b.re * b.re + b.im * b.im) - (a.re * a.re + a.im * a.im));
    const topProbs = probMap.slice(0, 1000);
    const topAmps = amplitudeInfo.slice(0, 1000);

    // Compute Bloch vectors for all qubits
    const blochVectors: { x: number; y: number; z: number }[] = [];
    for (let q = 0; q < qubitCount; q++) {
      const bitPos = getBitPosition(qubitCount, q, bitOrder);
      let rho00 = 0, rho11 = 0;
      let rho01_re = 0, rho01_im = 0;

      for (let i = 0; i < numStates; i++) {
        const re_i = rawData[i * 2];
        const im_i = rawData[i * 2 + 1];
        const prob = re_i * re_i + im_i * im_i;
        const targetBit = (i >> bitPos) & 1;

        if (targetBit === 0) {
          rho00 += prob;
          const partner = i ^ (1 << bitPos);
          const re_p = rawData[partner * 2];
          const im_p = rawData[partner * 2 + 1];
          // ρ01 += α_i * conj(β_i)
          rho01_re += re_i * re_p + im_i * im_p;
          rho01_im += im_i * re_p - re_i * im_p;
        } else {
          rho11 += prob;
        }
      }

      blochVectors.push({
        x: 2 * rho01_re,
        y: -2 * rho01_im,
        z: rho00 - rho11,
      });
    }

    // Compute circuit depth
    const circuitDepth = gates.length > 0
      ? Math.max(...gates.map(g => g.position)) + 1
      : 0;

    // Clean up GPU buffers
    stateA.destroy();
    stateB.destroy();
    uniformBuffer.destroy();

    return {
      probabilities: topProbs,
      blochVectors,
      stateVector: { amplitudes: stateAmplitudes, qubitCount },
      amplitudes: topAmps,
      circuitDepth,
    };
  }
}
