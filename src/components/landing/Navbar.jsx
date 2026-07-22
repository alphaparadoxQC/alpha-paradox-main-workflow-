import { useEffect, useState } from 'react';
import { Menu, X, ChevronDown, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import logo from '../../assets/landing/alpha-paradox-logo.png';

const LINKS = [
  { href: '#why', label: 'Why' },
  { href: '#simulator', label: 'Simulator' },
  { href: '#chemistry', label: 'Chemistry' },
  { href: '#logistics', label: 'Logistics' },
  { href: '#vision', label: 'Vision' },
  { href: '#research', label: 'Research' },
];

export default function Navbar({ onOpenProducts }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLinkClick = () => setOpen(false);

  const handleProducts = () => {
    handleLinkClick();
    onOpenProducts();
  };

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner">
        <a href="#top" className="logo" onClick={handleLinkClick}>
          <img src={logo} alt="Alpha Paradox QC" className="logo-img" />
        </a>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={handleLinkClick}>
              {l.label}
            </a>
          ))}
          <a href="#products" onClick={(e) => { e.preventDefault(); handleProducts(); }} className="nav-products-link">
            Products <ChevronDown size={14} style={{ display: 'inline', verticalAlign: '-2px', opacity: 0.7 }} />
          </a>
          <Link to="/about" onClick={handleLinkClick}>About Us</Link>
          <Link to="/gallery" onClick={handleLinkClick}>Gallery</Link>

          {/* Mobile-only auth action (desktop shows it as a button outside this list) */}
          {!loading && (
            <a
              href="#auth"
              className="nav-auth-mobile"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick();
                navigate(user ? '/builder' : '/auth');
              }}
            >
              {user ? 'Open Builder' : 'Sign In'}
            </a>
          )}
        </nav>

        <div className="nav-actions">
          <Button
            size="default"
            className="nav-cta-btn"
            disabled={loading}
            onClick={() => navigate(user ? '/builder' : '/auth')}
          >
            {loading ? '...' : user ? 'Open Builder' : 'Sign In'}
            {!loading && user && <ArrowRight className="w-4 h-4 ml-1.5" />}
          </Button>
        </div>

        <button
          className="nav-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X color="#fff" size={22} /> : <Menu color="#fff" size={22} />}
        </button>
      </div>
    </header>
  );
}
