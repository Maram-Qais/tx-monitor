export default function NotFoundPage() {
  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/monitor";
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 px-6 py-12 dark:bg-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-96px)] max-w-2xl items-start justify-center">
        <div className="w-full rounded-2xl border bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-12">
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-900 dark:text-slate-100">
              404
            </div>
            <div className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
              Page not found
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              The link you opened doesn’t exist.
            </p>

            <div className="mt-6">
              <button
                type="button"
                onClick={goBack}
                className="rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
