import { Component, type ErrorInfo, type ReactNode } from 'react';
import { SITE_NAME } from './brand';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  declare readonly props: Readonly<Props>;
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[${SITE_NAME}]`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="min-h-screen bg-stone-100 px-6 py-16 text-stone-900">
          <div className="mx-auto max-w-lg rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-stone-500">
              {SITE_NAME}
            </p>
            <h1 className="mb-3 text-xl font-semibold tracking-tight">Something went wrong loading this page</h1>
            <p className="mb-6 text-sm leading-7 text-stone-600">
              Restart the dev server and refresh the page. If the issue persists, check the terminal for errors.
            </p>
            <pre className="mb-6 max-h-40 overflow-auto rounded-lg bg-stone-50 p-4 text-xs text-red-800">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-stone-900 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
