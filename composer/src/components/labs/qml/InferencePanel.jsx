import React, { useState } from 'react';
import { runBatchQuantumInference } from '../../../quantum-engine/labs/qml-engine';

export default function InferencePanel({
  numQubits,
  inferenceInput,
  setInferenceInput,
  inferenceResult,
  onRunInference,
  isInferring,
  datasetType,
  trainedParams = [],
  featureMap = 'zz',
  layers = 2,
  entanglement = 'linear',
  scalerType = 'minmax_sym',
  scalerParams = null,
  featureColumns = null
}) {
  const [inferenceMode, setInferenceMode] = useState('single'); // 'single' | 'batch'
  const [batchCsvText, setBatchCsvText] = useState('');
  const [batchFilename, setBatchFilename] = useState('');
  const [batchResult, setBatchResult] = useState(null);
  const [isScoringBatch, setIsScoringBatch] = useState(false);
  const [batchError, setBatchError] = useState(null);

  const setPreset = (type) => {
    const arr = Array(numQubits).fill(0);
    if (type === 'pos') {
      for (let i = 0; i < numQubits; i++) arr[i] = 0.6 + i * 0.05;
    } else if (type === 'neg') {
      for (let i = 0; i < numQubits; i++) arr[i] = -0.6 - i * 0.05;
    } else if (type === 'boundary') {
      for (let i = 0; i < numQubits; i++) arr[i] = (i % 2 === 0 ? 0.05 : -0.05);
    } else {
      for (let i = 0; i < numQubits; i++) arr[i] = Number(((Math.random() - 0.5) * 1.8).toFixed(2));
    }
    setInferenceInput(arr);
  };

  const handleInputChange = (idx, val) => {
    const next = [...inferenceInput];
    next[idx] = Number(val);
    setInferenceInput(next);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBatchFilename(file.name);
    setBatchError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setBatchCsvText(text);
      setBatchResult(null);
    };
    reader.readAsText(file);
  };

  const loadBenchmarkSample = () => {
    const rows = ['id,feat1,feat2,feat3,feat4'];
    for (let i = 1; i <= 30; i++) {
      const f1 = (Math.sin(i * 0.4) * 2.5).toFixed(3);
      const f2 = (Math.cos(i * 0.4) * 2.1).toFixed(3);
      const f3 = (Math.sin(i * 0.8 + 1) * 1.8).toFixed(3);
      const f4 = (Math.cos(i * 0.6 - 0.5) * 2.0).toFixed(3);
      rows.push(`sample_${i},${f1},${f2},${f3},${f4}`);
    }
    setBatchCsvText(rows.join('\n'));
    setBatchFilename('benchmark_unlabeled_samples.csv');
    setBatchResult(null);
    setBatchError(null);
  };

  const handleRunBatchScoring = () => {
    if (!batchCsvText.trim()) {
      setBatchError('Please upload an unlabeled CSV file or load the benchmark sample first.');
      return;
    }
    setIsScoringBatch(true);
    setBatchError(null);
    setTimeout(() => {
      try {
        const res = runBatchQuantumInference(batchCsvText, trainedParams, {
          featureMap,
          layers,
          entanglement,
          numQubits,
          scalerType,
          scalerParams,
          featureColumns
        });
        setBatchResult(res);
      } catch (err) {
        setBatchError(err.message || 'Error executing batch scoring.');
      } finally {
        setIsScoringBatch(false);
      }
    }, 150);
  };

  const handleDownloadPredictions = () => {
    if (!batchResult?.outputCsv) return;
    const blob = new Blob([batchResult.outputCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantum_predictions_${datasetType || 'model'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="lab-card" style={{ marginTop: '1.25rem' }}>
      <div className="lab-card-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
        <span className="lab-card-title">
          <span>⚡ Quantum Model Inference & Batch Deployment</span>
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', padding: '2px' }}>
            <button
              onClick={() => setInferenceMode('single')}
              style={{
                padding: '3px 10px', fontSize: '0.7rem', fontWeight: '600', border: 'none', borderRadius: '3px',
                background: inferenceMode === 'single' ? '#0284c7' : 'transparent',
                color: inferenceMode === 'single' ? '#fff' : '#94a3b8', cursor: 'pointer'
              }}
            >
              Interactive Vector Sliders
            </button>
            <button
              onClick={() => setInferenceMode('batch')}
              style={{
                padding: '3px 10px', fontSize: '0.7rem', fontWeight: '600', border: 'none', borderRadius: '3px',
                background: inferenceMode === 'batch' ? '#0284c7' : 'transparent',
                color: inferenceMode === 'batch' ? '#fff' : '#94a3b8', cursor: 'pointer'
              }}
            >
              📊 Batch Unlabeled CSV Scoring
            </button>
          </div>

          {inferenceMode === 'single' && (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setPreset('pos')}
                style={{
                  padding: '2px 6px', fontSize: '0.66rem', background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '3px', color: '#fbbf24', cursor: 'pointer'
                }}
              >
                Class 1 Anchor
              </button>
              <button
                onClick={() => setPreset('neg')}
                style={{
                  padding: '2px 6px', fontSize: '0.66rem', background: 'rgba(0, 229, 255, 0.1)',
                  border: '1px solid rgba(0, 229, 255, 0.3)', borderRadius: '3px', color: '#00E5FF', cursor: 'pointer'
                }}
              >
                Class 0 Anchor
              </button>
              <button
                onClick={() => setPreset('random')}
                style={{
                  padding: '2px 6px', fontSize: '0.66rem', background: 'rgba(167, 139, 250, 0.1)',
                  border: '1px solid rgba(167, 139, 250, 0.3)', borderRadius: '3px', color: '#a78bfa', cursor: 'pointer'
                }}
              >
                Random
              </button>
            </div>
          )}
        </div>
      </div>

      {inferenceMode === 'single' ? (
        <>
          <p style={{ fontSize: '0.74rem', color: 'var(--lab-text-secondary)', margin: '0 0 12px 0' }}>
            Feed arbitrary new samples into the trained ansatz U(θ*) and measure Pauli ⟨Z₀⟩ expectation and class confidence.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Left: Input Feature Vector */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--lab-text-muted)', marginBottom: '8px' }}>
                INPUT VECTOR x ∈ ℝ^{numQubits} (ACTIVE REGISTER)
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: numQubits > 4 ? 'repeat(2, 1fr)' : '1fr',
                gap: '8px',
                maxHeight: '180px',
                overflowY: 'auto',
                paddingRight: '4px'
              }}>
                {inferenceInput.map((val, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--lab-bg-subpanel)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid var(--lab-border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)', width: '32px' }}>
                      x[{idx}]:
                    </span>
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.05"
                      value={val}
                      onChange={(e) => handleInputChange(idx, e.target.value)}
                      style={{ flex: 1, cursor: 'pointer' }}
                    />
                    <input
                      type="number"
                      step="0.05"
                      value={val}
                      onChange={(e) => handleInputChange(idx, e.target.value)}
                      style={{
                        width: '50px',
                        padding: '2px 4px',
                        fontSize: '0.72rem',
                        background: '#0d1117',
                        border: '1px solid var(--lab-border)',
                        borderRadius: '3px',
                        color: '#e6edf3',
                        textAlign: 'right',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={onRunInference}
                disabled={isInferring}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '8px 12px',
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontWeight: '600',
                  cursor: isInferring ? 'not-allowed' : 'pointer',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>⚡</span>
                <span>{isInferring ? 'Simulating Quantum State...' : 'Run Quantum Inference on Sample'}</span>
              </button>
            </div>

            {/* Right: Real-time Telemetry & Output */}
            <div style={{
              background: 'var(--lab-bg-subpanel)',
              border: '1px solid var(--lab-border)',
              borderRadius: '6px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              {inferenceResult ? (
                <>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--lab-text-muted)' }}>PREDICTED CLASSIFICATION</span>
                      <span style={{
                        fontSize: '0.68rem', padding: '2px 8px', borderRadius: '4px', fontWeight: '700',
                        background: inferenceResult.predictedClass === 1 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 229, 255, 0.2)',
                        color: inferenceResult.predictedClass === 1 ? '#fbbf24' : '#00E5FF',
                        border: `1px solid ${inferenceResult.predictedClass === 1 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(0, 229, 255, 0.4)'}`
                      }}>
                        CLASS {inferenceResult.predictedClass} ({inferenceResult.confidencePercent}%)
                      </span>
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--lab-text-secondary)', marginBottom: '4px' }}>
                        <span>Observable ⟨Z₀⟩ Expectation:</span>
                        <span style={{ fontFamily: 'var(--lab-font-mono)', fontWeight: 'bold', color: inferenceResult.expectationZ >= 0 ? '#fbbf24' : '#00E5FF' }}>
                          {inferenceResult.expectationZ > 0 ? `+${inferenceResult.expectationZ}` : inferenceResult.expectationZ}
                        </span>
                      </div>
                      <div style={{
                        width: '100%', height: '14px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', position: 'relative', overflow: 'hidden'
                      }}>
                        <div style={{
                          position: 'absolute',
                          left: '50%',
                          top: 0,
                          bottom: 0,
                          width: '2px',
                          background: 'rgba(255, 255, 255, 0.4)'
                        }} />
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          left: inferenceResult.expectationZ < 0 ? `${((inferenceResult.expectationZ + 1) / 2) * 100}%` : '50%',
                          width: `${Math.abs(inferenceResult.expectationZ) * 50}%`,
                          background: inferenceResult.expectationZ >= 0 ? '#fbbf24' : '#00E5FF'
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--lab-text-muted)', marginTop: '2px' }}>
                        <span>-1.0 (Pure Class 0)</span>
                        <span>0.0 (Uncertain)</span>
                        <span>+1.0 (Pure Class 1)</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '2px' }}>
                        <span style={{ color: '#00E5FF' }}>P(0) = {(inferenceResult.prob0 * 100).toFixed(1)}%</span>
                        <span style={{ color: '#fbbf24' }}>P(1) = {(inferenceResult.prob1 * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ display: 'flex', height: '10px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${inferenceResult.prob0 * 100}%`, background: '#00E5FF' }} />
                        <div style={{ width: `${inferenceResult.prob1 * 100}%`, background: '#fbbf24' }} />
                      </div>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '12px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.66rem',
                    color: 'var(--lab-text-muted)'
                  }}>
                    <span>Simulator: <b>{inferenceResult.method}</b></span>
                    <span>Latency: <b style={{ color: '#34d399' }}>{inferenceResult.latencyMs} ms</b></span>
                    <span>Register: <b>{inferenceResult.numQubits} Qubits</b></span>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--lab-text-muted)', fontSize: '0.74rem' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>⚛️</div>
                  <span>Click "Run Quantum Inference on Sample" above to evaluate the variational quantum circuit on live features.</span>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Batch CSV Scoring View */
        <div>
          <p style={{ fontSize: '0.74rem', color: 'var(--lab-text-secondary)', margin: '0 0 12px 0' }}>
            Upload real-world unlabeled CSV files (e.g. 500+ records). Automatically validates columns, applies fitted training scalers, executes vectorized batch quantum scoring, and appends prediction labels and confidence scores.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
            {/* Upload Area */}
            <div>
              <div style={{
                border: '2px dashed var(--lab-border)',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                background: 'var(--lab-bg-subpanel)'
              }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📁</div>
                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#f0f6fc', marginBottom: '4px' }}>
                  {batchFilename ? `Selected: ${batchFilename}` : 'Drop unlabeled CSV file here or click to browse'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--lab-text-muted)', marginBottom: '12px' }}>
                  Supports multi-column transaction, medical, or molecular CSV datasets.
                </div>
                
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <label style={{
                    padding: '6px 14px', borderRadius: '4px', background: '#2563eb', color: '#fff',
                    fontSize: '0.74rem', fontWeight: '600', cursor: 'pointer'
                  }}>
                    Browse CSV
                    <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </label>
                  <button
                    type="button"
                    onClick={loadBenchmarkSample}
                    style={{
                      padding: '6px 14px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)', color: '#e6edf3', fontSize: '0.74rem', cursor: 'pointer'
                    }}
                  >
                    📋 Load Benchmark (30 Rows)
                  </button>
                </div>
              </div>

              {batchError && (
                <div style={{
                  marginTop: '8px', padding: '8px 12px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.74rem'
                }}>
                  ⚠️ {batchError}
                </div>
              )}

              <button
                type="button"
                onClick={handleRunBatchScoring}
                disabled={isScoringBatch || !batchCsvText}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '9px 12px',
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontWeight: '700',
                  cursor: (isScoringBatch || !batchCsvText) ? 'not-allowed' : 'pointer',
                  opacity: (isScoringBatch || !batchCsvText) ? 0.6 : 1,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>⚡</span>
                <span>{isScoringBatch ? 'Evaluating Batch Quantum Statevectors...' : 'Run Vectorized Batch Quantum Scoring'}</span>
              </button>
            </div>

            {/* Results Preview & Download */}
            <div style={{
              background: 'var(--lab-bg-subpanel)',
              border: '1px solid var(--lab-border)',
              borderRadius: '6px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              {batchResult ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#10b981' }}>
                      ✓ BATCH SCORING COMPLETE
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--lab-text-muted)' }}>
                      {batchResult.totalSamples} records scored
                    </span>
                  </div>

                  {/* Summary Grid */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px'
                  }}>
                    <div style={{ background: '#0d1117', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Class 0</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#00E5FF' }}>
                        {batchResult.class0Count} ({batchResult.class0Ratio}%)
                      </div>
                    </div>
                    <div style={{ background: '#0d1117', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Class 1</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#fbbf24' }}>
                        {batchResult.class1Count} ({batchResult.class1Ratio}%)
                      </div>
                    </div>
                    <div style={{ background: '#0d1117', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Avg Conf</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#34d399' }}>
                        {batchResult.avgConfidence}%
                      </div>
                    </div>
                  </div>

                  {/* Performance Readout */}
                  <div style={{
                    fontSize: '0.66rem', color: 'var(--lab-text-muted)', marginBottom: '10px',
                    display: 'flex', justifyContent: 'space-between'
                  }}>
                    <span>Total Latency: <b>{batchResult.totalLatencyMs} ms</b></span>
                    <span>Throughput: <b style={{ color: '#00E5FF' }}>{batchResult.throughputRowsPerSec.toLocaleString()} rows/s</b></span>
                  </div>

                  {/* Sample rows preview */}
                  <div style={{
                    maxHeight: '100px', overflowY: 'auto', fontSize: '0.64rem', fontFamily: 'monospace',
                    background: '#090d13', padding: '6px', borderRadius: '4px', marginBottom: '12px'
                  }}>
                    <div style={{ color: '#94a3b8', borderBottom: '1px solid #21262d', paddingBottom: '2px', marginBottom: '2px' }}>
                      PREVIEW (First 3 Records):
                    </div>
                    {batchResult.scoredRows.slice(0, 3).map((r, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span>Row #{idx + 1}: {r.original.slice(0, 2).join(', ')}...</span>
                        <span style={{ color: r.predictedClass === 1 ? '#fbbf24' : '#00E5FF', fontWeight: 'bold' }}>
                          → Class {r.predictedClass} ({r.confidence}%)
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadPredictions}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>⬇️</span>
                    <span>Download predictions.csv (with Confidence & Scores)</span>
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '28px 10px', color: 'var(--lab-text-muted)', fontSize: '0.74rem' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📊</div>
                  <span>Upload an unlabeled CSV on the left and click "Run Vectorized Batch Quantum Scoring" to process the entire dataset in batch.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

