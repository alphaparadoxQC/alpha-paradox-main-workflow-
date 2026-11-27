import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import useNotebookStore from '../../stores/notebookStore';
import { useBackendStore } from '../../stores/backendStore';
import WorkflowStepper from './WorkflowStepper';
import '../../styles/unified-navbar.css';

export default function UnifiedNavbar({ session, extraActions = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const user = session?.user;
  const currentPath = location.pathname;

  // Global store states for dynamic status
  const kernelStatus = useNotebookStore((s) => s.kernelStatus);
  const selectedBackend = useBackendStore((s) => s.selectedBackend);
  const noiseType = useBackendStore((s) => s.noiseConfig?.noiseType);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Determine active product tab
  const isNotebook = currentPath.startsWith('/lab');
  const isComposer = currentPath.startsWith('/composer') || currentPath.startsWith('/preview-composer');
  const isEda = currentPath.startsWith('/eda');
  const isAnalog = currentPath.startsWith('/vqpu');
  const isLabs = currentPath.startsWith('/labs');

  // Dynamic backend status text based on active interface
  let statusText = 'Ready';
  let statusColor = '#10b981';
  if (isLabs) {
    statusText = 'Domain Labs Engine';
    statusColor = '#00E5FF';
  } else if (isNotebook) {
    statusText = kernelStatus === 'idle' ? 'Kernel: Connected' : `Kernel: ${kernelStatus}`;
    if (kernelStatus === 'error') statusColor = '#ef4444';
    else if (kernelStatus === 'busy') statusColor = '#f59e0b';
  } else if (isComposer) {
    statusText = `${selectedBackend}`;
  } else if (isEda) {
    statusText = 'Alpha Metal 2.4';
  } else if (isAnalog) {
    statusText = 'Schrödinger Solver';
  }

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'AP';

  return (
    <footer className="unified-downbar">
      {/* Left: Brand Logo & Home Link */}
      <div className="unav-left">
        <div className="unav-brand" onClick={() => navigate('/home')} title="Alpha Paradox Home">
          <img src="/logo-1.jpg" alt="Alpha Paradox QC" className="unav-logo-img" />
        </div>
        <button
          className={`unav-product-tab ${currentPath === '/home' ? 'active' : ''}`}
          onClick={() => navigate('/home')}
          title="Dashboard Home"
        >
          <span>Home</span>
        </button>
      </div>

      {/* Center: Workflow Stepper & Extra Actions */}
      <div className="unav-center">
        <WorkflowStepper />
        {extraActions}
      </div>

      {/* Right: Active Status, Cloud Sync & User Profile */}
      <div className="unav-right">
        <div className="unav-status-badge" title="Active Backend Engine Status">
          <div className="unav-status-dot" style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
          <span>{statusText}</span>
        </div>

        <div className="unav-sync-badge" title="Project State Syncing">
          <span>Synced</span>
        </div>

        {/* User Profile */}
        <div className="unav-profile" ref={dropdownRef}>
          <button
            className="unav-user-btn"
            onClick={() => setProfileOpen(!profileOpen)}
            title="User Account"
          >
            <div className="unav-avatar">{userInitials}</div>
            <span className="unav-username">
              {user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Engineer')}
            </span>
            <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{profileOpen ? '▲' : '▼'}</span>
          </button>

          {profileOpen && (
            <div className="unav-dropdown">
              <div className="unav-dropdown-header">
                <div className="unav-dropdown-name">
                  {user?.user_metadata?.full_name || 'Quantum Engineer'}
                </div>
                <div className="unav-dropdown-email">{user?.email || 'engineer@alphaparadox.qc'}</div>
              </div>

              <div
                className="unav-dropdown-item"
                onClick={() => { setProfileOpen(false); navigate('/home'); }}
              >
                Dashboard Home
              </div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

              <div
                className="unav-dropdown-item danger"
                onClick={() => { setProfileOpen(false); handleSignOut(); }}
              >
                Sign Out
              </div>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
