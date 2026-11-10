// ──────────────────────────────────────────────────
// Golden Leaf Finance — Error Boundary Component
// ──────────────────────────────────────────────────

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

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

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to error tracking service (Sentry/Firebase Crashlytics)
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-16 h-16 rounded-2xl bg-status-error-light flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-status-error" />
          </div>
          <h3 className="text-lg font-display font-semibold text-rich-black">
            Something went wrong
          </h3>
          <p className="mt-1.5 text-sm text-rich-silver font-body text-center max-w-md">
            An unexpected error occurred. Please try again or contact support if the issue persists.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 p-3 bg-surface-cream rounded-xl text-xs text-status-error max-w-lg overflow-auto">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleRetry}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-white font-semibold text-sm shadow-gold hover:shadow-gold-lg transition-all"
          >
            <RefreshCcw size={16} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
