import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Country, State } from 'country-state-city';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/shared/Navbar';
import '../App.css';

export default function AuthPage({ session }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [animate, setAnimate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const redirectTarget = new URLSearchParams(window.location.search).get('redirect');
  const targetLabel = {
    '/lab': 'Quantum Notebook',
    '/composer': 'Quantum Circuit Composer',
    '/eda': 'Silicon EDA Engine',
    '/vqpu': 'Analog TCAD Engine'
  }[redirectTarget];

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    username: '',
    phoneCode: '',
    phone: '',
    country: '',
    state: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/home';
      if (redirectUrl && redirectUrl !== '/') {
        navigate(redirectUrl);
      } else {
        navigate('/home');
      }
    }
  }, [session, navigate]);

  // Trigger animation on toggle
  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 400);
    setMessage({ type: '', text: '' });
    return () => clearTimeout(timer);
  }, [isLogin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'country') {
      setFormData(prev => ({ ...prev, [name]: value, state: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const countries = useMemo(() => Country.getAllCountries(), []);
  const availableStates = useMemo(() => {
    return formData.country ? State.getStatesOfCountry(formData.country) : [];
  }, [formData.country]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;

        if (data?.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                full_name: formData.fullName,
                username: formData.username,
                phone_number: `${formData.phoneCode} ${formData.phone}`.trim(),
                country: formData.country,
                state: formData.state
              }
            ]);
          if (profileError) throw profileError;
        }
        setMessage({ type: 'success', text: 'Registration successful! Check your email to confirm.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="auth-bg-video"
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>

      {/* Top Navigation Bar */}
      <Navbar session={session} />

      <div className="main-content">
        <div className="split-left">
          <div className="logo-container">
            <img src="/logo-main.jpg" alt="Alpha Paradox QC" className="logo-image" />
          </div>
        </div>

        <div className="split-right">
          <div className="auth-card">
            <div className="auth-header">
              <h2>{isLogin ? 'Witness this new computing era at the Alpha stage' : 'Create Account'}</h2>
              <p>
                {targetLabel
                  ? `Sign in to access ${targetLabel}`
                  : (isLogin ? 'Sign in to your quantum workload manager' : 'Join Alpha Paradox QC today')}
              </p>
            </div>

            {message.text && (
              <div style={{
                padding: '1rem', marginBottom: '1.5rem', borderRadius: '8px',
                backgroundColor: message.type === 'error' ? 'rgba(255, 59, 48, 0.1)' : 'rgba(52, 199, 89, 0.1)',
                color: message.type === 'error' ? '#ff453a' : '#32d74b',
                border: `1px solid ${message.type === 'error' ? 'rgba(255, 59, 48, 0.3)' : 'rgba(52, 199, 89, 0.3)'}`,
                fontSize: '0.9rem'
              }}>
                {message.text}
              </div>
            )}

            <div className={`form-container ${animate ? 'fade-enter-active' : ''} ${!animate ? 'fade-enter' : ''}`} style={{ opacity: animate ? 0.8 : 1, transform: animate ? 'translateY(5px)' : 'translateY(0)' }}>
              <form onSubmit={handleAuth}>
                {!isLogin && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="form-input" placeholder="Enter your full name" required />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Username</label>
                        <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="form-input" placeholder="Choose a username" required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select name="phoneCode" value={formData.phoneCode} onChange={handleInputChange} className="form-input" style={{ width: '35%', padding: '1rem 0.5rem' }} required>
                            <option value="" disabled>Code</option>
                            {countries.map((country) => (
                              <option key={`phone-${country.isoCode}`} value={`+${country.phonecode}`}>
                                +{country.phonecode} ({country.isoCode})
                              </option>
                            ))}
                          </select>
                          <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" style={{ width: '65%' }} placeholder="000-0000" required />
                        </div>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Country</label>
                        <select name="country" value={formData.country} onChange={handleInputChange} className="form-input" required>
                          <option value="" disabled>Select Country</option>
                          {countries.map((country) => (
                            <option key={country.isoCode} value={country.isoCode}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">State</label>
                        <select name="state" value={formData.state} onChange={handleInputChange} className="form-input" required disabled={!formData.country || availableStates.length === 0}>
                          <option value="" disabled>Select State</option>
                          {availableStates.map((state) => (
                            <option key={state.isoCode} value={state.isoCode}>
                              {state.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label className="form-label">Email ID</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="form-input" placeholder="name@company.com" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="form-input" placeholder="••••••••" required />
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                </button>
              </form>
            </div>
            <div className="auth-toggle">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <span onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
