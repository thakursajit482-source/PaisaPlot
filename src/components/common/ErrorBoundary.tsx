import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { GlassCard } from './GlassmorphismCard';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PaisaPilot ErrorBoundary] Caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center p-4 sm:p-6"
        >
          <GlassCard
            variant="elevated"
            glow="rose"
            className="w-full max-w-lg p-6 sm:p-8 space-y-6 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 mx-auto flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
                Application Rendering Interruption
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                PaisaPilot encountered an unexpected rendering error. Your financial state in local
                storage is preserved and has not been corrupted.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-navy-950/80 rounded-xl border border-white/[0.08] text-left text-xs font-mono text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.message || 'Unknown runtime exception'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-lime text-navy-950 hover:bg-brand-lime-dim transition-all flex items-center justify-center gap-2 cursor-pointer shadow-glow-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-white/[0.05] text-slate-200 hover:bg-white/[0.1] border border-white/[0.08] transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime"
              >
                <Home className="w-4 h-4" />
                <span>Dismiss & Recover</span>
              </button>
            </div>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}
