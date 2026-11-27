import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function ComposerNavbar({ 
  user, 
  onRun, 
  onConfigure,
  panels = {},
  onTogglePanel,
  onFileAction,
  onHelpAction
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const navRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U';

  return (
    <nav className="top-navbar">
      <div className="navbar-left">
        <button className="hamburger-btn">≡</button>
        <Link to="/home">
          <img src="/logo-1.jpg" alt="Alpha Paradox QC" className="nav-logo-img" />
        </Link>
        <div className="nav-menus" ref={navRef}>
          <div style={{ position: 'relative' }}>
            <button 
              className="nav-menu-btn" 
              onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}
            >
              File {openMenu === 'file' ? '▴' : '▾'}
            </button>
            {openMenu === 'file' && (
              <div className="custom-dropdown-menu" style={{ minWidth: '200px', top: 'calc(100% + 8px)' }}>
                <div className="custom-dropdown-item" onClick={() => { onFileAction?.('new'); setOpenMenu(null); }}>New</div>
                <div className="custom-dropdown-item" onClick={() => { onFileAction?.('open-recent'); setOpenMenu(null); }}>
                  Open Recent <span style={{ marginLeft: 'auto', fontSize: '0.6rem' }}>▶</span>
                </div>
                <div className="custom-dropdown-item" onClick={() => { onFileAction?.('make-copy'); setOpenMenu(null); }}>Make a Copy</div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '4px 0' }} />
                <div className="custom-dropdown-item" onClick={() => { onFileAction?.('save-project'); setOpenMenu(null); }}>
                  💾 Save Project (.alpha)
                </div>
                <div className="custom-dropdown-item" onClick={() => { onFileAction?.('open-project'); setOpenMenu(null); }}>
                  📂 Open Project (.alpha)
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '4px 0' }} />
                <div className="custom-dropdown-item" onClick={() => { onFileAction?.('open-in-notebook'); setOpenMenu(null); }}>
                  📓 Push to Notebook
                </div>
                <div className="custom-dropdown-item" onClick={() => { onFileAction?.('run-lvs'); setOpenMenu(null); }}>
                  🔍 Run LVS Check (Layout vs Schematic)
                </div>
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button 
              className="nav-menu-btn" 
              onClick={() => setOpenMenu(openMenu === 'view' ? null : 'view')}
            >
              View {openMenu === 'view' ? '▴' : '▾'}
            </button>
            {openMenu === 'view' && (
              <div className="custom-dropdown-menu" style={{ minWidth: '180px', top: 'calc(100% + 8px)' }}>
                <div className="custom-dropdown-item" onClick={() => { onTogglePanel?.('probability'); setOpenMenu(null); }}>
                  {panels.showProbability === false ? 'Open' : 'Close'} Probability
                </div>
                <div className="custom-dropdown-item" onClick={() => { onTogglePanel?.('gateMatrix'); setOpenMenu(null); }}>
                  {panels.showGateMatrix === false ? 'Open' : 'Close'} GateMatrix
                </div>
                <div className="custom-dropdown-item" onClick={() => { onTogglePanel?.('latestJobs'); setOpenMenu(null); }}>
                  {panels.showLatestJobs === false ? 'Open' : 'Close'} LatestJobs
                </div>
                <div className="custom-dropdown-item" onClick={() => { onTogglePanel?.('hamiltonian'); setOpenMenu(null); }}>
                  {panels.jobsPanelMode === 'hamiltonian' ? 'Close' : 'Open'} Physical Hamiltonian
                </div>
                <div className="custom-dropdown-item" onClick={() => { onTogglePanel?.('pulsePanel'); setOpenMenu(null); }}>
                  {panels.showPulsePanel === false ? 'Open' : 'Close'} Microwave Pulse Schedule
                </div>
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button 
              className="nav-menu-btn" 
              onClick={() => setOpenMenu(openMenu === 'help' ? null : 'help')}
            >
              Help {openMenu === 'help' ? '▴' : '▾'}
            </button>
            {openMenu === 'help' && (
              <div className="custom-dropdown-menu" style={{ minWidth: '190px', top: 'calc(100% + 8px)' }}>
                <div className="custom-dropdown-item" onClick={() => { onHelpAction?.('Documentation'); setOpenMenu(null); }}>Documentation</div>
                <div className="custom-dropdown-item" onClick={() => { onHelpAction?.('Shortcut Keys'); setOpenMenu(null); }}>Shortcut Keys</div>
                <div className="custom-dropdown-item" onClick={() => { onHelpAction?.('Release Notes'); setOpenMenu(null); }}>Release Notes</div>
                <div className="custom-dropdown-item" onClick={() => { onHelpAction?.('Bug Report/Feedback'); setOpenMenu(null); }}>Bug Report/Feedback</div>
                <div className="custom-dropdown-item" onClick={() => { onHelpAction?.('About Us'); setOpenMenu(null); }}>About Us</div>
              </div>
            )}
          </div>

          <button 
            className="nav-menu-btn" 
            onClick={() => onFileAction?.('open-algorithms')}
            style={{ fontWeight: '500', color: '#e5e7eb' }}
          >
            Algorithms
          </button>
        </div>
      </div>

      <div className="navbar-center">
        <button 
          onClick={() => onTogglePanel?.('hamiltonian')}
          title="Toggle Physical Hamiltonian View in Dashboard"
          style={{
            background: (panels.jobsPanelMode === 'hamiltonian' || panels.showPulsePanel) ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
            border: (panels.jobsPanelMode === 'hamiltonian' || panels.showPulsePanel) ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
            color: (panels.jobsPanelMode === 'hamiltonian' || panels.showPulsePanel) ? '#38bdf8' : '#cbd5e1',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span>〰</span> Physical Drive & Hamiltonian
        </button>
        <button className="theme-toggle" title="Toggle Theme" />
        <button className="badge-premium">
          <span className="icon">👑</span>
          Try Premium
        </button>
        <div className="badge-credits">
          <span style={{ fontSize: '0.6rem' }}>◈</span>
          Credits: 5
        </div>
      </div>

      <div className="navbar-right">
        <button className="run-btn" onClick={onRun}>
          Run ›
        </button>
        
        <div style={{ position: 'relative' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}
            onClick={() => setOpenMenu(openMenu === 'profile' ? null : 'profile')}
          >
            <div className="user-avatar" title={user?.email || 'User'}>
              {userInitials}
            </div>
            <span className="user-name">
              {user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'User')}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', marginLeft: '2px' }}>
              {openMenu === 'profile' ? '▲' : '▼'}
            </span>
          </div>

          {openMenu === 'profile' && (
            <div className="custom-dropdown-menu" style={{ 
              minWidth: '220px', 
              top: 'calc(100% + 12px)', 
              right: 0, 
              left: 'auto',
              padding: '1rem',
              cursor: 'default'
            }}>
              <div style={{ marginBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem' }}>
                <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#fff', marginBottom: '0.2rem' }}>
                  {user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'User')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  {user?.email || 'No email provided'}
                </div>
              </div>
              <div 
                className="custom-dropdown-item" 
                onClick={() => { setOpenMenu(null); handleSignOut(); }}
                style={{ color: '#ef4444', fontWeight: '500' }}
              >
                Sign Out
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
