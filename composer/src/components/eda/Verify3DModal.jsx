import React from 'react';
import { useEdaStore } from '../../stores/edaStore';

export default function Verify3DModal({ isOpen, onClose, result, onRerun }) {
  if (!isOpen || !result) return null;

  const { passed, errors = [], warnings = [], checks = [], recommendations = [], metrics = {} } = result;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#181b22',
        border: `1px solid ${passed ? '#22c55e' : '#ef4444'}`,
        borderRadius: '12px',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8)',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #282e3d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#13161c'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              padding: '3px 8px', 
              borderRadius: '4px', 
              fontSize: '11px', 
              fontWeight: 700, 
              background: passed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: passed ? '#4ade80' : '#f87171',
              border: `1px solid ${passed ? '#22c55e' : '#ef4444'}`
            }}>
              {passed ? 'PASS' : 'FAIL'}
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                3D Multi-Chip Physical & Multi-Physics Signoff
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                TSV KOZ, Cryogenic Thermal, Micro-Bump Spacing & 50Ω Signal Integrity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Key Metrics Dashboard */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '10px'
          }}>
            <div style={metricBoxStyle}>
              <span style={metricLabelStyle}>Active Qubits</span>
              <strong style={{ ...metricValStyle, color: '#38bdf8' }}>{metrics.qubitCount ?? 0}</strong>
            </div>
            <div style={metricBoxStyle}>
              <span style={metricLabelStyle}>Coaxial TSVs</span>
              <strong style={{ ...metricValStyle, color: '#0ea5e9' }}>{metrics.tsvCount ?? 0}</strong>
            </div>
            <div style={metricBoxStyle}>
              <span style={metricLabelStyle}>Micro-Bumps</span>
              <strong style={{ ...metricValStyle, color: '#cbd5e1' }}>{metrics.microBumpCount ?? 0}</strong>
            </div>
            <div style={metricBoxStyle}>
              <span style={metricLabelStyle}>20 mK Dissipation</span>
              <strong style={{ ...metricValStyle, color: '#2dd4bf' }}>{metrics.cryoDissipation || '0 µW'}</strong>
            </div>
            <div style={metricBoxStyle}>
              <span style={metricLabelStyle}>Cooling Margin</span>
              <strong style={{ ...metricValStyle, color: '#4ade80' }}>{metrics.coolingMargin || '100%'}</strong>
            </div>
          </div>

          {/* 6 Automated Verification Checks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ margin: '4px 0', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Physical & Multi-Physics Checks
            </h3>
            {checks.map(chk => {
              const isPass = chk.status === 'pass';
              const isWarn = chk.status === 'warning';
              return (
                <div
                  key={chk.id}
                  style={{
                    background: '#1e2330',
                    border: `1px solid ${isPass ? 'rgba(34, 197, 94, 0.25)' : isWarn ? 'rgba(234, 179, 8, 0.3)' : 'rgba(239, 68, 68, 0.4)'}`,
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: isPass ? '#22c55e' : isWarn ? '#eab308' : '#ef4444'
                      }} />
                      <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{chk.name}</strong>
                    </div>
                    <p style={{ margin: '4px 0 0 16px', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                      {chk.detail}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    background: isPass ? 'rgba(34, 197, 94, 0.15)' : isWarn ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: isPass ? '#4ade80' : isWarn ? '#facc15' : '#f87171'
                  }}>
                    {chk.status}
                  </span>
                </div>
              );
            })}
          </div>

          {/* AI Optimization Recommendations */}
          {recommendations.length > 0 && (
            <div style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '12px', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  AI Optimization Engine Recommendations
                </strong>
              </div>
              {recommendations.map((rec, i) => (
                <div key={i} style={{ fontSize: '11px', color: '#e2e8f0', background: 'rgba(15, 23, 42, 0.6)', padding: '8px 12px', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 600, color: '#fbbf24', marginBottom: '2px' }}>{rec.title}</div>
                  <div style={{ color: '#cbd5e1' }}>{rec.action}</div>
                </div>
              ))}
            </div>
          )}

          {/* Errors / Warnings List if any */}
          {errors.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <strong style={{ fontSize: '12px', color: '#f87171' }}>Violations ({errors.length}):</strong>
              {errors.map((err, i) => (
                <div key={i} style={{ fontSize: '11px', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid #ef4444', padding: '6px 10px', borderRadius: '4px' }}>
                  {err.message}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #282e3d',
          background: '#13161c',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          {onRerun && (
            <button
              onClick={onRerun}
              style={{
                background: '#272d3b',
                border: '1px solid #3b4457',
                borderRadius: '6px',
                color: '#e2e8f0',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Re-run 3D DRC
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: '#38bdf8',
              border: 'none',
              borderRadius: '6px',
              color: '#0f172a',
              padding: '6px 18px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}

const metricBoxStyle = {
  background: '#1e2330',
  border: '1px solid #2d3546',
  borderRadius: '8px',
  padding: '10px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px'
};

const metricLabelStyle = {
  fontSize: '10px',
  color: '#94a3b8',
  textTransform: 'uppercase',
  fontWeight: 600
};

const metricValStyle = {
  fontSize: '16px',
  fontWeight: 700
};

