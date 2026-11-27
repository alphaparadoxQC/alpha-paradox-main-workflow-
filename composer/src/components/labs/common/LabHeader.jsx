import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoleStore, ROLES } from '../../../stores/roleStore';
import InstructorDashboardModal from './InstructorDashboardModal';
import EnterpriseDeploymentModal from './EnterpriseDeploymentModal';

export default function LabHeader({
  title,
  domain,
  status = 'ONLINE',
  onToggleDrawer,
  drawerOpen,
  onOpenComposer,
  extraActions
}) {
  const navigate = useNavigate();
  const currentRole = useRoleStore(state => state.currentRole);
  const setRole = useRoleStore(state => state.setRole);
  const credits = useRoleStore(state => state.credits);

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [instructorModalOpen, setInstructorModalOpen] = useState(false);
  const [deploymentModalOpen, setDeploymentModalOpen] = useState(false);

  const roleMeta = ROLES[currentRole] || ROLES.student;

  return (
    <>
      <header className="lab-header">
        <div className="lab-header-left">
          <button
            className="lab-back-btn"
            onClick={() => navigate('/labs')}
            title="Back to Quantum Labs Hub"
          >
            <span>←</span>
            <span>Labs Hub</span>
          </button>

          <div style={{ width: '1px', height: '18px', background: 'var(--lab-border)' }} />

          <div className="lab-title-badge">
            <span style={{ color: 'var(--lab-text-secondary)', fontSize: '0.8rem' }}>
              {domain} /
            </span>
            <span>{title}</span>
            <span className="lab-status-pill">● {status}</span>
          </div>
        </div>

        <div className="lab-header-right">
          {extraActions}

          {/* Credits Meter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'var(--lab-bg-subpanel)',
              border: '1px solid var(--lab-border)',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontFamily: 'var(--lab-font-mono)'
            }}
            title="Remaining vQPU compute execution credits"
          >
            <span>💳</span>
            <span style={{ color: credits > 20 ? 'var(--lab-cyan)' : 'var(--lab-amber)', fontWeight: '600' }}>
              {credits}
            </span>
            <span style={{ color: 'var(--lab-text-muted)', fontSize: '0.64rem' }}>Credits</span>
          </div>

          {/* Role Switcher Button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="lab-action-btn"
              style={{
                borderColor: roleMeta.color,
                color: roleMeta.color,
                fontSize: '0.72rem',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Switch Platform Access Mode"
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: roleMeta.color }} />
              <span>{roleMeta.badge}</span>
              <span style={{ fontSize: '0.6rem' }}>▼</span>
            </button>

            {roleMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  background: 'var(--lab-bg-panel)',
                  border: '1px solid var(--lab-border)',
                  borderRadius: '6px',
                  width: '240px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
                  zIndex: 100,
                  padding: '6px'
                }}
              >
                <div style={{ fontSize: '0.66rem', color: 'var(--lab-text-muted)', padding: '4px 8px', textTransform: 'uppercase' }}>
                  Select Access Mode
                </div>
                {Object.values(ROLES).map(r => (
                  <div
                    key={r.id}
                    onClick={() => {
                      setRole(r.id);
                      setRoleMenuOpen(false);
                    }}
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: currentRole === r.id ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
                      border: currentRole === r.id ? '1px solid var(--lab-cyan)' : '1px solid transparent',
                      marginBottom: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: '600', color: r.color }}>
                        {r.title}
                      </span>
                      {currentRole === r.id && (
                        <span style={{ fontSize: '0.66rem', color: 'var(--lab-cyan)' }}>✓ Active</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--lab-text-secondary)', marginTop: '2px' }}>
                      {r.tagline}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructor Mode Quick Launch Button */}
          {currentRole === 'instructor' && (
            <button
              className="lab-action-btn"
              onClick={() => setInstructorModalOpen(true)}
              style={{ color: 'var(--lab-emerald)', borderColor: 'rgba(16, 185, 129, 0.4)', fontSize: '0.72rem' }}
              title="Open Syllabus and Cohort Gradebook"
            >
              <span>🎓 Faculty Dashboard</span>
            </button>
          )}

          {/* Enterprise Deployment Button */}
          <button
            className="lab-action-btn"
            onClick={() => setDeploymentModalOpen(true)}
            style={{ fontSize: '0.72rem' }}
            title="View On-Prem Docker & VPC Setup"
          >
            <span>🏢 VPC / Host</span>
          </button>

          {onOpenComposer && (
            <button
              className="lab-action-btn"
              onClick={onOpenComposer}
              title="Export circuit into Alpha Composer Studio"
              style={{ color: 'var(--lab-cyan)', borderColor: 'rgba(0, 229, 255, 0.4)' }}
            >
              <span>⚡ Open in Composer</span>
            </button>
          )}

          <button
            className={`lab-action-btn ${drawerOpen ? 'primary' : ''}`}
            onClick={onToggleDrawer}
            title="Toggle Guided Lab Checklist and Report"
          >
            <span>📋 Guided Lab Mode</span>
            <span style={{ fontSize: '0.7rem' }}>{drawerOpen ? '▶' : '◀'}</span>
          </button>
        </div>
      </header>

      {/* Instructor Dashboard Modal */}
      <InstructorDashboardModal
        isOpen={instructorModalOpen}
        onClose={() => setInstructorModalOpen(false)}
      />

      {/* Enterprise Deployment Modal */}
      <EnterpriseDeploymentModal
        isOpen={deploymentModalOpen}
        onClose={() => setDeploymentModalOpen(false)}
      />
    </>
  );
}
