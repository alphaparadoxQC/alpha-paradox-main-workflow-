import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearAndReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.href = '/home';
  };

  handleGoHome = () => {
    window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#05070a',
          color: '#f0f6fc',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            maxWidth: '680px',
            width: '100%',
            background: 'rgba(18, 22, 31, 0.95)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 8px 32px rgba(239, 68, 68, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.8rem' }}>⚠️</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#ef4444', fontWeight: '700' }}>
                Application Runtime Guard
              </h2>
            </div>
            
            <p style={{ color: '#8b949e', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              An unexpected runtime error occurred while rendering this view. The state was isolated to protect your workspace.
            </p>

            {this.state.error && (
              <pre style={{
                background: '#090d13',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                padding: '1rem',
                fontSize: '0.8rem',
                fontFamily: 'JetBrains Mono, monospace',
                color: '#ff7b72',
                overflowX: 'auto',
                marginBottom: '1.5rem',
                whiteSpace: 'pre-wrap'
              }}>
                {this.state.error.toString()}
                {this.state.error.stack && `\n\n${this.state.error.stack}`}
                {this.state.errorInfo?.componentStack && `\n\nComponent Hierarchy:${this.state.errorInfo.componentStack}`}
              </pre>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleClearAndReset}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
                title="Clears any stale or corrupted localStorage state and returns to Dashboard"
              >
                Reset Corrupted State
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#f0f6fc',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Return to Dashboard
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  background: '#0284c7',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

