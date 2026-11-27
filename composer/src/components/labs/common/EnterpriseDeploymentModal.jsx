import React, { useState } from 'react';
import '../../../styles/labs.css';

export default function EnterpriseDeploymentModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('docker');

  if (!isOpen) return null;

  const dockerComposeSnippet = `# docker-compose.yml - Alpha Paradox QC On-Premises Container
version: '3.8'

services:
  alpha-web:
    image: alphaparadox/quantum-studio:latest
    container_name: alpha_paradox_web
    ports:
      - "5173:5173"
    environment:
      - VITE_DEPLOYMENT_MODE=on-prem
      - VITE_AUTH_PROVIDER=ldap_saml
      - VITE_API_URL=http://alpha-engine:8000
    restart: unless-stopped

  alpha-engine:
    image: alphaparadox/vqpu-engine:latest
    container_name: alpha_paradox_vqpu
    ports:
      - "8000:8000"
    environment:
      - OFFLINE_AIRGAP_MODE=true
      - MAX_CONCURRENT_STUDENTS=120
      - VQPU_CHIP_ARCH=qldpc_1625
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    restart: unless-stopped`;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--lab-bg-panel)',
        border: '1px solid var(--lab-border)',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '820px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--lab-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>🏢</span>
              <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--lab-text-primary)' }}>
                Security, Auth & Enterprise Deployment (VPC / On-Prem)
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--lab-text-secondary)', marginTop: '2px' }}>
              Air-Gapped Containerized Hosting for Universities & Enterprise Pilot Programs
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--lab-text-muted)',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--lab-border)', background: 'var(--lab-bg-subpanel)' }}>
          <button
            onClick={() => setActiveTab('docker')}
            style={{
              flex: 1,
              padding: '10px',
              background: activeTab === 'docker' ? 'var(--lab-bg-panel)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'docker' ? '2px solid var(--lab-cyan)' : 'none',
              color: activeTab === 'docker' ? 'var(--lab-cyan)' : 'var(--lab-text-secondary)',
              fontSize: '0.76rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🐳 Docker Compose Deployment
          </button>
          <button
            onClick={() => setActiveTab('security')}
            style={{
              flex: 1,
              padding: '10px',
              background: activeTab === 'security' ? 'var(--lab-bg-panel)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'security' ? '2px solid var(--lab-cyan)' : 'none',
              color: activeTab === 'security' ? 'var(--lab-cyan)' : 'var(--lab-text-secondary)',
              fontSize: '0.76rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🔒 Air-Gapped & Offline Security
          </button>
          <button
            onClick={() => setActiveTab('api')}
            style={{
              flex: 1,
              padding: '10px',
              background: activeTab === 'api' ? 'var(--lab-bg-panel)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'api' ? '2px solid var(--lab-cyan)' : 'none',
              color: activeTab === 'api' ? 'var(--lab-cyan)' : 'var(--lab-text-secondary)',
              fontSize: '0.76rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🔑 Hardware API Key Vault
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {activeTab === 'docker' && (
            <>
              <div style={{ fontSize: '0.76rem', color: 'var(--lab-text-secondary)', lineHeight: '1.5' }}>
                Colleges and enterprise IT teams can host Alpha Paradox in a fully isolated private cloud or on-premises GPU cluster. Copy the compose specification below to deploy:
              </div>

              <div style={{ position: 'relative' }}>
                <pre style={{
                  background: '#05070a',
                  border: '1px solid var(--lab-border)',
                  borderRadius: '6px',
                  padding: '14px',
                  fontFamily: 'var(--lab-font-mono)',
                  fontSize: '0.7rem',
                  color: 'var(--lab-cyan)',
                  overflowX: 'auto',
                  margin: 0
                }}>
                  {dockerComposeSnippet}
                </pre>
              </div>

              <div style={{ background: 'var(--lab-bg-subpanel)', padding: '10px', borderRadius: '4px', fontSize: '0.72rem', color: 'var(--lab-text-muted)' }}>
                <span>Quickstart: </span>
                <span style={{ fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-text-primary)' }}>
                  docker compose up -d
                </span>
                <span> · Exposes client on :5173 and vQPU numerical engine on :8000.</span>
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'var(--lab-bg-subpanel)', padding: '12px', borderRadius: '6px', border: '1px solid var(--lab-border)' }}>
                  <div style={{ color: 'var(--lab-emerald)', fontWeight: '600', fontSize: '0.8rem', marginBottom: '4px' }}>
                    ✓ 100% Air-Gapped Operation
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--lab-text-secondary)', lineHeight: '1.4' }}>
                    Zero external telemetry or tracking. All quantum chemistry molecular integrals, QML training, and QEC decoders run on internal local hardware.
                  </div>
                </div>

                <div style={{ background: 'var(--lab-bg-subpanel)', padding: '12px', borderRadius: '6px', border: '1px solid var(--lab-border)' }}>
                  <div style={{ color: 'var(--lab-cyan)', fontWeight: '600', fontSize: '0.8rem', marginBottom: '4px' }}>
                    ✓ SAML 2.0 / LDAP SSO Auth
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--lab-text-secondary)', lineHeight: '1.4' }}>
                    Direct integration with university Single Sign-On (Active Directory, Shibboleth, Okta) to automatically provision Student and Faculty roles.
                  </div>
                </div>

                <div style={{ background: 'var(--lab-bg-subpanel)', padding: '12px', borderRadius: '6px', border: '1px solid var(--lab-border)' }}>
                  <div style={{ color: 'var(--lab-amber)', fontWeight: '600', fontSize: '0.8rem', marginBottom: '4px' }}>
                    ✓ Hard Limit Quota Protection
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--lab-text-secondary)', lineHeight: '1.4' }}>
                    Protects GPU/vQPU resources with rate limiters, memory pooling, and automatic execution timeouts to prevent crashes during exam sessions.
                  </div>
                </div>

                <div style={{ background: 'var(--lab-bg-subpanel)', padding: '12px', borderRadius: '6px', border: '1px solid var(--lab-border)' }}>
                  <div style={{ color: 'var(--lab-cyan)', fontWeight: '600', fontSize: '0.8rem', marginBottom: '4px' }}>
                    ✓ LMS Gradebook Webhooks
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--lab-text-secondary)', lineHeight: '1.4' }}>
                    Automated LTI 1.3 compliance for pushing lab completions and cryptographic grade reports directly into Canvas, Moodle, or Blackboard.
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'api' && (
            <>
              <div style={{ fontSize: '0.76rem', color: 'var(--lab-text-secondary)' }}>
                When connecting university accounts to physical QPU cloud hardware, tokens are encrypted with client-side AES-GCM before dispatch:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--lab-bg-subpanel)', borderRadius: '4px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: '600' }}>IBM Quantum Cloud</span>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-emerald)' }}>● AES-256 ENCRYPTED</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--lab-bg-subpanel)', borderRadius: '4px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: '600' }}>Amazon Braket (AWS)</span>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-cyan)' }}>● IAM ROLE DETECTED</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--lab-bg-subpanel)', borderRadius: '4px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: '600' }}>Rigetti QCS & IonQ</span>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--lab-font-mono)', color: 'var(--lab-text-muted)' }}>○ OPTIONAL TOKEN</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--lab-border)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'var(--lab-bg-subpanel)'
        }}>
          <button
            onClick={onClose}
            className="lab-action-btn"
            style={{ fontSize: '0.74rem', padding: '6px 14px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

