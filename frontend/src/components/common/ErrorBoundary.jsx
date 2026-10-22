import React from 'react';
import { AlertTriangle, RefreshCw, Home, Trash2 } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("HomeJoy Caught Runtime Error in UI Tree:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            padding: '24px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
          }}
        >
          <div 
            style={{
              maxWidth: '540px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              padding: '36px',
              boxShadow: '0 20px 40px rgba(0, 50, 40, 0.08)',
              border: '1.5px solid #e2e8f0',
              textAlign: 'center'
            }}
          >
            <div 
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fff1f2',
                color: '#e11d48',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Application Render Notice
            </h2>

            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '24px' }}>
              HomeJoy encountered a temporary UI rendering condition. You can reload the page or reset cached session data to continue smoothly.
            </p>

            {this.state.error && (
              <div 
                style={{
                  background: '#f1f5f9',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '0.825rem',
                  color: '#334155',
                  textAlign: 'left',
                  marginBottom: '24px',
                  overflowX: 'auto',
                  maxHeight: '120px'
                }}
              >
                <code>{this.state.error.toString()}</code>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  backgroundColor: '#00685b',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={18} />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleResetAndReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={18} />
                <span>Reset Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
