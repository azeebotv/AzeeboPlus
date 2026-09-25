import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Creator ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: 'var(--creator-bg)',
            color: 'var(--creator-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
          }}
        >
          <div style={{ maxWidth: 500, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#x26A0;</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: 'var(--creator-orange)' }}>
              Something went wrong
            </h1>
            <p style={{ color: 'var(--creator-text-muted)', marginBottom: 24, fontSize: 14 }}>
              The creator portal encountered an error and could not render.
            </p>
            <pre
              style={{
                backgroundColor: 'var(--creator-dark)',
                border: '1px solid var(--creator-border)',
                borderRadius: 8,
                padding: 16,
                fontSize: 12,
                color: 'var(--creator-red)',
                textAlign: 'left',
                overflow: 'auto',
                maxHeight: 200,
                marginBottom: 24,
              }}
            >
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
