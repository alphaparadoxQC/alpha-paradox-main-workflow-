/**
 * ============================================================
 * WebGPU Driver — Core GPU Abstraction Layer
 * ============================================================
 * Manages the GPU device lifecycle, buffer creation, and
 * shader compilation for quantum circuit simulation.
 * 
 * Uses a singleton pattern: one GPUDevice shared across the app.
 * ============================================================
 */

// Feature detection — works in all environments
export const isWebGPUAvailable = (): boolean => {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
};

export class WebGPUDriver {
  private static instance: WebGPUDriver | null = null;
  private device: GPUDevice | null = null;
  private adapter: GPUAdapter | null = null;
  private initialized = false;
  private initPromise: Promise<boolean> | null = null;

  private constructor() {}

  static getInstance(): WebGPUDriver {
    if (!WebGPUDriver.instance) {
      WebGPUDriver.instance = new WebGPUDriver();
    }
    return WebGPUDriver.instance;
  }

  /**
   * Initialize the GPU device. Safe to call multiple times —
   * returns cached result after first successful init.
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return !!this.device;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(): Promise<boolean> {
    try {
      if (!isWebGPUAvailable()) {
        console.warn('[WebGPU] Not available in this browser');
        this.initialized = true;
        return false;
      }

      this.adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance',
      });

      if (!this.adapter) {
        console.warn('[WebGPU] No suitable GPU adapter found');
        this.initialized = true;
        return false;
      }

      // Request device with max buffer size for large state vectors
      const limits = this.adapter.limits;
      this.device = await this.adapter.requestDevice({
        requiredLimits: {
          maxStorageBufferBindingSize: limits.maxStorageBufferBindingSize,
          maxBufferSize: limits.maxBufferSize,
          maxComputeWorkgroupsPerDimension: limits.maxComputeWorkgroupsPerDimension,
          maxComputeWorkgroupSizeX: limits.maxComputeWorkgroupSizeX,
        },
      });

      // Handle device loss gracefully
      this.device.lost.then((info) => {
        console.error('[WebGPU] Device lost:', info.message);
        this.device = null;
        this.initialized = false;
        this.initPromise = null;
      });

      console.log('[WebGPU] GPU initialized successfully');
      console.log(`[WebGPU] Max buffer size: ${(limits.maxBufferSize / 1024 / 1024).toFixed(0)}MB`);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[WebGPU] Initialization failed:', error);
      this.initialized = true;
      return false;
    }
  }

  getDevice(): GPUDevice | null {
    return this.device;
  }

  isReady(): boolean {
    return this.initialized && !!this.device;
  }

  /**
   * Get the maximum number of qubits the GPU can handle for state-vector sim.
   * Each amplitude = 2 floats (re, im) × 4 bytes = 8 bytes.
   * Total memory = 2^n × 8 bytes.  We need 2 buffers (ping-pong).
   */
  getMaxStateVectorQubits(): number {
    if (!this.device) return 0;
    const maxBytes = this.device.limits.maxBufferSize;
    // Each buffer holds 2^n complex numbers, each = 8 bytes (2×f32)
    // We need 2 buffers, so max per buffer = maxBytes
    const maxAmplitudes = Math.floor(maxBytes / 8);
    return Math.floor(Math.log2(maxAmplitudes));
  }

  // ─── Buffer Helpers ─────────────────────────────────────────

  /**
   * Create a storage buffer for the state vector.
   * Size = 2^qubitCount × 2 (re, im) × 4 bytes (f32)
   */
  createStateBuffer(qubitCount: number, label: string): GPUBuffer {
    if (!this.device) throw new Error('GPU not initialized');
    const size = Math.pow(2, qubitCount) * 2 * 4; // 2 floats per complex number
    return this.device.createBuffer({
      label,
      size,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
  }

  /**
   * Create a uniform buffer for gate parameters.
   * Layout: [gate_re00, gate_im00, gate_re01, gate_im01,
   *          gate_re10, gate_im10, gate_re11, gate_im11,
   *          target_qubit, qubit_count, num_states, padding]
   * = 12 floats = 48 bytes, padded to 64 bytes
   */
  createUniformBuffer(): GPUBuffer {
    if (!this.device) throw new Error('GPU not initialized');
    return this.device.createBuffer({
      label: 'gate-uniforms',
      size: 64, // 16 × 4 bytes (padded for alignment)
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  /**
   * Create a read-back buffer (for reading results from GPU → CPU)
   */
  createReadbackBuffer(size: number): GPUBuffer {
    if (!this.device) throw new Error('GPU not initialized');
    return this.device.createBuffer({
      label: 'readback',
      size,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
  }

  /**
   * Compile a WGSL shader module
   */
  createShaderModule(code: string, label: string): GPUShaderModule {
    if (!this.device) throw new Error('GPU not initialized');
    return this.device.createShaderModule({ label, code });
  }

  /**
   * Read a GPU buffer back to the CPU as a Float32Array
   */
  async readBuffer(buffer: GPUBuffer, size: number): Promise<Float32Array> {
    if (!this.device) throw new Error('GPU not initialized');

    const readback = this.createReadbackBuffer(size);
    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(buffer, 0, readback, 0, size);
    this.device.queue.submit([encoder.finish()]);

    await readback.mapAsync(GPUMapMode.READ);
    const data = new Float32Array(readback.getMappedRange().slice(0));
    readback.unmap();
    readback.destroy();
    return data;
  }

  /**
   * Write a Float32Array to a GPU buffer
   */
  writeBuffer(buffer: GPUBuffer, data: Float32Array): void {
    if (!this.device) throw new Error('GPU not initialized');
    this.device.queue.writeBuffer(buffer, 0, data as any);
  }

  /**
   * Destroy all resources and reset the singleton
   */
  destroy(): void {
    this.device?.destroy();
    this.device = null;
    this.adapter = null;
    this.initialized = false;
    this.initPromise = null;
    WebGPUDriver.instance = null;
  }
}
