// ──────────────────────────────────────────────────
// Golden Leaf Finance — Error Boundary Component
// ──────────────────────────────────────────────────

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isAutoReloading: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private reloadTimeoutId: any = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isAutoReloading: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isAutoReloading: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);

    // If chunk or dynamic import failure, seamlessly auto-recover once
    const isChunk =
      error?.name === 'ChunkLoadError' ||
      /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed/i.test(
        error?.message || ''
      );

    if (isChunk && typeof window !== 'undefined') {
      const reloadKey = 'glf_boundary_chunk_reload';
      const last = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      if (!last || now - Number(last) > 10000) {
        sessionStorage.setItem(reloadKey, String(now));
        this.setState({ isAutoReloading: true });
        this.reloadTimeoutId = setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    }
  }

  componentWillUnmount(): void {
    if (this.reloadTimeoutId) {
      clearTimeout(this.reloadTimeoutId);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, isAutoReloading: false });
  };

  handleGoDashboard = (): void => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const isChunk =
        this.state.error?.name === 'ChunkLoadError' ||
        /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed/i.test(
          this.state.error?.message || ''
        );

      return (
        <div className="flex flex-col items-center justify-center py-20 px-6 font-sans">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-[#D4AF37]">
            {this.state.isAutoReloading ? (
              <RefreshCcw size={28} className="animate-spin text-[#D4AF37]" />
            ) : (
              <AlertTriangle size={30} className="text-[#D4AF37]" />
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[#0B1F3A] tracking-tight text-center">
            {this.state.isAutoReloading
              ? 'Restoring Session...'
              : isChunk
              ? 'Module Update Available'
              : 'Something went wrong'}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-normal text-center max-w-md leading-relaxed">
            {this.state.isAutoReloading
              ? 'Refreshing with latest secure modules...'
              : isChunk
              ? 'A temporary network lag interrupted loading. Click below to continue seamlessly.'
              : 'An unexpected transition error occurred. Please click below to resume.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#162D4A] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer active:scale-[0.98]"
            >
              <RefreshCcw size={14} className={this.state.isAutoReloading ? 'animate-spin' : ''} />
              Reload Page
            </button>
            <button
              onClick={this.handleGoDashboard}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C9A227] text-[#0B1F3A] font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer active:scale-[0.98]"
            >
              <Home size={14} />
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
