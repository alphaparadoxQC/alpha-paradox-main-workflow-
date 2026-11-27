import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          background: '#252526',
          color: '#f87171',
          border: '1px solid #dc2626',
          borderRadius: '4px',
          margin: '10px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#ef4444' }}>
            ⚠️ {this.props.fallbackTitle || 'Component Error'}
          </h4>
          <p style={{ color: '#d4d4d4', marginBottom: '10px' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: '#007acc',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Retry View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
