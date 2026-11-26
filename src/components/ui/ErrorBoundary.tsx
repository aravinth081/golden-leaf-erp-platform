// ──────────────────────────────────────────────────
// Golden Leaf Finance — Error Boundary Component
// ──────────────────────────────────────────────────

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { clearLazyModuleCache, isModuleLoadError } from '../../utils/lazyWithRetry';
import { useAuthStore } from '../../store';
import { getRoleLandingPath } from '../../types';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  resetKey?: string;
  onNavigateDashboard?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isAutoReloading: boolean;
  retryEpoch: number;
}

const CHUNK_SYNC_STORAGE_KEY = 'glf_chunk_sync_ts';
const CHUNK_SYNC_COOLDOWN_MS = 30000;

export class ErrorBoundary extends Component<Props, State> {
  private reloadTimeoutId: any = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isAutoReloading: false, retryEpoch: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, isAutoReloading: false };
  }

  componentDidUpdate(prevProps: Props): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      clearLazyModuleCache();
      this.setState((prev) => ({
        hasError: false,
        error: null,
        isAutoReloading: false,
        retryEpoch: prev.retryEpoch + 1,
      }));
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);

    if (isModuleLoadError(error)) {
      clearLazyModuleCache();

      // Automatically reload page once if chunk is outdated due to new deployment
      try {
        const lastSync = Number(sessionStorage.getItem(CHUNK_SYNC_STORAGE_KEY) || '0');
        const now = Date.now();
        if (now - lastSync > CHUNK_SYNC_COOLDOWN_MS) {
          sessionStorage.setItem(CHUNK_SYNC_STORAGE_KEY, String(now));
          this.setState({ isAutoReloading: true });
          this.reloadTimeoutId = setTimeout(() => {
            window.location.reload();
          }, 400);
        }
      } catch {}
    }
  }

  componentWillUnmount(): void {
    if (this.reloadTimeoutId) {
      clearTimeout(this.reloadTimeoutId);
    }
  }

  handleRetry = (): void => {
    clearLazyModuleCache();
    this.setState((prev) => ({
      hasError: false,
      error: null,
      isAutoReloading: false,
      retryEpoch: prev.retryEpoch + 1,
    }));
  };

  handleGoDashboard = (): void => {
    clearLazyModuleCache();
    const authUser = useAuthStore.getState().user;
    const target = getRoleLandingPath(authUser?.customClaims?.role);

    this.setState((prev) => ({
      hasError: false,
      error: null,
      isAutoReloading: false,
      retryEpoch: prev.retryEpoch + 1,
    }));
    if (this.props.onNavigateDashboard) {
      this.props.onNavigateDashboard();
    } else if (typeof window !== 'undefined') {
      window.history.pushState(null, '', target);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const isChunk = isModuleLoadError(this.state.error);
      const rawMessage = this.state.error?.message?.trim();

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
              ? 'Updating Application...'
              : isChunk
              ? 'Module Resource Notice'
              : 'Something went wrong'}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-normal text-center max-w-md leading-relaxed">
            {this.state.isAutoReloading
              ? 'Loading the latest dashboard modules smoothly...'
              : isChunk
              ? 'A newer version or temporary network lag interrupted loading. Click below to continue seamlessly.'
              : 'An unexpected transition error occurred. Please click below to resume.'}
          </p>
          {!isChunk && !this.state.isAutoReloading && rawMessage && (
            <p className="mt-2 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-500 max-w-md truncate">
              {rawMessage}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#162D4A] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer active:scale-[0.98]"
            >
              <RefreshCcw size={14} className={this.state.isAutoReloading ? 'animate-spin' : ''} />
              Try Again
            </button>
            <button
              type="button"
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

    return <React.Fragment key={this.state.retryEpoch}>{this.props.children}</React.Fragment>;
  }
}
