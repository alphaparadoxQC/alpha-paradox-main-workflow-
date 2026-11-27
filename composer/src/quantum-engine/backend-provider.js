/**
 * Backend Provider — Unified interface to all simulation backends.
 */
import { StatevectorSimulator } from './statevector-simulator.js';
import { QASMSimulator } from './qasm-simulator.js';
import { StabilizerSimulator } from './stabilizer-simulator.js';
import { DensityMatrixSimulator } from './density-matrix-simulator.js';
import { VQPUSimulator } from './vqpu-simulator.js';
import { TensorNetworkSimulator } from './tensor-network-simulator.js';

const BACKENDS = {
  aer_statevector: () => new StatevectorSimulator(),
  aer_qasm: () => new QASMSimulator(),
  aer_stabilizer: () => new StabilizerSimulator(),
  aer_density_matrix: () => new DensityMatrixSimulator(),
  qldpc_virtual_chip: () => new VQPUSimulator(),
  eda_custom_topology: () => {
    const sim = new VQPUSimulator();
    sim.name = 'eda_custom_topology';
    sim.displayName = 'Silicon EDA Layout Topology';
    sim.description = 'Hardware-constrained execution routed on physical Silicon EDA transmon layout couplers.';
    return sim;
  },
  aer_tensor_network: () => new TensorNetworkSimulator(),

  // Placeholder backends (GPU/Tensor — show in UI but delegate to CPU)
  aer_gpu_statevector: () => {
    const sim = new StatevectorSimulator();
    sim.name = 'aer_gpu_statevector';
    sim.displayName = 'GPU Statevector';
    sim.processor = 'GPU';
    sim.description = 'GPU-accelerated statevector. (Requires NVIDIA GPU — running on CPU fallback)';
    return sim;
  },
  aer_gpu_density_matrix: () => {
    const sim = new DensityMatrixSimulator();
    sim.name = 'aer_gpu_density_matrix';
    sim.displayName = 'GPU Density Matrix';
    sim.processor = 'GPU';
    sim.description = 'GPU-accelerated density matrix. (Requires NVIDIA GPU — running on CPU fallback)';
    return sim;
  },
  aer_mps: () => {
    const sim = new StatevectorSimulator();
    sim.name = 'aer_mps';
    sim.displayName = 'Matrix Product State';
    sim.processor = 'CPU';
    sim.maxQubits = 20;
    sim.description = 'MPS simulator for low-entanglement circuits. (Placeholder — using statevector)';
    return sim;
  },
  aer_extended_stabilizer: () => {
    const sim = new StatevectorSimulator();
    sim.name = 'aer_extended_stabilizer';
    sim.displayName = 'Extended Stabilizer';
    sim.processor = 'CPU';
    sim.description = 'Clifford + limited T gates. (Placeholder — using statevector)';
    return sim;
  },
  aer_unitary: () => {
    const sim = new StatevectorSimulator();
    sim.name = 'aer_unitary';
    sim.displayName = 'Unitary Simulator';
    sim.processor = 'CPU';
    sim.maxQubits = 12;
    sim.description = 'Full 2ⁿ×2ⁿ unitary matrix. Max ~12 qubits.';
    return sim;
  },
  tensornet_simulator: () => {
    const sim = new StatevectorSimulator();
    sim.name = 'tensornet_simulator';
    sim.displayName = 'Tensor Network';
    sim.processor = 'CPU';
    sim.description = 'Tensor network contraction. (Placeholder — using statevector)';
    return sim;
  },

  // UI Option Aliases
  aer_simulator_statevector: () => new StatevectorSimulator(),
  aer_simulator_density_matrix: () => new DensityMatrixSimulator(),
  aer_simulator_stabilizer: () => new StabilizerSimulator(),
  aer_simulator_matrix_product_state: () => BACKENDS.aer_mps(),
  cirq_simulator: () => new StatevectorSimulator(),
  cirq_clifford_simulator: () => new StabilizerSimulator(),
  nvidia_cudaq_stabilizer_simulator: () => new StabilizerSimulator(),
  quest_simulator: () => new StatevectorSimulator(),
  qsimcirq_simulator: () => new StatevectorSimulator(),
  qulacs_multicpu_simulator: () => new StatevectorSimulator(),
  cdac_photoniqs_simulator_qwalk: () => new StatevectorSimulator(),
  cdac_photoniqs_simulator_klm: () => new StatevectorSimulator(),
  qniverse_statevector_simulator: () => new StatevectorSimulator(),
  aer_simulator_statevector_gpu: () => BACKENDS.aer_gpu_statevector(),
  aer_simulator_tensor_network_gpu: () => BACKENDS.aer_gpu_density_matrix(),
  nvidia_cudaq_statevector_simulator: () => BACKENDS.aer_gpu_statevector(),
  nvidia_cudaq_tensor_network_simulator: () => BACKENDS.aer_gpu_density_matrix(),
  nvidia_cudaq_mps_simulator: () => BACKENDS.aer_mps(),
  qsimcirq_cuquantum_gpu_simulator: () => BACKENDS.aer_gpu_statevector(),
  tensornet_simulator: () => {
    const sim = new StatevectorSimulator();
    sim.name = 'tensornet_simulator';
    sim.displayName = 'Tensor Network';
    sim.processor = 'CPU';
    sim.description = 'Tensor network contraction. (Placeholder — using statevector)';
    return sim;
  }
};

export class BackendProvider {
  constructor() {
    this._cache = {};
  }

  /**
   * Get a backend instance by name
   */
  getBackend(name) {
    if (!BACKENDS[name]) {
      throw new Error(`Unknown backend: ${name}. Available: ${this.listBackendNames().join(', ')}`);
    }
    if (!this._cache[name]) {
      this._cache[name] = BACKENDS[name]();
    }
    return this._cache[name];
  }

  /**
   * List all available backend names
   */
  listBackendNames() {
    return Object.keys(BACKENDS);
  }

  /**
   * List all backends with metadata
   */
  listBackends() {
    return this.listBackendNames().map(name => {
      const backend = this.getBackend(name);
      return {
        name: backend.name,
        displayName: backend.displayName,
        maxQubits: backend.maxQubits,
        supportsNoise: backend.supportsNoise,
        processor: backend.processor,
        description: backend.description,
      };
    });
  }

  /**
   * Get backends grouped by processor type
   */
  getBackendsByProcessor() {
    const grouped = {};
    for (const backend of this.listBackends()) {
      if (!grouped[backend.processor]) grouped[backend.processor] = [];
      grouped[backend.processor].push(backend);
    }
    return grouped;
  }

  /**
   * Run a circuit on one or more backends (multi-chip)
   */
  async runMultiChip(circuit, backendNames, config = {}) {
    const results = {};
    const promises = backendNames.map(async (name) => {
      const backend = this.getBackend(name);
      const startTime = performance.now();
      try {
        const result = backend.run(circuit, config);
        results[name] = { result, error: null };
      } catch (error) {
        results[name] = { result: null, error: error.message };
      }
    });

    await Promise.all(promises);
    return results;
  }
}

// Singleton instance
export const provider = new BackendProvider();
