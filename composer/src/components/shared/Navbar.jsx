import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function Navbar({ session, user: directUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = session?.user || directUser;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/home') return location.pathname === '/home';
    if (path === '/labs') return location.pathname.startsWith('/labs');
    if (path === '/lab') return location.pathname.startsWith('/lab');
    if (path === '/composer') return location.pathname.startsWith('/composer') || location.pathname.startsWith('/composer-home');
    if (path === '/eda') return location.pathname.startsWith('/eda');
    if (path === '/vqpu') return location.pathname.startsWith('/vqpu');
    return false;
  };

  return (
    <nav className="top-navbar" style={{ position: 'relative', zIndex: 100 }}>
      <div className="nav-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }} title="Alpha Paradox Dashboard Home">
        <img src="/logo-1.jpg" alt="Alpha Paradox QC" className="nav-logo-img" />
      </div>
      <div className="nav-links">
        <a href="http://localhost:3000" className="nav-link" style={{ color: '#00E5FF', fontWeight: '600' }} title="Alpha Paradox Main Portal (localhost:3000)">
          ← HOME
        </a>
        <Link to="/home" className={`nav-link ${isActive('/home') ? 'active' : ''}`}>
          DASHBOARD HOME
        </Link>
        <Link to="/labs" className={`nav-link ${isActive('/labs') ? 'active' : ''}`}>
          LABS
        </Link>
        <Link to="/lab" className={`nav-link ${isActive('/lab') ? 'active' : ''}`}>
          NOTEBOOK
        </Link>
        <Link to="/composer-home" className={`nav-link ${isActive('/composer') ? 'active' : ''}`}>
          COMPOSER
        </Link>
        <Link to="/eda" className={`nav-link ${isActive('/eda') ? 'active' : ''}`}>
          EDA
        </Link>
        <Link to="/vqpu" className={`nav-link ${isActive('/vqpu') ? 'active' : ''}`}>
          ANALOG
        </Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {session ? (
          <>
            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>
              {user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Engineer')}
            </span>
            <button 
              onClick={handleSignOut} 
              className="nav-cta"
              style={{ 
                border: 'none', 
                cursor: 'pointer', 
                fontFamily: 'inherit',
                padding: '0.45rem 1.2rem',
                fontSize: '0.75rem'
              }}
            >
              SIGN OUT →
            </button>
          </>
        ) : location.pathname !== '/' ? (
          <button 
            onClick={() => navigate('/?redirect=' + encodeURIComponent(location.pathname))}
            className="nav-cta"
            style={{ 
              border: 'none', 
              cursor: 'pointer', 
              fontFamily: 'inherit',
              padding: '0.45rem 1.2rem',
              fontSize: '0.75rem'
            }}
          >
            SIGN IN →
          </button>
        ) : null}
      </div>
    </nav>
  );
}
