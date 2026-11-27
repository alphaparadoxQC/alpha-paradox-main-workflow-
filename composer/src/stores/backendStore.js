import { create } from 'zustand';

export const useBackendStore = create((set) => ({
  // Active configuration
  selectedProcessor: 'CPU', // 'CPU', 'GPU', 'FPGA', 'VECTOR', 'VQPU'
  selectedBackend: 'aer_statevector',
  
  // Multi-chip mode
  multiChipMode: false,
  selectedBackends: ['aer_statevector'], // Array of backend names for multi-chip

  // Execution parameters
  shots: 1024,
  
  // Noise Configuration
  noiseConfig: {
    noiseType: 'none', // 'none' or 'custom'
    gateRotationError: { enabled: false, magnitude: 0.01, ex: 1, ey: 1, ez: 1 },
    depolarizingError: { enabled: false, probability: 0.01 },
    readoutError: { enabled: false, probability: 0.02 },
    initializationError: { enabled: false, probability: 0.01 },
    thermalRelaxation: { enabled: false, t1: 50, t2: 70 },
    // VQPU specific
    vqpu: {
      pGate: 0.001,
      pMeas: 0.005,
      pIdle: 0.0001,
      qecRounds: 5,
      decoder: 'BP-OSD'
    }
  },

  // QPU Cloud Provider Configuration
  selectedProvider: 'ibm_quantum', // 'ibm_quantum', 'aws_braket', 'ionq', 'rigetti'
  providerApiKeys: {}, // { ibm_quantum: 'token...', aws_braket: 'key...' }
  providerStatus: {}, // { ibm_quantum: 'connected' | 'error' | 'checking' }

  // Actions
  setProcessor: (processor) => set({ selectedProcessor: processor }),
  
  setBackend: (backend) => set((state) => {
    if (state.multiChipMode) {
      const idx = state.selectedBackends.indexOf(backend);
      if (idx === -1) {
        return { selectedBackends: [...state.selectedBackends, backend] };
      } else if (state.selectedBackends.length > 1) {
        // Don't allow empty selection
        return { selectedBackends: state.selectedBackends.filter(b => b !== backend) };
      }
      return state;
    } else {
      return { 
        selectedBackend: backend,
        selectedBackends: [backend]
      };
    }
  }),

  setMultiChipMode: (enabled) => set((state) => ({ 
    multiChipMode: enabled,
    // When disabling, keep the first selected backend
    selectedBackend: enabled ? state.selectedBackend : state.selectedBackends[0] || 'aer_statevector',
    selectedBackends: enabled ? state.selectedBackends : [state.selectedBackends[0] || 'aer_statevector']
  })),

  setShots: (shots) => set({ shots: Math.max(1, Math.min(100000, shots)) }),
  
  setNoiseConfig: (config) => set((state) => ({
    noiseConfig: { ...state.noiseConfig, ...config }
  })),

  updateNoiseParam: (channel, param, value) => set((state) => ({
    noiseConfig: {
      ...state.noiseConfig,
      [channel]: {
        ...state.noiseConfig[channel],
        [param]: value
      }
    }
  })),

  setSelectedProvider: (provider) => set({ selectedProvider: provider }),

  setProviderApiKey: (provider, key) => set((state) => ({
    providerApiKeys: { ...state.providerApiKeys, [provider]: key },
    providerStatus: { ...state.providerStatus, [provider]: key ? 'connected' : 'disconnected' },
  })),

  clearProviderApiKey: (provider) => set((state) => {
    const keys = { ...state.providerApiKeys };
    const status = { ...state.providerStatus };
    delete keys[provider];
    delete status[provider];
    return { providerApiKeys: keys, providerStatus: status };
  }),
}));
