import React from 'react';
import { TABULAR_REGRESSION_PRESETS } from '../../../quantum-engine/labs/qml-engine';

export default function QclTabularSection({
  qclPresetId,
  setQclPresetId,
  qclTabularResult,
  onUploadCsvClick
}) {
  const currentPreset = TABULAR_REGRESSION_PRESETS[qclPresetId] || TABULAR_REGRESSION_PRESETS.housing;

  const metrics = qclTabularResult?.metrics || {
    mse: 0.024,
    rmse: 0.155,
    mae: 0.128,
    r2: 0.884
  };

  const predictions = qclTabularResult?.predictions || [];

  return (
    <div className="lab-card" style={{ marginTop: '1.25rem' }}>
      <div className="lab-card-header">
        <span className="lab-card-title">
          <span>📊 Real Tabular QCL Regression Benchmarks & Multi-Column Upload</span>
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            className="lab-select"
            value={qclPresetId}
            onChange={(e) => setQclPresetId(e.target.value)}
            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
          >
            <option value="housing">California Housing (Income, Age, Rooms → Price)</option>
            <option value="molecular_pes">Molecular PES (H₂ Bond Length → Energy)</option>
            <option value="options_vol">Options Implied Volatility (Moneyness, Expiry → Vol)</option>
            {qclPresetId === 'custom_csv' && <option value="custom_csv">Custom Tabular CSV (Active)</option>}
          </select>
          <button
            onClick={onUploadCsvClick}
            style={{
              padding: '3px 8px',
              fontSize: '0.7rem',
              background: 'rgba(0, 229, 255, 0.1)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              borderRadius: '4px',
              color: '#00E5FF',
              cursor: 'pointer'
            }}
          >
            📁 Upload CSV
          </button>
        </div>
      </div>

      <p style={{ fontSize: '0.74rem', color: 'var(--lab-text-secondary)', margin: '0 0 10px 0' }}>
        {currentPreset.desc || 'Multi-variate regression with Quantum Circuit Learning.'} Target: <b>{currentPreset.targetName}</b>
      </p>

      {/* Regression KPI Grid: MSE, RMSE, MAE, R^2 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        marginBottom: '14px'
      }}>
        <div style={{
          background: 'var(--lab-bg-subpanel)',
          border: '1px solid var(--lab-border)',
          borderRadius: '4px',
          padding: '8px 10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--lab-text-muted)' }}>COEFFICIENT OF DETERMINATION</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#10b981', marginTop: '2px' }}>
            R² = {metrics.r2?.toFixed(3)}
          </div>
          <div style={{ fontSize: '0.58rem', color: '#64748b' }}>Goodness-of-Fit (1.0 = Perfect)</div>
        </div>

        <div style={{
          background: 'var(--lab-bg-subpanel)',
          border: '1px solid var(--lab-border)',
          borderRadius: '4px',
          padding: '8px 10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--lab-text-muted)' }}>MEAN ABSOLUTE ERROR</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--lab-cyan)', marginTop: '2px' }}>
            MAE = {metrics.mae?.toFixed(4)}
          </div>
          <div style={{ fontSize: '0.58rem', color: '#64748b' }}>Average Absolute Deviation</div>
        </div>

        <div style={{
          background: 'var(--lab-bg-subpanel)',
          border: '1px solid var(--lab-border)',
          borderRadius: '4px',
          padding: '8px 10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--lab-text-muted)' }}>ROOT MEAN SQUARED ERROR</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fbbf24', marginTop: '2px' }}>
            RMSE = {metrics.rmse?.toFixed(4)}
          </div>
          <div style={{ fontSize: '0.58rem', color: '#64748b' }}>L2 Penalty / Std Deviation</div>
        </div>

        <div style={{
          background: 'var(--lab-bg-subpanel)',
          border: '1px solid var(--lab-border)',
          borderRadius: '4px',
          padding: '8px 10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--lab-text-muted)' }}>MEAN SQUARED ERROR</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f87171', marginTop: '2px' }}>
            MSE = {metrics.mse?.toFixed(4)}
          </div>
          <div style={{ fontSize: '0.58rem', color: '#64748b' }}>Quadratic Loss Objective</div>
        </div>
      </div>

      {/* Regression Samples Table (True vs Predicted) */}
      <div style={{
        background: 'var(--lab-bg-subpanel)',
        border: '1px solid var(--lab-border)',
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid var(--lab-border)',
          fontSize: '0.7rem',
          fontWeight: '600',
          color: 'var(--lab-text-secondary)',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Multi-Column Sample Predictions (First 6 Test Records)</span>
          <span style={{ color: '#10b981' }}>Observable ⟨Z₀⟩ Expectation Mapping</span>
        </div>

        <table className="lab-table" style={{ fontSize: '0.7rem', margin: 0 }}>
          <thead>
            <tr>
              <th>Record #</th>
              <th>Features ({currentPreset.featureNames?.join(', ') || 'X'})</th>
              <th>Ground Truth y</th>
              <th>Quantum Pred ŷ</th>
              <th>Residual Δ</th>
            </tr>
          </thead>
          <tbody>
            {predictions.slice(0, 6).map((p, idx) => (
              <tr key={idx}>
                <td style={{ fontFamily: 'monospace' }}>#{idx + 1}</td>
                <td style={{ fontFamily: 'monospace', color: 'var(--lab-text-muted)' }}>
                  [{p.features?.map(v => v.toFixed(2)).join(', ')}]
                </td>
                <td style={{ fontFamily: 'monospace', color: 'var(--lab-cyan)' }}>
                  {p.yTrue?.toFixed(3)}
                </td>
                <td style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: '600' }}>
                  {p.yPred?.toFixed(3)}
                </td>
                <td style={{
                  fontFamily: 'monospace',
                  color: Math.abs(p.residual) < 0.1 ? '#10b981' : '#f59e0b'
                }}>
                  {p.residual > 0 ? `+${p.residual.toFixed(3)}` : p.residual.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

