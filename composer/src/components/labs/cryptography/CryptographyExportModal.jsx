import React, { useState } from 'react';
import {
  generateSarifReport,
  generatePqcAuditReportMarkdown,
  generateCryptographyNotebookJson,
  generateAutoRemediationPatch
} from '../../../quantum-engine/labs/cryptography-engine';

export default function CryptographyExportModal({
  isOpen,
  onClose,
  activeTab = 'qkd',
  qkdResult,
  cbomResult,
  repeaterResult,
  telecomResult
}) {
  const [exportTab, setExportTab] = useState(activeTab === 'pqc' ? 'cbom' : 'audit');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const findings = cbomResult?.findings || [];
  const cycloneDxJson = cbomResult?.cycloneDxJson || {};
  const sarifObj = generateSarifReport(findings);
  const auditReportMd = generatePqcAuditReportMarkdown(findings, cbomResult?.postQuantumReadinessScore || 45);
  const notebookJson = generateCryptographyNotebookJson(activeTab, {
    qkd: qkdResult,
    repeater: repeaterResult,
    telecom: telecomResult
  });
  const etsiJson = telecomResult?.keyManagementSystem || {
    standard: 'ETSI GS QKD 014 V1.1.1',
    key_ID: 'etsi-qkd-key-sim',
    key: qkdResult?.finalKeyHex || '0xABCD',
    key_TTL: 3600
  };
  const patchNginx = generateAutoRemediationPatch('CBOM-01', 'nginx');

  const contentMap = {
    cbom: JSON.stringify(cycloneDxJson, null, 2),
    sarif: JSON.stringify(sarifObj, null, 2),
    audit: auditReportMd,
    etsi: JSON.stringify(etsiJson, null, 2),
    notebook: JSON.stringify(notebookJson, null, 2),
    patch: patchNginx
  };

  const currentContent = contentMap[exportTab] || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filenameMap = {
      cbom: 'cyclonedx-1.6-cbom.json',
      sarif: 'quantum-vulnerabilities.sarif',
      audit: 'pqc-migration-audit-report.md',
      etsi: 'etsi-gs-qkd-014-keys.json',
      notebook: 'quantum_cryptography_lab.ipynb',
      patch: 'pqc-upgrade.patch'
    };
    const mimeMap = {
      cbom: 'application/json',
      sarif: 'application/json',
      audit: 'text/markdown',
      etsi: 'application/json',
      notebook: 'application/x-ipynb+json',
      patch: 'text/x-diff'
    };

    const blob = new Blob([currentContent], { type: mimeMap[exportTab] || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filenameMap[exportTab] || 'export.txt';
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
      backgroundColor: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1.5rem'
    }}>
      <div style={{
        background: '#0a0e17',
        border: '1px solid rgba(0, 229, 255, 0.25)',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '840px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 229, 255, 0.15)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(0, 229, 255, 0.05) 0%, transparent 100%)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🛡️</span>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>
                Compliance, CBOM & Security Export Suite
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              Industry-standard machine-readable security deliverables for CISOs, audit boards & CI/CD pipelines.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          background: '#0f172a',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '0 1.25rem',
          gap: '4px',
          overflowX: 'auto'
        }}>
          {[
            { id: 'audit', label: '📋 Board-Ready Audit Report' },
            { id: 'cbom', label: '🛡️ CycloneDX 1.6 CBOM (JSON)' },
            { id: 'sarif', label: '🔍 SARIF 2.1.0 CI/CD' },
            { id: 'patch', label: '⚡ Auto-Remediation Patch' },
            { id: 'etsi', label: '📡 ETSI GS QKD 014 (KMS)' },
            { id: 'notebook', label: '📓 Jupyter Notebook (.ipynb)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setExportTab(tab.id)}
              style={{
                padding: '10px 14px',
                fontSize: '0.78rem',
                fontWeight: exportTab === tab.id ? '600' : '500',
                color: exportTab === tab.id ? '#00e5ff' : '#94a3b8',
                background: 'transparent',
                border: 'none',
                borderBottom: exportTab === tab.id ? '2px solid #00e5ff' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code / Content Area */}
        <div style={{ padding: '1.25rem 1.75rem', flex: 1, overflowY: 'auto' }}>
          <pre style={{
            margin: 0,
            padding: '1.25rem',
            background: '#05070a',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            fontFamily: 'var(--lab-font-mono, monospace)',
            fontSize: '0.75rem',
            color: exportTab === 'patch' ? '#38bdf8' : '#e2e8f0',
            lineHeight: '1.6',
            maxHeight: '440px',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            {currentContent}
          </pre>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#0d131f'
        }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            NIST FIPS 203/204/205 · CycloneDX 1.6 · ETSI GS QKD 014 · OASIS SARIF v2.1.0
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCopy}
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#f8fafc',
                fontSize: '0.78rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {copied ? '✓ Copied!' : '📋 Copy Content'}
            </button>
            <button
              onClick={handleDownload}
              style={{
                padding: '7px 18px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #0284c7 0%, #00e5ff 100%)',
                border: 'none',
                color: '#05070a',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              📥 Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
