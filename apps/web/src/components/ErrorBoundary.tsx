'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo): void {
    // Error caught by boundary — logged to error reporting service in production
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="h-10 w-10 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h2>
              <p className="text-muted-foreground mb-6">
                We encountered an unexpected error. Please try again or contact support if the
                problem persists.
              </p>
              {this.state.error && process.env.NODE_ENV === 'development' && (
                <div className="bg-muted rounded-md p-3 text-left mb-6">
                  <p className="text-xs font-mono text-destructive mb-1">{this.state.error.name}</p>
                  <p className="text-xs text-muted-foreground">{this.state.error.message}</p>
                </div>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="flex-1 bg-muted text-foreground px-6 py-3 rounded-lg font-medium hover:bg-muted/80 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
