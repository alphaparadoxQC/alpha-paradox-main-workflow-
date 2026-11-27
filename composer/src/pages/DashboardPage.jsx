import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/shared/Navbar';
import '../App.css';

export default function DashboardPage({ session }) {
  const navigate = useNavigate();

  const launchTool = (path) => {
    navigate(path);
  };

  const tools = [
    { name: 'Quantum Labs', path: '/labs', bg: '#0284c7', glow: 'rgba(2, 132, 199, 0.6)' },
    { name: 'Start Coding', path: '/lab', bg: '#2563eb', glow: 'rgba(37, 99, 235, 0.6)' },
    { name: 'Start Composer', path: '/composer', bg: '#10b981', glow: 'rgba(16, 185, 129, 0.6)' },
    { name: 'Start EDA', path: '/eda', bg: '#0ea5e9', glow: 'rgba(14, 165, 233, 0.6)' },
    { name: 'Start Analog', path: '/vqpu', bg: '#0891b2', glow: 'rgba(8, 145, 178, 0.6)' },
  ];

  return (
    <div className="app-container" style={{ background: '#05070a', minHeight: '100vh', overflowY: 'auto', position: 'relative' }}>
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="dashboard-bg-video"
      >
        <source src="/matherchod44_slow10s_no_logo.mp4" type="video/mp4" />
      </video>

      {/* Top Navigation Bar */}
      <Navbar session={session} />

      <div
        className="main-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          position: 'relative',
          zIndex: 10,
          maxWidth: '800px',
          margin: '0',
          paddingLeft: '4rem',
          paddingTop: '4rem'
        }}
      >
        <h1
          style={{
            color: '#00E5FF',
            fontSize: '4rem',
            textShadow: '0 4px 15px rgba(0, 229, 255, 0.3)',
            textAlign: 'left',
            fontWeight: '900',
            letterSpacing: '2px'
          }}
        >
          THE ALPHA BOOK
        </h1>
        <p
          style={{
            color: '#ffffff',
            fontSize: '1.3rem',
            marginTop: '1.5rem',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)',
            textAlign: 'left',
            lineHeight: '1.6'
          }}
        >
          The next-generation interactive notebook engineered exclusively for{' '}
          <span style={{ color: '#00E5FF', fontWeight: 'bold', textShadow: '0 0 15px rgba(0, 229, 255, 0.8)' }}>
            quantum computing
          </span>
          —build, test, and scale algorithms seamlessly from raw Python code to fault-tolerant virtual silicon.
        </p>
      </div>

      {/* Action Pills */}
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
