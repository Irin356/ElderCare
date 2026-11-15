import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application rendering failed:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main role="alert" className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-lg rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-lg">
            <h1 className="text-2xl font-black text-slate-900">Something went wrong</h1>
            <p className="mt-3 text-slate-600">
              This part of ElderCare could not be displayed. You can try loading it again.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="mt-6 rounded-xl bg-teal-700 px-5 py-3 font-bold text-white hover:bg-teal-800"
            >
              Try again
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
