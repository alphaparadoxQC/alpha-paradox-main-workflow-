import React, { useState } from 'react';
import {
  generateStimCircuitString,
  generateStimNotebookJson,
  generateStimDetectorErrorModel,
  generateHardwareCalibrationJson,
  HARDWARE_CHIP_PRESETS
} from '../../../quantum-engine/labs/qec-noise-engine';

export default function QecExportModal({
  isOpen,
  onClose,
  distance = 3,
  rounds = 5,
  pGate = 0.001,
  pMeas = 0.005,
  codeFamily = 'Rotated Planar Surface Code',
  decoder = 'MWPM'
}) {
  const [activeTab, setActiveTab] = useState('stim');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // 1. Stim Circuit String
  const stimCircuitStr = generateStimCircuitString({
    distance,
    rounds,
    pGate,
    pMeas,
    codeFamily
  });

  // 2. Stim DEM
  const stimDemResult = generateStimDetectorErrorModel(distance, pGate, rounds);
  const demStr = stimDemResult.demString || '';

  // 3. Jupyter Notebook (.ipynb)
  const notebookObj = generateStimNotebookJson({
    distance,
    rounds,
    pGate,
    pMeas,
    codeFamily
  });
  const notebookJsonStr = JSON.stringify(notebookObj, null, 2);

  // 4. PyMatching Python Script (.py)
  const pyMatchingScript = `# ============================================================================
# Alpha Paradox QEC — Sparse Blossom PyMatching v2 Workflow
# Code: ${codeFamily} (d=${distance}, Rounds=${rounds})
# Decoders: Sparse Blossom MWPM · Union-Find · BP+OSD
# ============================================================================

import stim
import pymatching
import numpy as np
import matplotlib.pyplot as plt

# 1. Compile Stim Quantum Error Correction Circuit
stim_code = """${stimCircuitStr.replace(/"/g, '\\"')}"""
circuit = stim.Circuit(stim_code)
print(f"Compiled {circuit.num_qubits} qubits, {circuit.num_detectors} detectors.")

# 2. Extract Detector Error Model (DEM)
dem = circuit.detector_error_model(decompose_errors=True)
matcher = pymatching.Matching.from_detector_error_model(dem)
print(f"Matching graph initialized with {matcher.num_detectors} detector nodes.")

# 3. Vectorized Monte Carlo Sampling (10,000 Shots)
sampler = circuit.compile_detector_sampler()
shots = 10000
syndrome_batch, true_observables = sampler.sample(shots, separate_observables=True)

# 4. Fast Real-Time Decoding via Sparse Blossom
predicted_observables = matcher.decode_batch(syndrome_batch)
logical_errors = np.sum(true_observables != predicted_observables)
p_logical = logical_errors / shots

print(f"--- QEC BENCHMARK RESULTS ---")
print(f"Physical Error Rate (p_gate): {${pGate}}")
print(f"Total Monte Carlo Shots:      {shots:,}")
print(f"Logical Errors Count:         {logical_errors}")
print(f"Empirical Logical Error Rate: {p_logical:.6f}")
print(f"Below Threshold (0.72%):      {p_logical < 0.0072}")
`;

  // 5. Hardware Calibration Spec (.json)
  const chipPreset = HARDWARE_CHIP_PRESETS.willow;
  const calibJsonStr = generateHardwareCalibrationJson(chipPreset);

  const getCurrentContent = () => {
    switch (activeTab) {
      case 'stim': return { text: stimCircuitStr, ext: 'stim', mime: 'text/plain', name: `surface_code_d${distance}_r${rounds}.stim` };
      case 'dem': return { text: demStr, ext: 'dem', mime: 'text/plain', name: `surface_code_d${distance}.dem` };
      case 'notebook': return { text: notebookJsonStr, ext: 'ipynb', mime: 'application/json', name: `qec_benchmark_d${distance}.ipynb` };
      case 'pymatching': return { text: pyMatchingScript, ext: 'py', mime: 'text/x-python', name: `pymatching_benchmark_d${distance}.py` };
      case 'calib': return { text: calibJsonStr, ext: 'json', mime: 'application/json', name: `hardware_calibration_spec.json` };
      default: return { text: stimCircuitStr, ext: 'stim', mime: 'text/plain', name: `qec_spec.stim` };
    }
  };

  const handleCopy = () => {
    const { text } = getCurrentContent();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const { text, mime, name } = getCurrentContent();
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#0a0e17',
        border: '1px solid rgba(0, 229, 255, 0.25)',
        boxShadow: '0 0 35px rgba(0, 229, 255, 0.15)',
        borderRadius: '10px',
        width: '880px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(13, 17, 23, 0.95)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🚀</span>
              <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#e6edf3' }}>
                Export QEC Spec & Stim Verification Artifacts
              </span>
              <span style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(0, 229, 255, 0.15)',
                color: '#00E5FF',
                fontWeight: '600'
              }}>
                {codeFamily} (d={distance})
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
              Standardized Craig Gidney Stim circuit, Detector Error Model, PyMatching Python SDK, and Jupyter Notebook.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '1.2rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 20px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          overflowX: 'auto'
        }}>
          {[
            { id: 'stim', label: '1. Stim Circuit (.stim)' },
            { id: 'dem', label: '2. Detector Error Model (.dem)' },
            { id: 'notebook', label: '3. Jupyter Notebook (.ipynb)' },
            { id: 'pymatching', label: '4. PyMatching Python (.py)' },
            { id: 'calib', label: '5. Hardware Calibration (.json)' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: activeTab === t.id ? '#2563eb' : 'rgba(255, 255, 255, 0.05)',
                color: activeTab === t.id ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                border: activeTab === t.id ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                padding: '5px 12px',
                borderRadius: '4px',
                fontSize: '0.74rem',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Box */}
        <div style={{
          flex: 1,
          padding: '16px 20px',
          overflowY: 'auto',
          background: '#05070a'
        }}>
          <pre style={{
            margin: 0,
            fontSize: '0.78rem',
            fontFamily: 'JetBrains Mono, monospace',
            color: '#e6edf3',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            {getCurrentContent().text}
          </pre>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(13, 17, 23, 0.95)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.4)' }}>
            Target: {getCurrentContent().name}
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCopy}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: copied ? '#10b981' : '#e6edf3',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '6px 14px',
                borderRadius: '5px',
                fontSize: '0.78rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
            </button>
            <button
              onClick={handleDownload}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '5px',
                fontSize: '0.78rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ⬇ Download {getCurrentContent().ext.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

