import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedNavbar from '../../components/shared/UnifiedNavbar';
import { useRoleStore, ROLES } from '../../stores/roleStore';
import InstructorDashboardModal from '../../components/labs/common/InstructorDashboardModal';
import EnterpriseDeploymentModal from '../../components/labs/common/EnterpriseDeploymentModal';
import '../../styles/labs.css';

export default function LabsHubPage({ session }) {
  const navigate = useNavigate();
  const currentRole = useRoleStore(state => state.currentRole);
  const setRole = useRoleStore(state => state.setRole);
  const credits = useRoleStore(state => state.credits);
  const profile = useRoleStore(state => state.profile);

  const [instructorModalOpen, setInstructorModalOpen] = useState(false);
  const [deploymentModalOpen, setDeploymentModalOpen] = useState(false);

  const domainLabs = [
    {
      id: 'qml',
      title: 'Quantum Machine Learning (QML) Lab',
      path: '/labs/qml',
      domain: 'Artificial Intelligence',
      tag: 'VQC · QSVC Kernel · Barren Plateau',
      description: 'Interactive variational quantum classifier and quantum kernel studio. Train live decision boundaries, monitor barren plateau gradient variances, and benchmark against classical RBF-SVMs.',
      kpis: [
        { label: 'Models', val: 'VQC & QSVC' },
        { label: 'Kernel Matrix', val: 'K_ij Gram' },
        { label: 'Classical Baseline', val: 'RBF-SVM' }
      ]
    },
    {
      id: 'chemistry',
      title: 'Quantum Chemistry & Molecular Lab',
      path: '/labs/chemistry',
      domain: 'Quantum Chemistry',
      tag: 'VQE · STO-3G · Chemical Accuracy',
      description: 'Simulate molecular ground state energies with Variational Quantum Eigensolver (VQE). Sweep potential energy surfaces (PES) across bond lengths and compare against exact FCI reference curves.',
      kpis: [
        { label: 'Molecules', val: 'H₂, LiH, BeH₂, H₂O' },
        { label: 'Accuracy Band', val: '1.6 mHa' },
        { label: 'Ansatz', val: 'UCCSD / HEA' }
      ]
    },
    {
      id: 'optimization',
      title: 'Quantum Optimization & Hybrid AI Lab',
      path: '/labs/optimization',
      domain: 'Combinatorial Optimization',
      tag: 'QAOA · QUBO · Graph Partitions',
      description: 'Interactive QAOA and QUBO workbench for Max-Cut, Vehicle Routing (VRP), and shift scheduling. Click to edit graph topologies, view QUBO heatmaps, and evaluate approximation ratios.',
      kpis: [
        { label: 'QAOA Depth', val: 'p = 1–4' },
        { label: 'Solvers', val: 'QAOA / Annealing' },
        { label: 'Interactive Canvas', val: 'Live Graph' }
      ]
    },
    {
      id: 'finance',
      title: 'Quantum Finance & Risk Lab',
      path: '/labs/finance',
      domain: 'Quantitative Finance',
      tag: 'Markowitz QUBO · QAE Speedup',
      description: 'Two-mode quantitative finance laboratory: Discrete Markowitz Mean-Variance QUBO with interactive Efficient Frontier, and Option Pricing with Quantum Amplitude Estimation (QAE) O(1/N) speedup.',
      kpis: [
        { label: 'Frontier', val: 'Markowitz' },
        { label: 'Convergence', val: 'O(1/N) vs O(1/√N)' },
        { label: 'Risk Metrics', val: '95% VaR & CVaR' }
      ]
    },
    {
      id: 'cryptography',
      title: 'Quantum Cryptography, QKD & PQC Security',
      path: '/labs/cryptography',
      domain: 'Cybersecurity & Telecom',
      tag: 'BB84 · Eve Intercept · NIST CBOM',
      description: 'Simulate BB84 photon channels with live Eve eavesdropper interception and 11% QBER threshold alerts. Scan source code to generate Cryptographic Bill of Materials (CBOM) with NIST PQC replacements.',
      kpis: [
        { label: 'QKD Channel', val: 'BB84 / E91' },
        { label: 'Abort Threshold', val: '11.0% QBER' },
        { label: 'PQC Standards', val: 'ML-KEM / ML-DSA' }
      ]
    },
    {
      id: 'qec-noise',
      title: 'Interactive QEC Lattice & Fault-Tolerance Lab',
      path: '/labs/qec-noise',
      domain: 'Fault Tolerance & Noise',
      tag: 'Rotated Surface Code · QLDPC · Decoders',
      description: 'Interactive error-correction sandbox: click data qubits to inject X/Z errors, observe real-time stabilizer plaquette lighting, run MWPM/BP-OSD decoders, and inspect log-log threshold scaling.',
      kpis: [
        { label: 'Lattices', val: 'Surface (d=3,5) & QLDPC' },
        { label: 'Decoders', val: 'MWPM / BP-OSD' },
        { label: 'Noise Sync', val: 'Custom / Hardware' }
      ]
    }
  ];

  return (
    <div className="lab-page-container">
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(180deg, #0d1117 0%, #000000 100%)',
        borderBottom: '1px solid var(--lab-border)',
        padding: '2.5rem 2rem 2rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '0.75rem'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '3px 10px',
          borderRadius: '16px',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          background: 'rgba(0, 229, 255, 0.06)',
          fontSize: '0.72rem',
          fontFamily: 'var(--lab-font-mono)',
          color: 'var(--lab-cyan)'
        }}>
          <span>ALPHA PARADOX</span>
          <span>•</span>
          <span>INTERACTIVE QUANTUM WORKBENCHES</span>
        </div>

        <h1 style={{
          fontSize: '2.4rem',
          fontWeight: '900',
          letterSpacing: '-0.5px',
          margin: 0,
          color: '#ffffff'
        }}>
          Quantum Domain Labs
        </h1>

        <p style={{
          maxWidth: '720px',
          fontSize: '0.95rem',
          color: 'var(--lab-text-secondary)',
          lineHeight: '1.6',
          margin: 0
        }}>
          Explore 6 specialized, fully interactive quantum laboratories. Every workbench features real-time numerical simulation, classical baseline comparisons, interactive visualizers, and direct circuit export into Composer.
        </p>

        {/* Global Telemetry Metrics */}
        <div style={{
          display: 'flex',
          gap: '1.5rem',
          marginTop: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <div className="lab-kpi-box" style={{ width: '160px', textAlign: 'center' }}>
            <span className="lab-kpi-label">Active Workbenches</span>
            <span className="lab-kpi-value cyan">6 Labs</span>
          </div>
          <div className="lab-kpi-box" style={{ width: '160px', textAlign: 'center' }}>
            <span className="lab-kpi-label">Math Engines</span>
            <span className="lab-kpi-value emerald">Real Simulation</span>
          </div>
          <div className="lab-kpi-box" style={{ width: '160px', textAlign: 'center' }}>
            <span className="lab-kpi-label">Composer Bridge</span>
            <span className="lab-kpi-value cyan">Synchronized</span>
          </div>
          <div className="lab-kpi-box" style={{ width: '160px', textAlign: 'center' }}>
            <span className="lab-kpi-label">Guided Mode</span>
            <span className="lab-kpi-value amber">Auto-Graded</span>
          </div>
        </div>

        {/* Role-Based Access & Quota Control Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '1200px',
          marginTop: '1.5rem',
          padding: '10px 16px',
          background: 'var(--lab-bg-subpanel)',
          border: '1px solid var(--lab-border)',
          borderRadius: '6px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--lab-text-secondary)', fontWeight: '600' }}>
              ACCESS MODE:
            </span>
            <div className="lab-toggle-group">
              {Object.values(ROLES).map(r => (
                <button
                  key={r.id}
                  className={`lab-toggle-btn ${currentRole === r.id ? 'active' : ''}`}
                  onClick={() => setRole(r.id)}
                  style={{
                    fontSize: '0.7rem',
                    padding: '4px 10px',
                    color: currentRole === r.id ? r.color : ''
                  }}
                >
                  {r.badge}
                </button>
              ))}
            </div>
          </div>

          {/* User/Course Status */}
          <div style={{ fontSize: '0.74rem', color: 'var(--lab-text-secondary)' }}>
            <span style={{ color: 'var(--lab-text-primary)', fontWeight: '600' }}>{profile.name}</span>
            <span> · {profile.courseCode} ({profile.studentId})</span>
          </div>

          {/* Action Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'var(--lab-bg-input)',
              border: '1px solid var(--lab-border)',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontFamily: 'var(--lab-font-mono)'
            }}>
              <span>💳</span>
              <span style={{ color: 'var(--lab-cyan)', fontWeight: '700' }}>{credits}</span>
              <span style={{ color: 'var(--lab-text-muted)', fontSize: '0.64rem' }}>Credits</span>
            </div>

            <button
              onClick={() => setInstructorModalOpen(true)}
              className="lab-action-btn"
              style={{ fontSize: '0.72rem', color: 'var(--lab-emerald)', borderColor: 'rgba(16, 185, 129, 0.4)' }}
            >
              <span>🎓 Faculty Dashboard</span>
            </button>

            <button
              onClick={() => setDeploymentModalOpen(true)}
              className="lab-action-btn"
              style={{ fontSize: '0.72rem' }}
            >
              <span>🏢 VPC / Host</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of 6 Labs */}
      <main className="labs-hub-grid">
        {domainLabs.map(lab => (
          <div
            key={lab.id}
            className="lab-hub-card"
            onClick={() => navigate(lab.path)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="lab-hub-badge">{lab.domain}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--lab-text-muted)', fontFamily: 'var(--lab-font-mono)' }}>
                  {lab.tag}
                </span>
              </div>

              <h3 style={{
                fontSize: '1.15rem',
                fontWeight: '700',
                margin: 0,
                color: 'var(--lab-text-primary)'
              }}>
                {lab.title}
              </h3>

              <p style={{
                fontSize: '0.82rem',
                color: 'var(--lab-text-secondary)',
                lineHeight: '1.5',
                margin: 0
              }}>
                {lab.description}
              </p>
            </div>

            {/* Micro KPI Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '6px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              paddingTop: '0.75rem'
            }}>
              {lab.kpis.map((kpi, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--lab-text-muted)', fontFamily: 'var(--lab-font-mono)' }}>
                    {kpi.label}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--lab-text-primary)', fontWeight: '600', fontFamily: 'var(--lab-font-mono)' }}>
                    {kpi.val}
                  </span>
                </div>
              ))}
            </div>

            {/* Launch Button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '0.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.04)'
            }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--lab-cyan)', fontWeight: '600' }}>
                Launch Interactive Workbench
              </span>
              <span style={{ color: 'var(--lab-cyan)', fontSize: '1rem', transition: 'transform 0.15s ease' }}>
                →
              </span>
            </div>
          </div>
        ))}
      </main>

      <InstructorDashboardModal
        isOpen={instructorModalOpen}
        onClose={() => setInstructorModalOpen(false)}
      />

      <EnterpriseDeploymentModal
        isOpen={deploymentModalOpen}
        onClose={() => setDeploymentModalOpen(false)}
      />

      <UnifiedNavbar session={session} />
    </div>
  );
}

