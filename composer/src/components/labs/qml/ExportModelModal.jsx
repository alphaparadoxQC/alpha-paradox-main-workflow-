import React, { useState } from 'react';
import {
  exportTrainedModelWeights,
  generatePennyLanePythonScript,
  generateQiskitPythonScript,
  generateFastApiInferenceSnippet
} from '../../../quantum-engine/labs/qml-engine';

export default function ExportModelModal({
  isOpen,
  onClose,
  modelData
}) {
  const [activeTab, setActiveTab] = useState('weights'); // 'weights' | 'pennylane' | 'qiskit' | 'fastapi'
  const [copied, setCopied] = useState(false);

  if (!isOpen || !modelData) return null;

  const {
    params = [],
    layers = 2,
    featureMap = 'zz',
    scalerType = 'minmax_sym',
    scalerParams = null,
    featureColumns = null,
    datasetType = 'moons',
    trainAcc = 94,
    testAcc = 90
  } = modelData;

  const weightsObj = exportTrainedModelWeights(params, {
    layers,
    featureMap,
    scalerType,
    scalerParams,
    featureColumns,
    datasetType,
    trainAcc,
    testAcc
  });

  const weightsJson = JSON.stringify(weightsObj, null, 2);
  const pennylaneCode = generatePennyLanePythonScript(params, layers, featureMap, scalerType, scalerParams, featureColumns);
  const qiskitCode = generateQiskitPythonScript(params, layers, featureMap, scalerType, scalerParams, featureColumns);
  const fastapiCode = generateFastApiInferenceSnippet(params, layers, featureMap, scalerType, scalerParams, featureColumns);

  const currentContent = {
    weights: weightsJson,
    pennylane: pennylaneCode,
    qiskit: qiskitCode,
    fastapi: fastapiCode
  }[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const filenameMap = {
      weights: `qml_model_weights_${datasetType}.json`,
      pennylane: `qml_pennylane_${datasetType}.py`,
      qiskit: `qml_qiskit_${datasetType}.py`,
      fastapi: `qml_fastapi_server_${datasetType}.py`
    };
    const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filenameMap[activeTab] || 'model_export.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: '#0d1117',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '8px',
        width: '840px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
        color: '#e6edf3',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#34d399' }}>
              🚀 Export Trained Quantum Model & Deployment SDK
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#8b949e' }}>
              Download variational weights (θ*), runnable Python scripts, or one-click FastAPI endpoint
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#8b949e',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '2px',
          background: '#161b22',
          padding: '6px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            onClick={() => setActiveTab('weights')}
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: activeTab === 'weights' ? '600' : '400',
              color: activeTab === 'weights' ? '#00E5FF' : '#8b949e',
              background: activeTab === 'weights' ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'weights' ? '2px solid #00E5FF' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            📦 Trained Weights (.json)
          </button>
          <button
            onClick={() => setActiveTab('pennylane')}
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: activeTab === 'pennylane' ? '600' : '400',
              color: activeTab === 'pennylane' ? '#34d399' : '#8b949e',
              background: activeTab === 'pennylane' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'pennylane' ? '2px solid #34d399' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            🐍 PennyLane Script (.py)
          </button>
          <button
            onClick={() => setActiveTab('qiskit')}
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: activeTab === 'qiskit' ? '600' : '400',
              color: activeTab === 'qiskit' ? '#fbbf24' : '#8b949e',
              background: activeTab === 'qiskit' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'qiskit' ? '2px solid #fbbf24' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            ⚛️ Qiskit EstimatorV2 (.py)
          </button>
          <button
            onClick={() => setActiveTab('fastapi')}
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: activeTab === 'fastapi' ? '600' : '400',
              color: activeTab === 'fastapi' ? '#a78bfa' : '#8b949e',
              background: activeTab === 'fastapi' ? 'rgba(167, 139, 250, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'fastapi' ? '2px solid #a78bfa' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            ⚡ REST API Microservice (FastAPI)
          </button>
        </div>

        {/* Content Viewer */}
        <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
          <pre style={{
            margin: 0,
            padding: '14px',
            background: '#04070c',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontFamily: 'monospace',
            color: '#e6edf3',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.6',
            maxHeight: '420px',
            overflowY: 'auto'
          }}>
            {currentContent}
          </pre>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <span style={{ fontSize: '0.72rem', color: '#8b949e' }}>
            {params.length} Variational Parameters · {layers} Layers · {featureMap} Feature Map · {trainAcc}% Accuracy
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCopy}
              style={{
                padding: '6px 14px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: '#e6edf3',
                cursor: 'pointer',
                fontSize: '0.76rem',
                fontWeight: '600'
              }}
            >
              {copied ? '✓ Copied to Clipboard!' : '📋 Copy Code'}
            </button>
            <button
              onClick={handleDownload}
              style={{
                padding: '6px 16px',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                border: 'none',
                borderRadius: '4px',
                color: '#ffffff',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.76rem',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
              }}
            >
              💾 Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

