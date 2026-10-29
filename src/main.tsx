import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LASS Store Runtime Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-400 font-bold text-2xl">
              LASS
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-black font-display tracking-tight text-white">
                Something Went Wrong
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                A temporary display glitch occurred. Tap below to reload the store with the latest clothing catalog.
              </p>
              {this.state.error?.message && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-left text-[11px] font-mono text-rose-400 break-all overflow-x-auto max-h-32">
                  <strong>Error details:</strong> {this.state.error.message}
                </div>
              )}
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-orange-500/20"
              >
                Return to Shop
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors"
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

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
