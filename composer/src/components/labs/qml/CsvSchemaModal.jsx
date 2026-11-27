import React, { useState } from 'react';

export default function CsvSchemaModal({
  isOpen,
  onClose,
  schema,
  onApply,
  numQubits,
  setNumQubits,
  reductionMethod,
  setReductionMethod,
  scalerType,
  setScalerType
}) {
  const [targetCol, setTargetCol] = useState(
    schema?.suggestedTarget || schema?.columns?.[schema?.columns?.length - 1]?.name || ''
  );
  const [featureCols, setFeatureCols] = useState(
    schema?.suggestedFeatures || schema?.columns?.slice(0, -1).map(c => c.name) || []
  );
  const [missingStrategy, setMissingStrategy] = useState('mean');
  const [categoricalStrategy, setCategoricalStrategy] = useState('ordinal');
  const [qCount, setQCount] = useState(numQubits || 4);

  if (!isOpen || !schema) return null;

  const toggleFeatureCol = (colName) => {
    if (featureCols.includes(colName)) {
      setFeatureCols(featureCols.filter(c => c !== colName));
    } else {
      setFeatureCols([...featureCols, colName]);
    }
  };

  const selectAllNumeric = () => {
    const numCols = schema.columns
      .filter(c => c.name !== targetCol && (c.type === 'numeric' || c.type === 'integer'))
      .map(c => c.name);
    setFeatureCols(numCols);
  };

  const handleConfirm = () => {
    if (!targetCol) {
      alert('Please select a Target column (y).');
      return;
    }
    if (featureCols.length === 0) {
      alert('Please select at least one Feature column (X).');
      return;
    }
    setNumQubits(qCount);
    onApply({
      targetColumn: targetCol,
      featureColumns: featureCols,
      missingStrategy,
      categoricalStrategy,
      dimensionReduction: reductionMethod,
      nQubits: qCount,
      scalerType
    });
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
        border: '1px solid rgba(0, 229, 255, 0.3)',
        borderRadius: '8px',
        width: '780px',
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
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#00E5FF' }}>
              📋 CSV Schema & Column Mapping Inspector
            </h3>
            <span style={{ fontSize: '0.72rem', color: '#8b949e' }}>
              Configure feature mapping, target label, and quantum pre-processing pipeline
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

        {/* Body (Scrollable) */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Metadata banner */}
          <div style={{
            display: 'flex',
            gap: '16px',
            padding: '8px 12px',
            background: 'rgba(0, 229, 255, 0.05)',
            border: '1px solid rgba(0, 229, 255, 0.15)',
            borderRadius: '4px',
            fontSize: '0.75rem'
          }}>
            <span>Total Rows: <b style={{ color: '#00E5FF' }}>{schema.rowCount}</b></span>
            <span>Columns: <b style={{ color: '#34d399' }}>{schema.columns.length}</b></span>
            <span>Numeric Features: <b style={{ color: '#fbbf24' }}>{schema.columns.filter(c => c.type === 'numeric').length}</b></span>
            <span>Categorical: <b style={{ color: '#a78bfa' }}>{schema.columns.filter(c => c.type === 'categorical').length}</b></span>
          </div>

          {/* Target Column Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#f1f5f9', marginBottom: '4px' }}>
              🎯 Target Label Column (y)
            </label>
            <select
              value={targetCol}
              onChange={(e) => {
                setTargetCol(e.target.value);
                setFeatureCols(featureCols.filter(c => c !== e.target.value));
              }}
              style={{
                width: '100%',
                padding: '6px 10px',
                background: '#161b22',
                border: '1px solid rgba(0, 229, 255, 0.4)',
                borderRadius: '4px',
                color: '#e6edf3',
                fontSize: '0.8rem',
                fontFamily: 'monospace'
              }}
            >
              {schema.columns.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.type}, {c.uniqueCount} unique values, sample: {c.sample})
                </option>
              ))}
            </select>
          </div>

          {/* Feature Columns Selection */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#f1f5f9' }}>
                🎛️ Input Feature Columns (X) — {featureCols.length} selected
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={selectAllNumeric}
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                    background: 'rgba(0, 229, 255, 0.1)',
                    border: '1px solid rgba(0, 229, 255, 0.3)',
                    borderRadius: '4px',
                    color: '#00E5FF',
                    cursor: 'pointer'
                  }}
                >
                  Select All Numeric
                </button>
                <button
                  type="button"
                  onClick={() => setFeatureCols(schema.columns.filter(c => c.name !== targetCol).map(c => c.name))}
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '4px',
                    color: '#cbd5e1',
                    cursor: 'pointer'
                  }}
                >
                  Select All
                </button>
              </div>
            </div>

            <div style={{
              maxHeight: '140px',
              overflowY: 'auto',
              background: '#161b22',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              padding: '6px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                {schema.columns.filter(c => c.name !== targetCol).map(c => {
                  const isChecked = featureCols.includes(c.name);
                  return (
                    <label
                      key={c.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 6px',
                        background: isChecked ? 'rgba(0, 229, 255, 0.08)' : 'transparent',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        color: isChecked ? '#e6edf3' : '#8b949e'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFeatureCol(c.name)}
                      />
                      <span style={{ fontFamily: 'monospace', fontWeight: isChecked ? '600' : '400' }}>
                        {c.name}
                      </span>
                      <span style={{
                        fontSize: '0.62rem',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        background: c.type === 'numeric' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: c.type === 'numeric' ? '#34d399' : '#fbbf24'
                      }}>
                        {c.type}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pre-Processing Pipeline Settings */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '3px' }}>
                Missing Values (NaN) Strategy
              </label>
              <select
                value={missingStrategy}
                onChange={(e) => setMissingStrategy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  background: '#161b22',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '4px',
                  color: '#e6edf3',
                  fontSize: '0.75rem'
                }}
              >
                <option value="mean">Mean Imputation (Recommended)</option>
                <option value="median">Median Imputation (Robust)</option>
                <option value="zero">Zero Imputation</option>
                <option value="drop">Drop Rows with NaN</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '3px' }}>
                Categorical String Encoding
              </label>
              <select
                value={categoricalStrategy}
                onChange={(e) => setCategoricalStrategy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  background: '#161b22',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '4px',
                  color: '#e6edf3',
                  fontSize: '0.75rem'
                }}
              >
                <option value="ordinal">Ordinal / Label Encoding (Recommended)</option>
                <option value="drop">Drop Categorical Columns</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '3px' }}>
                Feature Scaling
              </label>
              <select
                value={scalerType}
                onChange={(e) => setScalerType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  background: '#161b22',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '4px',
                  color: '#e6edf3',
                  fontSize: '0.75rem'
                }}
              >
                <option value="minmax_sym">MinMaxScaler [-1, 1] (Pauli Rotations)</option>
                <option value="minmax_unit">MinMaxScaler [0, 1] (Probabilistic)</option>
                <option value="standard">StandardScaler (Zero Mean, Unit Var)</option>
                <option value="angle">Angle Scaling [0, 2π] (Phase Encoding)</option>
                <option value="l2">L2 Normalization (Amplitude Encoding)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '3px' }}>
                Dimension Reduction / Bottleneck
              </label>
              <select
                value={reductionMethod}
                onChange={(e) => setReductionMethod(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px 8px',
                  background: '#161b22',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '4px',
                  color: '#e6edf3',
                  fontSize: '0.75rem'
                }}
              >
                <option value="auto">Auto Adaptive (PCA / Variance)</option>
                <option value="autoencoder">Neural Bottleneck (Autoencoder)</option>
                <option value="pca">Principal Component Analysis (PCA)</option>
                <option value="top_variance">Top Variance Features</option>
              </select>
            </div>
          </div>

          {/* Active Qubits Count Slider */}
          <div style={{
            padding: '10px 12px',
            background: '#161b22',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '4px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#f1f5f9' }}>
                Quantum Register Qubit Width: <b style={{ color: '#00E5FF' }}>{qCount} Qubits</b>
              </span>
              <span style={{ fontSize: '0.68rem', color: '#34d399', fontFamily: 'monospace' }}>
                Hilbert Dimension: 2^{qCount} = {Math.pow(2, qCount)} states
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="16"
              value={qCount}
              onChange={(e) => setQCount(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b' }}>
              <span>2 Qubits (Fast 2D View)</span>
              <span>4 Qubits (Recommended)</span>
              <span>8 Qubits</span>
              <span>16 Qubits (High Capacity)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '4px',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '0.78rem'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              padding: '6px 16px',
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              border: 'none',
              borderRadius: '4px',
              color: '#ffffff',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.78rem',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
            }}
          >
            🚀 Project & Load Dataset
          </button>
        </div>
      </div>
    </div>
  );
}

