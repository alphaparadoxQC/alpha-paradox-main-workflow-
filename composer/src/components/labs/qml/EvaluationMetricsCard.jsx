import React from 'react';

export default function EvaluationMetricsCard({ metrics }) {
  if (!metrics) return null;

  const {
    confusionMatrix = { tp: 0, fp: 0, tn: 0, fn: 0 },
    accuracy = 0,
    precision = 0,
    recall = 0,
    specificity = 0,
    f1 = 0,
    rocAuc = 0,
    totalSamples = 0
  } = metrics;

  return (
    <div className="lab-card" style={{ marginTop: '1.25rem' }}>
      <div className="lab-card-header">
        <span className="lab-card-title">
          <span>📊 Full Machine Learning Evaluation Suite (Enterprise Metrics)</span>
        </span>
        <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>
          Test Set (N = {totalSamples})
        </span>
      </div>

      <p style={{ fontSize: '0.74rem', color: 'var(--lab-text-secondary)', margin: '0 0 10px 0' }}>
        Standard verification metrics for imbalanced datasets, fraud screening, and healthcare diagnostics.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.25rem', alignItems: 'center' }}>
        {/* 2x2 Confusion Matrix Grid */}
        <div style={{
          background: 'var(--lab-bg-subpanel)',
          border: '1px solid var(--lab-border)',
          borderRadius: '6px',
          padding: '10px'
        }}>
          <div style={{ textAlign: 'center', fontSize: '0.68rem', fontWeight: '700', color: 'var(--lab-text-muted)', marginBottom: '6px' }}>
            CONFUSION MATRIX (2×2)
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            fontSize: '0.72rem'
          }}>
            {/* TP */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '4px',
              padding: '8px 6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.62rem', color: '#34d399', fontWeight: '600' }}>TRUE POSITIVE (TP)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981', marginTop: '2px' }}>
                {confusionMatrix.tp}
              </div>
            </div>

            {/* FP */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '4px',
              padding: '8px 6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.62rem', color: '#f87171', fontWeight: '600' }}>FALSE POSITIVE (FP)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ef4444', marginTop: '2px' }}>
                {confusionMatrix.fp}
              </div>
            </div>

            {/* FN */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '4px',
              padding: '8px 6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.62rem', color: '#fbbf24', fontWeight: '600' }}>FALSE NEGATIVE (FN)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f59e0b', marginTop: '2px' }}>
                {confusionMatrix.fn}
              </div>
            </div>

            {/* TN */}
            <div style={{
              background: 'rgba(0, 229, 255, 0.12)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              borderRadius: '4px',
              padding: '8px 6px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.62rem', color: '#38bdf8', fontWeight: '600' }}>TRUE NEGATIVE (TN)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#00E5FF', marginTop: '2px' }}>
                {confusionMatrix.tn}
              </div>
            </div>
          </div>
        </div>

        {/* Metric Badges Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px'
        }}>
          <div style={{
            background: 'var(--lab-bg-subpanel)',
            border: '1px solid var(--lab-border)',
            borderRadius: '6px',
            padding: '8px 12px'
          }}>
            <div style={{ fontSize: '0.66rem', color: 'var(--lab-text-muted)' }}>PRECISION (PPV)</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--lab-cyan)', marginTop: '2px' }}>
              {precision.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--lab-text-secondary)' }}>TP / (TP + FP)</div>
          </div>

          <div style={{
            background: 'var(--lab-bg-subpanel)',
            border: '1px solid var(--lab-border)',
            borderRadius: '6px',
            padding: '8px 12px'
          }}>
            <div style={{ fontSize: '0.66rem', color: 'var(--lab-text-muted)' }}>RECALL (SENSITIVITY)</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--lab-emerald)', marginTop: '2px' }}>
              {recall.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--lab-text-secondary)' }}>TP / (TP + FN)</div>
          </div>

          <div style={{
            background: 'var(--lab-bg-subpanel)',
            border: '1px solid var(--lab-border)',
            borderRadius: '6px',
            padding: '8px 12px'
          }}>
            <div style={{ fontSize: '0.66rem', color: 'var(--lab-text-muted)' }}>SPECIFICITY (TNR)</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#a78bfa', marginTop: '2px' }}>
              {specificity.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--lab-text-secondary)' }}>TN / (TN + FP)</div>
          </div>

          <div style={{
            background: 'var(--lab-bg-subpanel)',
            border: '1px solid var(--lab-border)',
            borderRadius: '6px',
            padding: '8px 12px'
          }}>
            <div style={{ fontSize: '0.66rem', color: 'var(--lab-text-muted)' }}>F1-SCORE (HARMONIC)</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--lab-amber)', marginTop: '2px' }}>
              {f1.toFixed(3)}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--lab-text-secondary)' }}>2 · (Prec · Rec) / (Prec + Rec)</div>
          </div>

          <div style={{
            background: 'var(--lab-bg-subpanel)',
            border: '1px solid var(--lab-border)',
            borderRadius: '6px',
            padding: '8px 12px'
          }}>
            <div style={{ fontSize: '0.66rem', color: 'var(--lab-text-muted)' }}>ROC-AUC SCORE</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#38bdf8', marginTop: '2px' }}>
              {rocAuc.toFixed(3)}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--lab-text-secondary)' }}>Area Under ROC Curve</div>
          </div>

          <div style={{
            background: 'var(--lab-bg-subpanel)',
            border: '1px solid var(--lab-border)',
            borderRadius: '6px',
            padding: '8px 12px'
          }}>
            <div style={{ fontSize: '0.66rem', color: 'var(--lab-text-muted)' }}>ACCURACY</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#10b981', marginTop: '2px' }}>
              {accuracy.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--lab-text-secondary)' }}>(TP + TN) / Total</div>
          </div>
        </div>
      </div>
    </div>
  );
}

