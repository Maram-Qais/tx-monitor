import React from "react";

type Props = {
  children: React.ReactNode;
  /** When this value changes, the boundary auto-resets (useful for route changes). */
  resetKey?: string;
};

type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && this.props.resetKey !== prevProps.resetKey) {
      this.setState({ error: null });
    }
  }

  private reset = () => this.setState({ error: null });

  private goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/monitor";
  };

  render() {
    if (!this.state.error) return this.props.children;

    const devMessage = this.state.error.message || "Unknown error";
    const message = import.meta.env.DEV
      ? devMessage
      : "Something unexpected happened. Please try again.";

    return (
      <div className="min-h-[70vh] px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-10">
            <div className="flex items-start gap-4">
              {/* icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                <span className="text-xl">!</span>
              </div>

              <div className="flex-1">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl">
                  Something went wrong
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                  {message}
                </p>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={this.goBack}
                    className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    ← Back
                  </button>

                  <button
                    type="button"
                    onClick={this.reset}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    Try again
                  </button>

                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    Reload
                  </button>
                </div>

                {import.meta.env.DEV ? (
                  <div className="mt-6">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Debug
                    </div>
                    <pre className="max-h-64 overflow-auto rounded-xl bg-slate-50 p-4 text-xs text-slate-800 dark:bg-slate-900 dark:text-slate-100">
                      {String(this.state.error.stack ?? "")}
                    </pre>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
            If this keeps happening, refresh and try again.
          </div>
        </div>
      </div>
    );
  }
}
