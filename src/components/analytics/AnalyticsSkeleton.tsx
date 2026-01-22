import Skeleton from "../ui/Skeleton";

export default function AnalyticsSkeleton() {
  return (
    <div className="p-5 space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-white p-4 dark:bg-slate-900 dark:border-slate-800"
          >
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-3 h-8 w-20" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4 dark:bg-slate-900 dark:border-slate-800">
          <Skeleton className="mb-4 h-4 w-72" />
          <Skeleton className="h-72 w-full" />
        </div>

        <div className="rounded-xl border bg-white p-4 dark:bg-slate-900 dark:border-slate-800">
          <Skeleton className="mb-4 h-4 w-40" />
          <Skeleton className="h-72 w-full" />
        </div>

        <div className="rounded-xl border bg-white p-4 dark:bg-slate-900 dark:border-slate-800 lg:col-span-2">
          <Skeleton className="mb-4 h-4 w-44" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400">
        Waiting for live data…
      </div>
    </div>
  );
}
