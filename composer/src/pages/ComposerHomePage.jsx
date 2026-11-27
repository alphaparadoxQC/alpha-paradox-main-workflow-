import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/shared/Navbar';
import '../App.css';

export default function ComposerHomePage({ session }) {
  const navigate = useNavigate();

  const launchTool = (path) => {
    if (!session) {
      navigate(`/?redirect=${encodeURIComponent(path)}`);
    } else {
      navigate(path);
    }
  };

  const tools = [
    { name: 'Start Composer', path: '/composer', bg: '#16a34a', glow: 'rgba(22, 163, 74, 0.6)' },
    { name: 'Start EDA', path: '/eda', bg: '#2563eb', glow: 'rgba(37, 99, 235, 0.6)' },
    { name: 'Start Analog', path: '/vqpu', bg: '#0891b2', glow: 'rgba(8, 145, 178, 0.6)' },
    { name: 'Start Coding', path: '/lab', bg: '#9333ea', glow: 'rgba(147, 51, 234, 0.6)' },
  ];

  return (
    <div className="app-container">
      {/* Background Video specific to Composer Home */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="dashboard-bg-video"
        style={{ left: '8cm', width: 'calc(100% - 8cm)' }}
      >
        <source src="/lullu20.mp4" type="video/mp4" />
      </video>

      {/* Top Navigation Bar */}
      <Navbar session={session} />

      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', position: 'relative', zIndex: 10, padding: 'calc(20px + 0.5cm) 30px 20px 30px', width: '100%', boxSizing: 'border-box' }}>
        <h1 style={{ color: '#22c55e', fontSize: '4.5rem', textShadow: '0 4px 20px rgba(0,0,0,0.8)', textAlign: 'left', margin: '0 0 1.5rem 0', fontWeight: '800', letterSpacing: '2px', lineHeight: '1.1' }}>
          THE ALPHA <br />
          <span style={{ color: 'rgba(34, 197, 94, 0.7)', display: 'inline-block', marginLeft: '4cm' }}>COMPOSER</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.95)', fontSize: '1.75rem', marginTop: '0', textShadow: '0 2px 10px rgba(0,0,0,0.8)', textAlign: 'left', maxWidth: '7.5cm', lineHeight: '1.7' }}>
          Stop debugging syntax. Drag, drop, and simulate at the speed of thought—from your first Hadamard gate to 1,100-qubit fault-tolerant reality in seconds.
        </p>
      </div>

      {/* Action Buttons to Launch Tools */}
      <div 
        style={{ 
          position: 'absolute', 
          bottom: '36px', 
          right: '28px', 
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '260px'
        }}
      >
        {tools.map((tool) => (
          <button
            key={tool.name}
            onClick={() => launchTool(tool.path)}
            style={{
              padding: '14px 20px',
              backgroundColor: tool.bg,
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              boxShadow: `0 4px 18px ${tool.glow}`,
              fontWeight: '700',
              fontSize: '1.05rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
            }}
          >
            <span>{tool.name}</span>
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
